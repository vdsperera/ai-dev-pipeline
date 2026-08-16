---
name: sdlc-plan
description: >-
  Use this skill when the user wants to plan a new project or feature from scratch.
  Triggers on phrases like "plan my project", "start a new project", "create requirements",
  "plan this feature", or "run the planning pipeline". Chains five agents in sequence:
  Product Strategist → Requirements Analyst → User Story Writer → Architect → Task Planner. Each agent's
  output is written to docs/ and fed into the next agent.
---

# SDLC Planning Pipeline

Run five planning agents in sequence to go from a raw idea to an actionable task backlog.

## Prerequisites

The user must provide a raw idea, brief, or requirements description as input. This can be anything from a one-sentence idea to a detailed brief.

## Workflow

Execute these four phases **in strict order**. After each phase, write the output to the specified file, then **pause at the checkpoint** before proceeding. Do NOT skip phases or run them out of order.

### How checkpoints work

After each phase, present a brief summary and ask the user:
*"Phase N complete. Review the output above. You can give feedback to refine, or say 'continue' to proceed to the next phase."*

- If the user says **"continue"**, **"looks good"**, **"next"**, or similar — proceed to the next phase immediately
- If the user provides **feedback or corrections** — incorporate them, update the output file, and present the revised summary before proceeding
- This lets the user control the pace: say "continue" five times for a fast run, or pause and refine at any stage

---

### Phase 0: Product Strategy

**Read the full agent instructions** from [`prompts/00-product-strategist.md`](../../prompts/00-product-strategist.md) before starting this phase.

**Role**: You are a Product Strategist. Interrogate the user's raw idea from a business perspective to define the MVP scope and identify risks before any technical planning begins.

**Process**:
1. Read the agent instructions from the prompts file
2. Work through the 6-step interrogation checklist based on the user's input (Problem & audience, Value proposition, Business model, MVP scope, Risks & assumptions, Recommendation)
3. Produce the structured Product Brief in the format specified by the agent instructions

**Output**: Write the complete output to `docs/product-brief.md`

**⏸️ Checkpoint 0**: Present a brief summary: the defined MVP scope, identified business model, and key risks. Ask the user to review, give feedback, or continue.

---

### Phase 1: Requirements Analysis

**Read the full agent instructions** from [`prompts/01-requirements-analyst.md`](../../prompts/01-requirements-analyst.md) before starting this phase.

**Role**: You are a Requirements Analyst. Analyse the product brief produced in Phase 0 and produce a refined requirements document.

**Process**:
1. Read the agent instructions from the prompts file
2. Read `docs/product-brief.md` as your input
3. Apply the interrogation checklist to every requirement
4. Detect gaps, ambiguities, conflicts, hidden assumptions, and missing constraints
4. Produce the issues list and refined requirements document in the format specified by the agent instructions

**Output**: Write the complete output to `docs/requirements.md`

**⏸️ Checkpoint 1**: Present a brief summary: number of issues found, number of `[NEEDS CLARIFICATION]` items, and key requirements identified. Then ask the user to review, give feedback, or continue.

---

### Phase 2: User Story Writing

**Read the full agent instructions** from [`prompts/02-user-story-writer.md`](../../prompts/02-user-story-writer.md) before starting this phase.

**Role**: You are now a User Story Writer. Your input is the refined requirements document you just wrote.

**Process**:
1. Read the agent instructions from the prompts file
2. Read `docs/requirements.md` as your input
3. Write user stories with Gherkin acceptance criteria following the format in the agent instructions
4. Validate every story against the INVEST checklist
5. Apply the splitting rules

**Output**: Write the complete output to `docs/user-stories.md`

**⏸️ Checkpoint 2**: Present a brief summary: number of stories produced, MoSCoW breakdown, any stories flagged from `[NEEDS CLARIFICATION]` requirements. Then ask the user to review, give feedback, or continue.

---

### Phase 3: Architecture Design

**Read the full agent instructions** from [`prompts/03-architect.md`](../../prompts/03-architect.md) before starting this phase.

**Role**: You are now an Architect. Your input is the user stories.

**Process**:
1. Read the agent instructions from the prompts file
2. Read `docs/user-stories.md` as your input
3. Produce all output sections specified by the agent instructions: component map, API contracts, data models, NFR mapping, risk flags, and ADRs
4. Enforce all design principles from the agent instructions

**Output**: Write the complete output to `docs/architecture.md`

**⏸️ Checkpoint 3**: Present a brief summary: number of components, key technology choices, number of ADRs, risk flags raised. Then ask the user to review, give feedback, or continue.

---

### Phase 4: Task Planning

**Read the full agent instructions** from [`prompts/04-task-planner.md`](../../prompts/04-task-planner.md) before starting this phase.

**Role**: You are now a Task Planner. Your input is the architecture document and user stories.

**Process**:
1. Read the agent instructions from the prompts file
2. Read `docs/architecture.md` and `docs/user-stories.md` as your input
3. Produce the ordered atomic task list following the layer sequence (Infrastructure → Data → APIs → Logic → UI → Hardening)
4. Verify traceability: every story and every component must appear in at least one task
5. Produce the coverage matrix

**Output**: Write the complete output to `docs/tasks.md`

---

## Final Presentation

After all five phases complete, present a summary to the user:

1. **Product Strategy**: MVP scope defined, key risks identified, go/no-go recommendation
2. **Requirements**: Number of issues found, number of items needing clarification
3. **User Stories**: Number of stories produced, MoSCoW breakdown
4. **Architecture**: Number of components, key technology choices, number of ADRs, number of risk flags
5. **Tasks**: Total task count, layer breakdown, critical path, estimated effort distribution

Tell the user: *"Your planning pipeline is complete. All outputs are in the `docs/` directory. You can now start implementing tasks by asking me to implement a specific TASK-NNN."*

## Rules

- Execute phases in strict order — never skip or reorder
- Write each output to its file before starting the next phase
- Read the full agent instructions file before each phase — do not rely on memory
- Each phase uses ONLY its designated input — do not leak context between personas
- If a phase produces `[NEEDS CLARIFICATION]` items, surface them but proceed with stated assumptions
- Do not write any implementation code — this skill produces planning documents only
