/**
 * bin/commands/init.js — Interactive and headless scaffolder for AI Dev Pipeline
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

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

async function askQuestion(rl, question, defaultAnswer) {
  const answer = await rl.question(question);
  const trimmed = answer.trim();
  return trimmed || defaultAnswer;
}

async function promptWizard(flags, c) {
  let selectedTools = flags.tools;
  let selectedPreset = flags.preset;
  let selectedType = flags.type;

  if (!flags.yes && (!selectedTools || !selectedPreset || !selectedType)) {
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

      if (toolChoice === '2') selectedTools = ['antigravity'];
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
    if (!selectedTools) selectedTools = ['antigravity', 'cursor', 'claude', 'copilot'];
    if (!selectedPreset) selectedPreset = 'enterprise-ddd';
    if (!selectedType) selectedType = 'greenfield';
  }

  return { selectedTools, selectedPreset, selectedType };
}

async function commandInit(flags, context) {
  const { PACKAGE_ROOT, TARGET_DIR, BANNER, c } = context;
  console.log(BANNER);

  const { selectedTools, selectedPreset, selectedType } = await promptWizard(flags, c);

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

  const subDirs = ['handoffs', 'reviews', 'test-reports', 'deploy', 'documentation'];
  for (const dir of subDirs) {
    const fullSubDir = path.join(targetDocsDir, dir);
    if (!fs.existsSync(fullSubDir)) {
      ensureDir(fullSubDir);
      fs.writeFileSync(path.join(fullSubDir, '.gitkeep'), '', 'utf8');
    }
  }
  createdFiles.push(`docs/ (${subDirs.join(', ')})`);

  // 4. Antigravity Skills & Security Hooks
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

  // 5. Cross-Tool Rule Synchronizers
  const syncModule = require(path.join(PACKAGE_ROOT, 'scripts', 'sync-tools.js'));
  const syncRes = syncModule.runSynchronizer(selectedTools, TARGET_DIR, false, path.join(PACKAGE_ROOT, '.agents', 'skills'));
  if (syncRes && syncRes.updated && syncRes.updated.length > 0) {
    createdFiles.push(...syncRes.updated);
  }

  // 6. Project Helper Scripts
  const targetScriptsDir = path.join(TARGET_DIR, 'scripts');
  ensureDir(targetScriptsDir);
  for (const scriptName of ['sync-tools.js', 'eval-harness.js', 'eval-reporters.js']) {
    const src = path.join(PACKAGE_ROOT, 'scripts', scriptName);
    const dest = path.join(targetScriptsDir, scriptName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      createdFiles.push(`scripts/${scriptName}`);
    }
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
      // Ignore package.json modification errors
    }
  }

  console.log(`${c.green}${c.bold}✔ AI Dev Pipeline successfully initialized!${c.reset}\n`);
  console.log(`${c.bold}Artifacts Installed:${c.reset}`);
  for (const item of createdFiles) {
    console.log(`   ${c.green}+${c.reset} ${item}`);
  }

  console.log(`\n${c.bold}Next Steps:${c.reset}`);
  if (selectedType === 'brownfield') {
    console.log(`  1. Run the Codebase Onboarder to reverse-engineer architecture:`);
    console.log(`     ${c.cyan}/sdlc-onboard${c.reset} (in chat) or invoke Agent 15`);
  } else {
    console.log(`  1. Define your product strategy and requirements:`);
    console.log(`     ${c.cyan}/sdlc-plan [your idea]${c.reset} (in chat) or invoke Agent 0`);
  }
  console.log(`  2. Verify your pipeline installation at any time:`);
  console.log(`     ${c.cyan}npx @kadvsperera/ai-dev-pipeline status${c.reset}\n`);
}

module.exports = { commandInit, promptWizard, copyDirSync };
