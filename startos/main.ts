import { sdk } from './sdk'
import { rootDir, rpcPort, GetBlockchainInfo, GetPeerInfo } from './utils'
import { floweeConfFile } from './fileModels/flowee.conf'
import { storeJson } from './fileModels/store.json'
import { mainMounts } from './mounts'

export { mainMounts }

export const main = sdk.setupMain(async ({ effects }: { effects: any }) => {
  /**
   * ======================== Setup ========================
   */

  // Read flowee.conf (watch for changes — restarts on change)
  const conf = await floweeConfFile.read().const(effects)

  // Read credentials from store
  const store = await storeJson.read().once()

  console.log('Starting Flowee the Hub!')

  // Read and clear reindex flag
  const reindex = store?.reindex ?? false
  if (reindex) {
    await storeJson.merge(effects, { reindex: false })
  }

  const torEnabled = store?.torEnabled ?? true
  const torIsolation = store?.torIsolation ?? true

  const onlynetList: string[] = ((conf?.onlynet as string[] | undefined) ?? []).filter(Boolean)
  const onlynetActive = onlynetList.length > 0
  const onionOnly = onlynetActive && onlynetList.every((n) => n === 'onion')
  const externalip: string[] = ((conf?.externalip as string[] | undefined) ?? []).filter(Boolean)

  // Get Tor container IP (triggers restart if it changes)
  const torIp = torEnabled
    ? await sdk.getContainerIp(effects, { packageId: 'tor' }).const()
    : null

  // ── Build command args ─────
  const daemonArgs: string[] = [
    `-conf=${rootDir}/flowee.conf`,
    `-datadir=${rootDir}`,
    `-apibind=0.0.0.0:1235`,
    `-use-thinblocks`,
    `-min-thin-peers=2`,
    ...(reindex ? ['-reindex'] : []),
  ]

  if (torIp) {
    daemonArgs.push(`-proxy=${torIp}:9050`)
    daemonArgs.push(`-onion=${torIp}:9050`)
    daemonArgs.push(`-listenonion`)
    if (torIsolation) {
      daemonArgs.push(`-proxyrandomize=1`)
    }
  }

  const nodeSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'flowee' },
    mainMounts,
    'node-sub',
  )

  // Helper: run JSON-RPC call via hub-cli (reads rpcuser/rpcpassword from flowee.conf)
  async function rpcCall(method: string, ...params: unknown[]) {
    return nodeSub.exec([
      'hub-cli',
      `-conf=${rootDir}/flowee.conf`,
      `-rpcconnect=127.0.0.1`,
      `-rpcport=${rpcPort}`,
      `-datadir=${rootDir}`,
      method,
      ...params.map(String),
    ])
  }

  function getSyncHealth(info: GetBlockchainInfo) {
    const pct = (info.verificationprogress * 100).toFixed(2)
    const headerLag = Math.max(0, info.headers - info.blocks)
    const minSyncedProgress = 0.9999

    if (info.initialblockdownload) {
      return { message: `Syncing blocks...${pct}%`, result: 'loading' as const }
    }

    // Flowee can occasionally report initialblockdownload=false before any meaningful chain state is present.
    if (info.blocks <= 0 || info.headers <= 0) {
      return { message: 'Waiting for first synced block', result: 'loading' as const }
    }

    if (headerLag > 2 || info.verificationprogress < minSyncedProgress) {
      return {
        message: `Syncing blocks...${pct}% (${info.blocks}/${info.headers})`,
        result: 'loading' as const,
      }
    }

    return {
      message: `Synced — block ${info.blocks}`,
      result: 'success' as const,
    }
  }

  /**
   * ======================== Daemons ========================
   */

  return sdk.Daemons.of(effects)
    .addOneshot('nocow', {
      subcontainer: null,
      exec: {
        fn: async () => {
          try {
            const mkdirRes = await nodeSub.exec(['mkdir', '-p', rootDir])
            if (mkdirRes.exitCode !== 0) {
              console.warn(`nocow: mkdir failed for ${rootDir}; continuing without chattr`)
              return null
            }

            const chattrRes = await nodeSub.exec(['chattr', '-R', '+C', rootDir])
            if (chattrRes.exitCode !== 0) {
              console.warn(`nocow: chattr not applied for ${rootDir}; continuing startup`)
            }
          } catch (err) {
            console.warn('nocow: unable to set NoCOW attributes; continuing startup', err)
          }
          return null
        },
      },
      requires: [],
    })
    .addDaemon('primary', {
      subcontainer: nodeSub,
      exec: {
        command: ['hub', ...daemonArgs],
        sigtermTimeout: 300_000,
      },
      ready: {
        display: 'RPC',
        fn: async () => {
          try {
            const res = await rpcCall('getblockchaininfo')
            return res.exitCode === 0
              ? { message: 'The Flowee RPC Interface is ready', result: 'success' }
              : { message: 'The Flowee RPC Interface is not ready', result: 'starting' }
          } catch {
            return { message: 'The Flowee RPC Interface is not ready', result: 'starting' }
          }
        },
      },
      requires: ['nocow'],
    })
    .addHealthCheck('flowee-api', {
      ready: {
        display: 'Flowee API',
        fn: async () => {
          try {
            // Probe the native Flowee protobuf API port (apibind=0.0.0.0:1235)
            const res = await nodeSub.exec(['nc', '-z', '127.0.0.1', '1235'])
            return res.exitCode === 0
              ? { message: 'Flowee Hub API is listening on port 1235', result: 'success' }
              : { message: 'Flowee Hub API not yet ready', result: 'loading' }
          } catch {
            return { message: 'Flowee Hub API not yet ready', result: 'loading' }
          }
        },
      },
      requires: ['primary'],
    })
    .addHealthCheck('sync-progress', {
      ready: {
        display: 'Blockchain Sync',
        fn: async () => {
          try {
            const res = await rpcCall('getblockchaininfo')
            if (res.exitCode !== 0) return { message: 'Waiting for sync info', result: 'loading' }
            const stdout = res.stdout.toString()
            const info: GetBlockchainInfo = JSON.parse(stdout)
            return getSyncHealth(info)
          } catch {
            return { message: 'Waiting for sync info', result: 'loading' }
          }
        },
      },
      requires: ['primary'],
    })
    .addOneshot('synced-true', {
      subcontainer: null,
      exec: {
        fn: async () => {
          const currentStore = await storeJson.read().once()
          if (!currentStore?.fullySynced) {
            await storeJson.merge(effects, { fullySynced: true })
          }
          return null
        },
      },
      requires: ['sync-progress'],
    })
    .addHealthCheck('peer-connections', {
      ready: {
        display: 'Peer Connections',
        fn: async () => {
          try {
            const res = await rpcCall('getpeerinfo')
            if (res.exitCode !== 0) return { message: 'Unable to query peers', result: 'loading' }
            const stdout = res.stdout.toString()
            const peers: GetPeerInfo = JSON.parse(stdout)
            const count = peers.length
            if (count === 0) return { message: 'No peers connected — node may be starting up or isolated', result: 'loading' }
            if (count < 3) return { message: `Only ${count} peer(s) connected — network connectivity may be limited`, result: 'loading' }
            const inbound = peers.filter((p) => p.inbound).length
            return { message: `${count} peers (${count - inbound} outbound, ${inbound} inbound)`, result: 'success' }
          } catch {
            return { message: 'Unable to query peers', result: 'loading' }
          }
        },
      },
      requires: ['primary'],
    })
    .addHealthCheck('tor', {
      ready: {
        display: 'Tor',
        fn: async () => {
          if (!torEnabled) {
            return { message: 'Tor routing is disabled in config', result: 'disabled' }
          }
          if (!torIp) {
            return { message: 'Tor package not reachable', result: 'failure' }
          }
          if (onlynetActive && !onlynetList.includes('onion')) {
            return { message: 'Excluded by onlynet', result: 'disabled' }
          }
          const hasOnion = externalip.some((ip) => ip.includes('.onion'))
          const base = `Routing through Tor (${torIp})${torIsolation ? ' with stream isolation' : ''}`
          return {
            message: hasOnion
              ? `${base} — inbound and outbound connections`
              : `${base} — outbound only. Add an onion address to enable inbound.`,
            result: 'success',
          }
        },
      },
      requires: ['primary'],
    })
    .addHealthCheck('i2p', {
      ready: {
        display: 'I2P',
        fn: () => ({
          result: 'disabled' as const,
          message: 'I2P support is not implemented yet.',
        }),
      },
      requires: [],
    })
    .addHealthCheck('clearnet', {
      ready: {
        display: 'Clearnet',
        fn: async () => {
          if (onionOnly) {
            return { message: 'Clearnet disabled — onlynet=onion is set', result: 'disabled' }
          }
          if (onlynetActive && !onlynetList.includes('ipv4') && !onlynetList.includes('ipv6')) {
            return { message: 'Excluded by onlynet', result: 'disabled' }
          }
          const hasClearnet = externalip.some((ip) => ip && !ip.includes('.onion'))
          return {
            message: hasClearnet
              ? 'Inbound and outbound connections'
              : 'Outbound only. Publish an IP address to enable inbound.',
            result: 'success',
          }
        },
      },
      requires: ['primary'],
    })
    .addDaemon('indexer', {
      subcontainer: nodeSub,
      exec: {
        command: ['indexer', `-datadir=${rootDir}`],
        sigtermTimeout: 30_000,
      },
      ready: {
        display: 'Transaction Indexer',
        fn: async () => {
          try {
            const res = await nodeSub.exec(['pgrep', '-x', 'indexer'])
            return res.exitCode === 0
              ? { message: 'Transaction indexer running', result: 'success' }
              : { message: 'Transaction indexer starting', result: 'starting' }
          } catch {
            return { message: 'Transaction indexer starting', result: 'starting' }
          }
        },
      },
      requires: ['sync-progress'],
    })
})
