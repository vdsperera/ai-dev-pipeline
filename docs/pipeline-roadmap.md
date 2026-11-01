# AI Dev Pipeline Roadmap & Architectural Principles

This document serves as a persistent record of the philosophical principles underlying the AI Dev Pipeline and outlines the roadmap for future architectural upgrades and quality controls.

## Principles Over Rigid Rules

Software engineering is highly contextual. A "best practice" in one domain can be a massive anti-pattern in another. For example:
- **Strict Layer Isolation** (e.g., Pure Domain Layer with no ORM constructs in presentation) is essential for a large enterprise backend but is counter-productive for a rapid prototype or a framework like Next.js that relies on Server Actions.
- **Explicit Dependency Injection** is standard in C# or Angular but can be overly verbose in Python or React (which may prefer Context).

Because AI agents can become paralyzed or hallucinate when forced to adhere to absolute, inflexible constraints, this pipeline relies on **principles** as the global baseline (e.g., "Functions do one thing", "Validate inputs", "Mask secrets").

When exact, quantitative rules are needed, they are scoped to a **specific project** via the Architecture Document, rather than enforced globally.

## The Role of the Architect

The pipeline enforces relevant rules dynamically through the **Architect Agent (Agent 3)**.
1. The global `AGENTS.md` provides the universal baseline (security, hygiene, observability).
2. The Architect Agent analyzes requirements and generates a custom `docs/architecture.md` document. This document defines the specific patterns, technologies, and constraints for that project.
3. Downstream agents (Developer, Reviewer) are explicitly instructed to use `docs/architecture.md` as the absolute source of truth for component design and API contracts.

## Implemented Quality Control Upgrades

The following advanced quality controls have been integrated into the pipeline to enforce stricter standards where necessary:

### 1. Static Analysis & Linter Integration
- **Concept**: Shifting the burden of enforcing exact quantitative rules (like maximum cyclomatic complexity or exact line limits) from subjective AI prompts to objective, deterministic tools.
- **Implementation**: The pipeline mandates the use of static analysis tools (e.g., Ruff, ESLint, MyPy). The Architect agent explicitly prescribes these linters, and the Reviewer agent enforces them as a hard gate before proceeding to semantic code review.

### 2. Flavored Architecture Templates
- **Concept**: Allowing the user to define the "strictness" of the architecture upfront based on the project type.
- **Implementation**: The `sdlc-architect` skill accepts an optional `style` parameter.
    - `style=enterprise-ddd`: Enforces strict Domain/Service Layer isolation, Explicit Dependency Injection, and rigid type safety.
    - `style=rapid-prototype`: Relaxes these constraints for speed and framework-idiomatic development.

### 3. Adjustable Reviewer Strictness
- **Concept**: Contextualizing how ruthless the Code Reviewer should be based on the project's criticality.
- **Implementation**: The `sdlc-review` skill accepts a `strictness` parameter (e.g., `ruthless` or `lenient`). This adjusts the AI's tolerance for minor deviations from principles like SRP (Single Responsibility Principle) or strict type safety.
