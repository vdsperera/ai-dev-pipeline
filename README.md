# AI Dev Pipeline

A structured AI-assisted development pipeline that covers the full SDLC — from a raw idea to PR review. Built as **Antigravity IDE skills** so the entire workflow runs natively inside your editor.

## How it works

The pipeline has **14 specialised agent personas** packaged as 8 skills and 1 always-on rule. Instead of copy-pasting between separate AI chat windows, you invoke skills by name and the agent chains through the SDLC phases automatically.

```
Your idea
    ↓ "plan my project: [idea]"
product-brief.md → requirements.md → user-stories.md → architecture.md → tasks.md
    ↓ "implement TASK-001"
Code + unit tests + handoff note
    ↓ "review TASK-001"
Code review → Security review (if applicable) → UX review (if applicable)
    ↓ "test TASK-001"
Full test suite + coverage matrix → task marked done
    ↓ "deploy TASK-001" (optional)
Dockerfile + CI/CD + deployment review
    ↓ "document TASK-001" (optional)
API docs + README update + changelog
    ↓ repeat for next task
```

## Folder structure

```
.
├── .agents/                            # Antigravity customization root
│   ├── AGENTS.md                       # Always-on coding standards (Agent 5)
│   └── skills/
│       ├── sdlc-plan/SKILL.md          # Planning chain (Agents 0→1→2→3→4)
│       ├── sdlc-develop/SKILL.md       # Task implementation (Agent 5)
│       ├── sdlc-review/SKILL.md        # Code + Security + UX review (Agents 6→7→13)
│       ├── sdlc-test/SKILL.md          # Test generation (Agent 8)
│       ├── sdlc-deploy/SKILL.md        # DevOps review & artifacts (Agent 11)
│       ├── sdlc-docs/SKILL.md          # Documentation generation (Agent 12)
│       ├── pr-review/SKILL.md          # PR review at merge gate (Agent 9)
│       └── pr-triage/SKILL.md          # Large PR triage (Agent 10)
├── prompts/                            # Source of truth for all agent instructions
│   ├── 00-product-strategist.md       # Business thinking, MVP scope
│   ├── 01-requirements-analyst.md
│   ├── 02-user-story-writer.md
│   ├── 03-architect.md
│   ├── 04-task-planner.md
│   ├── 05-developer.md
│   ├── 06-code-reviewer.md            # Includes Data & Schema review
│   ├── 07-security-reviewer.md        # Includes Regulatory Compliance
│   ├── 08-test-generator.md           # Enhanced performance testing
│   ├── 09-pr-reviewer.md
│   ├── 10-large-pr-triage.md
│   ├── 11-devops-agent.md             # Dockerfile, CI/CD, IaC
│   ├── 12-documentation-agent.md      # API docs, README, changelog
│   └── 13-ux-accessibility-reviewer.md # WCAG 2.1 AA, responsive, UX
└── docs/                               # Living project documents (pipeline outputs)
    ├── product-brief.md                 # Agent 0 output
    ├── requirements.md                  # Agent 1 output
    ├── user-stories.md                  # Agent 2 output
    ├── architecture.md                  # Agent 3 output
    ├── tasks.md                         # Agent 4 output — your task backlog
    ├── handoffs/                        # Agent 5 handoff notes per task
    ├── reviews/                         # Agent 6+7+13 review reports per task
    ├── test-reports/                    # Agent 8 test reports per task
    ├── deploy/                          # Agent 11 deployment reports per task
    └── documentation/                   # Agent 12 documentation reports per task
```

---

## Setup

### Antigravity IDE (recommended)

1. Copy this entire folder into your project root (or clone it)
2. Open the project in Antigravity IDE
3. The `.agents/` directory is discovered automatically — skills appear immediately
4. Start a conversation and say: `"plan my project: [your idea]"`

That's it. No Claude.ai Projects to configure, no API keys, no separate tools.

### Antigravity CLI (`agy`)

Works the same way — the `.agents/` directory is discovered automatically when you run `agy` from the project root.

---

## Workflow

### Phase 1: Planning (run once per project/feature)

Say: **"plan my project: [your idea or requirements]"**

The `sdlc-plan` skill chains five agents automatically:

| Step | Agent | Input | Output |
|------|-------|-------|--------|
| 0 | Product Strategist | Your raw idea | `docs/product-brief.md` |
| 1 | Requirements Analyst | Product brief | `docs/requirements.md` |
| 2 | User Story Writer | Requirements | `docs/user-stories.md` |
| 3 | Architect | User stories | `docs/architecture.md` |
| 4 | Task Planner | Architecture + stories | `docs/tasks.md` |

