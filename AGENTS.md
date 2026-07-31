# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent to the constructs, the
reference pages, and a named production package to copy. Find the recipe before you read this
package's neighbours: a package you reach by grepping may be non-conformant, and the recipe
outranks it.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers
and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `flowee`.** Flowee the Hub — a Bitcoin Cash full node — plus the `indexer`
  daemon that builds a transaction lookup database beside it. One `main` volume at `/data`, four
  interfaces (JSON-RPC, P2P, Flowee's binary API, the indexer), optional Tor.
- **Upstream ships no binaries and no image, so the Dockerfile compiles the Hub.** It downloads
  the Codeberg tarball for the commit pinned in `startos/manifest/index.ts` `buildArgs`. Bumping
  the version means bumping both `VERSION` and `COMMIT` — see `UPDATING.md`.

## Gotchas that have bitten this package

- **The `indexer` binary parses its arguments with Qt, the Hub with Bitcoin's own parser.** Qt
  reads `-datadir=/data` as the short option `-d` carrying the value `atadir=/data`, and then
  indexes into that relative path — outside the volume, so the index is silently lost on every
  restart. The indexer needs `--datadir=`; the Hub needs `-datadir=`. Do not "normalize" them.
- **The Hub predates v3 onion addresses.** `CNetAddr::SetSpecial` accepts only the 16-character
  v2 form, and a v3 address in `externalip` fails `IsValid()`, which aborts startup. Never write
  an onion address into the config, and do not offer `onlynet=onion` — Tor is usable here only as
  an outbound SOCKS proxy.
- **Credentials are `rpcauth` entries, never `rpcuser`/`rpcpassword`.** Leaving the password
  unset is what makes the Hub write `.cookie`, which is how the package's own `hub-cli` calls
  authenticate. Writing a plaintext password would break that and cap the node at one credential.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use
`start-cli package attach flowee -n flowee-sub -- <cmd>`. Select the subcontainer by **name** with
`-n` (the name passed to `SubContainer.of` in `main.ts` — here `flowee-sub`) or by image with `-i`.
Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s`
fails with "no matching subcontainers".
