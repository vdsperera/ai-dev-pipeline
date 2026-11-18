# Anti-Patterns & Defect Memory — Order Fulfillment Service

<!-- pipeline-template: anti-patterns/v2 -->

This document captures recurring mistakes, edge cases, and permanent coding invariants discovered during the development and review of this codebase.

---

### AP-001: Order Cancellation Race Invariants
- **Mistake:** Permitting status updates on non-pending orders or cancelling orders without restoring inventory reservations.
- **Correction:** Always validate status is strictly `PENDING`, release inventory atomically, and append an immutable audit log record before marking the order as `CANCELLED`.
- **Detect:** `/order\.status\s*=\s*['"]CANCELLED['"](?![^;]*releaseStock)/`
- **Paths:** `src/services/`
- **Seen in:** TASK-001
- **Rule:** Never mutate order status to `CANCELLED` without executing `InventoryService.releaseStock()` across all order line items.
