# Frequently Asked Questions (FAQ) & Architectural Philosophy

This document addresses common questions from senior software engineers, tech leads, and architects exploring the design philosophy, real-world trade-offs, and industry positioning of `ai-dev-pipeline`.

---

## 1. Why has this file-based governance pattern become practical only recently?

The software engineering principles behind `ai-dev-pipeline` (Architecture Decision Records, behavior-driven acceptance criteria, strict linter gates, and blameless post-mortem learning) are not new. Enterprise software engineering teams have practiced and refined them for decades.

What has changed is model capability and practical delivery:

### A. Context Window Evolution
Early LLMs in 2022–2023 were constrained by 4,000–8,000 token context windows.
* It was practically impossible to pass an architectural design contract (`docs/architecture.md`), task backlog, anti-pattern registry, and full source code files to the model simultaneously without exhausting memory or causing severe hallucinations.
* The arrival of reliable models with 128k to 1M+ token context windows (Claude 3.5 Sonnet, Gemini 1.5/2.0, GPT-4o) finally makes it practical to maintain an entire project's architectural context in active memory alongside code.

### B. Industry Focus: Closed SaaS vs. Open Local Governance
The commercial AI wave initially prioritized proprietary subscription products:
* Most commercial startups focused on building closed IDE forks to sell \$20/month seat licenses, or autonomous cloud VMs billing by compute hours.
* Meanwhile, big tech firms developed internal compliance harnesses welded to their proprietary monorepos (e.g., Google Piper and Critique).
* `ai-dev-pipeline` takes those battle-tested enterprise governance habits and packages them as an open-source, zero-dependency local harness that runs directly inside everyday developer editors.

---

## 2. How does this compare to BMAD and Multi-Agent Debate frameworks?

In academic research and early agent experiments, frameworks like **BMAD** (Benchmark for Multi-Agent Debate) explored having multiple LLMs argue with each other until reaching consensus.

While conceptually intriguing, probabilistic multi-agent debates suffer from major practical issues in real-world engineering:

| Dimension | Multi-Agent Debate (e.g. BMAD / ChatDev) | AI Dev Pipeline |
|---|---|---|
| **Mechanism** | **Probabilistic Debate**: Agents argue back-and-forth in a loop to find consensus. | **Deterministic Contracts & Quality Gates**: Architecture docs (`docs/architecture.md`), zero-linter tolerance, and deterministic evals. |
| **Token Cost & Latency** | **Extremely High**: Looping conversational debates burn tokens rapidly and risk unbounded loops. | **Predictable & Targeted**: Agents execute sequentially or on-demand at specific SDLC gates. |
| **Runtime Environment** | Often standalone Python scripts or research sandboxes. | **IDE-Native**: Runs natively inside Antigravity, Cursor, Claude Code, and Copilot via Markdown and zero-dependency Node CLI. |
| **Long-Term Memory** | Resets when the debate conversation ends. | **Persistent Memory Registry** (`docs/anti-patterns.md`) that accumulates permanent lessons across project history. |
| **Verification** | Agents grade each other's opinions. | Objective evaluation harness (`ai-dev-pipeline eval`) scoring static analysis, boundary violations, and anti-pattern compliance. |

---

## 3. Why not just use a single `.cursorrules` or `CLAUDE.md` file?

A single `.cursorrules` or `CLAUDE.md` file is great for shallow preferences (e.g., "Use TypeScript", "Use tabs, not spaces"), but it quickly breaks down on serious codebases:

1. **Context Window Dilution**: Jamming architecture rules, testing conventions, database schemas, UI specs, and security checklists into one file pollutes the LLM prompt with irrelevant rules during simple edits.
2. **No Role Separation**: A developer prompt requires different mental constraints than an architectural review or security audit. Single rule files treat every task identically.
3. **No Phase Gates**: A single rules file cannot enforce that a feature must have an architectural contract before implementation, or that reproduction tests must precede bug fixes.
4. **No Reverse-Engineering Workflow**: A static rule file cannot inspect an existing brownfield repository and reverse-engineer its component boundaries into visual Mermaid diagrams.

