#!/usr/bin/env bash
# Rasterize a PDF to PNG pages for visual QA. Usage: pdf-pages.sh <file.pdf> <out-dir> [dpi]
# Needs pdftoppm (poppler): brew install poppler | apt-get install poppler-utils
set -euo pipefail
pdf="$1"; out="$2"; dpi="${3:-80}"
if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "pdftoppm not found. Install poppler (macOS: brew install poppler; Debian: apt-get install poppler-utils)." >&2; exit 2; fi
mkdir -p "$out"; rm -f "$out"/page-*.png
pdftoppm -r "$dpi" -png "$pdf" "$out/page"
n=$(ls "$out"/page-*.png | wc -l | tr -d ' ')
echo "$n pages -> $out/page-NN.png"
pdfinfo "$pdf" 2>/dev/null | grep -E "^(Pages|Page size)" || true
