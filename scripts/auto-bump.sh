#!/usr/bin/env bash
set -euo pipefail

DISPATCHED_TAG="${1:-}"
if [ -z "$DISPATCHED_TAG" ]; then
  echo "Usage: $0 <tag>" >&2
  exit 1
fi

# Flowee tags as 2026.05.0 — convert to Start9 version (strip leading zeros from month)
# e.g. 2026.05.0 -> 2026.5.0.0
CLEAN_TAG=$(echo "$DISPATCHED_TAG" | sed -E 's/\.0*([1-9][0-9]*)\./.\1./g')

CURRENT_VAR=$(grep -E '^[[:space:]]*current:' startos/versions/index.ts | head -1 \
  | sed -E 's/.*current:[[:space:]]*([A-Za-z0-9_]+).*/\1/')
VERSION_FILE_BASE=$(echo "$CURRENT_VAR" | sed -E 's/^v_//; s/_/./g')
CURRENT_VERSION=$(grep -E "version:[[:space:]]*'" "startos/versions/v${VERSION_FILE_BASE}.ts" \
  | head -1 | sed -E "s/.*version:[[:space:]]*'([^']+)'.*/\1/")
CURRENT_UPSTREAM="${CURRENT_VERSION%%:*}"

if [ "$CURRENT_UPSTREAM" = "$CLEAN_TAG" ]; then
  echo "Already at $CLEAN_TAG — no bump needed"
  exit 0
fi
echo "Bumping $CURRENT_UPSTREAM -> $CLEAN_TAG"

TAG_VAR="v_$(echo "$CLEAN_TAG" | tr '.' '_')_0"
NEW_VERSION="${CLEAN_TAG}:0"
NEW_FILE="startos/versions/v${CLEAN_TAG}.0.ts"

cat > "$NEW_FILE" <<EOF
import { VersionInfo } from '@start9labs/start-sdk'

export const ${TAG_VAR} = VersionInfo.of({
  version: '${NEW_VERSION}',
  releaseNotes: 'Upstream ${DISPATCHED_TAG}.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
EOF

sed -i "s|^ARG FLOWEE_VERSION=.*|ARG FLOWEE_VERSION=${DISPATCHED_TAG}|" Dockerfile.binary
sed -i "1a import { ${TAG_VAR} } from './${CLEAN_TAG}.0'" startos/versions/index.ts
sed -i "s/current: ${CURRENT_VAR}/current: ${TAG_VAR}/" startos/versions/index.ts
sed -i "s/other: \[/other: [${CURRENT_VAR}, /" startos/versions/index.ts

git add startos/versions/index.ts "$NEW_FILE" Dockerfile.binary
git commit -m "feat: auto-bump to upstream ${DISPATCHED_TAG} (v${NEW_VERSION})"
git push origin master
echo "Version bump committed"
