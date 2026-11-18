# Requirements — Feature: Order Cancellation with Restocking Policy & Audit Log

<!-- pipeline-template: requirements/v1 -->

## 1. Feature Overview
This document specifies the business requirements for adding an Order Cancellation capability to the Order & Inventory Fulfillment Service. Customers and operators must be able to cancel pending orders, automatically restocking reserved inventory and maintaining an immutable audit log of the cancellation event.

---

## 2. Functional Requirements

### FR-01: Order Cancellation Eligibility
- The system MUST only permit cancellation of orders in the `PENDING` state.
- If an order is in `FULFILLED` status, cancellation MUST be rejected with error: `Cannot cancel order in FULFILLED status`.
- If an order is already in `CANCELLED` status, cancellation MUST be rejected with error: `Order is already cancelled`.
- If the order does not exist, the system MUST return a `404 Not Found` error.

### FR-02: Inventory Restocking
- Upon successful cancellation, all line items associated with the order MUST be released from `reservedQuantity` back to `availableQuantity` in the inventory store.
- Partial restocking is not permitted; restocking is atomic across all items in the order.

### FR-03: Cancellation Audit Logging
- Every successful cancellation MUST create an audit log record containing:
  - `id`: unique audit record ID
  - `timestamp`: ISO 8601 timestamp
  - `orderId`: ID of the cancelled order
  - `action`: `CANCEL_ORDER`
  - `reason`: caller-supplied cancellation reason (defaults to `Customer requested cancellation` if omitted)
  - `restockedItems`: array of line items released

### FR-04: HTTP API Contract
- The API MUST expose `POST /api/orders/:id/cancel`.
- Request body may optionally include `{ "reason": string }`.
- Successful response status MUST be `200 OK` with payload `{ "success": true, "data": order, "auditLog": record }`.

---

## 3. Non-Functional Requirements
- **NFR-01 (Zero Dependencies):** Implementation must strictly use existing Node.js core libraries without adding npm packages.
- **NFR-02 (Atomic State):** Service layer must ensure that order state and inventory releases remain synchronized.
- **NFR-03 (Test Coverage):** 100% path coverage for happy path, invalid status, missing order, and inventory release.
