# Real-World Reference Run Field Notes — November 2026

**Target Application:** Order & Inventory Fulfillment REST API  
**Directory:** `examples/real-run-2026-11/`  
**Harness Version:** `@kadvsperera/ai-dev-pipeline v1.3.1`  
**Date of Execution:** 18 November 2026  
**Execution Track:** Fast-Track / Lite Planning + Full Governance Lifecycle  

---

## 1. Executive Summary

This directory contains a complete, unedited real run of the **AI Dev Pipeline** executing across a live Node.js REST service. No files were mock-generated or synthetically faked. Every artifact, test suite, and evaluation report was generated and mechanically verified by the pipeline's tools.

### What Was Built & Evaluated
- **Seed Codebase:** A 5-endpoint REST API for order fulfillment, stock reservations, and inventory restocking built with native `node:http` (zero external dependencies).
- **Feature Developed:** Order Cancellation with Atomic Inventory Restocking Policy and Immutable Audit Logging.
- **Pipeline Stages Exercised:**
  1. `sdlc-onboard` (Brownfield codebase scanning & architecture reverse-engineering)
  2. `sdlc-plan track=lite` (Fast-track requirements analysis & task decomposition)
  3. Governance Gate Verification (Mechanical dependency blocking & unlocking)
  4. `sdlc-develop` (Implementation of `TASK-001` & `TASK-002` with developer handoffs)
  5. `sdlc-review` (10-category code review with ADR-drift detection and anti-pattern decision)
  6. `sdlc-retro` (Architectural retrospective with `[recorded]`, `[observed]`, `[inferred]` evidence tags)
  7. `eval` (Codebase hygiene scorecard)

---

## 2. Stage-by-Stage Verification Ledger

### Stage 1: `sdlc-onboard`
- **Action:** Scanned raw JavaScript files and manifests in `src/` to produce `docs/architecture.md`.
- **Verification Command:**
  ```bash
  node scripts/eval-harness.js --target-dir=examples/real-run-2026-11 --onboard-check
  ```
- **Result:**
  ```text
  🔍 Architecture Onboard Path Verification
     Scanned docs/architecture.md in: examples/real-run-2026-11
     Verified Paths: 7/7
  ✔ All declared paths exist on disk! No architectural hallucinations detected.
  ```

### Stage 2: `sdlc-plan (track=lite)`
- **Action:** Formulated requirements for order cancellation (`docs/requirements.md`) and decomposed into atomic tasks (`docs/tasks.md`):
  - `TASK-001`: Implement Order Cancellation Service & Restock Engine (Dependencies: None)
  - `TASK-002`: Implement Cancellation HTTP Endpoint & Validation (Depends on: `TASK-001`)

### Stage 3: Mechanical Governance Dependency Gate
- **Action:** Evaluated task readiness prior to writing code.
- **Test A (`TASK-001` with no dependencies):**
  ```bash
  node scripts/security-gate.js --check-task TASK-001 --workspace examples/real-run-2026-11
  # Output: [security-gate] PASS: Dependencies for TASK-001 are satisfied.
  # Exit Code: 0
  ```
- **Test B (`TASK-002` attempted out of order):**
  ```bash
  node scripts/security-gate.js --check-task TASK-002 --workspace examples/real-run-2026-11
  # Output: [security-gate] BLOCKED: TASK-002 depends on TASK-001 (status: todo). Implement or close TASK-001 first.
  # Exit Code: 1
  ```
- **Outcome:** The governance gate mechanically prohibited premature implementation of `TASK-002`.

### Stage 4: `sdlc-develop` on `TASK-001` & `TASK-002`
- **Action:**
  - Implemented `OrdersService.cancelOrder()` with state transition validation (`PENDING` $\rightarrow$ `CANCELLED`) and atomic stock restitution.
  - Implemented HTTP controller handler and route parameter extraction in `src/app.js`.
  - Added 8 unit tests in `tests/orders.test.js`.
  - Generated developer handoff notes (`docs/handoffs/TASK-001.md` and `docs/handoffs/TASK-002.md`).
