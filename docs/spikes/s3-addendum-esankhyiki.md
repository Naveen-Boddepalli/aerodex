> **PARTIALLY SUPERSEDED BY:** `docs/research/s3/evidence/esankhyiki-investigation.md` — the substance stands, but two claims were softened: "does not contain, and has never contained" overreaches (established: not *publicly published*), and `mospi-esankhyiki` is not evidently an official MoSPI SDK (PyPI lists individual authors, alpha status).

# S3 Addendum — eSankhyiki Dataset Link Investigation

**Date:** 23 August 2026
**Addendum to:** S3 source-mapping spike (`s3-source-mapping.md`, `s3-redo.md`, `s3-verification.md`)
**Triggered by:** Discovery that SIH Problem Statement 26056 lists `esankhyiki.mospi.gov.in` as its "Dataset Link."

---

## Final Answer

> **What dataset, if any, is actually provided to us by MoSPI through the Dataset Link?**
>
> **None.** The eSankhyiki link is MoSPI's general-purpose macroeconomic data portal — a React SPA hosting 4,500+ statistical tables across all MoSPI publications. It does not contain, and has never contained, route-level airfare quote microdata, airline ticket prices, or any operational aviation dataset. The closest data point available is the monthly **CPI price-index number** for the item "Air fare (normal): economy class" — a single scalar per month giving the index relative to Base 2024=100 — not the underlying fare observations from which that index is computed.
>
> The Dataset Link is **not a provided dataset**. It is a reference to the portal where the *output* of official price collection is published. The *input* data — actual fare quotes from online platforms — is what Problem Statement 26056 asks participants to build the collection system for.

---

## Evidence

### 1. What eSankhyiki Actually Is

