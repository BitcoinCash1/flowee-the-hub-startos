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

/**
 * The Hub defaults to a different port pair per network, but only one network
 * runs in this container at a time, so the package pins the mainnet pair for
 * every network. Nothing has to be repointed after a network switch, and the
 * bindings never churn.
 */
export const rpcPort = 8332
export const peerPort = 8333
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
  `-rpcport=${rpcPort}`,
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
