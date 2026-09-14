#!/usr/bin/env bash
# Render a diagram HTML to PNG at 2x with headless Chrome.
# Usage: render-diagram.sh <diagram.html> [out.png]
# Canvas size comes from <body data-width="1600" data-height="900"> (defaults 1600x900).
set -euo pipefail
in="$1"; out="${2:-${in%.html}.png}"
in_abs="$(cd "$(dirname "$in")" && pwd)/$(basename "$in")"
out_abs="$(cd "$(dirname "$out")" && pwd)/$(basename "$out")"
w=$(grep -o 'data-width="[0-9]*"' "$in" | head -1 | grep -o '[0-9]*' || true); w=${w:-1600}
h=$(grep -o 'data-height="[0-9]*"' "$in" | head -1 | grep -o '[0-9]*' || true); h=${h:-900}
chrome="$("$(dirname "$0")/find-chrome.sh")"
"$chrome" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
  --default-background-color=ffffffff --force-color-profile=srgb --force-device-scale-factor=2 --window-size="${w},${h}" --virtual-time-budget=4000 \
  --screenshot="$out_abs" "file://$in_abs" >/dev/null 2>&1
echo "$out_abs (${w}x${h} @2x)"
