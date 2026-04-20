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
  await floweeConfFile.read().const(effects)

  // Read credentials from store
  const store = await storeJson.read().once()

  console.log('Starting Flowee the Hub!')

  // Read and clear reindex flag
  const reindex = store?.reindex ?? false
  if (reindex) {
    await storeJson.merge(effects, { reindex: false })
  }

  // ── Build command args ─────
  const daemonArgs: string[] = [
    `-conf=${rootDir}/flowee.conf`,
    `-datadir=${rootDir}`,
    ...(reindex ? ['-reindex'] : []),
  ]

  const nodeSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'flowee' },
    mainMounts,
    'node-sub',
  )

  // Helper: run JSON-RPC call via hub-cli (cookie auth via -datadir)
  async function rpcCall(method: string, ...params: unknown[]) {
    return nodeSub.exec([
      'hub-cli',
      `-rpcconnect=127.0.0.1`,
      `-rpcport=${rpcPort}`,
      `-datadir=${rootDir}`,
      method,
      ...params.map(String),
    ])
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
    .addHealthCheck('sync-progress', {
      ready: {
        display: 'Blockchain Sync',
        fn: async () => {
          try {
            const res = await rpcCall('getblockchaininfo')
            if (res.exitCode !== 0) return { message: 'Waiting for sync info', result: 'loading' }
            const stdout = res.stdout.toString()
            const info: GetBlockchainInfo = JSON.parse(stdout)
            if (info.initialblockdownload) {
              const pct = (info.verificationprogress * 100).toFixed(2)
              return { message: `Syncing blocks...${pct}%`, result: 'loading' }
            }
            return {
              message: `Synced — block ${info.blocks}`,
              result: 'success',
            }
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
})
