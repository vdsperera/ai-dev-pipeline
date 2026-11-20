# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-11-20

### Added
- **Architecture Explainer & Knowledge Translator (`sdlc-explain` — Agent 20)**:
  - Added dedicated standalone skill (`.agents/skills/sdlc-explain/SKILL.md` and `prompts/20-architecture-explainer.md`) to demystify system architecture, tech stack decisions, and design choices.
  - Tailors explanations across three distinct audience tiers: Non-Technical (Founders/Stakeholders), Working Developer (Mid/Junior), and Principal Architect (Senior/Reviewers).
  - Automatically defaults to a structured 3-Tier explanation for open-ended architecture inquiries.
  - Fully synchronized across all editors: `.claude/commands/sdlc-explain.md`, `.cursor/rules/sdlc-explain.mdc`, and `.github/prompts/sdlc-explain.prompt.md` (64 synchronized editor files).
- **Audience-Aware Explanations Standard (`.agents/AGENTS.md`)**:
  - Enforced permanent baseline guideline for detecting and calibrating explanations to requested audience personas.
  - Protects `docs/architecture.md` from token bloat and AI agent confusion by keeping technical contracts concise while placing rich analogies in `docs/architecture-retro.md` and chat responses.
- **3-Tier Explanations in Architectural Retrospective (`sdlc-retro` — Agent 17)**:
  - Upgraded Section 5 in `prompts/17-architectural-retro.md` and `.agents/skills/sdlc-retro/SKILL.md` with structured Multi-Tier Audience Explanation & Review Defense.
- **Executive Impact Summaries in Trade-Off Consultant (`sdlc-consult` — Agent 19)**:
  - Updated `prompts/19-consultant.md` and `.agents/skills/sdlc-consult/SKILL.md` to include plain-English executive summaries alongside multi-perspective debate tables and ADRs.
- **Cheatsheet & CLI Diagnostics Expansion**:
  - Updated `bin/commands/cheatsheet.js` and `bin/cli.js` status diagnostics to recognize all 21 specialized agent personas and 20 skills.
  - Updated unit test suite (`tests/sync-tools.test.js`, `tests/cli.test.js`) verifying 20 skills with 34/34 passing tests and 100% benchmark score.

## [1.6.0] - 2026-11-19

### Added
- **Capabilities Quick-Reference Guide (`docs/quick-reference.md`)**:
  - Authored a task-oriented matrix answering *"What do you want to do?"* mapping goals directly to personas, trigger phrases, slash commands, inputs, and primary outputs.
  - Formatted across all 7 SDLC lifecycle phases (Planning, Development, Review Gates, Testing & Evaluation, DevOps, Documentation, Governance).
  - Includes cross-tool invocation matrices (Antigravity, Cursor, Claude Code, GitHub Copilot) and baseline quality invariants.
- **Interactive Terminal Capabilities Catalog (`npx ai-dev-pipeline cheatsheet`)**:
  - Implemented `bin/commands/cheatsheet.js` and registered `cheatsheet` (alias: `list`) in `bin/cli.js`.
  - Displays colorized, grouped terminal overview of all 20 agent personas, 19 skills, and core CLI commands.
  - Added `--phase <name>` flag to filter skills by SDLC stage (planning, develop, review, test, deploy, docs, governance).
  - Added `--search <query>` flag for keyword searching across skill names, personas, triggers, and purposes.
  - Added `--json` flag to export the entire capabilities catalog in machine-readable JSON format.
- **Comprehensive Unit Test Coverage for CLI & Catalog**:
  - Added test cases in `tests/cli.test.js` covering catalog integrity (verifying 7 phases and 19 skills), phase and search filtering, argument parsing, and terminal formatting (34 unit tests passing).
- **Documentation Atomic Sync**:
  - Updated `README.md` with links to the quick reference guide and command usage for `cheatsheet`, `list`, and its option flags.

## [1.5.0] - 2026-11-18

### Added
- **Architectural Layer Contract Enforcement (`scripts/eval-layers.js` & `scripts/eval-dimensions.js`)**:
  - Implemented `parseLayerContract` and `checkLayerContract` to enforce project-declared architectural boundaries from `docs/architecture.md`.
  - Supports both HTML comments (`<!-- layer-contract: ... -->`) and Markdown sections (`### Layer Contract`), validating relative `import` and `require()` statements to prevent prohibited architectural bypasses (e.g. controllers importing models directly).
  - Fully backward-compatible; projects without declared layer contracts run baseline heuristics without penalty.