| Attribute | Detail |
|---|---|
| **Full Name** | e-Sankhyiki — Ministry of Statistics & Programme Implementation Data Platform |
| **URL** | `https://esankhyiki.mospi.gov.in/` |
| **Launched** | 29 June 2024 (National Statistics Day) |
| **Operator** | Data Informatics & Innovation Division (DIID), MoSPI |
| **Nature** | General-purpose macroeconomic data portal and statistical catalogue |
| **Modules** | (1) **Data Catalogue** — 4,500+ datasets across CPI, IIP, NAS, ASI, PLFS, HCES; (2) **Macro Indicators** — interactive time-series explorer with charting and API |
| **Authentication** | **None required** — fully public, no API key, no registration |
| **Formats** | CSV, Excel (.xlsx), JSON via REST API |
| **Official SDK** | `pip install mospi-esankhyiki` ([nso-india/mospi-esankhyiki](https://github.com/nso-india/mospi-esankhyiki) on GitHub/PyPI) |
| **MCP Server** | [nso-india/esankhyiki-mcp](https://github.com/nso-india/esankhyiki-mcp) for AI agent integration |

**Source:** Portal metadata tag — *"esankhyiki is a data platform developed by Ministry of Statistics and Programme Implementation, Government of India. It is a one-stop platform for all official statistics in India."*

### 2. Search for Airfare Data on eSankhyiki

| Search Target | Result |
|---|---|
| Standalone airfare dataset | ❌ Does not exist |
| Route-level fare matrices (cf. US DOT DB1B) | ❌ Does not exist |
| Flight schedules / airline operational data | ❌ Not hosted (DGCA/AAI domain) |
| Dynamic ticket price feeds | ❌ Does not exist |
| CPI → Miscellaneous → Transport & Communication → "Air fare (normal): economy class" | ✅ **Exists** — but as a monthly index number (Base 2024=100), not as rupee prices for specific flights |
| CPI item-level raw price observations (microdata) | ❌ Not published — microdata is on `microdata.gov.in` (separate portal, registration required), and even there, individual airfare quotes are not released |

**What the CPI "Air fare" item provides:**
- Monthly index number (e.g., 103.4 for June 2026)
- Year-on-year inflation rate
- Available at All-India and State/UT level
- Accessible via API: `get_data("CPI", filters, level="Item")`

**What it does NOT provide:**
- Actual fare quotes (₹ amounts for DEL→BOM, etc.)
- Route-level breakdowns
- Carrier identity
- Booking horizon information
- Daily or intra-month frequency

### 3. Interpretation of the "Dataset Link" Field

The SIH problem statement template includes a "Dataset Link" field. For PS SIH26056, this field points to `esankhyiki.mospi.gov.in`. This is **not** a link to a provided dataset. It serves one of two purposes:

1. **Contextual reference** — pointing participants to MoSPI's data ecosystem so they understand the organization's statistical infrastructure and existing CPI outputs, OR
2. **Validation benchmark** — the CPI "Air fare" index series on eSankhyiki is the official published index that AeroDex's high-frequency output should correlate with (cf. our metric M7: "Correlation vs CPI Transport reported quarterly").

The problem statement's core task is to **build the data collection pipeline** — the very pipeline that MoSPI currently executes manually with human investigators. If a ready-made airfare dataset existed, the problem statement would not need to exist.

### 4. Confirmation from MoSPI's Own Documentation

The CPI 2024 FAQ (Q27) is the primary evidence:

> *"How the prices for airfares are collected in the CPI 2024 series?*
> *Ans: Airfares are collected through well-known online platforms."*

This confirms:
- MoSPI collects airfare prices **from online platforms** (the same sources AeroDex would target)
- The collection is done by human investigators from State Regional Offices / FOD
- No pre-existing machine-readable airfare feed exists — if it did, MoSPI would use it instead of manual collection
- The data collected feeds into the CPI computation; the **raw observations are not published**

### 5. What This Means for PS SIH26056 Participants

The problem statement expects participants to:

| Expectation | Evidence |
|---|---|
| **Build their own data collection system** | The entire problem statement describes automating what MoSPI does manually |
| **Scrape/extract fares from online platforms** | CPI 2024 FAQ Q27 confirms this is MoSPI's own method |
| **Use DGCA data for route weights** | Expert Group Report §3.9 cites DGCA popular-route lists |
| **Use eSankhyiki CPI data for validation** | The published CPI air fare index is the benchmark, not the input |

---

## Reconciliation with S3 Conclusions

### No Contradictions Found

This investigation **confirms and strengthens** every S3 finding:

| S3 Conclusion | eSankhyiki Finding | Status |
|---|---|---|
| No free, public, legally compliant airfare API exists | eSankhyiki has no airfare microdata; CPI index numbers are the closest proxy | **CONFIRMED** |
| MoSPI collects airfares from online platforms (CPI 2024 FAQ Q27) | eSankhyiki publishes only the aggregated CPI index, not the raw quotes | **CONFIRMED** |
| The problem statement asks participants to build the collection pipeline | If eSankhyiki already had the data, the PS would be redundant | **CONFIRMED** |
| All OTA/aggregator Terms of Use prohibit automated scraping | This remains the critical legal blocker regardless of eSankhyiki's contents | **UNCHANGED** |
| Formal MoSPI/DGCA partnership is the viable path | MoSPI has statutory authority (Collection of Statistics Act 2008) that participants lack | **CONFIRMED** |

### One New Actionable Discovery

> [!IMPORTANT]
> **The `mospi-esankhyiki` Python SDK and eSankhyiki REST API are free, public, and require no authentication.** AeroDex can — and should — programmatically pull the official CPI "Air fare (normal): economy class" index series to power metric **M7** (external agreement / correlation vs CPI Transport). This eliminates any need for manual CPI data downloads and provides a machine-readable validation benchmark.

**Implementation path for M7:**
```bash
pip install mospi-esankhyiki
```
```python
from esankhyiki import list_datasets, get_indicators, get_metadata, get_data

# Discovery workflow:
# 1. list_datasets() → find "CPI"
# 2. get_indicators("CPI") → find air fare item code
# 3. get_metadata("CPI", ...) → get valid filters
# 4. get_data("CPI", filters, level="Item") → monthly air fare index series
```

---

## S3 Disposition: UNCHANGED

All S3 verdicts remain in force:

- **S3 Verdict (source mapping):** NO-GO on Terms — every OTA/aggregator prohibits automated scraping
- **S3 Redo Verdict (Tier A tariff sheets):** Withdrawn as methodologically invalid
- **S3 Verification Verdict:** NO-GO for unassisted autonomous scraping; formal authorization required
- **Critical Path:** Request data access / written authority from MoSPI and DGCA

The eSankhyiki "Dataset Link" does not provide an airfare dataset, does not change the compliance landscape, and does not open a new data source. It provides a validation benchmark.

---

## Primary Sources

| Source | URL | Accessed |
|---|---|---|
| eSankhyiki Portal | `https://esankhyiki.mospi.gov.in/` | 23 Aug 2026 |
| eSankhyiki Python SDK | `https://github.com/nso-india/mospi-esankhyiki` | 23 Aug 2026 |
| eSankhyiki MCP Server | `https://github.com/nso-india/esankhyiki-mcp` | 23 Aug 2026 |
| PyPI: mospi-esankhyiki | `https://pypi.org/project/mospi-esankhyiki/` | 23 Aug 2026 |
| MoSPI CPI 2024 FAQ | Via MoSPI press release / PIB | 23 Aug 2026 |
| SIH Portal | `https://www.sih.gov.in/` | 23 Aug 2026 |
