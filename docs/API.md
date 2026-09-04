# AeroDex HTTP API reference

**Audience:** an integrator consuming the Domestic Airfare Price Index (DAPI)
programmatically — NSO, RBI, or a reviewer checking a published number.

**Version:** `0.2.0` · all paths under `/api/v1` · read-only (`GET`) throughout.

A machine-readable OpenAPI document is committed at
[`openapi.json`](openapi.json) and served live at `/openapi.json`; interactive
docs are at `/docs`.

> **Read [The provenance contract](#the-provenance-contract) before you store,
> chart or publish anything this API returns.** Every response says whether its
> numbers are measurements or fixture output. A client that ignores that field
> will eventually present synthetic fares as an official statistic.

**Contents** · [Running it](#running-it) · [Provenance](#the-provenance-contract) ·
[Serving modes](#serving-modes) · [Endpoints](#endpoints) · [Errors](#errors) ·
[Verifying a number](#verifying-a-published-number) · [Stability](#versioning-and-stability) ·
[Limitations](#known-limitations)

---

## Running it

```bash
uv run uvicorn aerodex.api:app --port 8000
```

Production serving is static JSON artifacts on object storage; this service
exists for local development, for the dashboard, and for ad-hoc programmatic
queries through a Cloudflare Tunnel. See [OPERATIONS.md](OPERATIONS.md).

Base URL in the examples below is `http://localhost:8000`.

---

## The provenance contract

Every response carrying data also carries where that data came from. This is
the load-bearing part of the API, not a convenience field.

```jsonc
{
  "value": 107.4366,
  "period": "2026-09-30",
  "data_source": "demo-synthetic",
  "synthetic": true,
  "notice": "Fixture-derived demo data. …Not a measurement."
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `data_source` | `"database"` \| `"demo-synthetic"` \| `"panel-config"` | Where the numbers came from |
| `synthetic` | `bool` | `true` when no value in the response was collected from a real source |
| `notice` | `string \| null` | Human-readable caveat; `null` when the data is a measurement |

| `data_source` | Means |
| --- | --- |
| `database` | Collected quotes. A measurement. |
| `demo-synthetic` | The frozen fixture run in `demo/`. **Not a measurement**, and must never be presented as one. |
| `panel-config` | Configuration only — the panel definition with no fares attached. True with or without a collection run, so it is neither of the other two. |

**Obligations on a client.** If you render, redistribute or store a response
with `synthetic: true`, you must carry the distinction through to whoever sees
it. The reference dashboard does this with a banner that collapses but cannot
be dismissed. This is the same rule the publisher enforces server-side: a
fixture-derived index is refused for release unless `--allow-synthetic` is
passed explicitly (see [Verifying a published number](#verifying-a-published-number)).

`GET /api/v1/health` is the cheapest way to ask which mode the service is in
before you begin a bulk read.

---

## Serving modes

Each endpoint reads the database first and falls back to the frozen demo
dataset when no database is reachable. Not every endpoint has a database path
yet, and an integrator needs to know which:

| Endpoint | Database path | Notes |
| --- | --- | --- |
| `/health` | yes | probes with `SELECT 1` |
| `/index/latest` | yes | reads `index_point` |
| `/index/history` | yes | reads `index_point` + `quote_clean` |
| `/routes` | yes | fares from `quote_clean`, definition from `panel.yaml` |
| `/routes/trackers` | yes | reads `quote_clean` |
| `/health/nodes` | yes | reads `adapter_health` |
| `/routes/{origin}/{destination}` | **no** | demo dataset only |
| `/search` | **no** | demo dataset only |
| `/alerts` | **no** | demo dataset only |
| `/pipeline/status` | **no** | demo dataset only |
| `/methodology` | n/a | reads `config/methodology.yaml`; configuration, not data |

The four demo-only endpoints always report `data_source: "demo-synthetic"`,
**even against a populated database**. That is a deliberate absence of a
feature rather than a mislabelling, but it does mean those four are not yet
suitable for consuming production numbers. Tracked in
[Known limitations](#known-limitations).

`index_point` is written by `aerodex index --store`; without that step the
index endpoints have nothing to read and will serve the demo dataset. See
[OPERATIONS.md](OPERATIONS.md).

---

## Endpoints

### `GET /api/v1/health`

Which data source is live. Cheap; safe to poll.

```bash
curl -s localhost:8000/api/v1/health
```

| Field | Type | Meaning |
| --- | --- | --- |
| `status` | `"ok"` \| `"degraded"` | `degraded` = neither database nor demo dataset available |
| `database` | `"connected"` \| `"unavailable"` \| `"error"` | `unavailable` is the expected demo case; `error` means the database answered but could not serve the probe query — a fault worth alerting on |
| `demo_dataset` | `"present"` \| `"missing"` | whether `demo/` is on disk |
| `data_source`, `synthetic`, `notice` | — | [provenance](#the-provenance-contract); `data_source` is `null` when nothing is available |
| `period` | `string \| null` | latest period in the demo dataset, when serving from it |

### `GET /api/v1/index/latest`

The headline index value and everything needed to reproduce it. Mirrors the
published `index_latest.json` artifact.

| Field | Type | Meaning |
| --- | --- | --- |
| `index` | `string` | Series name |
| `period` | `string` | Reference period, `YYYY-MM-DD` |
| `value` | `float` | Index level, 4 dp |
| `previous_value` | `float \| null` | Preceding period's level |
| `base_period` | `string` | Reference base, e.g. `2026-09` |
| `base_value` | `float` | Index level at base (100.0) |
| `coverage_ratio` | `float` | Share of strata that reported, 5 dp |
| `imputed_weight_share` | `float` | Share of index weight imputed — the M5 metric, published, never absorbed |
| `n_quotes` | `int` | Observations behind the period |
| `n_strata_reported` | `int` | Strata that produced an observed relative |
| `n_routes` | `int` | Routes in the panel |
| `is_provisional` | `bool` | Within the revision window (see `/methodology`) |
| `config_hash` | `string` | SHA-256 of the methodology that produced this number |
| `panel_hash` | `string` | SHA-256 of the input panel |
| `output_hash` | `string` | SHA-256 of the computed series; `""` on the database path, which does not store it |
| `weights_vintage` | `string` | Weight set identifier, e.g. `dgca-2025-city-pairs-r2` |
| `data_source`, `synthetic`, `notice` | — | [provenance](#the-provenance-contract) |

The three hashes are what make the number checkable — see
[Verifying a published number](#verifying-a-published-number).

### `GET /api/v1/index/history`

Headline series plus per-route fare series over the same periods.

| Parameter | Type | Default | Range |
| --- | --- | --- | --- |
| `days` | `int` | 30 | 7–365 |

| Field | Type | Meaning |
| --- | --- | --- |
| `headline[]` | array | `period`, `date`, `value`, `coverage_ratio`, `imputed_weight_share`, `n_quotes`, `is_base` |
| `routes[]` | array | Series metadata: `key`, `route`, `label`, `cities`, `color`, `weight`. **The eight heaviest-weighted routes only** |
| `data[]` | array | One row per period: `period`, `date`, `index`, plus one rupee value per route key |
| `days` | `int` | Periods returned |

`routes[]` is capped at eight so the series stays chartable. For all 60 routes
use [`/routes`](#get-apiv1routes) or [`/routes/trackers`](#get-apiv1routestrackers).

### `GET /api/v1/routes`

The panel definition — every O–D pair with its DGCA weight and airport
metadata — plus current fares where a collection run exists.

| Field | Type | Meaning |
| --- | --- | --- |
| `routes[]` | array | `id`, `origin` / `destination` (airport objects), `weight`, `medianFare`, `bestFare`, `quotes`. Fare fields are `null` / `0` before any collection |
| `airports[]` | array | `iata`, `city`, `name`, `lat`, `lon`, `region` |
| `bounds` | object | `lat_min`, `lat_max`, `lon_min`, `lon_max` — map projection bounds |
| `horizons[]` | `int[]` | Advance-purchase windows the panel collects, in days |
| `count` | `int` | Routes returned |
| `data_source`, `synthetic`, `notice` | — | [provenance](#the-provenance-contract) |

### `GET /api/v1/routes/trackers`

Per-route cards. Returns a **bare JSON array**, not an object — so it carries
no envelope-level provenance fields. Call `/health` alongside it to establish
the serving mode.

| Parameter | Type | Default | Range |
| --- | --- | --- | --- |
| `limit` | `int` | 60 | 1–200 |

Each element: `id`, `from`, `fromCity`, `to`, `toCity`, `stops`, `price`
(median fare, ₹), `bestPrice`, `prevPrice`, `change`
(`"drop"` \| `"rise"` \| `"stable"`), `changePct`, `changeAmt`, `volume`,
`airline`, `carrier`, `cabin`, `weight`, `horizonDays`, `departureDate`,
`dates`, `period`, `updated`, `alertOn`, `data[]` (sparkline of `{v, period}`).

### `GET /api/v1/routes/{origin}/{destination}`

One route in depth. IATA codes, case-insensitive. **Demo dataset only.**

| Field | Type | Meaning |
| --- | --- | --- |
| `byHorizon[]` | array | `horizon_days`, `departure_date`, `best_fare`, `median_fare`, `n_quotes` — the lead-time curve |
| `byCarrier[]` | array | `carrier`, `airline`, `best_fare`, `median_fare`, `n_quotes`, `share`, cheapest first |
| `series[]` | array | `period`, `date`, `best`, `median`, `quotes` over the collection run |
| `weight` | `float` | DGCA panel weight |

`404` when the route is not in the panel.

### `GET /api/v1/search`

The quotes the panel holds for one route and advance-purchase window. This is
a query over collected observations, **not a booking search** — AeroDex
measures fares, it does not sell them. **Demo dataset only.**

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `origin` | `string` | required | IATA |
| `destination` | `string` | required | IATA |
| `horizon` | `int` | 7 | must be one of the panel's horizons |
| `limit` | `int` | 12 | 1–100 |

Returns `nQuotes` and `quotes[]` (`itineraryKey`, `flight`, `carrier`,
`airline`, `fare`, `stops`, `stopsLabel`, `durationMinutes`,
`departureBucket`), cheapest first. `400` on an off-panel horizon, `404` when
the stratum holds no quotes.

### `GET /api/v1/alerts`

Threshold crossings derived from the panel — each route's threshold is the
median of its own daily cheapest fare across the run. There is no per-user
alert store; these are computed, not subscribed. **Demo dataset only.**

| Parameter | Type | Default | Range |
| --- | --- | --- | --- |
| `limit` | `int` | 60 | 1–200 |

Returns `alerts[]`, `summary` (`triggered`, `watching`, `total`,
`deepestDropPct`) and `period`.

### `GET /api/v1/health/nodes`

Collection volume by source (database) or by region (demo). Returns a **bare
JSON array**; see the note under `/routes/trackers`.

### `GET /api/v1/pipeline/status`

Provenance, quality gates and compliance rules behind the current run —
hashes, panel shape, coverage, the imputation ceiling, and the `verify`
command that reproduces the number. **Demo dataset only.**

### `GET /api/v1/methodology`

The methodology configuration, mirroring the published `methodology.json`:
`config_hash`, `elementary_formula`, `aggregation`, `weights_vintage`,
`imputation_ceiling`, `revision_policy`, and the full `config` object.

Configuration rather than data, so it carries no provenance fields. `404` if
`config/methodology.yaml` is absent.

---

## Errors

Standard HTTP status codes; the body is FastAPI's `{"detail": "..."}`.

| Status | When |
| --- | --- |
| `400` | Parameter outside the panel — e.g. an advance-purchase window the panel does not collect |
| `404` | Route not in the panel, stratum holds no quotes, or methodology config missing |
| `422` | Parameter fails validation (wrong type, outside the documented range) |
| `503` | No data source: the database is unreachable **and** `demo/` is missing |

There is no error path that silently substitutes one kind of data for another.
A fallback from database to demo always changes `data_source` — it never
returns a `200` that misrepresents its own origin.

---

## Verifying a published number

Every index value ships with the hashes needed to recompute it from archived
inputs. That is the point of the project, and it is exercisable from a
checkout:

```bash
uv run python -m aerodex.cli verify --panel-csv demo/panel.csv.gz --hashes demo/expected_hashes.json
```

This re-reads the archived panel, re-runs the index engine with the archived
config, and diffs the output hash. `REPRODUCIBLE` means the published number
is recomputable from the published inputs.

The three hashes on `/index/latest` correspond to:

| Hash | Covers | Changes when |
| --- | --- | --- |
| `config_hash` | `config/methodology.yaml`, canonicalised | any methodology **value** changes (reordering keys or reflowing comments does not) |
| `panel_hash` | the input panel's identity columns, sorted | any input observation changes |
| `output_hash` | the computed series, rounded to 6 dp | any published number moves |

---

## Versioning and stability

The version prefix is `/api/v1`. Within it:

- **Fields are added, not removed or retyped.** A new field may appear in a
  response without a version bump; parse permissively.
- **`data_source` may gain new values.** Treat an unrecognised value as
  "not a measurement" and surface it, rather than assuming it is `database`.
- A breaking change to an existing field's meaning or type gets `/api/v2`.

`app.version` (`0.2.0`) tracks the service; it is not the index's vintage. The
statistical vintage is `weights_vintage` plus `config_hash`.

---

## Known limitations

Stated plainly because an integrator will otherwise discover them at an
inconvenient moment.

1. **The OpenAPI document has no response schemas.** Endpoints return bare
   dictionaries, so `openapi.json` describes every 200 body as
   `{"type": "object"}`. The field tables above are the contract; the
   machine-readable document is useful for paths and parameters only. Adding
   Pydantic response models would fix this and is the recommended next step.
2. **Four endpoints are demo-only** — `/routes/{o}/{d}`, `/search`, `/alerts`,
   `/pipeline/status`. They report `demo-synthetic` even against a populated
   database. See [Serving modes](#serving-modes).
3. **`output_hash` is empty on the database path.** `index_point` has no column
   for it; the value is present on the published artifacts and the demo path.
4. **No authentication or rate limiting.** The service is read-only and
   publishes nothing sensitive, but it is not hardened for direct exposure to
   the public internet. Front it with a tunnel or reverse proxy that applies
   your own policy.
5. **`/routes/trackers` and `/health/nodes` return bare arrays**, so they carry
   no envelope-level provenance. Pair them with `/health`.
6. **Fare components are estimated, not collected.** AeroDex collects
   all-inclusive fares; the base/tax/UDF split shown in the dashboard is
   derived from statutory rates. See
   [DATA_DICTIONARY.md](DATA_DICTIONARY.md#fare-components-are-estimated).

---

## See also

- [DATA_DICTIONARY.md](DATA_DICTIONARY.md) — every stored field, and how the
  problem statement's required metadata maps onto the schema
- [OPERATIONS.md](OPERATIONS.md) — deploying, scheduling and running the pipeline
- [TESTING.md](TESTING.md) — what the automated tests guarantee
- [../README.md](../README.md) — project overview, CLI reference, methodology
