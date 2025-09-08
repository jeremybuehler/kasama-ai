#!/usr/bin/env bash
set -euo pipefail

# Scan staged files for common secret patterns. Fail commit on match.

FILES=$(git diff --cached --name-only --diff-filter=ACMR | tr '\n' ' ')
if [ -z "$FILES" ]; then
  exit 0
fi

PATTERN='(sk-[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|Bearer [A-Za-z0-9-_.]{20,})'

if rg -n --hidden -S -e "$PATTERN" -- $FILES | grep -v "node_modules/"; then
  echo "\n❌ Potential secret detected in staged changes."
  echo "If this is a false positive, commit with --no-verify or adjust patterns."
  exit 1
fi

exit 0

