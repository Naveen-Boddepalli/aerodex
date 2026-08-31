# AeroDex: Project Overview

## What the project is
AeroDex is a real-time airfare price index for India (SIH 2026, PS SIH26056, MoSPI). It collects airfare quotes on a fixed 60-route domestic panel, turns them into a weighted price index, and publishes every number alongside the hashes needed to recompute it from the archived inputs.

## Purpose and Goals
The primary goal is to provide a defensible, reproducible, and transparent statistical index for airfares, akin to how statistical offices calculate inflation indexes. It aims to achieve this with absolute reliability, transparent imputation, and zero ongoing cloud costs.

## Main Features
- Scheduled data collection (morning, afternoon, evening slots).
- Real-time indexing via Jevons-Lowe methodology.
- Transparent reporting of quality metrics: coverage ratio and imputation share.
- Frozen, mathematically pure output generation ensuring 100% reproducibility.
- Interactive Next.js dashboard for visualizing trends, specific route movements, and data provenance.

## Important Business Logic
- **Methodology**: Uses the Jevons elementary index (geometric mean of price relatives) and Lowe aggregation with DGCA traffic weights.
- **Reproducibility (M6)**: Every published index number must be perfectly reproducible from the original input data.
- **Imputation Limits (M5)**: If the imputed weight share exceeds 5%, publication is refused. It prefers failing loudly and reporting the coverage hole over silently publishing a "prettier" but inaccurate number.
- **Three-tier collection ladder**: Tries public JSON endpoints first, then internal XHR APIs, and only falls back to a full Playwright render if necessary.

## Key Technologies/Frameworks
- **Backend/CLI**: Python 3.12+, pandas, statsmodels.
- **Web API**: FastAPI.
- **Database**: PostgreSQL 16 + TimescaleDB Community.
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind v4, Recharts.
- **Infrastructure**: systemd timers, Oracle Cloud Always Free (ARM A1), Cloudflare R2 (storage) & Pages.

## Important Constraints & Assumptions
- **₹0 Recurring Cost**: Every component must run on a permanent free tier or open-source software.
- **Strict Compliance**: No authentication evasion, no CAPTCHA solving, no fingerprint spoofing, strict `robots.txt` honoring, and explicit User-Agent identification.
- **Synthetic Data Tagging**: The project demo relies on a fixture adapter serving synthetic fares. This must always be explicitly labeled in the UI (`data_source: "demo-synthetic"`) and the publisher refuses to release it as an actual measurement.
