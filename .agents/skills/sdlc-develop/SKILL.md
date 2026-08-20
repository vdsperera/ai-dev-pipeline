---
name: sdlc-develop
description: >-
  Use this skill when the user wants to implement a specific task from the backlog.
  Triggers on phrases like "implement TASK-NNN", "develop TASK-NNN", "build TASK-NNN",
  "work on TASK-NNN", or "start task NNN". Reads the task definition, linked stories,
  and architecture, then implements the code following Agent 6 (Developer) standards.
---

# SDLC Developer — Implement a Task

Implement a single atomic task from the backlog following Developer Agent (Agent 5) standards.

## Prerequisites

- `docs/tasks.md` must exist with the task backlog
- `docs/user-stories.md` must exist with linked user stories
- `docs/architecture.md` must exist with the system design
- The user must specify which TASK-NNN to implement

## Workflow

### Step 1: Gather Context

1. Read `docs/tasks.md` and locate the specified task
2. Read the task's linked user stories from `docs/user-stories.md`
3. Read the task's linked component from `docs/architecture.md`
4. Check the task's dependencies — verify all `Depends on` tasks are marked done

If any dependency is not marked done, **stop and tell the user** which tasks must be completed first.

### Step 2: Validate Input

**Read the full agent instructions** from [`prompts/06-developer.md`](../../prompts/06-developer.md).

Check the input contract:
- Is the task definition complete (all required fields present)?
- Is there any ambiguity or contradiction with the architecture?
- Are the acceptance conditions clear and testable?

If anything is incomplete, ambiguous, or contradictory, produce a **BLOCKER REPORT**:
```
BLOCKER REPORT
Task: TASK-NNN
Issue: [what is missing or contradictory]
Needed: [what is needed to unblock]
```

Do NOT proceed past a blocker. Present the report to the user and wait for resolution.

### Step 3: Implement

Following the coding standards from the developer agent instructions:

1. Create or modify the files needed for this task
2. Implement exactly the task scope — nothing more, nothing less
3. Follow all naming, error handling, validation, security, and logging standards
4. Write unit tests alongside the implementation:
   - Happy path
   - At least one failure path
   - At least one boundary/edge case
5. Tests must be runnable and independent

### Step 4: Self-Review Checklist

Run this checklist before completing. Every item must pass:

- [ ] Every external call has error handling
- [ ] Every external input is validated before use
- [ ] No secret, credential, or PII in logs or error messages
- [ ] No hardcoded secrets or magic values
- [ ] All retryable operations use backoff with a termination condition
- [ ] Auth enforced at function level, not only at route
- [ ] Unit tests cover happy path, failure path, and one edge case
- [ ] Acceptance condition from the task is verifiably met
- [ ] No logic added beyond the task scope
- [ ] Handoff note written

### Step 5: Produce Handoff

Create a handoff note summarising what was built. Present it to the user and write it to `docs/handoffs/TASK-NNN.md`:

```markdown
# Handoff — TASK-NNN

## What was built
[Summary of implementation]

## Files changed
[List of files created or modified]

## Reviewer focus areas
[What the reviewer should pay attention to]

## Open questions
[Any unresolved items or assumptions made]

## Self-review result
[Checklist results — all passed or specific items to note]
```

### Step 6: Next Steps

Tell the user:
*"TASK-NNN is implemented. To run the review cycle, ask me to review TASK-NNN."*

## Rules

- Implement exactly the task scope — nothing more, nothing less
- If ambiguous, stop and produce a blocker report — do not guess
- If architecture and task conflict, flag it — do not silently pick one
- Write code as if the next reader is a senior engineer doing a security audit
- Leave the codebase cleaner than you found it — fix obvious issues in files you touch
- Do not refactor beyond task scope — log it as a separate task suggestion
- Do not make architecture decisions — flag and stop if the design is insufficient
- Do not skip the self-review checklist
