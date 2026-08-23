# Evidence — Tariff-level comparability experiment

**Run:** 23 August 2026, during the S3 verification pass.
**Question:** *Can `Fare-N` be treated as a stable matched statistical stratum across
publication periods?*
**Answer given by the data: NO — on all three tests, independently.**

Numbers below are reproduced from the verification run recorded in
`docs/spikes/s3-verification.md`. Figures not recoverable from that file or from
`docs/spikes/s3-evidence.json` are marked `NOT RECORDED`.

---

## 1. Corpus

| Item | Value |
|---|---|
| Carrier tested | IndiGo (6E) |
| Sheets retrieved and parsed | **14** |
| Date range | 2025-03-01 → 2026-08-01 |
| Retrieval attempts | 18 |
| Successful | 14 (**78%**) |
| Failed | 4 — 1× HTTP 403, 3× Wayback error stubs (151,373 B) |
| Gzip-encoded, needed decompression | 7 of 14 |
| Distinct IndiGo publication dates in the CDX index | **150** (2020-02-28 → 2026-08-04) |
| Air India distinct tariff URLs in CDX | 146 — 23 (2023), ~98 (2024), 16 (2025), **0 (2026)** |
| Source | Internet Archive (`web.archive.org/web/<ts>id_/…`), zero load on carrier origins |
| Parse method | Column-position slicing driven by the header row; Economy and Business sections tracked separately |
| Known parser artefact | Route strings absorbed the first two characters of the Type column ("Ma"/"Mi"). Does **not** affect like-for-like tests (both sides share the convention); corrected before the Min/Max test. |

## 2. Test 1 — is a "fare level" a price point or a band?

Comparing the `Maximum` and `Minimum` rows for the same route and level.

| Sheet | Cells | p10 | **Median max/min** | p90 | Identical |
|---|---:|---:|---:|---:|---:|
| 2025-03-01 | 73,503 | 1.07 | **1.52×** | 2.37 | 2.3% |
| 2025-11-01 | 81,374 | 1.33 | **1.44×** | 2.82 | 0.4% |
| 2026-01-01 | 84,762 | 1.11 | **1.33×** | 2.08 | 2.5% |
| 2026-08-01 | 89,762 | 1.11 | **1.25×** | 1.87 | 0.3% |

**Reading.** A tariff sheet publishes a permitted interval, typically 25–52% wide and
sometimes 2–3×. It contains no price. An index would have to select an arbitrary point
statistic, and that selection would drive the result. The median band is also **narrowing
monotonically** across the four sheets, so an index on midpoints would report band
compression as price movement.

## 3. Test 2 — same-level movement between consecutive publications

Log relative of `Fare-k`, matched on route, `Maximum` rows.

| Pair | Matched cells | Median | p10 | p90 | \|rel\| > 25% |
|---|---:|---:|---:|---:|---:|
| 2025-03-01 → 05-01 | 53,133 | **−21.3%** | −49.0% | −0.6% | **52.8%** |
| 2025-05-01 → 06-01 | 74,861 | −7.0% | −30.3% | +1.2% | 25.8% |
| 2025-06-01 → 07-01 | 47,929 | +10.0% | −1.2% | +40.9% | 23.1% |
| 2025-07-01 → 08-01 | 23,930 | +9.3% | 0.0% | +48.4% | 25.7% |
| 2025-08-01 → 09-01 | 28,951 | +5.5% | −2.0% | +26.7% | 13.8% |
| 2025-09-01 → 10-01 | 22,601 | +1.2% | −11.8% | +20.1% | 12.3% |
| 2025-10-01 → 11-01 | 17,771 | +2.5% | −10.8% | +30.5% | 20.1% |
| 2025-11-01 → 12-01 | 59,560 | **−16.7%** | −43.2% | +16.2% | **48.3%** |
| 2025-12-01 → 12-09 | 50,409 | −9.0% | −30.5% | −6.1% | 25.3% |
| 2025-12-09 → 2026-01-01 | 56,623 | −1.6% | −34.4% | +20.4% | 29.0% |
| 2026-01-01 → 03-01 | 63,264 | +5.7% | −1.6% | +59.5% | 25.8% |

**Reading.** Between 12.3% and 52.8% of matched cells move more than ±25% between
consecutive publications, with median swings of −21.3% and +10.0%. Indian domestic airfares
did not do this. These are filing revisions.

## 4. Test 3 — ladder-shift test

For each consecutive pair, search offsets s ∈ [−4, +4] and report the s minimising the
median |log relative| when `Fare-k(t)` is matched against `Fare-(k+s)(t+1)`.

