# FINAL S3 → S4 SOURCE & COST FEASIBILITY

**Status:** FINAL · **Research date: 25 August 2026** · supersedes the *verdict* of
`docs/research/s3/FINAL_S3_CONCLUSION.md` while preserving all of its evidence.

> **This document overturns the previous NO-GO.** The prior verdict
> (*"B — proceed with permission path"*) was correct **under the ₹0 constraint and
> AeroDex's own `compliance.py` rules**. The project owner has removed those internal
> constraints. Re-run under the new constraints, the answer changes.

---

## EXECUTIVE VERDICT

| | |
|---|---|
| **Verdict** | **OPTION B — a cheap paid API is sufficient for the MVP.** Sequenced as OPTION C (start on a demo panel). |
| **Primary source** | **SerpApi Google Flights API** for the demo panel; **HasData Google Flights API** on scale-up — same underlying data, one adapter |
| **Backup source** | **Duffel** (richer fields, cheaper at scale, one contractual question to clear first) |
| **Expected MVP cost** | **$25/month** (SerpApi Starter, 1,000 searches) for a 900-search demo panel. **$99/month** for the full 60-route panel on HasData |
| **Can we build now?** | **YES.** No external approval is required for the primary path |
| **Biggest remaining risk** | Google Flights derivatives do **not** return fare brand or refundability, so 2 of the 6 hedonic characteristics in `methodology.yaml` become unpopulated. Either drop them from the hedonic spec or clear Duffel's clause 2.5(d) |

---

## What changed, and why the answer changed with it

The previous S3 asked: *can AeroDex obtain fares that are **free** and pass **AeroDex's own
compliance gate**?* The answer was no, and that was correct.

Four of the five gates that produced that "no" were **self-imposed**:

| Gate | Kind | Status now |
|---|---|---|
| ₹0 recurring cost | AeroDex policy | Removed by owner decision |
| API keys / `Authorization` headers forbidden | AeroDex policy (`compliance.py:35`) | Removed by owner decision |
| robots.txt enforced on every host | AeroDex policy | Now provider-scoped |
| Intermediaries categorically rejected | AeroDex policy (`SOURCE_DECISION_MATRIX.md`) | Removed by owner decision |
| Provider terms of service | **External** | **Unchanged — still binding** |

Only the fifth is external, and the primary recommendation below does not breach it.

### The single most consequential finding

`compliance.py:35` blocks the API path *before any provider term matters*:

```python
FORBIDDEN_HEADERS = frozenset(
    {"authorization", "cookie", "x-api-key", "x-auth-token", "proxy-authorization"}
)
```

Every commercial flight API authenticates with `authorization` or `x-api-key`.
`Adapter.fetch()` → `assert_request_allowed()` → `assert_no_auth()` raises
`ComplianceError` before a paid, contracted, fully permitted request leaves the process.

The rule was written to mean *"do not log in to an OTA as a user."* As coded it forbids
**all credentialed access, including credentials AeroDex legitimately holds and paid for.**
That conflation — not OTA terms — was the binding constraint on the path the project
actually wants. See `S3_DECISION_LOG.md` and Part 8 of `S3_PROVIDER_MATRIX.md`.

---

## The primary recommendation

**Build against SerpApi's Google Flights API.**

**Why:**

1. **It solves the methodology's hard requirement.** The booking horizon is controlled *by
   construction*: AeroDex chooses `outbound_date`, so `outbound_date − collection_date` is
   exactly T-1 / T-3 / T-7 / T-14 / T-21 / T-30 / T-60. No provider co-operation needed.
2. **Real offered fares, not cached averages.** Google Flights results are live offers
   across all carriers serving the O–D — precisely what an Offered Fare Index requires,
   and the thing every "historical airfare dataset" product fails to provide at a
   controlled horizon.
