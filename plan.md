# AeroDex — Build Plan

**Project:** Real-Time Airfare Price Index for India (SIH 2026, PS SIH26056, MoSPI)
**Constraint:** ₹0 recurring spend. Every component must run indefinitely on a permanent free tier or open-source software.
**Plan written:** 22 August 2026. All free-tier figures verified against sources listed in §11 on that date.

---

## 0. How this plan works

Every component below is resolved with the same four-step loop. Nothing is chosen because it is popular.

1. **State the job.** What must this part do, in one sentence, measured against a project KPI (§2).
2. **List the free options.** Only options that are free *forever*, not free-for-12-months, not trial credits.
3. **Kill on constraints first.** Storage caps, inactivity pauses, request quotas, licence terms, architecture support. Most options die here without any taste being involved.
4. **Pick, then write the fallback.** Every decision records what breaks it and what replaces it. A decision without a named fallback is not finished.

Re-run the loop whenever a constraint changes — free tiers move. Two moved in the last ten weeks and both changed decisions in this plan (§1.1, §5.1).

---

## 1. Two findings that shape everything

### 1.1 There is no longer a free flight-fare API

Amadeus decommissioned its Self-Service developer portal on **17 July 2026**; existing keys were deactivated on that date. Kiwi.com's Tequila platform moved to invitation-only partner access during 2026. What remains free is not usable as a primary source:

| Source | Free allowance | Why it fails as primary |
|---|---|---|
| Amadeus Self-Service | **Dead** (17 Jul 2026) | Portal decommissioned, keys disabled |
| Kiwi Tequila | Invitation-only | No self-service access |
| Duffel | Test mode free | Sandbox prices are synthetic, not real market fares |
| Aviationstack | 100 requests/month | Off by ~3 orders of magnitude |
| AeroDataBox | ~600 units/month | Schedules, not fares |
| Travelpayouts Data API | Free with affiliate signup | Cached aggregate prices; no control of booking horizon |

**Consequence:** scraping publicly displayed fares is not a shortcut in this project — it is the only remaining path, which is precisely why the problem statement asks for it. Say this explicitly in the SIH pitch; it converts the weakest-looking part of the design into the justification for the project's existence.

### 1.2 Oracle halved its free ARM allowance in June 2026

Oracle Cloud's Always Free Ampere A1 allowance dropped from 4 OCPU / 24 GB to **2 OCPU / 12 GB**, effective 15 June 2026, with instances above the new limit terminated from 18 August 2026. Block storage (200 GB) and outbound transfer were not cut.

**Consequence:** the plan is sized for 2 OCPU / 12 GB, and the design avoids memory-hungry infrastructure (§5.4, §5.5). If you read an older tutorial promising 4/24, it is stale.

---

## 2. Success metrics (what every decision is judged against)

These are the KPIs committed to in the submission document. Each has an owner component and a measurement method (§9).

| # | Metric | Target | Hard constraint it imposes |
|---|---|---|---|
| M1 | Route panel | ≥ 60 O–D pairs | ~1,155 stratum-slots/day must be collectable |
| M2 | Quote volume | 6,000–10,000 validated quotes/day | ~2 M rows/year → storage must exceed 500 MB |
| M3 | Collection success | ≥ 95% of scheduled stratum-slots | Scheduler must fire on time; no 30-min drift |
| M4 | Publication latency | ≤ 2 h after final daily slot | Index run must complete in < 30 min |
| M5 | Imputation share | ≤ 5% of index weight | Missing-data handling must be explicit, not silent |
| M6 | Reproducibility | 100% bit-identical re-runs | Raw archive + config hashing are mandatory |
| M7 | External agreement | Correlation vs CPI Transport reported quarterly | Need free access to CPI + DGCA series |

M2, M3 and M6 are the three that eliminate most free tiers. Keep them in view while reading §5.

---

## 3. Sizing arithmetic (do this before choosing anything)

Everything downstream depends on these numbers. Recompute them if the panel design changes.

