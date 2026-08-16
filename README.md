# AI Dev Pipeline

A structured AI-assisted development pipeline that covers the full SDLC — from a raw idea to PR review. Built as **Antigravity IDE skills** so the entire workflow runs natively inside your editor.

## How it works

The pipeline has **13 specialised agent personas** packaged as 8 skills and 1 always-on rule. Instead of copy-pasting between separate AI chat windows, you invoke skills by name and the agent chains through the SDLC phases automatically.

```
Your idea
    ↓ "plan my project: [idea]"
requirements.md → user-stories.md → architecture.md → tasks.md
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
│       ├── sdlc-plan/SKILL.md          # Planning chain (Agents 1→2→3→4)
│       ├── sdlc-develop/SKILL.md       # Task implementation (Agent 5)
│       ├── sdlc-review/SKILL.md        # Code + Security + UX review (Agents 6→7→13)
│       ├── sdlc-test/SKILL.md          # Test generation (Agent 8)
│       ├── sdlc-deploy/SKILL.md        # DevOps review & artifacts (Agent 11)
│       ├── sdlc-docs/SKILL.md          # Documentation generation (Agent 12)
│       ├── pr-review/SKILL.md          # PR review at merge gate (Agent 9)
│       └── pr-triage/SKILL.md          # Large PR triage (Agent 10)
├── prompts/                            # Source of truth for all agent instructions
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

The `sdlc-plan` skill chains four agents automatically:

| Step | Agent | Input | Output |
|------|-------|-------|--------|
| 1 | Requirements Analyst | Your raw idea | `docs/requirements.md` |
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

## Agent personas

| # | Agent | Real-world role | Prompt |
|---|-------|----------------|--------|
| 1 | Requirements Analyst | Business Analyst | `prompts/01-requirements-analyst.md` |
| 2 | User Story Writer | BA / Product Owner | `prompts/02-user-story-writer.md` |
| 3 | Architect | Solution Architect | `prompts/03-architect.md` |
| 4 | Task Planner | Tech Lead | `prompts/04-task-planner.md` |
| 5 | Developer | Software Developer | `prompts/05-developer.md` |
| 6 | Code Reviewer | Senior Developer | `prompts/06-code-reviewer.md` |
| 7 | Security Reviewer | Security Engineer | `prompts/07-security-reviewer.md` |
| 8 | Test Generator | QA / SDET | `prompts/08-test-generator.md` |
| 9 | PR Reviewer | Senior Developer (merge gate) | `prompts/09-pr-reviewer.md` |
| 10 | Large PR Triage | Tech Lead (PR triage) | `prompts/10-large-pr-triage.md` |
| 11 | DevOps Agent | DevOps / SRE | `prompts/11-devops-agent.md` |
| 12 | Documentation Agent | Technical Writer | `prompts/12-documentation-agent.md` |
| 13 | UX & Accessibility Reviewer | UX Engineer | `prompts/13-ux-accessibility-reviewer.md` |

## Skills reference

| Skill | Trigger phrases | What it does |
|-------|----------------|--------------|
| `sdlc-plan` | "plan my project", "start new project", "create requirements" | Chains Agents 1→2→3→4, writes all docs |
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

## Using as a project template

This repo is designed to be a **reusable template**. To use it for a new project:

1. Copy the `.agents/` and `prompts/` directories into your new project
2. Clear the `docs/` directory (or start fresh)
3. Open in Antigravity and say: "plan my project: [your idea]"

The skills, rules, and prompts travel with the project. No external configuration needed.

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
