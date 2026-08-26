# S3 → S4 LEGAL AND CONTRACTUAL MATRIX

**Research date: 25 August 2026.** Clause references were read from the providers' own
published agreements on that date. Sources in `S3_EVIDENCE/contracts_terms.md`.

> This is an engineering risk assessment, not legal advice. Where a clause is ambiguous the
> matrix says so and names the question to ask, rather than resolving it by preference.
> That discipline is what the previous S3 got right and must be preserved.

---

## 1. The distinction that matters

The project owner has removed AeroDex's **internal** restrictions. Provider **external**
terms are unchanged and remain binding. Every row below is external.

| Constraint | Kind | Waivable by AeroDex? |
|---|---|---|
| `compliance.py` forbidding `x-api-key` | Internal policy | ✅ Yes — and it has been |
| ₹0 recurring cost | Internal policy | ✅ Yes — and it has been |
| Universal robots.txt enforcement | Internal policy | ✅ Yes — now provider-scoped |
| "An intermediary's indemnity is not permission" | Internal policy | ✅ Yes — and it has been |
| Duffel clause 2.5(d) metasearch bar | **External contract** | ❌ No — requires Duffel's agreement |
| Duffel clause 2.3 search-to-order ratio | **External contract** | ❌ No |
| Indian OTA terms of service | **External contract** | ❌ No |
| IATA / TIDS accreditation | **External eligibility** | ❌ Not a rule — a credential AeroDex does not hold |
| DPDP Act 2023 (personal data) | **Statute** | ❌ No — and nothing in this plan needs to |

---

## 2. Per-provider contractual assessment

### SerpApi — recommended primary

| Axis | Finding |
|---|---|
| Authentication | API key. **Class A** |
| Search without booking | ✅ It *is* the product. No look-to-book concept exists |
| Price monitoring / benchmarking | ✅ Not prohibited in the published terms reviewed |
| Research / statistical use | ✅ Not prohibited |
| Publishing derived statistics | ✅ Not prohibited. AeroDex publishes index numbers, never raw results |
| Storage of results | ✅ Not prohibited. ZeroTrace (Cloud 1M+) is about *SerpApi's* retention, not the customer's |
| Indemnity | **U.S. Legal Shield — up to $2 million** for scraping and parsing search-engine data, conditional on the use not being illegal |
| Residual risk | The shield is SerpApi's contractual position with *its* customers; it does not adjudicate Google's terms. AeroDex's exposure is indirect and, per the owner's decision, accepted |

**Verdict: A / C — legitimately purchasable, contractually the safest of the search-API options.**

### HasData — recommended at scale

| Axis | Finding |
|---|---|
| Authentication | API key. **Class A** |
| Search without booking | ✅ The product |
| Indemnity | ❌ **None.** HasData states: *"Google Flights' terms may restrict automated access; you are responsible for compliance"* |
| Residual risk | Higher than SerpApi. The compliance position transfers to AeroDex explicitly |

**Verdict: A / C — cheapest by a wide margin, but AeroDex carries the compliance position itself.**
Given the 7× price difference at FULL scale ($99 vs $725) this is a defensible trade; it
should be a recorded decision, not a default.

### Duffel — recommended backup, blocked on one question

| Clause | Text / effect | Impact on AeroDex |
|---|---|---|
| **2.5(d)** | Prohibits use "for metasearch purposes (including to build a metasearch on top of the Duffel Platform and/or to redistribute to a metasearch platform)" | ⚠️ **The blocking question.** A price index is arguably not metasearch — it publishes a statistic, not shoppable comparative fares. But "arguably" is not a contract position |
| **2.3** | Search-to-Order Ratio = offer-request calls ÷ orders created. Duffel "reserves the right to monitor and apply a cap on your usage" | ⚠️ With zero orders the denominator is zero. Duffel could cap usage at any point |
| **2.5(c)** | Bars building a product that competes with the Services | ✅ An index does not compete with a booking API |
| **2.5(j)** | Bars "speculative or sham Orders … repeat hold orders without subsequent booking" | ✅ **Does not apply** — this governs *orders and holds*. AeroDex creates neither |
| **3.2** | Requires refreshing displayed content at least weekly; bars hosting images from image-link URLs | ✅ AeroDex displays no live content and stores no images |
| Accreditation | Duffel states sellers need **not** be ARC/IATA accredited when using Managed Content | ✅ Removes the gate that killed the NDC/GDS routes |

