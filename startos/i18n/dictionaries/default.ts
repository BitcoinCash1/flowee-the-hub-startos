export const DEFAULT_LANG = 'en_US'

const dict = {
  // actions/config/autoconfig.ts
  'Auto-Configure': 0,
  'Automatically configure flowee.conf for the needs of another service': 1,
  'These fields were provided by a task and cannot be edited': 2,

  // actions/config/mempoolSettings.ts
  'Mempool Settings': 3,
  'Edit mempool limits and relay fee policy': 4,
  Configuration: 5,

  // actions/config/network.ts
  Network: 6,
  'Choose which Bitcoin Cash network the node joins. Each network keeps its own chain data and its own RPC and peer ports.': 7,
  'Flowee restarts and begins syncing the chosen network from the beginning. Data for the network you are leaving is kept.': 8,
  'The network to join.': 9,
  Mainnet: 10,
  Testnet3: 11,
  Testnet4: 12,
  Scalenet: 13,
  Chipnet: 14,
  Regtest: 15,
  'Network Unchanged': 16,
  'Flowee is already on this network.': 17,
  'Network Changed': 18,
  'Flowee is restarting to join the new network.': 19,

  // actions/config/nodeSettings.ts
  'Node Settings': 20,
  'Edit block policy and the optional REST API': 21,

  // actions/config/peerSettings.ts
  'Peer & Privacy Settings': 22,
  'Edit how the node connects to peers, what it advertises about itself, and whether that traffic goes through Tor': 23,

  // actions/credentials/deleteCredentials.ts
  'Delete RPC Credentials': 24,
  'Revoke credentials so they can no longer reach the JSON-RPC interface.': 25,
  Credentials: 26,
  'There are no RPC credentials': 27,
  'Nothing Selected': 28,
  'No credentials were deleted.': 29,
  'Credentials Deleted': 30,
  'Restart Flowee to stop accepting the deleted credentials.': 31,

  // actions/credentials/dependentCredential.ts
  'Create RPC Credential For A Dependent': 32,
  'Register the username and password a dependent service will use to reach the JSON-RPC interface.': 33,
  Username: 34,
  'The name this credential logs in as.': 35,
  'Provided by the dependent service': 36,
  'Letters, numbers and underscores only.': 37,
  Password: 38,
  'The password this credential logs in with.': 39,
  'Username Already Taken': 40,
  'A credential for ${username} already exists.': 41,
  'Credential Created': 42,
  'Restart Flowee for the new credential to take effect.': 43,

  // actions/credentials/generateCredential.ts
  'Generate RPC Credential': 44,
  'Create a username and password an external wallet or explorer can use to reach the JSON-RPC interface. The password is shown once and never stored, so save it before closing the result.': 45,
  'Save this password now — only a hash of it is kept, so it cannot be shown again. Restart Flowee for the new credential to take effect.': 46,

  // actions/deletePeerList.ts
  'Delete Peer List': 47,
  'Forget every peer address the node has learned. It rediscovers peers from DNS seeds on the next start.': 48,
  'Finding peers again can take a few minutes.': 49,
  Maintenance: 50,
  'Peer List Deleted': 51,
  'Flowee will rediscover peers when it next starts.': 52,

  // actions/deleteTestNetworkData.ts
  'Delete Test Network Data': 53,
  'Reclaim the disk a test network is using. Mainnet data is never touched.': 54,
  'The chain data for the networks you pick is deleted.': 55,
  Networks: 56,
  'The test networks whose data should be deleted.': 57,
  'No data was deleted.': 58,
  'Cannot Delete The Active Network': 59,
  'Flowee is set to ${network}. Switch networks before deleting its data.': 60,
  'Test Network Data Deleted': 61,
  'Mainnet data was not touched.': 62,

  // actions/deleteTransactionIndex.ts
  'Delete Transaction Index': 63,
  'Discard the transaction index. Flowee rebuilds it from the block files the next time it starts.': 64,
  'Transaction lookups stay unavailable until the rebuild finishes, which can take several hours.': 65,
  'Transaction Index Deleted': 66,
  'Flowee will rebuild the index when it next starts.': 67,

  // actions/reindex.ts
  'Reindex Blockchain': 68,
  'Rebuild the UTXO database by re-verifying every block already on disk. Use this if the node reports a corrupt database.': 69,
  'This re-verifies the whole chain and can take many hours. Flowee restarts immediately.': 70,

  // actions/runtimeInfo.ts
  'Node Info': 71,
  'Show the running node: version, chain, peer count and sync progress': 72,
  Version: 73,
  Peers: 74,
  Chain: 75,
  Blocks: 76,
  Sync: 77,
  'The node is not answering RPC calls yet.': 78,

  // fileModels/flowee.conf.ts
  'REST API': 79,
  'Serve the read-only HTTP REST API alongside JSON-RPC. It has no authentication, so anyone who can reach the RPC interface can read blockchain data.': 80,
  'Block Size Accept Limit': 81,
  'Largest block the node will accept. Blocks above this size are rejected.': 82,
  'Route Peer Traffic Through Tor': 83,
  "Send every outbound peer connection through Tor's SOCKS proxy, so peers see Tor exit nodes instead of your IP address. Requires the Tor service, and slows down the initial sync considerably.": 84,
  'Tor Stream Isolation': 85,
  'Give each peer connection its own Tor circuit, so peers cannot correlate your connections with one another.': 86,
  'Advertise Public Address': 87,
  'Tell peers the public IPv4 and IPv6 addresses StartOS has assigned to the peer interface, so they can connect back to you. Addresses on a network you have excluded below are never advertised.': 88,
  'Allowed Networks': 89,
  'Networks the node may connect out over. Leave both selected to allow either.': 90,
  'Maximum Connections': 91,
  'Upper bound on simultaneous peer connections.': 92,
  'Add Peers': 93,
  'Peers to always stay connected to, as address or address:port.': 94,
  'Max Upload Target': 95,
  'Cap on outbound traffic per 24 hours. 0 is unlimited.': 96,
  'Max Receive Buffer': 97,
  'Per-connection receive buffer. Larger values let more data be in flight per peer.': 98,
  'Max Send Buffer': 99,
  'Per-connection send buffer.': 100,
  'Max Mempool Size': 101,
  'Memory the mempool may use before it evicts entries.': 102,
  'Minimum Relay Fee': 103,
  'Fee rate below which transactions are not relayed.': 104,
  'Mempool Expiry': 105,
  'How long an unconfirmed transaction stays in the mempool.': 106,
  'Max Orphan Transactions': 107,
  'How many transactions whose parents are still missing to hold in memory.': 108,
  'RPC Threads': 109,
  'Threads available to serve JSON-RPC requests.': 110,

  // interfaces.ts
  RPC: 111,
  'Listens for JSON-RPC commands': 112,
  Peer: 113,
  'Listens for incoming connections from peers on the Bitcoin Cash network': 114,
  'Flowee API': 115,
  "Flowee's own binary protocol for talking to the node": 116,
  'Transaction Indexer': 117,
  'Answers transaction lookups from the index built alongside the node': 118,

  // main.ts
  'Starting Flowee the Hub!': 144,
  'The Flowee RPC interface is ready': 119,
  'The Flowee RPC interface is not ready': 120,
  'The Flowee API is accepting connections': 121,
  'The Flowee API is not accepting connections': 122,
  'Blockchain Sync': 123,
  'Waiting for the node': 124,
  'Syncing blocks...${percentage}%': 125,
  'Flowee is fully synced': 126,
  'Sync Complete': 127,
  'The blockchain is fully synced.': 128,
  'Peer Connections': 129,
  'No peers connected': 130,
  '${outbound} outbound, ${inbound} inbound': 131,
  'Peer traffic is not routed through Tor': 132,
  'Tor is not installed': 133,
  'Tor is not running': 134,
  'Peer traffic is routed through Tor, one circuit per peer': 135,
  'Peer traffic is routed through Tor': 136,
  Clearnet: 137,
  'Inbound and outbound connections': 138,
  'Outbound only. Advertise a public address to enable inbound.': 139,
  'Waiting for the transaction indexer': 140,
  'Transaction index at block ${indexed}': 141,
  'Transaction index is up to date': 142,
  'Building the transaction index — block ${indexed} of ${tip}': 143,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
