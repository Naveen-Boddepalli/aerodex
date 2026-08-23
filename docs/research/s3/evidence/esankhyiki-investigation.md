# Evidence — eSankhyiki Dataset Link investigation

**Consolidated from** `docs/spikes/s3-addendum-esankhyiki.md`, with one wording correction.
**Question:** what does the SIH PS 26056 "Dataset Link" actually provide?

---

## The precise answer

> **The SIH Dataset Link does not appear to provide the underlying airfare quote microdata
> required by AeroDex; it points to the eSankhyiki statistical data portal.**

Use this formulation. The addendum states it more strongly — *"it does not contain, and has
never contained"* — which the evidence does not support. What was established is that no
such dataset is **publicly published** there. Absence of a public dataset is not absence of
a dataset, and "not found" is not "does not exist". The distinction is not pedantic here:
MoSPI demonstrably *holds* airfare observations (CLM-04), so the question is one of
publication, not existence.

## What eSankhyiki is

| Attribute | Detail |
|---|---|
| Operator | Data Informatics & Innovation Division, MoSPI |
| URL | `https://esankhyiki.mospi.gov.in/` |
| Launched | 29 June 2024 |
| Nature | General-purpose macroeconomic data **portal** — catalogue + macro-indicator explorer |
| Scale | 4,500+ statistical tables across CPI, IIP, NAS, ASI, PLFS, HCES |
| Authentication | **None** — public, no key, no registration |
| Formats | CSV, XLSX, JSON via REST API |
| Public Python client | `mospi-esankhyiki` on PyPI — MIT, **alpha status, individually authored** (CLM-31); the addendum's "Official SDK" label is not supported by the PyPI metadata |

## Airfare content — what is and is not there

| Target | Result |
|---|---|
| CPI → Transport → "Air fare (normal): economy class" | **Present** — monthly index number, Base 2024=100, All-India and State/UT |
| Standalone airfare dataset | Not found |
| Route-level fare matrices (cf. US DOT DB1B) | Not found |
| Airline-level ticket quotes | Not found |
| Booking-horizon observations | Not found |
| Flight schedules / operational aviation data | Not found — DGCA/AAI domain |
| CPI item-level raw price observations | **Not published.** Microdata is a separate portal (`microdata.gov.in`, registration required), and individual airfare quotes are not released there either |

**What the CPI air-fare item gives:** a monthly index number, a year-on-year rate, at
All-India and State/UT level, retrievable through the documented API.

**What it does not give:** rupee fare quotes, route breakdowns, carrier identity, booking
horizon, or sub-monthly frequency.

## Is it a dataset, an API, a catalogue, or a portal?

**A portal**, containing a catalogue and an API. It is not a provided dataset. The link
serves one or both of:

1. **Contextual reference** — orienting participants to MoSPI's statistical infrastructure;
2. **Validation benchmark** — the published CPI air-fare index is the official series that
   AeroDex's high-frequency output should be correlated against. This maps directly onto
   metric **M7**.

The corroborating logic is simple: MoSPI's own FAQ (CLM-04) says airfares are collected
manually from online platforms. If a machine-readable airfare feed existed inside MoSPI,
the collection would not be manual and PS 26056 would have little to ask for.

## What this changes

**One capability gained.** The eSankhyiki REST API is free, public and unauthenticated, and
gives AeroDex a machine-readable official benchmark for M7 without manual downloads. This
is the only new data capability the entire S3 line produced, and it should be built.

**Nothing else changes.** eSankhyiki does not open a fare source, does not alter the
compliance position, and does not affect the S3 verdict.

## Reconciliation

| Earlier S3 conclusion | eSankhyiki finding | Status |
|---|---|---|
| No free, public, compliant airfare API exists | No airfare microdata on eSankhyiki; the CPI index is the closest artefact | **CONFIRMED** |
| MoSPI collects airfares from online platforms | eSankhyiki publishes only the aggregated index | **CONFIRMED** |
| The PS asks participants to build the collection pipeline | If the data were published, the PS would be largely redundant | **CONFIRMED (inference, not evidence)** |
| OTA terms prohibit automated collection | Unaffected | **UNCHANGED** |
| A MoSPI/DGCA arrangement is the viable path | MoSPI has statutory authority participants lack | **CONFIRMED** |

## Open

Whether MoSPI would *release* airfare microdata under an agreement is unresolved and is the
subject of OQ-1. Its non-publication says nothing about its availability to a sanctioned
partner.
