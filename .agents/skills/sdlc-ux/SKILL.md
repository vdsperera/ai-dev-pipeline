---
name: sdlc-ux
description: >-
  Use this skill when the user wants to create or update UI/UX design specifications for a project or feature.
  Triggers on phrases like "design UI", "create design specs", "UX design", "design system",
  "component specs", "page layouts", or "user flow design".
  Runs Agent 4 (UI/UX Designer) to produce design specifications.
---

# SDLC UI/UX Design — Create Design Specifications

Run the UI/UX Designer agent to produce design specifications including design system tokens, page layouts, component specs, user flow maps, and navigation structure.

## Prerequisites

The following documents should be available as input:
- `docs/architecture.md` (output from `sdlc-architect` or Phase 3 of `sdlc-plan`)
- `docs/user-stories.md` (output from `sdlc-stories` or Phase 2 of `sdlc-plan`)
- `docs/requirements.md` (output from `sdlc-requirements` or Phase 1 of `sdlc-plan`)

If any of these are missing, the user can provide equivalent context directly (e.g., a feature description, wireframe notes, or existing design guidelines).

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/04-ux-designer.md`](../../prompts/04-ux-designer.md) before proceeding.

### Step 2: Gather Input

1. Read `docs/architecture.md`, `docs/user-stories.md`, and `docs/requirements.md` as input
2. If `docs/design-specs.md` already exists, read it as additional context for extending or refining the design
3. If any input documents are missing, ask the user for the equivalent context before proceeding

### Step 3: Create Design Specifications

**Role**: You are a UI/UX Designer. Your input is the architecture document, user stories, and requirements. You produce a design specification that gives the Developer concrete UI guidance.

**Process**:
1. Read the agent instructions from the prompts file
2. Define the design system (colours, typography, spacing, radii, shadows, breakpoints)
3. Specify page layouts for every view in the architecture
4. Define component specifications with all interactive states
5. Map user flows end-to-end for each UI-related user story
6. Define the navigation structure

### Step 4: Output

Write the complete output to `docs/design-specs.md`

Present a brief summary to the user: design system overview, number of pages specified, number of components defined, number of user flows mapped.

### Step 5: Next Steps

Tell the user:
*"Design specifications are complete. You can now plan tasks by asking me to plan tasks, or run the full planning pipeline with sdlc-plan."*

## Rules

- Trace every page back to at least one user story
- Trace every component back to at least one page
- Every user flow must map to a user story ID
- Define all component states — no component without at least default, hover, focus, disabled, and empty states
- Specify responsive behaviour for every page and component — not just desktop
- Include accessibility notes for every page and component — role, label, keyboard interaction
- Use design system tokens exclusively — no inline colour values, arbitrary spacing, or ad-hoc font sizes
- Do not write implementation code (HTML, CSS, JSX) — output is specification only
- Do not contradict architecture decisions — work within the defined component boundaries
- Do not define API contracts or data models — those are the Architect's domain
- Do not define task order — that is the Task Planner's job
- Keep specifications actionable — a Developer should be able to implement each spec without design ambiguity
