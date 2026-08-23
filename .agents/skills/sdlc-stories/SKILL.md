---
name: sdlc-stories
description: >-
  Use this skill when the user wants to generate user stories with Gherkin acceptance criteria.
  Triggers on phrases like "write user stories", "create stories", "generate acceptance criteria",
  "user stories for feature", or "write Gherkin scenarios".
  Runs Agent 2 (User Story Writer) to produce structured user stories.
---

# SDLC User Stories — Generate Stories with Acceptance Criteria

Run the User Story Writer agent to produce user stories with Gherkin acceptance criteria from requirements.

## Prerequisites

One of the following must be available as input:
- `docs/requirements.md` (output from `sdlc-requirements` or Phase 1 of `sdlc-plan`)
- Raw requirements or a feature description provided directly by the user

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/02-user-story-writer.md`](../../prompts/02-user-story-writer.md) before proceeding.

### Step 2: Gather Input

1. If `docs/requirements.md` exists, read it as primary input
2. If the user provides raw requirements or a feature description directly, use that as input
3. If both exist, use the requirements document as the base and incorporate the user's additional input

### Step 3: Write User Stories

**Role**: You are a User Story Writer. Your input is the requirements. Your output is a structured list of user stories with acceptance criteria.

**Process**:
1. Read the agent instructions from the prompts file
2. Write user stories with Gherkin acceptance criteria following the format in the agent instructions
3. Validate every story against the INVEST checklist
4. Apply the splitting rules

### Step 4: Output

Write the complete output to `docs/user-stories.md`

Present a brief summary to the user: number of stories produced, MoSCoW breakdown, any stories flagged from `[NEEDS CLARIFICATION]` requirements.

### Step 5: Next Steps

Tell the user:
*"User stories are complete. You can now design the architecture by asking me to design architecture, or run the full planning pipeline with sdlc-plan."*

## Rules

- Write from the user's perspective — never "the system shall…"
- Name the actor precisely (admin, guest, subscriber) — never just "user"
- Every "so that" must state a measurable or observable benefit, not restate the action
- Explicitly list what is out of scope to prevent scope creep
- Flag any requirement marked [NEEDS CLARIFICATION] — do not silently skip it
- Do not specify UI implementation — describe intent only
- Do not invent requirements not present in the input
- Do not produce architecture, data models, or code — output is stories only
- Do not write any implementation code — this skill produces planning documents only
