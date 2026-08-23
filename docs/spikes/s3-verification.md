# Phase 0 · Spike S3 — independent verification of the redo

**Date:** 23 August 2026 · **Task:** verify every load-bearing claim in `s3-redo.md` against
primary sources, and try to disprove it.
**Constraints honoured:** no production code, no adapters, no changes to `methodology.yaml`
or `panel.yaml`, no accounts, no spend, no restriction bypassed.

---

## Headline

**The redo's central recommendation is wrong and is withdrawn.**

Tier A — the "Published Tariff Index" built on airline tariff sheets — **is not
methodologically valid**. This was tested empirically against 14 archived IndiGo tariff
sheets spanning March 2025 to August 2026 and it fails on three independent grounds, any
one of which is disqualifying.

The redo's *other* central claim — that no legally sanctioned source provides
horizon-controlled offered fares without a booking relationship — **survived every attempt
to falsify it**, and is now supported by a second independent provider stating the
underlying economics in its own words.

Net effect on the project: **S3 remains NO-GO, and the fallback the redo proposed does not
exist.** The existing AeroDex methodology survives unchanged; what is missing is a permitted
source, not a correct method.

---

## 1. Verified facts

### 1.1 Rule 135 and the DGCA direction — verified, with one correction

Rule 135, Aircraft Rules 1937 (as amended by GSR 254(E), 16.04.2009):

- **135(1)** every air transport undertaking "shall establish tariff having regard to all
  relevant factors, including the cost of operation, characteristics of service, reasonable
  profit and the generally prevailing tariff".
- **135(2)** shall "cause to be published the tariff established by him under sub-rule (1)
  **in his website or two daily newspapers**, and shall display such tariff in a conspicuous
  part of his office".
- **135(3)** maintain tariff records in the manner specified by DGCA.
- **135(4)** DGCA may issue directions where tariff is excessive or predatory or where the
  airline indulges in oligopolistic practice.

> **Correction to the redo.** Rule 135(2) says website **or** two daily newspapers. Website
> publication is not mandated by the rule itself — it became effectively mandatory only
> through the DGCA direction. The redo implied the statute compels website publication.

DGCA direction, **13 May 2025**, File No. DGCA-27037/512024-AED-DGCA, superseding Air
Transport Circular 02 of 2024 (28 Nov 2024): publish the current Tariff Sheet conspicuously
on the airline website; furnish the route-wise tariff to DGCA on the first day of each
calendar month; publish amended sheets on change, with reasons, under intimation to DGCA.

**Evidential caveat:** the DGCA original could not be retrieved — `dgca.gov.in` and the
airline origins were unreachable from this network throughout. The direction's text is
verified only against a regulatory-tracking secondary source. **Obtain the original PDF
before citing it in a submission.**

### 1.2 The five tariff sheets exist and were parsed

IndiGo's structure, verified by parsing 14 sheets: `Market/Route v.v.` · `Type`
(Maximum/Minimum) · optional `Distance` · `Fare-1 … Fare-21`; a **separate Business Class
table**; and a taxes section — `Taxes: Table 2` giving YQ fuel surcharge by distance band
(₹275 for 0–500 km rising to ₹950 above 2,000 km), plus UDF, PSF, ASF and GST references.

> **Confirmed from the redo:** an all-inclusive fare *is* constructible from IndiGo's sheet.
> That claim holds. It is the only Tier A claim that does.

Panel coverage is adequate: at 2026-08-01 the sheet carries 4,729 economy city pairs
including `Mumbai − Delhi`, `Bengaluru − Delhi`, `Kolkata − Delhi`, `Delhi − Hyderabad`,
`Delhi − Chennai`, `Bengaluru − Mumbai`. Routes are named by **city, not IATA code**, and
`Mumbai` and `Navi Mumbai` are distinct — a mapping layer would be required.

### 1.3 Tier A fails — three independent disqualifying findings

**(a) A "fare level" is a band, not a price.** Comparing the Maximum and Minimum rows for
the same route and level:

