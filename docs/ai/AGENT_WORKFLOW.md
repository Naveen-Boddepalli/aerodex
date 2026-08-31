# AI Agent Workflow Instructions

This document contains rules and guidelines for AI coding agents modifying this repository.

## 1. Initial Context Gathering
Before writing any code, you must read:
1. `docs/ai/PROJECT.md` to understand the goal (building a defensible airfare index for SIH 2026, ₹0 recurring cost).
2. `docs/ai/ARCHITECTURE.md` to understand how data moves through the decoupled pipeline.
3. `docs/ai/CONVENTIONS.md` to understand the strict assertions and rules you cannot break.

## 2. Hard Rules for Making Changes

### Do NOT bypass compliance assertions
`aerodex/compliance.py` contains runtime assertions governing rate limits, `robots.txt`, and data privacy. These rules are the project's license to operate.
- Do not write code to evade rate limits.
- Do not write code to bypass `robots.txt` checks.
- Do not spoof User-Agents or solve CAPTCHAs.
- If a source blocks collection, the correct response is to accept the failure, drop the source, and let the system report the reduced coverage ratio.

### Do NOT break the invariants
- **`quote_raw` is append-only**: Do not write queries that `UPDATE` or `DELETE` from `quote_raw`.
- **Index Engine is pure**: Do not import HTTP clients, database drivers, or clock functions into `aerodex/index/engine.py`.

### Do NOT invent APIs or Services
- Only use components that have a permanent free tier matching the constraints outlined in `plan.md`. Do not introduce paid APIs (e.g., Amadeus) or heavy infrastructure (e.g., Redis) when Postgres `SKIP LOCKED` suffices.

### Golden Tests (M6 Reproducibility)
The tests in `tests/golden/` ensure that a fixed panel of data always produces the exact same output hash.
- If you modify `config/methodology.yaml` or index calculation logic, the golden tests will fail.
- **Never "fix" a golden test by blindly re-freezing the expected output.** A failure here means the published index number moved. If the change was intentional, re-freeze it in a dedicated, isolated commit with an explanation.

### Working with the Frontend
- The Next.js frontend is decoupled from the backend.
- It only fetches data through `frontend/lib/api.ts`. Do not introduce cross-origin requests or new fetch implementations directly in UI components.
- Obey the `data_source` tag. If the data is synthetic, the UI must continue to clearly label it as synthetic.

## 3. Verifying Your Work
- Run the full test suite (`uv run pytest -q`) before committing.
- Do not create flaky tests or tests that depend on live external networks unless placed specifically in `tests/canary/`.
- Validate frontend changes with `cd frontend && npm run build` to ensure static export works correctly.
