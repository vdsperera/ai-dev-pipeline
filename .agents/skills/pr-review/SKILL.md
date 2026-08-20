---
name: pr-review
description: >-
  Use this skill when the user wants to review a pull request at the merge gate.
  Triggers on phrases like "review this PR", "review PR #NNN", "PR review",
  or "review this diff". Runs the three-layer PR Reviewer (Agent 11) to produce
  mechanical findings, engineering questions, and system flags with a verdict.
---

# PR Review — Agent 11

Review a pull request across three layers of depth: mechanical review, engineering reasoning, and system/product judgment.

## Prerequisites

The user must provide one of:
- A PR number and repo name (if a Git MCP server is connected)
- A pasted diff (from GitHub Files Changed tab or `git diff main...feature-branch`)
- A description of which files to review (agent will read them from the workspace)

## Workflow

### Step 1: Identify the PR Content

**Read the full agent instructions** from [`prompts/11-pr-reviewer.md`](../../prompts/11-pr-reviewer.md).

Determine how to get the PR content:
- **From workspace**: If the user points to files or a branch, use `git diff` to generate the diff
- **From paste**: If the user pasted a diff, use that directly
- **From MCP**: If a GitHub/GitLab MCP server is connected and a PR number is given, fetch the PR data

### Step 2: Classify PR Size

| Size | Lines changed | Components touched | Layer 2 | Layer 3 |
|------|--------------|-------------------|---------|---------| 
| S | < 50 | 1 | Spot check | Skip unless obvious |
| M | 50–200 | 1–2 | Full pass | Flag if architecture touched |
| L | 200–500 | 2–4 | Full pass | Full pass |
| XL | 500+ | 4+ | Full pass + flag for split | Full pass |

If XL: flag that the PR should be split, but proceed with review. Suggest using the `pr-triage` skill first.

### Step 3: Layer 1 — Mechanical Review

Check every item aggressively:
- Correctness mechanics (off-by-one, floating promises, dead branches)
- Error & exception handling (silent swallowing, leaked internals)
- Input validation (external inputs validated at entry)
- Security smells (injection vectors, hardcoded secrets, auth gaps)
- Code hygiene (unused code, debug statements, TODOs without task IDs)

Finding format:
```
[L1] Severity: Blocker | Major | Minor | Nit
Category: Correctness | Error handling | Validation | Security | Hygiene
Location: file, line
Problem: what is wrong
Fix: concrete action to take
```

### Step 4: Layer 2 — Engineering Reasoning

Assess whether the PR introduces concerns in:
- Retry & resilience (idempotent retries, backoff, circuit breakers)
- Concurrency & state (race conditions, shared mutable state)
- Caching (invalidation, stale data, TTL)
- Data & storage (query count, indexing, pagination)
- API & contracts (backward compatibility, versioning)
- Timeouts (set on outbound calls, graceful degradation)

Finding format:
```
[L2] Type: Risk | Question | Assumption
Area: Retries | Concurrency | Caching | Data | API contract | Timeout
Location: file, line (or component)
Observation: what was noticed
Concern: what could go wrong
Ask / Verify: specific question to resolve
```

### Step 5: Layer 3 — System & Product Judgment

Only raise if the change touches architecture, data models, or cross-service contracts:
- Architecture sustainability (copyable patterns, tight coupling)
- Scale (10× load behaviour)
- Blast radius (failure scope, rollback path)
- Operational safety (business-hours deploy, migration type, monitoring)
- Business alignment (business flow correctness, technical debt)

Finding format:
```
[L3] Type: Escalate | Flag
Area: Architecture | Scale | Blast radius | Operations | Business alignment
Summary: one-sentence description
Impact: what could go wrong and at what scope
Recommendation: escalate to architect / raise in planning / add runbook item
```

### Step 6: Verdict

Issue exactly one verdict:

| Verdict | Meaning |
|---------|---------|
| **Approved** | No L1 blockers; L2 risks documented; L3 concerns logged |
| **Approved with comments** | Minor/Nit findings only; may merge but should address |
| **Request changes** | L1 blockers or unresolved L2 risks |
| **Escalate** | L3 concern requires architectural decision before merge |

Present the full review report to the user.

## Segmented Review Mode (for Large PRs)

If the user provides a triage report from the `pr-triage` skill (Agent 12), follow the segmented review protocol described in the agent instructions:
1. Review one segment at a time
2. Scope strictly to files in each segment
3. Log out-of-scope issues for other segments
4. Run cross-cutting sweep after all segments
5. Issue a single final verdict for the whole PR

## Rules

- Work all three layers — do not skip Layer 2 or 3 because Layer 1 looks clean
- Use AI aggressively for Layer 1 — do not manually hunt mechanical issues
- Every Layer 1 finding has a concrete fix
- Layer 2 findings are questions or risks — not always blockers
- Layer 3 findings are escalations — not code comments
- Do not rewrite code — direct the author to fix
- Do not block on nits
- Praise good patterns — note what to repeat and why
