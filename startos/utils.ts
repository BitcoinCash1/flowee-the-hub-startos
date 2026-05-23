export const rootDir = '/data'

// ── Interface IDs ─────────────────────────────────────────────────────────────
export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const apiInterfaceId = 'api'

// ── Network types ─────────────────────────────────────────────────────────────
export const NETWORKS = ['mainnet', 'testnet', 'testnet4', 'scalenet', 'chipnet', 'regtest'] as const
export type Network = (typeof NETWORKS)[number]

export const networkPorts: Record<Network, { rpc: number; peer: number }> = {
  mainnet:  { rpc: 8332,  peer: 8333  },
  testnet:  { rpc: 18332, peer: 18333 },
  testnet4: { rpc: 28342, peer: 28343 },
  scalenet: { rpc: 38332, peer: 38333 },
  chipnet:  { rpc: 48332, peer: 48333 },
  regtest:  { rpc: 18443, peer: 18444 },
}

export const networkFlag: Record<Network, string | null> = {
  mainnet:  null,
  testnet:  '-testnet',
  testnet4: '-testnet4',
  scalenet: '-scalenet',
  chipnet:  '-chipnet',
  regtest:  '-regtest',
}

// ── Ports (mainnet defaults, kept for backward compat) ────────────────────────
export const rpcPort = networkPorts.mainnet.rpc
export const peerPort = networkPorts.mainnet.peer
export const apiPort = 1235

// ── RPC response types ────────────────────────────────────────────────────────
export type GetBlockchainInfo = {
  blocks: number
  headers: number
  verificationprogress: number
  initialblockdownload: boolean
  pruned: boolean
  chain: string
  size_on_disk: number
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

export type GetMempoolInfo = {
  size: number
  bytes: number
  usage: number
  maxmempool: number
  mempoolminfee: number
}