```
Panel:      60 routes x 7 booking horizons          =    420 strata
Slots:      420 strata x 3 collection slots/day     =  1,155 stratum-slots/day (rounded from 1,260 less overlap)
Quotes:     1,155 x ~6 itineraries returned         = ~7,000 validated quotes/day
Rows/year:  7,000 x 365                             = ~2.6 M rows/year

Row width:  ~250 bytes (fare + 14 attributes + keys)
Table:      2.6 M x 250 B                           = ~650 MB/year
+ indexes (~2x)                                     = ~2 GB/year in Postgres

Raw page snapshots (if full HTML):
            1,155 fetches/day x ~300 KB             = ~350 MB/day  = 10 GB/month  ← too big
Raw JSON payloads only, gzipped:
            1,155 x ~25 KB x 0.12                   = ~3.5 MB/day  = ~105 MB/month ← fits
```

**Two decisions fall straight out of this arithmetic:**

- 2 GB/year kills every managed free Postgres tier (Supabase 500 MB, Neon 0.5 GB). Self-hosting is not a preference here, it is the only option that survives M2.
- Archiving full HTML kills Cloudflare R2's 10 GB free tier in month one. Archive the **parsed JSON payload plus a hash of the raw response**, not the rendered page. This preserves M6 (reproducibility of parsing) at 3% of the storage.

---

## 4. The chosen stack, in one table

| Layer | Choice | Cost | Ceiling before it breaks |
|---|---|---|---|
| Compute | Oracle Cloud Always Free, Ampere A1 ARM, 2 OCPU / 12 GB, Mumbai or Hyderabad region | ₹0 forever | CPU-bound at ~4 concurrent Chromium instances |
| Block storage | Oracle Always Free, 200 GB | ₹0 forever | ~100 years at 2 GB/year |
| Scheduler | systemd timers on the VM | ₹0 | none |
| Job queue | PostgreSQL `SELECT … FOR UPDATE SKIP LOCKED` | ₹0 | ~10⁴ jobs/day comfortably |
| Database | PostgreSQL 16 + TimescaleDB Community, self-hosted | ₹0 | disk-bound only |
| Backup + archive | Cloudflare R2, 10 GB free, zero egress | ₹0 | ~8 years of gzipped JSON |
| Redundant collector | GitHub Actions, public repo | ₹0, unlimited minutes | cron drift 10–30 min |
| Public API | FastAPI + Cloudflare Tunnel | ₹0 | Tunnel is unmetered for this volume |
| Dashboard | Next.js static export on Cloudflare Pages | ₹0 | 500 builds/month, unlimited bandwidth |
| Monitoring | Grafana Cloud Free (10k series, 50 GB logs, 14-day retention, 3 users) | ₹0 forever | series cardinality |
| Uptime checks | UptimeRobot Free, 50 monitors | ₹0 | 50 monitors |
| Alerting | Telegram Bot API | ₹0 | none |
| Docs | MkDocs Material on GitHub Pages | ₹0 | none |
| Domain | GitHub Student Pack free domain; `*.pages.dev` until then | ₹0 (1 yr, renewable while enrolled) | — |
| CI | GitHub Actions, public repo | ₹0 | — |

**Total recurring cost: ₹0.** The only account requiring a card is Oracle, which places a temporary ₹1-equivalent authorisation hold for identity verification and does not charge Always Free resources.

---

## 5. Decision log

Each entry: the job → the options → the kill → the pick → the fallback.

### 5.1 Compute and scheduling

**Job.** Fire ~1,155 collection tasks per day at three fixed IST slots, within a tight window (M3, M4).

| Option | Free reality | Verdict |
|---|---|---|
| GitHub Actions cron | Unlimited minutes on public repos, but documented **10–30 min drift**, 5-min minimum interval, schedules **auto-disabled after 60 days** of repo inactivity, and US/EU Azure egress IPs | ✗ as primary |
| Render / Railway free web service | Spins down on idle; cold starts | ✗ |
| Fly.io | Trial credits, not permanently free | ✗ |
| Hugging Face Spaces (free CPU) | Sleeps; not built for cron | ✗ |
| **Oracle Always Free A1, Mumbai** | 2 OCPU / 12 GB, 200 GB disk, real `systemd` timers, Indian IP | ✓ |

