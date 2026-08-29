---
name: sdlc-architect
description: >-
  Use this skill when the user wants to design or redesign system architecture for a project or feature.
  Triggers on phrases like "design architecture", "create architecture", "system design",
  "component design", "API contracts", or "data model design".
  Runs Agent 3 (Architect) to produce a system design document.
---

# SDLC Architecture Design — Create System Design

Run the Architect agent to produce a system design document with component map, API contracts, data models, ADRs, and risk flags.

## Prerequisites

One of the following must be available as input:
- `docs/user-stories.md` (output from `sdlc-stories` or Phase 2 of `sdlc-plan`)
- A feature description or architectural requirements provided directly by the user

If designing for an existing project, `docs/architecture.md` may already exist — the agent will extend or refine it rather than replacing it entirely.

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/03-architect.md`](../../prompts/03-architect.md) before proceeding.

### Step 2: Gather Input

1. If `docs/user-stories.md` exists, read it as primary input
2. If `docs/architecture.md` already exists, read it as additional context for extending the design
3. If the user provides a feature description or requirements directly, use that as input
4. Identify if the user has requested a specific architecture flavor (e.g., `style=enterprise-ddd` or `style=rapid-prototype`) in their prompt.

### Step 3: Design Architecture

**Role**: You are an Architect. Your input is user stories. Your output is a system design document.

**Process**:
1. Read the agent instructions from the prompts file
2. Produce all output sections specified by the agent instructions:
   - Component map
   - API contracts
   - Data models
   - NFR mapping
   - Risk flags
   - Architecture Decision Records (ADRs)
3. Enforce all design principles from the agent instructions
4. **Linter Mandate**: Explicitly prescribe the static analysis tools (e.g., Ruff, ESLint) that must be used for the chosen technology stack, enforcing exact quantitative rules.
5. **Architecture Flavors**: If the user specified a `style` parameter:
   - For `enterprise-ddd`: Enforce strict Domain/Service Layer isolation, Explicit Dependency Injection, and rigid type safety.
   - For `rapid-prototype`: Relax constraints for speed and framework-idiomatic patterns.

### Step 4: Output

Write the complete output to `docs/architecture.md`

Present a brief summary to the user: number of components, key technology choices, number of ADRs, risk flags raised.

### Step 5: Next Steps

Tell the user:
*"Architecture design is complete. If your project has a UI, you can now create design specs by asking me to design UI. Otherwise, you can plan tasks by asking me to plan tasks, or run the full planning pipeline with sdlc-plan."*

## Rules

- Trace every user story to at least one component
- Justify every technology choice
- Write one ADR per non-obvious decision
- Flag all risks explicitly — never bury them
- Define failure modes for every component
- If a story is [NEEDS CLARIFICATION], state the assumption made and flag it
- Do not write implementation code or SQL — output is design only
- Do not define task order or sprint plan — that is the Task Planner's job
- Do not gold-plate — only design what the stories require; note optional enhancements separately
- Do not write any implementation code — this skill produces planning documents only
