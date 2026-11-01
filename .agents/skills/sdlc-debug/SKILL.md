---
name: sdlc-debug
description: >-
  Use this skill when the user wants to investigate, debug, or fix a bug, stack trace,
  regression, or unexpected behaviour. Triggers on phrases like "debug this", "fix bug",
  "investigate error", "root cause analysis", "hotfix", or "sdlc-debug". Runs Agent 16
  (Bug Investigator) to perform RCA, write a failing reproduction test first, apply a
  minimal fix, and produce a BUG-NNN handoff report.
---

# SDLC Debug — Root-Cause Analysis & Bug Fix

Run the Bug Investigator agent (Agent 16) to diagnose a defect scientifically, write a failing reproduction test first, implement a minimal fix, verify linters and tests, and document the root-cause analysis (RCA).

## Prerequisites

- A bug description, error message, stack trace, or failing test provided by the user
- `docs/architecture.md` (if it exists) will be read for component and contract context

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/16-bug-investigator.md`](../../prompts/16-bug-investigator.md) before proceeding.

### Step 2: Gather Context & Formulate Hypotheses

1. Determine the bug ID (e.g., `BUG-001` or the next available number in `docs/handoffs/BUG-*.md`)
2. Read `docs/architecture.md` (if present) and inspect the files/functions implicated by the bug report or stack trace
3. Trace the execution path and formulate hypotheses to isolate the true **root cause** (not just the surface symptom)

### Step 3: Reproduce with a Failing Test (Red Phase)

1. Write a unit or integration test that reproduces the exact bug
2. Run the test suite to confirm the new test fails as expected
3. Do not modify production code until the failure is reproduced and understood

### Step 4: Implement Minimal Fix & Verify (Green Phase)

1. Apply the minimal, scoped fix to resolve the root cause following `AGENTS.md` standards
2. Run the reproduction test and confirm it passes
3. Run the full test suite and project static analysis/linters to ensure zero regressions and zero lint errors

### Step 5: Produce RCA Handoff

Write the RCA and handoff report to `docs/handoffs/BUG-NNN.md`:

```markdown
# Bug RCA & Handoff — BUG-NNN

## Symptom
[What was observed — error message, stack trace, or incorrect output]

## Root Cause
[Why it happened — exact file, function, line, and flawed assumption]

## Reproduction Test
[Test file and test case name that reproduces the defect]

## Fix Applied
[Summary of the minimal code change]

## Files Changed
[List of modified production and test files]

## Blast Radius & Architecture Drift Check
[Impact on other components and whether `docs/architecture.md` needs updating]
```

### Step 6: Next Steps

Tell the user:
*"BUG-NNN has been diagnosed, reproduced with a regression test, and fixed. To run a formal code/security review on this fix, ask me to review BUG-NNN with `sdlc-review`."*

## Rules

- Always isolate the root cause before modifying production code
- Always write a failing reproduction test before applying the fix
- Keep the fix minimal and scoped strictly to the defect
- Run project linters and test suites before completing
- Never swallow exceptions or add silent null checks that mask deeper data corruption