- **KLOC-Normalized Code Quality Scoring**:
  - Implemented `calculateKlocMetrics` to compute physical SLOC, KLOC, and density scaling factors.
  - Scaled density findings (line lengths and block nesting) proportionally across repository size, preventing single isolated findings in large codebases from disproportionately dropping hygiene scores.
  - Added code volume metrics display (`fileCount`, `totalSloc`, `kloc`, `densityFactor`) to terminal scorecards and Markdown audit reports.
- **Cryptographic Planning Checksums & Stale Backlog Detection**:
  - Added short SHA-256 document checksumming (`computeDocChecksum`, `verifyPlanningChecksums`) between `docs/tasks.md` and upstream planning documents (`docs/requirements.md`, `docs/architecture.md`).
  - Automatically flags when architecture or requirements have evolved after tasks were generated.
  - Wired into `npx ai-dev-pipeline migrate` to stamp and update planning checksums automatically.
- **Multi-Agent Deliberation Skill (`sdlc-consult` — Agent 19)**:
  - Added standalone consultation skill (`prompts/19-consultant.md` and `.agents/skills/sdlc-consult/SKILL.md`) for debating complex architectural dilemmas.
  - Synthesizes competing System Architect, Security Reviewer, and Pragmatic Developer perspectives into a structured Trade-Off Decision Matrix with pre-drafted ADRs and stated sensitivity invariants.
  - Fully synchronized across all supported editors: `.claude/commands/sdlc-consult.md`, `.cursor/rules/sdlc-consult.mdc`, and `.github/prompts/sdlc-consult.prompt.md` (61 synchronized editor files).
- **Target Directory Support across CLI Commands (`bin/cli.js`)**:
  - Added `--target-dir` flag support to `status`, `sync`, and `migrate` commands to enable targeted operations on sub-projects and examples.
- **Expanded Native Unit Test Suite**:
  - Added `tests/eval-layers.test.js` covering layer contract parsing, violation detection, checksum generation, stale planning detection, and KLOC metric counting (32 unit tests passing in ~1.0s).

## [1.4.0] - 2026-11-18

### Added
- **Real-World Reference Run Project (`examples/real-run-2026-11/`)**:
  - Added a complete, live 5-endpoint Order & Inventory Fulfillment REST API built with zero runtime dependencies.
  - Stepped through the entire pipeline: `sdlc-onboard` (7/7 paths verified) $\rightarrow$ `sdlc-plan (track=lite)` $\rightarrow$ mechanical dependency gate verification (demonstrating both task blocking and automatic unblocking) $\rightarrow$ `sdlc-develop` (with handoff notes) $\rightarrow$ `sdlc-review` (10-category checklist + ADR-drift check) $\rightarrow$ `sdlc-retro` (evidence tags + path verification) $\rightarrow$ `eval` (100.0% Grade A+ scorecard).
  - Authored unedited engineering field notes in `examples/real-run-2026-11/NOTES.md` documenting exact terminal logs, real verification incidents, friction points, and findings.
  - Linked reference run prominently from `README.md`.
- **Task Delta Evaluation (`eval --since <commit>`)**:
  - Added `--since <commit>` flag to `scripts/eval-harness.js` and `bin/cli.js` to evaluate only modified files relative to a git commit or branch, enabling rapid local hygiene checks during active feature work on large codebases.
  - Parameterized git reference execution using `execFileSync` to enforce security standards and prevent command injection.
- **Pragmatic Quick Developer Agent & Skill (`sdlc-quick` — Agent 18)**:
  - Added lightweight, single-turn development skill (`prompts/18-quick-dev.md` and `.agents/skills/sdlc-quick/SKILL.md`) for rapid bug fixes, script adjustments, and minor enhancements without multi-agent planning ceremony.
  - Fully synchronized across all supported editors: `.claude/commands/sdlc-quick.md`, `.cursor/rules/sdlc-quick.mdc`, and `.github/prompts/sdlc-quick.prompt.md` (58 synchronized editor files).
- **Template Migration Tooling (`npx ai-dev-pipeline migrate`)**:
  - Implemented `bin/commands/migrate.js` to safely and non-destructively upgrade older project documentation to current template versions (`pipeline-template: anti-patterns/v2`, `architecture/v1`, `tasks/v1`).
- **Workspace-Aware Governance Gate (`security-gate.js`)**:
  - Added `--workspace <dir>` parameter to `security-gate.js` to support evaluating task dependencies across subdirectories and multi-repo setups.
