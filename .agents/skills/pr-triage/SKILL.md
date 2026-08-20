---
name: pr-triage
description: >-
  Use this skill when the user has a large pull request that needs to be broken
  into reviewable segments before running a PR review. Triggers on phrases like
  "triage this PR", "this PR is too large", "segment this PR", or "break down
  this PR for review". Runs Agent 12 (Large PR Triage) to produce a structured
  review plan with segments and cross-cutting concerns.
---

# Large PR Triage — Agent 12

Analyse a large pull request and produce a structured review plan with segments, risk ratings, and cross-cutting concerns. This skill does NOT review the code — it prepares a plan for the `pr-review` skill to execute.

## Prerequisites

The user must provide one of:
- A PR number and repo name
- A pasted diff or file list
- A branch name to diff against main

A PR is "large" if it:
- Spans more than 20 files, OR
- Touches more than one architectural layer, OR
- Cannot be fully reviewed in a single focused session

If the PR does not meet this threshold, tell the user to skip triage and go directly to the `pr-review` skill.

## Workflow

**Read the full agent instructions** from [`prompts/12-large-pr-triage.md`](../../prompts/12-large-pr-triage.md).

### Step 1: Identify PR Shape

Classify the PR into one primary shape:
- **Migration** — porting between technologies/frameworks
- **Greenfield** — new service/module with no prior equivalent
- **Large feature** — significant new capability in an existing system
- **Mass refactor** — restructuring without behaviour change
- **Dependency upgrade** — major version bump with cascading changes
- **Data model change** — schema restructuring rippling into multiple layers

### Step 2: Map PR Topology

Build a map of what changed:
- File count and distribution across layers
- Entry point of the change
- Layers touched (Data / API / Logic / Infra / Config / Tests)
- Shared utilities affected
- Deleted or renamed files

### Step 3: Segment the PR

Group related files into named review segments (10–30 files each):

```
Segment N — [Name]
Risk: HIGH | MEDIUM | LOW
Files: [count] — key representative files
Dependency: Review after Segment X | No dependency
Review focus: What the reviewer must pay attention to
Context needed: What the reviewer must understand first
```

### Step 4: Identify Cross-Cutting Concerns

Flag issues that span multiple segments:
```
Cross-cutting: [Name]
Spans: Segment N, Segment M
Concern: What to verify across all affected segments
```

Check for: auth enforcement, error handling patterns, logging consistency, naming conventions, test coverage, backward compatibility, secrets/config consistency.

### Step 5: Produce Review Order

Order segments with rationale:
1. Dependencies before dependents
2. HIGH risk before MEDIUM before LOW
3. Data model/schema changes always first
4. Infrastructure/config last
5. Cross-cutting review always final

### Step 6: Handoff

Write the complete triage report and tell the user:
*"Triage is complete. To review each segment, invoke the PR review skill and reference this triage report. Start with Segment 1."*

## Rules

- Do not review code — triage only
- Do not approve or reject — that is the PR review skill's job
- Do not skip topology mapping
- Segment by concern, not by folder
- Cross-cutting review is mandatory — never omit it
- State assumptions explicitly
- If a segment is still too large, split it further
