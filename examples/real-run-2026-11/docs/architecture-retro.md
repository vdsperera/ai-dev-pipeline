# Architectural Retrospective — Order Fulfillment Service

<!-- pipeline-template: retro/v2 -->

**Project:** Order & Inventory Fulfillment Service  
**Evaluator:** Agent 17 (Architectural Retrospective)  
**Date:** 2026-11-18  
**Scope:** Order creation, inventory reservation, restock, and order cancellation lifecycle.  

---

## 1. System Overview & Tech Stack Audit

- **Runtime & Language:** Node.js v18+ CommonJS [observed: `package.json`]
- **Core Pattern:** 3-Tier Layered Architecture (Controller $\rightarrow$ Service $\rightarrow$ In-Memory Store) [recorded: `docs/architecture.md`]
- **Dependencies:** 0 third-party packages; 100% native Node.js core modules [observed: `package.json`]
- **Test Baseline:** 8 unit & integration tests passing via `node:test` in <200ms [observed: `tests/*.test.js`]

---

## 2. Evidence Ledger

Every observation in this retrospective is backed by one of three evidence tags:
- `[recorded]` — Extracted directly from existing project artifacts (ADRs, handoff notes, tasks, review reports).
- `[observed]` — Directly verified from source code, directory structures, or test executions.
- `[inferred]` — Logical engineering deduction derived from verified observations.

| Decision / Feature | Evidence Tag | Source Artifact / File | Status |
|--------------------|--------------|------------------------|--------|
| In-memory store    | `[recorded]` | `docs/architecture.md` | Active |
| Native HTTP server | `[recorded]` | `docs/architecture.md` | Active |
| Task dependency gate | `[recorded]` | `docs/tasks.md` | Enforced |
| Atomic restock on cancel | `[recorded]` | `docs/handoffs/TASK-001.md` | Verified |
| 10-category code review | `[recorded]` | `docs/reviews/TASK-001-code-review.md` | Approved |

---

## 3. Realized Architecture & Component Churn

The implemented architecture strictly mirrors the layered design documented in `docs/architecture.md`:
1. **Routing & Dispatch (`src/app.js`):** [observed] Parses HTTP methods and URL regexes. Rejects bodies >1MB.
2. **Controller Layer (`src/controllers/`):** [observed] Validates HTTP input, delegates to services, translates domain exceptions to standard HTTP status codes (`200`, `201`, `400`, `404`, `500`).
3. **Domain Service Layer (`src/services/`):** [observed] Coordinates business rules. `OrdersService` manages state transitions (`PENDING` $\rightarrow$ `CANCELLED`), while `InventoryService` manages available and reserved quantities.
4. **Data Persistence Layer (`src/models/`):** [observed] Synchronous in-memory `Map` collections with append-only audit logging.

---

## 4. Likely Failure Modes

Based on verified code characteristics (not hypothetical simulated extremes):
1. **Process Restart State Loss:** `[observed: src/models/order-store.js]`
   - *Impact:* Because state is stored in JavaScript `Map` instances in memory, terminating or restarting the Node process wipes all active orders and stock adjustments.
   - *Mitigation:* Backing stores should be migrated to SQLite or PostgreSQL before production traffic.
2. **Synchronous JSON Parsing Under Large Concurrent Payloads:** `[observed: src/app.js:parseJsonBody]`
   - *Impact:* `JSON.parse` blocks the event loop for very large payloads.
   - *Mitigation:* A 1MB safety guard is already implemented in `parseJsonBody` to prevent unbounded heap allocation.

---

## 5. Scale Reasoning (Stated Load Profile)

- **Target Profile:** Single-node internal microservice handling 50–200 requests/second.
- **Analysis:** `[inferred]` In-memory lookups run in $O(1)$ time with sub-millisecond latencies. Because operations run sequentially on Node's single-threaded event loop, race conditions between `reserveStock` and `releaseStock` are impossible in single-process mode.
- **Scale Boundary:** If scaled horizontally across multiple Node worker processes, separate instances would maintain isolated in-memory stores, causing inventory inconsistencies unless backed by a centralized Redis or SQL store.

---

## 6. Anti-Pattern Invariant Audit

- `[observed: tests/orders.test.js]` Tests use isolated contexts via `setupTestContext()`; no shared mutable state.
- `[observed: src/controllers/orders-controller.js]` No bare `catch(e)` statements; specific error checks distinguish 404 from 400.
- `[observed: src/app.js]` No magic constants; status codes and headers are explicitly declared.
- `[recorded: docs/reviews/TASK-001-code-review.md]` Anti-pattern decision explicitly evaluated and closed with `Decision: NO`.

---

## 7. Feed-Forward Recommendations

1. **TASK-003 (Future):** Introduce SQLite persistence using Node 22 native `node:sqlite` to preserve orders and audit logs across process restarts without adding external npm dependencies.
2. **ADR-003 (Draft):** Adopt `node:sqlite` as the zero-dependency embedded database for production persistence.