After the chain completes, you review the full plan and approve or refine.

### Phase 2: Per-task development loop (repeat per task)

```
1. "implement TASK-NNN"     → sdlc-develop skill writes code + tests + handoff
2. "review TASK-NNN"        → sdlc-review skill runs code review (+ security + UX if needed)
3. Fix any review findings   → re-run "review TASK-NNN"
4. "test TASK-NNN"          → sdlc-test skill generates test suite + marks task done
5. "deploy TASK-NNN"        → sdlc-deploy skill generates deployment artifacts (optional)
6. "document TASK-NNN"      → sdlc-docs skill generates/updates documentation (optional)
7. Pick next task            → repeat
```

### Merge gate (before merging PRs)

| Situation | What to say |
|-----------|-------------|
| Normal PR | "review this PR" or "review PR #47" |
| Large PR (20+ files) | "triage this PR" first, then "review segment 1", "review segment 2", etc. |

---

## The Complete Software Team (Agent personas)

The 14 agents map directly to a cross-functional real-world software team, covering every phase of the SDLC.

### 1. Product & Strategy
| # | Agent | Real-world role | Prompt |
|---|-------|----------------|--------|
| 0 | Product Strategist | Product Manager | `prompts/00-product-strategist.md` |
| 1 | Requirements Analyst | Business Analyst | `prompts/01-requirements-analyst.md` |
| 2 | User Story Writer | BA / Product Owner | `prompts/02-user-story-writer.md` |

### 2. Engineering Leadership & Architecture
| # | Agent | Real-world role | Prompt |
|---|-------|----------------|--------|
| 3 | Architect | Solution Architect | `prompts/03-architect.md` |
| 4 | Task Planner | Tech Lead | `prompts/04-task-planner.md` |

### 3. Core Development
| # | Agent | Real-world role | Prompt |
|---|-------|----------------|--------|
| 5 | Developer | Software Developer | `prompts/05-developer.md` |

### 4. Quality & Review (The Gatekeepers)
| # | Agent | Real-world role | Prompt |
|---|-------|----------------|--------|
| 6 | Code Reviewer | Senior Developer | `prompts/06-code-reviewer.md` |
| 7 | Security Reviewer | Security Engineer | `prompts/07-security-reviewer.md` |
| 13| UX & Accessibility Reviewer | UX Engineer | `prompts/13-ux-accessibility-reviewer.md` |
| 8 | Test Generator | QA / SDET | `prompts/08-test-generator.md` |

### 5. Release & Operations
| # | Agent | Real-world role | Prompt |
|---|-------|----------------|--------|
| 9 | PR Reviewer | Senior Developer (merge gate) | `prompts/09-pr-reviewer.md` |
| 10| Large PR Triage | Tech Lead (PR triage) | `prompts/10-large-pr-triage.md` |
| 11| DevOps Agent | DevOps / SRE | `prompts/11-devops-agent.md` |
| 12| Documentation Agent | Technical Writer | `prompts/12-documentation-agent.md` |

## Skills reference

| Skill | Trigger phrases | What it does |
|-------|----------------|--------------|
| `sdlc-plan` | "plan my project", "start new project", "create requirements" | Chains Agents 0→1→2→3→4, writes all docs |
| `sdlc-develop` | "implement TASK-NNN", "build TASK-NNN" | Implements one task with self-review checklist |
| `sdlc-review` | "review TASK-NNN", "code review TASK-NNN" | Code review + conditional security review + conditional UX review |
| `sdlc-test` | "test TASK-NNN", "generate tests" | Full test suite + coverage matrix |
| `sdlc-deploy` | "deploy TASK-NNN", "generate Dockerfile", "create CI/CD" | Deployment artifacts + review |
| `sdlc-docs` | "document TASK-NNN", "generate docs", "update README" | API docs, README, changelog |
| `pr-review` | "review this PR", "review PR #47" | Three-layer PR review with verdict |
| `pr-triage` | "triage this PR", "this PR is too large" | Segments large PRs for reviewable chunks |

---

## Always-on rules

The coding standards from Agent 5 (Developer) are installed as `AGENTS.md` — they apply to **every** coding interaction in the workspace, not just when pipeline skills are active. This covers:

- Naming & readability conventions
- Error handling requirements
- Input validation standards
- Retry & resilience patterns
- Security practices
- Logging & observability standards
- Data & schema standards
- Unit test requirements

