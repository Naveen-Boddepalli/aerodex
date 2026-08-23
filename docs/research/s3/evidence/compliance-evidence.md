# Evidence — Compliance and access controls

**The central lesson of S3:** `robots.txt` status and Terms-of-Use status are *independent*
facts. A pass on one is not a pass on the other, and neither is permission on its own.
`s3-redo.md` conflated them and got four verdicts wrong.

---

## 1. robots.txt, verified per host (23 Aug 2026)

Evaluated against `aerodex/compliance.py`, which implements RFC 9309 §2.2.2/§2.2.3 and
treats 401/403/429 as `ACCESS_CONTROLLED` (refuse) and any unreachable robots.txt as
`UNREACHABLE` (refuse).

| Host | HTTP | robots content | Tariff-sheet path | `compliance.py` verdict |
|---|---|---|---|---|
| `www.airindiaexpress.com` | 200 | `Disallow: /dam`, `Disallow: /content/dam` | `/content/dam/airindiaexpress/documents/…` | **REFUSED** — explicitly disallowed |
| `assets.akasaair.com` | **403** | `AccessDenied` (S3 bucket) | `assets.akasaair.com/f/…` | **REFUSED** — access controlled |
| `www.akasaair.com` | 200 | `User-Agent: *` with **no Disallow** — fully permissive | *(sheet is not on this host)* | allowed, but irrelevant |
| `www.goindigo.in` | **timeout ×2** (18 s, 45 s, browser UA) | — | `/content/dam/s6web/…` | **REFUSED** — unreachable |
| `www.airindia.com` | **timeout ×2** | — | `/content/dam/air-india/pdfs/tariff/…` | **REFUSED** — unreachable |
| `fly91.in` | 200 | stock Drupal: `Disallow: /core/`, `/profiles/`, `/README.md` | `/resources/tariff-sheet.pdf` | **ALLOWED** |
| `www.spicejet.com` | 200 | absolute-URL `Disallow: https://www.spicejet.com/api/v1` | — | allowed after normalisation |

**Four of the five sources `s3-redo.md` classified GREEN would be refused by AeroDex's own
compliance module.** Only Fly91 — the smallest carrier in the set — passes.

**Unresolved (CLM-19):** the IndiGo and Air India timeouts may be geo-blocking or WAF
behaviour on a non-Indian egress rather than genuine unavailability. Both were retried.
Resolving this needs a fetch from an Indian IP — see NA-6.

**Incidental corroboration.** SpiceJet's absolute-URL `Disallow` is exactly the
`MALFORMED_INTENT` case `compliance.py` already normalises rather than reading permission
out of a syntax error.

## 2. Terms of use, verified per carrier

Checked individually. They are **not** a shared template, which `s3-redo.md` assumed.

| Carrier | Download carve-out | Other restrictions |
|---|---|---|
| **IndiGo** | **Yes** — "any downloading that occurs in the normal course of using the IndiGo website in accordance with the published written instructions of IndiGo shall not be prohibited" | May not "copy, replicate … transfer" information "for any purpose whatsoever, without the prior written permission" |
| **Akasa** | **Yes** — identical wording | Plus "meant for **personal and non-commercial use only**" |
| **Fly91** | **None found** | Downloading/exporting barred without written permission; personal, non-commercial only |
| **Air India** | None found | Bars "accessing, monitoring, or copying any information … using any robot, spider, scraper, or other automated means **or any manual process** … without our express written permission" |
| **Air India Express** | None found | Bars "any automated use of the system, including using scripts, data mining, robots" except "standard search engine or Internet browser usage" |

**Air India's clause reaches manual copying.** That defeats the redo's fallback argument
that "at 12–30 files a year a person can simply download them" — for Air India, a person
cannot, absent written permission.

**On the carve-out.** It is a reasonable reading that following a link the operator
publishes, to fetch a document the regulator compels them to publish conspicuously, is
"downloading in the normal course … in accordance with the published written instructions".
It is an **interpretation**, not a permission, and the separate no-copy clause still binds
downstream use. Do not present it as settled.

**On copyright.** `s3-redo.md` argued fare tables may lack originality under *Eastern Book
Company v. D.B. Modak* (SC, 2008). This is a supporting argument at best — the selection
and arrangement of 21 levels across ~4,700 routes is not obviously devoid of skill and
judgment. Marked interpretation-only; not to be presented as a legal conclusion.

## 3. `urllib.robotparser` is unfit for compliance use

Four defects, **each of which grants access a site refused** — full detail in
`docs/spikes/robots-parser-defects.md`:

1. **A blank line discards every rule that follows.** ixigo's live file has this shape;
   parsed with the stdlib, zero rules survive and everything is allowed.
2. **An empty `Disallow:` becomes allow-everything** and, with first-match-wins, shadows
   every later rule. SpiceJet's file opens this way.
3. **`*` and `$` wildcards are unimplemented.** goibibo's `Disallow: /flights/air-*` — the
   rule protecting its route pages — does not match at all.
4. **First-match-wins instead of most-specific-match**, inverting the answer whenever a
   narrow `Allow` sits beneath a broad `Disallow`.

**Consequence for S3's own history:** the original spike's robots gate was enforcing
nothing when the ixigo fare was retrieved, and one request was made to a disallowed goibibo
path before the defect was found. Both are disclosed in `docs/spikes/s3-source-mapping.md`.
`aerodex.compliance.RobotsRules` now implements RFC 9309 directly, records anomalies for
audit, and is pinned by regression tests — including two that assert the *stdlib's* broken
behaviour, so that if they ever fail, Python was fixed.

## 4. What `aerodex/compliance.py` actually enforces

Single gate: `assert_request_allowed(url, headers, robots=…, limiter=…, fetch_robots=…)`.

- `assert_no_auth` — rejects `authorization`, `cookie`, `x-api-key`, `x-auth-token`,
  `proxy-authorization`. **No authenticated source can pass this gate**, which is why every
  token-based API in the matrix is YELLOW at best.
- `assert_identifies_project` — the User-Agent must name AeroDex and link the repo.
- `robots.allows(...)` — the custom RFC 9309 parser, with the status semantics above.
- `HostRateLimiter.wait(...)` — floor of **20 s** per host, enforced in code; the
  constructor refuses any smaller interval.
- `assert_no_personal_data` / `redistributable` — no personal fields, and raw third-party
  bodies are stripped before publication, keeping only hashes for M6.

**Gap found:** `plan.md` §5.2 requires "redundancy across sources instead of evasion" and
publishing a coverage ratio when a source is dropped. **Neither source plurality nor a
coverage-ratio metric is encoded anywhere** — verified by grep across `aerodex/`, `config/`,
`scripts/` and `tests/`: no matches. It exists only as prose in `plan.md`. See MR-14.
