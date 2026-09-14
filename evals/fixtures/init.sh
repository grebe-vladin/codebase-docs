#!/usr/bin/env bash
# Recreate the fixture repos' git history (nested .git folders are not stored in the plugin repo).
set -e; cd "$(dirname "$0")"
for r in api web; do if [ ! -d "$r/.git" ]; then (cd "$r" && git init -q && git add -A && git -c user.email=eval@example.com -c user.name=eval commit -qm "fixture $r"); echo "initialised $r"; fi; done