**Decision.** Oracle A1 in an Indian region as the primary collector, with `systemd` timers (not `cron` — timers give you `OnCalendar=`, jitter control, and journal integration for free).

Cron drift is the decider, not raw power. A "fixed 07:00 IST slot" that actually fires between 07:00 and 07:30 is not a fixed slot, and it silently corrupts the intraday-drift control that makes the index defensible. Record the *actual* collection timestamp on every observation regardless, and define the slot as a ±15 min window in the methodology, so late collection degrades gracefully instead of invalidating the stratum.

An Indian egress IP also matters: fare pages serve different currency, availability and sometimes different price ladders by geography. Collecting Indian domestic fares from a US datacentre IP is a measurement error, not just an inconvenience.

**Fallback.** ARM capacity is frequently exhausted in popular Oracle regions ("Out of capacity"). Three mitigations, in order: (a) try each availability domain in the region; (b) run the documented retry-loop script against the LaunchInstance API until capacity frees up; (c) fall back to the 2× Always Free AMD `E2.1.Micro` x86 instances, which are smaller but almost always available — enough for HTTP-level collection, not for parallel Chromium.

**Second fallback.** GitHub Actions runs the *same* collector as a redundant backup on a 6-hourly schedule. It will drift, and that is acceptable for a backup whose job is to prove the panel is still collectable if the VM dies. Add a keepalive step to defeat the 60-day disable.

### 5.2 Data acquisition method

**Job.** Get an all-inclusive fare for a given route/date/cabin without logging in, booking, or evading defences.

**Decision — a strict three-tier ladder, cheapest first:**

1. **Documented public JSON endpoint** → `httpx`. Free, fast, stable.
2. **Internal XHR endpoint** observed in the browser network tab, called directly with correct headers → `httpx`. Still 10–50× cheaper in CPU and RAM than rendering, and far more stable than DOM selectors, which change with every design tweak.
3. **Full Playwright render** → only when tiers 1 and 2 are unavailable.

Most teams start at tier 3 because it is the most obvious. On 2 OCPU that is the difference between a panel of 60 routes and a panel of 10. Spend the first spike (§8, Phase 0) discovering tier-2 endpoints; it is the single highest-leverage hour in the project.

**Playwright on ARM.** Playwright's installation docs list Ubuntu 22.04 / 24.04 / 26.04 on **x86-64 or arm64** as supported, so Chromium on Ampere A1 is expected to work — but there are open reports of `aarch64` Chromium resolution failures in some environments. Treat it as a Phase-0 go/no-go: run `playwright install chromium` and launch a headless page on day one. If it fails, either use the distro Chromium via `channel="chromium"`, or move rendering to the x86 micro instances.

**On anti-bot.** The plan does not buy proxies, does not solve CAPTCHAs, and does not rotate identities. It uses: conservative pacing (≥ 20 s between requests to the same host), realistic headers, session reuse, `robots.txt` compliance, and **redundancy across sources instead of evasion**. When a source blocks, the source is dropped and the coverage ratio for that stratum is published. This is both the legally defensible position and the one already written into the submission document — the implementation must not contradict the pitch.

### 5.3 Storage

**Job.** Hold ~2 GB/year of panel data with time-series query performance, plus an immutable archive for M6.

| Option | Free reality | Verdict |
|---|---|---|
| Supabase Free | 500 MB database, **7-day inactivity pause** (tightened Feb 2026), 5 GB egress | ✗ — exceeded in ~3 months, and the pause takes the API down with it |
| Neon Free | 0.5 GB/project, 100 CU-hours/month, scale-to-zero | ✗ on storage |
| Cloudflare D1 | 5 GB, 100k row writes/day | ✗ — 7k inserts/day fits, but SQLite semantics and no window-function-heavy analytics story |
| **Self-hosted Postgres + TimescaleDB Community** | Free software on 200 GB of free disk | ✓ |

**Decision.** PostgreSQL 16 + TimescaleDB Community on the Oracle VM. Hypertable on `collected_at`, chunked weekly, with native compression enabled on chunks older than 30 days (typically 8–15× on this shape of data). TimescaleDB Community is free to self-host; the licence only restricts offering it *as a managed database service*, which is not what this project does.

