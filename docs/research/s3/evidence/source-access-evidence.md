# Evidence — Source access

Per-source access facts. Legal and compliance status is in `compliance-evidence.md`;
statistical suitability is in `tariff-comparability-results.md`.

---

## Tariff sheets — what was actually retrieved

| Carrier | Retrieved | Structure |
|---|---|---|
| **IndiGo** | 14 sheets via Internet Archive | `Market/Route v.v.` · `Type` (Max/Min) · optional `Distance` · `Fare-1…21`; separate Business table; YQ by distance band (₹275/400/600/800/950); UDF/PSF/ASF/GST present. 2026 sheets titled "ONE WAY DIRECT ECONOMY FARES" |
| **Air India** | 1 sheet (8 pp) | Origin · Destination · **Distance** · Min/Max · `Level 1…13`; separate Economy / Premium Economy / Business & First tables; **full airport tax and fee table**; fare brands (Value/Classic/Flex) with baggage kg and change/cancellation fees. Header says "Instant & Advance Purchase Fares" but every fare page reads "Instant purchase (IP) fares with **no advance purchase restriction**" — **no booking-horizon dimension** |
| **Air India Express** | 1 sheet (8 pp) | Base fares split **Direct / Via / Connecting**; Economy vs Business; six fare brands (Xpress Value/Flex/Return/Friends&Family/Student/Defence); fees + GST tables; explicit "total fare payable" recipe |
| **Akasa** | 1 sheet (2 pp) | Market · Type · **Stops** · Fuel Charge (YQ) · fare levels |
| **Fly91** | 1 sheet (2 pp) | From · To · **RCS flag** · Stops · YQ · fare levels |
| **SpiceJet** | **Not located** | Old `spicejet.com/pdf/Tariffs.pdf` now returns HTML. Under the same DGCA duty. Record as *not located*, **not** *does not exist* |

**Fields available across the class:** origin, destination, carrier, currency, fare band
bounds, publication timestamp, and — carrier-dependent — stops, cabin, distance, fare brand,
baggage, refundability, fuel surcharge, airport taxes.

**Fields absent from the entire class:** departure date, flight number, departure/arrival
time, and **booking horizon**. This is what makes them unusable as index input regardless of
the statistical findings.

## Archive availability

| Metric | IndiGo | Air India |
|---|---|---|
| Distinct tariff URLs in CDX | **150 publication dates** (2020-02-28 → 2026-08-04) | **146 URLs** |
| Year distribution | dense from Mar 2023 | 23 (2023), ~98 (2024), 16 (2025), **0 (2026)** |
| Retrieval success | **14 of 18 (78%)** | not attempted in series |
| Encoding wrinkle | 7 of 14 gzip-encoded | — |
| Filename convention | stable `IndiGo-Tariff-Sheet-YYYY-MM-DD.pdf` | **none** — `8th-JAN-2024`, `31th-JAN-2024` (sic), `2DEC'24`, `TARIFFSHEET-AS-ON-22-nov-24`, `21JANUAR2025` (sic) |

Air India URLs cannot be constructed; discovery must go through the archive or the live
page each time.

## Government sources

| Source | Access reality |
|---|---|
| **eSankhyiki CPI air-fare index** | Free, public, unauthenticated, REST API + CSV/XLSX. **Usable today.** Public Python client `mospi-esankhyiki` exists on PyPI (MIT) but is **alpha and individually authored** — prefer the documented REST API |
| **DGCA min/max tariff dataset** | Not public. Precedent exists: supplied to MoSPI on request (CLM-22) |
| **DGCA Tariff Monitoring Unit output** | Not published as microdata |
| **MoSPI CPI airfare microdata** | Not published; `microdata.gov.in` requires registration and does not release individual airfare quotes |
| **DGCA city-pair traffic** | Public via `Vonter/india-aviation-traffic` (ODbL) — **already in use** by `scripts/parse_dgca_weights.py`, vintage `dgca-2025-city-pairs-r2` |
| **data.gov.in / AirSewa / NDAP / AIKosh** | Schedules, status, traffic, grievances. **No fare data** |

## The original ixigo evidence

`docs/spikes/s3-evidence.json` records a real retrieved fare — Air India Express IX1056,
DEL→BOM, ₹5,929, plus a 10-day fare calendar with airline codes and flight numbers.

**It must not be used.** ixigo's terms prohibit systematic retrieval to compile a database,
and the robots check that passed at the time passed *vacuously* because of the stdlib
parser defect. The file is retained as a record of what the source contains and of the
project's own error, not as usable data.
