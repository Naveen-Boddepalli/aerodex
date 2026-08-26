# S3 → S4 DECISION LOG

**Research date: 25 August 2026.**
Preserves and supersedes the *verdict* of `docs/research/s3/DECISION_RECORD.md`.
No previous decision has been deleted; each is shown with what overturned it.

---

## 1. Chronology

| Pass | Date | Verdict | Overturned by |
|---|---|---|---|
| **S3-original** (`docs/spikes/s3-source-mapping.md`) | Aug 2026 | NO-GO on terms: zero sources usable | S3-redo |
| **S3-redo** (`docs/spikes/s3-redo.md`) | Aug 2026 | Five GREEN tariff-sheet sources; build a "Tier A" index | S3-verification |
| **S3-verification** (`docs/spikes/s3-verification.md`) | Aug 2026 | Tier A killed empirically; 4 of 5 sources fail the robots gate | — (evidence stands) |
| **S3-eSankhyiki addendum** (`docs/spikes/s3-addendum-esankhyiki.md`) | Aug 2026 | Dataset Link is a portal, not a dataset | Softened by consolidation (§K) |
| **S3 consolidation** (`docs/research/s3/FINAL_S3_CONCLUSION.md`) | 23 Aug 2026 | **B — proceed with permission path** | **This document** |
| **FINAL S3/S4** (this) | **25 Aug 2026** | **OPTION B — a cheap paid API is sufficient** | — |

---

## 2. The overturn, stated precisely

The previous verdict was **correct under its constraints** and is not being rewritten as an
error. It answered:

> *Can AeroDex obtain flight-level fares at controlled booking horizons that are **free**
> and pass **AeroDex's own compliance gate**?* → **No.**

This pass answers a different question, because the project owner changed the constraints:

> *Can AeroDex obtain flight-level fares at controlled booking horizons that are
> **legitimately purchasable** and do not breach **provider** terms?* → **Yes, for $25/month.**

**What the previous research missed, and why.** It searched the *distribution* category
exhaustively — OTAs, metasearch, NDC, GDS, B2B consolidators, sanctioned booking APIs — and
correctly found that all of them meter search and recover the cost from bookings. It did not
examine the **search-result API** category (SerpApi, HasData, SearchApi, Apify) as a source
class, because AeroDex's own rule *"an intermediary's indemnity does not make the underlying
access permitted"* marked the whole category RED before it was priced. Removing that rule
reopens a category the previous conclusion never evaluated on its merits.

This also voids the previous instruction *"stop searching for sources — further search has
negative expected value."* That was conditional on the constraint set. It should be reworded,
not deleted: **stop searching the distribution category; the intelligence category is now open.**

---

## 3. Decisions taken

| # | Decision | Basis | Revisit if |
|---|---|---|---|
| D-01 | **Primary source: SerpApi Google Flights** for the demo panel | Cheapest at demo scale among indemnified providers; horizon controlled by construction; no look-to-book | Price rises above HasData at demo scale, or the Google Flights parser degrades |
| D-02 | **Scale-up source: HasData Google Flights** | $99/mo carries the full 60-route panel vs $725 on SerpApi | HasData's compliance-transfer clause becomes untenable, or its hourly cap proves insufficient |
| D-03 | **Backup source: Duffel**, pending clause 2.5(d) | Richer fields fill all six hedonic characteristics at $189/mo FULL | Duffel confirms an index is not "metasearch" → **promote to primary** |
| D-04 | **Do not build OTA adapters** | Provider terms are external and unchanged; the owner's decision did not authorise breaching them, and $25/mo removes the reason | Never, on current information |
| D-05 | **Do not pursue NDC / GDS / B2B consolidators** | Amadeus Self-Service dead; TripJack ₹50k–₹100k + reported ₹2 lakh deposit; Kiwi invite-only; all carry booking obligations | An institutional agreement arrives that waives the commercial gate |
| D-06 | **MoSPI/DGCA letters move from blocking to parallel** | A paid API changes the project decision today without any reply | Letters return an authorisation — then reassess whether to collect under MoSPI authority instead |
| D-07 | **Reduce `hedonic.characteristics` to the four the primary source populates**, or clear Duffel first | Config must not describe a model the code cannot fit | Duffel clears 2.5(d), or a provider starts returning fare brand and refundability |
| D-08 | **Keep the ₹0 architecture as the documented handover configuration** | ₹0 was never a PS SIH26056 requirement, but it remains a genuine strength of the design for a ministry handover | — |
| D-09 | **Withdraw the provenance objection to `mospi-esankhyiki`** | Published by `nso-india`, the NSO's own GitHub org, MIT licence | — |

---

## 4. PART 8 — Audit of AeroDex internal rules

Every internal rule that blocks legitimate API usage, classified.
**No code has been modified.** This is the proposal.