- **Post-Task Dependency Gate Verification:**
  ```bash
  node scripts/security-gate.js --check-task TASK-002 --workspace examples/real-run-2026-11
  # Output: [security-gate] PASS: Dependencies for TASK-002 are satisfied.
  # Exit Code: 0
  ```
- **Outcome:** Once `TASK-001` was marked `[x] Done`, `TASK-002` automatically unlocked.

### Stage 5: `sdlc-review`
- **Action:** Audited implementation against the 10 code review categories:
  - Acceptance criteria verified.
  - Category 10 (ADR Drift): Checked modifications in `src/services/orders-service.js` against `ADR-001` in `docs/architecture.md`. Confirmed no architectural divergence.
  - Mandatory Anti-Pattern Decision: Closed with `Decision: NO` and formal reasoning.
- **Report:** Saved to `docs/reviews/TASK-001-code-review.md` and `TASK-002-code-review.md` with verdict **Approved**.

### Stage 6: `sdlc-retro`
- **Action:** Conducted evidence-backed architectural audit (`docs/architecture-retro.md`) enforcing `[recorded]`, `[observed]`, `[inferred]` tags.
- **Real Verification Incident:**
  During initial retro generation, a table row referenced `scripts/security-gate.js` (a tool in the parent repo rather than the example workspace). Running the retro path verifier caught the discrepancy immediately:
  ```text
  🔍 Architectural Retrospective Path Verification
     Scanned docs/architecture-retro.md in: examples/real-run-2026-11
     Verified Paths: 7/8
  ⚠ Unresolved / Potential Hallucinated Paths (1):
     - scripts\security-gate.js
  ```
  The reference was corrected to the workspace task log `docs/tasks.md`, and re-running verified **8/8 paths (100%)**.

### Stage 7: Hygiene & Quality Evaluation Scorecard
- **Command:**
  ```bash
  node scripts/eval-harness.js --target-dir=examples/real-run-2026-11
  ```
- **Scorecard Output:**
  ```text
  🎯 AI Dev Pipeline — Stage Hygiene & Quality Scorecard
  ============================================================
  Workspace:  examples/real-run-2026-11
  Threshold:  80%

  DIMENSION                        SCORE    STATUS   WEIGHT
  ------------------------------------------------------------
  1. Architecture & Layering       100/100  PASS     30%
  2. Code Quality & Linter         100/100  PASS     25%
  3. Anti-Pattern Invariants       100/100  PASS     25%
  4. Traceability & Handoffs       100/100  PASS     20%
  ------------------------------------------------------------
  Codebase Hygiene Score: 100.0% [GRADE: A+] — PASSED
  ```

---

## 3. Honest Engineering Observations & Friction Points

1. **What Worked Exceptionally Well:**
   - **Mechanical Dependency Enforcement:** The CLI check `node scripts/security-gate.js --check-task TASK-NNN` works independently of AI prompts. An agent or developer cannot bypass it without changing the markdown task status.
   - **Path Verification Accuracy:** Path verification in `eval --onboard-check` and `eval --retro-check` prevented subtle path hallucinations from going unnoticed.
   - **Speed & Zero Bloat:** The entire test and evaluation cycle across all 8 tests runs in under **200 milliseconds** because the service and harness have zero runtime dependencies.

2. **Friction Points Identified:**
   - **Workspaces Without Local Toolchain:** When evaluating sub-projects or examples, passing `--target-dir` and `--workspace` flags is essential. Enhancing `security-gate.js` to accept `--workspace <path>` resolved cross-directory gate checks cleanly.
   - **Evaluator Strictness on Anti-Patterns:** The evaluator docks 10 points if `docs/anti-patterns.md` is absent, reinforcing that every production project must maintain an invariant memory file.
