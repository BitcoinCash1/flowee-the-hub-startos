export const rootDir = '/data'

// ── Interface IDs ─────────────────────────────────────────────────────────────
export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const apiInterfaceId = 'api'

// ── Ports ─────────────────────────────────────────────────────────────────────
export const rpcPort = 8332
export const peerPort = 8333
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