| # | Rule | Location | Class | Rationale |
|---|---|---|---|---|
| R-01 | `authorization` / `x-api-key` in `FORBIDDEN_HEADERS` | `compliance.py:35` | **MODIFY** | Conflates *impersonation* with *entitled credentials*. Blocks every paid API before any provider term applies. **The single blocking rule.** |
| R-02 | `assert_no_auth()` name and semantics | `compliance.py:358` | **MODIFY** | Rename to `assert_no_impersonation()`. Keep `cookie` and `proxy-authorization` blocked; allow `authorization` / `x-api-key` when the adapter declares an auth mode and the key loads from the environment |
| R-03 | Universal robots.txt enforcement | `compliance.py:280`, `base.py:148` | **MOVE TO PROVIDER-SPECIFIC POLICY** | robots.txt is meaningless for a host AeroDex holds a contract with. Keep ENFORCE as the default for any uncontracted host |
| R-04 | `MIN_INTERVAL_PER_HOST_S = 20.0` | `compliance.py:24` | **MOVE TO PROVIDER-SPECIFIC POLICY** | Correct for scraping, absurd for a metered API. 20 s × 1,260 searches = 7 hours per slot — it would break the panel on its own |
| R-05 | `REPO_URL = "https://github.com/aerodex/aerodex"` | `compliance.py:28` | **REMOVE / FIX** | **Factually wrong.** The repo is `github.com/Naveen-Boddepalli/aerodex`. The User-Agent currently points third parties at a namespace the team does not control |
| R-06 | `assert_identifies_project()` | `compliance.py:367` | **KEEP**, make policy-aware | Harmless and good practice against uncontracted hosts. API providers do not require it; do not let it block one |
| R-07 | `assert_no_personal_data()` | `compliance.py:377` | **KEEP — unconditionally** | DPDP Act 2023 is statute, not terms of service. No upside to relaxing |
| R-08 | `redistributable()` | `compliance.py:405` | **KEEP** | Copyright. AeroDex publishes derived statistics only |
| R-09 | "Intermediary indemnity is not permission" | `s3/SOURCE_DECISION_MATRIX.md` line 71 | **REMOVE** | This rule alone marked the entire winning category RED |
| R-10 | ₹0-only source gate | `plan.md` §0, §4 | **REMOVE as a gate** | Keep as a documented handover configuration (D-08) |
| R-11 | MoSPI permission as prerequisite | `s3/DECISION_RECORD.md`, `NEXT_ACTIONS.md` | **MODIFY** | Parallel track, not critical path (D-06) |
| R-12 | Source plurality / minimum source count | `plan.md` §5.2, §7 | **MODIFY** | One source is acceptable for the MVP. Keep publishing the coverage ratio; add a second provider after the first runs |
| R-13 | Publisher refuses synthetic-only runs | `publish/artifacts.py` | **KEEP** | The guard that makes a fixture demo honest. It stops refusing the moment real fares land |
| R-14 | M6 bit-identical reproducibility | `tests/golden/` | **KEEP** | Already built, costs nothing to retain, and is the project's strongest differentiator |
| R-15 | No CAPTCHA solving / fingerprint spoofing / proxy rotation | `plan.md` §7 | **KEEP** | Defeating an access control is a different legal category from a terms breach. The API path requires none of it |

### Proposed policy architecture

Replace the module-level constants with a per-adapter policy object, so that a relaxation is
**declared, scoped and justified** rather than global:

```python
class AuthMode(StrEnum):
    NONE = "none"            # uncontracted public host
    API_KEY = "api_key"      # entitled credential, loaded from env
    OAUTH = "oauth"

class RobotsPolicy(StrEnum):
    ENFORCE = "enforce"          # default for any uncontracted host
    SKIP_CONTRACTED = "skip"     # permitted only when `basis` names a contract

@dataclass(frozen=True)
class SourcePolicy:
    auth_mode: AuthMode
    robots: RobotsPolicy
    min_interval_s: float
    identify_project: bool
    basis: str        # e.g. "contract:SerpApi ToS, reviewed 2026-08-25"
```

`assert_request_allowed(url, headers, *, policy, ...)` then enforces the policy rather than a
global constant, and **refuses `SKIP_CONTRACTED` unless `basis` is non-empty.**

The design principle is preserved: relaxing a rule still requires deliberately editing a
file called `compliance.py`, and now it additionally requires *writing down why*. The
compliance story becomes an audit trail rather than a prohibition — which is a stronger
position to present, not a weaker one.

---

## 5. Open questions

| # | Question | Blocks? | How to close |
|---|---|---|---|
| Q-01 | Does Duffel consider a statistical index "metasearch" under 2.5(d)? | Backup only | Email — draft in `S3_LEGAL_AND_CONTRACTUAL_MATRIX.md` §4 |
| Q-02 | HasData hourly throughput cap on Business | Scale-up only | Ask before migrating |
| Q-03 | SerpApi credit expiry on a stable plan | No | Ask support |
| Q-04 | Apify cost per *search* vs per *result* | No | Measure on the free tier |
| Q-05 | Does DGCA's tariff holding contain bands or offers? | No | NA-2 letter |
| Q-06 | Will MoSPI authorise or delegate collection? | No — now parallel | NA-1 letter |
| Q-07 | What `base.period` should replace `2026-09`? | **Yes — time-sensitive** | Decide once the first real collection date is known |

---

## 6. Conditions that would move this decision again

- **→ Duffel as primary** if clause 2.5(d) is cleared in writing. Best data, better price at
  scale, and all six hedonic characteristics survive.
- **→ MoSPI-authorised collection** if NA-1 returns an authorisation. Strictly stronger than
  any commercial arrangement and would change what the submission can claim.
- **→ Back to a constrained methodology (previous Option C)** only if every commercial
  provider simultaneously becomes unavailable. On current evidence — three interchangeable
  providers on the same underlying data — this is remote.
- **→ Previous Option B (permission path as critical path)** if the project owner reinstates
  the ₹0 constraint. The previous conclusion would then be correct again, unchanged.
