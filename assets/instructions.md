# Flowee the Hub

Flowee the Hub is a Bitcoin Cash full node and indexer written in C++. It begins its
Initial Block Download — fetching and verifying the entire BCH chain — the moment it
launches. This page covers what is specific to running it on StartOS.

## What you get on StartOS

- A **Bitcoin Cash full node** that validates and relays blocks and transactions.
- A **JSON-RPC interface** (port adjusts per network) that other StartOS services
  and external wallets connect to.
- A built-in **address and UTXO indexer** for full address history queries.
- **P2P** for peer connections and relay.
- **Tor** support — when Tor is installed, Flowee routes outbound peer connections
  through Tor.
- Multiple networks: **mainnet**, **testnet** (testnet3), **testnet4**, **scalenet**,
  **chipnet**, and **regtest**.
- Compatible with dependent StartOS services: Fulcrum BCH, BCH Explorer, ASICSeer
  pool, and EloPool.

## Getting started

There is no setup wizard — Flowee begins syncing on first launch.

Open the **Dashboard** to watch sync progress. A full Initial Block Download takes
anywhere from several hours to a few days depending on your hardware, disk, and
network speed.

Services that depend on Flowee — Fulcrum BCH, BCH Explorer, mining pools — install,
connect, and configure themselves automatically once Flowee is synced.

## RPC access

The JSON-RPC API listens on port **8332** (mainnet). Dependent StartOS services
connect and configure themselves automatically.

For an external wallet or app, run **Actions → View Credentials** to get the
auto-generated username, password, and port for your selected network.

## Configuration

Settings are available under **Config**:

- **Network** — mainnet (default), testnet (testnet3), testnet4, scalenet, chipnet,
  or regtest. Changing network switches the data directory and port set. The node
  restarts automatically.
- **Transaction Index** — enable `txindex` for arbitrary txid lookups. Required by
  BCH Explorer and services that need full tx history.
- **Mempool Settings** — mempool size, minimum relay fee, and relay policy.
- **RPC Peers** — add trusted external RPC peers.
- **Tor** — enable Tor for outbound peer connections.

## Ports

| Network  | RPC port | P2P port |
|----------|----------|----------|
| mainnet  | 8332     | 8333     |
| testnet  | 18332    | 18333    |
| testnet4 | 28342    | 28343    |
| scalenet | 38332    | 38333    |
| chipnet  | 48332    | 48333    |
| regtest  | 18443    | 18444    |

Flowee also exposes port **1235** for its Hub protocol (internal indexer access).

## Switching networks

Use **Config → Network** to change the active network. The node restarts automatically
and starts syncing the new network from scratch. Each network uses a separate data
directory — switching back to mainnet resumes from where mainnet left off.

## Tor networking

By default Flowee connects to peers over clearnet. When Tor is installed and **Tor**
is enabled in Config, Flowee routes outbound peer connections through Tor for enhanced
privacy.

For inbound onion connectivity: open **Interfaces → Peer Interface → Add Onion Service**
in StartOS. This creates a hidden service at a `.onion` address pointing to Flowee's
P2P port.

## Maintenance actions

- **View Credentials** — display the auto-generated RPC username and password.
- **Generate Credential** — create an additional named RPC credential.
- **Delete RPC Credentials** — remove one or all RPC credentials.
- **Runtime Information** — live connection count, block height, and sync status.
- **Reindex** — rebuild the address and UTXO index from stored block files.
- **Delete Transaction Index** — remove the `txindex` database (frees space; disables
  arbitrary txid lookups until re-enabled and re-indexed).
- **Delete Peer List** — clear stored peers and force fresh discovery.
- **Delete Test Network Data** — remove testnet/chipnet/regtest data while preserving
  mainnet.

## Backups and restore

Flowee's configuration and RPC credentials are included in StartOS backups. The
blockchain data and address index are **not** backed up — after a restore, Flowee
re-syncs from the network and rebuilds its index (same time as the initial pass).

## Limitations

- IBD must complete before dependent services (Fulcrum, pools) can start.
- The Flowee address index is not included in backups. After a restore, re-indexing
  takes as long as the initial index pass.
- Pruning is not currently supported.

## Support

- Package: <https://github.com/BitcoinCash1/flowee-the-hub-startos>
- Upstream: <https://codeberg.org/Flowee/thehub>
