<div align="center">
  <img src="icon.png" alt="Flowee the Hub logo" width="21%" />
  <h1>Flowee the Hub</h1>
</div>

> **Upstream docs:** [codeberg.org/Flowee/thehub](https://codeberg.org/Flowee/thehub) · [flowee.org/docs/hub/](https://flowee.org/docs/hub/)
>
> Flowee the Hub is a high-performance Bitcoin Cash full node written in C++. It features fast block propagation using thin blocks, a native protobuf API, a built-in transaction indexer, and JSON-RPC for wallet and explorer connectivity.

---

## Table of Contents

1. [Image and Container Runtime](#1-image-and-container-runtime)
2. [Volume and Data Layout](#2-volume-and-data-layout)
3. [Installation and First-Run Flow](#3-installation-and-first-run-flow)
4. [Default Networking](#4-default-networking)
5. [Configuration Management](#5-configuration-management)
6. [Network Access and Interfaces](#6-network-access-and-interfaces)
7. [Actions (StartOS UI)](#7-actions-startos-ui)
8. [Backups and Restore](#8-backups-and-restore)
9. [Health Checks](#9-health-checks)
10. [Dependencies](#10-dependencies)
11. [Default Overrides](#11-default-overrides)
12. [Limitations and Differences](#12-limitations-and-differences)
13. [What Is Unchanged from Upstream](#13-what-is-unchanged-from-upstream)
14. [Contributing](#14-contributing)
15. [Quick Reference for AI Consumers](#15-quick-reference-for-ai-consumers)

---

## 1. Image and Container Runtime

| Field | Value |
|---|---|
| **Image ID** | `flowee` |
| **Build** | Docker build from `Dockerfile.binary` (builds from Codeberg `flowee-org/thehub` source) |
| **Architectures** | `x86_64`, `aarch64`, `riscv64` |
| **Primary command** | `hub -conf=/data/flowee.conf -datadir=/data -rpcport=PORT -port=PORT -apibind=0.0.0.0:1235 -use-thinblocks -min-thin-peers=2 ...` |
| **Indexer command** | `indexer -datadir=/data` (separate daemon, starts after sync completes) |

---

## 2. Volume and Data Layout

| Volume Name | Mount Point | Purpose |
|---|---|---|
| `main` | `/data` | All node data: blockchain, chainstate, indexes, configuration, credentials |

**StartOS-managed files inside `/data`:**

| File / Directory | Managed By | Purpose |
|---|---|---|
| `flowee.conf` | StartOS SDK file model | Main Flowee configuration file |
| `store.json` | StartOS SDK file model | Package state: network, credentials, reindex flag, `fullySynced` |
| `blocks/` | Flowee | Raw block data |
| `chainstate/` | Flowee | UTXO set |
| `indexes/` | Flowee | Transaction and other indexes |
| `indexer/` | Flowee `indexer` daemon | Transaction indexer database |
| `peers.dat` | Flowee | Cached peer addresses |
| `banlist.dat` | Flowee | Banned peer list |

---

## 3. Installation and First-Run Flow

1. StartOS builds the `flowee` container image from source.
2. The `nocow` oneshot runs: creates `/data`, applies NoCOW filesystem attribute (`chattr +C`), and strips any legacy `externalip=*.onion` lines from `flowee.conf` (Flowee cannot resolve onion hostnames; inbound Tor is handled via `-listenonion`).
3. The `sanitize-config` oneshot runs: removes any deprecated `apilisten=` lines from `flowee.conf`.
4. Seed files are written: `flowee.conf` and `store.json` with defaults (network: mainnet, auto-generated RPC credentials, Tor enabled, Tor isolation enabled).
5. Flowee (`hub`) launches, connecting to the BCH mainnet P2P network using thin blocks for fast propagation.
6. The native Flowee protobuf API binds to `0.0.0.0:1235`.
7. Initial Block Download (IBD) begins; the Blockchain Sync health check reports progress.
8. The `indexer` daemon starts after the Blockchain Sync health check passes, building a full transaction index.
9. After IBD completes, `store.json` is updated with `fullySynced: true`.

---

## 4. Default Networking

| Transport | Default | Inbound | How to Change |
|---|---|---|---|
| **Clearnet (IPv4/IPv6)** | Enabled — outbound only until an external IP is published | Enabled when StartOS assigns an external IP | Automatic via StartOS host discovery |
| **Tor** | Enabled (via `-proxy` and `-onion` args; `-listenonion` active) | Enabled via Tor's auto-assigned `.onion` address | Toggle in Network Configuration action; requires Tor package |
| **I2P** | Not implemented | Not available | Not available |

---

## 5. Configuration Management

| Group | Settings Covered |
|---|---|
| **Network Configuration** | Network selection: mainnet, testnet, testnet4, scalenet, chipnet, regtest — ports auto-adjust |
| **Node Settings** | Outbound and inbound connection limits, block latency, verbose logging, Tor routing toggle, Tor stream isolation |
| **RPC Peers Settings** | Whitelist of IPs / subnets permitted to connect to the RPC interface |
| **Mempool Settings** | Mempool size limit, minimum relay fee |

---

## 6. Network Access and Interfaces

| Interface | Port | Protocol | Purpose | Condition |
|---|---|---|---|---|
| RPC Interface | 8332 | HTTP (JSON-RPC) | JSON-RPC API for wallets, tools, and dependent packages | Always — mainnet |
| Peer Interface | 8333 | TCP | P2P Bitcoin Cash network connections | Always — mainnet |
| Flowee API | 1235 | TCP (protobuf) | Flowee native protobuf API for direct Hub communication | Always |
| RPC (testnet) | 18332 / 18333 | HTTP / TCP | Testnet3 RPC and P2P | When network = testnet |
| RPC (testnet4) | 28342 / 28343 | HTTP / TCP | Testnet4 RPC and P2P | When network = testnet4 |
| RPC (scalenet) | 38332 / 38333 | HTTP / TCP | Scalenet RPC and P2P | When network = scalenet |
| RPC (chipnet) | 48332 / 48333 | HTTP / TCP | Chipnet RPC and P2P | When network = chipnet |
| RPC (regtest) | 18443 / 18444 | HTTP / TCP | Regtest RPC and P2P | When network = regtest |

---

## 7. Actions (StartOS UI)

### Info

| Action ID | Name | Description |
|---|---|---|
| `runtime-info` | Node Info | Displays node version, network active status, connection count, chain, block/header counts, and sync progress via `hub-cli getnetworkinfo` / `getblockchaininfo` |

### Configuration

| Action ID | Name | Description |
|---|---|---|
| `network-config` | Network | Select BCH network (mainnet / testnet / testnet4 / scalenet / chipnet / regtest); ports auto-adjust |
| `node-settings` | Node Settings | Outbound/inbound connection limits, block latency, verbose logging, Tor toggle, Tor stream isolation |
| `rpc-peers-settings` | RPC Peers Settings | Whitelist IPs and subnets allowed to access the RPC interface |
| `mempool-settings` | Mempool Settings | Max mempool size and minimum relay fee |

### Credentials

| Action ID | Name | Description |
|---|---|---|
| `view-rpc-credentials` | View RPC Credentials | Select a stored credential by name to reveal username, password, and port |
| `generate-rpc-credential` | Generate RPC Credential | Create a new named RPC credential |
| `delete-rpc-credentials` | Delete RPC Credentials | Remove a named credential from `store.json` |

### Maintenance

| Action ID | Name | Description |
|---|---|---|
| `reindex` | Reindex Blockchain | Re-verify all blocks from genesis; `indexer` database is also rebuilt |
| `delete-peer-list` | Delete Peer List | Remove `peers.dat`; Flowee rebuilds peer discovery on next start |
| `delete-test-network-data` | Delete Test Network Data | Wipe data for the currently selected test network |
| `delete-transaction-index` | Delete Transaction Index | Remove the `indexer/` directory; rebuilt automatically on next start |

### Hidden (cross-package)

| Action ID | Name | Description |
|---|---|---|
| `autoconfig` | Auto-Configure | Called by dependent packages (Fulcrum, Explorer, ASICSeer, EloPool) to retrieve RPC credentials |

---

## 8. Backups and Restore

**What IS backed up:**
- `flowee.conf` — node configuration
- `store.json` — credentials, network selection, reindex flag, sync state
- All other files in `/data` not explicitly excluded

**What is NOT backed up:**
- `/blocks` — raw blockchain data (re-downloaded after restore)
- `/chainstate` — UTXO set (derived from blocks)
- `/indexes` — built-in Flowee indexes (rebuilt from blocks)
- `/peers.dat` — peer address cache (rebuilt on connect)
- `/banlist.dat` — ban list (reset on restore)

Restoring overwrites current configuration. Blockchain data and all indexes must be re-synced from genesis after restore.

---

## 9. Health Checks

| Check | Method | Key Messages |
|---|---|---|
| **RPC** (daemon ready) | `hub-cli getblockchaininfo` | `The Flowee RPC Interface is ready` / `The Flowee RPC Interface is not ready` |
| **Flowee API** | `nc -z 127.0.0.1 1235` — checks native protobuf API port | `Flowee Hub API is listening on port 1235` / `Flowee Hub API not yet ready` |
| **Blockchain Sync** | `hub-cli getblockchaininfo` — reads `verificationprogress`, `initialblockdownload`, `headers`/`blocks` | `Synced — block N` / `Syncing blocks...X.XX% (N/M)` |
| **Peer Connections** | `hub-cli getpeerinfo` — counts total and inbound peers | `N peers (X outbound, Y inbound)` / `No peers connected` / `Only N peer(s)` |
| **Transaction Indexer** | `pgrep -x indexer` — checks indexer process is alive | `Transaction indexer running` / `Transaction indexer starting` |
| **Tor** | Store flags + Tor IP availability | `Routing through Tor (IP) — inbound and outbound` / `Tor routing is disabled` / `Tor package not reachable` |
| **Clearnet** | `onlynet` config + `externalip` list | `Inbound and outbound connections` / `Outbound only. Publish an IP address to enable inbound.` |
| **I2P** | Static | `I2P support is not implemented yet.` (always disabled) |

---

## 10. Dependencies

### Tor (optional)

| Field | Value |
|---|---|
| **Package ID** | `tor` |
| **Version constraint** | Any |
| **Required state** | Running (optional — used only when Tor is enabled in Node Settings) |
| **Health checks** | Container IP via `sdk.getContainerIp` |
| **Mounted volumes** | None |
| **Purpose** | Provides SOCKS5 proxy at `tor.startos:9050` for Tor-routed P2P; Flowee uses `-proxy`, `-onion`, and `-listenonion` for both outbound routing and inbound `.onion` reachability. Tor stream isolation is enabled by default via `-proxyrandomize=1`. |

---

## 11. Default Overrides

| Setting | Upstream Default | StartOS Value | Reason |
|---|---|---|---|
| Thin blocks | Disabled | `-use-thinblocks -min-thin-peers=2` | Enables fast block propagation via compact/thin block announcements — Flowee's primary performance feature |
| Protobuf API bind | Loopback only | `-apibind=0.0.0.0:1235` | Binds to all interfaces so the StartOS reverse proxy can reach it |
| Filesystem attribute | Default (CoW) | NoCOW via `chattr +C` | Sequential blockchain writes cause heavy fragmentation on btrfs |
| Tor stream isolation | Disabled upstream | Enabled (`-proxyrandomize=1`) | Prevents linkage of P2P connections through the same Tor circuit |
| `externalip=*.onion` in config | Allowed | Stripped at startup | Flowee cannot resolve `.onion` hostnames at argument-parse time; inbound Tor is handled via `-listenonion` |

---

## 12. Limitations and Differences

1. Flowee uses **SPV-level validation** — it follows the canonical chain (highest cumulative proof-of-work) but does not fully re-validate every transaction's script. This makes it excellent for fast relay and block propagation but **unsuitable as the sole mining node** for block creation in a production pool.
2. The Flowee JSON-RPC interface is accessed via `hub-cli`, not `bitcoin-cli`. The RPC is broadly BCHN-compatible but some methods may differ or be absent.
3. The native **protobuf API (port 1235)** is Flowee-specific and not compatible with standard Bitcoin RPC clients. The JSON-RPC on port 8332 is the standard interface for wallets and dependent packages.
4. The `indexer` daemon starts **only after the Blockchain Sync health check passes**. Transaction lookups via `indexer` are unavailable until the node is fully synced and the indexer has caught up.
5. Supported networks include mainnet, testnet, testnet4, scalenet, chipnet, and regtest. Note that `testnet` here refers to testnet3 by Flowee's flag convention.
6. Onion external IP addresses are **not set via `externalip=` in the config file**. Flowee cannot resolve `.onion` addresses at parse time; inbound Tor reachability is handled automatically by `-listenonion` once the Tor proxy is configured.

---

## 13. What Is Unchanged from Upstream

- All Bitcoin Cash consensus rules and network protocols implemented in Flowee
- Thin block propagation protocol
- Native Flowee protobuf API format and behavior
- Transaction indexer (`indexer` daemon) functionality
- Configuration file format (`flowee.conf`)
- JSON-RPC API methods supported by `hub-cli` / Flowee Hub

---

## 14. Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 15. Quick Reference for AI Consumers

```yaml
package_id: flowee
title: Flowee the Hub
license: GPL-3.0
upstream_repo: https://codeberg.org/Flowee/thehub
package_repo: https://github.com/BitcoinCash1/flowee-the-hub-startos
image:
  id: flowee
  build: dockerfile
  source: Dockerfile.binary (builds from Codeberg flowee-org/thehub source)
architectures:
  - x86_64
  - aarch64
  - riscv64
volumes:
  - name: main
    mountpoint: /data
    purpose: blockchain data, config, credentials, transaction index
ports:
  - interface: rpc
    port: 8332
    protocol: http
    purpose: JSON-RPC API
    condition: always (mainnet)
  - interface: peer
    port: 8333
    protocol: tcp
    purpose: P2P Bitcoin Cash network
    condition: always (mainnet)
  - interface: api
    port: 1235
    protocol: tcp (protobuf)
    purpose: Flowee native protobuf API
    condition: always
networks_supported:
  mainnet:  { rpc: 8332, peer: 8333 }
  testnet:  { rpc: 18332, peer: 18333 }
  testnet4: { rpc: 28342, peer: 28343 }
  scalenet: { rpc: 38332, peer: 38333 }
  chipnet:  { rpc: 48332, peer: 48333 }
  regtest:  { rpc: 18443, peer: 18444 }
dependencies:
  tor:
    optional: true
    purpose: SOCKS5 proxy for Tor-routed P2P and .onion inbound via -listenonion
startos_managed_files:
  - /data/flowee.conf
  - /data/store.json
actions:
  - { id: runtime-info, name: "Node Info", group: Info }
  - { id: network-config, name: "Network", group: Configuration }
  - { id: node-settings, name: "Node Settings", group: Configuration }
  - { id: rpc-peers-settings, name: "RPC Peers Settings", group: Configuration }
  - { id: mempool-settings, name: "Mempool Settings", group: Configuration }
  - { id: view-rpc-credentials, name: "View RPC Credentials", group: Credentials }
  - { id: generate-rpc-credential, name: "Generate RPC Credential", group: Credentials }
  - { id: delete-rpc-credentials, name: "Delete RPC Credentials", group: Credentials }
  - { id: reindex, name: "Reindex Blockchain", group: Maintenance }
  - { id: delete-peer-list, name: "Delete Peer List", group: Maintenance }
  - { id: delete-test-network-data, name: "Delete Test Network Data", group: Maintenance }
  - { id: delete-transaction-index, name: "Delete Transaction Index", group: Maintenance }
  - { id: autoconfig, name: "Auto-Configure", group: hidden }
health_checks:
  - { id: primary, display: "RPC", method: "hub-cli getblockchaininfo" }
  - { id: flowee-api, display: "Flowee API", method: "nc -z 127.0.0.1 1235" }
  - { id: sync-progress, display: "Blockchain Sync", method: "hub-cli getblockchaininfo" }
  - { id: peer-connections, display: "Peer Connections", method: "hub-cli getpeerinfo" }
  - { id: indexer, display: "Transaction Indexer", method: "pgrep -x indexer" }
  - { id: tor, display: "Tor", method: "store flags + Tor container IP" }
  - { id: clearnet, display: "Clearnet", method: "onlynet config + externalip list" }
  - { id: i2p, display: "I2P", method: "static disabled" }
backup_volumes:
  - main
backup_excludes:
  - /blocks
  - /chainstate
  - /indexes
  - /peers.dat
  - /banlist.dat
```
