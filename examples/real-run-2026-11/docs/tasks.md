# Task Backlog — Order Cancellation Feature

<!-- pipeline-template: tasks/v1 -->

- [x] TASK-001 — Implement Order Cancellation Service & Restock Engine
- [x] TASK-002 — Implement Cancellation HTTP Endpoint, Route Handler & Validation

---

### TASK-001 — Implement Order Cancellation Service & Restock Engine
- **Layer:** 4 — Business logic & state coordination
- **Depends on:** —
- **Status:** [x] Done
- **Files:** `src/services/orders-service.js`, `tests/orders.test.js`
- **Description:** Implement `cancelOrder(orderId, reason)` in `OrdersService`. Enforce status check (`PENDING` allowed, others rejected). Coordinate with `InventoryService.releaseStock()` to return reserved items. Append cancellation record to `OrderStore.appendAuditLog()`. Write comprehensive unit tests.

---

### TASK-002 — Implement Cancellation HTTP Endpoint, Route Handler & Validation
- **Layer:** 3 — API contracts & routing
- **Depends on:** TASK-001
- **Status:** [x] Done
- **Files:** `src/controllers/orders-controller.js`, `src/app.js`, `tests/orders.test.js`
- **Description:** Add `handleCancelOrder(req, res, orderId, body)` in `OrdersController` and mount `POST /api/orders/:id/cancel` in `src/app.js`. Handle 404 for missing orders and 400 for invalid statuses. Add end-to-end route tests.


<!-- planning-checksums:
requirements: 3af5a6a7
architecture: 0d41183a
-->