| Pair | Best s | median \|rel\| at s=0 | median \|rel\| at best s |
|---|---:|---:|---:|
| 2025-03-01 → 05-01 | **+2** | 26.4% | 15.1% |
| 2025-05-01 → 06-01 | 0 | 9.7% | 9.7% |
| 2025-06-01 → 07-01 | **−1** | 10.0% | 7.5% |
| 2025-07-01 → 08-01 | **−1** | 11.0% | 9.2% |
| 2025-08-01 → 09-01 | **−1** | 7.3% | 7.1% |
| 2025-09-01 → 10-01 | 0 | 5.6% | 5.6% |
| 2025-10-01 → 11-01 | 0 | 8.2% | 8.2% |
| 2025-11-01 → 12-01 | 0 | 22.5% | 22.5% |
| 2025-12-01 → 12-09 | **+1** | 8.5% | 0.0% |
| 2025-12-09 → 2026-01-01 | 0 | 14.1% | 14.1% |
| 2026-01-01 → 03-01 | 0 | 8.3% | 8.3% |

**Best offset is non-zero in 5 of 11 pairs.** The 2025-12-01 → 12-09 case is decisive:
at s=+1 the median |relative| falls to **0.0%** — the ladder was shifted by exactly one
rung with the values otherwise unchanged. `Fare-7` is not the same stratum across periods.

Note also that even at the best offset, median |relative| ranges 5.6%–22.5%. There is no
alignment at which this behaves like a monthly price series.

## 5. Test 4 — route-panel churn

| Pair | Routes A | Routes B | Common | Surviving | Dropped | Added |
|---|---:|---:|---:|---:|---:|---:|
| 2025-03-01 → 05-01 | 3,830 | 3,946 | 3,808 | 99.4% | 22 | 138 |
| 2025-05-01 → 06-01 | 3,946 | 3,946 | 3,945 | 100.0% | 1 | 1 |
| 2025-06-01 → 07-01 | 3,946 | 4,110 | 3,607 | 91.4% | 339 | 503 |
| **2025-07-01 → 08-01** | 4,110 | 1,919 | 1,914 | **46.6%** | **2,196** | 5 |
| 2025-08-01 → 09-01 | 1,919 | 2,045 | 1,819 | 94.8% | 100 | 226 |
| 2025-09-01 → 10-01 | 2,045 | 2,194 | 1,952 | 95.5% | 93 | 242 |
| **2025-10-01 → 11-01** | 2,194 | 4,260 | 2,188 | 99.7% | 6 | **2,072** |
| 2025-11-01 → 12-01 | 4,260 | 4,391 | 4,204 | 98.7% | 56 | 187 |
| 2025-12-01 → 12-09 | 4,391 | 4,448 | 4,391 | 100.0% | 0 | 57 |
| 2025-12-09 → 2026-01-01 | 4,448 | 4,447 | 4,447 | 100.0% | 1 | 0 |
| 2026-01-01 → 03-01 | 4,447 | 4,634 | 4,447 | 100.0% | 0 | 187 |

The August–October 2025 sheets carry roughly half the network. Whether that is a partial
publication or a partial capture is `NOT RECORDED`; either way the published series is not
a consistent panel.

## 6. Structural instability

**Anchoring drift** — share of routes whose first populated level is `Fare-1` rather than
`Fare-3`:

| Sheet | Routes | Contiguous populated range | First-populated histogram |
|---|---:|---:|---|
| 2025-03-01 | 3,830 | 76.6% | {3: 2918, 1: 887, 2: 19, 13: 2, 19: 1, 7: 1} |
| 2025-11-01 | 4,260 | 88.7% | {3: 3763, 1: 476, 2: 21} |
| 2026-01-01 | 4,440 | 89.7% | {3: 3967, 1: 454, 2: 19} |
| 2026-08-01 | 5,084 | 97.9% | {3: 4965, 1: 99, 2: 16, 14: 1, 12: 1, 11: 1} |

Routes anchored at `Fare-1` fall from 23% to 2%. Populated levels are frequently
non-contiguous — e.g. `Agartala − Silchar` (2026-06-01) has a value at `Fare-1`, `NA` at
`Fare-2`, values from `Fare-3` on. Empty levels are rendered as **blank** in 2025 sheets
and as **`NA`** in 2026 sheets.

**Schema variants observed — three in eighteen months:**

