# Repository Structure

The repository is divided into the Python backend (`aerodex/`), the Next.js frontend (`frontend/`), configuration (`config/`), and tests (`tests/`).

## Root Directories

### `aerodex/`
The core Python application and CLI.
- **`acquire/`**: Contains the source adapters (`base.py`, `collect.py`) and the 3-tier fallback ladder. New sources are added here.
- **`normalise/`**: Logic for fare decomposition, deduplication, and attribute tagging.
- **`validate/`**: Plausibility rules and quarantine logic.
- **`index/`**: The statistical index engine. Contains `engine.py` (the pure function), `elementary.py` (Jevons), `aggregate.py` (Lowe), and `impute.py`.
- **`db/`**: Database interactions. Contains `schema.sql` (defining the tables and triggers), `connection.py`, and `queue.py` (the SKIP LOCKED job queue).
- **`publish/`**: Logic for generating static JSON artifacts and enforcing publication rules (e.g., refusing unpublishable runs).
- **`cli.py`**: The main command-line interface entry point.
- **`api.py`**: The read-only FastAPI service for the dashboard.
- **`compliance.py`**: Runtime assertions enforcing project constraints (robots.txt, rate limits, no-auth rules).

### `frontend/`
The Next.js 16 App Router dashboard.
- **`app/`**: Contains the route groups `(marketing)` for the landing page and `(dashboard)` for the main app shell.
  - **`app/(dashboard)/page.tsx`**: Main dashboard — styled as a statistical publication (gov-badge header, DAPI title, MoSPI classification).
  - **`app/(dashboard)/methodology/page.tsx`**: Full 9-section publication-quality methodology document.
  - **`app/(dashboard)/history/page.tsx`**: DAPI Index Time Series with provisional/final markers.
  - **`app/(dashboard)/heatmap/page.tsx`**: Network Heatmap showing period-on-period inflation by origin-destination.
  - **`app/(dashboard)/routes/[origin]/[destination]/page.tsx`**: Route detail with FareBreakupPanel and lead-time elasticity curve.
- **`components/`**: Reusable React components.
  - **`DataSourceBanner.tsx`**: Synthetic data warning — must always be rendered.
  - **`IndexStats.tsx`**: 5-card KPI strip (DAPI Index Level, Panel Coverage, Observation Volume, Data Quality Gate, Revision Status).
  - **`PriceTrackerCard.tsx`**: Corridor analytics card with Stratum Median, DGCA weight chip, imputation status.
  - **`FareBreakupPanel.tsx`**: Statutory fare decomposition (base, fuel surcharge, UDF, taxes, surge). All values are *estimated* using statutory rates — labelled with `est-badge`.
  - **`StatisticalSummaryTable.tsx`**: NSO-style methodology disclosure block; links to `/methodology`.
  - **`IndexProvenance.tsx`**: Reproducibility hashes, quality gauges, compliance rules.
  - **`RouteExplorer.tsx`**: Panel query interface.
  - **`RouteMapSection.tsx`**: SVG panel network map.
- **`lib/api.ts`**: The single, unified place where the frontend communicates with the backend API via HTTP.

### `config/`
YAML files driving the project's logic without hardcoding values in Python.
- **`methodology.yaml`**: The index definition (formulas, base periods, max imputation limits). This file is SHA-256 hashed into every published artifact.
- **`panel.yaml`**: Defines the 60 routes, their DGCA weights, horizons, and slots.
- **`calendar.yaml`**: Festival and vacation windows for seasonality adjustments.

### `scripts/`
Maintenance, data generation, and offline reporting scripts.
- **`backtest/`**: Contains the DGCA back-test script (`run_backtest.py`) which outputs `backtest_report.md` comparing the index against official MoCA/DGCA figures.
- **`make_demo_data.py`**: Generates the synthetic `demo/` panel.
- **`parse_dgca_weights.py`**: Parses official DGCA passenger traffic to build route weights.

### `tests/`
- **`unit/`**: Standard unit tests for isolated functions.
- **`golden/`**: Crucial reproducible tests (M6 guarantee). Tests run a frozen input panel against a frozen expected index output hash.
- **`canary/`**: Live network checks against real sources.

### `demo/`
Contains a frozen, deterministic run of the real pipeline against the fixture adapter, generating synthetic data used for local development and demos when no DB is present.
