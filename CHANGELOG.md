# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-11-17

### Added
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

