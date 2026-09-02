---
description: Ensure AI documentation in docs/ai/ is kept up to date.
trigger: always_on
---

# Update AI Documentation

When you make structural, architectural, or convention-changing modifications to the codebase (such as adding new tools, changing the pipeline, altering the database schema, modifying the index engine, or changing deployment strategies), you **MUST** ensure that the corresponding files in the `docs/ai/` directory are updated to reflect the new state.

The `docs/ai/` directory is critical for AI workflow integration and contains the following files:
- `PROJECT.md`: High-level goals, metrics, and non-negotiable constraints (like ₹0 recurring cost).
- `ARCHITECTURE.md`: Decoupled pipeline, external services, and deployment architecture.
- `CONVENTIONS.md`: Strict rules, coding invariants (e.g. pure function for index engine, append-only `quote_raw`), and compliance logic.
- `STRUCTURE.md`: Map of the repository directories.
- `DEVELOPMENT.md`: Setup, build, testing, and CLI usage.
- `AGENT_WORKFLOW.md`: Explicit agent-specific instructions.
- `README.md`: Entry point and reading order.

**Action Required**: If your changes impact any of these areas, automatically propose or apply updates to the relevant `docs/ai/` files before concluding your task.
