# Operations runbook

Running AeroDex in production: install, schedule, monitor, and what to do when
something goes wrong.

For local development and the demo, see the
[Quick start](../README.md#quick-start) instead — this document assumes a
server that must keep collecting unattended.

**Contents** · [Topology](#topology) · [Install](#install) ·
[Scheduling](#scheduling-collection) · [The daily cycle](#the-daily-cycle) ·
[Monitoring](#monitoring) · [Runbook](#runbook) · [Backup](#backup-and-restore) ·
[Environment](#environment-reference)

---

## Topology

| Component | Runs on | Notes |
| --- | --- | --- |
| Collector | systemd timers on the VM | Three slots/day, one job per stratum-slot |
| Postgres + TimescaleDB | same VM | Hypertables on `collected_at`, compressed after 30 days |
| Index run | systemd timer or manual | Computes, stores and publishes |
| API | uvicorn on the VM | Read-only; exposed via Cloudflare Tunnel |
| Dashboard | static hosting | Reads published artifacts, or the API |

Production serving is **static JSON artifacts**, not the API. The dashboard is
what a reviewer opens, and it must keep working when the VM does not. The API
exists for ad-hoc programmatic queries and for the dashboard in development.

---

## Install

```bash
sudo useradd --system --home /opt/aerodex aerodex
sudo git clone https://github.com/Naveen-Boddepalli/aerodex.git /opt/aerodex
cd /opt/aerodex && sudo -u aerodex uv sync
```

Set the DSN and apply the schema:

```bash
export AERODEX_DSN=postgresql://aerodex@localhost/aerodex
uv run python -m aerodex.cli init-db
```

`init-db` is idempotent — every statement is `IF NOT EXISTS` or guarded, so it
is safe against an existing database.

Confirm the panel is configured and weighted before collecting anything:

```bash
uv run python -m aerodex.cli panel
```

It prints the panel hash, the config hash, the weights vintage, and warns if
any route lacks a weight. **A panel with unweighted routes must not publish** —
the index would silently fall back to uniform weighting, which is exactly what
DGCA weighting exists to remove.

---

## Scheduling collection

systemd timers, not cron. `OnCalendar`, jitter control and journal integration
come free, and GitHub Actions' 10–30 minute drift is what disqualified it as
the primary scheduler: a "07:00 slot" that fires at 07:26 silently corrupts the
intraday-drift control that makes the index defensible.

Units are in [`deploy/systemd/`](../deploy/systemd/). The timer template takes
the slot id as its instance name, but `OnCalendar` cannot read a clock time
from `%i`, so install one drop-in per slot:

```
/etc/systemd/system/aerodex-collect@morning.timer.d/schedule.conf
  [Timer]
  OnCalendar=*-*-* 07:00:00
```

…and the same for `afternoon` (13:00) and `evening` (20:00). Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aerodex-collect@morning.timer
sudo systemctl enable --now aerodex-collect@afternoon.timer
sudo systemctl enable --now aerodex-collect@evening.timer
systemctl list-timers 'aerodex-*'
```

The VM must run in `Asia/Kolkata` — slot times are IST.

Two settings in the unit are deliberate, not defaults to tune away:

- `TimeoutStartSec=3600` — a slot that has not finished inside its window is
  late, not useful. Killing it stops two collectors overlapping.
- `RandomizedDelaySec=120` — spreads load without breaking the ±15 minute slot
  window.

---

## The daily cycle

```bash
# 1. Collect — one slot. The scheduler runs this; this is the manual form.
uv run python -m aerodex.cli collect --slot morning --store

# 2. Compute and store the index.
uv run python -m aerodex.cli index --store

# 3. Publish, if the run is releasable.
uv run python -m aerodex.cli index --store --publish --artifacts-dir /var/www/aerodex
```

**`--store` on the index run is not optional in production.** Without it the
run produces artifacts and nothing else, `index_point` stays empty, and the API
serves the frozen demo dataset for every index endpoint — labelled
`demo-synthetic`, so it is visible rather than silent, but it is not what you
want live.

### Exit codes

| Code | Meaning | Action |
| --- | --- | --- |
| `0` | Success | — |
| `1` | Collection below the 95% success target, or M5 ceiling breached | Investigate; the number may still be correct |
| `2` | No panel data, unknown source, or unweighted routes | Fix configuration before retrying |
| `3` | **Publication refused** | Working as designed — read the reason |
| `4` | Store failed | Database problem; the index itself computed fine |

### On publication refusal

Exit `3` is a designed outcome, not a malfunction. The publisher refuses:

- a panel whose only sources are synthetic (currently the case — `fixture` is
  the only registered adapter until Phase 0 spike S3 lands);
- a period whose imputed weight share breached the M5 ceiling of 5%.

The correct response is to fix the coverage or the sources — **not** to reach
for `--allow-synthetic`, which exists for demos and must never be used for a
real release.

---

## Monitoring

### Is the API serving real data?

```bash
curl -s localhost:8000/api/v1/health
```

| `database` | Meaning | Action |
| --- | --- | --- |
| `connected` | Reachable and answering | — |
| `unavailable` | No database | Expected in demo mode; a **fault** in production |
| `error` | Answered, but the probe query failed | Alert. Schema drift or a broken database |

Also check `synthetic`. In production it must be `false`; `true` means the API
fell back to the demo dataset and the dashboard is showing fixture fares.

### Collection health (M3)

```bash
curl -s localhost:8000/api/v1/health/nodes
```

Reads `adapter_health`, written by `collect --store`. Success rate targets
≥ 95% per slot.

### Queue depth

```sql
SELECT status, count(*) FROM job GROUP BY 1;
```

`dead` jobs are the signal worth alerting on — a job past `max_attempts` stops
retrying by design, so it will not clear itself.

### Reproducibility (M6)

The nightly `reproducibility.yml` workflow runs this, but it is worth having on
the VM too:

```bash
uv run python -m aerodex.cli verify
```

`MISMATCH` means a published number moved. Treat it as a production incident:
stop publishing, find what changed, and do not re-freeze the fixtures to make
it pass.

### Logs

```bash
journalctl -u 'aerodex-collect@*' --since today
journalctl -u aerodex-collect@morning.service -n 100
```

---

## Runbook

### A source starts blocking us

**Expected, and handled.** The adapter raises `SourceBlocked`, the collector
drops that source, and the coverage ratio is published. There is no retry-harder
path and no evasion — that is a compliance rule, not a tuning parameter.

What to do: confirm the coverage ratio is still acceptable and the imputed
weight share is under 5%. If it is not, the honest output is a published
coverage failure, not a substituted number.

### Collection success rate below 95%

1. `journalctl -u aerodex-collect@<slot>` for the failing strata.
2. Check whether it is one source or all — `adapter_health` by source.
3. If one source: it is degraded; the index continues with reduced coverage.
4. If all: check network, DNS, and whether the VM's clock and timezone drifted.

### The imputed weight share breached 5% (M5)

The engine still returns the number — suppressing it would hide the coverage
failure the metric exists to expose — but the publisher refuses to release it.

Find which strata failed to report, and why. The usual cause is a source
dropping a route entirely. Do not raise the ceiling to make the release pass.

### Jobs stuck in `running`

A worker died holding them. Reap them:

```python
from aerodex.db.connection import connect
from aerodex.db import queue
with connect() as conn:
    print(queue.reap_stale(conn, older_than_minutes=30))
```

Jobs already at `max_attempts` are reaped to `dead` rather than back to
`pending`, so a job that kills its worker every time cannot be reaped forever.

### The database filled up

`quote_raw` compresses after 30 days (8–15× on this shape). Confirm the policy
is active:

```sql
SELECT * FROM timescaledb_information.jobs WHERE proc_name = 'policy_compression';
```

**Never delete from `quote_raw`.** It is append-only and a trigger enforces it;
M6 depends on the archive being immutable.

### The API is slow or hanging

Most likely a DSN pointing at a host that does not answer. Connections use a
5-second timeout (`AERODEX_DB_CONNECT_TIMEOUT_S`), and a failed attempt is
cached for 30 seconds (`AERODEX_DB_PROBE_TTL_S`) so every request does not pay
it. If the API is serving demo data unexpectedly, `/api/v1/health` says why.

---

## Backup and restore

What must survive, in priority order:

| What | Why | How |
| --- | --- | --- |
| `quote_raw` | The archive every published number traces back to. Irreplaceable — fares cannot be re-collected for a past date | `pg_dump`, off-VM |
| `config/*.yaml` | Hashed into every number; a lost config makes past numbers unverifiable | In git |
| Published artifacts | The releases themselves | Object storage, plus git for the demo set |
| `index_point` | Recomputable from `quote_raw` + config | `pg_dump` |
| `job`, `adapter_health` | Operational history | Nice to have |

```bash
pg_dump -Fc -t quote_raw -t quote_clean -t index_point aerodex > aerodex-$(date +%F).dump
```

A restore is verified the same way everything else is:

```bash
uv run python -m aerodex.cli verify
```

If a restored database cannot reproduce its own published hashes, the restore
is not complete.

---

## Environment reference

| Variable | Used by | Default | Meaning |
| --- | --- | --- | --- |
| `AERODEX_DSN` | pipeline, API | local compose DSN | Postgres connection string. Unset ⇒ API falls back to `demo/` |
| `AERODEX_DB_CONNECT_TIMEOUT_S` | pipeline, API | `5` | Connection timeout. libpq's own default is *no* timeout, which hangs the caller for the OS TCP timeout when the host is filtered. Ignored when the DSN sets its own |
| `AERODEX_DB_PROBE_TTL_S` | API | `30` | How long an "unreachable" verdict is cached before retrying, so demo mode does not attempt a connection on every request |
| `AERODEX_CORS_ORIGINS` | API | — | Extra allowed origins, comma-separated |
| `AERODEX_API_ORIGIN` | frontend build | `http://127.0.0.1:8000` | Where Next proxies `/api/*` |
| `NEXT_PUBLIC_API_URL` | frontend runtime | `""` (same-origin) | Bypass the proxy and call an API directly |
| `API_PORT` / `WEB_PORT` | `run_demo.sh` | `8000` / `3000` | Demo ports |

---

## See also

- [`deploy/systemd/`](../deploy/systemd/) — the unit files
- [API.md](API.md) — the HTTP surface, and which endpoints read the database
- [TESTING.md](TESTING.md) — what to run to prove the system is sound
- [../README.md](../README.md#cli-reference) — full CLI reference
