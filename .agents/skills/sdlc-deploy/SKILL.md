---
name: sdlc-deploy
description: >-
  Use this skill when the user wants to generate or review deployment artifacts
  for a completed task. Triggers on phrases like "deploy TASK-NNN", "review deployment",
  "generate Dockerfile", "create CI/CD", or "deployment review". Runs the DevOps Agent
  (Agent 13) to produce Dockerfiles, CI/CD pipelines, IaC templates, and deployment configs.
---

# SDLC Deploy — DevOps Review & Artifact Generation

Generate and review deployment artifacts for a task that has passed code review and testing.

## Prerequisites

- The task should be implemented (code files exist)
- `docs/tasks.md`, `docs/user-stories.md`, and `docs/architecture.md` must exist
- Ideally the task has passed code review and testing, but deployment artifacts can be generated earlier if the architecture is clear

## Workflow

### Step 1: Gather Context

1. Read the task definition from `docs/tasks.md`
2. Read the architecture document from `docs/architecture.md` — focus on:
   - Component map (what needs to be deployed)
   - NFR targets (scaling, availability, latency)
   - Deployment strategy (if specified)
   - Infrastructure requirements (databases, queues, caches)
3. Read the implementation code to understand runtime dependencies
4. Scan for existing deployment files: `Dockerfile`, `.dockerignore`, `.github/workflows/`, `terraform/`, `docker-compose.yml`, or equivalent
5. Read the handoff note from `docs/handoffs/TASK-NNN.md` if it exists

### Step 2: Determine What to Produce

Based on the context, determine which artifacts are needed:

| Condition | Artifact to produce |
|-----------|-------------------|
| New deployable service, no Dockerfile exists | Generate `Dockerfile` + `.dockerignore` |
| No CI/CD pipeline exists | Generate `.github/workflows/ci.yml` |
| CI/CD exists but task changes build/test/deploy steps | Update CI/CD pipeline |
| Architecture specifies new infrastructure | Generate IaC template |
| Architecture specifies deployment strategy not yet configured | Generate deployment config |
| Existing deployment files, no new artifacts needed | Review existing files only |

### Step 3: Generate Artifacts

**Read the full agent instructions** from [`prompts/13-devops-agent.md`](../../prompts/13-devops-agent.md).

**Role**: You are now a DevOps Agent. Generate the deployment artifacts identified in Step 2.

For each artifact:
1. Generate the file following the standards in the agent instructions
2. Explain what each section does and why
3. Call out any configuration that must be customised per environment

### Step 4: Review Deployment Readiness

Whether generating new artifacts or reviewing existing ones, run the full review:

1. **Dockerfile review** — multi-stage build, non-root user, pinned versions, no secrets, health check
2. **CI/CD review** — pinned action versions, secrets from GitHub Secrets, quality gates, fail-fast ordering
3. **IaC review** — least privilege IAM, encryption at rest/transit, multi-AZ, auto-scaling bounds
4. **Configuration review** — 12-factor compliance, secrets at runtime, environment separation
5. **Rollback plan** — documented rollback path for every deployment

Produce findings using the format from the agent instructions.

### Step 5: Produce Handoff

Write the deployment review report to `docs/deploy/TASK-NNN-deploy.md`:

```markdown
# Deployment Review — TASK-NNN

## Artifacts generated
[List of files created or modified]

## Deployment prerequisites
[What must be in place before deploying: secrets, infrastructure, DNS, etc.]

## Deployment steps
[Ordered steps to deploy this change]

## Rollback plan
[How to roll back if deployment fails]

## Findings
[All DO-NNN findings from the review]

## Verdict
[Approved | Rework | Escalate]
```

### Step 6: Next Steps

Based on the verdict:
- **Approved**: Tell the user *"Deployment artifacts for TASK-NNN are ready. Review the deployment steps in the report."*
- **Rework**: Tell the user what to fix and ask them to re-request deployment review
- **Escalate**: Tell the user what infrastructure decision is needed

## Rules

- Generate working files — Dockerfiles and YAML must be syntactically valid
- Never hardcode secrets in any generated file — always use runtime injection
- Every service must have a health check — no exceptions
- Every deployment must have a documented rollback path
- Do not provision real infrastructure — generate files only
- Do not deploy anything — provide instructions for the user or CI/CD to execute
- Do not make architecture decisions — if deployment strategy is unspecified, flag and stop
- If no deployment artifacts are needed for a task (e.g., pure library code), say so and skip
