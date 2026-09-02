#!/usr/bin/env bash
#
# Start the AeroDex demo — API + dashboard, one command, no Docker.
#
#   ./scripts/run_demo.sh              # API on 8000, dashboard on 3000
#   API_PORT=8010 WEB_PORT=3010 ./scripts/run_demo.sh
#
# With no database reachable the API serves the frozen synthetic run in demo/
# and every response says so, which the dashboard renders as a banner. Bring up
# `docker compose up -d` first and the same endpoints serve collected data
# instead — nothing in the frontend changes.
#
# Ctrl-C stops both.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-3000}"

# --- preflight -------------------------------------------------------------

if [[ ! -f demo/panel.csv.gz ]]; then
  echo "demo/ dataset is missing — generating it (deterministic, no network)…"
  if [[ -x .venv/bin/python ]]; then
    .venv/bin/python scripts/make_demo_data.py
  else
    uv run python scripts/make_demo_data.py
  fi
fi

if [[ ! -d frontend/node_modules ]]; then
  echo "Installing frontend dependencies…"
  (cd frontend && npm install)
fi

port_busy() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

for port in "$API_PORT" "$WEB_PORT"; do
  if port_busy "$port"; then
    echo "Port $port is already in use." >&2
    echo "Free it, or re-run with different ports:" >&2
    echo "  API_PORT=8010 WEB_PORT=3010 $0" >&2
    exit 1
  fi
done

# --- run -------------------------------------------------------------------

PIDS=()
cleanup() {
  trap - INT TERM EXIT
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done
}
trap cleanup INT TERM EXIT

echo "→ API       http://localhost:$API_PORT/docs"
if [[ -x .venv/bin/python ]]; then
  .venv/bin/python -m uvicorn aerodex.api:app --port "$API_PORT" &
else
  uv run uvicorn aerodex.api:app --port "$API_PORT" &
fi
PIDS+=($!)

echo "→ Dashboard http://localhost:$WEB_PORT"
(
  cd frontend
  # The dashboard calls same-origin /api/*; Next rewrites that to the API, so
  # the browser never makes a cross-origin request.
  NEXT_PUBLIC_API_URL="http://localhost:$API_PORT" npm run dev -- --webpack --port "$WEB_PORT"
) &
PIDS+=($!)

wait
