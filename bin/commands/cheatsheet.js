/**
 * bin/commands/cheatsheet.js — Interactive Capabilities Catalog & Cheat Sheet
 *
 * Provides a task-oriented terminal reference of all 21 agent personas, 20 skills,
 * and CLI commands across all 7 SDLC lifecycle phases.
 *
 * Usage:
 *   npx ai-dev-pipeline cheatsheet
 *   npx ai-dev-pipeline list
 *   npx ai-dev-pipeline cheatsheet --phase=planning
 *   npx ai-dev-pipeline cheatsheet --search=debug
 *   npx ai-dev-pipeline cheatsheet --json
 */

'use strict';

const CHEATSHEET_DATA = [
  {
    phaseId: 'planning',
    phaseName: 'Phase 1: Product Strategy & Planning',
    description: 'Turn raw concepts into refined requirements, user stories, architecture contracts, and atomic tasks.',
    skills: [
      {
        skill: 'sdlc-plan',
        agent: 'Pipeline Orchestrator',
        purpose: 'End-to-end planning chain (Agents 0→1→2→3→4→5) or lightweight fast-track',
        trigger: 'plan my project: [idea] | fast-track plan: [feature]',
        output: 'docs/product-brief.md, requirements.md, user-stories.md, architecture.md, tasks.md'
      },
      {
        skill: 'sdlc-strategy',
        agent: 'Agent 0 — Product Strategist',
        purpose: 'Defines target personas, core value proposition, MVP scope, and business risks',
        trigger: 'define product strategy for [idea]',
        output: 'docs/product-brief.md'
      },
      {
        skill: 'sdlc-requirements',
        agent: 'Agent 1 — Requirements Analyst',
        purpose: 'Surfaces ambiguities, edge cases, technical constraints, and missing NFRs',
        trigger: 'analyse requirements for [feature]',
        output: 'docs/requirements.md'
      },
      {
        skill: 'sdlc-stories',
        agent: 'Agent 2 — User Story Writer',
        purpose: 'Writes INVEST user stories with formal Gherkin acceptance criteria',
        trigger: 'write user stories for [feature]',
        output: 'docs/user-stories.md'
      },
      {
        skill: 'sdlc-architect',
        agent: 'Agent 3 — Architect',
        purpose: 'Designs system architecture, component boundaries, API contracts, and ADRs',
        trigger: 'design architecture for [feature]',
        output: 'docs/architecture.md'
      },
      {
        skill: 'sdlc-ux',
        agent: 'Agent 4 — UI/UX Designer',
        purpose: 'Designs UI layout specs, user flows, accessibility guidelines (WCAG 2.1 AA)',
        trigger: 'design UI/UX for [feature]',
        output: 'docs/design-specs.md'
      },
      {
        skill: 'sdlc-tasks',
        agent: 'Agent 5 — Task Planner',
        purpose: 'Decomposes architecture and stories into ordered, dependency-gated atomic tasks',
        trigger: 'plan task backlog | break down tasks',
        output: 'docs/tasks.md (with TASK-001 toolchain bootstrap)'
      }
    ]
  },
  {
    phaseId: 'develop',
    phaseName: 'Phase 2: Implementation & Development',
    description: 'Implement atomic tasks with strict coding standards, typed errors, and drift tracking.',
    skills: [
      {
        skill: 'sdlc-develop',
        agent: 'Agent 6 — Developer',
        purpose: 'Implements backlog tasks following AGENTS.md law, unit tests, and handoff notes',
        trigger: 'implement TASK-NNN | refactor TASK-NNN',
        output: 'Code + unit tests + docs/handoffs/TASK-NNN.md'
      },
      {
        skill: 'sdlc-quick',
        agent: 'Agent 18 — Quick Developer',
        purpose: 'Lightweight, single-turn surgical bug fixes, script tweaks, or minor enhancements',
        trigger: 'quick fix: [issue] | tweak this script',
        output: 'Targeted code edit + test verification'
      }
    ]
  },
  {
    phaseId: 'review',
    phaseName: 'Phase 3: Code & Security Review Gates',
    description: 'Multi-layer defense against code rot, OWASP security vulnerabilities, and PR bloat.',
    skills: [
      {
        skill: 'sdlc-review',
        agent: 'Agents 7, 8, 9 — Review Suite',
        purpose: '9-category code review + OWASP Top 10 security review + UX accessibility check',
        trigger: 'review TASK-NNN | code review TASK-NNN',
        output: 'docs/reviews/TASK-NNN-code-review.md'
      },
      {
        skill: 'pr-review',
        agent: 'Agent 11 — PR Reviewer',
        purpose: '3-layer PR review at the merge gate (mechanical, engineering, system flags) with verdict',
        trigger: 'review this PR | review PR #12',
        output: 'docs/reviews/PR-NNN-review.md'
      },
      {
        skill: 'pr-triage',
        agent: 'Agent 12 — Large PR Triage',
        purpose: 'Breaks oversized diffs into coherent review segments with cross-cutting checklists',
        trigger: 'triage this PR | this PR is too large',
        output: 'docs/reviews/PR-NNN-triage-plan.md'
      }
    ]
  },
  {
    phaseId: 'test',
    phaseName: 'Phase 4: Testing & Objective Hygiene Evaluation',
    description: 'Validate behavior with complete test suites and automated architectural scoring.',
    skills: [
      {
        skill: 'sdlc-test',
        agent: 'Agent 10 — Test Generator',
        purpose: 'Generates comprehensive unit, integration, E2E, and performance tests',
        trigger: 'test TASK-NNN | generate tests for TASK-NNN',
        output: 'Tests + docs/test-reports/TASK-NNN-test-report.md'
      },
      {
        skill: 'eval (CLI)',
        agent: 'Tier 3 Hygiene Evaluator',
        purpose: 'Zero-dependency static audit of layer contracts, linters, depth, and anti-patterns',
        trigger: 'npx ai-dev-pipeline eval [--since main] [--task TASK-NNN]',
        output: 'Hygiene Scorecard (0-100%, Grade A+ to F)'
      }
    ]
  },
  {
    phaseId: 'deploy',
    phaseName: 'Phase 5: DevOps & Deployment',
    description: 'Generate production containerization, CI/CD pipelines, and infrastructure as code.',
    skills: [
      {
        skill: 'sdlc-deploy',
        agent: 'Agent 13 — DevOps Agent',
        purpose: 'Generates Dockerfiles, GitHub Actions workflows, IaC templates, and deployment reviews',
        trigger: 'deploy TASK-NNN | generate CI/CD',
        output: 'Dockerfile, .github/workflows/, docs/deploy/TASK-NNN-deploy.md'
      }
    ]
  },
  {
    phaseId: 'docs',
    phaseName: 'Phase 6: Documentation & Drift Synchronization',
    description: 'Keep documentation, READMEs, changelogs, and tool rules synchronized atomically.',
    skills: [
      {
        skill: 'sdlc-docs',
        agent: 'Agent 14 — Documentation Agent',
        purpose: 'Generates API docs, updates README, changelogs, and verifies document freshness',
        trigger: 'document TASK-NNN | generate docs',
        output: 'README updates, CHANGELOG.md, docs/documentation/TASK-NNN-docs.md'
      },
      {
        skill: 'sync (CLI)',
        agent: 'Cross-Tool Synchronizer',
        purpose: 'Synchronizes standards from .agents/AGENTS.md across Antigravity, Cursor, Claude, Copilot',
        trigger: 'npx ai-dev-pipeline sync [--global]',
        output: 'CLAUDE.md, .cursorrules, copilot-instructions.md'
      }
    ]
  },
  {
    phaseId: 'governance',
    phaseName: 'Phase 7: Brownfield, RCA & Architectural Decision Making',
    description: 'Reverse-engineer unknown codebases, scientific debugging, retros, and trade-off debates.',
    skills: [
      {
        skill: 'sdlc-onboard',
        agent: 'Agent 15 — Codebase Onboarder',
        purpose: 'Reverse-engineers unknown or legacy codebases into docs/architecture.md',
        trigger: 'onboard this repo | scan existing codebase',
        output: 'docs/architecture.md + implicit ADRs'
      },
      {
        skill: 'sdlc-debug',
        agent: 'Agent 16 — Bug Investigator',
        purpose: 'Scientific 5-Whys RCA, failing reproduction test first, minimal fix, and handoff',
        trigger: 'debug this: [symptom] | investigate error',
        output: 'Failing test + fix + docs/handoffs/BUG-NNN.md'
      },
      {
        skill: 'sdlc-retro',
        agent: 'Agent 17 — Architectural Retro',
        purpose: 'Audits past decisions, failure modes, 100x scale reasoning, and review defense',
        trigger: 'audit design choices | prepare me to explain this',
        output: 'docs/architecture-retro.md'
      },
      {
        skill: 'sdlc-consult',
        agent: 'Agent 19 — Trade-Off Consultant',
        purpose: 'Synthesizes Architect, Security, and Dev perspectives into ADR + decision matrix',
        trigger: 'consult: [dilemma] | debate this decision',
        output: 'Pre-drafted ADR in docs/architecture.md'
      },
      {
        skill: 'sdlc-explain',
        agent: 'Agent 20 — Architecture Explainer',
        purpose: 'Translates architecture, tech choices, and decisions into 3 tailored audience levels',
        trigger: 'explain this | explain architecture for [audience] | why was this built this way',
        output: 'Audience-tailored explanation (Non-Tech, Developer, or Architect tier)'
      }
    ]
  }
];

