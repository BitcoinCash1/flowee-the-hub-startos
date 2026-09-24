# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **The `indexer` binary parses its arguments with Qt, the Hub with Bitcoin's own parser.** Qt reads `-datadir=/data` as the short option `-d` carrying the value `atadir=/data`, and then indexes into that relative path — outside the volume, so the index is silently lost on every restart. The indexer needs `--datadir=`; the Hub needs `-datadir=`. Do not "normalize" them. The indexer also has no notion of networks, so it is pointed at the Hub's directory for the active one rather than replaying every chain into one index.
- **The Hub predates v3 onion addresses.** `CNetAddr::SetSpecial` accepts only the 16-character v2 form, and a v3 address in `externalip` fails `IsValid()`, which aborts startup. Never write an onion address into the config, and do not offer `onlynet=onion` — Tor is usable here only as an outbound SOCKS proxy.
- **Credentials are `rpcauth` entries, never `rpcuser`/`rpcpassword`.** Leaving the password unset is what makes the Hub write `.cookie`, which is how the package's own `hub-cli` calls authenticate. Writing a plaintext password would break that and cap the node at one credential.
- **`create-dependent-credential` is a dependent-facing API.** Because the Hub stores only a hash and can never hand a password back, dependents (bch-asicseer, bch-elopool, bch-explorer) mint their own and call this action to register it. Keep its id and input shape stable, and never build a flow that expects to read a password out of the Hub.
- **`hub-cli` needs the network flag.** It is what tells the CLI which subdirectory holds the auth cookie, so leaving it off makes every call fail authorization on anything but mainnet.
- **Node ports are pinned to the mainnet pair on every network.** Only one network runs per container, so nothing has to be repointed after a switch and the bindings never churn.
- **`sigtermTimeout: 300_000` on the node is deliberate** — a chainstate flush can take minutes, and cutting it short corrupts the database.
- **The indexer's health check parses its log because that is its only output.** It logs the height it resumed from on connecting to the Hub, then each block it replays; there is no RPC to ask.

## Repository conventions

This repo is the original the Start9-Community copy is imported from. Keep it a
near-replica of that copy: every difference must be one of those listed below.

- **Syncing with Start9-Community:** `git merge` their `master` into ours, never
  rebase or force-push. Take their side for packaging, layout, docs and CI;
  keep only the deliberate differences below.
- **Branches:** `master` is released — every push to it runs Tag and Release,
  and so does the upstream bot's dispatch after an auto-bump.
  `next` is kept on purpose: Start9's Sync Next workflow mirrors `master` into
  it, so do not delete it.
- **Versions:** `<upstream>:<revision>` in the single `startos/versions/current.ts`.
  Never change the upstream part by hand; a new upstream starts at `:0` (the
  auto-bump does this). The revision is bumped only when the maintainer
  decides — never for alignment, template, docs, CI or archive changes. `ALLOW_DOWNGRADE` stays `false` unless a
  release is known to be reversible.
- **`assets/` vs `archive/`:** `assets/` is packed into the s9pk as a whole, so
  it holds only `.gitkeep` unless the service reads a file at runtime.
  `archive/` holds reference material (`ABOUT.md`, logos, picture variants) and
  is not packed. Never delete anything in `archive/`.
- **What StartOS shows:** name from `title` in `startos/manifest/index.ts`,
  description and About text from `short`/`long` in `startos/manifest/i18n.ts`,
  Instructions tab from `instructions.md` (required), logo from `icon.png`.
- **Commit and PR hygiene:** no session links, `Co-Authored-By` trailers or
  "Generated with" footers in commit messages, PR descriptions or comments.
  The Session Link Guard workflow fails any PR or push that carries one.
  Commits are authored by the maintainer, and all repository text (code
  comments, docs, commit messages, PR text) is written in the maintainer's
  voice, without naming the tools used to produce it.
- **Toolchain:** always follow the latest Start9 tooling — the newest
  `@start9labs/start-sdk` on npm (pinned exactly, with the `overrides` entry),
  the newest `start-cli` release, and the latest `Start9Labs/hello-world-startos`
  template. Its boilerplate files (workflows, `Makefile`, `tsconfig.json`,
  `.gitignore`, `.dockerignore`, `CLAUDE.md`, `startos/index.ts`,
  `startos/sdk.ts`, `startos/i18n/index.ts`, `startos/versions/index.ts`) stay
  byte-identical to it unless a difference is listed below. When the template,
  SDK or CLI moves, update every package. Where the template and the
  Start9-Community copy disagree, the template wins.
- **Deliberate differences from Start9-Community:** `ALLOW_DOWNGRADE` in `current.ts`; `check-upstream.yml` + `scripts/auto-bump.sh` (daily Codeberg tag check; resolves the tag to its commit and commits the bump to `master` and dispatches Tag and Release; `tagAndRelease.yml` accepts that dispatch); `dependabot.yml`; `session-link-guard.yml`; `archive/`; the matching README note. The RPC contract dependents rely on (`rpcHostId`/`rpcPort` exports, one RPC port on every chain, the `create-dependent-credential` action) is Start9's and must stay as it is: Fulcrum BCH, BCH Explorer and the mining pools are built against it.
