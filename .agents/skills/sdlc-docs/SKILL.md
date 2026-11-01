---
name: sdlc-docs
description: >-
  Use this skill when the user wants to generate or update documentation for a
  completed task. Triggers on phrases like "document TASK-NNN", "generate docs",
  "update README", "write API docs", or "generate changelog". Runs the Documentation
  Agent (Agent 14) to produce API docs, README updates, changelog entries, and
  staleness reports.
---

# SDLC Documentation — Generate & Review Docs

Generate and review documentation for a task. Can be run after implementation, after review, or after testing — documentation is valuable at any stage.

## Prerequisites

- The task must be implemented (code files exist)
- `docs/tasks.md` and `docs/architecture.md` must exist
- Existing documentation files (README, API docs, etc.) will be read for staleness checking

## Workflow

### Step 1: Gather Context

1. Read the task definition from `docs/tasks.md`
2. Read the architecture document from `docs/architecture.md`
3. Read all implementation code and test files for this task
4. Read the handoff note from `docs/handoffs/TASK-NNN.md` if it exists
5. Read existing documentation:
   - `README.md`
   - `CHANGELOG.md` (if exists)
   - `docs/api/` (if exists)
   - `docs/components/` (if exists)
   - Any other markdown files in `docs/`
6. Check git log for recent changes to understand what changed

### Step 2: Determine What to Document

**Read the full agent instructions** from [`prompts/14-documentation-agent.md`](../../prompts/14-documentation-agent.md).

**Role**: You are now a Documentation Agent.

Based on the task and code changes, determine what documentation is needed:

| Code change | Documentation action |
|-------------|---------------------|
| New API endpoint | Generate API documentation in `docs/api/` |
| New component/module | Generate component documentation in `docs/components/` |
| Changed setup steps or prerequisites | Update `README.md` |
| Any completed task | Add changelog entry to `CHANGELOG.md` |
| New environment variable | Update README configuration section |
| Architecture decision revealed during implementation | Append ADR to `docs/architecture.md` |
| Contract, data model, or component boundary changed (Architecture Drift) | Sync and update `docs/architecture.md` sections to match actual code |

### Step 3: Generate Documentation

For each documentation item identified:
1. Generate the content following the standards in the agent instructions
2. Use realistic examples — not `"foo"`, `"bar"`, `123`
3. Document error responses with the same thoroughness as success responses
4. Reference architecture decisions rather than restating them

### Step 4: Staleness & Architecture Drift Check

Run the staleness detection checklist from the agent instructions against all existing documentation:

1. Compare API docs against actual routes in code
2. Compare README setup instructions against actual dependencies and configuration
3. Compare documented function signatures against actual signatures
4. Verify environment variables in docs match what code reads
5. Check that architecture diagrams reflect current component structure
6. **Architecture Drift Sync**: Check `docs/handoffs/TASK-NNN.md` (`Architecture drift check`) and compare `docs/architecture.md` against actual implemented routes, schemas, and components — automatically update `docs/architecture.md` if any contract or model drifted during implementation

Produce findings for any staleness detected.

### Step 5: Produce Report

Write the documentation report to `docs/documentation/TASK-NNN-docs.md`:

```markdown
# Documentation Report — TASK-NNN

## Documentation generated
[List of files created or updated]

## Changelog entry
[The changelog entry added]

## Staleness findings
[DOC-NNN findings from staleness check]

## Verdict
[Complete | Gaps found | Stale]
```

### Step 6: Next Steps

Based on the verdict:
- **Complete**: Tell the user *"Documentation for TASK-NNN is complete. All docs are up to date."*
- **Gaps found**: Tell the user which documentation is missing or inaccurate
- **Stale**: Tell the user *"Significant documentation staleness detected. Consider a documentation audit across the following areas: [list]"*

## Rules

- Generate actual documentation content — not descriptions of what should be written
- Every API endpoint must be documented — undocumented endpoints are findings
- Changelog entries describe user-visible changes — not implementation details
- README instructions must be copy-pasteable and produce a working state
- Detect staleness actively — compare docs against code, do not assume docs are current
- Do not invent functionality — document only what the code actually does
- Do not generate placeholder content — every section must contain real, accurate information
- Do not duplicate the architecture document — reference it instead
- If the task has no documentation impact (e.g., internal refactor with no API changes), say so and skip
