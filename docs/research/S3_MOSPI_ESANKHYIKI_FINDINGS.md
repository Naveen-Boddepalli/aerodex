# S3 → S4 MoSPI / eSankhyiki FINDINGS

**Research date: 25 August 2026.** Sources in `S3_EVIDENCE/official_sources.md`.

> **Status change:** the MoSPI/DGCA permission path is **no longer a prerequisite** for the
> engineering path. It is now a parallel, high-value opportunity. This reverses the
> sequencing — not the value — of `docs/research/s3/NEXT_ACTIONS.md` NA-1 and NA-2.

---

## 1. What the SIH "Dataset Link" actually is

**Answer: a portal, containing a catalogue and an API. It is not a supplied dataset.**

The eSankhyiki portal was launched **29 June 2024** as MoSPI's data management and
dissemination system. Its first phase covers the Consumer Price Index among other products,
with ten years of history, and it exposes custom dataset download, visualisation and APIs.

This confirms the previous S3's careful formulation, which should continue to be used
verbatim in anything public:

> The SIH Dataset Link does not appear to provide the underlying airfare quote microdata
> required by AeroDex; it points to the eSankhyiki statistical data portal.

It does **not** support the stronger claim in `docs/spikes/s3-addendum-esankhyiki.md` that
it "has never contained" such data. Absence of a *public* dataset is not absence of a
dataset. That correction stands.

---

## 2. What eSankhyiki does provide

| Field | Available? |
|---|---|
| CPI index number, item-level, incl. "Air fare (normal): economy class" | ✅ |
| Base year selection | ✅ `base_year` parameter (required for CPI) |
| Group vs Item level | ✅ `level` parameter — `"Group"` or `"Item"` |
| All-India and State/UT breakdown | ✅ |
| Monthly frequency | ✅ |
| Authentication required | ❌ none |
| **Route-level observations** | ❌ |
| **Fare quotes in rupees** | ❌ |
| **Carrier identity** | ❌ |
| **Booking horizon** | ❌ |
| **Collection timestamps** | ❌ |
| **Platform / source identifiers** | ❌ |
| **Sub-monthly frequency** | ❌ |

**Conclusion unchanged:** eSankhyiki publishes the *output* of official price collection,
not the *input*. It is AeroDex's **M7 validation benchmark** and nothing more — which is
still the single genuinely new data capability the whole S3 line produced.

---

## 3. Correction to a previous S3 claim (CLM-31)

`docs/research/s3/FINAL_S3_CONCLUSION.md` §N advised preferring the documented REST API over
the third-party `mospi-esankhyiki` client, describing it as *"alpha-status and individually
authored."*

**That is wrong on provenance.** The package is published by **`nso-india`** — the National
Statistical Office's own GitHub organisation — under an **MIT licence**, currently at
**v0.1.4** on PyPI, and it documents both group-level and item-level CPI access via the
`level` parameter. The same organisation also publishes `esankhyiki-mcp`, an official MoSPI
Model Context Protocol pilot.

**Revised guidance:** the client is officially authored, not individually authored. It is
still early-version software, so pin the version and keep the REST endpoint
(`api.mospi.gov.in`) as the fallback — but the provenance objection is withdrawn.

This is the third self-correction in the S3 line and is recorded, not rewritten, in keeping
with the discipline the earlier passes established.

---

## 3a. CORRECTION — MoSPI does not share unit-level price data (added 25 Aug 2026)

Verified against MoSPI's **National Metadata Structure (NMDS) for CPI**, dated **18 March 2026**:

> **§2.11:** "The unit level price data of the basket of commodities are **not placed in public domain**."
>
> **§3.2:** "The unit level price data of the basket of commodities are **not shared with any stakeholder**."

