# Flowee the Hub on StartOS

> Upstream repo: [https://codeberg.org/Flowee/thehub](https://codeberg.org/Flowee/thehub)

A Bitcoin Cash full node implementation for StartOS. Flowee the Hub provides fast block propagation
and relay capabilities with SPV-level validation.

## Getting Started

To learn how to package services for StartOS, see the [Packaging Guide](https://docs.start9.com/packaging).

## Table of Contents

- Image and Container Runtime
- Volume and Data Layout
- Installation and First-Run Flow
- Configuration Management
- Network Access and Interfaces
- Actions (StartOS UI)
- Backups and Restore
- Health Checks
- Dependencies
- Mining Considerations
- Limitations and Differences
- Contributing

## Image and Container Runtime

| Property       | Value                                  |
|----------------|----------------------------------------|
| Image          | Built from source (codeberg.org/Flowee/thehub) |
| Architectures  | x86_64                                 |
| Command        | `hub`                                  |
| CLI            | `hub-cli`                              |

## Volume and Data Layout

| Volume | Mount   | Purpose         |
|--------|---------|-----------------|
| main   | `/data` | Persistent data |

## Installation and First-Run Flow

On first install, Flowee generates random RPC credentials and writes a default `flowee.conf`.
The node begins syncing the full BCH blockchain from genesis (Flowee has its own UTXO format, not compatible with BCHN).

## Configuration Management

Configuration is stored in `flowee.conf` (INI format). Editable through the StartOS Settings action:

- REST API toggle
- Maximum connections
- Manual peer list (addnode)
- Mempool size, relay fee, expiry
- Block size accept limit
- RPC thread count

## Network Access and Interfaces

| Interface   | Port | Protocol | Description                          |
|-------------|------|----------|--------------------------------------|
| RPC         | 8332 | HTTP     | JSON-RPC commands                    |
| Peer (P2P)  | 8333 | TCP      | Bitcoin Cash peer-to-peer network    |
| Flowee API  | 1235 | HTTP     | Native Flowee API                    |

## Actions (StartOS UI)

| Action              | Group        | Description                                |
|---------------------|--------------|--------------------------------------------|
| Node Info           | —            | Display version, sync status, peer count   |
| Settings            | —            | Configure node parameters                  |
| View RPC Credentials| Credentials  | Show RPC username, password, port          |
| Reindex Blockchain  | Maintenance  | Re-verify all blocks from genesis          |
| Auto-Configure      | (hidden)     | Used by dependent packages                 |

## Backups and Restore

Included in backup: `main` volume (excluding blocks, chainstate, indexes, peers.dat, banlist.dat).
Restore overwrites configuration; blockchain must be re-synced.

## Health Checks

| Check             | Display            | Description                              |
|-------------------|--------------------|------------------------------------------|
| RPC Ready         | RPC                | hub-cli getrpcinfo succeeds              |
| Blockchain Sync   | Blockchain Sync    | Progress percentage or "Synced"          |
| Peer Connections  | Peer Connections   | Number and direction of peer connections |

## Dependencies

None. Flowee is a standalone BCH node.

## Mining Considerations

**⚠️ Important for Miners:**

- Flowee uses **SPV-level validation** — it follows the longest proof-of-work chain but does not fully validate every transaction
- It **should NOT be used as the sole node for block creation** — in theory, an attacker with sufficient PoW could trick it into following an invalid chain
- Flowee is **excellent as a relay node** for fast block propagation. Deploy at geographically diverse locations to help blocks propagate faster
- For block creation, use **BCHN** (fully validating) as your primary mining node, with Flowee as a supplementary relay

## Limitations and Differences

1. SPV-level validation only (not full consensus validation)
2. Own UTXO database format — cannot share chainstate with BCHN
3. x86_64 only (no ARM builds)
4. No wallet functionality
5. No ZMQ support

## Contributing

Build locally:

```bash
# Install start-cli and npm
make x86
# Install to local StartOS
make install
```

## Quick Reference for AI Consumers

```yaml
package_id: flowee
image: built from source (codeberg.org/Flowee/thehub)
architectures: [x86_64]
volumes:
  main: /data
ports:
  rpc: 8332
  peer: 8333
  api: 1235
dependencies: none
actions: [runtime-info, settings, view-credentials, reindex, autoconfig(hidden)]
```