const CLI_COMMANDS = [
  {
    cmd: 'init',
    args: '[-y] [--tools <list>] [--preset <name>] [--type <type>]',
    desc: 'Scaffold AI Dev Pipeline into current repository'
  },
  {
    cmd: 'cheatsheet',
    args: '[--phase <name>] [--search <query>] [--json]',
    desc: 'Display interactive quick-reference of all 21 agents, 20 skills, and workflows (alias: list)'
  },
  {
    cmd: 'status',
    args: '[--global] [--target-dir <path>]',
    desc: 'Verify pipeline health, persona counts, and editor configurations'
  },
  {
    cmd: 'eval',
    args: '[--since <ref>] [--task <id>] [--threshold <n>] [--benchmark]',
    desc: 'Run static hygiene evaluation (layer violations, linters, anti-patterns)'
  },
  {
    cmd: 'sync',
    args: '[--global] [--target-dir <path>]',
    desc: 'Synchronize cross-tool rules (.cursorrules, CLAUDE.md, copilot-instructions.md)'
  },
  {
    cmd: 'migrate',
    args: '[--target-dir <path>]',
    desc: 'Non-destructively stamp template tags & planning checksums in docs/'
  },
  {
    cmd: 'check',
    args: '[--target-dir <path>]',
    desc: 'Audit release readiness and sync completeness across docs, tools, and plugins (alias: audit)'
  }
];