**This kills the NA-1 ask as previously drafted.** `docs/research/s3/NEXT_ACTIONS.md` asks the
Ministry to supply the airfare data it receives from DGCA. MoSPI's own current metadata
standard states that unit-level price data is shared with no stakeholder at all. The request
should be withdrawn and replaced with an explicit statement that microdata is *not* being
requested — see `S3_PERMISSION_PATH.md` §2 and §4.

**Two further corrections from the same document:**

1. The division is the **Price Statistics Division (PSD)**, not the "Prices & Cost of Living
   Division" as named in the earlier draft letter.
2. Verified addressee: **Ms. Deepti Srivastava, Deputy Director General**,
   `ddg2-psd.nso@mospi.gov.in`, Room 506, 5th Floor, Khurshid Lal Bhawan, Janpath, New Delhi
   110001.

**A better hook than CPI 2024 FAQ Q27.** The NMDS records that the 2024 series makes "greater
use of digital and administrative data sources" for items including **air fares**, and that
**12 online markets** across towns above 25 lakh population were added to capture
e-commerce/online platform prices. This is more current and citable to a numbered section.

**Also confirmed:** base **2024 = 100** from January 2025 on **COICOP 2018**; **358 items**
(308 goods, 50 services); weights from **HCES 2023–24**; release at **4 PM on the 12th**.
`methodology.yaml` uses a different base period (`2026-09`) by design — state that divergence
explicitly in the methodology note so no reader assumes comparability.

---

## 4. DGCA — what it holds

Unchanged from the previous S3 and still worth pursuing:

- DGCA maintains a **route × airline minimum/maximum tariff dataset**.
- DGCA **has already supplied airfare data to MoSPI on request**, minuted in MoSPI's own
  Expert Group report as recommendation 11(a).
- The caveat that must travel with this: what DGCA is described as holding is *minimum and
  maximum tariffs* — possibly the same band structure that
  `docs/research/s3/evidence/tariff-comparability-results.md` showed empirically to be
  unusable as a price. **Confirm the field list before assuming the agreement solves
  anything.**

DGCA city-pair **traffic** data is already in hand via spike S4 (ODbL, vintage
`dgca-2025-city-pairs-r2`) and is weighting the panel today.

---

## 5. Who to approach

| # | Addressee | Ask |
|---|---|---|
| NA-1 | **Ms. Deepti Srivastava, Deputy Director General, Price Statistics Division, MoSPI** — `ddg2-psd.nso@mospi.gov.in` | **Re-scoped per §3a.** Methodological guidance; a letter of support for PS SIH26056; an introduction to the online platforms (or permission to cite the Ministry's sponsorship); and whether a Section 4 arrangement is available. **Do not request microdata** — NMDS §3.2 rules it out. Ready-to-send text: `S3_PERMISSION_PATH.md` §4 |
| NA-2 | **DGCA** (in parallel, not after) | The route × airline min/max tariff dataset **and its field list**. Even a refusal is informative: it tells us whether the government's own holding is bands or offers |
| NA-5 | **SIH organisers** | What the Dataset Link is intended to provide — a validation reference, or an unpublished dataset |
| NA-9 | **DGCA** | The direction of 13 May 2025 in original. Still marked **PRIMARY SOURCE NOT VERIFIED** and must not appear as fact in any submission until the PDF is in hand |

The **current** letter is in `S3_PERMISSION_PATH.md` §4. The earlier draft in
`docs/research/s3/NEXT_ACTIONS.md` is preserved for the record but is **superseded**: it uses
a division name that does not exist and asks for microdata the Ministry has published that it
does not share. Send from an institutional address with the faculty mentor in copy.

---

## 6. Why this is now parallel rather than blocking

The previous S3 made the MoSPI letter the critical path because it was *the only action that
could change the project decision*. That was true when every technical route was closed.

It is no longer true. A $25/month API subscription changes the project decision today,
without a reply from anyone. The letters remain worth sending — an authorised collection
under the Collection of Statistics Act would be a materially stronger position, and the
answer is genuinely useful either way — but **nothing waits on them.**

Send them today. Then build against the API.