---

## Usage guide

### Scenario A: Brand new project (start from zero)

You have an idea but no code yet. Run the full pipeline from the beginning.

**Step 1 — Set up the pipeline**
```
# Option 1: Clone this repo and start fresh
git clone https://github.com/vdsperera/ai-dev-pipeline.git my-new-project
cd my-new-project
rm -rf docs/*

# Option 2: Copy into an empty project
mkdir my-new-project && cd my-new-project
git init
# Copy .agents/ and prompts/ from this repo into your project
```

**Step 2 — Plan your project**

Open the project in Antigravity IDE and say:

> "plan my project: I want to build a REST API for a task management app with user authentication, team workspaces, and real-time notifications"

The planning pipeline runs five agents in sequence:
1. **Product Strategist** → defines MVP scope, business model, and risk in `docs/product-brief.md`
2. **Requirements Analyst** → analyses your idea, finds gaps, writes `docs/requirements.md`
3. **User Story Writer** → creates user stories with Gherkin acceptance criteria in `docs/user-stories.md`
4. **Architect** → designs components, APIs, data models in `docs/architecture.md`
5. **Task Planner** → breaks everything into ordered atomic tasks in `docs/tasks.md`

Each phase pauses for your review. Say "continue" to proceed or give feedback to refine.

**Step 3 — Build task by task**

Once planning is complete, work through tasks in order:

```
"implement TASK-001"     → Agent writes code + unit tests + handoff note
"review TASK-001"        → Code review (+ security + UX review if applicable)
"test TASK-001"          → Full test suite generated, task marked done
"deploy TASK-001"        → Dockerfile + CI/CD generated (when ready to deploy)
"document TASK-001"      → API docs + README updated (when ready to document)

"implement TASK-002"     → next task...
```

**Step 4 — Merge and repeat**

When you're ready to merge a feature branch:
```
"review this PR"         → Three-layer PR review at the merge gate
```

---

### Scenario B: Existing project (adopt the pipeline into an already-built codebase)

You have a working project and want to add the pipeline for future development.

**Step 1 — Copy the pipeline files**
```
# Copy .agents/ and prompts/ into your existing project root
# Do NOT copy docs/ — you'll generate fresh docs for your codebase
```

**Step 2 — Generate baseline docs from your existing code**

You don't need to re-plan your whole project. Instead, generate documentation for what already exists:

> "document my existing project — scan the codebase and generate docs/architecture.md with the current component map, API contracts, and data models"

This gives the pipeline context about your existing system. You can also manually create or refine:
- `docs/architecture.md` — describe your current system design
- `docs/requirements.md` — document your current requirements (even briefly)

**Step 3 — Plan only new work**

When you need to add a feature, plan just that feature:

> "plan this feature: add real-time notifications using WebSocket for the existing task management API"

The planning agents will read your existing `docs/architecture.md` and plan the new feature within your existing system — they won't try to redesign what's already built.

**Step 4 — Use the development loop normally**

From here, the workflow is the same: implement → review → test → deploy → docs.

**Step 5 — Retroactive reviews (optional)**

You can run reviews on existing code without the full planning cycle:

> "review this PR" — for code about to be merged
> "review the code in src/auth/" — for an existing directory you want audited

---

### Scenario C: New feature on an existing project

You already have the pipeline adopted and want to add a new feature.

**Option 1 — Full planning (recommended for large features)**

> "plan this feature: add a billing module with Stripe integration, subscription management, and invoice generation"

This runs the full planning chain but scoped to the new feature. It reads your existing `docs/architecture.md` and designs the feature to fit within your existing system.

**Option 2 — Lightweight planning (for small features)**

Skip formal planning and go straight to implementation with a clear description:

> "implement this: add a GET /api/users/:id/activity endpoint that returns the last 50 activity events for a user, following our existing API patterns in src/routes/"

The Developer Agent (Agent 5) will follow the coding standards even without formal planning docs. Then review and test as normal.

**Which to choose?**

| Feature size | Approach |
|-------------|----------|
| Touches 1-2 files, simple logic | Option 2 — implement directly |
| Touches 3+ files, new API endpoints | Option 1 — plan first |
| New component, new data models | Option 1 — definitely plan first |
| New integration (payment, email, etc.) | Option 1 — plan first, security review will trigger |

---

### Scenario D: Bug fix or small change

Not every change needs the full pipeline. Here's how to handle lightweight work.

