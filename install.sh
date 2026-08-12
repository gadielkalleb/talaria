#!/usr/bin/env bash
set -euo pipefail

SKILL_SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-$HOME/.hermes/skills/talaria}"

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mkdir -p "$DEST"

tar -C "$SKILL_SRC" \
  --exclude=node_modules \
  --exclude='*.tgz' \
  --exclude='test/.tmp' \
  --exclude=.git \
  -cf - . | tar -C "$DEST" -xf -

cd "$DEST"
npm install

echo "Skill installed at: $DEST"
echo "Verify: cd \"$DEST\" && npm test"
