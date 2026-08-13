import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import {
  apiHostId,
  apiInterfaceId,
  apiPort,
  indexerHostId,
  indexerInterfaceId,
  indexerPort,
  networkPorts,
  peerHostId,
  peerInterfaceId,
  rpcHostId,
  rpcInterfaceId,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const network = (await storeJson.read().once())?.network ?? 'mainnet'
  const { rpc: rpcPort, peer: peerPort } = networkPorts[network]

  // RPC
  const rpcMulti = sdk.MultiHost.of(effects, rpcHostId)
  const rpcOrigin = await rpcMulti.bindPort(rpcPort, {
    protocol: 'http',
    preferredExternalPort: rpcPort,
  })
  const rpc = sdk.createInterface(effects, {
    name: i18n('RPC'),
    id: rpcInterfaceId,
    description: i18n('Listens for JSON-RPC commands'),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  // Peer
  const peerMulti = sdk.MultiHost.of(effects, peerHostId)
  const peerOrigin = await peerMulti.bindPort(peerPort, {
    protocol: null,
    preferredExternalPort: peerPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const peer = sdk.createInterface(effects, {
    name: i18n('Peer'),
    id: peerInterfaceId,
    description: i18n(
      'Listens for incoming connections from peers on the Bitcoin Cash network',
    ),
    type: 'p2p',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })

  // Flowee API — a binary protocol, not HTTP, so no scheme and no SSL wrapping.
  const apiMulti = sdk.MultiHost.of(effects, apiHostId)
  const apiOrigin = await apiMulti.bindPort(apiPort, {
    protocol: null,
    preferredExternalPort: apiPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const api = sdk.createInterface(effects, {
    name: i18n('Flowee API'),
    id: apiInterfaceId,
    description: i18n("Flowee's own binary protocol for talking to the node"),
    type: 'api',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })

  // Indexer — likewise Flowee's binary protocol.
  const indexerMulti = sdk.MultiHost.of(effects, indexerHostId)
  const indexerOrigin = await indexerMulti.bindPort(indexerPort, {
    protocol: null,
    preferredExternalPort: indexerPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const indexer = sdk.createInterface(effects, {
    name: i18n('Transaction Indexer'),
    id: indexerInterfaceId,
    description: i18n(
      'Answers transaction lookups from the index built alongside the node',
    ),
    type: 'api',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })

  return [
    await rpcOrigin.export([rpc]),
    await peerOrigin.export([peer]),
    await apiOrigin.export([api]),
    await indexerOrigin.export([indexer]),
  ]
})