**Schema principle.** Three tables, not one:

- `quote_raw` — append-only, one row per observation as parsed, never updated
- `quote_clean` — normalised, deduplicated, attribute-tagged, with a `validation_status` enum
- `index_point` — published values, each stamped with `config_hash` and `weight_vintage`

Never mutate `quote_raw`. M6 depends on it.

**Fallback.** Nightly `pg_dump | zstd -19` → Cloudflare R2. If the VM is unrecoverable, a fresh VM plus the latest dump restores the project in under an hour. Retention: 7 daily, 4 weekly, 12 monthly. Run a restore drill once a month — an untested backup is not a backup.

### 5.4 Job queue

**Job.** Distribute ~1,155 tasks/day across workers with retries, without eating the RAM budget.

| Option | Free reality | Verdict |
|---|---|---|
| Celery + Redis (self-hosted) | Free, but a second daemon, a second failure mode, ~200 MB RAM | ✗ — unjustified at this volume |
| Upstash Redis Free | 10k commands/day — 1,155 tasks × several commands each sits uncomfortably close | ✗ |
| **Postgres job table with `FOR UPDATE SKIP LOCKED`** | Free, transactional, already running | ✓ |

**Decision.** A `job` table in the database you already operate. `SKIP LOCKED` gives correct concurrent dequeue semantics with no new infrastructure, retries are a column, and the job history is queryable with the same SQL as everything else. Redis earns its place somewhere north of 10⁵ tasks/day; this project is two orders below that.

### 5.5 Index engine

**Job.** Turn the clean panel into a published index, deterministically (M6), in under 30 minutes (M4).

**Decision.** Python with `pandas`, `numpy`, `statsmodels`. The engine is written as a **pure function**:

```
compute_index(panel: DataFrame, config: MethodologyConfig) -> DataFrame
```

No database access, no network, no clock reads inside it. Everything it needs arrives as arguments. This single constraint is what makes M6 achievable — the nightly reproducibility check just re-reads an archived panel, re-runs the function with the archived config, and diffs the output hash.

Component choices inside the engine:

| Step | Choice | Why not the alternative |
|---|---|---|
| Elementary index | Jevons (geometric mean of relatives) | Carli has known upward bias; Dutot is not invariant to units and is wrong for heterogeneous items |
| Quality adjustment | Hedonic OLS on log fare, `statsmodels` | Matched-model alone cannot handle the fare-mix churn in airline pricing |
| Aggregation | Lowe/Laspeyres, DGCA traffic weights | Fisher/Törnqvist need current-period quantities you do not have |
| Seasonal adjustment | STL for daily/weekly; **X-13ARIMA-SEATS for the monthly series** | STL is fine and free; X-13 is what national statistical offices actually use, and `statsmodels.tsa.x13` wraps the free US Census binary. Using X-13 on the monthly headline is a credibility upgrade that costs nothing |
| Config | Versioned YAML, SHA-256 hashed into every release | Config in code is not auditable |

**X-13 caveat.** The Census binary is distributed for x86 Linux; on ARM you will need to build it or run it in an emulated container. If that fights back, ship STL for everything and note X-13 as future work — do not burn a week on it.

**Not chosen: polars.** Faster, but the STL and OLS ecosystem is in `statsmodels`, which expects pandas. Revisit only if profiling shows the index run exceeding ~10 minutes.

### 5.6 Publication

**Job.** Serve the index to humans and machines, and keep serving it when the VM is down.

**Decision — publish static artifacts, not a live database read.**

The index run writes `index_latest.json`, `index_full.csv` and a dated release file to **Cloudflare R2** and pushes the dashboard to **Cloudflare Pages**. The dashboard reads those static files. The FastAPI service on the VM (behind a **Cloudflare Tunnel**) exists for programmatic queries and ad-hoc slices.

This inverts the usual architecture and it is the right call here: the dashboard is the thing judges and MoSPI will open, and it now has no runtime dependency on a free-tier VM staying up. Cloudflare Pages gives unlimited bandwidth; R2 charges nothing for egress.

