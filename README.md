<p align="center">
  <img src="icon.png" alt="Flowee the Hub Logo" width="21%">
</p>

# Flowee the Hub on StartOS

> Everything not listed in this document should behave the same as upstream
> Flowee the Hub. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Flowee the Hub](https://codeberg.org/Flowee/thehub) is a Bitcoin Cash full node with a protocol of its own alongside the usual JSON-RPC. This package builds it from source and runs it together with its transaction indexer, so wallets and explorers can look up arbitrary transactions rather than only the node's own.

- **Upstream repo:** <https://codeberg.org/Flowee/thehub>
- **Wrapper repo:** <https://github.com/Start9-Community/flowee-the-hub-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Upstream Updates](#upstream-updates)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One image, **compiled from upstream source**.

| Property      | Value                               |
| ------------- | ----------------------------------- |
| Image         | Built from this repo's `Dockerfile` |
| Architectures | x86_64, aarch64                     |
| Command       | The node, and the indexer beside it |

| Subcontainer | Purpose                                               |
| ------------ | ----------------------------------------------------- |
| `flowee-sub` | Both daemons and the oneshot — the one to `attach` to |

**Upstream publishes neither binaries nor an image**, so the build downloads a source tarball. It is pinned by **both a version tag and the immutable commit that tag resolved to**, which move together — a tag alone would let the contents change underneath the pin.

A oneshot runs first, marking the data directory `nodatacow`: block files are written sequentially and rewritten in place, which fragments badly under copy-on-write. It fails harmlessly on filesystems that have no such attribute.

**The node is given a five-minute termination grace period**, because flushing on shutdown takes time and cutting it short is how a chainstate gets corrupted.

## Volume and Data Layout

One volume.

| Volume | Mount Point | Purpose                          |
| ------ | ----------- | -------------------------------- |
| `main` | `/data`     | The chain, the config, the index |

| Path          | Written by  | Holds                           |
| ------------- | ----------- | ------------------------------- |
| `blocks/`     | The node    | The block files                 |
| `unspent/`    | The node    | The UTXO set                    |
| `txindex/`    | The indexer | The transaction lookup database |
| `flowee.conf` | Actions     | The node configuration          |
| `store.json`  | Actions     | The package's own settings      |
| `.cookie`     | The node    | The per-run RPC credential      |

**Each test network gets its own subdirectory**, as the node itself arranges — mainnet lives at the root. That is why switching networks does not mix chains, and why deleting one test network's data is a contained operation.

## File Models

Two models.

| File          | Format | Modelled                | Written by |
| ------------- | ------ | ----------------------- | ---------- |
| `flowee.conf` | INI    | Yes — `FileHelper.ini`  | Actions    |
| `store.json`  | JSON   | Yes — `FileHelper.json` | Actions    |

`flowee.conf` is the node's own configuration — network, peers, mempool policy, and the RPC credentials. The store holds what is not the node's: the selected network and the Tor switches.

**Credentials are hashed `rpcauth` entries, never a plaintext user and password**, and that is load-bearing rather than merely tidier. Leaving the password unset is what makes the node write a `.cookie` file — which is how this package's own command-line calls authenticate. Writing a plaintext password would break those _and_ cap the node at a single credential.

**The advertised addresses are maintained for you**, from the interface, rather than typed in — with one hard exception described under [Dependencies](#dependencies).

## Dependencies

One, optional, and **declared only while it is in use**.

| Dependency | Required                    | Kind      | Why                     |
| ---------- | --------------------------- | --------- | ----------------------- |
| Tor        | No — only if routing via it | `running` | An outbound SOCKS proxy |

**Tor is useful here only for outbound traffic, and that is a limitation of the node rather than a choice.** The Hub predates v3 onion addresses: its address parser accepts only the old 16-character form, and a modern onion address written into its configuration fails validation and **aborts start-up**. So no onion address is ever advertised, and restricting the node to the onion network is not offered.

When the Tor proxy is switched on, the dependency appears; otherwise there is none.

## Network Access and Interfaces

Four interfaces — more than a node usually has, because Flowee speaks more than one protocol.

| Interface  | Id        | Type | Port | Description                             |
| ---------- | --------- | ---- | ---- | --------------------------------------- |
| RPC        | `rpc`     | api  | 8332 | JSON-RPC, for wallets and dependents    |
| Peer       | `peer`    | p2p  | 8333 | The Bitcoin Cash peer network           |
| Flowee API | `api`     | api  | 1235 | Flowee's own binary protocol            |
| Indexer    | `indexer` | api  | 1234 | Transaction lookups, over that protocol |

**The ports do not move when the network does.** The node would ordinarily use a different port pair per network, but only one network runs in this container at a time — so the package pins the mainnet pair for all of them. Nothing has to be re-pointed after a network switch, and the bindings never churn.

**The two Flowee-protocol interfaces are binary, not HTTP.** They carry no scheme and are not TLS-wrapped, because there is nothing HTTP-shaped to wrap.

**RPC has no interface-level gate.** Access is the node's own: the per-run cookie for anything with the volume mounted, or a hashed credential generated by an action for anything remote.

## Installation and First-Run Flow

Install writes the configuration with its defaults. There is no task and no credential to record.

The node then syncs the Bitcoin Cash chain, and **the indexer builds its database alongside** — which is a second, slower pass over the same data. Both report progress separately.

**Nothing needs configuring to get a working node.** The network, peers, mempool policy and credentials are all actions, and all optional.

## Actions

Thirteen actions, of which two are hidden.

### Configuration

#### Network

Chooses which chain the node runs on. Each has its own directory, so switching does not destroy the other's data.

#### Node Settings, Peer Settings, Mempool Settings

The node's own knobs, split by subject.

- **Cost:** the service restarts — the node reads its configuration only at start.

### Credentials

#### Generate RPC Credential

Creates a username and a randomly generated password for remote RPC, storing only the hash.

- **The password is shown once.** Only its hash is persisted, so it cannot be recovered — generate a new one instead.

#### Delete RPC Credentials

Removes previously generated credentials.

### Maintenance

#### Reindex

Rebuilds the node's indexes from the block files. Hours of work.

#### Delete Transaction Index

Removes the indexer's database so it is rebuilt.

#### Delete Peer List

Discards the known-peers database; the node rediscovers peers.

#### Delete Test Network Data

Removes a test network's directory. **Contained by design** — mainnet lives elsewhere on the volume and is untouched.

### Information

#### Runtime Information

Reports the node's chain, peers and version.

### Hidden

#### Auto-Configure

Lets a dependent service write the node settings it needs, with the fields it supplies locked in the form.

#### Create Dependent Credential

**This is how other packages get RPC access**, and it exists because of the hashing: since the node stores only a hash and cannot hand a password back, a dependent generates its own credential and asks this package to register it. Several Bitcoin Cash packages here do exactly that.

## Tasks

None. This package raises no tasks, so the service is never held on a prompt and its ordinary controls are always available.

## Health Checks

Two daemon checks and five standalone ones.

| Check              | Displayed as          | Method                                          |
| ------------------ | --------------------- | ----------------------------------------------- |
| `primary`          | "RPC"                 | The node answers a chain-info call              |
| `indexer`          | "Transaction Indexer" | The indexer's own log                           |
| `flowee-api`       | "Flowee API"          | The binary protocol's port is listening         |
| `sync-progress`    | "Blockchain Sync"     | The node's own reported progress                |
| `peer-connections` | "Peer Connections"    | How many peers are connected                    |
| `tor`              | "Tor"                 | Whether the proxy is in use and available       |
| `clearnet`         | "Clearnet"            | Whether clearnet is in use, and inbound-capable |

**The RPC check makes a real call**, not a port probe, so it reports that the node is answering rather than merely listening.

**The indexer's check reads its log, because it has no other output.** It reports progress nowhere else — it logs the height it resumed from when it connects to the node, then each block as it replays. The check parses those lines to report a height.

The Tor and Clearnet checks are status displays: they say which networks are in use and whether the node can accept inbound connections, rather than failing.

## Backups and Restore

The `main` volume is copied, with everything rebuildable excluded — `sdk.Backups.ofVolumes('main').setOptions({ exclude })`.

**The chain, the UTXO set and the transaction index are all excluded**, along with the peer and ban lists, the log, the lock and PID files, and the per-run cookie. That is the entire multi-gigabyte bulk of the volume, and every part of it re-derives from the network or from the block files.

**The exclusions are deliberately unanchored**, so they match inside a test network's subdirectory as well as at the root.

What the backup keeps is what the network cannot give back: the configuration and the generated RPC credentials.

**A restored node re-syncs from scratch, and re-indexes after that** — two passes, not one. It comes back with the same settings and the same credentials.

## Limitations and Differences

1. **The chain and the index are not backed up.** A restore re-syncs and then re-indexes.
2. **Tor is outbound-only.** The node predates v3 onion addresses and refuses to start if one is written into its configuration.
3. **One network at a time**, though each keeps its own directory.
4. **A generated RPC password is shown once** and only its hash is kept.
5. **Dependents must register their own credential**, since none can be read back out.
6. **The node's ports are pinned to the mainnet pair on every network**, deliberately.
7. **The indexer is a second full pass** over the chain, and it reports only through its log.
8. **Built from a source tarball**, pinned by tag and commit; there is no upstream image to fall back on.

---

## Upstream Updates

`check-upstream.yml` looks for a new Flowee the Hub tag on Codeberg daily. When one appears, `scripts/auto-bump.sh` resolves it to its immutable commit, sets `VERSION` and `COMMIT` in the manifest's `buildArgs`, sets `startos/versions/current.ts` to `<upstream>:0` (the month's leading zero dropped, so `2026.08.0` becomes `2026.8.0`), resets `ALLOW_DOWNGRADE` to `false`, commits the bump straight to `master`, and the workflow dispatches Tag and Release, which builds and publishes the new version. Package-only fixes bump the revision after the colon by hand.

## Quick Reference for AI Consumers

```yaml
package_id: flowee # note: the repo is flowee-the-hub-startos
image: built from ./Dockerfile # compiled from a Codeberg tarball, pinned by VERSION + COMMIT
architectures:
  - x86_64
  - aarch64
subcontainers:
  - flowee-sub # both daemons and the nocow oneshot
volumes:
  main: /data # test networks live in their own subdirectories; mainnet at the root
file_models:
  - flowee.conf # the node's own config; credentials are hashed rpcauth entries only
  - store.json # network selection and the Tor switches
startos_managed_env_vars: [] # configuration is flowee.conf plus computed CLI args
dependencies:
  - tor # optional, kind: running, only while the SOCKS proxy is enabled
interfaces:
  rpc: { type: api, port: 8332 } # cookie auth, or a hashed rpcauth entry
  peer: { type: p2p, port: 8333 }
  api: { type: api, port: 1235 } # Flowee's binary protocol — no scheme, no TLS
  indexer: { type: api, port: 1234 } # the indexer's own listener
actions:
  - network
  - node-settings
  - peer-settings
  - mempool-settings
  - generate-rpc-credential
  - delete-rpc-credentials
  - reindex
  - delete-transaction-index
  - delete-peer-list
  - delete-test-network-data
  - runtime-info
  - autoconfig # hidden; for dependent services
  - create-dependent-credential # hidden; how dependents register RPC access
tasks: []
health_checks:
  - primary # "RPC"; makes a real getblockchaininfo call
  - indexer # "Transaction Indexer"; parses its log, its only progress output
  - flowee-api # "Flowee API"
  - sync-progress # "Blockchain Sync"
  - peer-connections # "Peer Connections"
  - tor # status display
  - clearnet # status display
```