| Sheet | cells | p10 | median max/min | p90 | identical |
|---|---:|---:|---:|---:|---:|
| 2025-03-01 | 73,503 | 1.07 | **1.52×** | 2.37 | 2.3% |
| 2025-11-01 | 81,374 | 1.33 | **1.44×** | 2.82 | 0.4% |
| 2026-01-01 | 84,762 | 1.11 | **1.33×** | 2.08 | 2.5% |
| 2026-08-01 | 89,762 | 1.11 | **1.25×** | 1.87 | 0.3% |

A tariff sheet contains no price. It contains a permitted interval, typically 25–52% wide
and sometimes 2–3×. Any index must pick an arbitrary point statistic, and that choice would
drive the answer. Worse, the median band is **narrowing over time** (1.52 → 1.25), so an
index on midpoints would read band compression as price change.

**(b) Fare levels are not stable strata across publications.** Log relative of `Fare-k`
matched on route, Maximum rows, consecutive publications:

| pair | matched cells | median | p10 | p90 | \|rel\| > 25% |
|---|---:|---:|---:|---:|---:|
| 2025-03-01→05-01 | 53,133 | **−21.3%** | −49.0% | −0.6% | **52.8%** |
| 2025-05-01→06-01 | 74,861 | −7.0% | −30.3% | +1.2% | 25.8% |
| 2025-06-01→07-01 | 47,929 | +10.0% | −1.2% | +40.9% | 23.1% |
| 2025-07-01→08-01 | 23,930 | +9.3% | 0.0% | +48.4% | 25.7% |
| 2025-11-01→12-01 | 59,560 | **−16.7%** | −43.2% | +16.2% | **48.3%** |
| 2026-01-01→03-01 | 63,264 | +5.7% | −1.6% | +59.5% | 25.8% |

Between 12% and 53% of matched cells move by more than ±25% between consecutive
publications. A **ladder-shift test** — searching offsets s ∈ [−4, +4] for the s minimising
median |log relative| — finds the best match at **s ≠ 0 in 5 of 11 pairs** (s = +2, −1, −1,
−1, +1). For 2025-03-01→05-01 the median |relative| falls from 26.4% at s = 0 to 15.1% at
s = +2. The ladder is periodically re-indexed. `Fare-7` in March is not `Fare-7` in May.

The anchoring convention also drifts: the share of routes whose first populated level is
`Fare-1` (rather than `Fare-3`) falls from **23% (Mar 2025) to 2% (Aug 2026)**, and the
share of routes with a contiguous populated range rises from 76.6% to 97.9%. Populated
levels are frequently non-contiguous — e.g. `Agartala − Silchar` at 2026-06-01 has values
at Fare-1, NA at Fare-2, values from Fare-3 on.

**Worked example — IndiGo Mumbai–Delhi, economy, Maximum row, `Fare-7`:**

```
2025-03-01   8,076
2025-07-01   6,682
2025-08-01   8,877   +32.8%   <- one month
2025-09-01   8,909
2025-10-01   7,106   -20.2%   <- one month
2026-01-01   7,651
2026-08-01   8,400   +11.3%
```

Indian domestic airfares did not rise 33% in August 2025 and fall 20% in October 2025. These
are filing revisions. The `Fare-7` band width over the same period swings 1.27× → 2.48× →
1.71×.

**(c) The route panel churns violently.**

| pair | routes A | routes B | surviving | dropped | added |
|---|---:|---:|---:|---:|---:|
| 2025-06-01→07-01 | 3,946 | 4,110 | 91.4% | 339 | 503 |
| **2025-07-01→08-01** | 4,110 | 1,919 | **46.6%** | **2,196** | 5 |
| 2025-10-01→11-01 | 2,194 | 4,260 | 99.7% | 6 | **2,072** |

The August–October 2025 sheets carry roughly half the network. Whether that is a partial
publication or a partial capture, the published series is not a consistent panel.

**Additionally: the schema changed three times in 18 months.**
`Market v.v. | Type | Fare−N` → `Route v.v. | Type | Distance | Fare−N` →
`Route.v.v. | Type | Distance | Fare.N` (dots, not hyphens — this silently produced zero
parsed rows for 2026-06-01 until the parser was fixed).

