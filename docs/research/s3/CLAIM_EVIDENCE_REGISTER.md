# Claim & Evidence Register

Every load-bearing S3 claim, its evidence, and whether it is safe to put in front of judges.

**Legend.** *Primary* = the issuing body's own document. *Secondary* = reported by a third
party. **PRIMARY SOURCE NOT VERIFIED** = the claim is believed true but the issuing body's
own document was not retrieved. Confidence: High / Medium / Low.
Status: CONFIRMED · CORRECTED · WEAKENED · FALSIFIED · UNRESOLVED.

**SIH-safe?** Y = quotable as stated. N = do not present, or present only with the stated
qualification.

---

## Regulatory basis

| ID | Claim | Source | Type | Checked | Evidence location | Conf. | Status | SIH-safe? |
|---|---|---|---|---|---|---|---|---|
| CLM-01 | Rule 135, Aircraft Rules 1937: airlines shall establish tariff (135(1)); publish it **"in his website or two daily newspapers"** and display in office (135(2)); maintain records (135(3)); DGCA may direct on excessive/predatory tariff (135(4)) | Aircraft Rules 1937, as amended by GSR 254(E) 16.04.2009 | Secondary (Indian Kanoon rendering of the Rules) | 23 Aug 2026 | Rule 135, sub-rules 1–4 | High | CONFIRMED — but the redo's "requires website publication" was imprecise; the rule says website **or** newspapers | **Y** — quote sub-rule 2 exactly, including "or two daily newspapers" |
| CLM-02 | DGCA direction of 13 May 2025, File No. DGCA-27037/512024-AED-DGCA, superseding Air Transport Circular 02 of 2024 (28 Nov 2024): publish current Tariff Sheet conspicuously on the airline website; furnish route-wise tariff to DGCA on the 1st of each month; publish amended sheets on change with reasons | DGCA | **Secondary only** (regulatory-tracking service) | 23 Aug 2026 | — | Medium | CONFIRMED in substance · **PRIMARY SOURCE NOT VERIFIED** — `dgca.gov.in` unreachable across two sessions | **N as fact** — present as "reported"; obtain the original before any submission |
| CLM-03 | Collection of Statistics Act 2008 s.4–s.5 empowers the appropriate Government / statistics officer to specify and require statistical information | Act text | Secondary | 23 Aug 2026 | ss. 4, 5, 6 | High | CONFIRMED | **Y** |

## MoSPI methodology

| ID | Claim | Source | Type | Checked | Evidence location | Conf. | Status | SIH-safe? |
|---|---|---|---|---|---|---|---|---|
| CLM-04 | *"How the prices for airfares are collected in the CPI 2024 series? Ans: Airfares are collected through well-known online platforms."* | MoSPI CPI 2024 FAQ | **Primary** (PDF parsed) | 23 Aug 2026 | Q27, p.3 | High | CONFIRMED | **Y** — the single strongest quote available |
| CLM-05 | EG §3.9: price collection "with respect to advance ticket purchase as **21 days** and 60 days for domestic and international travel respectively"; data collected by State Regional Offices "from the well-known websites" for "the most popular routes as provided by DGCA" | MoSPI Expert Group Report | **Primary** (PDF parsed) | 23 Aug 2026 | §3.9, p.20 | High | CONFIRMED | **Y** |
| CLM-06 | The horizon is **not** a settled single value. Record: "fares prevailing **15 days prior**" (3rd/4th mtg, p.164) → "**7-day advance booking**" (5th mtg, p.179) → IMF TA Recommendation 11: specification "should also include a greater variety in terms of timing (**14 days advance purchase, 21 days advance purchase**) and not restricted to 7 days" (p.225) → §3.9 summary 21 days | MoSPI Expert Group Report | **Primary** | 23 Aug 2026 | pp. 164, 179, 225, 20 | High | **CORRECTED** — falsifies `s3-redo.md`'s "the official methodology is ONE horizon (T-21)" | **Y** — and it *supports* AeroDex's multi-horizon panel |
| CLM-07 | IMF TA Rec 11: "The airline is a price determining characteristic and should be part of the specification." | MoSPI Expert Group Report | **Primary** | 23 Aug 2026 | p.225 | High | CONFIRMED | **Y** |
| CLM-34 | MoSPI CPI 2024 uses **Jevons** for elementary indices and **Young / modified Laspeyres** for higher-level aggregation | MoSPI CPI 2024 FAQ | **Primary** | 23 Aug 2026 | Q20, Q21, p.3 | High | CONFIRMED — matches AeroDex's own choices | **Y** |
| CLM-35 | DGCA supplied the most-popular-route list; top three routes per airport, extended to top five for cities above one million population | MoSPI Expert Group Report | **Primary** | 23 Aug 2026 | §4.5.3.1 p.53; pp.179, 183 | High | CONFIRMED | **Y** |