**Cloudflare Tunnel over an open port** because it needs no Oracle security-list surgery, no public IP exposure, no Let's Encrypt renewal cron, and brings free TLS and WAF.

**Not chosen: Vercel Hobby.** Free and excellent, but its terms restrict Hobby to non-commercial use. Cloudflare Pages carries no equivalent restriction, so the project can be handed to MoSPI without a licensing conversation.

### 5.7 Monitoring and alerting

**Job.** Know that collection succeeded (M3) before anyone else notices it did not.

**Decision.** **Grafana Cloud Free** — 10,000 active metric series, 50 GB logs, 14-day retention, 3 users, no card required. Grafana Alloy on the VM ships Prometheus metrics and Loki logs.

Off-box monitoring, deliberately. Self-hosting Prometheus and Grafana on the same VM is free too, but it consumes RAM the collector needs and it dies exactly when you most need it — when the VM dies. **UptimeRobot Free** (50 monitors) checks the public endpoints from outside. Alerts route to a **Telegram bot**, which is free, instant, and readable on a phone during a hackathon.

Keep cardinality disciplined: label metrics by `source` and `slot`, never by `route` — 60 routes × several metrics would burn the 10k series budget for no analytical gain.

**Four alerts, no more.** Alert fatigue is the failure mode here.

1. Collection success rate < 90% for a slot
2. Any source at 0% success for two consecutive slots
3. Index run failed or exceeded 30 minutes
4. Disk above 80%

### 5.8 Reference and validation data

| Need | Free source | Notes |
|---|---|---|
| Route weights | `Vonter/india-aviation-traffic` on GitHub — DGCA-sourced, machine-readable, ODbL | The single best free input; attribute DGCA per the licence |
| Weights, authoritative | DGCA city-pair monthly tables; data.gov.in "Monthly Air Traffic Statistics" | Use to verify the GitHub dataset, not to parse routinely |
| CPI Transport sub-index | MoSPI CPI releases | Needed quarterly for M7 |
| Calendar/festival regressors | Hand-maintained YAML | 30 rows/year; do not over-engineer this |
| Cross-check series | Travelpayouts Data API (free affiliate signup) | Cached aggregate prices — useless as primary, genuinely useful as an independent sanity check on direction of travel |

---

## 6. Repository layout

Public repo — it unlocks unlimited GitHub Actions minutes, and an open-data project that hides its methodology undermines its own pitch.

```
aerodex/
├── README.md
├── plan.md
├── config/
│   ├── methodology.yaml        # formulas, weights vintage, imputation rules — hashed into releases
│   ├── panel.yaml              # routes, horizons, cabins, slots
│   └── calendar.yaml           # festivals, vacation windows
├── aerodex/
│   ├── acquire/
│   │   ├── base.py             # Adapter ABC: search() -> parse() -> emit()
│   │   ├── adapters/           # one file per source; failures are isolated here
│   │   └── health.py           # canary tests, fallback ladder
│   ├── normalise/              # fare decomposition, dedup, attribute tagging
│   ├── validate/               # range/plausibility rules, quarantine
│   ├── index/
│   │   ├── elementary.py       # Jevons
│   │   ├── hedonic.py          # OLS quality adjustment
│   │   ├── aggregate.py        # Lowe/Laspeyres
│   │   ├── seasonal.py         # STL / X-13
│   │   └── engine.py           # the pure function
│   ├── publish/                # R2 upload, static artifacts, API
│   └── db/                     # schema, migrations, job queue
├── dashboard/                  # Next.js static export
├── docs/                       # MkDocs Material -> GitHub Pages
├── tests/
│   ├── unit/
│   ├── golden/                 # frozen panel -> frozen index; the M6 guarantee
│   └── canary/                 # live structural checks per source
└── .github/workflows/
    ├── ci.yml
    ├── backup-collector.yml    # redundant 6-hourly collection
    ├── reproducibility.yml     # nightly: recompute a random past date, diff hash
    └── keepalive.yml           # defeat the 60-day schedule disable
```

**Golden tests are the most important directory.** A frozen input panel and a frozen expected index output, checked in. Any refactor that changes a published number fails CI loudly. Without this, M6 is a claim rather than a property.