- **Evaluator Example Isolation**:
  - Added `examples` directory isolation in `scripts/eval-harness.js` so sub-project reference files and tests do not contaminate parent repository evaluation scorecards.
- **Expanded Native Unit Test Suite**:
  - Expanded test suite to 26 unit tests covering delta evaluation, git reference validation, and template migration idempotency.

## [1.3.1] - 2026-11-18

### Fixed
- **Mermaid Diagram Guardrail Label Alignment (`README.md`)**:
  - Relabeled the interception layer node in the architecture diagram to `HOOKS[Hooks<br>Pre-tool / pre-commit checks]`, eliminating the last text reference to prompt-level interception and maintaining complete alignment with the 3-Tier model.

### Added
- **Architectural Alignment & ADR-Drift Detection (`sdlc-review` & `prompts/07-code-reviewer.md`)**:
  - Added Category 10 to code review instructions: flags code diffs that touch any file declared under an ADR's `Implementing files` in `docs/architecture.md` when that ADR's status remains unchanged (*"Possible undocumented architectural change — confirm or supersede ADR-NNN"*), ensuring living architecture tracking remains synchronized over time.

## [1.3.0] - 2026-11-17

### Added
- **Mechanical Task Dependency Gate Trigger (`sdlc-develop`)**:
  - Explicitly wired into `sdlc-develop` Step 1: the agent executes `node scripts/security-gate.js --check-task TASK-NNN` prior to implementation. If dependencies are incomplete, the gate returns `decision: deny` and the agent halts immediately.
  - Updated documentation: accurately described as a skill-invoked mechanical gate (Tier 2/Tier 1 hybrid) rather than magical user-prompt interception.
- **Robust Path Verification & Edge Case Handling (`eval --onboard-check` & `--retro-check`)**:
  - Broadened path detection in `scripts/eval-dimensions.js` to catch unquoted markdown table paths (e.g. `src/repositories/orders.repo.ts`), dot-prefixed paths (`.github/workflows/ci.yml`, `.agents/`), and strip trailing `:line` suffixes.
  - Special-cased zero-path documents to report `"No paths found to verify"` instead of false-positive 100% passes.
- **Universal Step HALT & Completion Criteria**:
  - Implemented explicit `HALT and ask the user if:` and `This step is complete when:` criteria across all 17 skills, preventing run-away LLM loops and enforcing strict turn boundaries.
- **Mandatory Anti-Pattern Feedback Decisions (`sdlc-review` & `sdlc-debug`)**:
  - Added a mandatory concluding step to code reviews and bug fixes requiring an explicit decision (`YES` with `Detect: /regex/` or `NO` with reason) to ensure `docs/anti-patterns.md` defect memory is actively maintained.
- **Template Versioning & Language Scope Warnings**:
  - Stamped anti-pattern template with `<!-- pipeline-template: anti-patterns/v2 -->`.
  - Added non-blocking upgrade notice in `eval` when legacy v1 templates lack executable fields.
  - Added runtime disclosure when evaluated projects are predominantly non-JS/TS.
- **Cosmetic & Diagnostic Cleanups**:
  - Refined CLI banner in `bin/cli.js` to *"The Lightweight SDLC Governance Harness for AI Coding Agents"*.
  - Suppressed `git log` stderr in `verifyLastCommit` when running benchmarks outside a git repository.
- **Architectural Retrospective Agent & Skill (`sdlc-retro` — Agent 17)**:
  - Added standalone `sdlc-retro` skill (`prompts/17-architectural-retro.md` and `.agents/skills/sdlc-retro/SKILL.md`) for auditing system design trade-offs, break points, and reversibility on completed features or existing repositories.
  - **Evidence Provenance Tagging**: Requires all claims in sections 1–4 to carry explicit provenance tags: `[recorded]` (citing ADRs/handoffs/commits), `[observed]` (citing `file:line`), or `[inferred]` (stating deductive reasoning). Sections with only inferred claims are explicitly flagged as hypothesis sections.
  - **Git Churn Grounding**: Cross-references top 10 churned files and commit messages containing `"revert"`, `"hotfix"`, or `"workaround"` from `git log` as empirical evidence for fragility. Gracefully handles cold-start repositories with `<5` commits.
  - **Scale Reasoning**: Analyzes 100x scalability grounded in explicitly stated load profiles (read-heavy, write-heavy, fan-out) and sensitivity conditions, replacing speculative simulation language.
  - **Feed-Forward Loop**: Automatically converts retro findings into project artifacts: proposes `TASK-NNN` entries for severe failure modes to `docs/tasks.md`, `AP-NNN` entries to `docs/anti-patterns.md`, and retroactive ADR drafts to `docs/architecture.md`.
  - **Elevator Pitch Mode**: Optional Section 5 providing 60-second casual coffee-chat pitches and senior technical review defense using the C-A-T (Context, Alternatives, Trade-offs) framework via `--with-pitch` or trigger phrase `"prepare me to explain this"`.
