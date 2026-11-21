#!/usr/bin/env node

/**
 * scripts/check-release.js — Release & Completeness Audit Command
 *
 * Mechanically verifies whether all release artifacts, documentation,
 * cross-tool configurations, versions, and global plugin mirrors
 * are completely in sync and ready for release.
 *
 * Usage:
 *   node scripts/check-release.js
 *   npm run check:release
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { runSynchronizer } = require('./sync-tools');

const ROOT_DIR = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function checkCrossToolSync(rootDir = ROOT_DIR) {
  try {
    const results = runSynchronizer(['all'], rootDir, true);
    if (results.outOfSync.length === 0) {
      return {
        passed: true,
        label: 'Cross-Tool Parity',
        details: `All ${results.upToDate.length} editor configs across Claude, Cursor, and Copilot match source standards`
      };
    }
    return {
      passed: false,
      label: 'Cross-Tool Parity',
      details: `${results.outOfSync.length} files out of sync. Fix: npm run sync-tools`
    };
  } catch (err) {
    return {
      passed: false,
      label: 'Cross-Tool Parity',
      details: `Failed to check cross-tool parity: ${err.message}`
    };
  }
}

function checkVersionAndChangelog(rootDir = ROOT_DIR) {
  try {
    const pkgPath = path.join(rootDir, 'package.json');
    const changelogPath = path.join(rootDir, 'CHANGELOG.md');

    if (!fs.existsSync(pkgPath)) {
      return { passed: false, label: 'Version & Changelog', details: 'package.json not found' };
    }
    if (!fs.existsSync(changelogPath)) {
      return { passed: false, label: 'Version & Changelog', details: 'CHANGELOG.md not found' };
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const version = pkg.version;
    const changelog = fs.readFileSync(changelogPath, 'utf8');

    const escapedVersion = version.replace(/\./g, '\\.');
    const versionPattern = new RegExp(`^##\\s*\\[?v?${escapedVersion}\\]?`, 'm');

    if (versionPattern.test(changelog)) {
      return {
        passed: true,
        label: 'Version & Changelog Parity',
        details: `v${version} declared in package.json and documented in CHANGELOG.md`
      };
    }

    return {
      passed: false,
      label: 'Version & Changelog Parity',
      details: `v${version} in package.json has no matching '## [${version}]' entry in CHANGELOG.md`
    };
  } catch (err) {
    return { passed: false, label: 'Version & Changelog Parity', details: err.message };
  }
}

function checkCountAlignment(rootDir = ROOT_DIR) {
  try {
    const promptsDir = path.join(rootDir, 'prompts');
    const skillsDir = path.join(rootDir, '.agents', 'skills');

    const actualPrompts = fs.existsSync(promptsDir)
      ? fs.readdirSync(promptsDir).filter(f => f.endsWith('.md')).length
      : 0;

    const actualSkills = fs.existsSync(skillsDir)
      ? fs.readdirSync(skillsDir).filter(f => {
        try { return fs.statSync(path.join(skillsDir, f)).isDirectory(); } catch { return false; }
      }).length
      : 0;

    const readmePath = path.join(rootDir, 'README.md');
    const cheatsheetPath = path.join(rootDir, 'bin', 'commands', 'cheatsheet.js');

    const mismatches = [];

    if (fs.existsSync(readmePath)) {
      const readme = fs.readFileSync(readmePath, 'utf8');
      const expectedSkillRegex = new RegExp(`\\b${actualSkills}\\s*skills\\b`, 'i');
      const expectedPersonaRegex = new RegExp(`\\b${actualPrompts}\\s*specialised\\s*agent\\s*personas\\b`, 'i');

      if (!expectedSkillRegex.test(readme)) {
        mismatches.push(`README.md does not reflect ${actualSkills} skills`);
      }
      if (!expectedPersonaRegex.test(readme)) {
        mismatches.push(`README.md does not reflect ${actualPrompts} agent personas`);
      }
    }

    if (fs.existsSync(cheatsheetPath)) {
      const cheatsheet = fs.readFileSync(cheatsheetPath, 'utf8');
      const expectedSkillRegex = new RegExp(`\\b${actualSkills}\\s*Skills\\b`, 'i');
      if (!expectedSkillRegex.test(cheatsheet)) {
        mismatches.push(`bin/commands/cheatsheet.js does not reflect ${actualSkills} skills`);
      }
    }

    if (mismatches.length === 0) {
      return {
        passed: true,
        label: 'Skill & Persona Count Parity',
        details: `Verified ${actualPrompts} personas and ${actualSkills} skills across prompts, skills, README, and cheatsheet`
      };
    }

    return {
      passed: false,
      label: 'Skill & Persona Count Parity',
      details: mismatches.join('; ')
    };
  } catch (err) {
    return { passed: false, label: 'Skill & Persona Count Parity', details: err.message };
  }
}

function checkGlobalPluginSync(rootDir = ROOT_DIR) {
  try {
    const globalPluginDir = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'ai-dev-pipeline');

    if (!fs.existsSync(globalPluginDir)) {
      return {
        passed: true,
        label: 'Global Antigravity Plugin',
        details: 'Global plugin directory not installed (standalone workspace mode)'
      };
    }

    const localPkgPath = path.join(rootDir, 'package.json');
    const globalPkgPath = path.join(globalPluginDir, 'package.json');

    const localVersion = fs.existsSync(localPkgPath) ? JSON.parse(fs.readFileSync(localPkgPath, 'utf8')).version : null;
    const globalVersion = fs.existsSync(globalPkgPath) ? JSON.parse(fs.readFileSync(globalPkgPath, 'utf8')).version : null;

    const localSkillsDir = path.join(rootDir, '.agents', 'skills');
    const globalSkillsDir = path.join(globalPluginDir, 'skills');

    const localSkillCount = fs.existsSync(localSkillsDir)
      ? fs.readdirSync(localSkillsDir).filter(f => {
        try { return fs.statSync(path.join(localSkillsDir, f)).isDirectory(); } catch { return false; }
      }).length
      : 0;

    const globalSkillCount = fs.existsSync(globalSkillsDir)
      ? fs.readdirSync(globalSkillsDir).filter(f => {
        try { return fs.statSync(path.join(globalSkillsDir, f)).isDirectory(); } catch { return false; }
      }).length
      : 0;

    const isVersionSync = !localVersion || !globalVersion || localVersion === globalVersion;
    const isSkillsSync = localSkillCount === globalSkillCount;

    if (isVersionSync && isSkillsSync) {
      return {
        passed: true,
        label: 'Global Antigravity Plugin',
        details: `Global plugin (${globalPluginDir}) matches workspace (${globalSkillCount} skills, v${globalVersion || localVersion})`
      };
    }

    const diffs = [];
    if (!isVersionSync) diffs.push(`Version mismatch: local v${localVersion} vs global v${globalVersion}`);
    if (!isSkillsSync) diffs.push(`Skills count mismatch: local ${localSkillCount} vs global ${globalSkillCount}`);

    return {
      passed: false,
      label: 'Global Antigravity Plugin',
      details: `${diffs.join(', ')}. Fix: node bin/cli.js sync --global`
    };
  } catch (err) {
    return { passed: false, label: 'Global Antigravity Plugin', details: err.message };
  }
}

function checkGitStatus(rootDir = ROOT_DIR) {
  try {
    const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!status) {
      return {
        passed: true,
        label: 'Git Working Tree',
        details: 'Working tree clean, all files staged/committed'
      };
    }
    const lines = status.split('\n').filter(Boolean);
    return {
      passed: true, // Non-fatal warning for audit
      isWarning: true,
      label: 'Git Working Tree',
      details: `${lines.length} uncommitted file(s) in working tree`
    };
  } catch {
    return {
      passed: true,
      label: 'Git Working Tree',
      details: 'Git repository check skipped (not a git repository or git unavailable)'
    };
  }
}

function runReleaseAudit(rootDir = ROOT_DIR) {
  const checks = [
    checkCrossToolSync(rootDir),
    checkVersionAndChangelog(rootDir),
    checkCountAlignment(rootDir),
    checkGlobalPluginSync(rootDir),
    checkGitStatus(rootDir)
  ];

  const allPassed = checks.every(c => c.passed);

  console.log(`\n${colors.bold}${colors.cyan}🔍 AI Dev Pipeline Release & Sync Completeness Audit${colors.reset}`);
  console.log(`${colors.dim}   Auditing repository at: ${rootDir}${colors.reset}\n`);

  checks.forEach(check => {
    if (check.isWarning) {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${colors.bold}${check.label}:${colors.reset} ${colors.dim}${check.details}${colors.reset}`);
    } else if (check.passed) {
      console.log(`  ${colors.green}✔${colors.reset} ${colors.bold}${check.label}:${colors.reset} ${colors.dim}${check.details}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✖${colors.reset} ${colors.bold}${check.label}:${colors.reset} ${colors.yellow}${check.details}${colors.reset}`);
    }
  });

  console.log(`\n${colors.bold}Release Readiness Status:${colors.reset} ${allPassed ? `${colors.green}READY FOR RELEASE ✔${colors.reset}` : `${colors.red}ACTION REQUIRED ✖${colors.reset}`}\n`);

  return { passed: allPassed, checks };
}

if (require.main === module) {
  const result = runReleaseAudit(ROOT_DIR);
  if (!result.passed) {
    process.exit(1);
  }
}

module.exports = {
  checkCrossToolSync,
  checkVersionAndChangelog,
  checkCountAlignment,
  checkGlobalPluginSync,
  checkGitStatus,
  runReleaseAudit
};
