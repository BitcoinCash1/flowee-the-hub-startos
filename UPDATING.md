# Updating the upstream version

This package compiles **Flowee the Hub** from the upstream source tarball. Upstream publishes no
release binaries and no container image, so there is nothing to re-tag — the Dockerfile does the
build.

## Determining the upstream version

Releases are tagged `YYYY.MM.patch` on Codeberg:

```sh
curl -s 'https://codeberg.org/api/v1/repos/Flowee/thehub/tags?limit=1' | jq -r '.[0].name'
```

The pin lives in `startos/manifest/index.ts` under `images.flowee.source.dockerBuild.buildArgs`,
as a pair: `VERSION` is the human-readable tag, `COMMIT` is the commit it resolves to. `COMMIT` is
what the build actually downloads — Codeberg serves an immutable archive per commit, whereas a tag
can be moved.

Resolve a tag to its commit with:

```sh
curl -s 'https://codeberg.org/api/v1/repos/Flowee/thehub/tags?limit=20' \
  | jq -r '.[] | select(.name == "<tag>") | .commit.sha'
```

## Applying the bump

1. Set both `VERSION` and `COMMIT` in `startos/manifest/index.ts` to the new tag and its commit.
2. Set `version` in `startos/versions/current.ts` to `<upstream>:0`, dropping the leading zero
   from the month — upstream `2026.05.2` is ExVer `2026.5.2`. Rewrite `releaseNotes` for all five
   locales.
3. Rebuild (`make x86`) and install. The build takes a few minutes; a compile failure after a bump
   usually means a new dependency, which goes in the builder stage of `Dockerfile`.