- **Architectural Retrospective Path Verification (`eval --retro-check`)**:
  - Added `--retro-check` flag to `scripts/eval-harness.js` that audits `docs/architecture-retro.md` to guarantee 100% of cited files and directory paths exist on disk without hallucination.
- **Enhanced Architecture Decision Records (ADRs)**:
  - Upgraded ADR template in `prompts/03-architect.md` to require `Status`, `Date`, `Alternatives considered` (with explicit rejection rationale), `Implementing files`, and added a HALT rule: *"halt if you cannot name at least one rejected alternative — a decision with no alternative is not a decision."*
- **Architecture Deviations Tracking**:
  - Upgraded developer handoff template in `.agents/skills/sdlc-develop/SKILL.md` to include explicit `Deviations from architecture` (`[none] | [ADR-NNN: what differed and why]`) and ADR supersession tracking rules.
- **Cross-Tool Parity & Skill Expansion**:
  - Expanded pipeline to **18 specialized agent personas** and **17 native skills**.
  - Re-synchronized all 55 native tool files across Antigravity, Cursor (`.cursor/rules/sdlc-retro.mdc`), Claude Code (`.claude/commands/sdlc-retro.md`), and GitHub Copilot (`.github/prompts/sdlc-retro.prompt.md`).
  - Updated global Antigravity plugin (`~/.gemini/config/plugins/ai-dev-pipeline`).

## [1.2.0] - 2026-11-15

### Added
- **Project Rule Overrides (`AGENTS.local.md`)**: Users can now define project-specific rules in `AGENTS.local.md` that survive updates and are automatically appended to generated editor configurations (`CLAUDE.md`, `.cursorrules`, Copilot) during sync.
- **Skill Prompt Overrides (`prompts/overrides/`)**: Custom prompt instructions placed in `prompts/overrides/<skill>.md` are seamlessly merged into native skill definitions on sync without forking.
- **Onboard Architecture Path Verification (`eval --onboard-check`)**: Automated verification confirming that all source files and directories declared in `docs/architecture.md` exist on disk, preventing AI hallucinated architecture from polluting downstream tasks.
- **Explicit Step HALT & Completion Criteria**: Added explicit `HALT and ask the user if:` and `This step is complete when:` criteria to skill workflows (`sdlc-develop`), improving LLM task boundary enforcement.
- **Defect Recurrence Frequency Tracking**: Added `Seen in: TASK-NNN` field to `docs/anti-patterns.md` template for tracking which tasks triggered recurring defects.
- **Expanded Test Suite**: Added unit tests for architecture path verification and local rule synchronization, bringing the total passing test suite to 21 native tests.

## [1.1.0] - 2026-11-15

### Added
- **Multi-Editor Native Skill Parity**: Generated 52 native configuration and skill files across all supported AI coding environments:
  - **Cursor**: 16 native `.cursor/rules/<skill>.mdc` skill files invocable via `@<skill>` with `alwaysApply: false`.
  - **Claude Code**: 16 native `.claude/commands/<skill>.md` command files invocable via slash commands (e.g. `/sdlc-develop`).
  - **GitHub Copilot**: 16 native `.github/prompts/<skill>.prompt.md` prompt files invocable via `/prompt` in Copilot Chat.
