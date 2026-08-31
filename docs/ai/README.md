# AeroDex AI Agent Context Layer

This directory (`/docs/ai/`) provides a structured, high-level understanding of the AeroDex repository, designed specifically for AI coding agents.

The purpose of these documents is to prevent future agents from needing to read and analyze the entire codebase from scratch, ensuring they understand the project's strict constraints, methodology, and architecture before making changes.

## Recommended Reading Order

Agents should read these files in the following order:

1. **`PROJECT.md`**
   - What the project is (India airfare price index, SIH 2026).
   - Core goals and the ₹0 recurring cost constraint.
2. **`ARCHITECTURE.md`**
   - The decoupled pipeline design and major system components.
   - The separation between the database, FastAPI backend, and Next.js frontend.
3. **`CONVENTIONS.md`**
   - Crucial system invariants (append-only database, pure function index engine).
   - Compliance assertions (rate limiting, no evasion, robots.txt).
4. **`STRUCTURE.md`**
   - Map of the repository directories and where specific logic resides.
5. **`DEVELOPMENT.md`**
   - How to install dependencies, run the demo, use the CLI, and execute tests.
6. **`AGENT_WORKFLOW.md`**
   - Explicit instructions, rules, and boundaries for AI agents modifying this code.
