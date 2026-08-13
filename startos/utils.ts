import { sdk } from './sdk'

export const rootDir = '/data'

// Host ids (the `sdk.MultiHost.of` groups) — distinct from the interface ids
// exported on them. Used for `sdk.host.getOwn` lookups.
export const rpcHostId = 'rpc'
export const peerHostId = 'peer'
export const apiHostId = 'api'
export const indexerHostId = 'indexer'

// Interface ids (the exported service interfaces on the hosts above).
export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const apiInterfaceId = 'api'
export const indexerInterfaceId = 'indexer'

/** Flowee's own binary protocol. The bundled indexer dials it to follow the chain. */
export const apiPort = 1235
/** The indexer's listener for Flowee-protocol clients (wallets, REST proxies). */
export const indexerPort = 1234

export const NETWORKS = [
  'mainnet',
  'testnet',
  'testnet4',
  'scalenet',
  'chipnet',
  'regtest',
] as const
export type Network = (typeof NETWORKS)[number]

/**
 * Same BCHN-order RPC/P2P ports per network. 2026.5.2:12 pinned every chain
 * to 8332/8333, which broke Fulcrum / Explorer / pools on chipnet (they dial
 * 48332). Dependents import `networkPorts` and pick the chain they see.
 * `rpcPort` / `peerPort` stay the mainnet pair for callers that have not
 * switched yet.
 */
export const networkPorts: Record<Network, { rpc: number; peer: number }> = {
  mainnet: { rpc: 8332, peer: 8333 },
  testnet: { rpc: 18332, peer: 18333 },
  testnet4: { rpc: 28332, peer: 28333 },
  scalenet: { rpc: 38332, peer: 38333 },
  chipnet: { rpc: 48332, peer: 48333 },
  regtest: { rpc: 18443, peer: 18444 },
}
export const rpcPort = networkPorts.mainnet.rpc
export const peerPort = networkPorts.mainnet.peer

export const networkFlag: Record<Network, string | null> = {
  mainnet: null,
  testnet: '-testnet',
  testnet4: '-testnet4',
  scalenet: '-scalenet',
  chipnet: '-chipnet',
  regtest: '-regtest',
}

/**
 * Subdirectory the hub creates under the datadir for each test network;
 * mainnet lives at the datadir root. Names come from `CBaseChainParams`.
 */
export const networkSubdir: Record<Network, string | null> = {
  mainnet: null,
  testnet: 'testnet3',
  testnet4: 'testnet4',
  scalenet: 'scalenet',
  chipnet: 'chipnet',
  regtest: 'regtest',
}

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: rootDir,
  readonly: false,
})

/** The Hub's data directory for a network — the datadir root on mainnet. */
export const networkDir = (network: Network): string =>
  networkSubdir[network] ? `${rootDir}/${networkSubdir[network]}` : rootDir

/**
 * `hub-cli` invocation against the running node. The network flag is what tells
 * it which subdirectory holds the auth cookie, so leaving it off makes every
 * call fail authorization on anything but mainnet.
 */
export const hubCliArgs = (network: Network): string[] => [
  'hub-cli',
  `-conf=${rootDir}/flowee.conf`,
  `-datadir=${rootDir}`,
  ...(networkFlag[network] ? [networkFlag[network]!] : []),
  '-rpcconnect=127.0.0.1',
  `-rpcport=${networkPorts[network].rpc}`,
]

export type GetBlockchainInfo = {
  chain: string
  blocks: number
  headers: number
  bestblockhash: string
  difficulty: number
  mediantime: number
  verificationprogress: number
  initialblockdownload: boolean
  chainwork: string
  pruned: boolean
}

export type GetPeerInfo = Array<{
  id: number
  addr: string
  subver: string
  inbound: boolean
  synced_blocks: number
}>

export type GetNetworkInfo = {
  version: number
  subversion: string
  connections: number
  networkactive: boolean
}