| Variant | Header | Seen |
|---|---|---|
| V1 | `Market v.v. \| Type \| Fare−1…Fare−21` | 2025-03 → 2026-03 |
| V2 | `Route v.v. \| Type \| Distance \| Fare−1…Fare−21` | 2026-08 |
| V3 | `Route.v.v. \| Type \| Distance \| Fare.1…Fare.21` (dots, not hyphens) | 2026-06 |

V3 silently produced **zero** parsed rows until the parser was rewritten — the exact
failure mode a production adapter would hit without warning.

## 7. Worked example — IndiGo Mumbai–Delhi, economy, `Maximum` row

| Published | F-3 | F-5 | **F-7** | F-10 | F-15 | F-21 | F-7 band | MoM F-7 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2025-03-01 | 5,530 | 6,683 | **8,076** | 10,729 | 17,224 | 30,416 | 1.40× | — |
| 2025-05-01 | 5,133 | 6,203 | **7,496** | 9,958 | 15,986 | 28,230 | 1.27× | −7.2% |
| 2025-06-01 | 4,832 | 5,839 | **7,057** | 9,374 | 15,049 | 26,576 | 1.97× | −5.9% |
| 2025-07-01 | 4,832 | 5,694 | **6,682** | 8,877 | 14,251 | 25,166 | 1.86× | −5.3% |
| 2025-08-01 | 6,103 | 7,361 | **8,877** | 11,757 | 18,781 | 33,000 | 2.47× | **+32.8%** |
| 2025-09-01 | 6,131 | 7,391 | **8,909** | 11,790 | 18,807 | 33,000 | 2.48× | +0.4% |
| 2025-10-01 | 4,866 | 5,880 | **7,106** | 9,440 | 15,155 | 26,763 | 1.98× | **−20.2%** |
| 2025-11-01 | 5,067 | 6,123 | **7,399** | 9,830 | 15,780 | 27,867 | 2.06× | +4.1% |
| 2025-12-01 | 5,239 | 6,331 | **7,651** | 10,164 | 16,317 | 28,814 | 2.13× | +3.4% |
| 2025-12-09 | 27,384 | — | — | — | — | — | — | *parse anomaly* |
| 2026-01-01 | 5,500 | 6,331 | **7,651** | 10,164 | 16,317 | 28,814 | 2.13× | 0.0% |
| 2026-03-01 | 6,000 | 6,600 | **7,550** | 10,030 | 16,102 | 28,435 | 2.10× | −1.3% |
| 2026-06-01 | — | — | — | — | — | — | — | *V3 format, not parsed* |
| 2026-08-01 | 7,000 | 7,600 | **8,400** | 9,900 | 13,500 | 22,935 | 1.71× | +11.3% |

Note the ladder **reshaping** between 2026-03 and 2026-08: the bottom rises (F-3 6,000 →
7,000) while the top falls sharply (F-21 28,435 → 22,935). That is a redesign of the fare
structure, not a price movement, and no point statistic on the ladder would represent it
as one.

## 8. Panel coverage — the one thing that was fine

At 2026-08-01 the sheet carries **4,729 economy city pairs** and includes the AeroDex panel
trunk routes (`Mumbai − Delhi`, `Bengaluru − Delhi`, `Kolkata − Delhi`, `Delhi − Hyderabad`,
`Delhi − Chennai`, `Bengaluru − Mumbai`). Routes are named by **city, not IATA code**, and
`Mumbai` / `Navi Mumbai` are distinct entries — a mapping layer would be required.

## 9. Verdict

> **`Fare-N` cannot be treated as a stable matched statistical stratum across publication
> periods.**

Three independent failures, each sufficient alone:

1. It is a **band** (median 1.25×–1.52× wide), so there is no price to index.
2. It is **re-indexed** between publications (best offset ≠ 0 in 5 of 11 pairs; 12–53% of
   cells moving >±25%).
3. The **panel churns** (46.6% survival at one step) and the **schema changes** (3× in 18
   months).

Tier A is withdrawn. The tariff sheets retain one legitimate role: a published upper and
lower bound for **validation** — which is what DGCA's own Tariff Monitoring Unit uses them
for.

## 10. Not tested

- Only IndiGo was tested in series. Air India, Akasa, Air India Express and Fly91 were
  structurally inspected but **not** tested for cross-time comparability. Given the IndiGo
  result this is unlikely to change the conclusion, but it has not been run.
- Business Class tables were detected and separated but not analysed.
- The 2025-12-09 anomaly (122 pages, 5,664 routes, F-3 = 27,384 with the rest missing) was
  not diagnosed: `NOT RECORDED`.
- Whether the Aug–Oct 2025 route shortfall is a partial publication or a partial capture:
  `NOT RECORDED`.
