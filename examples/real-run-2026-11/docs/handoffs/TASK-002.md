# Handoff — TASK-002

## What was built
Implemented the HTTP route handler and API endpoint for order cancellation:
- Added `handleCancelOrder(req, res, orderId, body)` to `OrdersController`.
- Mounted `POST /api/orders/:id/cancel` in `src/app.js` with regex-based path parameter extraction.
- Handled status code mapping: `200 OK` on success, `404 Not Found` for missing orders, and `400 Bad Request` for invalid states or malformed payloads.
- Added comprehensive HTTP controller unit tests in `tests/orders.test.js`.

## Files changed
- `src/controllers/orders-controller.js` — added `handleCancelOrder`.
- `src/app.js` — routed `POST /api/orders/:id/cancel`.
- `tests/orders.test.js` — added HTTP controller test covering 200, 404, and 400 responses.

## Architecture drift check & deviations
- **Deviations:** [none]
- **Drift Details:** None. Matches API contracts and 3-Tier Layered Architecture specified in `docs/architecture.md`.

## Reviewer focus areas
- URL regex pattern matching in `src/app.js`.
- Error status code differentiation (404 vs 400 vs 500).

## Open questions
- None.

## Self-review result
- 8/8 tests pass.
- Zero dependencies added.
- Clean separation of concerns between Controller and Service layers.
