# Phase 0 · Spike S3 (redo) — adversarial re-examination

**Date:** 23 August 2026 · **Brief:** disprove the S3 NO-GO if possible; search far wider than
the original six candidates; distinguish *technically possible* from *legally permitted*.
**Constraints honoured:** no accounts created, no money spent, no restriction bypassed, no
production adapter written.

---

## Verdict

**The previous S3 conclusion is partly wrong and partly right, and it was right for the
wrong reason.**

| Claim in the previous S3 | Status |
|---|---|
| "Zero sources are currently usable." | **Falsified.** Five legally clean sources were found and verified. |
| "Every source with usable fare data prohibits automated collection." | **Falsified as stated.** IndiGo's terms contain an express carve-out that permits the relevant download. |
| The panel cannot be collected as designed. | **Upheld — on stronger grounds than terms of use.** |

The NO-GO survives, but the reason changes completely, and the new reason is sharper,
more defensible and more useful:

> **Every source that carries a booking horizon prices search as a cost recovered by
> bookings. AeroDex books nothing. Every source that does not price search that way
> does not carry a booking horizon.**
>
> The legality dimension and the horizon dimension are mutually exclusive across the
> entire Indian market. This is a structural property of airline distribution economics,
> not a policy preference of individual websites, and no amount of source-hunting
> dissolves it.

What *has* changed is that AeroDex is no longer a project with no data. It has five
verified, free, legally clean, machine-readable fare sources with a back-series to 2023 —
they just measure a different thing than the current `methodology.yaml` measures.

---

## 1. What was found that the previous S3 missed

### 1.1 Regulator-mandated tariff sheets — a whole source class

Rule 135 of the **Aircraft Rules, 1937** requires airfare information in the public domain
to be adequate and easily accessible. DGCA gave that teeth in a direction dated
**13 May 2025** (File No. DGCA-27037/512024-AED-DGCA, superseding Air Transport Circular
02 of 2024):

> All scheduled domestic airlines are directed to **publish the current Tariff Sheet in a
> conspicuous manner on their airline website** so as to make the Tariffs easily accessible
> and visible.

> Airlines shall furnish a copy of the tariff established under sub-rule (1) of rule 135
> **route-wise across its network in various fare categories, in the manner it is offered
> in the market**, to DGCA on **every first day of the calendar month**.

Every scheduled Indian carrier therefore publishes a route-wise fare table, monthly or more
often, at a stable URL, as a legal obligation. **This was not in the previous candidate
list at all.** Five were downloaded and parsed:

