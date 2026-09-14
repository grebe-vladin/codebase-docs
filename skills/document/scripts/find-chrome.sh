#!/usr/bin/env bash
# Prints the path of a Chrome/Chromium binary, or exits 1.
if [ -n "${CHROME:-}" ] && [ -x "$CHROME" ]; then echo "$CHROME"; exit 0; fi
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  google-chrome google-chrome-stable chromium chromium-browser \
  "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files/Google/Chrome/Application/chrome.exe"; do
  if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then command -v "$c" 2>/dev/null || echo "$c"; exit 0; fi
done
echo "Chrome not found. Set CHROME=/path/to/chrome" >&2; exit 1