## Tariff sheets — structure and empirical behaviour

| ID | Claim | Source | Type | Checked | Evidence location | Conf. | Status | SIH-safe? |
|---|---|---|---|---|---|---|---|---|
| CLM-08 | IndiGo publishes a route-wise sheet: `Market/Route v.v.` · `Type` (Maximum/Minimum) · optional `Distance` · `Fare-1…Fare-21`, plus a separate Business Class table and a YQ table by distance band (₹275–₹950); UDF/PSF/ASF/GST referenced | IndiGo sheets, parsed | **Primary** | 23 Aug 2026 | 14 sheets, Mar 2025–Aug 2026 | High | CONFIRMED | **Y** |
| CLM-09 | An all-inclusive fare **is** constructible from the IndiGo sheet | derived from CLM-08 | Primary | 23 Aug 2026 | taxes Table 2 + fare tables | High | CONFIRMED — the one Tier A claim that survived | **Y** |
| CLM-10 | **A "fare level" is a band, not a price.** Median Max/Min ratio 1.52× (Mar-25), 1.44× (Nov-25), 1.33× (Jan-26), 1.25× (Aug-26); p90 to 2.82×; only 0.3–2.5% identical | IndiGo sheets, parsed | **Primary** | 23 Aug 2026 | `evidence/tariff-comparability-results.md` §2 | High | CONFIRMED — **kills Tier A** | **Y** |
| CLM-11 | **Fare levels are not stable strata.** Median same-level MoM movement −21.3%…+10.0%; 12.3–52.8% of matched cells move >±25%; ladder-shift test best offset ≠ 0 in **5 of 11** pairs | IndiGo sheets, parsed | **Primary** | 23 Aug 2026 | `evidence/tariff-comparability-results.md` §3–4 | High | CONFIRMED — **kills Tier A** | **Y** |
| CLM-36 | **Route panel churns.** 4,110 → 1,919 routes Jul→Aug 2025 (46.6% survival); 2,072 routes added Oct→Nov 2025 | IndiGo sheets, parsed | **Primary** | 23 Aug 2026 | `evidence/tariff-comparability-results.md` §5 | High | CONFIRMED | **Y** |
| CLM-37 | Schema changed 3× in 18 months: `Market v.v.\|Fare−N` → `Route v.v.\|Distance\|Fare−N` → `Route.v.v.\|Distance\|Fare.N` | IndiGo sheets, parsed | **Primary** | 23 Aug 2026 | `evidence/tariff-comparability-results.md` §6 | High | CONFIRMED | **Y** |
| CLM-12 | Internet Archive holds **150 distinct IndiGo publication dates**, 2020-02-28 → 2026-08-04 | Wayback CDX | **Primary** | 23 Aug 2026 | CDX query | High | CONFIRMED — *larger* than `s3-redo.md` claimed | **Y** |
| CLM-13 | Archive retrieval is lossy: **14 of 18** attempts succeeded (78%); 7 of 14 were gzip-encoded | Wayback | **Primary** | 23 Aug 2026 | download log | High | CONFIRMED | **Y** |
| CLM-14 | Air India: 146 distinct tariff URLs — 23 from 2023, ~98 from 2024, 16 from 2025, **0 from 2026**; filenames have no stable convention | Wayback CDX | **Primary** | 23 Aug 2026 | CDX query | High | **CORRECTED** — falsifies `s3-redo.md`'s "republishes far more often than monthly" as a present-tense claim | **Y** with the year breakdown |

## Access controls — robots and terms, verified independently

