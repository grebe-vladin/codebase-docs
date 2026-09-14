#!/usr/bin/env bash
# Preflight for the document skill. Exit 0 = all required tools present; exit 1 = something required is missing.
# Usage: doctor.sh [--pro]   (--pro also requires GEMINI_API_KEY)
here="$(cd "$(dirname "$0")" && pwd)"; fail=0; warn=0
ok(){ printf '  ok    %s\n' "$1"; }; bad(){ printf '  MISSING  %s\n' "$1"; fail=1; }; wrn(){ printf '  warn  %s\n' "$1"; warn=1; }
echo "codebase-docs doctor"
if command -v node >/dev/null 2>&1; then v=$(node -v | sed 's/v//'); if [ "${v%%.*}" -ge 20 ]; then ok "node $v"; else bad "node $v — need 20+ (marked 18 requires it)"; fi; else bad "node — install Node.js 20+"; fi
if c=$("$here/find-chrome.sh" 2>/dev/null); then ok "chrome: $c"; else bad "chrome — install Google Chrome/Chromium or set CHROME=/path"; fi
if command -v pdftoppm >/dev/null 2>&1; then ok "pdftoppm $(pdftoppm -v 2>&1 | head -1 | awk '{print $NF}')"; else bad "pdftoppm — brew install poppler | apt-get install poppler-utils (needed to read the PDF back)"; fi
if command -v git >/dev/null 2>&1; then ok "git"; else bad "git — needed for stamps and stale checks"; fi
if command -v npm >/dev/null 2>&1; then ok "npm (registry lookups, audit)"; else wrn "npm not found — dependency report will skip registry and audit"; fi
if ls "$HOME/.npm/_npx" >/dev/null 2>&1 && grep -rqs '"name": "marked"' "$HOME/.npm/_npx" 2>/dev/null; then ok "marked cached for npx"; else wrn "marked not cached yet — first PDF build needs network (npx -y marked@18)"; fi
command -v unzip >/dev/null 2>&1 && ok "unzip (funding asset packs)" || wrn "unzip not found — official funding logo packs cannot be extracted automatically"
command -v pandoc >/dev/null 2>&1 && ok "pandoc (DOCX export)" || wrn "pandoc not found — DOCX export unavailable (brew install pandoc | apt-get install pandoc)"
command -v composer >/dev/null 2>&1 && ok "composer (PHP dependency report)" || wrn "composer not found — PHP audit unavailable"
command -v pip-audit >/dev/null 2>&1 && ok "pip-audit (Python dependency report)" || wrn "pip-audit not found — Python audit unavailable (pipx install pip-audit)"
if [ "${1:-}" = "--pro" ]; then if [ -n "${GEMINI_API_KEY:-}" ]; then ok "GEMINI_API_KEY set (pro engine)"; else bad "GEMINI_API_KEY not set — export it before starting Claude Code, or use the html engine"; fi; fi
[ "$fail" -eq 0 ] && echo "result: ready${warn:+ (with warnings)}" || echo "result: NOT READY — install what is missing, then run the skill again"
exit $fail
