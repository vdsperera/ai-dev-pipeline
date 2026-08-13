---
name: sdlc-test
description: >-
  Use this skill when the user wants to generate a comprehensive test suite for a completed task.
  Triggers on phrases like "test TASK-NNN", "generate tests for TASK-NNN", "write tests for TASK-NNN",
  or "create test suite". Runs the Test Generator (Agent 8) to produce unit, integration, E2E,
  and performance tests based on linked stories, architecture, and review reports.
---

# SDLC Test Generation — Agent 8

Generate a complete, runnable test suite for a task that has passed code review (and security review if applicable).

## Prerequisites

- The task must be implemented (code files exist)
- `docs/reviews/TASK-NNN-code-review.md` must exist and show Approved verdict
- If security review was run, `docs/reviews/TASK-NNN-security-review.md` must show Cleared verdict
- `docs/tasks.md`, `docs/user-stories.md`, and `docs/architecture.md` must exist

## Workflow

### Step 1: Gather Context

1. Read the task definition from `docs/tasks.md`
2. Read all linked user stories with Gherkin scenarios from `docs/user-stories.md`
3. Read the architecture (API contracts, NFR targets, risk flags) from `docs/architecture.md`
4. Read the code review report from `docs/reviews/TASK-NNN-code-review.md`
5. If it exists, read the security review report from `docs/reviews/TASK-NNN-security-review.md`
6. Read all implementation code and existing test files for this task

### Step 2: Generate Test Suite

**Read the full agent instructions** from [`prompts/08-test-generator.md`](../../prompts/08-test-generator.md).

**Role**: You are a Test Generator. Produce a complete, runnable test suite.

Following the agent instructions, generate tests covering:

**Mandatory scenario coverage per linked user story**:
- Happy path — every Gherkin happy-path scenario maps to exactly one test
- Sad paths — every distinct failure mode
- Boundary values — min, max, min−1, max+1 for every constraint
- Null / empty / missing — null, undefined, empty string, empty array, zero
- Concurrency — two simultaneous requests that should not interfere
- Idempotency — same request twice, same result, no side effect doubling
- Security — injection payloads, IDOR, token replay, missing auth
- External failure — third party 500, timeout, malformed response
- State transitions — every valid and invalid state change

**Test pyramid distribution**:
- 70% Unit — single function/class, no I/O, mocked dependencies
- 20% Integration — multiple components, real DB (test instance), stubbed third parties
- 7% E2E — full user journey, real environment
- 3% Performance — NFR targets from architecture

**Security test coverage** (from security review findings):
- Every security finding from the Security Reviewer maps to at least one security test
- Every architecture risk flag maps to at least one test verifying the mitigation

### Step 3: Create Test Files

1. Create the test files in the appropriate location in the project (following existing test directory conventions)
2. Ensure all tests are runnable — proper imports, test framework setup, fixtures
3. Use the naming convention: `[feature].test.[ext]` or as appropriate for the test framework in use

### Step 4: Run Tests

1. Run the test suite
2. Report results — how many passed, how many failed
3. If tests fail, investigate and fix the test (not the implementation) if it's a test issue
4. If tests fail because of an implementation bug, report it as a finding

### Step 5: Coverage Matrix

Produce the coverage matrix at the end:

| Story / Scenario | Test ID(s) | Type |
|------------------|-----------|------|
| US-NNN · scenario | TC-NNN | Unit / Integration / E2E |

Every Gherkin scenario, security finding, and architecture risk flag must appear. Flag any gaps as missing coverage.

Write the coverage matrix and test report to `docs/test-reports/TASK-NNN-tests.md`.

### Step 6: Mark Task Done

1. Update `docs/tasks.md` — mark TASK-NNN as done
2. Tell the user:
   *"TASK-NNN is complete. Tests are written and passing. The task is marked done in docs/tasks.md."*
3. Suggest the next task to implement based on the dependency graph and critical path

## Rules

- Generate runnable test code, not just descriptions — tests must be executable as delivered
- Every Gherkin scenario maps to at least one test case
- Every security finding maps to at least one security test
- Every architecture risk flag maps to at least one test verifying the mitigation
- Produce a coverage matrix — gaps are findings, not omissions
- Do not generate happy-path-only tests — incomplete coverage is a false sense of safety
- Do not test implementation details — test observable, contractual behaviour
- Do not write tests that pass by default — every test must be capable of failing
- Do not skip performance tests when NFR targets exist — flag the gap if targets are unstated