**Simple bug fix**
```
"fix this bug: the /api/tasks endpoint returns 500 when the user has no tasks. 
It should return an empty array with 200."
```
The coding standards from `AGENTS.md` apply automatically — error handling, input validation, and test quality are enforced even without invoking any skill.

**Quick refactor**
```
"refactor the authentication middleware to use the new token validation library. 
Don't change any behaviour, just swap the implementation."
```

**When to add reviews**

| Change type | Review? | Test? | Deploy? | Docs? |
|-------------|---------|-------|---------|-------|
| One-line bug fix | Skip | Skip | Skip | Skip |
| Bug fix touching auth/payments | Review ✅ | Optional | Skip | Skip |
| Refactor (no behaviour change) | Optional | Test ✅ (verify no regression) | Skip | Skip |
| Config/env change | Skip | Skip | Deploy ✅ | Docs ✅ |
| New API endpoint | Review ✅ | Test ✅ | Deploy ✅ | Docs ✅ |

---

### Scenario E: Team workflow

When multiple developers use the pipeline on the same project.

**Branch strategy**
```
main
├── feature/TASK-001-user-auth      ← one branch per task
├── feature/TASK-002-database-setup
└── feature/TASK-003-api-endpoints
```

**Per-developer workflow**
1. Pick a task from `docs/tasks.md`
2. Create a feature branch
3. Run: `"implement TASK-NNN"` → `"review TASK-NNN"` → `"test TASK-NNN"`
4. Push and create a PR
5. Run: `"review this PR"` (or have another team member trigger it)
6. Merge

**Keeping docs/ in sync**
- `docs/` lives in version control — it's the shared source of truth
- Each task updates its own files: `docs/handoffs/TASK-NNN.md`, `docs/reviews/TASK-NNN-*.md`
- `docs/tasks.md` is updated when a task is marked done — merge conflicts here are expected and easy to resolve
- `docs/architecture.md` should only be changed through the planning pipeline or explicit architecture discussions — not by individual task implementations

**PR review workflow**
```
Developer pushes PR
    ↓
Reviewer (human or AI) says: "review this PR" or "review PR #47"
    ↓
PR Review agent runs three layers:
  Layer 1: Mechanical checks (bugs, security, hygiene)
  Layer 2: Engineering reasoning (concurrency, resilience, caching)
  Layer 3: System judgment (architecture, scale, blast radius)
    ↓
Verdict: Approved / Approved with comments / Request changes / Escalate
    ↓
Large PRs (20+ files): "triage this PR" first to split into reviewable segments
```

**Parallel task execution**
- Tasks declare dependencies in `docs/tasks.md` — respect the `Depends on` field
- Independent tasks can be worked in parallel by different developers
- The pipeline prevents implementing a task whose dependencies aren't done

---

### Quick reference: what to say for each scenario

| I want to... | Say this |
|-------------|---------|
| Start a new project | "plan my project: [your idea]" |
| Add the pipeline to existing code | Copy `.agents/` + `prompts/`, then "document my existing project" |
| Plan a new feature | "plan this feature: [feature description]" |
| Implement a task | "implement TASK-NNN" |
| Review code | "review TASK-NNN" |
| Generate tests | "test TASK-NNN" |
| Generate deployment artifacts | "deploy TASK-NNN" |
| Generate documentation | "document TASK-NNN" |
| Review a PR | "review this PR" or "review PR #NNN" |
| Triage a large PR | "triage this PR" |
| Fix a bug | Just describe the bug — coding standards apply automatically |

---

## Updating prompts

Prompts are the source of truth — skills reference them. To update agent behaviour:

1. Edit the relevant file in `prompts/`
2. Commit the change: `improve: tighten input validation rules in developer agent`
3. The skills will read the updated prompt on the next invocation — no other changes needed

---

## Tips

- **One task per conversation** — don't pile multiple tasks into one conversation
- **Review the plan before implementing** — the planning chain pauses for your approval
- **Security review is automatic** — it triggers when code touches auth, payments, or PII
- **UX review is automatic** — it triggers when code touches UI components or styling
- **Deploy and docs are optional** — run them when deployment artifacts or documentation updates are needed
- **The review agents are optional for simple tasks** — skip them for trivial changes
- **Keep docs/ in version control** — they provide context for future development
- **Prompts are the source of truth** — edit `prompts/` to change agent behaviour; skills reference them automatically
- **Start light, add rigour as needed** — for a quick fix, just describe it; for a large feature, run the full pipeline
