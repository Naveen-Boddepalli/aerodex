# Source Decision Matrix

Every source seriously investigated across all four S3 passes.

**Status values.** **GREEN** usable now · **YELLOW** usable with permission/account/agreement ·
**ORANGE** validation or reference only · **RED** unsuitable, prohibited or unavailable.

**A source is never GREEN merely because the data is publicly visible.** GREEN requires
*all* of: automation permitted + robots clean + AeroDex compliance pass + statistically
suitable + ₹0. `robots status` and `Terms status` are recorded independently — a pass on
one is not a pass on the other.

**Result: zero GREEN.**

---

## Primary matrix — sources with real fare content

| Source | Data type | Horizon? | Flight-level? | Route-level? | Historical? | All-inclusive? | Automation permitted? | robots status | Terms status | Account? | Payment? | Booking req? | Search-to-order limit? | AeroDex compliance | Statistical suitability | Status | Evidence | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **IndiGo tariff sheet** | Published tariff bands | ✗ | ✗ | ✓ | ✓ 150 dates | ✓ YQ+UDF/PSF/ASF/GST | Carve-out for download; re-use restricted | **FAIL** — robots.txt unreachable ×2 | Partial: download carve-out, but no copy "for any purpose whatsoever" | ✗ | ✗ | ✗ | n/a | **FAIL** (unreachable ⇒ refuse) | **FAIL** — band not price; levels unstable | **ORANGE** | CLM-08,09,12,13,14,20 | High |
| **Air India tariff sheet** | Published tariff bands | ✗ | ✗ | ✓ | ✓ 146 URLs, none 2026 | ✓ full tax table | **No** — bars robot *or any manual process* | **FAIL** — unreachable ×2 | **Prohibitive** | ✗ | ✗ | ✗ | n/a | **FAIL** | **FAIL** | **RED** | CLM-15,20 | High |
| **Air India Express tariff sheet** | Published tariff bands | ✗ | ✗ | ✓ | partial | ✓ fees+GST | **No** — bars scripts, data mining, robots | **FAIL** — `Disallow: /content/dam` = the sheet's own path | Prohibitive | ✗ | ✗ | ✗ | n/a | **FAIL** | **FAIL** | **RED** | CLM-16,20 | High |
| **Akasa tariff sheet** | Published tariff bands | ✗ | ✗ | ✓ (+stops) | partial | ✓ YQ | Carve-out for download; "personal and non-commercial use only" | **FAIL** — `assets.akasaair.com` robots 403 | Partial, plus non-commercial bar | ✗ | ✗ | ✗ | n/a | **FAIL** (403 ⇒ access controlled) | **FAIL** | **RED** | CLM-17,20 | High |
| **Fly91 tariff sheet** | Published tariff bands | ✗ | ✗ | ✓ (+stops, RCS) | partial | ✓ YQ | **No carve-out** — download barred without written permission | **PASS** — stock Drupal, path allowed | Prohibitive | ✗ | ✗ | ✗ | n/a | **PASS** | **FAIL** | **ORANGE** (robots-clean; terms bar it) | CLM-18,20 | High |
| **SpiceJet tariff sheet** | Presumed tariff bands | ✗ | ✗ | ✓ | unknown | unknown | unknown | PASS (malformed absolute-URL Disallows, normalised) | not read | ✗ | ✗ | ✗ | n/a | PASS | presumed FAIL | **RED** (not located) | CLM-19 | Low — *not located, not "does not exist"* |
| **Internet Archive (tariff back-series)** | Mirror of the above | ✗ | ✗ | ✓ | ✓ | inherits | Research use permitted | PASS | Permissive | ✗ | ✗ | ✗ | n/a | PASS | **FAIL** (inherits) | **ORANGE** | CLM-12,13 | High |
| **eSankhyiki CPI air-fare index** | Monthly index number, Base 2024=100 | ✗ | ✗ | ✗ (All-India / State) | ✓ | n/a | **Yes** — public API, no auth | PASS | Permissive | ✗ | ✗ | ✗ | ✗ | **PASS** | Not an index input — **valid M7 benchmark** | **ORANGE** (best available) | CLM-24,25,31 | High |
| **DGCA city-pair traffic (S4)** | Passenger counts | n/a | ✗ | ✓ | ✓ | n/a | Yes (ODbL) | PASS | ODbL, attribution | ✗ | ✗ | ✗ | ✗ | PASS | **Suitable — weights only** | **GREEN for weights, not fares** | `scripts/parse_dgca_weights.py` | High |

---

## Institutional and permission-gated sources