### 1.4 robots.txt — the check the redo never ran

This is decisive under AeroDex's own `compliance.py`, which treats 401/403/429 as
`ACCESS_CONTROLLED` and any unreachable robots.txt as `UNREACHABLE`, both refused.

| Host | robots.txt result | Tariff-sheet path | Verdict under `compliance.py` |
|---|---|---|---|
| `www.airindiaexpress.com` | 200 — `Disallow: /dam`, `Disallow: /content/dam` | `/content/dam/airindiaexpress/documents/…` | **REFUSED — explicitly disallowed** |
| `assets.akasaair.com` | **403 AccessDenied** (S3) | `assets.akasaair.com/f/…/fare-sheet-akasa-air.pdf` | **REFUSED — access controlled** |
| `www.goindigo.in` | **timeout ×2**, browser UA, 18s+45s | `/content/dam/s6web/…` | **REFUSED — unreachable** |
| `www.airindia.com` | **timeout ×2** | `/content/dam/air-india/pdfs/tariff/…` | **REFUSED — unreachable** |
| `fly91.in` | 200 — stock Drupal, disallows `/core/`, `/profiles/`, `/README.md` only | `/resources/tariff-sheet.pdf` | **ALLOWED** |

**Four of the five sources the redo called GREEN would be refused by AeroDex's own
compliance module.** Only Fly91 — the smallest carrier in the set — passes.

The IndiGo and Air India timeouts may be geo-blocking or WAF behaviour on this network
rather than a genuine outage; that is testable and is listed in §7.

Incidental corroboration: SpiceJet's robots.txt contains absolute-URL `Disallow` directives
(`Disallow: https://www.spicejet.com/api/v1`) — exactly the `MALFORMED_INTENT` case
`compliance.py` already handles.

### 1.5 Terms of use — verified individually, not by assumed template

| Carrier | Download carve-out | Other restrictions |
|---|---|---|
| **IndiGo** | **Yes** — "any downloading that occurs in the normal course of using the IndiGo website in accordance with the published written instructions of IndiGo shall not be prohibited" | may not "copy, replicate … transfer" information "for any purpose whatsoever, without the prior written permission" |
| **Akasa** | **Yes** — identical carve-out wording | plus "meant for **personal and non-commercial use only**" |
| **Fly91** | **No carve-out found** | downloading/exporting prohibited without written permission; personal, non-commercial only |
| **Air India** | none found | prohibits "accessing, monitoring, or copying any information on the Website using any robot, spider, scraper, or other automated means **or any manual process** for any purpose without our express written permission" |
| **Air India Express** | none found | prohibits "any automated use of the system, including using scripts, data mining, robots" except "standard search engine or Internet browser usage" |

> **Correction to the redo.** It asserted the carve-out for all five ("as above"). That was
> unverified and is false for three of them. Air India's clause is materially stricter than
> the others — it reaches **manual** copying, which the redo's "a person can just download
> them" argument does not survive.

### 1.6 Archive availability — real, but smaller and lumpier than claimed