---

## 7. Compliance rules, written as code constraints

Not a legal section — a set of assertions the code must satisfy, because the pitch depends on them being true.

- No authentication, no account creation, no session cookies obtained by logging in
- No CAPTCHA solving, no fingerprint spoofing beyond a normal user agent
- `robots.txt` parsed and honoured per source, checked at run time, not assumed
- Minimum 20 s between requests to the same host; global concurrency cap per source in config
- No personal data collected, ever — fares and itinerary attributes only
- Raw third-party page content is not redistributed; only derived statistics and hashes are published
- `User-Agent` identifies the project and links to the repo

Put these in a `compliance.py` module with runtime assertions, so violating them requires deliberately editing a file named `compliance.py`.

---

## 8. Build phases

Each phase has an exit criterion. Do not start the next phase until it is met.

### Phase 0 — Feasibility spikes (timebox: 1 week, do this first)

Four spikes, each with a go/no-go. This phase exists because the entire project rests on assumptions that can be tested in hours.

| Spike | Question | Kill condition |
|---|---|---|
| S1 | Can an Oracle A1 instance be provisioned in an Indian region? | No capacity after 3 days of retry-loop → fall back to AMD micro instances |
| S2 | Does `playwright install chromium` run and launch on Ubuntu 24.04 arm64? | Fails → distro Chromium, or rendering moves to x86 micro |
| S3 | For each of ~6 candidate sources, can one fare quote be retrieved without login, and is there a tier-2 JSON endpoint? | Fewer than 3 sources usable → redesign the panel around the survivors before building anything |
| S4 | Does the DGCA weights dataset parse into the 60-route panel? | Gaps → use airport-level traffic as a proxy weight and document it |

**Exit:** one fare, from one source, for one route, written to a Postgres row on the VM. Nothing else.

### Phase 1 — Vertical slice (week 1–2)

Three routes, one source, one booking horizon, one slot per day. Full path: scheduler → adapter → normalise → validate → store → index → JSON artifact. Deliberately narrow and complete rather than broad and half-built.

**Exit:** a Jevons index number for three routes, reproducible from the archive.

### Phase 2 — Panel and acquisition hardening (week 3–4)

Scale to 60 routes, 7 horizons, 3 slots, all viable sources. Add the adapter health monitor, canary tests, fallback ladder, coverage ratio metric, quarantine queue.

**Exit:** M1 met, M2 met, M3 ≥ 95% sustained over 7 consecutive days.

### Phase 3 — The methodology (week 5–6)

Hedonic adjustment, Lowe aggregation with DGCA weights, imputation with published share, STL, chaining, revision policy. The config YAML and hashing land here.

**Exit:** M5 measured and reported; golden tests pass; two independent runs produce identical hashes.

### Phase 4 — Publication (week 7)

Static artifacts to R2, dashboard on Pages, FastAPI behind the Tunnel, MkDocs methodology site, Grafana dashboards, four alerts, backup and restore drill.

**Exit:** M4 met; dashboard survives a deliberate VM shutdown.

### Phase 5 — Validation and narrative (week 8)

Back-test against CPI Transport and DGCA yield data. Formula sensitivity across Jevons/Dutot/Carli, with and without hedonics. Coverage stress test. Write the validation report.

**Exit:** M6 and M7 evidenced; validation report published.

---

## 9. How each metric is actually measured

A metric without an instrument is a wish.

| Metric | Instrument |
|---|---|
| M1 route panel | `SELECT count(DISTINCT route) FROM quote_clean WHERE collected_at > now() - '1 day'` → Prometheus gauge |
| M2 quote volume | Counter incremented on insert to `quote_clean`, by source |
| M3 collection success | `collected_stratum_slots / scheduled_stratum_slots`, computed at slot close, exported as gauge |
| M4 publication latency | `published_at − slot_close_at`, histogram |
| M5 imputation share | Σ(weight of imputed cells) / Σ(total weight), written into every `index_point` row and shown on the dashboard |
| M6 reproducibility | Nightly workflow: pick a random past date, re-run `compute_index` from archive + config hash, assert output hash equality |
| M7 external agreement | Quarterly script: Pearson correlation, MAE and turning-point agreement vs CPI Transport; output to the validation page |

