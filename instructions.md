# Flowee the Hub

Flowee the Hub is a Bitcoin Cash full node and indexer written in C++. It
provides fast block validation, a built-in address indexer, and an Electrum
server interface. The indexer is especially suited for wallets and explorers
that need full address history.

## What you get on StartOS

- A **Bitcoin Cash full node** that validates and relays blocks and transactions.
- A built-in **address and UTXO indexer** (the Indexer component) that can serve
  address balance and transaction history queries.
- **JSON-RPC** (port 8332) for wallet and mining software.
- **P2P** (port 8333) for peer connections and relay.
- Compatible with other StartOS services that accept a BCH full node dependency
  (BCH Explorer, Fulcrum, ASICSeer pool, EloPool).

## Getting started

1. Install Flowee the Hub.
2. Flowee will begin its Initial Block Download. IBD time depends on your hardware
   and internet connection; the full BCH chain may take several hours.
3. The **Dashboard** shows sync progress. Services that depend on the node
   (Fulcrum, pools) will not start until IBD completes.

## Configuration

All settings are available under **Config**:

- **Network** — mainnet (default), testnet3, chipnet, or regtest.
- **Transaction Index** — required by indexers and wallets that look up arbitrary txids.
- **Peers** — add or remove peer addresses.

## Ports

| Port | Protocol | Purpose              |
|------|----------|----------------------|
| 8332 | TCP      | JSON-RPC             |
| 8333 | TCP      | P2P (peer relay)     |
| 1235 | TCP      | Flowee Hub protocol  |

## RPC credentials

Flowee's RPC credentials are provisioned automatically by StartOS and shared via
the dependency volume. Services that depend on Flowee (pools, explorers) read the
credentials automatically — no manual entry is needed.

## Limitations

- IBD must complete before dependent services can start.
- The Flowee address index is not included in backups. After a restore, re-indexing
  takes the same time as the initial index pass.

## Support

- Package: <https://github.com/BitcoinCash1/flowee-startos>
- Upstream: <https://codeberg.org/Flowee/thehub>
