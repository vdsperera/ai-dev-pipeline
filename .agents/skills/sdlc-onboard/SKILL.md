---
name: sdlc-onboard
description: >-
  Use this skill when bringing the AI Dev Pipeline into an existing ("brownfield")
  codebase that does not yet have docs/architecture.md. Triggers on phrases like
  "onboard this repo", "reverse engineer architecture", "scan existing codebase",
  "initialize pipeline for existing project", or "sdlc-onboard". Runs Agent 15
  (Codebase Onboarder) to generate docs/architecture.md from existing code.
---

# SDLC Onboard — Reverse-Engineer Existing Codebase

Run the Codebase Onboarder agent (Agent 15) to scan an existing repository and generate a baseline `docs/architecture.md` so all downstream SDLC skills (`sdlc-architect`, `sdlc-tasks`, `sdlc-develop`, `sdlc-review`) have accurate system context.

## Prerequisites

- An existing codebase with source files and dependency manifests
- If `docs/architecture.md` already exists, ask the user whether to refresh/update it against current code or overwrite it

## Workflow

### Step 1: Load Agent Instructions

**Read the full agent instructions** from [`prompts/15-codebase-onboarder.md`](../../prompts/15-codebase-onboarder.md) before proceeding.

### Step 2: Scan Repository Structure

1. List top-level directories and configuration files (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, linter configs, CI files)
2. Identify the source directories, entry points, route controllers, domain services, data models/migrations, and test suites
3. Read key architectural files (entry points, routers, schema/model definitions, configuration loaders, middleware)

### Step 3: Generate Baseline Architecture

**Role**: You are a Codebase Onboarder (Agent 15). Your input is the existing repository. Your output is `docs/architecture.md`.

**Process**:
1. Produce all output sections specified in [`prompts/15-codebase-onboarder.md`](../../prompts/15-codebase-onboarder.md):
   - System overview & tech stack (including configured or missing linters)
   - Component map (with exact directory/file paths)
   - API contracts
   - Data models
   - Risk flags & technical debt baseline
   - Baseline ADRs
2. Ensure every component and contract links to actual files in the repository

### Step 4: Output

Write the complete output to `docs/architecture.md`.

Present a concise summary to the user:
- Detected tech stack & linters
- Number of components and API endpoints mapped
- Key risk flags / tech debt items discovered

### Step 5: Next Steps

Tell the user:
*"Codebase onboarding is complete and `docs/architecture.md` has been generated. You can now plan new features (`sdlc-plan` or `sdlc-stories`), break down tasks (`sdlc-tasks`), or debug issues (`sdlc-debug`)."*

## Rules

- Document the architecture as it actually exists in code — never invent non-existent modules
- Include exact file/directory paths for every mapped component
- Flag missing linters or static analysis configs explicitly in the Risk Flags section
- Do not modify any source code files during onboarding

