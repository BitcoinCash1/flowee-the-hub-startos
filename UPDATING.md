# Updating the upstream version

This package builds **Flowee the Hub** from source using `Dockerfile.binary`.
Upstream releases live at [codeberg.org/Flowee/thehub](https://codeberg.org/Flowee/thehub/releases).

## Determining the upstream version

Check the latest tag on the [Codeberg releases page](https://codeberg.org/Flowee/thehub/releases).
Tags follow the format `YYYY.MM.patch` (e.g. `2026.05.2`).
The current pin is `ARG FLOWEE_VERSION=` in `Dockerfile.binary`.

## Applying the bump

1. Update `ARG FLOWEE_VERSION=<new version>` in `Dockerfile.binary` (e.g. `2026.05.2`).
2. Add a new `startos/versions/v<YYYY>.<M>.<patch>.0.ts` file and update `startos/versions/index.ts` to set it as `current`.
3. Update version references in `README.md` and `instructions.md`.
4. Trigger the **Build Binary Image** workflow (`workflow_dispatch`) — Flowee compiles from source (~90 min) and then auto-triggers `tagAndRelease`.
