#!/usr/bin/env bash
# Rebuild the SIH deck (needs Node and Google Chrome; macOS path below).
#   npm install                                  # once
#   TEAM_ID=12345 TEAM_NAME="Your Team" ./build.sh
# Writes ../AeroDex-SIH2026-Idea-v2.pptx (editable) and ../AeroDex-SIH2026-Idea-v2.pdf (the file to upload).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="$HERE/out"; CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
node "$HERE/deck.js" "$OUT"
# overflow check: Chrome flags any text that spills its box; expect QA_OVERFLOW_COUNT=0
"$CH" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=6000 --window-size=1280,720 --dump-dom "file://$OUT/deck.html?qa=1" 2>/dev/null | grep -o "QA_OVERFLOW_COUNT=[0-9]*" | tail -1
"$CH" --headless=new --disable-gpu --allow-file-access-from-files --no-pdf-header-footer --print-to-pdf="$OUT/deck.pdf" "file://$OUT/deck.html" >/dev/null 2>&1
cp "$OUT/AeroDex-SIH2026-Idea.pptx" "$HERE/../AeroDex-SIH2026-Idea-v2.pptx"
cp "$OUT/deck.pdf" "$HERE/../AeroDex-SIH2026-Idea-v2.pdf"
ls -la "$HERE"/../AeroDex-SIH2026-Idea-v2.* | awk '{print $5, $9}'
