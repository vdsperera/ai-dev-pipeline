# Architecture & System Design — Order Fulfillment Service

<!-- pipeline-template: architecture/v1 -->

This document captures the baseline architecture reverse-engineered from the codebase via the `sdlc-onboard` skill.

---

## 1. System Overview & Tech Stack

- **Runtime & Language:** Node.js (v18+ LTS, CommonJS)
- **Framework & Libraries:** Zero runtime dependencies (`node:http`, `node:url`)
- **Static Analysis & Linters:** [MISSING] — Recommended: ESLint / Biome
- **Test Runner:** Node.js native test runner (`node:test`, `node:assert/strict`) via `npm test`
- **Architecture Pattern:** 3-Tier Layered Architecture (Controller → Service → In-Memory Store)

### Layer Contract
- **controllers** (`src/controllers`): may import `services`
- **services** (`src/services`): may import `models`
- **models** (`src/models`): may import none

---

## 2. Component Map

### `OrderController`
- **Location:** `src/controllers/orders-controller.js`
- **Responsibility:** Handles HTTP requests, payload validation, and HTTP response serialization for order endpoints.
- **Exposes:** `handleCreateOrder`, `handleGetOrder`
- **Depends on:** `src/services/orders-service.js`
- **Data owned:** None (stateless)
- **Failure mode:** Returns structured JSON error payloads with 400 (validation) or 500 (internal).

### `InventoryController`
- **Location:** `src/controllers/inventory-controller.js`
- **Responsibility:** Handles HTTP requests for listing stock and restocking SKUs.
- **Exposes:** `handleListStock`, `handleRestock`
- **Depends on:** `src/services/inventory-service.js`
- **Data owned:** None (stateless)
- **Failure mode:** Returns structured JSON error payloads with 400 or 500 status codes.

### `OrdersService`
- **Location:** `src/services/orders-service.js`
- **Responsibility:** Coordinates order creation, status tracking, and stock reservation.
- **Exposes:** `createOrder`, `getOrder`, `listOrders`
- **Depends on:** `src/models/order-store.js`, `src/services/inventory-service.js`
- **Data owned:** Coordinates order state transitions (`PENDING` $\rightarrow$ `FULFILLED` / `CANCELLED`)
- **Failure mode:** Throws typed domain exceptions on validation or stock failure.

### `InventoryService`
- **Location:** `src/services/inventory-service.js`
- **Responsibility:** Manages SKU stock balances, reservations, and restocking increments.
- **Exposes:** `listStock`, `getItem`, `reserveStock`, `releaseStock`, `restock`
- **Depends on:** `src/models/inventory-store.js`
- **Data owned:** SKU inventory counts
- **Failure mode:** Throws typed domain errors on insufficient stock.

### `OrderStore`
- **Location:** `src/models/order-store.js`
- **Responsibility:** In-memory storage for order entities and cancellation audit records.
- **Exposes:** `saveOrder`, `getOrderById`, `getAllOrders`, `appendAuditLog`, `getAuditLogsForOrder`, `clear`
- **Depends on:** In-memory `Map` data structure
- **Data owned:** Order records and audit logs

### `InventoryStore`
- **Location:** `src/models/inventory-store.js`
- **Responsibility:** In-memory storage for inventory SKU items.
- **Exposes:** `seed`, `getBySku`, `getAll`, `save`, `clear`
- **Depends on:** In-memory `Map` data structure
- **Data owned:** SKU records

---

## 3. API Contracts

### `POST /api/orders`
- **Signature:** `POST /api/orders`
- **Request Body:**
  ```json
  {
    "customerId": "CUST-100",
    "items": [
      { "sku": "WIDGET-01", "quantity": 2 }
    ]
  }
  ```
- **Response Shape (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "ORD-1700000000000-123",
      "customerId": "CUST-100",
      "items": [{ "sku": "WIDGET-01", "quantity": 2 }],
      "status": "PENDING",
      "createdAt": "2026-11-18T10:00:00.000Z"
    }
  }
  ```
- **Validation:** Enforces `customerId`, non-empty `items` array, positive integer quantities.

### `GET /api/orders/:id`
- **Signature:** `GET /api/orders/:id`
- **Response Shape (200 OK):** Single order JSON object.
- **Response Shape (404 Not Found):** `{ "success": false, "error": "Order not found: ORD-..." }`

### `GET /api/inventory`
- **Signature:** `GET /api/inventory`
- **Response Shape (200 OK):** `{ "success": true, "count": N, "data": [...] }`

### `POST /api/inventory/restock`
- **Signature:** `POST /api/inventory/restock`
- **Request Body:** `{ "sku": "WIDGET-01", "quantity": 10 }`
- **Response Shape (200 OK):** `{ "success": true, "data": { "sku": "WIDGET-01", "availableQuantity": 30, "reservedQuantity": 0 } }`

---

## 4. Data Models

### Order Entity
- `id` (string, `ORD-<timestamp>-<rand>`)
- `customerId` (string, required)
- `items` (array of `{ sku: string, quantity: number }`)
- `status` (`PENDING` | `FULFILLED` | `CANCELLED`)
- `createdAt` (ISO 8601 string)

### Inventory Item Entity
- `sku` (string, uppercase identifier, e.g. `WIDGET-01`)
- `name` (string)
- `availableQuantity` (integer $\ge 0$)
- `reservedQuantity` (integer $\ge 0$)

### Audit Log Entity
- `id` (string, `AUD-<timestamp>-<seq>`)
- `timestamp` (ISO 8601 string)
- `orderId` (string)
- `action` (string, e.g. `CANCEL_ORDER`)
- `reason` (string)
- `restockedItems` (array of `{ sku: string, quantity: number }`)

---

## 5. Risk Flags & Technical Debt Baseline

1. **[MISSING] Linter / Static Analysis:** Repository currently lacks an automated linter configuration.
2. **Volatile Storage:** In-memory `Map` stores will lose state on server restart. A production deployment requires PostgreSQL / Redis.
3. **No Distributed Concurrency Locks:** Concurrent requests for the same SKU could lead to race conditions if multi-threaded or scaled across multiple Node processes. Single-process Node event loop currently mitigates this.

---

## 6. Baseline Architecture Decision Records (ADRs)

### ADR-001: In-Memory Multi-Tier Architecture for Order & Inventory
- **Status:** Accepted
- **Date:** 2026-11-18
- **Alternatives considered:** SQLite database, Redis store, Monolithic file store
- **Implementing files:** `src/models/order-store.js`, `src/models/inventory-store.js`, `src/services/orders-service.js`, `src/services/inventory-service.js`
- **Context:** Low-latency fulfillment service requiring zero native external binary dependencies for testing and local verification.

### ADR-002: Native Node.js HTTP Server Dispatcher
- **Status:** Accepted
- **Date:** 2026-11-18
- **Alternatives considered:** Express.js, Fastify, Koa
- **Implementing files:** `src/app.js`
- **Context:** Minimizing attack surface and maintaining zero third-party dependencies while providing pure REST endpoints.
