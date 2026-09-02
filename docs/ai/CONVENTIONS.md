# Coding Conventions & Core Invariants

This project adheres to several strict invariants that are essential for the project's defensibility and success criteria.

## The Two Immutable Invariants

1. **`quote_raw` is Append-Only:**
   - The `quote_raw` database table is strictly append-only. Rows are never updated and never deleted.
   - This is enforced at the database level by row-level and statement-level triggers (in `schema.sql`), not just by code review.
   - This ensures the M6 Reproducibility guarantee: the exact raw payloads used to compute an index are forever preserved.

2. **The Index Engine is a Pure Function:**
   - The index computation (`aerodex.index.engine.compute_index`) must be a pure function.
   - It accepts dataframes and configuration objects as arguments and returns a dataframe.
   - It must **never** read from the network, query the database, or read the system clock.
   - A unit test enforces this constraint to prevent silent reproducibility drift.

## Compliance and Data Collection (`aerodex/compliance.py`)
All data collection must pass through strict runtime assertions. Do not bypass these rules:
- **No Evasion:** Do not write code to bypass CAPTCHAs, use proxies, or log into accounts. If a source blocks collection, the project handles it by dropping the source and publishing a lower coverage ratio.
- **Rate Limiting:** A minimum interval of 20 seconds between requests to the same host is enforced.
- **`robots.txt`**: Parsed and strictly honored at runtime. Unreachable `robots.txt` means disallowed.
- **Identification:** The `User-Agent` must always explicitly name the project and link to the repository.
- **No Personal Data:** Assertions explicitly forbid parsing or storing fields like names, emails, PNRs, or payment details.

## Configuration
- Do not hardcode weights, routes, or methodology formulas in Python code.
- All such rules live in `config/` (e.g., `methodology.yaml`, `panel.yaml`).
- Changes to `methodology.yaml` will alter the configuration hash, intentionally breaking the golden tests.

## Frontend Conventions
- **Single HTTP Fetcher:** All HTTP requests to the backend must go through `frontend/lib/api.ts`. Do not call `fetch` directly from UI components.
- **Graceful Error Handling:** Fetchers return `{ data, error }` objects instead of throwing exceptions. Components must render Loading, Error, and Empty states gracefully without crashing or spinning infinitely.
- **No Synthetic Blurring:** Data served from `demo/` must always carry the `data_source: "demo-synthetic"` tag, and the UI must display a banner identifying it as such. Never present synthetic data as a real measurement.
- **Government/Statistical Audience:** The dashboard is aimed at MoSPI analysts and government evaluators, not consumer users. Use statistical terminology (Stratum Median, Observation Volume, Data Quality Gate) and NSO-style publication framing (gov-badge headers, formal section structure).
- **CSS Utility Classes:** Use `stat-card` (tighter, more formal) in addition to `aero-card`. Use `gov-badge`, `status-provisional`, `status-final`, `status-revised`, and `est-badge` for classification and estimation indicators. Use `kpi-primary` / `kpi-secondary` for index-level numbers. Use `stat-row` / `stat-row-label` / `stat-row-value` for tabular data rows.
- **FareBreakupPanel Estimation Contract:** The decomposition in `FareBreakupPanel.tsx` is estimated from statutory published rates (AAI UDF, GST, PSF/ASF) applied to the observed total fare. It is NOT directly measured. Always render the `est-badge` inline on the chart — never remove or downgrade this to a footnote without explicit approval.
- `/methodology` Route: A dedicated first-class page (not an anchor-link) structured as a formal 9-section NSO methodology document. Keep it in sync with `config/methodology.yaml` when that file changes.

## Backtesting
- **Reference Data Strategy**: Backtests must use the best available public government references (e.g., MoCA parliamentary responses or MoSPI CPI sub-indices) and explicitly document the alignment/methodological caveats, rather than fabricating non-existent route-level public data.
- **Location**: Store backtest scripts in `scripts/backtest/` and run them similarly to other CLI utilities (`uv run python scripts/backtest/run_backtest.py`). Do not put these in `tests/` because they output Markdown reports rather than boolean pass/fail assertions.