function getSkillsCatalog() {
  return CHEATSHEET_DATA;
}

function getCliCommands() {
  return CLI_COMMANDS;
}

function filterCatalog(catalog, { phase = null, search = null }) {
  let filtered = catalog;

  if (phase) {
    const normalizedPhase = phase.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.phaseId.toLowerCase().includes(normalizedPhase) ||
      p.phaseName.toLowerCase().includes(normalizedPhase)
    );
  }

  if (search) {
    const q = search.toLowerCase().trim();
    filtered = filtered.map(group => {
      const matchingSkills = group.skills.filter(s =>
        s.skill.toLowerCase().includes(q) ||
        s.agent.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        s.trigger.toLowerCase().includes(q)
      );
      if (matchingSkills.length > 0) {
        return { ...group, skills: matchingSkills };
      }
      return null;
    }).filter(Boolean);
  }

  return filtered;
}

function formatTerminalOutput(catalog, commands, colors) {
  const { bold, reset, cyan, green, yellow, dim, magenta } = colors;
  const lines = [];

  lines.push(`${bold}📚 AI Dev Pipeline — Capabilities Catalog & Quick Reference${reset}`);
  lines.push(`${dim}21 Specialized Agent Personas · 20 Skills · 4 AI Editors · Zero-Dependency Governance${reset}\n`);

  for (const group of catalog) {
    lines.push(`${magenta}${bold}=== ${group.phaseName} ===${reset}`);
    lines.push(`${dim}${group.description}${reset}\n`);

    for (const item of group.skills) {
      lines.push(`  ${cyan}${bold}${item.skill.padEnd(20)}${reset} ${dim}[${item.agent}]${reset}`);
      lines.push(`    ${yellow}Purpose:${reset}  ${item.purpose}`);
      lines.push(`    ${green}Trigger:${reset}  "${item.trigger}"`);
      lines.push(`    ${dim}Output:   ${item.output}${reset}\n`);
    }
  }

  if (commands && commands.length > 0) {
    lines.push(`${magenta}${bold}=== Core CLI Commands ===${reset}\n`);
    for (const cmd of commands) {
      const fullCmd = `ai-dev-pipeline ${cmd.cmd} ${cmd.args || ''}`.trim();
      lines.push(`  ${cyan}${bold}${fullCmd.padEnd(46)}${reset} ${cmd.desc}`);
    }
    lines.push('');
  }

  lines.push(`${yellow}${bold}💡 Tips:${reset}`);
  lines.push(`  • In ${bold}Antigravity${reset}: Skills invoke automatically when typing natural trigger phrases.`);
  lines.push(`  • In ${bold}Claude Code${reset}: Trigger skills as slash commands: ${cyan}/sdlc-plan${reset}, ${cyan}/sdlc-develop${reset}, etc.`);
  lines.push(`  • In ${bold}Cursor${reset}: Use agent skills via Composer or mention ${cyan}@.cursor/rules/<skill>.mdc${reset}.`);
  lines.push(`  • Full visual documentation: ${cyan}docs/quick-reference.md${reset}\n`);

  return lines.join('\n');
}

function commandCheatsheet(flags, { BANNER, c }) {
  if (flags.json) {
    console.log(JSON.stringify({
      skillsCatalog: CHEATSHEET_DATA,
      cliCommands: CLI_COMMANDS
    }, null, 2));
    return;
  }

  console.log(BANNER);

  const filterOptions = {
    phase: flags.phase || null,
    search: flags.search || null
  };

  const filteredCatalog = filterCatalog(CHEATSHEET_DATA, filterOptions);

  if (filteredCatalog.length === 0) {
    console.log(`${c.yellow}No skills matched your search filter.${c.reset}\n`);
    console.log(`Try running ${c.cyan}npx ai-dev-pipeline cheatsheet${c.reset} to view all capabilities.\n`);
    return;
  }

  // Show CLI commands only if not filtering by a specific phase
  const commandsToShow = (!filterOptions.phase && !filterOptions.search) ? CLI_COMMANDS : [];
  console.log(formatTerminalOutput(filteredCatalog, commandsToShow, c));
}

module.exports = {
  CHEATSHEET_DATA,
  CLI_COMMANDS,
  getSkillsCatalog,
  getCliCommands,
  filterCatalog,
  formatTerminalOutput,
  commandCheatsheet
};