| ID | Claim | Source | Type | Checked | Evidence location | Conf. | Status | SIH-safe? |
|---|---|---|---|---|---|---|---|---|
| CLM-15 | Air India T&C bars "accessing, monitoring, or copying any information on the Website using any robot, spider, scraper, or other automated means **or any manual process** for any purpose without our express written permission" | airindia.com | Secondary (search-surfaced clause text; page itself timed out) | 23 Aug 2026 | prohibited-activities list | Medium | CONFIRMED — reaches **manual** copying | **N verbatim** until the page is read directly; the substance is safe to summarise |
| CLM-16 | Air India Express `robots.txt` contains `Disallow: /dam` and `Disallow: /content/dam` — the path of its own tariff sheet | airindiaexpress.com/robots.txt | **Primary** (fetched, HTTP 200) | 23 Aug 2026 | robots.txt body | High | CONFIRMED | **Y** |
| CLM-17 | `assets.akasaair.com/robots.txt` returns **HTTP 403 AccessDenied**; under `aerodex/compliance.py` 403 ⇒ ACCESS_CONTROLLED ⇒ refuse. Akasa T&C carries the download carve-out **and** "personal and non-commercial use only" | Akasa | **Primary** (robots fetched) / Secondary (T&C) | 23 Aug 2026 | robots.txt; T&C | High | CONFIRMED | **Y** for robots; qualify the T&C |
| CLM-18 | Fly91 `robots.txt` is stock Drupal (disallows `/core/`, `/profiles/`, `/README.md` only) — the tariff path is **allowed**. But Fly91 T&C has **no download carve-out** | fly91.in | **Primary** (robots) / Secondary (T&C) | 23 Aug 2026 | robots.txt; T&C | High | CONFIRMED — the only robots-clean tariff host | **Y** |
| CLM-19 | `www.goindigo.in/robots.txt` and `www.airindia.com/robots.txt` were **unreachable** (timeout ×2 each, browser UA, 18s and 45s). Under `compliance.py`, unreachable ⇒ refuse | direct fetch | **Primary** (negative result) | 23 Aug 2026 | curl log | Medium — *may be geo-blocking from a non-Indian egress* | UNRESOLVED as to cause; CONFIRMED as to effect | **Y** with the caveat |
| CLM-20 | IndiGo and Akasa T&C both carry: "any downloading that occurs in the normal course of using the Website in accordance with the published written instructions … shall not be prohibited" | IndiGo / Akasa T&C | **Primary** (IndiGo read in browser) / Secondary (Akasa) | 23 Aug 2026 | T&C body | High (IndiGo) / Medium (Akasa) | CONFIRMED — but the separate no-copy clause still binds downstream use | **Y** as an *interpretation*, not a permission |
| CLM-38 | `urllib.robotparser` has four defects, each granting access a site refused (blank-line record termination; empty `Disallow:` as allow-all; `*`/`$` unimplemented; first-match instead of most-specific). The original S3 robots gate was therefore enforcing nothing | Python stdlib, tested | **Primary** | 23 Aug 2026 | `docs/spikes/robots-parser-defects.md`; `tests/unit/test_compliance.py` | High | CONFIRMED — replaced by `aerodex.compliance.RobotsRules` | **Y** — this is a genuine engineering contribution |

## Distribution economics