| Carrier | File | Structure verified |
|---|---|---|
| **IndiGo** | `IndiGo-Tariff-Sheet-2026-03-24.pdf` (65 pp) | Market (city pair, v.v.), Type = Maximum/Minimum, **Fare-1 … Fare-21** — 21 fare levels × 2 bounds per route, whole network |
| **Air India** | `TARIFF-SHEET-AS-ON-03NOV2025.pdf` (8 pp) | Origin, Destination, **Distance**, Min/Max, **Level 1 … 13**; separate Economy / Premium Economy / Business & First tables; **full Taxes/Fees/Charges table by airport**; fare brands (Value/Classic/Flex) with baggage kg and change/cancellation fees |
| **Air India Express** | `Air_India_Express_Tariff_Sheet.pdf` (8 pp) | Base fares split by **Direct (non-stop) / Via / Connecting**, Economy vs Business, fare brands (Xpress Value / Flex / Return / Student / Defence), fees + GST tables, explicit "Total Fare Payable" recipe |
| **Akasa Air** | `fare-sheet-akasa-air.pdf` (2 pp, updated 3-Aug-26) | Market, Type, **Stops**, **Fuel Charge (YQ)**, Fare_Level_n |
| **Fly91** | `tariff-sheet.pdf` (2 pp, Aug'26) | From, To, **RCS flag**, Stops, YQ, Fare 1 … n |

SpiceJet is under the same obligation; its old `spicejet.com/pdf/Tariffs.pdf` path now
returns HTML, and the current location was not located. Treat as "exists, unverified".

**Sample, IndiGo 2026-03-24, verbatim from the parsed sheet:**

```
Market v.v.                 Type      Fare-1  Fare-2  Fare-3  Fare-4  ...  Fare-15
Agartala − Bagdogra         Maximum      NA      NA    3064    3362   ...    9357
Agartala − Bagdogra         Minimum      NA      NA    2196    2414   ...    6839
```

**Sample, Air India 03-Nov-2025 Economy base fare:**

```
S.No  Origin      Destination  Distance  Min/Max   Level 1  Level 2 ... Level 13
 3    Ahmedabad   Mumbai        443      Minimum      797     1967  ...  17224
 4    Ahmedabad   Mumbai        443      Maximum     2974     3467  ...  40040
```

### 1.2 A multi-year back-series already exists, off the airlines' servers

The Internet Archive holds these files. Queried via the CDX API (no load on the airlines):

- **Air India: 146 distinct tariff-sheet PDFs archived** — 25 from 2023, 86 from 2024,
  16 from 2025. Air India republishes far more often than monthly.
- **IndiGo:** dated sheets from `2025-01-31` onward, including intra-month revisions
  (`2025-06-04`, `2025-08-18`, `2025-09-22`, `2025-12-09`, `2025-12-10`, …).
- Historical IndiGo URLs are **still live on the origin** too — `2025-08-01`,
  `2026-01-01`, `2026-03-24` all returned HTTP 200 on a HEAD request.

A back-series to mid-2023 is therefore reconstructible without a single fare query.

### 1.3 IndiGo's own terms expressly permit the download

IndiGo's Terms and Conditions restrict copying, and then carve out exactly this case:

> "Customers must not download or otherwise export or re-export any software or underlying
> information or material available through the IndiGo website except with the written
> permission of IndiGo … **provided, however that any downloading that occurs in the normal
> course of using the IndiGo website in accordance with the published written instructions
> of IndiGo shall not be prohibited**"

IndiGo's own site footer carries a **"Tariff Sheet"** link under QUICK LINKS. Following the
link the operator publishes, to fetch the document the regulator compels them to publish
conspicuously, is downloading "in the normal course … in accordance with the published
written instructions of IndiGo". It is inside the carve-out, not outside it.

Two caveats stated honestly:

- The same terms still say the customer may not "copy, replicate … transfer … any
  information obtained from IndiGo website … for any purpose whatsoever, without the prior
  written permission". AeroDex publishes *derived statistics*, not the sheet — but this is
  an argument, not a certainty.
- Supporting, not decisive: the numbers are facts, and under *Eastern Book Company v. D.B.
  Modak* (SC, 2008) India requires skill-and-judgment beyond sweat-of-the-brow for
  copyright in a compilation. A regulator-specified table of fare bounds is a thin
  candidate for protection. **This is not legal advice and should not be relied on alone.**

The practical point that defuses most of this: **at 12–30 files per carrier per year, no
automation is needed.** A person can download them. Plan §7's automation rules are not even
engaged. That is a materially different posture from 1,155 automated fare queries a day.

### 1.4 MoSPI already does exactly what AeroDex proposes — and its method is public

The **MoSPI Expert Group Report on the CPI 2024 base revision** and the official CPI 2024
FAQ set out the national airfare methodology. Verbatim:

> **"How the prices for airfares are collected in the CPI 2024 series? Ans: Airfares are
> collected through well-known online platforms."** — CPI 2024 FAQ, Q27

> "EG also recommended the price collection to be conducted with respect to **advance ticket
> purchase as 21 days** and 60 days for domestic and international travel respectively.
> Airfare data are to be collected by State Regional Offices from the **well-known websites**
> and for the **most popular routes as provided by Directorate General of Civil Aviation
> (DGCA)**." — Expert Group Report §3.9

> "Air fare charges: The Directorate General of Civil Aviation (DGCA) provided a list of the
> most popular air routes, which was subsequently verified by the Field Operations Division
> (FOD) … Since airfares vary by booking platform and time slot, **prices were compiled from
> well-known websites across different time windows to ensure representativeness**."
> — Expert Group Report §4.5.3.1

Also from the same source: elementary indices use **Jevons**; higher-level use
**Young/Modified Laspeyres** — both matching AeroDex's choices.

Three consequences:

1. **The official Indian airfare methodology is ONE booking horizon (T-21 domestic), DGCA-
   supplied routes, several "well-known websites", collected by human investigators.**
   AeroDex's 7 horizons × 3 slots/day is roughly two orders of magnitude more granular than
   the national standard. The panel is not under-specified; it is over-specified.
2. **The reason MoSPI's collection is lawful and AeroDex's is not is neither technique nor
   politeness — it is statutory authority.** MoSPI collects under the Collection of
   Statistics Act, 2008 (s.4 empowers the appropriate Government to specify form and
   particulars; s.5 empowers a statistics officer to require information). A student project
   has no such mandate. The EU analogue is explicit about this: the ESS Web Content Retrieval
   Guidelines rest the whole practice on "Regulation (EC) No 223/2009" and require partners
   to "comply with the wishes of website owners as set out in terms and conditions".
3. **It is also the single strongest asset in the SIH pitch.** AeroDex is not proposing a
   novel activity of doubtful legality. It is proposing to automate, at higher frequency,
   something the sponsoring Ministry already does by hand.

### 1.5 DGCA is a live counterparty, not a theoretical one

- DGCA's **Tariff Monitoring Unit** monitors fares on **78 domestic routes monthly, by
  reading airline websites**, checking that carriers charge inside their declared bands —
  i.e. it reconciles observed fares against exactly the tariff sheets above. Coverage is
  ~27% of domestic traffic. International routes were added.
- DGCA reported a **20.5% rise in average airfare on 72 domestic sectors** (June 2026 vs
  March 2025) — so route-level fare aggregates exist inside DGCA today.
- After a two-year standoff in which carriers refused, **airlines have agreed to share
  aggregated pricing data with DGCA**, feeding an AI monitoring system ("AirPrice Guardian")
  with a public-facing "Pricing Transparency Index" planned; Phase I on high-traffic routes
  within six months, nationwide 2026.

None of this is published as microdata today. All of it is obtainable by a Ministry, by
Parliament question, or by RTI.

---

## 2. The structural blocker, stated precisely

Airline distribution runs on the **look-to-book ratio**: bookings earn money, shopping
requests cost money. The ratio was ~1:50 with human agents, ~1:500 with OTAs, past 1:10,000
with metasearch. Air France-KLM's ADM policy prices excess queries at €0.70 per 1,000 over a
1:1,000 baseline. Every sanctioned channel therefore meters search and recovers it from
bookings.

AeroDex issues ~1,155 searches/day and makes **zero** bookings. Its look-to-book is
undefined-or-infinite by construction. Duffel — the API most often named as the Amadeus
replacement — writes this into the contract rather than leaving it to interpretation:

> **Clause 2.3:** "You shall not use the Services in such a way that Duffel believes (acting
> reasonably) has or is likely to have an adverse impact on the Services, including sending
> excessive calls to the Duffel Platform and **an excessive Search-to-Order Ratio**."

