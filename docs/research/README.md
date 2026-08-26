# AeroDex research record

**Last updated: 25 August 2026.**

This directory holds AeroDex's source-feasibility research. Nothing here is deleted when it
is superseded — each pass is preserved with what overturned it, so a future reader can see
which hypotheses were already tested and not spend time re-running them.

> **Start here:** [`S3_FINAL_SOURCE_FEASIBILITY.md`](S3_FINAL_SOURCE_FEASIBILITY.md).

---

## Current conclusion

| | |
|---|---|
| **Verdict** | **OPTION B — a cheap paid API is sufficient for the MVP.** Sequenced as OPTION C (start on a demo panel) |
| **Primary source** | **SerpApi Google Flights API** (demo) → **HasData Google Flights API** (scale). Same underlying data, one adapter |
| **Backup source** | **Duffel** — richer fields, cheaper at scale, blocked on one written question about clause 2.5(d) |
| **Expected MVP cost** | **$25 once** (SerpApi Starter). **$99/month** for the full 60-route panel |
| **Can we build now?** | **YES** — no external approval required on the primary path |
| **Biggest risk** | Google Flights derivatives return no fare brand and no refundability, so 2 of 6 hedonic characteristics go unpopulated |

**This overturns the previous verdict** (*"B — proceed with permission path"*, 23 Aug 2026),
which was correct under the ₹0 constraint and AeroDex's own `compliance.py` rules. The
project owner removed those internal constraints; re-run without them, the answer changes.

---

## Research scope, 25 August 2026

Twenty named providers plus the search-result-API and airfare-intelligence product
categories, assessed on 29 axes: data type, India coverage, departure-date and
booking-horizon control, all-inclusive pricing, per-field availability, historical storage,
search-without-booking, price-monitoring permission, research permission, derived-index
publication, authentication, trial, price at three panel sizes, minimum commitment, approval
requirement and implementation effort.

Pricing was read from provider pages on 25 August 2026. Unverifiable figures are marked
**UNKNOWN** rather than estimated — see `S3_PRICING_AND_COST_MODEL.md` §4 and
`S3_EVIDENCE/pricing_sources.md`.

---

## Chronology

```
S3-original          docs/spikes/s3-source-mapping.md         NO-GO: zero sources usable
   ↓ falsified by
S3-redo              docs/spikes/s3-redo.md                   Five GREEN tariff sheets; "Tier A"
   ↓ falsified by
S3-verification      docs/spikes/s3-verification.md           Tier A killed empirically
   ↓ addended by
S3-eSankhyiki        docs/spikes/s3-addendum-esankhyiki.md    Dataset Link is a portal
   ↓ consolidated as
S3 consolidation     docs/research/s3/                        B — permission path
   ↓ OVERTURNED BY
FINAL S3/S4          docs/research/  (this level)             OPTION B — cheap paid API
```

---

## Files at this level

| File | What it answers |
|---|---|
| [`S3_FINAL_SOURCE_FEASIBILITY.md`](S3_FINAL_SOURCE_FEASIBILITY.md) | The verdict, the recommendation, and what changed |
| [`S3_PROVIDER_MATRIX.md`](S3_PROVIDER_MATRIX.md) | Per-provider verdicts, the 20-question methodology check, the product-category reclassification |
| [`S3_PRICING_AND_COST_MODEL.md`](S3_PRICING_AND_COST_MODEL.md) | Exact search volumes and monthly cost at DEMO / SMALL / FULL |
| [`S3_LEGAL_AND_CONTRACTUAL_MATRIX.md`](S3_LEGAL_AND_CONTRACTUAL_MATRIX.md) | Clause-level assessment, rules to keep, questions to ask providers |
| [`S3_MOSPI_ESANKHYIKI_FINDINGS.md`](S3_MOSPI_ESANKHYIKI_FINDINGS.md) | What the SIH Dataset Link is, what it provides, who to write to |
| [`S3_DECISION_LOG.md`](S3_DECISION_LOG.md) | Decisions D-01…D-09, the Part 8 internal-rule audit, revisit conditions |
| [`S3_PERMISSION_PATH.md`](S3_PERMISSION_PATH.md) | **Active workstream** — verified MoSPI addressee, the ready-to-send letter, outreach tracking, 1 Oct decision trigger |
| [`S3_EVIDENCE/`](S3_EVIDENCE/) | Every source URL behind every claim, with the date read |
| [`s3/`](s3/) | **The previous consolidation, preserved unmodified** |

---

## Unresolved questions

| # | Question | Blocks? |
|---|---|---|
| Q-01 | Does Duffel consider a statistical index "metasearch" under clause 2.5(d)? | Backup only |
| Q-02 | HasData hourly throughput cap on the Business plan | Scale-up only |
| Q-03 | SerpApi credit expiry on a stable plan | No |
| Q-04 | Apify cost per *search* vs per *result* | No |
| Q-05 | Does DGCA's tariff holding contain bands or offers? | No |
| Q-06 | Will MoSPI grant guidance, a support letter, or an introduction? (Microdata is ruled out — NMDS §3.2) | No — parallel track, 1 Oct trigger |
| Q-07 | What replaces `base.period: "2026-09"`? | **Yes — time-sensitive** |

---

## Next experiment

**Sign up for the SerpApi free tier (250 searches/month) and run one DEL→BOM query at each
of the seven horizons.** 7 searches. Confirm: the response shape matches
`S3_EVIDENCE/api_docs.md`, the price is tax-inclusive in INR with `gl=in`, and every field
the `Quote` dataclass needs is present.

That is 14 of 250 free searches, it needs no code, and it is the last unknown on the
critical path. Everything after it is engineering.
