#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="$REPO_ROOT/skills/talaria"
DEST="${1:-$HOME/.hermes/skills/talaria}"

if [[ ! -f "$SKILL_SRC/SKILL.md" ]]; then
  echo "Error: skill not found at $SKILL_SRC" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mkdir -p "$DEST"

tar -C "$SKILL_SRC" \
  --exclude=node_modules \
  --exclude='*.tgz' \
  --exclude='test/.tmp' \
  -cf - . | tar -C "$DEST" -xf -

cd "$DEST"
npm install

echo "Skill installed at: $DEST"
echo "Verify: cd \"$DEST\" && npm test"
