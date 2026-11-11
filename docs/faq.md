# Frequently Asked Questions (FAQ) & Architectural Philosophy

This document addresses common questions from senior software engineers, tech leads, and architects exploring the design philosophy, real-world trade-offs, and industry positioning of `ai-dev-pipeline`.

---

## 1. Why wasn't this built before? If it's so useful, why didn't someone else create it?

In software engineering, when a seemingly obvious solution hasn't been widely built yet, there are usually three specific explanations:

### A. The Context Window Timeline (Technical Feasibility)
Two years ago, `ai-dev-pipeline` was technically impossible.
* In the era of GPT-3.5 and early GPT-4 (2022–2023), context windows were constrained to 4,000–8,000 tokens.
* Passing a living architectural contract (`docs/architecture.md`), a 17-role prompt library, an anti-pattern registry, and thousands of lines of source code into an LLM simultaneously caused immediate context exhaustion or severe hallucinations.
* It is only with the recent arrival of reliable, high-capacity models with 128k to 1M+ token context windows (Claude 3.5 Sonnet, Gemini 1.5/2.0, GPT-4o) that an entire software engineering governance harness can fit comfortably in active memory.

### B. Misaligned Startup Incentives (The VC Subscription Model)
Startups that raised venture capital during the GenAI boom were pressured to justify \$20M–\$100M valuations.
* To achieve that, they built **proprietary IDEs** (to charge \$20/month per developer seat) or **cloud virtual machines** (to bill for hours of cloud GPU compute like Devin).
* A venture capitalist would not fund a zero-dependency, open-source CLI and Markdown harness that runs 100% locally on a developer's machine with no cloud lock-in.

### C. Big Tech Kept It Internal
Companies like Google, Meta, and Amazon *did* build internal agent review systems, mandatory design doc workflows, and automated linter gates. However, those tools are deeply welded to their proprietary monorepo infrastructure (e.g., Google Piper and Critique) and cannot be exported as a standard `npx` package.

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
