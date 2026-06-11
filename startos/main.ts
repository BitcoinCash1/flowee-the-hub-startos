import { sdk } from './sdk'
import { rootDir, networkPorts, networkFlag, Network, GetBlockchainInfo, GetPeerInfo } from './utils'
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

  // Read credentials and network from store
  const store = await storeJson.read().once()
  const network: Network = store?.network ?? 'mainnet'
  const { rpc: rpcPort, peer: peerPort } = networkPorts[network]
  const netFlag = networkFlag[network]
  const netLabel = network === 'testnet' ? 'Testnet3' : network.charAt(0).toUpperCase() + network.slice(1)

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
    `-rpcport=${rpcPort}`,
    `-port=${peerPort}`,
    `-apibind=0.0.0.0:1235`,
    `-use-thinblocks`,
    `-min-thin-peers=2`,
    ...(netFlag ? [netFlag] : []),
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
      return { message: `Syncing blocks... ${pct}% (${netLabel})`, result: 'loading' as const }
    }

    // Flowee can occasionally report initialblockdownload=false before any meaningful chain state is present.
    if (info.blocks <= 0 || info.headers <= 0) {
      return { message: 'Waiting for first synced block', result: 'loading' as const }
    }

    if (headerLag > 2 || info.verificationprogress < minSyncedProgress) {
      return {
        message: `Syncing blocks... ${pct}% (${info.blocks}/${info.headers}) (${netLabel})`,
        result: 'loading' as const,
      }
    }

    return {
      message: `Synced — block ${info.blocks} (${netLabel})`,
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
            // Strip any legacy onion `externalip=` lines from flowee.conf.
            // Flowee's hub cannot resolve onion hostnames at argument-parse
            // time; onion reachability is handled via -listenonion through
            // the Tor proxy instead.
            await nodeSub.exec([
              'sh', '-c',
              `test -f ${rootDir}/flowee.conf && sed -i '/^externalip=.*\\.onion/d' ${rootDir}/flowee.conf || true`,
            ])
          } catch (err) {
            console.warn('nocow: unable to set NoCOW attributes; continuing startup', err)
          }
          return null
        },
      },
      requires: [],
    })
    .addOneshot('sanitize-config', {
      subcontainer: nodeSub,
      exec: {
        fn: async () => {
          const res = await nodeSub.exec([
            'sh',
            '-lc',
            `if [ -f ${rootDir}/flowee.conf ]; then sed -i '/^apilisten=/d' ${rootDir}/flowee.conf; fi`,
          ])
          if (res.exitCode !== 0) {
            console.warn('sanitize-config: failed to remove deprecated apilisten option')
          }
          return null
        },
      },
      requires: ['nocow'],
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
      requires: ['sanitize-config'],
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
          // Check process is alive
          try {
            const pg = await nodeSub.exec(['pgrep', '-x', 'indexer'])
            if (pg.exitCode !== 0) {
              return { message: 'Transaction indexer not running', result: 'starting' as const }
            }
          } catch {
            return { message: 'Transaction indexer starting', result: 'starting' as const }
          }

          // Read last meaningful log line for progress.
          // Flowee log format: "HH:MM:SS [pid] category] message" on one line,
          // then "    .mmm [pid]   actual message" on the next (milliseconds continuation).
          let indexedBlock: number | null = null
          try {
            const logRes = await nodeSub.exec([
              'sh', '-c',
              `tail -10 /root/.local/share/flowee/indexer/indexer.log 2>/dev/null | grep -v '^[[:space:]]*$' | tail -1 || true`,
            ])
            const raw = (logRes.stdout?.toString() ?? '').trim()
            // Strip all prefix variants: full timestamp, .mmm continuation, [pid], category]
            const msg = raw
              .replace(/^\d+:\d+:\d+\s+/, '')   // HH:MM:SS
              .replace(/^\s*\.\d+\s+/, '')        // .mmm continuation
              .replace(/\[\d+\]\s+/g, '')         // [pid]
              .replace(/\w+\]\s+/, '')             // category]
              .trim()
            // Extract block number from "Processing block XXXXXX"
            const m = msg.match(/block\s+(\d+)/i)
            if (m) indexedBlock = parseInt(m[1], 10)
            const lower = msg.toLowerCase()
            if (lower.includes('up-to-date') || lower.includes('fully indexed') || lower.includes('complete')) {
              return { message: 'Transaction index ready', result: 'success' as const }
            }
          } catch {}

          // Test if txindex is ready: look up block 1's coinbase transaction
          try {
            const hashRes = await rpcCall('getblockhash', 1)
            const blockHash = hashRes.stdout?.toString().trim()
            if (blockHash && blockHash.length === 64) {
              const blockRes = await rpcCall('getblock', blockHash)
              const blockOut = blockRes.stdout?.toString() ?? ''
              const txMatch = blockOut.match(/"tx"\s*:\s*\[\s*"([a-f0-9]{64})"/i)
                            ?? blockOut.match(/([a-f0-9]{64})/)
              const coinbaseTxid = txMatch?.[1]
              if (coinbaseTxid) {
                const txRes = await rpcCall('getrawtransaction', coinbaseTxid)
                const txOut = txRes.stdout?.toString() ?? ''
                if (txRes.exitCode === 0 && txOut.length > 10 && !txOut.includes('error')) {
                  return { message: 'Transaction index ready', result: 'success' as const }
                }
              }
            }
          } catch {}

          // Build progress message with percentage if we have a block number
          if (indexedBlock !== null) {
            try {
              const infoRes = await rpcCall('getblockchaininfo')
              const infoOut = infoRes.stdout?.toString() ?? ''
              const tipMatch = infoOut.match(/"blocks"\s*:\s*(\d+)/)
              const chainTip = tipMatch ? parseInt(tipMatch[1], 10) : null
              if (chainTip && chainTip > 0) {
                const pct = Math.min(100, Math.floor((indexedBlock / chainTip) * 100))
                // At 100% the index is done — no need for separate RPC test
                if (indexedBlock >= chainTip) {
                  return { message: 'Transaction index ready', result: 'success' as const }
                }
                return {
                  message: `Transaction index building — block ${indexedBlock.toLocaleString()}/${chainTip.toLocaleString()} (${pct}%)`,
                  result: 'loading' as const,
                }
              }
            } catch {}
            return {
              message: `Transaction index building — block ${indexedBlock.toLocaleString()}`,
              result: 'loading' as const,
            }
          }
          return { message: 'Transaction index building...', result: 'loading' as const }
        },
      },
      requires: ['sync-progress'],
    })
})