> **Definition:** "the ratio calculated by the total number of calls to the Offer Request
> end-points … divided by the total number of Orders created in any given time period.
> **For the avoidance of doubt, zero Orders shall be treated as one Order** for the purposes
> of calculating the Search-to-Order Ratio."

> **Clause 2.5(d):** prohibits "access or use the Services for **metasearch purposes**
> (including to build a metasearch on top of the Duffel Platform…)".

Free searches are *earned by orders* — 10 orders/month buys 15,000 free searches; beyond the
ratio, $0.005/search. At zero orders AeroDex earns zero free searches, pays ~$5.78/day
(≈₹1.8 lakh/year against a ₹0 budget), **and is still in breach of 2.3 after paying**,
because the ratio itself is the prohibited thing.

Travelpayouts — which `plan.md` §5.8 endorses — fails the same way from the other side. It
"prohibits sending automatic requests, especially just to get prices", requires each search
to be user-initiated with results shown to the user in full with a buy button, and polices
conversion rate. Its rules article is literally titled *"Why the search API rules limit
conversion rate and prohibit the automatic collection of links to a booking"*.

**This generalises.** The only vendors that *can* sanction pure-search consumption are ones
whose business model is data rather than distribution — IATA (PaxIS / DDS / MarketIS, real
BSP-ticketed fares), ATPCO, OAG, Cirium, Amadeus Travel Intelligence, Skyscanner Travel
Insight. All are enterprise-priced. None is free, and none was found to have an academic
fare tier (Cirium's 30-day student evaluation covers schedules; fares are a paid add-on).

---

## 3. Top 20 candidates investigated

GREEN = usable now · YELLOW = usable only with permission/account/paid agreement · RED = inaccessible, prohibited, or methodologically unsuitable

| # | Candidate | Access | Permission | Horizon? | Class |
|---|---|---|---|---|---|
| 1 | **IndiGo Tariff Sheet** (Rule 135) | Public PDF, stable dated URL | Express ToS carve-out for downloads per published instructions | ✗ | **GREEN** |
| 2 | **Air India Tariff Sheet** | Public PDF, republished near-daily | Compelled disclosure; ToS restrictive but download is the published purpose | ✗ | **GREEN** |
| 3 | **Air India Express Tariff Sheet** | Public PDF | as above | ✗ | **GREEN** |
| 4 | **Akasa Air Fare Sheet** | Public PDF | as above; note ToS "personal and non-commercial" | ✗ | **GREEN** |
| 5 | **Fly91 Tariff Sheet** | Public PDF | as above | ✗ | **GREEN** |
| 6 | **Internet Archive back-series** of 1–5 | CDX API; 146 AI + ~20 IndiGo files | IA terms permit research use; zero load on airlines | ✗ | **GREEN** |
| 7 | SpiceJet Tariff Sheet | Under same DGCA duty; current URL not located | presumed as above | ✗ | GREEN (unverified) |
| 8 | **IndiGo NDC API** (`developer.goindigo.in`) | Self-signup portal, AirShopping/OfferPrice; live calls need subscription key | Distribution agreement; look-to-book applies | ✓ | **YELLOW** |
| 9 | **Air India NDC API** (`ndc.airindia.com`) | Partner registration, `ndcdistribution@airindia.com` | Distribution agreement | ✓ | **YELLOW** |
| 10 | **DGCA TMU monthly monitoring** (78 routes) | Not published | Ministry request / RTI / Parliament Q | ✓ (T-? undisclosed) | **YELLOW** |
| 11 | **MoSPI CPI airfare microdata** | Not published | Sponsor is MoSPI — ask | ✓ (T-21) | **YELLOW** |
| 12 | DGCA "AirPrice Guardian" airline-shared data | In development, Phase I ~6 months | Regulatory | ✓ | YELLOW |
| 13 | TripJack / TBO (Tek Travels) / Mystifly | B2B agent APIs, real Indian inventory | Agency registration, GST, negotiated deposit, look-to-book | ✓ | YELLOW |
| 14 | Skyscanner Travel API (partner) | Application, ~2 weeks, traffic requirements | Partner agreement, booking funnel | ✓ | YELLOW |
| 15 | Skyscanner Travel Insight / Vision | SaaS portal, SFTP/S3, API | Enterprise sales; "average fares" not quotes | partial | YELLOW |
| 16 | IATA PaxIS / DDS / MarketIS; ATPCO; OAG; Cirium | Real ticketed fares / filed tariffs | Enterprise licence, paid | ✓ | YELLOW |
| 17 | **Duffel** | Self-signup, test mode free | **Clause 2.3 Search-to-Order; zero orders = one order; 2.5(d) no metasearch** | ✓ | **RED** |
| 18 | **Travelpayouts Data API** (`plan.md` §5.8) | Free with affiliate account | Prohibits automatic requests for prices; cached "found by our users in the recent 48 hours"; cheapest-per-day only | ✗ (uncontrolled) | **RED** |
| 19 | **Amadeus Self-Service** | **Decommissioned 17 Jul 2026**, keys disabled | — | — | **RED** |
| 20 | MakeMyTrip / goibibo | Rich data | "shall not distribute exchange, modify, sell or transmit anything from the Website … for any business, commercial or **public purpose**"; limited licence "as expressly permitted" | ✓ | **RED** |

**Also investigated and rejected** (evidence in §6): Cleartrip, ixigo, EaseMyTrip, Yatra,
Trip.com, Agoda, Kayak/Momondo, Wego, Air India / Akasa / SpiceJet consumer sites,
Amadeus Quick Connect & Enterprise, Sabre Dev Studio / Bargain Finder Max, Kiwi Tequila,
SerpApi / Bright Data / Oxylabs / Apify, Common Crawl, Kaggle & Hugging Face historical
Indian fare datasets, data.gov.in / AirSewa, NDAP, AIKosh, UDAN RCS fare caps, Aviationstack,
AeroDataBox, FlightAPI.io, HappyFares Fare Index, consented data-donation panels.

---

## 4. Top 5 genuinely promising sources

Ranked by (legally clean) × (obtainable at ₹0) × (methodological usefulness).

**1. The five published tariff sheets, treated as one composite source.**
Free, legal, structured, whole-network, multi-carrier, back-series to 2023. Gives origin,
destination, carrier, currency, fare ladder with min/max bounds, publication timestamp, and —
depending on carrier — stops, cabin, distance, fare brand, baggage, refundability, fuel
surcharge and the airport tax table needed for an all-inclusive fare. Missing: departure
date, flight number, times, and **booking horizon**.

**2. MoSPI's own airfare collection.** The sponsor already runs it, at T-21, on DGCA routes,
from "well-known online platforms". Asking for the microdata (or for AeroDex to be adopted as
its automation) is a one-email ask with an unusually high prior of success, and it is the only
path that makes the *current* methodology legal rather than merely tolerated.

**3. DGCA TMU + the incoming airline-shared pricing feed.** 78 routes monthly today, moving to
an AI-driven system with a public transparency index. The natural permanent home for a national
airfare index. Slow, but it is the end-state.

**4. IndiGo and Air India NDC direct connections.** Real fares, real horizons, at the source,
with no OTA in the middle. Requires a written distribution or research agreement and will run
into look-to-book — but a research agreement can waive a commercial term, and an airline can
waive its own ToS in a way no OTA can waive an airline's.

**5. IATA PaxIS / BSP ticketed fares.** The methodologically *correct* source — realised
transaction prices, not quotes, which is what a price index ideally measures. Enterprise-priced;
worth naming in the roadmap because it shows the project knows what "best" looks like.

---

## 5. Exact blockers, one line each

| Source | Blocker |
|---|---|
| All 5 tariff sheets | **No booking-horizon dimension, no flight-level quote, no departure date.** Not a terms problem — a data-shape problem. |
| Akasa tariff sheet | ToS "personal and non-commercial use only" is broader than IndiGo's; needs the same courtesy notice. |
| SpiceJet | Current tariff-sheet URL not located. |
| Duffel | Clause 2.3 Search-to-Order Ratio; zero orders counted as one; 2.5(d) bars metasearch. Paying does not cure it. |
| Travelpayouts | Automatic price requests prohibited; data cached and horizon-uncontrolled; cheapest-per-day only — cannot meet `min_matched_quotes: 3`. |
| Amadeus Self-Service | Decommissioned 17 July 2026. |
| Amadeus AQC / Enterprise, Sabre, Travelport | Commercial agreement, account representative, booking volume expected. ₹0 budget fails first. |
| TripJack / TBO / Mystifly | Travel-agency registration, GST, negotiated security deposit, unpublished terms, look-to-book. |
| Skyscanner / Kayak / Wego / Momondo | Partner approval gated on traffic and a booking funnel; API terms assume redirect-to-book. |
| MakeMyTrip / goibibo / Cleartrip / ixigo / EaseMyTrip / Yatra | Terms prohibit automated access and compilation; MMT additionally bars transmitting content "for any business, commercial or public purpose". |
| Airline consumer sites (IndiGo, AI, AIX, Akasa, SpiceJet search pages) | Same prohibition; Air India's is verbatim the Cleartrip formula ("robot, spider, scraper … without express written permission"). |
| Kaggle / HF Indian fare datasets | Static, one-off, provenance is prohibited scraping, no controlled horizon. Usable at most as hedonic priors. |
| Common Crawl | Fare pages are sparse, undated relative to departure, and horizon-uncontrolled. |
| data.gov.in / AirSewa / NDAP / AIKosh | Schedules, status, traffic. **No fare datasets.** |
| UDAN RCS caps | Administered price ceilings, not market fares. |
| SerpApi / Bright Data / Oxylabs | Paid; and the intermediary's indemnity does not make the underlying access permitted. |
| IATA / ATPCO / OAG / Cirium / Skyscanner Insight | Enterprise pricing; no free or academic fare tier found. |

---

## 6. Is the ≥3-source requirement methodologically necessary?

**No. The kill condition is mis-specified.**

The sampling universe of an airfare index is (route × departure date × horizon × carrier ×
itinerary). A website is the *collection instrument*, not the sampling unit. Three instruments
observing the same universe do not make the estimate three times better; they make it robust to
one instrument failing or changing.

What the authorities actually do:

- **MoSPI** uses "well-known websites" — plural, unspecified count — "across different time
  windows to ensure representativeness", at **one** horizon (T-21 domestic). Plurality is used
  as a representativeness device, not as a fixed threshold.
- **ONS (UK)** collects domestic air fares **one month in advance** for flights departing on
  index day (2nd or 3rd Tuesday), one horizon, a limited source set.
- **Eurostat / ESS** guidance is about legal basis, proportionality and respecting site terms —
  it sets no minimum source count.

So a single sanctioned aggregator covering many underlying suppliers **is** legitimately one
source, and can be sufficient for the index, provided it is disclosed. What genuinely requires
plurality is different and should be stated as such:

1. **Continuity risk** — one source blocking must not stop the index (M3 ≥95%).
2. **Instrument-change risk** — if the single source changes its markup, cache or ranking, the
   index moves for a non-price reason and nothing detects it. This is the real statistical
   argument for a second source, and it is a *validation* argument, not a *sampling* one.
3. **Governance** — an official index whose entire input is one commercial firm's website is
   captured, whatever the statistics say.

**Recommended replacement for the kill condition:**

> At least one legally permitted source covering ≥70% of panel traffic weight, **plus** at
> least one independent source sufficient to validate direction of travel, **plus** a published
> statement of single-source dependency wherever one source exceeds 60% of index weight.

Under this rule the five tariff sheets pass comfortably as a composite primary source, and the
project does not need three OTAs.

---

## 7. Can ≥3 usable sources realistically be obtained?

**For the current methodology (`config/methodology.yaml` as written): no.**
Not one of the 40+ candidates provides a flight-level quote at a controlled booking horizon on
terms AeroDex can satisfy at ₹0 without a written agreement. Zero sources, not three.

**For a tariff-based methodology: yes, today, five of them, free, with a two-year back-series.**

**For the current methodology *with* a permission or a MoSPI/DGCA arrangement: yes** — and one
counterparty is enough (§6), which makes the ask far smaller than "get three OTAs to say yes".

Note also a panel discrepancy to resolve: the brief says horizons T-1/3/7/14/**30/45**/60, but
`config/panel.yaml` has `[1, 3, 7, 14, 21, 30, 60]`. The 21 is not an error — it is the horizon
MoSPI's Expert Group recommended for domestic airfare. Keep 21 and drop 45.

---

## 8. Recommended architecture — ship a two-tier index

Do not treat the tariff sheets as a consolation prize. They support a real, publishable,
reproducible index that no one in India currently publishes, and they make the project
shippable for SIH with genuine data instead of fixtures.

**Tier A — Published Tariff Index (PTI). Build now. ₹0. Legally clean.**

- **Item:** (carrier × route × fare level × bound), e.g. `6E · DEL-BOM · Fare-7 · Minimum`.
- **Elementary:** Jevons over fare levels within a route-carrier — unchanged code, unchanged
  `min_matched_quotes` semantics; matching is on fare level, which is stable month to month and
  matches far better than itineraries ever did.
- **Aggregation:** Lowe with DGCA traffic weights — unchanged, and `weights_vintage` is already
  `dgca-2025-city-pairs`.
- **Quality adjustment:** hedonic characteristics available now — `stops` (Akasa, Fly91, AIX),
  `cabin` (AI, AIX), `carrier_type`, distance (AI), fare brand → `is_refundable` and
  `baggage_included` (AI, AIX). `departure_time_bucket` and `duration_minutes` are unavailable;
  drop them from the Tier-A hedonic spec rather than imputing them.
- **All-inclusive:** satisfiable — Air India and AIX publish the airport tax/fee tables and the
  GST rule; Akasa and Fly91 publish YQ. `require_all_inclusive: true` can stay true.
- **Frequency:** event-driven, on publication. Air India republishes near-daily; IndiGo monthly
  plus revisions. Collection is *watch a handful of URLs*, not 1,155 queries/day.
- **Back-series:** rebuild to mid-2023 from the Internet Archive; the base period
  `2026-09` can move earlier, and M6 reproducibility is *easier* because the inputs are
  immutable published PDFs with hashes.
- **Compute:** this deletes the Playwright dependency, most of the Oracle sizing, the
  20-second host pacing, and the whole anti-bot surface. S1 and S2 stop being on the critical
  path.

**Tier B — Offered Fare Index (OFI). The current design, gated.**

Keep `methodology.yaml` as-is, keep the adapter ladder, keep the panel. Ship it dark. It turns
on the day one of these lands: MoSPI microdata or mandate, a DGCA arrangement, or a written
research agreement with IndiGo or Air India NDC. Publish the coverage ratio at 0% until then —
the publisher already refuses to release an unpublishable run, which is exactly right.

**What to say in the pitch.** The gap between Tier A and Tier B *is* the finding. India can
measure declared tariffs from public regulatory disclosures today; it cannot measure offered
fares without either statutory authority or a commercial agreement, because search costs money
and an index buys nothing. That is a genuine, evidenced, national-statistics-grade conclusion,
and it is far stronger than a working scraper.

**Two changes to `compliance.py` and the plan that follow directly:**

1. Plan §5.8 endorses Travelpayouts as a cross-check. **That endorsement is wrong** — its rules
   prohibit automatic requests for prices. Remove it or downgrade it to "evaluated, rejected".
2. `plan.md` §1.1's framing — "scraping publicly displayed fares … is the only remaining path" —
   is now falsified. There is a second path, and it is the legal one. Rewrite it.

---

## 9. Decisions needed from the project owner

1. **Ship Tier A?** This is the load-bearing decision. It changes what AeroDex publishes from
   "offered fares" to "declared tariffs", and that must be stated in the index name and in every
   release. Yes/no gates everything below.
2. **Approach MoSPI directly?** The sponsor already collects airfares at T-21 from online
   platforms on DGCA routes. Asking for the microdata, or to be adopted as its automation, is the
   highest-value action available and has a long lead time. Who sends it, and when?
3. **Send courtesy notices to the five carriers?** Recommended: a one-page letter naming the
   project, the URLs fetched, the frequency, the derived-statistics-only output, and a contact.
   The ESS guidelines treat this as standard practice for regular retrieval. It costs nothing and
   converts IndiGo's carve-out argument into an unnecessary argument.
4. **Is a written airline research agreement worth pursuing** (IndiGo/Air India NDC), knowing it
   will collide with look-to-book and may require a waiver rather than a standard contract?
5. **Amend the S3 kill condition** from "fewer than 3 sources" to the coverage-plus-validation
   rule in §6? The current condition would have killed a project that has five sources.
6. **Confirm the horizon set** — drop T-45, keep T-21 to match the national methodology.
7. **Does a free API token count as "authentication" under plan §7?** Still open from the first
   S3, but now much less urgent: every free-token source was rejected on its own terms, so the
   question no longer gates anything.

---

## 10. What was not done

- SpiceJet's current tariff-sheet URL was not located; its structure is unverified.
- The Air India Express and Akasa terms were not re-read in full this pass; the previous S3's
  Akasa finding ("personal and non-commercial use only") is carried forward.
- No index was computed from the tariff sheets — five PDFs were downloaded and parsed to verify
  structure and nothing more. No adapter was written, per instruction.
- Whether the 21 IndiGo fare levels are comparable across months (i.e. whether "Fare-7" means the
  same rung in March and April) is **unverified and is the single biggest methodological risk in
  Tier A**. Test it before committing: it is a two-hour check against the archived sheets.
- No accounts were created, no money spent, no access control bypassed. Where automated fetching
  of a public terms page was refused, the page was read in an ordinary browser instead.
