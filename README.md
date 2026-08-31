---
updated: 2026-08-25T05:51:17.086Z
editedBy: praneeth132006
generator: https://forkleaf.vercel.app
---

# AeroDex

Real-time airfare price index for India — SIH 2026, PS SIH26056 (MoSPI).

[![ci](https://github.com/Naveen-Boddepalli/aerodex/actions/workflows/ci.yml/badge.svg)](https://github.com/Naveen-Boddepalli/aerodex/actions/workflows/ci.yml)
[![reproducibility](https://github.com/Naveen-Boddepalli/aerodex/actions/workflows/reproducibility.yml/badge.svg)](https://github.com/Naveen-Boddepalli/aerodex/actions/workflows/reproducibility.yml)

AeroDex collects airfare quotes on a fixed 60-route domestic panel, turns them
into a weighted price index using the methodology a statistical office would
recognise (Jevons elementary aggregates under a Lowe index, DGCA traffic
weights), and publishes every number alongside the hashes needed to recompute
it from the archived inputs.

Every component runs on a permanent free tier or open-source software.
**Total recurring cost: ₹0.** The full reasoning is in [plan.md](plan.md);
this README covers how to run what exists today.

**Contents** · [Status](#status) · [Quick start](#quick-start) ·
[Architecture](#architecture) · [Methodology](#methodology) ·
[CLI](#cli-reference) · [HTTP API](#http-api) · [Dashboard](#dashboard) ·
[Configuration](#configuration) · [Data & provenance](#data--provenance) ·
[Testing](#testing) · [Compliance](#compliance) · [Contributing](#contributing)

---

## What this is, and what it is not

**It is** a price index. The unit of output is an index level with a base
period, a coverage ratio, an imputation share, and a set of hashes that let a
third party reproduce it.

**It is not** a flight search or booking product. There is no cart, no
passenger count, no account. The dashboard's controls are the two things the
panel is indexed on — the route and how far ahead of departure a quote was
taken — because those are the axes a fare index has to hold constant.

---

## Status

Phase 0 groundwork and the Phase 1 vertical slice are in place and tested.
The pipeline runs end to end — scheduler → adapter → normalise → validate →
store → index → JSON artifact — on a **fixture adapter**, not real fares.

| Phase 0 spike | Status |
| --- | --- |
| S1 — Oracle A1 capacity in an Indian region | **not started** (needs an Oracle account) |
| S2 — Playwright/Chromium on Ubuntu 24.04 arm64 | **not started** (needs the VM from S1) |
| S3 — tier-1/tier-2 endpoints across \~6 candidate sources | **not started** — gates every real adapter |
| S4 — DGCA weights parse into the 60-route panel | **done** — 60 weights, vintage `dgca-2025-city-pairs-r2` |

Until S3 runs, `aerodex` computes a **structurally correct but unpublishable**
index: real DGCA weights over synthetic fares. The publisher refuses to release
it (`PublicationRefused`), by design rather than by convention.

That refusal is the reason the demo below is labelled the way it is. A fixture
fare is not a measurement, and no amount of it becomes one.

---

## Quick start

### Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| [uv](https://docs.astral.sh/uv/) | ≥ 0.5 | Python dependency management |
| Python | ≥ 3.12 | Runtime |
| Node.js | ≥ 20 | Dashboard (`frontend/`) |
| Docker | any recent | Only for the database path |

### 1. The demo — no database, no network

The fastest way to see the whole system. One command starts the API and the
dashboard together:

```bash
./scripts/run_demo.sh
```

Dashboard on <http://localhost:3000>, API docs on <http://localhost:8000/docs>.

If either port is taken:

```bash
API_PORT=8010 WEB_PORT=3010 ./scripts/run_demo.sh
```

The script generates `demo/` on first run if it is missing, installs frontend
dependencies if `node_modules` is absent, refuses to start on a busy port
rather than failing halfway, and stops both processes on Ctrl-C.

With no database reachable the API serves `demo/` — a frozen, deterministic run
of the real pipeline against the fixture adapter: 30 daily periods across the
full 60-route panel, 75,552 rows. **Those fares are synthetic and the dashboard
says so on every page.** Every such response carries
`data_source: "demo-synthetic"` and a `notice`; the banner collapses but does
not dismiss.

### 2. The pipeline — with a database

```bash
uv sync --extra dev
```

```bash
docker compose up -d
```

```bash
export AERODEX_DSN=postgresql://aerodex:aerodex@localhost:5433/aerodex
```

```bash
uv run python -m aerodex.cli init-db
```

Inspect the panel, collect one slot, compute the index:

```bash
uv run python -m aerodex.cli panel
```

```bash
uv run python -m aerodex.cli collect --slot morning --date 2026-09-01 --store
```

```bash
uv run python -m aerodex.cli index
```

Start the API against that database and the same dashboard serves collected
data with `data_source: "database"` instead. Nothing in the frontend changes —
it reads the field rather than assuming.

```bash
uv run uvicorn aerodex.api:app --reload --port 8000
```

### 3. The dashboard alone

```bash
cd frontend && npm install && npm run dev
```

Expects an API on `http://127.0.0.1:8000`. Point it elsewhere with
`AERODEX_API_ORIGIN`.

---

## Architecture

```
                    config/methodology.yaml ──┐ (SHA-256 hashed into every row
                                              │  and every published artifact)
  scheduler ─► adapter ─► normalise ─► validate ─► store ─► index ─► publish
  (systemd    (3-tier    (fare       (plausibility (append-  (pure   (refuses
   timers)     ladder)    decompose,  rules,        only      fn)     unpublishable
                          dedup)      quarantine)   quote_raw)        runs)
                                                        │                │
                                                        ▼                ▼
                                                  Postgres +      static JSON
                                                  TimescaleDB     artifacts (R2)
                                                        │                │
                                                        └──► aerodex.api ◄┘
                                                                  │
                                                          frontend/ (Next.js)
```

### Repository layout

```
config/          methodology.yaml (hashed into every release), panel.yaml, calendar.yaml
aerodex/
  compliance.py  plan §7 rules as runtime assertions — the pitch depends on these
  acquire/       adapter ABC + the three-tier ladder; one file per source
  normalise/     fare decomposition, dedup, attribute tagging
  validate/      plausibility rules, quarantine
  index/         elementary (Jevons), aggregate (Lowe), impute, engine (pure)
  publish/       static artifacts; refuses unpublishable runs
  db/            schema.sql, SKIP LOCKED job queue
  api.py         read-only FastAPI service for the dashboard
  demodata.py    cached read-only view over demo/, for when there is no DB
  airports.py    city names and coordinates for the 23 panel airports
  cli.py         the five commands below
frontend/        Next.js dashboard — lib/api.ts is the only place it talks HTTP
demo/            frozen synthetic run: panel, index, hashes, artifacts
scripts/         make_demo_data.py, parse_dgca_weights.py, run_demo.sh
deploy/systemd/  timers, not cron (plan §5.1)
tests/golden/    the M6 guarantee — frozen panel, frozen expected index
```

---

## Methodology

The panel is defined in [`config/panel.yaml`](config/panel.yaml) and the index
in [`config/methodology.yaml`](config/methodology.yaml). Neither may move into
Python: config in code is not auditable, and the methodology file is hashed
into every published number.

| Dimension | Value |
| --- | --- |
| Routes | 60 directional O–D pairs, 23 airports, 6 origin hubs |
| Booking horizons | 1, 3, 7, 14, 21, 30, 60 days before departure |
| Collection slots | 07:00, 13:00, 20:00 IST (±15 min tolerance) |
| Stratum | route × horizon → 420 strata |
| Nominal load | 420 strata × 3 slots = 1,260 stratum-slots/day (~1,155 after overlap suppression) |
| Elementary index | Jevons — geometric mean of price relatives |
| Aggregation | Lowe, DGCA traffic weights, vintage `dgca-2025-city-pairs-r2` |
| Base | 2026-09 = 100 |
| Imputation ceiling | 5% of weight (M5) — breaching it refuses publication |
| Revision | Provisional 7 days, revised once on day 7, frozen after |

**Why Jevons.** Carli has known upward bias; Dutot is not unit-invariant and is
wrong for heterogeneous items. **Why Lowe.** Weights come from a period prior to
the base, which is what a traffic-weighted index of a volatile good needs.

Festival and vacation windows live in
[`config/calendar.yaml`](config/calendar.yaml) — hand-maintained, ~30 rows a
year, deliberately not over-engineered.

---

## CLI reference

```bash
uv run python -m aerodex.cli <command>
```

| Command | What it does |
| --- | --- |
| `panel` | Panel shape, sizing arithmetic, config hashes |
| `init-db` | Apply the schema (idempotent) |
| `collect` | Run one slot's collection |
| `index` | Compute the index from the database or a CSV |
| `verify` | M6 check — recompute an archived panel, diff the hash |

<details>
<summary><strong>Flags</strong></summary>

**`collect`**

| Flag | Meaning |
| --- | --- |
| `--source SOURCE` | Adapter to run |
| `--slot {morning,afternoon,evening}` | Which fixed IST slot |
| `--date YYYY-MM-DD` | Collection date (default: today) |
| `--limit N` | Cap requests, for smoke tests |
| `--store` | Write to the database |

**`index`**

| Flag | Meaning |
| --- | --- |
| `--panel-csv PATH` | Read the panel from CSV instead of the database |
| `--out PATH` | Write the index as JSON |
| `--allow-unweighted` | Compute with uniform weights when panel weights are missing |
| `--publish` | Run the result through the publisher — it refuses rather than emitting an unpublishable release (exit 3) |
| `--source NAME` | Declare a panel source for the publisher's synthetic check (repeatable) |
| `--allow-synthetic` | Let a fixture-derived panel past the synthetic refusal — demos only |
| `--artifacts-dir PATH` | Write the release here when the publisher accepts it |

**`verify`**

| Flag | Meaning |
| --- | --- |
| `--panel-csv PATH` | Panel to recompute |
| `--hashes PATH` | Expected-hash file to diff against |

</details>

### Reproduce a published number

The claim the project rests on. Recompute the demo index from its archived
panel and diff the output hash:

```bash
uv run python -m aerodex.cli verify --panel-csv demo/panel.csv.gz --hashes demo/expected_hashes.json
```

```
unweighted  expected: ccc3b266b08f58c047849aa1430f523cc36062fba703bead7f8aa87b160ed0d5
            actual  : ccc3b266b08f58c047849aa1430f523cc36062fba703bead7f8aa87b160ed0d5   OK
weighted    expected: c3523b87decc713ac2a9983379a7350831905c6374efc8917d5f21192938ba27
            actual  : c3523b87decc713ac2a9983379a7350831905c6374efc8917d5f21192938ba27   OK

REPRODUCIBLE
```

That weighted hash is the one the dashboard shows as **Published output**.

### Watch the publisher refuse

Two things can make a run unpublishable, and `--publish` shows both. The
verdict prints last, after the series, and sets exit code 3.

**A fixture-derived number is not a measurement.** This is the refusal the
whole project rests on, and it fires on the *good* panel:

```bash
uv run python -m aerodex.cli index --panel-csv demo/panel.csv.gz --publish --source fixture
```

```
PUBLICATION REFUSED
  panel contains only synthetic sources ['fixture']; a fixture-derived number
  is not a measurement (Phase 0 spike S3 pending)

No artifacts were written.
```

**A coverage hole past the M5 ceiling.** `demo/breach/` is the same collection
with a hole big enough to push imputed weight to 11.9%. Waive the synthetic
refusal and it still will not publish:

```bash
uv run python -m aerodex.cli index --panel-csv demo/breach/panel.csv.gz \
  --publish --source fixture --allow-synthetic
```

```
PUBLICATION REFUSED
  imputed weight share exceeded 5% (M5) for period(s): 2026-09-21, 2026-09-22,
  2026-09-23, 2026-09-24. Publish the coverage failure, not a prettier number.

No artifacts were written.
```

Neither run writes a file — not even the artifacts directory. The failure is a
refusal, not a footnote.

Without `--publish`, `index` computes and prints as before: it warns on a
breach and exits 1, but never reaches the publisher.

---

## HTTP API

`aerodex.api` is a read-only FastAPI service (plan §5.6). Production serves
static JSON artifacts from Cloudflare R2/Pages; this service exists for local
development, demos, and ad-hoc analytical queries via Cloudflare Tunnel.

```bash
uv run uvicorn aerodex.api:app --reload --port 8000
```

Interactive docs at `/docs`. Every endpoint tries the database first and falls
back to `demo/`, reporting which in `data_source`.

| Endpoint | What it returns |
| --- | --- |
| `GET /api/v1/health` | Which data source is live, and the period being served |
| `GET /api/v1/index/latest` | Latest index value plus provenance — mirrors `index_latest.json` |
| `GET /api/v1/index/history?days=` | Headline series plus per-route fare series over the same periods |
| `GET /api/v1/routes` | The panel definition — O–D pairs, DGCA weights, airport coordinates |
| `GET /api/v1/routes/trackers?limit=` | Per-route cards: fare now, change, sparkline |
| `GET /api/v1/routes/{origin}/{dest}` | One route: fare by horizon, by carrier, over time |
| `GET /api/v1/search?origin=&destination=&horizon=` | The quotes collected for one stratum |
| `GET /api/v1/alerts` | Threshold crossings derived from the panel |
| `GET /api/v1/health/nodes` | Collection volume by region |
| `GET /api/v1/pipeline/status` | Provenance, quality gates, compliance rules |
| `GET /api/v1/methodology` | Methodology config — mirrors `methodology.json` |

### The `data_source` contract

Every response that carries data also carries where it came from:

```jsonc
{
  "value": 107.4366,
  "period": "2026-09-30",
  "data_source": "demo-synthetic",   // or "database"
  "synthetic": true,
  "notice": "Fixture-derived demo data. …Not a measurement."
}
```

Clients must render that distinction. The dashboard does; anything else built
on this API is expected to.

---

## Dashboard

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Recharts. See
[frontend/README.md](frontend/README.md) for the design system and component
notes.

| Route | What it shows |
| --- | --- |
| `/` | Panel query, headline stats, heaviest corridors, provenance, route map |
| `/price-tracking` | All 60 routes — sortable, filterable, with sparklines |
| `/alerts` | Threshold crossings computed from the panel |
| `/history` | The index series, and the corridor fares it aggregates |
| `/routes/{origin}/{destination}` | One route: over time, by horizon, by carrier |
| `/landing` | Marketing page (separate route group, no dashboard shell) |

```bash
cd frontend
npm run dev      # dev server
npm run build    # production build
npm run start    # serve the build
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

The dashboard calls `/api/*` same-origin and `next.config.ts` rewrites it to
the API, so CORS never enters the picture in development.

---

## Configuration

### Environment variables

| Variable | Used by | Default | Meaning |
| --- | --- | --- | --- |
| `AERODEX_DSN` | pipeline, API | — | Postgres connection string. Unset ⇒ API falls back to `demo/` |
| `AERODEX_CORS_ORIGINS` | API | — | Extra allowed origins, comma-separated |
| `AERODEX_API_ORIGIN` | frontend build | `http://127.0.0.1:8000` | Where Next proxies `/api/*` |
| `NEXT_PUBLIC_API_URL` | frontend runtime | `""` (same-origin) | Bypass the proxy, call an API directly |
| `API_PORT` / `WEB_PORT` | `run_demo.sh` | `8000` / `3000` | Demo ports |

### Config files

| File | Role |
| --- | --- |
| `config/methodology.yaml` | Index definition. SHA-256 hashed onto every row and artifact |
| `config/panel.yaml` | The 60 routes, their DGCA weights, horizons, slots, rate limits |
| `config/calendar.yaml` | Festival and vacation windows |

Changing `methodology.yaml` changes the config hash — by design, and the
golden tests fail as a result. That is the mechanism working, not a problem to
route around.

---

## Data & provenance

`demo/` is a frozen, deterministic run of the real pipeline against the fixture
adapter. It is regenerated by one command, with no Docker, database or network:

```bash
uv run python scripts/make_demo_data.py
```

Deterministic — fixed dates, hash-seeded adapter, no clock reads, gzip written
with `mtime=0`. Re-running reproduces all 11 generated files byte-for-byte, so
a changed `sha256` in `MANIFEST.json` means an input actually moved.

| File | What it is |
| --- | --- |
| `panel.csv.gz` | 75,552 rows — 30 daily periods, 60 routes × 7 horizons |
| `index.csv` / `index.json` | The index computed from it, DGCA-weighted |
| `expected_hashes.json` | Frozen M6 hashes for `aerodex verify` |
| `artifacts/` | What the publisher emits |
| `breach/` | The same collection with an M5-breaching coverage hole |
| `MANIFEST.json` | Provenance, shape, hashes, and the demand shaping applied |

Full detail, including why the fares move the way they do, is in
[demo/README.md](demo/README.md).

> **None of it is a measurement.** Every fare comes from `source='fixture'`,
> which makes no network calls and prices nothing real. Do not put a number
> from that folder in a slide that claims to show Indian airfares.

---

## The two invariants

`quote_raw` **is append-only.** Enforced by database triggers on UPDATE,
DELETE *and* TRUNCATE — not by code review. M6 depends on it.

**The index engine is a pure function.** `compute_index(panel, config)` reads
no clock, no database and no network. A test asserts the module never acquires
one of those imports, because the failure would only show up as a moved
published number months later.

---

## Testing

```bash
uv run pytest -q
```

148 pass, 7 skip without a database (the `SKIP LOCKED` queue tests). Bring up
`docker compose up -d` and set `AERODEX_DSN` to run those too.

```bash
uv run pytest tests/golden -q            # the M6 guarantee
uv run pytest tests/unit -q              # everything else
uv run pytest -q -k compliance           # plan §7 assertions
```

The golden tests are the ones that matter: a frozen input panel and a frozen
expected output, checked in. Change one value in `methodology.yaml` and they
fail — that is the audit trail doing its job. If a change is intentional,
re-freeze deliberately and say so in the commit — **never "fix" a golden test
by re-freezing it.**

---

## Compliance

No authentication, no CAPTCHA solving, no fingerprint spoofing, no proxies. A
minimum 20 s between requests to the same host, `robots.txt` parsed and honoured
at run time (unreachable means *disallowed*), and a `User-Agent` that names the
project and links here. When a source blocks, the source is dropped and the
coverage ratio is published — redundancy instead of evasion.

These live in `aerodex/compliance.py` as assertions, so violating one requires
deliberately editing a file called `compliance.py`.

---

## Contributing

### Setting up

```bash
git clone https://github.com/Naveen-Boddepalli/aerodex.git
cd aerodex
uv sync --extra dev
(cd frontend && npm install)
```

Optional, for the database-backed tests:

```bash
docker compose up -d
export AERODEX_DSN=postgresql://aerodex:aerodex@localhost:5433/aerodex
uv run python -m aerodex.cli init-db
```

### Before you open a PR

Run what CI runs. All four must pass:

```bash
uv run ruff check .
```

```bash
uv run pytest -q
```

```bash
uv run python -m aerodex.cli verify
```

```bash
cd frontend && npx tsc --noEmit && npm run build
```

`mypy` is configured in `pyproject.toml` and worth running on anything you
touch (`uv run mypy aerodex/`), though it is not yet a CI gate — `cli.py` has
four known errors.

### Commits and branches

Branch off `main`. Conventional Commits, as in the existing history:

```
feat: add tier-2 adapter for <source>
fix: clamp price relatives before the Jevons mean
docs: document the data_source contract
```

Say *why* in the body when the change is not self-evident — especially for
anything touching methodology, hashes, or compliance.

### The rules that are not style preferences

These exist because breaking them produces a wrong published number, and a
wrong published number is invisible until someone audits it months later.

1. **Never re-freeze a golden test to make it pass.** A golden failure means
   the index moved. Establish why first. If the move is intended, re-freeze in
   its own commit and explain the change in the message.

2. **Keep the index engine pure.** No clock, no database, no network in
   `aerodex/index/engine.py` or its imports. A test enforces this.

3. **Do not weaken `compliance.py`.** The rate limit, the `robots.txt`
   handling, and the no-evasion rules are the project's licence to operate. If
   a source needs something those rules forbid, drop the source and publish the
   coverage ratio.

4. **Configuration stays in `config/*.yaml`.** Methodology in Python is not
   auditable, and the config hash is what makes a release reproducible.

5. **Never present synthetic data as measured.** Anything rendered from `demo/`
   must carry `data_source` through to something the reader can see. Do not add
   UI that implies a capability the project lacks — accounts, notifications,
   bookings, live sources — and label design targets as targets, not metrics.

### Frontend conventions

- **`lib/api.ts` is the only place the frontend performs HTTP.** Add a typed
  fetcher there; do not call `fetch` from a component.
- Fetchers return `{ data, error }` rather than throwing. Render all three
  states — loading, error, empty — using `components/states.tsx`. A panel that
  cannot load must say so in place, not spin forever.
- Recharts: pass `isAnimationActive={false}`. A throttled `requestAnimationFrame`
  leaves entrance animations stalled and charts blank, which is fatal in a live
  demo. Sparklines also need an explicit
  `<YAxis domain={["dataMin", "dataMax"]} />`, or the axis anchors at 0 and
  flattens a ₹9,000 fare series into a straight line.
- Any animated counter must fall back to the true value, never to `0`.

### Adding a source adapter

Gated on spike S3 — see [docs/research/s3/](docs/research/s3/). When it lands:
subclass the adapter ABC in `aerodex/acquire/`, one file per source, declare
its tier, and add a canary test. The compliance assertions apply automatically;
do not route around them.

### Reporting problems

Open an issue at
[Naveen-Boddepalli/aerodex/issues](https://github.com/Naveen-Boddepalli/aerodex/issues).
For anything touching a published number, include the `config_hash`,
`panel_hash` and `output_hash` from the run — they are on every artifact and in
the dashboard's provenance panel.

---

## Attribution

Route weights derive from DGCA traffic data via
[`Vonter/india-aviation-traffic`](https://github.com/Vonter/india-aviation-traffic)
(ODbL).
