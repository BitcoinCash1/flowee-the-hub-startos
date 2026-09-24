#!/usr/bin/env bash
# Bump the package to a new upstream Flowee the Hub release and open a pull request.
#
#   scripts/auto-bump.sh <upstream-tag>      e.g. scripts/auto-bump.sh 2026.08.0
#
# Resolves the tag to its immutable commit on Codeberg, sets VERSION and COMMIT
# in the manifest's buildArgs, sets startos/versions/current.ts to `<upstream>:0`
# (ExVer drops the leading zero from the month: 2026.08.0 -> 2026.8.0), resets
# ALLOW_DOWNGRADE to false, then commits on `auto-bump/<tag>` and opens a PR
# against master. Merging the PR is what releases it.
#
# DRY_RUN=1 edits and commits locally but skips the push and the PR.
set -euo pipefail

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "Usage: $0 <upstream-tag>" >&2
  exit 1
fi
MANIFEST=startos/manifest/index.ts
CURRENT_FILE=startos/versions/current.ts
UPSTREAM=$(echo "$TAG" | awk -F. '{ printf "%d.%d.%d", $1, $2, $3 }')

CURRENT_VERSION=$(sed -nE "s/^[[:space:]]*version:[[:space:]]*'([^']+)'.*/\1/p" "$CURRENT_FILE" | head -1)
CURRENT_UPSTREAM="${CURRENT_VERSION%%:*}"
if [ "$CURRENT_UPSTREAM" = "$UPSTREAM" ]; then
  echo "Already at $UPSTREAM — no bump needed"
  exit 0
fi
# Never move the version downwards: StartOS cannot migrate to a lower upstream.
HIGHEST=$(printf '%s\n%s\n' "$CURRENT_UPSTREAM" "$UPSTREAM" | sort -V | tail -1)
if [ "$HIGHEST" = "$CURRENT_UPSTREAM" ]; then
  echo "::warning::Tag $TAG is older than the packaged version $CURRENT_UPSTREAM — refusing to downgrade"
  exit 0
fi

COMMIT="${COMMIT:-$(curl -fsS 'https://codeberg.org/api/v1/repos/Flowee/thehub/tags?limit=50' |
  python3 -c 'import sys,json; t=sys.argv[1]; print(next((x["commit"]["sha"] for x in json.load(sys.stdin) if x["name"]==t), ""))' "$TAG")}"
if ! echo "$COMMIT" | grep -qE '^[0-9a-f]{40}$'; then
  echo "Could not resolve tag $TAG to a commit" >&2
  exit 1
fi
NEW_VERSION="${UPSTREAM}:0"
echo "Bumping $CURRENT_VERSION -> $NEW_VERSION ($TAG = $COMMIT)"

python3 - "$MANIFEST" "$CURRENT_FILE" "$TAG" "$COMMIT" "$NEW_VERSION" "$UPSTREAM" <<'PY'
import re, sys
manifest, current, tag, commit, new_version, upstream = sys.argv[1:]
m = open(manifest).read()
m, a = re.subn(r"(VERSION:\s*)'[^']+'", rf"\g<1>'{tag}'", m, count=1)
m, b = re.subn(r"(COMMIT:\s*)'[0-9a-f]{40}'", rf"\g<1>'{commit}'", m, count=1)
assert a == 1 and b == 1, 'buildArgs VERSION/COMMIT not found'
open(manifest, 'w').write(m)
src = open(current).read()
src, n = re.subn(r"(\n\s*version:\s*)'[^']+'", rf"\g<1>'{new_version}'", src, count=1)
assert n == 1, 'version line not found'
# Release notes are rewritten for review in the PR; translations are added there.
src, n = re.subn(
    r"releaseNotes:\s*(\{.*?\n  \}|'[^']*'|`[^`]*`),",
    "releaseNotes: {\n    en_US: 'Updates Flowee the Hub to upstream " + tag + ".',\n  },",
    src, count=1, flags=re.S)
assert n == 1, 'releaseNotes not found'
src = re.sub(r"const ALLOW_DOWNGRADE = (true|false)", "const ALLOW_DOWNGRADE = false", src)
open(current, 'w').write(src)
PY

BRANCH="auto-bump/${TAG}"
git checkout -b "$BRANCH"
git add "$MANIFEST" "$CURRENT_FILE"
git -c user.name="github-actions[bot]" \
    -c user.email="github-actions[bot]@users.noreply.github.com" \
    commit -m "feat: bump Flowee the Hub to upstream ${TAG} (${NEW_VERSION})"

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "DRY_RUN: committed on $BRANCH, not pushed"
  exit 0
fi

git push origin "$BRANCH"
gh pr create --base master --head "$BRANCH" \
  --title "Bump Flowee the Hub to upstream ${TAG} (${NEW_VERSION})" \
  --body "Automated bump to upstream Flowee the Hub ${TAG} (commit ${COMMIT}). Review the release notes (add translations) before merging; merging releases ${NEW_VERSION}."