3. **All-inclusive by default.** Google Flights displays a total including required taxes,
   GST and airport fees ([Google Travel Help](https://support.google.com/faqs/answer/2736504)),
   satisfying `methodology.yaml: validation.require_all_inclusive: true`.
4. **No booking funnel, no look-to-book ratio, no accreditation.** It is a search product,
   sold for exactly this purpose. This is the constraint that killed Duffel, Travelpayouts,
   Skyscanner, Kayak and every NDC/GDS route in the previous S3.
5. **Contractual protection.** SerpApi's *U.S. Legal Shield* offers up to $2 million in
   coverage for scraping and parsing search-engine data, provided the use is not illegal
   ([serpapi.com/pricing](https://serpapi.com/pricing), verified 25 Aug 2026).
6. **$25/month covers the demo panel.**

**Why HasData on scale-up:** identical underlying data (Google Flights), but $99/month
carries the *full* 60-route panel versus $725/month on SerpApi. Because the data source is
the same, one `GoogleFlightsAdapter` with a swappable provider backend serves both — the
migration is a config change, not a rewrite.

**Why Duffel is the backup, not the primary:** it returns everything AeroDex wants — tax
breakdown, baggage, fare brand, refundability — at $189/month for the full panel. But
Services Agreement **clause 2.5(d)** prohibits use "for metasearch purposes", and
**clause 2.3** caps the search-to-order ratio with zero orders in the denominator. A
statistical index is arguably not metasearch, but that needs Duffel's written confirmation.
One email. If they say yes, Duffel becomes the primary and the hedonic spec survives intact.

---

## What the primary source supports, and what it does not

`methodology.yaml` specifies six hedonic characteristics. Google Flights derivatives return:

| Characteristic | Available? | Notes |
|---|---|---|
| `stops` | ✅ | `len(layovers)` |
| `departure_time_bucket` | ✅ | `flights[0].departure_airport.time` |
| `carrier_type` | ✅ | derived from `airline` (full-service vs low-cost) |
| `duration_minutes` | ✅ | `total_duration` |
| `is_refundable` | ❌ | **not returned** |
| `baggage_included` | ⚠️ partial | free-text in `extensions[]`, not a structured allowance |

**Consequence:** 4 of 6 characteristics populate cleanly. Two options, both legitimate:

- **(a)** Reduce `hedonic.characteristics` to the four available, and record the change with
  a config-hash bump. The hedonic model remains valid — it is simply specified on fewer
  characteristics.
- **(b)** Clear Duffel's clause 2.5(d) and populate all six.

Do **not** silently leave `is_refundable` and `baggage_included` in the config while the
adapter never fills them. That would make `methodology.yaml` describe a model the code does
not fit — the same defect the gap audit already flagged for `index/hedonic.py`.

---

## What is now unblocked, in order

| When | Action | Removes |
|---|---|---|
| Today | Sign up for SerpApi free tier (250 searches/mo), verify DEL→BOM returns the expected shape | The last unknown |
| Today | Email Duffel about clause 2.5(d) and a statistical index | Opens the backup |
| Day 1–2 | The `SourcePolicy` refactor (Part 8) | AeroDex's own auth gate |
| Day 2–3 | `adapters/google_flights.py`, canary test, registry entry | The fixture-only state |
| Day 3–4 | Collect the demo panel for real | **The actual blocker** |
| Day 4 | Move `base.period` to the first real collection month | The 2026-09 trap |
| Day 5+ | Hedonic (reduced spec), eSankhyiki M7, `publish` command, dashboard | The unblocked backlog |

---

## What should NOT be built yet

- **Any OTA adapter.** MakeMyTrip, Cleartrip, ixigo, Yatra and EaseMyTrip terms are external
  and unchanged. The paid API path makes them unnecessary — do not take contractual risk
  for data you can buy for $25/month.
- **NDC / GDS / B2B consolidator integrations.** TripJack quotes ₹50,000–₹100,000 setup plus
  a reported ₹2 lakh deposit; Amadeus Self-Service was decommissioned 17 July 2026; Kiwi
  Tequila is invite-only. All are worse on every axis than the recommendation.
- **A multi-source plurality layer.** One source is acceptable for the MVP. Keep publishing
  the coverage ratio; add a second provider only after the first is running.

---

## Cross-references

| Question | File |
|---|---|
| Per-provider scoring on 29 axes | `S3_PROVIDER_MATRIX.md` |
| Exact search volumes and monthly cost | `S3_PRICING_AND_COST_MODEL.md` |
| Terms, clauses and what they permit | `S3_LEGAL_AND_CONTRACTUAL_MATRIX.md` |
| The eSankhyiki Dataset Link question | `S3_MOSPI_ESANKHYIKI_FINDINGS.md` |
| Decisions, reversals and revisit conditions | `S3_DECISION_LOG.md` |
| Every source URL behind every claim | `S3_EVIDENCE/` |
| The previous research, preserved | `docs/research/s3/`, `docs/spikes/` |