| Source | Data type | Horizon? | Flight-level? | Automation permitted? | Account? | Payment? | Booking req? | Statistical suitability | Status | Evidence | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **MoSPI airfare collection (CPI)** | Fare quotes from online platforms | ✓ (15d→7d→21d; IMF advised 14d & 21d) | likely | Under statutory authority (CoS Act 2008) | institutional | ✗ | ✗ | **Suitable if released** | **YELLOW — highest value** | CLM-04,05,06,07 | High |
| **DGCA Tariff Monitoring Unit** | 78-route monthly monitoring | ✓ undisclosed | ✗ | Institutional | institutional | ✗ | ✗ | Unknown | **YELLOW** | CLM-21 | Medium |
| **DGCA min/max tariff dataset** | Route × airline min/max tariffs | ✗ (likely bands) | ✗ | Institutional; **precedent: already supplied to MoSPI** | institutional | ✗ | ✗ | Probably FAIL (bands) | **YELLOW — verify fields first** | CLM-22 | High (precedent), Low (fields) |
| **IndiGo NDC API** | Live offers | ✓ | ✓ | Distribution agreement | ✓ | likely | ✓ look-to-book | Suitable | **YELLOW** | CLM-27 | Medium |
| **Air India NDC API** | Live offers | ✓ | ✓ | Partner registration | ✓ | likely | ✓ | Suitable | **YELLOW** | CLM-27 | Medium |
| **DGCA "AirPrice Guardian" / transparency index** | Proposed | — | — | — | — | — | — | — | **RED — not built** (parliamentary recommendation only) | CLM-23 | High |
| **IATA PaxIS / ATPCO / OAG / Cirium** | Ticketed fares / filed tariffs | ✓ | ✓ | Enterprise licence | ✓ | ✓✓ | ✗ | Suitable (PaxIS is transaction data) | **YELLOW — commercial only** | CLM-30 | High |
| **Skyscanner Travel API / Travel Insight** | Live prices / avg fares | ✓ / partial | ✓ / ✗ | Partner approval + traffic requirement | ✓ | ✓ | funnel expected | Partial | **YELLOW** | CLM-29 | Medium |
| **TBO / TripJack / Mystifly (B2B)** | Live offers | ✓ | ✓ | Travel-agency registration, GST, deposit | ✓ | ✓ | ✓ | Suitable | **YELLOW** | CLM-28 | Medium |
| **IRCTC Air** | Transactions through one PSU agent | ✓ | ✓ | RTI-liable public authority | ✓ | ✗ | ✓ | Single-agent bias | **YELLOW — unexplored** | s3-verification §4.2 | Low |

---

## Ruled out

| Source | Reason | Status | Evidence |
|---|---|---|---|
| **Duffel** | Clause 2.3 bars "excessive Search-to-Order Ratio"; *"zero Orders shall be treated as one Order"*; 2.5(d) bars metasearch. Paying does not cure it. | **RED** | CLM-25 |
| **Travelpayouts** | *"we prohibit sending automatic requests, especially just to get prices"* — and states the GDS cost reason. Data is cached, cheapest-per-day, horizon-uncontrolled. | **RED** | CLM-26 |
| **Amadeus Self-Service** | Decommissioned 17 July 2026; keys disabled. | **RED** | CLM-32 |
| **Amadeus AQC / Enterprise, Sabre, Travelport** | Commercial agreement, account representative, booking volume expected. ₹0 fails first. | **RED at ₹0** / YELLOW commercially | CLM-32 |
| **NDC aggregators** (AirGateway, Verteil, Kyte, TPConnects) | Require **IATA, TIDS or IATAN** accreditation — agency identity AeroDex cannot hold. | **RED** | CLM-28 |
| **Kiwi Tequila** | Invitation-only partner access. | **RED** | plan §1.1 |
| **MakeMyTrip / goibibo** | Bars transmitting content "for any business, commercial or public purpose"; limited licence. | **RED** | CLM-33 |
| **Cleartrip** | Bars robot/spider/scraper "without our express written permission"; commercial-use bar; separate robots-header obligation. | **RED** | s3-source-mapping |
| **ixigo** | Bars systematic retrieval to compile a database; bars automated systems. Original fare evidence retrieved from here **must not be used**. | **RED** | s3-source-mapping, s3-evidence.json |
| **EaseMyTrip** | Monthly minima only — methodologically unsuitable regardless of terms. | **RED** | s3-source-mapping |
| **Yatra** | Terms prohibit automated access. | **RED** | s3-source-mapping |
| **Kayak / Momondo / Wego** | Partner approval gated on traffic and a booking funnel. | **RED at ₹0** | s3-redo |
| **Common Crawl** | Fare pages sparse, undated relative to departure, horizon-uncontrolled. | **RED** | s3-redo |
| **Kaggle / Hugging Face fare datasets** | Static, one-off, provenance is prohibited scraping, no controlled horizon. Hedonic priors at most. | **RED** | s3-redo |
| **data.gov.in / AirSewa** | Schedules, status, grievances. **No fare datasets.** | **RED** | s3-redo |
| **NDAP / AIKosh** | No airfare dataset found. | **RED** | s3-redo |
| **UDAN / RCS fare caps** | Administered ceilings, not market fares. | **RED** | s3-redo |
| **SerpApi / Bright Data / Oxylabs / Apify** | Paid; and an intermediary's indemnity does not make the underlying access permitted. | **RED** | s3-redo |
| **Aviationstack / AeroDataBox / FlightAPI / OpenSky** | Tracking, status and schedules — not sanctioned fare quotes. | **RED** | s3-verification |
| **HappyFares Fare Index** | An output of someone else's collection, not a source. Circular. | **RED** | s3-redo |

---

## The pattern

Read down the *horizon* and *automation permitted* columns together. Every source with a
booking horizon fails automation-permitted; every source that passes automation-permitted
has no horizon. That is not coincidence — it is the look-to-book economics stated in
CLM-25 and CLM-26. It is why further source search has negative expected value.