- **Pre-Implement Task Dependency Gate**: Implemented mechanical dependency gating in `.agents/scripts/security-gate.js` and `scripts/security-gate.js` (and `--check-task TASK-NNN` CLI flag). Intercepts task implementation requests, verifies upstream task completion in `docs/tasks.md`, and physically blocks out-of-order execution with `decision: 'deny'`.
- **CI Multi-Editor Drift Check**: Added `npm run sync-tools:check` to CI and `npm test` verifying that Cursor, Claude Code, and Copilot skill definitions never drift from `.agents/skills/`.
- **Fast-Track Planning Option**: Added streamlined 2-stage planning mode (`Requirements → Tasks`) in `sdlc-plan` for lightweight feature delivery, utility scripts, and bug remediation alongside the full 6-stage enterprise track.
- **Three-Tier Enforcement Architecture**: Documented the 3-Tier Guardrail Model in `README.md` clearly delineating Tier 1 (Instructional prompts), Tier 2 (Mechanical hooks), and Tier 3 (Deterministic eval scorecard).
- **Security & Pipeline Transparency Disclosure**: Added dedicated "What `init` Writes and Runs" section in `README.md` guaranteeing zero telemetry, zero credential collection, and zero dependency pollution.
- **Opt-In MCP Configuration**: Converted `.agents/mcp_config.json` to `{ "mcpServers": {} }` and added `.agents/mcp_config.json.example`, ensuring background server processes or dummy credentials are never spawned automatically.
- **Language Ecosystem Disclosure**: Explicitly documented in `README.md` that evaluation heuristics and linter gates are currently optimized for TypeScript and JavaScript ecosystems.
- **Native Unit Test Suite**: Added 19 native unit tests in `tests/` leveraging Node 18+ `node:test` and `node:assert/strict` covering CLI commands, multi-editor synchronization, task dependency gating, and evaluation harness audit dimensions without external dependencies.
- **Enhanced Test Runner**: Updated `npm test` script to run unit tests, multi-editor drift check, benchmark scenarios, and CLI health checks in sequence.
- **Cross-Platform Security Gate Hook**: Implemented pure Node.js pre-tool and pre-commit hook (`.agents/scripts/security-gate.js` and `scripts/security-gate.js`) replacing Windows-only PowerShell scripts.
- **Dynamic Anti-Pattern Grep**: `eval-harness.js` now dynamically parses custom `Detect: /regex/` invariants from `docs/anti-patterns.md`.
- **Project Linter Execution**: `eval-harness.js` now detects and executes the project's official static analysis script (`npm run lint` or `npm run lint:check`) from `package.json`.
- **Project Packaging**: Added `.claude` and `.github` to `package.json` distribution files list.

### Fixed
- **BMAD-METHOD Misidentification**: Corrected the FAQ description to accurately identify BMAD-METHOD as the persona-driven SDLC framework ("Breakthrough Method for Agile AI-Driven Development") and added an objective 8-dimension comparison matrix.
- **Eval Path Exclusion Bug**: Replaced the substring `.includes('test')` path filter with precise regexes (`isTestFile` and `isScriptOrCliFile`) to prevent false-positive exclusion of legitimate files (e.g. `src/contest/`, `src/attestation/`).
- **SQL in Comments False Positives**: Evaluation harness now skips comments when checking for SQL in presentation/route layers.
- **Credential Detection Regex**: Broadened secret regex to catch passwords, JWT secrets, bearer tokens, and API keys with a 12+ character threshold.
- **Code Duplication**: Deduplicated file synchronization logic by delegating CLI synchronizer calls directly to `scripts/sync-tools.js`.

### Changed
- **Codebase Modularization**: Decomposed overgrown files to satisfy the project's $\le 450$ lines/file and nesting depth $\le 4$ quality standards:
  - Extracted `bin/commands/init.js` from `bin/cli.js` (reduced from 509 lines to 222 lines).
  - Extracted `scripts/eval-dimensions.js` and `scripts/eval-reporters.js` from `scripts/eval-harness.js` (reduced from 630 lines to 176 lines).
  - Self-audit score verified at 100% [Grade: A+] with 0 self-violations across all dimensions.
- **Grounded Terminology**: Replaced overstated claims ("deterministic verification layer", "architecture contracts compiler", "cyclomatic depth") with accurate, honest descriptions ("Codebase Hygiene Scorecard", "block nesting depth").
- **README Tone & Model References**: Softened marketing buzzwords ("engineering factory", "operating system") to match the authentic tone of the engineering trade-offs section, and generalized model references to long-context frontier models.
- **Case Study Labeling**: Clarified that `docs/case-studies/01` and `02` are illustrative walkthroughs (synthetic reference scenarios) demonstrating expected document formats.
- **Scaffolder Clean-up**: Stopped copying `docs/pipeline-roadmap.md` into user projects during `ai-dev-pipeline init`, keeping user documentation directories clean.

## [1.0.1] - 2026-11-12

### Added
- Core 17 persona prompts and 16 Antigravity skills.
- Static evaluation harness (`eval-harness.js`) with benchmark fixtures.
- CLI scaffolder (`bin/cli.js`) with `init`, `status`, and `sync` commands.
- Initial reference scenarios for greenfield microservices and brownfield bug investigations.

