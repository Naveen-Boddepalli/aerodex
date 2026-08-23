# `urllib.robotparser` is not fit for compliance use

Found while running Phase 0 spike S3 against real robots.txt files from Indian
travel sites. Four independent defects, **every one of which grants access the
site refused**. `aerodex/compliance.py` no longer uses the stdlib parser.

## 1. A blank line discards every rule that follows

```
User-agent: *
                      <- blank
Disallow: /api/
```

The stdlib treats a blank line as end-of-record, so the rules that follow belong
to no group. `rp.entries == []` — **zero rules parsed**, everything allowed.
ixigo's live robots.txt has exactly this shape. RFC 9309 and Google both delimit
groups by the `User-agent` line; blank lines are ignorable whitespace.

## 2. An empty `Disallow:` becomes allow-everything and shadows later rules

```
User-agent: *
Disallow:
Disallow: /cgi-bin/
```

`RuleLine("", allowance=False)` is rewritten internally to `allowance=True` with
path `""`, which matches every path. Combined with defect 4 (first-match-wins) it
shadows every rule after it. SpiceJet's live file opens this way, so parsed
verbatim it grants blanket permission to the entire site including `/cgi-bin/`.
Per RFC 9309 an empty value is a **no-op**, not a grant.

## 3. `*` and `$` wildcards are unimplemented

```
Disallow: /flights/search*
```

RFC 9309 §2.2.3 defines `*` (any sequence) and `$` (end anchor). The stdlib
compares literally, so this pattern does not even match `/flights/search` itself.
Cleartrip, EaseMyTrip and goibibo all rely on wildcards; goibibo's
`Disallow: /flights/air-*` is what protects its route pages.

## 4. First-match-wins instead of most-specific-match

RFC 9309 §2.2.2 requires the **most specific** match to win, with `Allow`
winning ties. The stdlib returns the first matching rule, inverting the answer
whenever a narrow `Allow` sits beneath a broad `Disallow`.

## What replaced it

`aerodex.compliance.RobotsRules` implements §2.2.2 and §2.2.3 directly. It also
normalises two malformed-but-unambiguous constructs rather than reading
permission out of a syntax error:

- **absolute-URL `Disallow`** — SpiceJet publishes
  `Disallow: https://www.spicejet.com/api/v1`. A `Disallow` value must be a path,
  so this matches nothing. It is rewritten to `/api/v1` and honoured.
- **empty `Disallow`** — dropped as a no-op, never treated as a grant.

Both are recorded in `RobotsCache.anomalies` for audit.

## Status semantics

Separately, "no robots.txt exists" and "the server could not be reached" are
different facts and are no longer conflated:

| Response | Verdict | Why |
|---|---|---|
| 2xx | parse and apply | |
| 404, 410, other 4xx | **allowed** | RFC 9309 §2.3.1.3 "unavailable" = unrestricted. API subdomains routinely 404 here; refusing them all would ban every tier-2 endpoint on a technicality |
| 401, 403, 429 | **refused** | access is controlled or we are throttled — a signal about automation, not the absence of one |
| 5xx | **refused** | unreachable |
| transport failure | **refused** | an outage is not permission |

## Regression coverage

`tests/unit/test_compliance.py` pins all four defects, including two tests that
assert the *stdlib's* broken behaviour — if those ever fail, Python was fixed and
the workaround can be revisited.
