#!/usr/bin/env node

/**
 * AI Dev Pipeline CLI Scaffolder
 *
 * Zero-friction, cross-tool SDLC harness initializer and manager.
 * Injects 18 specialized agent personas, 17 skills, and baseline coding standards
 * into any repository for Antigravity, Cursor, Claude Code, and GitHub Copilot.
 *
 * Usage:
 *   npx ai-dev-pipeline init            # Interactive setup wizard
 *   npx ai-dev-pipeline init -y         # Zero-config standard setup
 *   npx ai-dev-pipeline sync            # Synchronize standards across all tool configs
 *   npx ai-dev-pipeline status          # Verify pipeline health in current directory
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const TARGET_DIR = process.cwd();

// ANSI color helpers
const supportsColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);
const c = {
  reset: supportsColor ? '\x1b[0m' : '',
  bold: supportsColor ? '\x1b[1m' : '',
  dim: supportsColor ? '\x1b[2m' : '',
  cyan: supportsColor ? '\x1b[36m' : '',
  green: supportsColor ? '\x1b[32m' : '',
  yellow: supportsColor ? '\x1b[33m' : '',
  magenta: supportsColor ? '\x1b[35m' : '',
  red: supportsColor ? '\x1b[31m' : ''
};

const BANNER = `
${c.cyan}${c.bold}   ___    ____     ____                 ____  _            _ _             
  /   |  /  _/    / __ \\___ _   __     / __ \\(_)___  ___  / (_)___  ___    
 / /| |  / /_____/ / / / _ \\ | / /____/ /_/ / / __ \\/ _ \\/ / / __ \\/ _ \\   
/ ___ |_/ /_____/ /_/ /  __/ |/ /_____/ ____/ / /_/ /  __/ / / / / /  __/   
/_/  |_/___/    /_____/\\___/|___/     /_/   /_/ .___/\\___/_/_/_/ /_/\\___/    
                                             /_/                             ${c.reset}
${c.dim}  The Lightweight SDLC Governance Harness for AI Coding Agents${c.reset}
`;

function getPkgVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function printHelp() {
  console.log(BANNER);
  console.log(`${c.bold}VERSION:${c.reset} ${getPkgVersion()}\n`);
  console.log(`${c.bold}USAGE:${c.reset}`);
  console.log(`  npx @kadvsperera/ai-dev-pipeline [command] [options]\n`);
  console.log(`${c.bold}COMMANDS:${c.reset}`);
  console.log(`  ${c.cyan}init${c.reset}                  Scaffold AI Dev Pipeline into current repository`);
  console.log(`  ${c.cyan}eval${c.reset}                  Audit stage outputs for architectural drift and anti-patterns`);
  console.log(`  ${c.cyan}sync${c.reset}                  Synchronize cross-tool rule configs from .agents/AGENTS.md`);
  console.log(`  ${c.cyan}status${c.reset}                Check pipeline health and active tool configs`);
  console.log(`  ${c.cyan}migrate${c.reset}               Upgrade older documentation templates to current version`);
  console.log(`  ${c.cyan}help, --help, -h${c.reset}      Show this help message`);
  console.log(`  ${c.cyan}version, -v${c.reset}           Print CLI version\n`);
  console.log(`${c.bold}INIT OPTIONS:${c.reset}`);
  console.log(`  ${c.green}-y, --yes${c.reset}             Non-interactive mode with standard defaults`);
  console.log(`  ${c.green}--tools <list>${c.reset}        Comma-separated tools: antigravity,cursor,claude,copilot,all`);
  console.log(`  ${c.green}--preset <name>${c.reset}       Architecture preset: enterprise-ddd, rapid-prototype, standard`);
  console.log(`  ${c.green}--type <type>${c.reset}         Project type: greenfield, brownfield`);
  console.log(`  ${c.green}--force${c.reset}               Overwrite existing files without prompting\n`);
}

function parseArgs(args) {
  const flags = {
    command: 'init',
    yes: false,
    tools: null,
    preset: null,
    type: null,
    force: false,
    help: false,
    version: false
  };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h' || arg === 'help') flags.help = true;
    else if (arg === '--version' || arg === '-v' || arg === 'version') flags.version = true;
    else if (arg === '-y' || arg === '--yes') flags.yes = true;
    else if (arg === '--force') flags.force = true;
    else if (arg.startsWith('--tools=')) flags.tools = arg.split('=')[1].toLowerCase().split(',');
    else if (arg === '--tools' && args[i + 1]) flags.tools = args[++i].toLowerCase().split(',');
    else if (arg.startsWith('--preset=')) flags.preset = arg.split('=')[1].toLowerCase();
    else if (arg === '--preset' && args[i + 1]) flags.preset = args[++i].toLowerCase();
    else if (arg.startsWith('--type=')) flags.type = arg.split('=')[1].toLowerCase();
    else if (arg === '--type' && args[i + 1]) flags.type = args[++i].toLowerCase();
    else if (arg.startsWith('--target-dir=')) flags.targetDir = path.resolve(arg.split('=')[1]);
    else if (arg === '--target-dir' && args[i + 1]) flags.targetDir = path.resolve(args[++i]);
    else if (!arg.startsWith('-')) positional.push(arg);
  }

  if (positional.length > 0) flags.command = positional[0].toLowerCase();
  return flags;
}

function commandSync(workspaceDir = TARGET_DIR) {
  console.log(BANNER);
  console.log(`${c.bold}🔄 Synchronizing Cross-Tool Rules & Instructions...${c.reset}`);
  const syncModule = require(path.join(PACKAGE_ROOT, 'scripts', 'sync-tools.js'));
  const res = syncModule.runSynchronizer(['all'], workspaceDir, false, path.join(PACKAGE_ROOT, '.agents', 'skills'));
  if (res.updated && res.updated.length > 0) {
    console.log(`${c.green}${c.bold}✔ Synchronized ${res.updated.length} configs from .agents/AGENTS.md:${c.reset}`);
    for (const r of res.updated) console.log(`   ${c.green}+${c.reset} ${r}`);
  } else {
    console.log(`${c.yellow}! No configurations were updated.${c.reset}`);
  }
}

function commandStatus(workspaceDir = TARGET_DIR) {
  console.log(BANNER);
  console.log(`${c.bold}🔍 AI Dev Pipeline Diagnostics & Health Check${c.reset}`);
  console.log(`   Workspace: ${c.dim}${workspaceDir}${c.reset}\n`);

  const checks = [
    { label: 'Core Standards (.agents/AGENTS.md)', path: path.join(workspaceDir, '.agents', 'AGENTS.md') },
    { label: 'Agent Prompts (prompts/)', path: path.join(workspaceDir, 'prompts') },
    { label: 'Antigravity Skills (.agents/skills/)', path: path.join(workspaceDir, '.agents', 'skills') },
    { label: 'Claude Code Config & Commands (CLAUDE.md & .claude/commands/)', path: path.join(workspaceDir, 'CLAUDE.md') },
    { label: 'Cursor Rules & Skills (.cursorrules & .cursor/rules/)', path: path.join(workspaceDir, '.cursorrules') },
    { label: 'Copilot Instructions & Prompts (.github/copilot-instructions.md & .github/prompts/)', path: path.join(workspaceDir, '.github', 'copilot-instructions.md') },
    { label: 'Anti-Patterns Memory (docs/anti-patterns.md)', path: path.join(workspaceDir, 'docs', 'anti-patterns.md') },
    { label: 'Artifact Store (docs/handoffs, reviews)', path: path.join(workspaceDir, 'docs', 'handoffs') }
  ];

  let healthyCount = 0;
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    if (!exists) {
      console.log(`  ${c.red}✖${c.reset} ${check.label} ${c.yellow}[Missing]${c.reset}`);
      continue;
    }

    healthyCount++;
    let extra = '';
    const totalPrompts = fs.readdirSync(path.join(PACKAGE_ROOT, 'prompts')).filter(f => f.endsWith('.md')).length;
    const totalSkills = fs.readdirSync(path.join(PACKAGE_ROOT, '.agents', 'skills')).filter(f => {
      try { return fs.statSync(path.join(PACKAGE_ROOT, '.agents', 'skills', f)).isDirectory(); } catch { return false; }
    }).length;

    if (check.path.endsWith('prompts')) {
      const count = fs.readdirSync(check.path).filter(f => f.endsWith('.md')).length;
      extra = ` (${count}/${totalPrompts} personas)`;
    } else if (check.path.endsWith('skills')) {
      const count = fs.readdirSync(check.path).filter(f => {
        try { return fs.statSync(path.join(check.path, f)).isDirectory(); } catch { return false; }
      }).length;
      extra = ` (${count}/${totalSkills} skills)`;
    } else if (check.path.endsWith('CLAUDE.md')) {
      const cmdDir = path.join(TARGET_DIR, '.claude', 'commands');
      const count = fs.existsSync(cmdDir) ? fs.readdirSync(cmdDir).filter(f => f.endsWith('.md')).length : 0;
      if (count > 0) extra = ` (${count}/${totalSkills} slash commands)`;
    } else if (check.path.endsWith('.cursorrules')) {
      const rulesDir = path.join(TARGET_DIR, '.cursor', 'rules');
      const count = fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir).filter(f => f.endsWith('.mdc') && f !== 'agents.mdc').length : 0;
      if (count > 0) extra = ` (${count}/${totalSkills} skill rules)`;
    } else if (check.path.endsWith('copilot-instructions.md')) {
      const promptDir = path.join(TARGET_DIR, '.github', 'prompts');
      const count = fs.existsSync(promptDir) ? fs.readdirSync(promptDir).filter(f => f.endsWith('.prompt.md')).length : 0;
      if (count > 0) extra = ` (${count}/${totalSkills} prompt skills)`;
    }
    console.log(`  ${c.green}✔${c.reset} ${check.label}${c.dim}${extra}${c.reset}`);
  }

  const score = Math.round((healthyCount / checks.length) * 100);
  console.log(`\n${c.bold}Pipeline Health Score:${c.reset} ${score === 100 ? c.green : c.yellow}${score}%${c.reset}`);
  console.log(score < 100 ? `\nRun ${c.cyan}npx @kadvsperera/ai-dev-pipeline init${c.reset} to install missing components.\n` : `${c.green}✔ All systems operational across supported AI editors.${c.reset}\n`);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.help) {
    printHelp();
    return;
  }

  if (flags.version) {
    console.log(getPkgVersion());
    return;
  }

  const targetDir = flags.targetDir || TARGET_DIR;

  switch (flags.command) {
    case 'init': {
      const { commandInit } = require('./commands/init');
      await commandInit(flags, { PACKAGE_ROOT, TARGET_DIR: targetDir, BANNER, c });
      break;
    }
    case 'sync':
      commandSync(targetDir);
      break;
    case 'status':
      commandStatus(targetDir);
      break;
    case 'migrate': {
      const { commandMigrate } = require('./commands/migrate');
      await commandMigrate(flags, { PACKAGE_ROOT, TARGET_DIR: targetDir, BANNER, c });
      break;
    }
    case 'eval': {
      const { main: evalMain } = require(path.join(PACKAGE_ROOT, 'scripts', 'eval-harness.js'));
      evalMain();
      break;
    }
    default:
      console.error(`${c.red}Unknown command: ${flags.command}${c.reset}\n`);
      printHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`\n${c.red}✖ Fatal Error:${c.reset}`, err.message);
    process.exit(1);
  });
}

module.exports = { parseArgs, getPkgVersion, main };
