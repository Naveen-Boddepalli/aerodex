# AeroDex Architecture

## Overall System Architecture
AeroDex operates as a decoupled pipeline focused on data acquisition, normalization, validation, indexing, and static publishing.

The flow is strictly unidirectional:
`scheduler -> adapter -> normalise -> validate -> store -> index -> publish`

## Major Components & Data Flows

1. **Scheduler**: `systemd` timers trigger collections for the fixed IST slots (morning, afternoon, evening).
2. **Job Queue (`job` table)**: PostgreSQL `FOR UPDATE SKIP LOCKED` manages the distribution of collection tasks.
3. **Acquisition (Adapters)**: Implements a 3-tier fallback ladder (JSON -> XHR -> Playwright Render). Collected data is saved to `quote_raw`.
4. **Data Normalization & Validation**: Raw payloads are decomposed, deduplicated, tagged with hedonic attributes, checked against plausibility rules, and written to `quote_clean`.
5. **Index Engine**: A pure Python function (`pandas`, `statsmodels`) reads from `quote_clean` and `config/methodology.yaml`. It computes the index (Jevons-Lowe) and outputs data to `index_point`.
6. **Publication**: Static JSON/CSV artifacts are written to Cloudflare R2. A read-only FastAPI service (via Cloudflare Tunnel) serves this data, falling back to a deterministic local demo dataset if the database is absent.
7. **Dashboard**: A Next.js static export hosted on Cloudflare Pages fetches data from the FastAPI service to render charts, maps, and tracking tables.

## Frontend/Backend/Database Relationships
- **Database (PostgreSQL + TimescaleDB)**: Self-hosted on an Oracle ARM VM. It stores immutable raw observations, cleaned panel data, published indices, and job queue states.
- **Backend API (`aerodex.api`)**: A read-only FastAPI server that exposes the database (or the `demo/` synthetic dataset) via HTTP endpoints.
- **Frontend (`frontend/`)**: Next.js App Router application. All data fetching is routed through `lib/api.ts` making requests to the Backend API. It strictly reflects the data source (database vs demo) provided by the API.

## External APIs / Services
- **Cloudflare R2**: Used for storing static output artifacts and database backups (zero egress costs).
- **Cloudflare Pages**: Hosts the Next.js static dashboard.
- **Cloudflare Tunnel**: Securely exposes the FastAPI service without opening public ports.
- **Grafana Cloud & UptimeRobot**: Used for off-box monitoring, metrics, and alerting (via Telegram).

## Authentication & Authorization
- **None by design.** The system does not use authentication, does not solve CAPTCHAs, and does not create accounts for data acquisition. This is a strict project requirement to ensure legally defensible data collection.
- The dashboard is entirely public and does not require user accounts.