**Verdict: B / C — excellent data, excellent price, one written answer away from being the
primary recommendation.** The exact question to ask is in §4.

### Indian OTAs — unchanged

MakeMyTrip/goibibo bar transmitting content "for any business, commercial or public
purpose". Cleartrip bars "robot/spider/scraper" without express written permission and
carries a commercial-use bar. ixigo, Yatra and EaseMyTrip are equivalent per the previous
S3.

**Verdict: F — technically accessible, contractually unsuitable.** The owner's decision
explicitly did **not** authorise breaching provider terms, and the paid API path removes any
reason to. Do not build these adapters.

### Enterprise vendors

| Provider | Blocking factor |
|---|---|
| Amadeus Self-Service | **Decommissioned 17 July 2026.** Not a terms question — the product is gone |
| Amadeus AQC / Enterprise, Sabre, Travelport | Commercial agreement, account manager, expected booking volume. **D / E** |
| Kiwi Tequila | Invite-only since 2026; requires a live travel product or established distribution use case. **B** |
| Skyscanner, Kayak, Momondo, Wego | Partner approval gated on **traffic and a booking funnel**. Money does not open these. **B / E** |
| TripJack / TBO / Mystifly | Agency onboarding; ₹50k–₹100k setup reported, plus a reported ₹2 lakh deposit. Booking obligations. **D / E** |
| OAG, ATPCO, Cirium, IATA PaxIS | Enterprise data licences, quote-only. **D** |

---

## 3. Rules AeroDex should keep even under the relaxation

These are **not** internal preferences and should survive the policy change:

| Rule | Where | Why it stays |
|---|---|---|
| `assert_no_personal_data` | `compliance.py:377` | India's **DPDP Act 2023** is statute, not terms of service. AeroDex wants fares, not people — there is no upside to relaxing this and real statutory downside |
| `redistributable()` | `compliance.py:405` | Copyright. AeroDex publishes derived statistics only; keeping raw third-party content out of the archive costs nothing and removes the question entirely |
| No CAPTCHA solving, no fingerprint spoofing, no proxy rotation | `plan.md` §7 | Defeating an access control is a materially different legal category from a terms breach, engaging "unauthorised access" provisions (IT Act §43/§66 in India). The paid API path needs none of it |
| Publisher refuses synthetic runs | `publish/artifacts.py` | This is what makes a demo honest. Keep it — and note it stops refusing the moment real fares arrive |

Keeping these four means the compliance story degrades from *"stricter than necessary"* to
*"correct"*, not to *"absent"* — which is a defensible position in front of a MoSPI jury.

---

## 4. Exact questions to put to providers

**To Duffel** (`help.duffel.com` / sales):

> AeroDex is a research project for India's Smart India Hackathon under a Ministry of
> Statistics and Programme Implementation problem statement (PS SIH26056). It constructs a
> public airfare **price index** — a monthly statistical series — from repeated fare
> observations at fixed advance-purchase horizons. It publishes only aggregate index
> numbers and never displays, redistributes or makes bookable any individual offer, and it
> creates no Orders.
>
> 1. Does clause 2.5(d) ("metasearch purposes") apply to this use?
> 2. Under clause 2.3, how is the Search-to-Order Ratio applied to an account that
>    deliberately creates zero Orders and pays the $0.005 excess-search fee on every search?
> 3. May we retain offer data (fare, carrier, times, taxes, conditions) as a historical
>    research archive?
> 4. Is there a research or academic arrangement for this use?

**To SerpApi** (support / sales): confirm that (a) storing parsed results indefinitely as a
research archive is permitted, and (b) publishing derived aggregate statistics is permitted.
Also ask whether an academic/research discount exists — none is published, but none is
excluded either.

**To HasData:** confirm the hourly throughput cap on the Business plan before scaling to the
full panel — it is not published.

---

## 5. Residual risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Duffel declines the 2.5(d) question | Medium | Low — backup only | Primary path is unaffected |
| Google Flights layout change breaks the provider's parser | Medium | Medium | Provider's problem, not AeroDex's — but add a canary test and keep a second provider configured |
| HasData compliance-transfer clause becomes an issue | Low | Medium | Prefer SerpApi at demo scale where the price gap is small |
| Provider price rise | Medium | Low | Adapter is provider-agnostic; migration is a config change |
| A provider is acquired or shuts down | Low | High | Three interchangeable providers on the same data source is the mitigation |