- **IndiGo: 150 distinct publication dates** in the Wayback CDX index, 2020-02-28 to
  2026-08-04, dense from March 2023. *This is more than the redo claimed* (it said "from
  2025-01-31 onward" — an artefact of a truncated query).
- **Retrieval success: 14 of 18 attempted (78%).** Four returned Wayback error stubs or 403.
  The CDX index overstates what is actually fetchable.
- Seven of fourteen retrieved files were **gzip-encoded** and had to be decompressed before
  parsing — a real ingestion wrinkle.
- **Air India: 146 distinct tariff URLs, but 23 from 2023, ~98 from 2024, 16 from 2025, and
  ZERO from 2026.**

> **Correction to the redo.** "Air India republishes far more often than monthly" was true
> for 2024 and is false since; and the Air India back-series **stops in 2025**, so it does
> not reach the present.

Air India filenames have no stable convention: `TARIFF-SHEET-AS-ON-8th-JAN-2024.pdf`,
`31th-JAN-2024` (sic), `2DEC'24.pdf`, `TARIFFSHEET-AS-ON-22-nov-24.pdf`,
`21JANUAR2025.pdf` (sic). URL construction is impossible; discovery must go through the
archive or the live page each time.

### 1.7 MoSPI — verified, and the redo oversimplified it

Verbatim, CPI 2024 FAQ Q27: *"How the prices for airfares are collected in the CPI 2024
series? Ans: **Airfares are collected through well-known online platforms.**"* — confirmed.

But the Expert Group record shows an **evolving, multi-horizon** position, not a settled
T-21:

- 3rd/4th meeting: *"These airfares would be fares prevailing **15 days prior** to the date
  of journey."*
- 5th meeting: *"EG suggested to update the data collection methodology with **7-day advance
  booking** and all the routes may be allocated equally among the first three weeks of a
  month so that the date of airfare collection and date of travel fall in the same month."*
- **IMF Technical Assistance, Recommendation 11:** *"The specification should also include a
  greater variety in terms of timing (**14 days advance purchase, 21 days advance purchase**)
  and not restricted to 7 days advance purchase."* — and *"The airline is a price determining
  characteristic and should be part of the specification."*
- §3.9 summary: *"advance ticket purchase as **21 days** and 60 days for domestic and
  international travel respectively"*.

> **Correction to the redo.** It said "the official Indian methodology is ONE booking horizon
> (T-21)" and used that to argue AeroDex's panel is over-specified. That is wrong in a way
> that **favours AeroDex**: the IMF advisor to MoSPI explicitly recommended *multiple*
> advance-purchase horizons and named the carrier as a price-determining characteristic.
> AeroDex's 7-horizon, carrier-attributed panel is aligned with expert advice to MoSPI, not
> excessive relative to it.

Route selection is confirmed: DGCA supplies the most popular routes; top three per airport,
extended to top five for cities above one million population.

### 1.8 Duffel and Travelpayouts — re-verified against live terms

Duffel Services Agreement, re-fetched and confirmed verbatim: clause 2.3 (excessive
Search-to-Order Ratio); the definition including *"For the avoidance of doubt, zero Orders
shall be treated as one Order for the purposes of calculating the Search-to-Order Ratio"*;
and clause 2.5(d) barring use "for metasearch purposes". **Unchanged and still fatal.**

Travelpayouts, read directly from the Help Centre — the full statement, which is stronger
than the redo's paraphrase:

> "Yes, we prohibit sending automatic requests, especially just to get prices. **Agencies pay
> revenue for each request to GDS (Global Distribution System). So, high amount of requests
> without bookings will cost a lot for them.** They will address us to ask why there are no
> bookings with such big amount of requests being made. We and you get revenue from agencies,
> so we need to respect the rules."

This is the look-to-book economics stated by a second, unrelated provider in plain language.
The redo's structural claim is now corroborated rather than merely inferred.

---

## 2. Claims that are only interpretations

Stated as interpretation, not fact. None should be relied on without counsel.

1. **That IndiGo's and Akasa's download carve-out covers the tariff sheet.** A reasonable
   reading — both link the sheet from their own footers — but untested, and in both cases
   the separate no-copy clause still bites on downstream use. Akasa's "personal and
   non-commercial use only" is a further obstacle for a published index.
2. **That a compelled regulatory disclosure overrides a contrary term of use.** Intuitive,
   argued nowhere, tested nowhere. Do not assert it as settled.
3. **That fare tables lack copyright under *Eastern Book Company v. D.B. Modak*.** A
   supporting argument at best. The *selection and arrangement* of 21 levels across 4,700
   routes is not obviously devoid of skill and judgment.
4. **That MoSPI or DGCA would grant access.** Plausible and well-founded — see §4 — but
   unevidenced until asked.
5. **That the IndiGo and Air India robots.txt timeouts are geo-blocking rather than genuine
   unavailability.** Untested from an Indian IP.

---

## 3. Claims that are unsupported or wrong

Seven corrections to `s3-redo.md`, in descending order of consequence.

1. **"Ship Tier A" — wrong.** Disproved empirically in §1.3. Withdrawn in full.
2. **"Five GREEN sources" — wrong.** Not one is unambiguously usable. Four of five fail
   AeroDex's own robots gate; three of five have no download carve-out; Air India's terms
   reach manual copying. The correct classification is in §5.
3. **"The official Indian methodology is one booking horizon (T-21)" — wrong.** The record
   shows 15 → 7 days in practice and an IMF recommendation for *multiple* horizons.
4. **"Air India republishes near-daily" — wrong outside 2024**, and its archive series stops
   in 2025.
5. **"AirPrice Guardian — airlines have agreed to share aggregated pricing data with DGCA"
   — overstated.** This is a **Parliamentary Standing Committee recommendation of March
   2025** for a system "tentatively named" AirPrice Guardian, with an 18–24 month proposed
   timeline. It is not a DGCA-implemented system and not a commitment by airlines. Downgrade
   to "proposed".
6. **"Rule 135 requires website publication" — imprecise.** The rule says website *or* two
   daily newspapers; the DGCA direction supplied the website requirement.
7. **"Back-series to mid-2023 reconstructible" — only partly.** True for IndiGo with gaps and
   a 78% retrieval rate; false for Air India beyond 2025.

---

## 4. New qualifying sources

Only one is materially new, and it is the best lead in either report.

**4.1 DGCA's tariff dataset, via the MoSPI precedent — YELLOW, high value.**
From the Expert Group report, recommendation 11(a):

> "Airfare prices for newly added routes in 11 cities for previous months (January to July)
> **may be obtained from DGCA, as they maintain data on the minimum and maximum tariffs for
> all routes across all airlines to monitor airfares.**"

Two things follow. First, DGCA holds a route × airline × month min/max tariff dataset.
Second — and this is the point — **MoSPI has already obtained historical airfare data from
DGCA on request**, and the transaction is minuted in a published government report. That is
a documented precedent with a named counterparty, not a hopeful inference.

Caveat that must travel with it: what DGCA holds is described as *minimum and maximum
tariffs*, i.e. the same band structure that §1.3(a) shows is not a price. It may be no more
usable than the tariff sheets. **Ask what the fields actually are before assuming.**

**4.2 IRCTC Air — YELLOW, unexplored.** `air.irctc.co.in` is operated by IRCTC, a PSU 62.4%
owned by the Government of India and a public authority under s.2(h) of the RTI Act. It
sells domestic air tickets, including the mandated channel for government-funded travel.
It is the only Indian OTA against which a statutory information request is available.
Realistic obstacles: commercial-confidence exemption under s.8(1)(d), and its data would be
transactions through one agent, not market quotes.

**4.3 Fly91 — the only robots-clean tariff sheet.** Noted for completeness; its terms still
prohibit downloading without written permission, and it is a small regional carrier.

---

## 5. Sources definitively ruled out

| Source | Ruling |
|---|---|
| **Tier A tariff methodology (all carriers)** | Bands not prices; ladder re-indexed; panel churn to 46.6%; schema unstable. Not a price index. |
| **Air India Express tariff sheet** | robots.txt `Disallow: /content/dam` — the sheet's own path. Terms bar automated use. |
| **Akasa tariff sheet** | Asset host returns 403 on robots.txt → refused by `compliance.py`. Terms: personal, non-commercial only. |
| **Air India tariff sheet** | Terms bar copying by robot *or any manual process* without express written permission; robots.txt unreachable; no 2026 archive. |
| **Duffel** | Clause 2.3 + zero-Orders-counts-as-one + 2.5(d). Re-verified live. Paying does not cure it. |
| **Travelpayouts** | Provider states it prohibits automatic requests for prices, and why. Re-verified live. |
| **Amadeus Self-Service** | Decommissioned 17 July 2026. |
| **NDC aggregators** (AirGateway, Verteil, Kyte, Duffel, Mystifly, TPConnects) | Require **IATA, TIDS or IATAN** accreditation — agency identity. AeroDex cannot hold one. |
| **MakeMyTrip / goibibo / Cleartrip / ixigo / Yatra / EaseMyTrip** | Terms prohibit automated access and compilation. |
| **Aviationstack / AeroDataBox / FlightAPI / OpenSky / ScrapingBee free tiers** | Tracking and status data, or scraping-as-a-service; not sanctioned fare quotes. |
| **AirPrice Guardian / Pricing Transparency Index** | Proposed, not built. Cannot be planned against. |

**Falsification attempt on the structural claim — result: not falsified.** Searched airline
NDC programmes, B2B consolidators, NDC aggregators, sanctioned APIs, commercial datasets,
academic and research repositories, government arrangements, and free-tier APIs. Every
horizon-bearing channel gates on either accreditation (IATA/TIDS/IATAN), a booking
relationship (look-to-book), or enterprise licensing. No counterexample was found.

---

## 6. Does the existing methodology survive? Is Tier A valid?

**`methodology.yaml` and `panel.yaml` survive unchanged.** Nothing in this verification
touches the index design. Jevons on matched quotes, hedonic adjustment on stops / departure
window / carrier type / duration / refundability / baggage, Lowe aggregation on DGCA weights,
`require_all_inclusive: true` — all remain correct and are, if anything, *better* supported
than before: the IMF's advice to MoSPI recommends multiple advance-purchase horizons and
naming the carrier as a price-determining characteristic, which is what the panel already
does. **The deficiency is source-side, not method-side.**

**Tier A is not methodologically valid.** It cannot produce a price (bands 25–52% wide), it
cannot produce a comparable stratum over time (ladder re-indexed, 12–53% of cells moving
>25% per publication), and it cannot produce a stable panel (46.6% route survival at one
step). It also lacks departure date, flight, time and booking horizon, as the redo already
recorded. It is withdrawn.

One narrow, honest use survives: the tariff sheets are a **legitimate reference series for
validation** — a published upper and lower bound against which observed fares can be
sanity-checked, which is exactly what DGCA's own Tariff Monitoring Unit uses them for. That
is a validation input for M7, not an index.

---

## 7. The single highest-value next experiment

**Send one letter to MoSPI's Prices and Cost of Living Division, and to DGCA, asking for the
airfare dataset MoSPI already receives from DGCA — citing the Expert Group report's own
recommendation 11(a) as precedent — and asking what fields it contains.**

It is the highest-value action because it is the only one that can change the answer. Every
technical avenue has now been tested twice and closed. The blocker is authority, and the
sponsor of the problem statement is the authority. The ask is small, the precedent is
documented in the government's own published report, and the reply also resolves the open
question in §4.1: whether DGCA's holding is a usable fare series or just the same bands.

**Cost:** one email. **Lead time:** weeks. **Start it before any further engineering.**

**Second, cheap, and strictly falsifiable:** re-run the robots.txt fetch for
`www.goindigo.in` and `www.airindia.com` **from an Indian IP** (the Oracle Mumbai/Hyderabad
instance from S1, once it exists). That single fact decides whether even a validation-only
use of the IndiGo tariff sheet passes AeroDex's own compliance gate, and it takes minutes.

---

## 8. What was not done

- The DGCA direction of 13 May 2025 was **not** obtained in original; `dgca.gov.in` was
  unreachable throughout. Verified only against a regulatory-tracking secondary source.
- IndiGo, Air India and Air India Express origin servers were unreachable from this network;
  all tariff-sheet analysis used Internet Archive copies.
- Only IndiGo sheets were parsed in series. Air India, Akasa, AIX and Fly91 were structurally
  inspected in the previous pass but not tested for cross-time comparability. Given the
  IndiGo result, that test is unlikely to change the conclusion, but it has not been run.
- The Business Class tables were detected but not analysed.
- SpiceJet's current tariff sheet was still not located; its old `/pdf/Tariffs.pdf` path now
  returns HTML.
- No accounts, no spend, no bypass. Two public terms pages that refused automated fetching
  were read in an ordinary browser.