`ai-dev-pipeline` keeps baseline hygiene always-on (`AGENTS.md`) while loading deep role-specific capabilities on-demand (`.agents/skills/`).

---

## 4. Does this slow down my development?

**In the first 30 minutes? Slightly.**
Instead of immediately generating 500 lines of unverified code with a single keystroke, you spend 5 minutes reviewing requirements (`sdlc-requirements`), verifying the architectural boundary (`sdlc-architect`), and checking acceptance criteria (`sdlc-stories`).

**Over the next 3 weeks? It is dramatically faster.**
* Without governance, unverified AI code rapidly produces subtle bugs, silent regressions, broken edge cases, and architectural drift that takes senior engineers days or weeks to untangle.
* With `ai-dev-pipeline`, every change is anchored against a living architecture document, protected by typed error handling and zero-linter gates, and verified against anti-pattern memory.

It is the exact same trade-off as **automated testing and CI/CD**: spending 5 minutes on tests saves 5 days of production debugging.

---

## 5. Can I use this on existing ("brownfield") codebases?

**Yes.** `ai-dev-pipeline` is specifically designed for real-world existing codebases:

1. Run `npx @kadvsperera/ai-dev-pipeline init` inside your project root.
2. Invoke the **Codebase Onboarder** (`sdlc-onboard` / Agent 15):
   * Scans your directory structure, package manifests, routes, and data access layers.
   * Generates a living `docs/architecture.md` with visual Mermaid diagrams reverse-engineered from your actual code.
3. Use `sdlc-debug` (Agent 16) for bug investigations, ensuring failing reproduction tests are written before any code is modified.
4. As bugs or AI mistakes are identified, document them in `docs/anti-patterns.md` so the AI never repeats them.

---

## 6. What are the honest downsides, costs, and trade-offs?

No engineering framework is a silver bullet. Choosing `ai-dev-pipeline` introduces five real trade-offs that teams must weigh:

### A. Higher Token Consumption & API Cost
In raw "vibe coding", you send a one-sentence prompt and the AI generates code in a single API call.  
In `ai-dev-pipeline`, the AI loads `AGENTS.md`, reads `docs/architecture.md`, inspects `docs/anti-patterns.md`, and validates against task specifications. In chained planning workflows (`sdlc-plan`), 6 agents execute sequentially.  
* **The Cost**: You will consume **3x to 5x more tokens** per feature. If you pay for LLM APIs out-of-pocket, your token bill will be higher than with unguided prompts.

### B. "Process Fatigue" on Trivial Edits
Sometimes you just want to tweak a CSS button padding, rename an internal variable, or write a 5-line throwaway script.  
* **The Cost**: Forcing tiny edits through a full SDLC pipeline (task IDs, acceptance criteria, eval scoring) is bureaucratic overhead. Developers must exercise judgment and bypass the pipeline for trivial one-liners.

### C. "Garbage In, Garbage Out" Gets Amplified
The pipeline operates sequentially: Strategy → Requirements → Architecture → Tasks → Code.  
* **The Cost**: If the human reviewer approves an initial `docs/architecture.md` that contains a flawed technical assumption (e.g., wrong database choice, unscalable data model), the downstream agents will obediently and meticulously build out that flawed architecture with clean, well-tested code. A disciplined pipeline will implement the wrong design just as faithfully as the right one.

### D. Living Contract Maintenance
Living documents require human care.  
* **The Cost**: If developers modify code at 2:00 AM without updating `docs/architecture.md`, the architectural contract drifts from the codebase. Future agents will generate code based on obsolete assumptions. Similarly, `docs/anti-patterns.md` must be actively curated to avoid prompt bloat.

### E. Strictness During Early Exploratory Prototyping
`AGENTS.md` forbids shortcuts: no `console.log`, mandatory typed errors, zero magic numbers, and zero-linter tolerances.  
* **The Cost**: During early hackathons or messy spike solutions, you often want dirty hacks just to test if an API works. The pipeline actively resists dirty code, which can feel rigid during early exploratory prototyping.

