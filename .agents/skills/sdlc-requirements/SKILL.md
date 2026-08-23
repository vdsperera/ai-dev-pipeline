---
name: sdlc-requirements
description: >-
  Use this skill when the user wants to analyse and refine requirements for a project or feature.
  Triggers on phrases like "analyse requirements", "refine requirements", "create requirements",
  "requirements analysis", or "find gaps in requirements".
  Runs Agent 1 (Requirements Analyst) to detect gaps, ambiguities, and produce a refined requirements document.
---

# SDLC Requirements Analysis — Refine Requirements

Run the Requirements Analyst agent to analyse raw or existing requirements, detect issues, and produce a refined requirements document.

## Prerequisites

One of the following must be available as input:
- `docs/product-brief.md` (output from `sdlc-strategy` or Phase 0 of `sdlc-plan`)
- Raw requirements, brief, or feature description provided directly by the user

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/01-requirements-analyst.md`](../../prompts/01-requirements-analyst.md) before proceeding.

### Step 2: Gather Input

1. If `docs/product-brief.md` exists, read it as primary input
2. If the user provides raw requirements or a feature description directly, use that as input
3. If both exist, use the product brief as the base and incorporate the user's additional input

### Step 3: Analyse Requirements

**Role**: You are a Requirements Analyst. Analyse the input and produce a refined requirements document.

**Process**:
1. Read the agent instructions from the prompts file
2. Apply the interrogation checklist to every requirement
3. Detect gaps, ambiguities, conflicts, hidden assumptions, and missing constraints
4. Produce the issues list and refined requirements document in the format specified by the agent instructions

### Step 4: Output

Write the complete output to `docs/requirements.md`

Present a brief summary to the user: number of issues found, number of `[NEEDS CLARIFICATION]` items, and key requirements identified.

### Step 5: Next Steps

Tell the user:
*"Requirements analysis is complete. You can now generate user stories by asking me to write user stories, or run the full planning pipeline with sdlc-plan."*

## Rules

- Flag every vague word — never silently interpret it
- Suggest a concrete rewrite for every issue, not just a question
- State assumptions explicitly before refining — never silently adopt them
- Do not add features or scope not implied by the input
- Do not resolve conflicts yourself — surface them and ask
- Do not produce user stories, architecture, or tasks — output is requirements only
- Do not write any implementation code — this skill produces planning documents only
