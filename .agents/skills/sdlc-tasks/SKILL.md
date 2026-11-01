---
name: sdlc-tasks
description: >-
  Use this skill when the user wants to generate or regenerate a task backlog from existing
  architecture and user stories. Triggers on phrases like "plan tasks", "create task backlog",
  "break down tasks", "generate tasks", or "task planning".
  Runs Agent 5 (Task Planner) to produce an ordered atomic task list with dependencies.
---

# SDLC Task Planning — Generate Task Backlog

Run the Task Planner agent to produce an ordered atomic task list with dependency graph and coverage matrix from architecture and user stories.

## Prerequisites

The following documents should be available as input:
- `docs/architecture.md` (output from `sdlc-architect` or Phase 3 of `sdlc-plan`)
- `docs/user-stories.md` (output from `sdlc-stories` or Phase 2 of `sdlc-plan`)
- `docs/design-specs.md` (optional — output from `sdlc-ux` or Phase 3.5 of `sdlc-plan`)

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/05-task-planner.md`](../../prompts/05-task-planner.md) before proceeding.

### Step 2: Gather Input

1. Read `docs/architecture.md` and `docs/user-stories.md` as primary input
2. If `docs/design-specs.md` exists, read it as additional input — UI tasks should reference design specs
3. If any required input documents are missing, ask the user for equivalent context before proceeding

### Step 3: Plan Tasks

**Role**: You are a Task Planner. Your input is the architecture document and user stories. Your output is an ordered atomic task list a Developer agent can execute one task at a time.

**Process**:
1. Read the agent instructions from the prompts file
2. Produce the ordered atomic task list following the layer sequence:
   - Infrastructure → Data models & migrations → API contracts & interfaces → Business logic & services → UI & integration → Hardening & observability
3. **Project & Toolchain Bootstrap (`TASK-001`)**: If the repository does not yet have its project skeleton, test runner, or static analysis/linter configurations initialized, always generate `TASK-001` in the `Infrastructure` layer as **"Project & Toolchain Bootstrap"** to initialize the exact linters, type-checkers, and test harness prescribed in `docs/architecture.md`.
4. Verify traceability: every story and every component must appear in at least one task
5. Produce the coverage matrix

### Step 4: Output

Write the complete output to `docs/tasks.md`

Present a brief summary to the user: total task count, layer breakdown, critical path, estimated effort distribution.

### Step 5: Next Steps

Tell the user:
*"Task backlog is complete. You can now start implementing tasks by asking me to implement TASK-NNN."*

## Rules

- Write acceptance conditions in objective pass/fail language — no "works correctly"
- Make inputs and outputs concrete and specific
- Label blocked tasks with BLOCKED and the blocking task ID
- Identify and label the critical path
- Note parallelisable task groups
- Do not write implementation code, SQL, or configuration
- Do not assign tasks to people — output is ordering and structure only
- Do not invent tasks not traceable to a story or architecture component
- Do not write any implementation code — this skill produces planning documents only