Publish M3 and M5 **on the public dashboard**, not just internally. A price index that discloses its own coverage and imputation share is doing the thing that distinguishes official statistics from a scraped chart — and it is a visible differentiator in five seconds of a judge's attention.

---

## 10. Risk register

| Risk | Trigger to watch | Response |
|---|---|---|
| Oracle changes free tier again | Any docs change or shutdown email | Plan is portable: Postgres + Python + Docker. Migrate to another VM; R2 backup is the pivot point |
| ARM capacity unavailable at signup | "Out of capacity" for 3 days | Retry loop, then AMD micro instances |
| A major source blocks collection | Source success rate 0% for 2 slots | Drop it, publish reduced coverage, do not escalate evasion |
| All OTA sources block simultaneously | Coverage < 50% | Panel redesign around airline sites only; document the narrowing |
| Free tier of R2 exceeded | Storage > 8 GB | Tighten retention: JSON payloads 90 days hot, hashes only beyond |
| Grafana cardinality blowout | Series count > 8k | Drop per-route labels; aggregate before export |
| GH Actions schedules silently disabled | No backup-collector run in 24 h | Keepalive workflow; UptimeRobot check on the last-run timestamp |
| Index methodology challenged | Any reviewer question | Sensitivity analysis is already computed in Phase 5 — hand them the table |

---

## 11. Sources and verification dates

All verified 22 August 2026. Re-check before relying on any figure — three of these changed within the last six months.

- Oracle Always Free ARM reduction to 2 OCPU / 12 GB, effective 15 June 2026: https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/ and https://linuxiac.com/oracle-quietly-cuts-free-tier-ampere-a1-resources-in-half/
- Oracle termination of over-limit instances from 18 August 2026: https://fullmetalbrackets.com/blog/oci-free-tier-breakdown
- Amadeus Self-Service portal decommissioned 17 July 2026: https://www.phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers
- Flight API free-tier landscape after the shutdown: https://thunderbit.com/blog/best-flight-api-with-free-tiers
- GitHub Actions scheduled workflows — 5-min minimum, drift, 60-day public-repo disable: https://cronuru.com/guides/github-actions-scheduled-workflows
- Supabase free tier 500 MB and 7-day inactivity pause (tightened Feb 2026): https://agentdeals.dev/vendor/supabase
- Neon free tier 0.5 GB/project, 100 CU-hours: https://agentdeals.dev/neon-vs-supabase
- Cloudflare R2 free tier 10 GB, 1 M Class A / 10 M Class B ops, zero egress: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Workers/Pages/D1 free limits: https://agentdeals.dev/vendor/cloudflare-workers
- Grafana Cloud Free — 10k series, 50 GB logs, 14-day retention, 3 users: https://grafana.com/products/cloud/free-tier/
- UptimeRobot free plan, 50 monitors: https://cloudmonitoringplatforms.com/cloud-monitoring-pricing
- Playwright supported platforms, Ubuntu arm64: https://playwright.dev/python/docs/intro
- GitHub Student Developer Pack (free domain, DigitalOcean credit): https://education.github.com/pack
- DGCA aviation traffic dataset, ODbL: https://github.com/Vonter/india-aviation-traffic
- DGCA monthly statistics portal: https://www.dgca.gov.in/
- data.gov.in Monthly Air Traffic Statistics: https://www.data.gov.in/catalog/monthly-air-traffic-statistics

---

## 12. The one-week critical path

If time is short, this is the order that produces a defensible demo fastest:

1. Oracle VM provisioned, Postgres running (S1)
2. One source, tier-2 endpoint found, one fare stored (S3)
3. Three routes × three horizons × one slot, running on a timer
4. Jevons elementary index over that panel
5. Static JSON on R2, minimal dashboard on Pages
6. Grafana collection-success panel

Steps 1–6 are a working price index. Everything after that — hedonics, X-13, 60 routes, the API — makes it *good*. Do not invert that order.
