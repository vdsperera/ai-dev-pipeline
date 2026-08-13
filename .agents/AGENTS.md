# AI Dev Pipeline — Coding Standards

These standards apply to all code written in this workspace. They are extracted from the Developer Agent (Agent 5) and enforced as baseline quality expectations.

## Naming & Readability

- Names state intent, not implementation — `getUserByEmail` not `dbQuery1`
- Functions do one thing — if a comment is needed to explain what it does, rename or split it
- Boolean names are questions: `isActive`, `hasPermission`, `canRetry`
- Constants are named and uppercased — no magic numbers or strings inline
- No abbreviations unless universally understood in the domain

## Error Handling

- All I/O operations (DB, network, file, queue) are wrapped in error handling
- Errors are typed and specific — no bare `catch(e)` that swallows silently
- Error messages include context: what was attempted, with what input, what failed
- Failures logged at the right level: warn for recoverable, error for unrecoverable
- Never expose internal error details (stack traces, query strings) to external callers
- Never use exceptions for control flow

## Input Validation

- Validate all external input at the entry point: API, queue consumer, file reader, CLI arg
- Validate type, shape, length, range, and format — not just presence
- Return structured validation errors: field name, constraint violated, expected vs received
- Sanitise before storing or passing downstream
- Never trust data that crosses a component boundary, even from internal services

## Retries & Resilience

- Retry only idempotent operations
- Use exponential backoff with jitter — never fixed-interval retries under load
- Set a maximum retry count and a timeout — retries must terminate
- Implement circuit breaker for dependencies called more than once per request cycle
- Log each retry attempt with attempt number, delay, and error reason
- Never retry on 4xx client errors

## Security

- Use parameterised queries — never concatenate user input into SQL or commands
- Never log credentials, tokens, PII, or secrets — mask before logging
- Read secrets from environment or secrets manager — never hardcode
- Apply least privilege — request only permissions actually needed
- Enforce auth checks at the function level, not only the route level
- Never roll your own crypto

## Logging & Observability

- Every significant operation has a log entry: started, succeeded, failed — with duration
- Logs are structured JSON with: timestamp, level, component, operation, correlation ID
- Include a correlation/trace ID on every request
- Emit a metric or event for every business-significant outcome
- No `console.log` in production code — use the project logger

## Code Hygiene

- No unused imports, variables, or dead code
- No commented-out code
- No `console.log`, debug statements, or test fixtures in production paths
- No TODO without a linked task ID
- Style consistent with surrounding codebase

## Unit Tests (when writing code)

- Cover: happy path, at least one failure path, at least one boundary/edge case
- Tests are independent — no shared mutable state between test cases
- Mock all external dependencies — no real networks, databases, or clocks in tests
- Test names describe behaviour: `returns 401 when token is expired` not `test auth`
- Test observable behaviour, not implementation details

## Pipeline Context

This workspace uses an SDLC pipeline with specialised skills. Pipeline docs live in `docs/`:
- `docs/requirements.md` — refined requirements
- `docs/user-stories.md` — user stories with Gherkin acceptance criteria
- `docs/architecture.md` — system design document
- `docs/tasks.md` — ordered task backlog

When implementing code, always check these docs for context. The architecture document in `docs/architecture.md` is the source of truth for component design, API contracts, and data models.
