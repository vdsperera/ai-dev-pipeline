---
name: sdlc-review
description: >-
  Use this skill when the user wants to review code for a completed task.
  Triggers on phrases like "review TASK-NNN", "code review TASK-NNN",
  "check TASK-NNN", or "review the code". Chains the Code Reviewer (Agent 7),
  optionally the Security Reviewer (Agent 8), and optionally the UX &
  Accessibility Reviewer (Agent 9) on the implemented code.
---

# SDLC Review — Code Review, Security Review & UX Review

Review implemented code for a task through up to three review layers: Code Review (Agent 7), Security Review (Agent 8) when applicable, and UX & Accessibility Review (Agent 9) when applicable.

## Prerequisites

- The task must be implemented (code files exist)
- `docs/handoffs/TASK-NNN.md` should exist with the developer's handoff note
- `docs/tasks.md`, `docs/user-stories.md`, and `docs/architecture.md` must exist

## Workflow

### Step 1: Gather Context

1. Identify the task being reviewed (from user input or most recent handoff)
2. Read the handoff note from `docs/handoffs/TASK-NNN.md`
3. Read the task definition from `docs/tasks.md`
4. Read the linked user stories from `docs/user-stories.md`
5. Identify all files created or modified for this task (from the handoff note and git status)
6. Read all the implementation code and test files

### Step 2: Code Review (Agent 7)

**Read the full agent instructions** from [`prompts/07-code-reviewer.md`](../../prompts/07-code-reviewer.md).

**Role**: You are now a Code Reviewer. Review the implementation against the task definition, linked stories, and coding standards.

Run all eight review categories from the agent instructions:
1. Correctness — acceptance condition met, all Gherkin scenarios handled
2. Error handling — all I/O wrapped, errors typed and logged
3. Input validation — all external input validated at entry points
4. Security — no injection vectors, no leaked secrets, auth at function level
5. Edge cases & boundary conditions — nulls, empties, concurrent access, partial failure
6. Retries & resilience — idempotent retries, backoff, circuit breakers
7. Test quality — coverage of happy/failure/edge, independence, minimal mocks
8. Scope discipline — no unrequested additions, no TODOs without task IDs

**Produce findings** using the format from the agent instructions:
```
ID: CR-NNN
Severity: Blocker | Major | Minor | Nit | Praise
Category: [one of the 8 categories]
Location: file, line number, function name
Problem: what is wrong and why it matters
Risk: what can go wrong in production if unfixed
Fix: concrete, actionable description of what to change
```

**Issue a verdict**:

| Verdict | Action |
|---------|--------|
| **Approved** | Proceed to Security Review (if applicable) or Test Generation |
| **Rework** | Stop. Present all findings. Tell the user to fix blockers and re-request review |
| **Escalate** | Stop. Present the architectural concern. Tell the user this needs design discussion |

Write the review report to `docs/reviews/TASK-NNN-code-review.md`.

**If verdict is Rework or Escalate** — stop here. Present the findings and tell the user what to fix. Do not proceed to Security Review.

### Step 3: Security Review (Agent 8) — Conditional

**Only run this step if the code touches any of**:
- Authentication or authorization logic
- Payment or financial data processing
- PII (personally identifiable information) handling
- Cryptographic operations
- External API integrations that handle sensitive data
- File uploads or user-supplied file paths

If none of these apply, skip to Step 4.

**Read the full agent instructions** from [`prompts/08-security-reviewer.md`](../../prompts/08-security-reviewer.md).

**Role**: You are now a Security Reviewer. Your input is the code, task definition, architecture, and the Code Review approved report.

Run the complete OWASP Top 10 checklist from the agent instructions. Also check:
- AI-specific attack surface patterns
- Data & compliance checks
- Dependency security

**Produce findings** using the format from the agent instructions:
```
ID: SEC-NNN
Severity: Critical | High | Medium | Low | Info
OWASP category: A0N:2021 — name
CWE: CWE-NNN — name
Location: file, line, function name
Attack vector: how an attacker exploits this
Impact: what the attacker gains
Exploitability: authentication required? complexity?
Fix: concrete remediation
Verification: how to confirm the fix works
```

**Issue a verdict**:

| Verdict | Action |
|---------|--------|
| **Cleared** | Proceed to Test Generation |
| **Remediate** | Stop. Present findings. Critical/High must be fixed before proceeding |
| **Escalate to human** | Stop. Security decision needed beyond code level |

Write the security review report to `docs/reviews/TASK-NNN-security-review.md`.

**If verdict is Remediate or Escalate** — stop here. Present the findings.

### Step 3.5: UX & Accessibility Review (Agent 9) — Conditional

**Only run this step if the code touches any of**:
- UI components, templates, or views
- CSS, SCSS, or styling files
- Client-side routing or navigation
- Form handling or user input components
- Media rendering (images, video, audio)

If none of these apply, skip to Step 4.

**Read the full agent instructions** from [`prompts/09-ux-accessibility-reviewer.md`](../../prompts/09-ux-accessibility-reviewer.md).

**Role**: You are now a UX & Accessibility Reviewer. Your input is the UI code, task definition, linked user stories, and the architecture document.

Run the complete WCAG 2.1 AA checklist from the agent instructions. Also check:
- Responsive design across breakpoints (mobile, tablet, desktop, wide)
- All five user flow states (empty, loading, error, success, partial)
- Design consistency (spacing, typography, colour palette)
- Internationalisation readiness

**Produce findings** using the format from the agent instructions:
```
ID: UX-NNN
Severity: Blocker | Major | Minor | Suggestion | Praise
Category: Accessibility | Responsive | Consistency | User flow | i18n | Performance
Location: file, line, component name
Problem: what is wrong and what user impact it has
Affected users: who is impacted
Fix: concrete remediation
WCAG criterion: (if applicable)
```

**Issue a verdict**:

| Verdict | Action |
|---------|--------|
| **Cleared** | Proceed to Test Generation |
| **Rework** | Stop. Present findings. WCAG AA blockers and missing user flow states must be fixed before proceeding |
| **Escalate** | Stop. Design decision needed — component pattern, interaction model, or layout approach requires discussion |

Write the UX review report to `docs/reviews/TASK-NNN-ux-review.md`.

**If verdict is Rework or Escalate** — stop here. Present the findings.

### Step 4: Next Steps

If all applicable reviews pass (Approved/Cleared), tell the user:
*"TASK-NNN has passed code review [and security review] [and UX review]. To generate the test suite, ask me to test TASK-NNN."*

## Rules

- Check the acceptance condition first — unmet condition is always a Blocker
- Every finding includes a concrete fix, not just problem identification
- Praise good patterns explicitly — note what to repeat
- Separate facts from opinions — label preferences as preferences
- Review the code as written, not the code you would have written
- Do not rewrite the code — direct the developer (user) to fix
- Do not block on nits — nits are logged, not blockers
- Critical security findings always require human acknowledgment — do not self-approve
- Security review is a hard gate, not advisory — do not skip under time pressure
- UX review runs only when UI code is touched — do not force it on backend-only tasks
- WCAG AA blockers are hard gates — accessibility is not optional
