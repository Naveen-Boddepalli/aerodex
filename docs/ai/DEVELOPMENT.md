# Development & Workflow

## Dependencies and Environments

- **Python (Backend)**: Managed via `uv`. The project requires Python 3.12+.
  - Install dependencies: `uv sync --extra dev`
- **Node.js (Frontend)**: Managed via `npm`. Requires Node.js >= 20.
  - Install dependencies: `cd frontend && npm install`
- **Database**: PostgreSQL 16 with TimescaleDB.
  - Provided locally via Docker: `docker compose up -d`

## Running the Project

### 1. The Demo Mode (No Database / No Network)
The easiest way to see the project without configuring a database. It serves frozen, synthetic fixture data.
```bash
./scripts/run_demo.sh
```
This starts both the FastAPI backend and Next.js frontend, handling port resolution automatically.

### 2. Full Pipeline (With Database)
Start the database and run the pipeline locally:
```bash
# Start DB
docker compose up -d
export AERODEX_DSN=postgresql://aerodex:aerodex@localhost:5433/aerodex

# Initialize schema
uv run python -m aerodex.cli init-db

# Collect data
uv run python -m aerodex.cli collect --slot morning --store

# Compute index
uv run python -m aerodex.cli index

# Start API
uv run uvicorn aerodex.api:app --reload --port 8000
```

## CLI Commands (`aerodex.cli`)
- `aerodex panel`: Displays the panel shape, sizing arithmetic, and config hashes.
- `aerodex init-db`: Applies the database schema idempotently.
- `aerodex collect`: Runs data collection for a specific slot.
- `aerodex index`: Computes the index from the database or a CSV. Using `--publish` will run it through the strict publication checks.
- `aerodex verify`: M6 Check. Recomputes an archived panel and diffs the output hash to prove reproducibility.

## Testing
- **Run all tests**: `uv run pytest -q`
- **Run Golden Tests (M6)**: `uv run pytest tests/golden -q`
  - *Note:* If you intentionally change the methodology in `config/methodology.yaml`, the golden tests will fail because the output hashes change. You must deliberately re-freeze the expected hashes in a separate commit explaining why the number moved.
- **Run Compliance Tests**: `uv run pytest -q -k compliance`
- **Frontend checks**: `cd frontend && npm run lint && npx tsc --noEmit`
