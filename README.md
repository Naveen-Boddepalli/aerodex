---
updated: 2026-08-25T05:51:17.086Z
editedBy: praneeth132006
generator: https://forkleaf.vercel.app
---

# AeroDex

Real-time airfare price index for India — SIH 2026, PS SIH26056 (MoSPI).

Every component runs on a permanent free tier or open-source software.
**Total recurring cost: ₹0.** The full reasoning is in [plan.md](plan.md);
this README covers how to run what exists today.

## Status

Phase 0 groundwork and the Phase 1 vertical slice are in place and tested.
The pipeline runs end to end — scheduler → adapter → normalise → validate →
store → index → JSON artifact — on a **fixture adapter**, not real fares.

| Phase 0 spike | Status |
| --- | --- |
| S1 — Oracle A1 capacity in an Indian region | **not started** (needs an Oracle account) |
| S2 — Playwright/Chromium on Ubuntu 24.04 arm64 | **not started** (needs the VM from S1) |
| S3 — tier-1/tier-2 endpoints across \~6 candidate sources | **not started** — gates every real adapter |
| S4 — DGCA weights parse into the 60-route panel | **not started** — weights are `null` placeholders |

Until S3 and S4 run, `aerodex` computes a **structurally correct but
unpublishable** index: uniform weights, synthetic fares. The publisher refuses
to release it (`PublicationRefused`), by design rather than by convention.

## Quick start

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
uv run python -m aerodex.cli panel
```

Collect one slot and compute the index:

```bash
uv run python -m aerodex.cli collect --slot morning --date 2026-09-01 --store
```

```bash
uv run python -m aerodex.cli index
```

## Commands

| Command | What it does |
| --- | --- |
| `aerodex panel` | Panel shape, sizing arithmetic, config hashes |
| `aerodex init-db` | Apply the schema (idempotent) |
| `aerodex collect` | Run one slot: `--slot`, `--date`, `--limit`, `--store` |
| `aerodex index` | Compute the index from the database or `--panel-csv` |
| `aerodex verify` | M6 check — recompute an archived panel, diff the hash |

## Layout

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
deploy/systemd/  timers, not cron (plan §5.1)
tests/golden/    the M6 guarantee — frozen panel, frozen expected index
```

## The two invariants

`quote_raw` **is append-only.** Enforced by database triggers on UPDATE,
DELETE *and* TRUNCATE — not by code review. M6 depends on it.

**The index engine is a pure function.** `compute_index(panel, config)` reads
no clock, no database and no network. A test asserts the module never acquires
one of those imports, because the failure would only show up as a moved
published number months later.

## Running the tests

```bash
uv run pytest -q
```

The golden tests are the ones that matter: a frozen input panel and a frozen
expected output, checked in. Change one value in `methodology.yaml` and three
of them fail. If a change is intentional, re-freeze deliberately and say so in
the commit — never "fix" a golden test by re-freezing it.

## Compliance

No authentication, no CAPTCHA solving, no fingerprint spoofing, no proxies. A
minimum 20 s between requests to the same host, `robots.txt` parsed and honoured
at run time (unreachable means *disallowed*), and a `User-Agent` that names the
project and links here. When a source blocks, the source is dropped and the
coverage ratio is published — redundancy instead of evasion.

These live in `aerodex/compliance.py` as assertions, so violating one requires
deliberately editing a file called `compliance.py`.

## Attribution

Route weights derive from DGCA traffic data via
`Vonter/india-aviation-traffic` (ODbL).