| ID | Claim | Source | Type | Checked | Evidence location | Conf. | Status | SIH-safe? |
|---|---|---|---|---|---|---|---|---|
| CLM-25 | Duffel Services Agreement 2.3 bars "an excessive Search-to-Order Ratio"; the definition adds *"For the avoidance of doubt, zero Orders shall be treated as one Order"*; 2.5(d) bars use "for metasearch purposes" | duffel.com/services-agreement | **Primary** (fetched twice, two sessions) | 23 Aug 2026 | clauses 2.3, 2.5(d) + definitions | High | CONFIRMED — re-verified | **Y** |
| CLM-26 | Travelpayouts: *"Yes, we prohibit sending automatic requests, especially just to get prices. Agencies pay revenue for each request to GDS … high amount of requests without bookings will cost a lot for them."* | Travelpayouts Help Centre | **Primary** (read in browser) | 23 Aug 2026 | search-API rules article | High | CONFIRMED — **falsifies `plan.md` §5.8's endorsement of Travelpayouts** | **Y** |
| CLM-27 | IndiGo and Air India operate NDC developer/partner portals; access requires a distribution agreement | developer.goindigo.in; ndc.airindia.com | Secondary | 23 Aug 2026 | portal pages | Medium | CONFIRMED | Y |
| CLM-28 | NDC aggregators (AirGateway et al.) require **IATA, TIDS or IATAN** accreditation; Indian B2B consolidators require agency registration, GST and negotiated deposits | vendor docs | Secondary | 23 Aug 2026 | vendor access pages | Medium | CONFIRMED | Y |
| CLM-29 | Skyscanner Travel API is partner-only with a traffic requirement; Travel Insight is enterprise-priced and supplies average fares, not quotes | partners.skyscanner.net | Secondary | 23 Aug 2026 | product pages | Medium | CONFIRMED | Y |
| CLM-30 | No free or academic **fare** tier found at IATA, ATPCO, OAG or Cirium (Cirium's student evaluation covers schedules; fares are a paid add-on) | vendor sites | Secondary | 23 Aug 2026 | product/education pages | Medium | CONFIRMED · *"not found", not "does not exist"* | Y with that qualification |
| CLM-32 | Amadeus Self-Service portal decommissioned 17 July 2026; keys disabled. Enterprise/AQC unaffected but commercial | Amadeus / trade press | Secondary | 23 Aug 2026 | shutdown notice | High | CONFIRMED | Y |
| CLM-33 | MakeMyTrip user agreement: user "shall not distribute exchange, modify, sell or transmit anything from the Website … for any business, commercial or **public purpose**" | makemytrip.com | **Primary** (read in browser) | 23 Aug 2026 | WEBSITE section | High | CONFIRMED | **Y** |

## Government data availability

| ID | Claim | Source | Type | Checked | Evidence location | Conf. | Status | SIH-safe? |
|---|---|---|---|---|---|---|---|---|
| CLM-21 | DGCA's Tariff Monitoring Unit monitors fares on 78 domestic routes monthly by reading airline websites; output is not published as microdata | DGCA / Parliament replies | Secondary | 23 Aug 2026 | ministerial replies | Medium | CONFIRMED | Y |
| CLM-22 | EG Recommendation 11(a): airfare prices for newly added routes "may be obtained from DGCA, as they **maintain data on the minimum and maximum tariffs for all routes across all airlines** to monitor airfares" — i.e. DGCA has already supplied airfare data to MoSPI | MoSPI Expert Group Report | **Primary** | 23 Aug 2026 | p.187, rec 11(a) | High | CONFIRMED — **the strongest single lead in S3** | **Y** |
| CLM-23 | "AirPrice Guardian" + Pricing Transparency Index is a **Parliamentary Standing Committee recommendation (March 2025)** with an 18–24 month proposed timeline — not a built system, not an airline commitment | Committee report / press | Secondary | 23 Aug 2026 | committee recommendations | Medium | **CORRECTED** — falsifies `s3-redo.md`'s "airlines have agreed to share pricing data with DGCA" | **N as stated in the redo**; safe only as "proposed" |
| CLM-24 | eSankhyiki is MoSPI's public statistical portal (launched 29 June 2024) publishing the monthly CPI index for "Air fare (normal): economy class", Base 2024=100, free and unauthenticated, with a REST API. It does **not appear** to publish route-level fare quotes, carrier identity or booking horizons | esankhyiki.mospi.gov.in | Primary (portal) / Secondary (SDK docs) | 23 Aug 2026 | `docs/spikes/s3-addendum-esankhyiki.md` | High | CONFIRMED, **wording softened** — see `evidence/esankhyiki-investigation.md` | **Y** in the precise formulation only |
| CLM-31 | `mospi-esankhyiki` exists on PyPI, MIT-licensed. **But:** PyPI metadata lists individual authors (Satvik Bajpai, Sarthak Srivastava) and "Development Status :: 3 - Alpha" — it is not evidently an official MoSPI product | pypi.org/pypi/mospi-esankhyiki/json | **Primary** | 23 Aug 2026 | PyPI JSON API | High | CONFIRMED with qualification — **verification 1 of 6** | **N to call it "official SDK"**; Y to say a public client exists |

---

## Verification budget

| # | Question | Why it was decision-critical | Result | Date |
|---|---|---|---|---|
| 1 | Does `mospi-esankhyiki` actually exist on PyPI? | `FINAL_S3_CONCLUSION.md` §N recommends building the M7 benchmark against it; recommending vapour would be a defect | Exists, MIT, **alpha, individually authored** — recommendation amended to prefer the REST API | 23 Aug 2026 |
| 2–6 | *unused* | Everything else was adjudicable from repo artifacts | — | — |

**5 of 6 remaining.** Deliberately not spent on: the DGCA original (CLM-02 — not
decision-critical, since the tariff route is dead on statistical grounds regardless); the
IndiGo/Air India robots retry (CLM-19 — already retried twice from the same egress, needs
an Indian IP, and only affects an ORANGE source).
