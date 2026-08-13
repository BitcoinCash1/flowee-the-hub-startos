import { socksHostId, socksPort } from 'tor-startos/startos/utils'
import { floweeConfFile } from './fileModels/flowee.conf'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  apiPort,
  GetBlockchainInfo,
  GetPeerInfo,
  hubCliArgs,
  mainMounts,
  networkDir,
  networkFlag,
  networkPorts,
  rootDir,
} from './utils'

/**
 * Where `FloweeServiceApplication` puts the indexer's log — Qt's
 * `AppDataLocation` for organization "flowee", application "indexer".
 */
const indexerLog = '/root/.local/share/flowee/indexer/indexer.log'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Flowee the Hub!'))

  // Watched, so changing any of these restarts the node with new arguments.
  // Deliberately narrow: `reindex` and `fullySynced` are written from inside
  // this function, and watching them would restart the service in a loop.
  const settings = await storeJson
    .read((s) => ({
      network: s.network,
      torProxyAll: s.torProxyAll,
      torIsolation: s.torIsolation,
    }))
    .const(effects)
  if (!settings) throw new Error('No store')
  const { network, torProxyAll, torIsolation } = settings

  const flags = await storeJson
    .read((s) => ({ reindex: s.reindex, fullySynced: s.fullySynced }))
    .once()
  if (!flags) throw new Error('No store')

  const conf = await floweeConfFile.read().const(effects)
  if (!conf) throw new Error('No flowee.conf')

  const netFlag = networkFlag[network]

  if (flags.reindex) await storeJson.merge(effects, { reindex: false })

  // Tor SOCKS over the bridge. With the 9050 fallback the address is stable
  // across tor install/update/uninstall, so this .const() does not restart the
  // node; an absent tor is just a refused connection.
  const torSocks = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'tor',
      hostId: socksHostId,
      internalPort: socksPort,
      fallbackPort: socksPort,
    })
    .const()

  // Tracked dynamically for the health check, so tor coming and going does not
  // restart the node.
  let torInstalled = false
  let torRunning = false
  sdk.getStatus(effects, { packageId: 'tor' }).onChange((status) => {
    torInstalled = status !== null
    torRunning = status?.desired.main === 'running'
    return { cancel: false }
  })

  const hubArgs = [
    `-conf=${rootDir}/flowee.conf`,
    `-datadir=${rootDir}`,
    `-rpcport=${networkPorts[network].rpc}`,
    `-port=${networkPorts[network].peer}`,
    `-proxyrandomize=${torIsolation ? 1 : 0}`,
    ...(torProxyAll ? [`-proxy=${torSocks}`] : []),
    ...(netFlag ? [netFlag] : []),
    ...(flags.reindex ? ['-reindex'] : []),
  ]

  const nodeSub = sdk.SubContainer.of(
    effects,
    { imageId: 'flowee' },
    mainMounts,
    'flowee-sub',
  )

  const rpcCall = (method: string, ...params: string[]) =>
    nodeSub.exec([...hubCliArgs(network), method, ...params])

  const getBlockchainInfo = async (): Promise<GetBlockchainInfo | null> => {
    const res = await rpcCall('getblockchaininfo')
    if (res.exitCode !== 0) return null
    try {
      return JSON.parse(res.stdout.toString())
    } catch {
      return null
    }
  }

  const externalip = conf.raw?.externalip ?? []

  /**
   * ======================== Daemons ========================
   */

  return sdk.Daemons.of(effects)
    .addOneshot('nocow', {
      subcontainer: nodeSub,
      exec: {
        // Blockchain files are written sequentially and rewritten in place,
        // which fragments badly under btrfs copy-on-write. chattr fails
        // harmlessly on filesystems that have no such attribute.
        command: ['sh', '-c', `chattr -R +C ${rootDir} 2>/dev/null || true`],
      },
      requires: [],
    })
    .addDaemon('primary', {
      subcontainer: nodeSub,
      exec: {
        command: ['hub', ...hubArgs],
        sigtermTimeout: 300_000,
      },
      ready: {
        display: 'RPC',
        fn: async () =>
          (await getBlockchainInfo())
            ? {
                message: i18n('The Flowee RPC interface is ready'),
                result: 'success',
              }
            : {
                message: i18n('The Flowee RPC interface is not ready'),
                result: 'starting',
              },
      },
      requires: ['nocow'],
    })
    .addHealthCheck('flowee-api', {
      ready: {
        display: i18n('Flowee API'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, apiPort, {
            successMessage: i18n('The Flowee API is accepting connections'),
            errorMessage: i18n('The Flowee API is not accepting connections'),
          }),
      },
      requires: ['primary'],
    })
    .addHealthCheck('sync-progress', {
      ready: {
        display: i18n('Blockchain Sync'),
        trigger: sdk.trigger.statusTrigger(30_000, {
          starting: 5_000,
          failure: 5_000,
        }),
        fn: async () => {
          const info = await getBlockchainInfo()
          if (!info)
            return { message: i18n('Waiting for the node'), result: 'starting' }

          const percentage = (info.verificationprogress * 100).toFixed(2)

          // The hub reports initialblockdownload purely as "the header chain is
          // more than 1000 blocks ahead", so it clears well before the last
          // blocks land — and before any block has landed at all on a fresh
          // datadir. Hold "syncing" until the chain has actually caught up.
          // Do not gate on verificationprogress: at the tip that number
          // briefly dips below 0.9999 and StartOS then restarts indexer /
          // synced-true. Trust IBD + header lag, same as BCHN.
          if (
            info.initialblockdownload ||
            info.blocks <= 0 ||
            info.headers - info.blocks > 2
          ) {
            return {
              message: i18n('Syncing blocks...${percentage}%', { percentage }),
              result: 'loading',
            }
          }

          return {
            message: i18n('Flowee is fully synced'),
            result: 'success',
          }
        },
      },
      requires: ['primary'],
    })
    .addOneshot('synced-true', {
      subcontainer: null,
      exec: {
        fn: async () => {
          if (!flags.fullySynced) {
            await sdk.notification.create(effects, {
              level: 'success',
              title: i18n('Sync Complete'),
              message: i18n('The blockchain is fully synced.'),
            })
            await storeJson.merge(effects, { fullySynced: true })
            // Keep the in-memory copy honest so a sync-progress dip and
            // recovery within this run does not re-fire the notification.
            flags.fullySynced = true
          }
          return null
        },
      },
      requires: ['sync-progress'],
    })
    .addHealthCheck('peer-connections', {
      ready: {
        display: i18n('Peer Connections'),
        fn: async () => {
          const res = await rpcCall('getpeerinfo')
          if (res.exitCode !== 0)
            return { message: i18n('Waiting for the node'), result: 'starting' }

          let peers: GetPeerInfo
          try {
            peers = JSON.parse(res.stdout.toString())
          } catch {
            return { message: i18n('Waiting for the node'), result: 'starting' }
          }

          if (peers.length === 0)
            return { message: i18n('No peers connected'), result: 'loading' }

          const inbound = peers.filter((p) => p.inbound).length
          return {
            message: i18n('${outbound} outbound, ${inbound} inbound', {
              outbound: String(peers.length - inbound),
              inbound: String(inbound),
            }),
            result: peers.length < 3 ? 'loading' : 'success',
          }
        },
      },
      requires: ['primary'],
    })
    .addHealthCheck('tor', {
      ready: {
        display: 'Tor',
        fn: () => {
          if (!torProxyAll)
            return {
              result: 'disabled',
              message: i18n('Peer traffic is not routed through Tor'),
            }
          if (!torInstalled)
            return { result: 'failure', message: i18n('Tor is not installed') }
          if (!torRunning)
            return { result: 'failure', message: i18n('Tor is not running') }
          return {
            result: 'success',
            message: torIsolation
              ? i18n('Peer traffic is routed through Tor, one circuit per peer')
              : i18n('Peer traffic is routed through Tor'),
          }
        },
      },
      requires: [],
    })
    .addHealthCheck('clearnet', {
      ready: {
        display: i18n('Clearnet'),
        fn: () => ({
          result: 'success',
          message: externalip.some((ip) => !!ip)
            ? i18n('Inbound and outbound connections')
            : i18n(
                'Outbound only. Advertise a public address to enable inbound.',
              ),
        }),
      },
      requires: [],
    })
    .addDaemon('indexer', {
      subcontainer: nodeSub,
      exec: {
        // Two dashes: the indexer parses its arguments with Qt, which reads
        // `-datadir=X` as the short option `-d` with the value `atadir=X` and
        // silently indexes into a relative path outside the volume. It also has
        // no notion of networks, so it is pointed at the Hub's directory for the
        // active one rather than replaying every chain into one index.
        command: ['indexer', `--datadir=${networkDir(network)}`],
        sigtermTimeout: 30_000,
      },
      ready: {
        display: i18n('Transaction Indexer'),
        trigger: sdk.trigger.statusTrigger(30_000, {
          starting: 5_000,
          failure: 5_000,
        }),
        fn: async () => {
          // The indexer reports progress only to its log file: it logs the
          // height it resumed from on connecting to the hub, then each block it
          // replays.
          const res = await nodeSub.exec([
            'sh',
            '-c',
            `tail -50 ${indexerLog} 2>/dev/null || true`,
          ])
          const lines = res.stdout.toString().split('\n')

          let indexed: number | null = null
          for (const line of lines) {
            const progress = line.match(/Processing block\s+(\d+)/i)
            if (progress) indexed = Number(progress[1])
            const resumed = line.match(/TxDB:\s*(\d+)/i)
            if (resumed && indexed === null) indexed = Number(resumed[1])
          }

          if (indexed === null)
            return {
              message: i18n('Waiting for the transaction indexer'),
              result: 'starting',
            }

          const tip = (await getBlockchainInfo())?.blocks
          if (!tip)
            return {
              message: i18n('Transaction index at block ${indexed}', {
                indexed: indexed.toLocaleString(),
              }),
              result: 'loading',
            }

          if (indexed >= tip)
            return {
              message: i18n('Transaction index is up to date'),
              result: 'success',
            }

          return {
            message: i18n(
              'Building the transaction index — block ${indexed} of ${tip}',
              { indexed: indexed.toLocaleString(), tip: tip.toLocaleString() },
            ),
            result: 'loading',
          }
        },
      },
      requires: ['primary'],
    })
})
