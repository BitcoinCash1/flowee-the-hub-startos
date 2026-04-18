export const short =
  'Flowee the Hub — Fast BCH validator and block relay node with SPV-level security'

export const long = `
Flowee the Hub is a Bitcoin Cash full node implementation derived from the original Satoshi codebase.
It provides the full suite of P2P, RPC, REST, and indexer capabilities for the BCH network.

## Key Features

- **Fast Block Propagation**: Flowee validates at SPV level (follows canonical chain by most PoW), enabling faster block relay than fully-validating nodes
- **Full JSON-RPC Interface**: Compatible RPC API for wallets, indexers, and mining pools
- **BIP37 Bloom Support**: Supports bloom-filtered peer behavior used by lightweight/SPV client workflows
- **Built-in Indexer**: Flowee Indexer provides fast lookup of transaction data, address history, and UTXO sets
- **Scaled to 250MB Blocks**: Tested and verified for massive block sizes
- **Low Resource Usage**: Efficient C++ implementation with minimal overhead

## Mining Considerations

**⚠️ Important for Miners:**
- Flowee uses SPV-level validation — it follows the longest PoW chain but does not fully validate every transaction
- This means it **should NOT be used as the sole node for block creation** — in theory, an attacker with sufficient PoW could trick it into following an invalid chain
- However, Flowee is **excellent as a relay node** for fast block propagation. Miners can deploy Flowee nodes at geographically diverse locations to help their blocks propagate faster across the network
- For block creation, use BCHN (fully validating) as your primary mining node, with Flowee as a supplementary relay

## Architecture

Flowee uses its own UTXO database format (not compatible with BCHN's chainstate). A full sync from genesis is required.
The blockchain data directory uses a no-SQL database design optimized for fast random access to historical transaction data.
`.trim()
