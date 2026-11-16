---
name: sdlc-retro
description: >-
  Use this skill when the user wants to understand, audit, or prepare to explain the
  architecture and system design of an existing project or feature. Triggers on phrases
  like "explain architecture decisions", "architectural retro", "audit design choices",
  "why was this built this way", "what could break", or "sdlc-retro". Runs Agent 17
  (Architectural Retrospective) to produce a 5-dimension system design deep dive.
---

# SDLC Retro — Architectural Retrospective & System Design Deep-Dive

Run the Architectural Retrospective agent (Agent 17) to audit an existing codebase, analyze the 5 core design decisions and trade-offs, identify break points, evaluate 100x scalability, and prepare elevator pitches for technical reviews and interviews.

## Prerequisites

- An existing codebase or implemented feature with source code and manifests
- If `docs/architecture.md` exists, read it for baseline context; if not, discover architecture directly from code

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/17-architectural-retro.md`](../../prompts/17-architectural-retro.md) before proceeding.

### Step 2: Scan Codebase & Map Architecture

1. Inspect configuration files, dependency manifests, and entry points
2. Identify core state management, database schemas, and inter-service communication
3. Trace critical request/data paths through domain services and storage layers

### Step 3: Conduct the 5-Dimension Retrospective

**Role**: You are an Architectural Retrospective & Socratic Reviewer (Agent 17).

**Process**:
Produce all 5 sections specified in [`prompts/17-architectural-retro.md`](../../prompts/17-architectural-retro.md):
1. **The 5 Core Architectural Decisions** (What was chosen, why, alternatives rejected, and trade-offs accepted)
2. **Failure Mode Analysis** (Top 3 break points, trigger conditions, blast radiuses, and resilience fixes)
3. **Reversibility Matrix** (One-way doors vs. two-way doors)
4. **100x Scale Stress Test** (First bottleneck to saturate and required architectural shift)
5. **Review & Elevator Pitch Cheat Sheet** (60s casual pitch + Senior review defense using the C-A-T framework)

### Step 4: Write Output & Present Summary

1. Write the complete retrospective to `docs/architecture-retro.md`.
2. Present a crisp, high-signal summary to the user:
   - The top 3 trade-offs accepted
   - The #1 component most likely to break under load
   - The 60-second review elevator pitch

### Step 5: Next Steps

Tell the user:
*"Architectural retrospective is complete and saved to `docs/architecture-retro.md`. You can use the talking points to explain the design in reviews, or plan architectural enhancements using `sdlc-plan` or `sdlc-tasks`."*

## Rules

- Base all analysis on real code and configuration present in the repository — cite actual file paths
- Do not gloss over architectural risks, tight coupling, or single points of failure
- Do not modify application source code during retrospective

