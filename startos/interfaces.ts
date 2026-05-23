import { sdk } from './sdk'
import { rpcInterfaceId, peerInterfaceId, apiInterfaceId, apiPort, networkPorts, Network } from './utils'
import { storeJson } from './fileModels/store.json'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const store = await storeJson.read().once()
  const network: Network = store?.network ?? 'mainnet'
  const { rpc: rpcPort, peer: peerPort } = networkPorts[network]

  const receipts = []

  // ── RPC ──────────────────────────────────────────────────────────────────
  const rpcMulti = sdk.MultiHost.of(effects, 'rpc')
  const rpcOrigin = await rpcMulti.bindPort(rpcPort, {
    protocol: 'http',
    preferredExternalPort: rpcPort,
  })
  const rpc = sdk.createInterface(effects, {
    name: 'RPC Interface',
    id: rpcInterfaceId,
    description: 'Listens for JSON-RPC commands',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await rpcOrigin.export([rpc]))

  // ── P2P ──────────────────────────────────────────────────────────────────
  const peerMulti = sdk.MultiHost.of(effects, 'peer')
  const peerOrigin = await peerMulti.bindPort(peerPort, {
    protocol: null,
    preferredExternalPort: peerPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const peer = sdk.createInterface(effects, {
    name: 'Peer Interface',
    id: peerInterfaceId,
    description: 'Listens for incoming connections from peers on the bitcoin cash network',
    type: 'p2p',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await peerOrigin.export([peer]))

  // ── API ──────────────────────────────────────────────────────────────────
  const apiMulti = sdk.MultiHost.of(effects, 'api')
  const apiOrigin = await apiMulti.bindPort(apiPort, {
    protocol: 'http',
    preferredExternalPort: apiPort,
  })
  const api = sdk.createInterface(effects, {
    name: 'Flowee API',
    id: apiInterfaceId,
    description: 'Flowee native API for direct communication with the Hub',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await apiOrigin.export([api]))

  return receipts
})
