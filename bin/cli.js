#!/usr/bin/env node

/**
 * AI Dev Pipeline CLI Scaffolder
 *
 * Zero-friction, cross-tool SDLC harness initializer.
 * Injects 17 specialized agent personas, 16 skills, and baseline coding standards
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
const readline = require('readline');

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
  blue: supportsColor ? '\x1b[34m' : '',
  magenta: supportsColor ? '\x1b[35m' : '',
  red: supportsColor ? '\x1b[31m' : '',
  gray: supportsColor ? '\x1b[90m' : ''
};

const BANNER = `
${c.cyan}${c.bold}   ___    ____     ____                 ____  _            _ _             
  /   |  /  _/    / __ \\___ _   __     / __ \\(_)___  ___  / (_)___  ___    
 / /| |  / /_____/ / / / _ \\ | / /____/ /_/ / / __ \\/ _ \\/ / / __ \\/ _ \\   
/ ___ |_/ /_____/ /_/ /  __/ |/ /_____/ ____/ / /_/ /  __/ / / / / /  __/   
/_/  |_/___/    /_____/\\___/|___/     /_/   /_/ .___/\\___/_/_/_/ /_/\\___/    
                                             /_/                             ${c.reset}
${c.dim}  The Industrial-Grade, Cross-Tool SDLC Harness for AI Coding Agents${c.reset}
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
  console.log(`  ${c.cyan}help, --help, -h${c.reset}      Show this help message`);
  console.log(`  ${c.cyan}version, -v${c.reset}           Print CLI version\n`);
  console.log(`${c.bold}INIT OPTIONS:${c.reset}`);
  console.log(`  ${c.green}-y, --yes${c.reset}             Non-interactive mode with standard defaults`);
  console.log(`  ${c.green}--tools <list>${c.reset}        Comma-separated tools: antigravity,cursor,claude,copilot,all`);
  console.log(`  ${c.green}--preset <name>${c.reset}       Architecture preset: enterprise-ddd, rapid-prototype, standard`);
  console.log(`  ${c.green}--type <type>${c.reset}         Project type: greenfield, brownfield`);
  console.log(`  ${c.green}--force${c.reset}               Overwrite existing files without prompting\n`);
  console.log(`${c.bold}EVALUATION OPTIONS:${c.reset}`);
  console.log(`  ${c.green}--threshold <score>${c.reset}   Minimum passing reliability score for CI (default: 80)`);
  console.log(`  ${c.green}--task <id>${c.reset}           Target task ID to evaluate (e.g. TASK-001)`);
  console.log(`  ${c.green}--benchmark${c.reset}           Run built-in benchmark test scenarios`);
  console.log(`  ${c.green}--json${c.reset}                Emit machine-readable JSON evaluation report\n`);
  console.log(`${c.bold}EXAMPLES:${c.reset}`);
  console.log(`  ${c.dim}# Interactive setup wizard in current directory:${c.reset}`);
  console.log(`  npx @kadvsperera/ai-dev-pipeline init\n`);
  console.log(`  ${c.dim}# Evaluate current repository against architecture & anti-patterns:${c.reset}`);
  console.log(`  npx @kadvsperera/ai-dev-pipeline eval\n`);
  console.log(`  ${c.dim}# Run CI quality gate on task with strict threshold:${c.reset}`);
  console.log(`  npx @kadvsperera/ai-dev-pipeline eval --task TASK-001 --threshold 90\n`);
  console.log(`  ${c.dim}# Update cross-tool configs after editing AGENTS.md:${c.reset}`);
  console.log(`  npx @kadvsperera/ai-dev-pipeline sync\n`);
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
    if (arg === '--help' || arg === '-h' || arg === 'help') {
      flags.help = true;
    } else if (arg === '--version' || arg === '-v' || arg === 'version') {
      flags.version = true;
    } else if (arg === '-y' || arg === '--yes') {
      flags.yes = true;
    } else if (arg === '--force') {
      flags.force = true;
    } else if (arg.startsWith('--tools=')) {
      flags.tools = arg.split('=')[1].toLowerCase().split(',');
    } else if (arg === '--tools' && args[i + 1]) {
      flags.tools = args[++i].toLowerCase().split(',');
    } else if (arg.startsWith('--preset=')) {
      flags.preset = arg.split('=')[1].toLowerCase();
    } else if (arg === '--preset' && args[i + 1]) {
      flags.preset = args[++i].toLowerCase();
    } else if (arg.startsWith('--type=')) {
      flags.type = arg.split('=')[1].toLowerCase();
    } else if (arg === '--type' && args[i + 1]) {
      flags.type = args[++i].toLowerCase();
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    flags.command = positional[0].toLowerCase();
  }

  return flags;
}

// Copy helper with recursion
function copyDirSync(src, dest, force = true) {
  if (!fs.existsSync(src)) return 0;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirSync(srcPath, destPath, force);
    } else {
      if (!fs.existsSync(destPath) || force) {
        fs.copyFileSync(srcPath, destPath);
        count++;
      }
    }
  }
  return count;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Synchronizer helper (delegates to scripts/sync-tools.js)
function runSynchronizer(tools, targetDir = TARGET_DIR) {
  const syncModule = require(path.join(PACKAGE_ROOT, 'scripts', 'sync-tools.js'));
  const res = syncModule.runSynchronizer(tools, targetDir, false, path.join(PACKAGE_ROOT, '.agents', 'skills'));
  if (res.error) {
    console.error(`${c.red}✖ Error:${c.reset} ${res.error}`);
    return [];
  }
  return res.updated;
}

// Interactive Prompt Wrapper
async function askQuestion(rl, question, defaultAnswer) {
  const answer = await rl.question(question);
  const trimmed = answer.trim();
  return trimmed || defaultAnswer;
}

// Subcommand: INIT
async function commandInit(flags) {
  console.log(BANNER);

  let selectedTools = flags.tools;
  let selectedPreset = flags.preset;
  let selectedType = flags.type;
  const isYesMode = flags.yes;

  if (!isYesMode && (!selectedTools || !selectedPreset || !selectedType)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`${c.bold}⚙ Interactive Setup Wizard${c.reset}\n`);

    if (!selectedTools) {
      console.log(`${c.bold}1. Which AI coding tools do you use in this project?${c.reset}`);
      console.log(`   ${c.cyan}1)${c.reset} All (${c.green}Antigravity + Cursor + Claude Code + Copilot${c.reset}) ${c.yellow}[Recommended]${c.reset}`);
      console.log(`   ${c.cyan}2)${c.reset} Antigravity (Google)`);
      console.log(`   ${c.cyan}3)${c.reset} Cursor`);
      console.log(`   ${c.cyan}4)${c.reset} Claude Code`);
      console.log(`   ${c.cyan}5)${c.reset} GitHub Copilot`);
      const toolChoice = await askQuestion(rl, `   Select option [1-5, default 1]: `, '1');

      if (toolChoice === '1') selectedTools = ['antigravity', 'cursor', 'claude', 'copilot'];
      else if (toolChoice === '2') selectedTools = ['antigravity'];
      else if (toolChoice === '3') selectedTools = ['cursor'];
      else if (toolChoice === '4') selectedTools = ['claude'];
      else if (toolChoice === '5') selectedTools = ['copilot'];
      else selectedTools = ['antigravity', 'cursor', 'claude', 'copilot'];
      console.log('');
    }

    if (!selectedType) {
      console.log(`${c.bold}2. What type of project is this?${c.reset}`);
      console.log(`   ${c.cyan}1)${c.reset} Greenfield (New project — sets up clean architecture & task templates) ${c.yellow}[Default]${c.reset}`);
      console.log(`   ${c.cyan}2)${c.reset} Brownfield (Existing codebase — pre-configures Agent 15 Codebase Onboarder)`);
      const typeChoice = await askQuestion(rl, `   Select option [1-2, default 1]: `, '1');
      selectedType = typeChoice === '2' ? 'brownfield' : 'greenfield';
      console.log('');
    }

    if (!selectedPreset) {
      console.log(`${c.bold}3. Architectural Style & Quality Strictness:${c.reset}`);
      console.log(`   ${c.cyan}1)${c.reset} Enterprise DDD (Strict boundaries, ruthless linter checks, high test rigor) ${c.yellow}[Recommended]${c.reset}`);
      console.log(`   ${c.cyan}2)${c.reset} Rapid Prototype (Fast iteration, lenient gates, standard test suite)`);
      console.log(`   ${c.cyan}3)${c.reset} Standard (Balanced modular principles)`);
      const presetChoice = await askQuestion(rl, `   Select option [1-3, default 1]: `, '1');
      if (presetChoice === '2') selectedPreset = 'rapid-prototype';
      else if (presetChoice === '3') selectedPreset = 'standard';
      else selectedPreset = 'enterprise-ddd';
      console.log('');
    }

    rl.close();
  } else {
    // Defaults for -y mode
    if (!selectedTools) selectedTools = ['antigravity', 'cursor', 'claude', 'copilot'];
    if (!selectedPreset) selectedPreset = 'enterprise-ddd';
    if (!selectedType) selectedType = 'greenfield';
  }

  console.log(`${c.bold}🚀 Initializing AI Dev Pipeline...${c.reset}`);
  console.log(`   Target Directory: ${c.dim}${TARGET_DIR}${c.reset}`);
  console.log(`   Selected Tools:   ${c.green}${selectedTools.join(', ')}${c.reset}`);
  console.log(`   Project Type:     ${c.cyan}${selectedType}${c.reset}`);
  console.log(`   Quality Preset:   ${c.magenta}${selectedPreset}${c.reset}\n`);

  const createdFiles = [];

  // 1. Core standards (.agents/AGENTS.md)
  const targetAgentsDir = path.join(TARGET_DIR, '.agents');
  ensureDir(targetAgentsDir);
  const srcAgentsMd = path.join(PACKAGE_ROOT, '.agents', 'AGENTS.md');
  const destAgentsMd = path.join(targetAgentsDir, 'AGENTS.md');

  if (fs.existsSync(srcAgentsMd)) {
    fs.copyFileSync(srcAgentsMd, destAgentsMd);
    createdFiles.push('.agents/AGENTS.md');
  }

  // 2. Prompts (all 17 agent personas)
  const targetPromptsDir = path.join(TARGET_DIR, 'prompts');
  const srcPromptsDir = path.join(PACKAGE_ROOT, 'prompts');
  if (fs.existsSync(srcPromptsDir)) {
    const copiedCount = copyDirSync(srcPromptsDir, targetPromptsDir, flags.force);
    createdFiles.push(`prompts/ (${copiedCount} agent personas)`);
  }

  // 3. Docs templates & memory bank
  const targetDocsDir = path.join(TARGET_DIR, 'docs');
  ensureDir(targetDocsDir);

  const srcAntiPatterns = path.join(PACKAGE_ROOT, 'docs', 'anti-patterns.md');
  const destAntiPatterns = path.join(targetDocsDir, 'anti-patterns.md');
  if (fs.existsSync(srcAntiPatterns) && (!fs.existsSync(destAntiPatterns) || flags.force)) {
    fs.copyFileSync(srcAntiPatterns, destAntiPatterns);
    createdFiles.push('docs/anti-patterns.md');
  }

  const srcRoadmap = path.join(PACKAGE_ROOT, 'docs', 'pipeline-roadmap.md');
  const destRoadmap = path.join(targetDocsDir, 'pipeline-roadmap.md');
  if (fs.existsSync(srcRoadmap) && (!fs.existsSync(destRoadmap) || flags.force)) {
    fs.copyFileSync(srcRoadmap, destRoadmap);
    createdFiles.push('docs/pipeline-roadmap.md');
  }

  // Subdirectories for artifacts
  const subDirs = ['handoffs', 'reviews', 'test-reports', 'deploy', 'documentation'];
  for (const dir of subDirs) {
    const fullSubDir = path.join(targetDocsDir, dir);
    if (!fs.existsSync(fullSubDir)) {
      ensureDir(fullSubDir);
      // Create a .gitkeep so git preserves empty directories
      fs.writeFileSync(path.join(fullSubDir, '.gitkeep'), '', 'utf8');
    }
  }
  createdFiles.push(`docs/ (${subDirs.join(', ')})`);

  // 4. Antigravity Skills & Security Hooks (if selected)
  if (selectedTools.includes('antigravity') || selectedTools.includes('all')) {
    const srcSkillsDir = path.join(PACKAGE_ROOT, '.agents', 'skills');
    const targetSkillsDir = path.join(TARGET_DIR, '.agents', 'skills');
    if (fs.existsSync(srcSkillsDir)) {
      const skillsCount = copyDirSync(srcSkillsDir, targetSkillsDir, flags.force);
      createdFiles.push(`.agents/skills/ (${skillsCount} skill files)`);
    }

    const srcHooks = path.join(PACKAGE_ROOT, '.agents', 'hooks.json');
    const destHooks = path.join(targetAgentsDir, 'hooks.json');
    if (fs.existsSync(srcHooks) && (!fs.existsSync(destHooks) || flags.force)) {
      fs.copyFileSync(srcHooks, destHooks);
      createdFiles.push('.agents/hooks.json');
    }

    const srcAgentScripts = path.join(PACKAGE_ROOT, '.agents', 'scripts');
    const destAgentScripts = path.join(targetAgentsDir, 'scripts');
    if (fs.existsSync(srcAgentScripts)) {
      copyDirSync(srcAgentScripts, destAgentScripts, flags.force);
      createdFiles.push('.agents/scripts/');
    }
  }

  // 5. Cross-Tool Rule Synchronizers (CLAUDE.md, .cursorrules, .cursor/rules, copilot)
  const syncResults = runSynchronizer(selectedTools, TARGET_DIR);
  if (syncResults && syncResults.length > 0) {
    createdFiles.push(...syncResults);
  }

  // 6. Project Helper Scripts (scripts/sync-tools.js & scripts/eval-harness.js)
  const targetScriptsDir = path.join(TARGET_DIR, 'scripts');
  ensureDir(targetScriptsDir);
  const srcSyncScript = path.join(PACKAGE_ROOT, 'scripts', 'sync-tools.js');
  const destSyncScript = path.join(targetScriptsDir, 'sync-tools.js');
  if (fs.existsSync(srcSyncScript)) {
    fs.copyFileSync(srcSyncScript, destSyncScript);
    createdFiles.push('scripts/sync-tools.js');
  }

  const srcEvalScript = path.join(PACKAGE_ROOT, 'scripts', 'eval-harness.js');
  const destEvalScript = path.join(targetScriptsDir, 'eval-harness.js');
  if (fs.existsSync(srcEvalScript)) {
    fs.copyFileSync(srcEvalScript, destEvalScript);
    createdFiles.push('scripts/eval-harness.js');
  }

  // 7. Update target project package.json if present
  const targetPkgPath = path.join(TARGET_DIR, 'package.json');
  if (fs.existsSync(targetPkgPath)) {
    try {
      const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'));
      targetPkg.scripts = targetPkg.scripts || {};
      let modifiedPkg = false;
      if (!targetPkg.scripts['sync-tools']) {
        targetPkg.scripts['sync-tools'] = 'node scripts/sync-tools.js';
        modifiedPkg = true;
      }
      if (!targetPkg.scripts['eval']) {
        targetPkg.scripts['eval'] = 'node scripts/eval-harness.js';
        modifiedPkg = true;
      }
      if (modifiedPkg) {
        fs.writeFileSync(targetPkgPath, JSON.stringify(targetPkg, null, 2) + '\n', 'utf8');
        createdFiles.push('package.json (configured "sync-tools" & "eval" scripts)');
      }
    } catch {
      // Ignore if user package.json is invalid JSON
    }
  }

  console.log(`${c.green}${c.bold}✔ Successfully scaffolded AI Dev Pipeline:${c.reset}`);
  for (const f of createdFiles) {
    console.log(`   ${c.green}+${c.reset} ${f}`);
  }

  console.log(`\n${c.bold}🎉 Setup Complete!${c.reset}`);
  if (selectedType === 'brownfield') {
    console.log(`\n${c.yellow}👉 Brownfield Next Step:${c.reset}`);
    console.log(`   Run the Codebase Onboarder to map your architecture:`);
    console.log(`   ${c.cyan}sdlc-onboard${c.reset}  or check ${c.dim}prompts/15-codebase-onboarder.md${c.reset}`);
  } else {
    console.log(`\n${c.yellow}👉 Greenfield Next Step:${c.reset}`);
    console.log(`   Start planning your first feature:`);
    console.log(`   ${c.cyan}sdlc-plan: [your project idea]${c.reset}  or check ${c.dim}prompts/00-product-strategist.md${c.reset}`);
  }

  console.log(`\n${c.dim}Need to re-sync rules across tools later? Run:${c.reset}`);
  console.log(`   ${c.cyan}npx @kadvsperera/ai-dev-pipeline sync${c.reset}  or  ${c.cyan}npm run sync-tools${c.reset}\n`);
}

// Subcommand: SYNC
function commandSync() {
  console.log(`${c.bold}🔄 Synchronizing Cross-Tool Configurations...${c.reset}\n`);
  const results = runSynchronizer(['all'], TARGET_DIR);
  if (results && results.length > 0) {
    console.log(`${c.green}${c.bold}✔ Synchronized the following configs from .agents/AGENTS.md:${c.reset}`);
    for (const r of results) {
      console.log(`   ${c.green}+${c.reset} ${r}`);
    }
    console.log(`\nYour AI coding standards are now up to date across all editors.`);
  } else {
    console.log(`${c.yellow}! No configurations were updated.${c.reset}`);
  }
}

// Subcommand: STATUS
function commandStatus() {
  console.log(BANNER);
  console.log(`${c.bold}🔍 AI Dev Pipeline Diagnostics & Health Check${c.reset}`);
  console.log(`   Workspace: ${c.dim}${TARGET_DIR}${c.reset}\n`);

  const checks = [
    { label: 'Core Standards (.agents/AGENTS.md)', path: path.join(TARGET_DIR, '.agents', 'AGENTS.md') },
    { label: 'Agent Prompts (prompts/)', path: path.join(TARGET_DIR, 'prompts') },
    { label: 'Antigravity Skills (.agents/skills/)', path: path.join(TARGET_DIR, '.agents', 'skills') },
    { label: 'Claude Code Config & Commands (CLAUDE.md & .claude/commands/)', path: path.join(TARGET_DIR, 'CLAUDE.md') },
    { label: 'Cursor Rules & Skills (.cursorrules & .cursor/rules/)', path: path.join(TARGET_DIR, '.cursorrules') },
    { label: 'Copilot Instructions & Prompts (.github/copilot-instructions.md & .github/prompts/)', path: path.join(TARGET_DIR, '.github', 'copilot-instructions.md') },
    { label: 'Anti-Patterns Memory (docs/anti-patterns.md)', path: path.join(TARGET_DIR, 'docs', 'anti-patterns.md') },
    { label: 'Pipeline Roadmap (docs/pipeline-roadmap.md)', path: path.join(TARGET_DIR, 'docs', 'pipeline-roadmap.md') }
  ];

  let healthyCount = 0;
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    if (exists) {
      healthyCount++;
      let extra = '';
      if (check.path.endsWith('prompts')) {
        const count = fs.readdirSync(check.path).filter(f => f.endsWith('.md')).length;
        extra = ` (${count}/17 personas)`;
      } else if (check.path.endsWith('skills')) {
        const count = fs.readdirSync(check.path).filter(f => {
          try { return fs.statSync(path.join(check.path, f)).isDirectory(); } catch { return false; }
        }).length;
        extra = ` (${count}/16 skills)`;
      } else if (check.path.endsWith('CLAUDE.md')) {
        const cmdDir = path.join(TARGET_DIR, '.claude', 'commands');
        const count = fs.existsSync(cmdDir) ? fs.readdirSync(cmdDir).filter(f => f.endsWith('.md')).length : 0;
        if (count > 0) extra = ` (${count}/16 slash commands)`;
      } else if (check.path.endsWith('.cursorrules')) {
        const rulesDir = path.join(TARGET_DIR, '.cursor', 'rules');
        const count = fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir).filter(f => f.endsWith('.mdc') && f !== 'agents.mdc').length : 0;
        if (count > 0) extra = ` (${count}/16 skill rules)`;
      } else if (check.path.endsWith('copilot-instructions.md')) {
        const promptDir = path.join(TARGET_DIR, '.github', 'prompts');
        const count = fs.existsSync(promptDir) ? fs.readdirSync(promptDir).filter(f => f.endsWith('.prompt.md')).length : 0;
        if (count > 0) extra = ` (${count}/16 prompt skills)`;
      }
      console.log(`  ${c.green}✔${c.reset} ${check.label}${c.dim}${extra}${c.reset}`);
    } else {
      console.log(`  ${c.red}✖${c.reset} ${check.label} ${c.yellow}[Missing]${c.reset}`);
    }
  }

  const score = Math.round((healthyCount / checks.length) * 100);
  console.log(`\n${c.bold}Pipeline Health Score:${c.reset} ${score === 100 ? c.green : c.yellow}${score}%${c.reset}`);

  if (score < 100) {
    console.log(`\n${c.dim}Run ${c.cyan}npx @kadvsperera/ai-dev-pipeline init${c.dim} to install missing components.${c.reset}\n`);
  } else {
    console.log(`${c.green}✔ All systems operational across supported AI editors.${c.reset}\n`);
  }
}

// Main CLI Entry Point
async function main() {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.help) {
    printHelp();
    return;
  }

  if (flags.version) {
    console.log(`ai-dev-pipeline v${getPkgVersion()}`);
    return;
  }

  switch (flags.command) {
    case 'eval': {
      const { main: evalMain } = require(path.join(PACKAGE_ROOT, 'scripts', 'eval-harness.js'));
      evalMain();
      break;
    }
    case 'sync':
      commandSync();
      break;
    case 'status':
      commandStatus();
      break;
    case 'init':
    default:
      await commandInit(flags);
      break;
  }
}

main().catch(err => {
  console.error(`\n${c.red}✖ Fatal Error:${c.reset}`, err.message);
  process.exit(1);
});
