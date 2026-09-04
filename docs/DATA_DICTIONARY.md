# AeroDex data dictionary

Every field AeroDex stores, what it means, and where it comes from. The
authoritative definition is [`aerodex/db/schema.sql`](../aerodex/db/schema.sql);
this document explains it.

**Contents** · [Problem-statement coverage](#problem-statement-coverage) ·
[Panel structure](#panel-structure) · [`quote_raw`](#quote_raw) ·
[`quote_clean`](#quote_clean) · [`index_point`](#index_point) ·
[`job`](#job) · [`adapter_health`](#adapter_health) ·
[Enumerations](#enumerations) · [Units and conventions](#units-and-conventions)

---

## Problem-statement coverage

PS SIH26056 requires "a cleaned and de-duplicated airfare database with
metadata such as origin, destination, carrier, advance-purchase window,
fare-class, base fare, taxes and total fare." Mapping each onto the schema,
including the two that are **not** collected:

| PS field | Where it lives | Status |
| --- | --- | --- |
| origin | `quote_clean.origin` — IATA, `CHAR(3)` | collected |
| destination | `quote_clean.destination` — IATA, `CHAR(3)` | collected |
| carrier | `quote_clean.carrier` (IATA designator) + `carrier_type` | collected |
| advance-purchase window | `quote_clean.horizon_days` | collected — see [the horizon divergence](#advance-purchase-windows) |
| fare-class | `quote_clean.cabin`; `quote_raw.fare_brand` holds the airline's own brand label | collected |
| **total fare** | `quote_clean.fare_inr_paise` — all-inclusive, in paise | collected |
| **base fare** | — | **estimated, not collected** |
| **taxes** | — | **estimated, not collected** |

De-duplication is `quote_clean`'s `UNIQUE (itinerary_key, collected_at, source)`
plus the lowest-fare rule in
[`normalise_quotes`](../aerodex/normalise/normalise.py): one product, one
observation per collection slot, priced at the cheapest all-inclusive offer
across sources.

### Fare components are estimated

AeroDex collects the **all-inclusive fare** — the number a traveller actually
pays. It does not store a base/tax split, because obtaining a genuine one
means scraping checkout pages or airline booking APIs behind authentication,
which the compliance rules forbid (see [§7 of the plan](../plan.md) and
`aerodex/compliance.py`).

The decomposition shown on the dashboard is therefore **derived, not observed**,
computed client-side in
[`FareBreakupPanel.tsx`](../frontend/components/FareBreakupPanel.tsx) by
applying published statutory rates to the observed total:

| Component | Basis |
| --- | --- |
| Airport UDF | AAI-published per-airport rate, FY 2025-26, per departing passenger |
| Statutory taxes | GST 5% (economy) + PSF ₹130 + ASF ₹10 |
| Fuel surcharge | Estimated at 20% of base+surcharge (YQ/YR industry average) |
| Dynamic surge | Observed fare − 30-day route median; zero when at or below median |
| Base fare | Total, less the above |

Only the statutory components are fixed by law; the surcharge split and surge
are inferred. The panel is labelled "Estimated decomposition" in the UI for
that reason. **These estimates are presentation-layer only — no index number
depends on them.** The index is computed on the all-inclusive total, which is
the correct base for a consumer price index in any case.

### Advance-purchase windows

The PS specifies T+1, T+7, T+15, T+30, T+45. The panel
([`config/panel.yaml`](../config/panel.yaml)) collects:

```
horizons_days: [1, 3, 7, 14, 21, 30, 60]
```

| PS window | Panel | Note |
| --- | --- | --- |
| T+1 | 1 | exact |
| T+7 | 7 | exact |
| T+15 | **14** | one day short |
| T+30 | 30 | exact |
| T+45 | **60** | nearest window is 15 days longer |
| — | 3, 21 | additional windows the PS does not require |

Seven windows against the PS's five, three matching exactly. The two that
differ are a deliberate choice of round-number booking horizons, not an
oversight, but they are a divergence from the letter of the PS and a reviewer
should see it stated rather than discover it.

Changing them is not a documentation edit: `horizons_days` is part of the
hashed panel configuration, so altering it changes the stratum set, the weight
split across horizons, and every golden hash. If the team decides to match the
PS exactly, do it as a deliberate vintage change with the golden fixtures
re-frozen in the same commit.

---

## Panel structure

The unit of collection is a **stratum-slot**: one route, one advance-purchase
window, one time-of-day slot.

| Concept | Definition | Count |
| --- | --- | --- |
| Route | Directional O–D pair, e.g. `DEL-BOM`. `BOM-DEL` is a separate route | 60 |
| Horizon | Advance-purchase window in days | 7 |
| Stratum | `route @ horizon`, e.g. `DEL-BOM@7d` | 420 |
| Slot | Fixed IST collection window — morning, afternoon, evening | 3 |
| Stratum-slots/day | strata × slots | 1,260 |

Route weights come from DGCA city-pair passenger traffic and are carried in
`config/panel.yaml` under the vintage `dgca-2025-city-pairs-r2`. A route's
weight is split evenly across its horizons to give each stratum its weight.

---

## `quote_raw`

One row per parsed observation, exactly as the adapter saw it. **Append-only** —
a trigger rejects `UPDATE` and `DELETE`, because M6 reproducibility depends on
the archive being immutable. A TimescaleDB hypertable partitioned on
`collected_at`, compressed after 30 days.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `BIGSERIAL` | Surrogate key; `quote_clean.raw_id` points here |
| `collected_at` | `TIMESTAMPTZ` | **Actual** collection time, never the nominal slot time. A slot is a ±15 min window; recording the real timestamp is what makes late collection degrade gracefully instead of silently corrupting the stratum |
| `slot` | `collection_slot` | Nominal slot this observation belongs to |
| `source` | `TEXT` | Adapter name, e.g. `fixture` |
| `origin` / `destination` | `CHAR(3)` | IATA codes |
| `departure_date` | `DATE` | Flight departure date |
| `horizon_days` | `SMALLINT` | Advance-purchase window: `departure_date − collection date` |
| `cabin` | `TEXT` | Fare class; defaults to `economy` |
| `fare_inr_paise` | `BIGINT` | **All-inclusive** fare in paise. Integer minor units — floats do not belong near a published price statistic |
| `currency` | `CHAR(3)` | `INR` |
| `carrier` | `TEXT` | IATA airline designator, e.g. `6E` |
| `flight_number` | `TEXT` | e.g. `6E1033` |
| `stops` | `SMALLINT` | 0 = non-stop |
| `departure_time` / `arrival_time` | `TIME` | Local scheduled times |
| `duration_minutes` | `INTEGER` | Total journey time |
| `aircraft_type` | `TEXT` | Equipment, when published |
| `fare_brand` | `TEXT` | Airline's own fare-brand label, e.g. `SAVER` |
| `is_refundable` | `BOOLEAN` | Hedonic characteristic |
| `baggage_included` | `BOOLEAN` | Hedonic characteristic |
| `seats_remaining` | `SMALLINT` | Scarcity signal as displayed |
| `payload` | `JSONB` | Parsed structured response. **Parsed JSON only, never raw HTML** — third-party page content is not redistributed |
| `raw_sha256` | `CHAR(64)` | SHA-256 of the raw response body. The body itself is not archived; the hash preserves the audit trail without redistributing the content |
| `adapter_version` | `TEXT` | Bumped whenever parsing changes, so archived rows stay interpretable |
| `acquisition_tier` | `SMALLINT` | 1 = public JSON, 2 = internal XHR, 3 = rendered |

---

## `quote_clean`

Normalised, validated observations — the table the index reads. Also a
hypertable on `collected_at`.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `BIGSERIAL` | Surrogate key |
| `raw_id` | `BIGINT` | The `quote_raw` row this was derived from — the audit link from a published number back to an archived response |
| `collected_at`, `slot`, `source` | — | Carried from `quote_raw` |
| `origin`, `destination`, `departure_date`, `horizon_days`, `cabin` | — | Carried from `quote_raw` |
| `fare_inr_paise` | `BIGINT` | All-inclusive fare, paise. After de-duplication this is the **lowest** offer across sources for the product |
| `carrier` | `TEXT` | IATA designator |
| `carrier_type` | `TEXT` | `low_cost` \| `full_service` — derived from the designator |
| `stops` | `SMALLINT` | 0 = non-stop |
| `departure_time_bucket` | `TEXT` | Departure time coarsened to a bucket; a hedonic characteristic |
| `duration_minutes`, `is_refundable`, `baggage_included` | — | Hedonic characteristics |
| `itinerary_key` | `TEXT` | **Stable identity of the product being priced** — see below |
| `validation_status` | `validation_status` | `valid` \| `quarantined` \| `rejected` |
| `quarantine_reason` | `TEXT` | Why a row was held; `NULL` when valid |

**Uniqueness:** `(itinerary_key, collected_at, source)`.

### `itinerary_key`

```
ORIGIN|DEST|h{horizon}|{flight_number}|{stops}|{departure_bucket}|{cabin}
```

The crux of matched-model comparison. Keyed on the **booking horizon, not the
departure date**: the matched product is "flight 6E1033, priced 7 days before
departure", and today's price is compared with the 7-days-before-departure
price from yesterday. Those two observations necessarily have *different*
departure dates, so including the departure date here would leave every item
unmatched, collapse the matched sample to zero, and pin the index at its base
value forever.

Deliberately excluded: the fare and `seats_remaining` (they move — that is the
signal), and the source (the same flight quoted by two sources is one product
and must de-duplicate to a single observation).

### Validation rules

From `config/methodology.yaml`, applied in
[`validate/rules.py`](../aerodex/validate/rules.py). A failing row is
**quarantined, not deleted** — the quarantine queue is evidence about a
source's health, and silently dropping bad rows would make the coverage ratio
look better than the collection actually was.

| Rule | Threshold | Outcome |
| --- | --- | --- |
| Fare below floor | < ₹800 | quarantined |
| Fare above ceiling | > ₹200,000 | quarantined |
| Duration implausible | > 900 min | quarantined |
| Duration non-positive | ≤ 0 | quarantined |
| Fare non-positive | ≤ 0 | rejected |
| Origin equals destination | — | rejected |
| Negative booking horizon | — | rejected |

---

## `index_point`

One row per published index value. Written by `aerodex index --store`.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `BIGSERIAL` | Primary key |
| `period` | `DATE` | The period the value describes |
| `frequency` | `TEXT` | `daily` \| `weekly` \| `monthly` |
| `series` | `TEXT` | `headline`, or a cut such as `route:DEL-BOM` |
| `value` | `NUMERIC(12,6)` | Index level |
| `value_sa` | `NUMERIC(12,6)` | Seasonally adjusted, where applicable |
| `imputed_weight_share` | `NUMERIC(6,5)` | **M5** — share of index weight imputed. Published, never silently absorbed |
| `coverage_ratio` | `NUMERIC(6,5)` | Share of strata that reported |
| `n_quotes` | `INTEGER` | Observations behind the value |
| `config_hash` | `CHAR(64)` | **M6** — SHA-256 of the methodology |
| `weights_vintage` | `TEXT` | Weight set identifier |
| `panel_hash` | `CHAR(64)` | **M6** — SHA-256 of the input panel |
| `is_provisional` | `BOOLEAN` | Within the revision window |
| `revision_of` | `BIGINT` | The row this supersedes |
| `computed_at` | `TIMESTAMPTZ` | When the value was computed |

**Uniqueness:** `(period, frequency, series, config_hash)`. A recompute under
the same methodology refreshes the row; a methodology change lands as a *new*
row rather than overwriting the old one, which is what makes the revision
policy visible instead of destructive. The upsert additionally refuses to
touch a row whose `is_provisional` is false — a number published as final is
not silently rewritten.

There is no `output_hash` column; that hash lives on the published artifacts.

---

## `job`

The collection queue. Postgres `SELECT … FOR UPDATE SKIP LOCKED` rather than
Redis — this project runs ~1,260 tasks/day, and retries as a column plus job
history in the same SQL is worth more than a second piece of infrastructure.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `BIGSERIAL` | Primary key |
| `kind` | `TEXT` | `collect` \| `index` \| `publish` |
| `payload` | `JSONB` | Job arguments |
| `status` | `job_status` | `pending` \| `running` \| `done` \| `failed` \| `dead` |
| `scheduled_for` | `TIMESTAMPTZ` | Nominal slot time; a job is not served early |
| `slot`, `source` | — | Which slot and adapter |
| `attempts` / `max_attempts` | `SMALLINT` | Incremented on claim; default max 3 |
| `last_error` | `TEXT` | Truncated failure message |
| `locked_at` / `locked_by` | — | Worker holding the claim, as `host:pid` |
| `completed_at`, `created_at` | `TIMESTAMPTZ` | Lifecycle timestamps |

**Uniqueness:** `(kind, scheduled_for, payload)` — re-running the scheduler for
a slot cannot double-collect it.

A job past `max_attempts` becomes `dead` rather than retrying forever: a dead
job is a visible fact, an infinite retry is not. Reaping an abandoned job
applies the same ceiling.

---

## `adapter_health`

**M3** instrumentation — what each source achieved per slot. Read by
`/api/v1/health/nodes`.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `BIGSERIAL` | Primary key |
| `source` | `TEXT` | Adapter name |
| `slot` | `collection_slot` | Which slot |
| `observed_on` | `DATE` | Collection date |
| `scheduled` / `succeeded` / `failed` | `INTEGER` | Request counts; success rate targets ≥ 95% |
| `tier_used` | `SMALLINT` | Acquisition tier reached |
| `p50_latency_ms` | `INTEGER` | Median response latency |
| `recorded_at` | `TIMESTAMPTZ` | When written |

**Uniqueness:** `(source, slot, observed_on)` — re-running a slot replaces its
numbers rather than double-counting them.

---

## Enumerations

| Type | Values |
| --- | --- |
| `collection_slot` | `morning`, `afternoon`, `evening` |
| `validation_status` | `valid`, `quarantined`, `rejected` |
| `job_status` | `pending`, `running`, `done`, `failed`, `dead` |
| `carrier_type` | `low_cost`, `full_service` |
| `departure_time_bucket` | `early_morning` (00–06), `morning` (06–12), `afternoon` (12–17), `evening` (17–21), `night` (21–24) |
| `acquisition_tier` | `1` public JSON, `2` internal XHR, `3` rendered |

Low-cost carriers are `6E`, `SG`, `QP`, `G8`, `IX`; anything else is treated as
full-service.

---

## Units and conventions

| Convention | Rule |
| --- | --- |
| **Money** | Integer paise (`fare_inr_paise`). Never floats — rounding error has no place in a published price statistic. Divide by 100 for rupees |
| **Fares are all-inclusive** | Taxes and surcharges included. `validation.require_all_inclusive` is `true`; a source quoting base-only fares is not comparable and must not enter the panel |
| **Timestamps** | `TIMESTAMPTZ`, stored UTC. Collection slots are defined in IST |
| **`collected_at`** | The real observation time, never the nominal slot |
| **Dates** | `DATE` for departure and period; ISO `YYYY-MM-DD` as text in the API |
| **Airport codes** | IATA, uppercase, `CHAR(3)` |
| **Hashes** | SHA-256, lowercase hex, `CHAR(64)`, taken over a canonical JSON serialisation (sorted keys, no incidental whitespace) so that reformatting cannot invent a spurious new vintage |
| **Ratios** | Fractions in `[0, 1]`, not percentages |

---

## See also

- [`aerodex/db/schema.sql`](../aerodex/db/schema.sql) — the authoritative DDL
- [API.md](API.md) — how these fields surface over HTTP
- [../README.md](../README.md#methodology) — how the index is computed from them
