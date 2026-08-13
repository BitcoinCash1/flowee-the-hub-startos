<p align="center">
  <img src="icon.png" alt="Flowee the Hub Logo" width="21%" />
</p>

# Flowee the Hub on StartOS

> **Upstream docs:** <https://flowee.org/docs/hub/> · <https://codeberg.org/Flowee/thehub>
>
> Everything not listed in this document should behave the same as upstream Flowee the Hub. If a
> feature, setting, or behavior is not mentioned here, the upstream documentation is accurate and
> fully applicable.

Flowee the Hub is a headless Bitcoin Cash full node derived from the original Satoshi codebase. It
relays blocks with thin-block compression, serves JSON-RPC, and speaks Flowee's own binary
protocol. The package also runs the `indexer` daemon that ships with the Hub, which builds a
transaction lookup database alongside the chain.

---

## Table of Contents

1. [Image and Container Runtime](#image-and-container-runtime)
2. [Volume and Data Layout](#volume-and-data-layout)
3. [Installation and First-Run Flow](#installation-and-first-run-flow)
4. [Configuration Management](#configuration-management)
5. [Network Access and Interfaces](#network-access-and-interfaces)
6. [Actions (StartOS UI)](#actions-startos-ui)
7. [Backups and Restore](#backups-and-restore)
8. [Health Checks](#health-checks)
9. [Dependencies](#dependencies)
10. [Limitations and Differences](#limitations-and-differences)
11. [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
12. [Contributing](#contributing)
13. [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Field             | Value                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Image ID**      | `flowee`                                                                                                |
| **Source**        | Custom `Dockerfile` — a builder stage compiles `hub`, `hub-cli` and `indexer` from the upstream tarball |
| **Upstream pin**  | `VERSION` (tag) and `COMMIT` (immutable archive) build args in the manifest; `COMMIT` is authoritative  |
| **Architectures** | `x86_64`, `aarch64`                                                                                     |
| **Entrypoint**    | Replaced — the package runs `hub` and `indexer` as two daemons in one subcontainer                      |

Upstream publishes neither release binaries nor a container image, so the package builds them. The
builder stage needs OpenSSL, libevent, miniupnpc, Boost and Qt 6; the runtime stage carries only
the shared libraries those produce, plus `e2fsprogs` for `chattr`.

## Volume and Data Layout

| Volume | Mount point | Purpose                                              |
| ------ | ----------- | ---------------------------------------------------- |
| `main` | `/data`     | Chain data, the transaction index, and configuration |

Inside `/data`:

| Path                       | Written by      | Purpose                                                                |
| -------------------------- | --------------- | ---------------------------------------------------------------------- |
| `flowee.conf`              | StartOS         | The Hub's configuration, generated from the configuration actions      |
| `store.json`               | StartOS         | Package state: selected network, privacy toggles, reindex flag         |
| `.cookie`                  | Hub             | Auth token the package's own `hub-cli` calls use                        |
| `blocks/`                  | Hub             | Raw block files and the block index                                    |
| `unspent/`                 | Hub             | The UTXO database — Flowee's own format, not interchangeable with BCHN |
| `txindex/`                 | Indexer         | The transaction lookup database                                        |
| `peers.dat`, `banlist.dat` | Hub             | Peer address cache and ban list                                        |
| `hub.log`                  | Hub             | Node log                                                               |
| `testnet3/`, `chipnet/`, … | Hub             | One subdirectory per test network, with the same layout                |

The `nocow` oneshot marks `/data` copy-on-write-exempt (`chattr +C`) before the node starts, since
block files are rewritten in place and fragment badly under btrfs. It is a no-op on filesystems
without the attribute.

## Installation and First-Run Flow

1. StartOS builds the image, compiling the Hub from source.
2. Init seeds `flowee.conf` and `store.json` with their defaults: mainnet, REST off, Tor off, no
   advertised address.
3. `hub` starts and begins its initial block download. It has no setup wizard and no credential to
   set — the node is usable as soon as it answers RPC.
4. `indexer` starts alongside it and follows the chain, building the transaction index as blocks
   land rather than waiting for the sync to finish.
5. When the chain catches up, the package posts a "Sync Complete" notification.

## Configuration Management

| StartOS-managed                                                                                                                             | Upstream-managed                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Everything reachable through the actions below, plus the enforced values: `server`, `listen`, `rpcbind`, `rpcallowip`, `apibind`, thin blocks | Any key you add to `flowee.conf` that the package does not own |

`flowee.conf` is a file model: the package rewrites the keys it owns on every change and leaves
every other key in place, so hand-added settings survive. The network selection, the RPC and peer
ports, and the reindex flag are passed as daemon arguments rather than written to the file, so one
data directory can hold several networks.

## Network Access and Interfaces

| Interface           | Container port | Protocol        | Purpose                                                        |
| ------------------- | -------------- | --------------- | -------------------------------------------------------------- |
| RPC                 | per network    | HTTP (JSON-RPC) | Wallets, explorers and dependent services (chipnet 48332)      |
| Peer                | per network    | TCP             | Bitcoin Cash peer-to-peer (chipnet 48333)                      |
| Flowee API          | 1235           | TCP (binary)    | Flowee's own protocol; the indexer follows the chain through it |
| Transaction Indexer | 1234           | TCP (binary)    | Transaction and address lookups against the built index         |

RPC and P2P follow the same per-network ports as Bitcoin Cash Node (mainnet 8332/8333, chipnet
48332/48333, …). Dependents read `networkPorts` from this package and the node store's
`network` field. Switching network rebinds those two ports.

## Actions (StartOS UI)

| Action                                    | Group         | Availability | Purpose                                                                             |
| ----------------------------------------- | ------------- | ------------ | ----------------------------------------------------------------------------------- |
| Node Info                                 | —             | Running      | Version, chain, peer count and sync progress, read over RPC                         |
| Network                                   | Configuration | Any          | Choose the network; restarts the node                                               |
| Node Settings                             | Configuration | Any          | Block size accept limit and the optional REST API                                   |
| Peer & Privacy Settings                   | Configuration | Any          | Allowed networks, connection limits, buffers, address advertisement, Tor proxying   |
| Mempool Settings                          | Configuration | Any          | Mempool size and expiry, relay fee, orphan retention                                |
| Generate RPC Credential                   | Credentials   | Any          | Creates an `rpcauth` entry and returns the password once                            |
| Delete RPC Credentials                    | Credentials   | Any          | Revokes selected `rpcauth` entries; disabled when there are none                    |
| Reindex Blockchain                        | Maintenance   | Any          | Rebuilds the UTXO database from the stored blocks and restarts                      |
| Delete Peer List                          | Maintenance   | Stopped      | Removes `peers.dat` on every network                                                |
| Delete Transaction Index                  | Maintenance   | Stopped      | Removes `txindex/`; rebuilt on next start                                           |
| Delete Test Network Data                  | Maintenance   | Stopped      | Removes chain data for selected test networks; refuses the active one               |
| Auto-Configure                            | hidden        | Any          | Applies configuration a dependent service asked for via a task                       |
| Create RPC Credential For A Dependent     | hidden        | Any          | Registers an `rpcauth` entry for credentials a dependent already holds               |

### Credentials

The Hub accepts one plaintext `rpcuser`/`rpcpassword` pair but any number of hashed `rpcauth`
entries, so the package uses `rpcauth` exclusively. Two consequences:

- Only the hash is stored, so a password is shown once at creation and cannot be recovered. Losing
  it means deleting the credential and generating a new one.
- With no plaintext password set, the Hub writes a `.cookie` file, which is how the package's own
  `hub-cli` calls authenticate. This is why nothing in the package needs a stored password.

New and deleted credentials take effect when the node restarts.

## Backups and Restore

The `main` volume is backed up, minus everything that can be re-derived: `blocks/`, `unspent/`,
`txindex/`, `peers.dat`, `banlist.dat`, `hub.log`, `.lock` and `.cookie`. The patterns are
unanchored, so a test network's copies are excluded too.

What survives a restore is the configuration and the RPC credentials. The chain is re-downloaded
and the transaction index rebuilt, which takes as long as the original sync.

## Health Checks

| Check               | Method                                          | Reports                                                                    |
| ------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| RPC                 | `hub-cli getblockchaininfo`                     | Whether the node answers RPC — the readiness gate for everything else       |
| Flowee API          | Port 1235 listening                             | Whether the binary API is accepting connections                            |
| Blockchain Sync     | `hub-cli getblockchaininfo`                     | Percentage while syncing, then fully synced                                |
| Peer Connections    | `hub-cli getpeerinfo`                           | Outbound and inbound peer counts; loading below three peers                |
| Tor                 | Package status of `tor`                         | Disabled unless peer traffic is routed through Tor, then whether it is up  |
| Clearnet            | `externalip` in the config                      | Whether inbound is possible, or outbound only                              |
| Transaction Indexer | The indexer's log plus the node's chain tip      | Indexed height against the tip, or up to date                              |

The sync and indexer checks fall back to a five-second poll while starting or failing, and thirty
seconds otherwise.

## Dependencies

### Tor (optional)

| Field            | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Package id       | `tor`                                                                                   |
| Required when    | "Route Peer Traffic Through Tor" is enabled                                             |
| Required state   | Running                                                                                 |
| Mounted volumes  | None                                                                                    |
| Purpose          | SOCKS proxy for outbound peer connections, reached over the LXC bridge                  |

Tor is **only** an outbound proxy here — see Limitations. The version floor is declared in
`startos/dependencies.ts`.

## Limitations and Differences

1. **No modern onion support.** The Hub's address parser accepts only v2 onion addresses, which
   Tor removed from the network in 2021. A v3 address in `externalip` fails validation and aborts
   startup. The package therefore never advertises an onion address, does not offer
   `onlynet=onion`, and treats Tor purely as an outbound SOCKS proxy that hides the node's IP from
   peers. Inbound connectivity over Tor is not possible.
2. **No I2P.** The Hub has no I2P support at all.
3. **No pruning.** The Hub stores the full chain; there is no equivalent of `prune`.
4. **RPC credentials cannot be read back.** Only the `rpcauth` hash is kept.
5. **The two bundled binaries parse arguments differently.** `hub` uses Bitcoin's single-dash
   parser, `indexer` uses Qt's. This is invisible in normal use but matters to anyone editing the
   daemon arguments — see `AGENTS.md`.
6. **`hub-cli`, not `bitcoin-cli`.** The RPC surface is broadly Bitcoin-compatible but is not
   identical, and the Hub's `getblockchaininfo` derives `initialblockdownload` from header lag
   rather than from a sync state machine.
7. **The UTXO database is Flowee's own format.** It cannot be seeded from a BCHN chainstate; a
   fresh install syncs from genesis.

## What Is Unchanged from Upstream

- All Bitcoin Cash consensus rules and the peer-to-peer protocol
- Thin-block propagation
- The JSON-RPC surface and `hub-cli`
- Flowee's binary API and the indexer's protocol
- The `flowee.conf` format and every key the package does not set

## Contributing

See [AGENTS.md](AGENTS.md).

---

## Quick Reference for AI Consumers

```yaml
package_id: flowee
title: Flowee the Hub
license: GPL-3.0
upstream_repo: https://codeberg.org/Flowee/thehub
package_repo: https://github.com/Start9-Community/flowee-the-hub-startos
image:
  id: flowee
  source: dockerBuild
  build_args: [VERSION, COMMIT]
architectures:
  - x86_64
  - aarch64
volumes:
  main: /data
ports:
  rpc: 8332
  peer: 8333
  api: 1235
  indexer: 1234
networks: [mainnet, testnet, testnet4, scalenet, chipnet, regtest]
ports_vary_by_network: true
dependencies:
  - tor
startos_managed_files:
  - /data/flowee.conf
  - /data/store.json
rpc_auth: rpcauth entries; cookie file for in-package calls
actions:
  - runtime-info
  - network-config
  - node-settings
  - peer-settings
  - mempool-settings
  - generate-rpc-credential
  - delete-rpc-credentials
  - reindex
  - delete-peer-list
  - delete-transaction-index
  - delete-test-network-data
  - autoconfig
  - create-dependent-credential
health_checks:
  - primary
  - flowee-api
  - sync-progress
  - peer-connections
  - tor
  - clearnet
  - indexer
backup_volumes:
  - main
backup_excludes:
  - blocks/
  - unspent/
  - txindex/
  - peers.dat
  - banlist.dat
  - hub.log
  - .lock
  - .cookie
```
