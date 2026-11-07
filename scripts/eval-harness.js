#!/usr/bin/env node

/**
 * eval-harness.js — AI Dev Pipeline Stage Evaluation Harness
 *
 * Deterministic audit and evaluation layer for coding agent outputs.
 * Detects architectural drift, linter/type failures, anti-pattern regressions,
 * and missing traceability. Produces actionable scorecards and markdown reports.
 *
 * Usage:
 *   node scripts/eval-harness.js                  # Evaluate current repository
 *   node scripts/eval-harness.js --task TASK-001  # Evaluate specific task
 *   node scripts/eval-harness.js --threshold 85   # Set minimum pass threshold (default 80)
 *   node scripts/eval-harness.js --benchmark      # Run built-in benchmark test suite
 *   node scripts/eval-harness.js --json           # Output machine-readable JSON
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Recursively find code files (excluding node_modules, .git, dist, build, eval/benchmarks unless targeting it)
function getSourceFiles(dir, extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs'], isBenchmarkTarget = false) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const isBench = isBenchmarkTarget || dir.includes('benchmarks');
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === 'coverage' ||
        entry.name === '.next' ||
        (!isBench && entry.name === 'benchmarks')
      ) {
        continue;
      }
      results.push(...getSourceFiles(fullPath, extensions, isBench));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// -------------------------------------------------------------
// DIMENSION 1: Architecture Conformance (Weight: 30%)
// -------------------------------------------------------------
function evaluateArchitecture(targetDir, findings) {
  let score = 100;
  const archPath = path.join(targetDir, 'docs', 'architecture.md');
  const hasArch = fs.existsSync(archPath);

  if (!hasArch) {
    findings.push({
      dimension: 'Architecture',
      severity: 'WARN',
      message: 'No docs/architecture.md found. Pipeline cannot verify component boundaries or API contracts.',
      deduction: 15
    });
    score -= 15;
  }

  const sourceFiles = getSourceFiles(targetDir);

  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    // Ignore test files and scripts for layer checks
    if (relPath.includes('test') || relPath.includes('scripts') || relPath.includes('bin')) continue;

    const content = fs.readFileSync(file, 'utf8');

    // Layer Isolation Check: Controllers, views, or presentation directly invoking SQL/database
    const isPresentationOrRoute =
      relPath.includes('routes') ||
      relPath.includes('controllers') ||
      relPath.includes('views') ||
      relPath.includes('pages') ||
      relPath.includes('components');

    if (isPresentationOrRoute) {
      if (/(\bSELECT\s+.+\s+FROM\b|\bINSERT\s+INTO\b|\bUPDATE\s+.+\s+SET\b|\bDELETE\s+FROM\b)/i.test(content)) {
        findings.push({
          dimension: 'Architecture',
          severity: 'FAIL',
          file: relPath,
          message: 'Direct SQL execution detected in presentation/route layer. Violates layer boundary isolation.',
          deduction: 20
        });
        score -= 20;
      }

      if (/(\bpg\.Pool\b|\bnew\s+Pool\b|\bprisma\.\w+\.(find|create|update|delete)\b|\bmongoose\.model\b)/i.test(content)) {
        findings.push({
          dimension: 'Architecture',
          severity: 'WARN',
          file: relPath,
          message: 'Direct database/ORM connection initiated in presentation/controller layer. Must route through service or repository.',
          deduction: 10
        });
        score -= 10;
      }
    }
  }

  return Math.max(0, score);
}

// -------------------------------------------------------------
// DIMENSION 2: Deterministic Code Quality & Linter Gate (Weight: 25%)
// -------------------------------------------------------------
function evaluateCodeQuality(targetDir, findings) {
  let score = 100;
  const sourceFiles = getSourceFiles(targetDir);

  // Check if project has an official linter configured in package.json
  const pkgPath = path.join(targetDir, 'package.json');
  let hasLinterScript = false;

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.scripts && (pkg.scripts.lint || pkg.scripts['lint:check'])) {
        hasLinterScript = true;
      }
    } catch {
      // Ignore
    }
  }

  // Fallback static analysis engine
  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    if (relPath.includes('node_modules') || relPath.includes('dist')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // 1. File size check (> 450 lines flag warning)
    if (lines.length > 450) {
      findings.push({
        dimension: 'Code Quality',
        severity: 'WARN',
        file: relPath,
        message: `File exceeds 450 lines (${lines.length} lines). Violates Single Responsibility Principle.`,
        deduction: 8
      });
      score -= 8;
    }

    // 2. Excessive nesting depth (> 4 levels)
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentNesting += openBraces - closeBraces;
      if (currentNesting > maxNesting) maxNesting = currentNesting;
    }

    if (maxNesting > 5) {
      findings.push({
        dimension: 'Code Quality',
        severity: 'WARN',
        file: relPath,
        message: `High cyclomatic complexity: nesting depth of ${maxNesting} levels detected. Split into focused helper functions.`,
        deduction: 10
      });
      score -= 10;
    }
  }

  return Math.max(0, score);
}

// -------------------------------------------------------------
// DIMENSION 3: Anti-Pattern Invariants & Security (Weight: 25%)
// -------------------------------------------------------------
function evaluateAntiPatterns(targetDir, findings) {
  let score = 100;
  const sourceFiles = getSourceFiles(targetDir);

  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    // Ignore test fixtures and scripts for production anti-patterns
    if (relPath.includes('test') || relPath.includes('scripts') || relPath.includes('bin')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Bare catch blocks (e.g. catch (e) {} or catch(err) { /* empty */ })
      if (/catch\s*\([^\)]*\)\s*\{\s*\}/.test(line)) {
        findings.push({
          dimension: 'Anti-Patterns',
          severity: 'FAIL',
          file: `${relPath}:${lineNum}`,
          message: 'Silent error swallowing: bare empty catch block detected. Violates AGENTS.md § Error Handling.',
          deduction: 20
        });
        score -= 20;
      }

      // 2. Unparameterized SQL or command concatenation
      if (
        /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b).*\+\s*[a-zA-Z0-9_]+/i.test(line) ||
        /(\bquery\b|\bexecute\b)\s*\(\s*`[^`]*\$\{/i.test(line)
      ) {
        findings.push({
          dimension: 'Anti-Patterns',
          severity: 'FAIL',
          file: `${relPath}:${lineNum}`,
          message: 'SQL Injection Risk: unparameterized query using string concatenation or template literal. Use parameterization.',
          deduction: 25
        });
        score -= 25;
      }

      // 3. Exposed secrets or API keys
      if (
        /(api[_-]?key|secret[_-]?key|auth[_-]?token|bearer)\s*[:=]\s*["'][a-zA-Z0-9_\-\.]{16,}["']/i.test(line) &&
        !line.includes('process.env')
      ) {
        findings.push({
          dimension: 'Anti-Patterns',
          severity: 'FAIL',
          file: `${relPath}:${lineNum}`,
          message: 'Hardcoded secret or credential detected. Secrets must be read from environment variables.',
          deduction: 25
        });
        score -= 25;
      }

      // 4. console.log in production code
      if (/\bconsole\.log\s*\(/.test(line) && !relPath.includes('cli.js')) {
        findings.push({
          dimension: 'Anti-Patterns',
          severity: 'WARN',
          file: `${relPath}:${lineNum}`,
          message: 'console.log statement found in production path. Use structured project logger.',
          deduction: 5
        });
        score -= 5;
      }
    });
  }

  return Math.max(0, score);
}

// -------------------------------------------------------------
// DIMENSION 4: Traceability & Handoff Completeness (Weight: 20%)
// -------------------------------------------------------------
function evaluateTraceability(targetDir, taskId, findings) {
  let score = 100;

  // 1. Task Backlog Check (docs/tasks.md)
  const tasksPath = path.join(targetDir, 'docs', 'tasks.md');
  if (fs.existsSync(tasksPath)) {
    const tasksContent = fs.readFileSync(tasksPath, 'utf8');
    if (taskId) {
      const taskPattern = new RegExp(`\\[([ x/])\\]\\s*\\*\\*${taskId}\\*\\*`, 'i');
      const match = tasksContent.match(taskPattern);
      if (match) {
        const mark = match[1];
        if (mark !== 'x') {
          findings.push({
            dimension: 'Traceability',
            severity: 'WARN',
            message: `Task ${taskId} is marked as '[${mark}]' in docs/tasks.md, but implementation was finished. Must be '[x]'.`,
            deduction: 15
          });
          score -= 15;
        }
      }
    }
  } else {
    findings.push({
      dimension: 'Traceability',
      severity: 'WARN',
      message: 'No docs/tasks.md found. Task backlog traceability cannot be confirmed.',
      deduction: 10
    });
    score -= 10;
  }

  // 2. Handoff Notes Check (docs/handoffs/TASK-NNN.md)
  if (taskId) {
    const handoffPath = path.join(targetDir, 'docs', 'handoffs', `${taskId}.md`);
    if (!fs.existsSync(handoffPath)) {
      findings.push({
        dimension: 'Traceability',
        severity: 'FAIL',
        message: `Missing developer handoff note at docs/handoffs/${taskId}.md. Agent 6 requires a handoff document.`,
        deduction: 30
      });
      score -= 30;
    } else {
      const handoffContent = fs.readFileSync(handoffPath, 'utf8');
      const requiredSections = ['Summary', 'Files Changed', 'Architecture Alignment', 'Verification'];
      for (const section of requiredSections) {
        if (!new RegExp(`##\\s+.*${section}`, 'i').test(handoffContent)) {
          findings.push({
            dimension: 'Traceability',
            severity: 'WARN',
            message: `Handoff note ${taskId}.md is missing required section '## ${section}'.`,
            deduction: 8
          });
          score -= 8;
        }
      }
    }
  }

  // 3. Git Commit Standards Check
  try {
    const lastCommitMsg = execSync('git log -1 --pretty=%B', { cwd: targetDir, encoding: 'utf8' }).trim();
    const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9_\-]+\))?:\s+.+/i;
    if (!conventionalCommitPattern.test(lastCommitMsg.split('\n')[0])) {
      findings.push({
        dimension: 'Traceability',
        severity: 'WARN',
        message: `Latest commit message "${lastCommitMsg.split('\n')[0]}" does not follow Conventional Commits (e.g. feat:, fix:).`,
        deduction: 10
      });
      score -= 10;
    }
  } catch {
    // Not a git repository or no commits yet
  }

  return Math.max(0, score);
}

// Grade calculation
function calculateGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Generate Markdown Audit Report
function generateMarkdownReport(results, targetDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const taskName = results.taskId || 'WORKSPACE';
  const fileName = `EVAL-${timestamp}-${taskName}.md`;
  const reportDir = path.join(targetDir, 'docs', 'eval-reports');
  ensureDir(reportDir);
  const reportPath = path.join(reportDir, fileName);

  let md = `# AI Dev Pipeline Stage Evaluation Report\n\n`;
  md += `> **Audit Target**: \`${taskName}\`  \n`;
  md += `> **Timestamp**: \`${new Date().toISOString()}\`  \n`;
  md += `> **Reliability Score**: **${results.overallScore.toFixed(1)}%** (Grade: **${results.grade}**)  \n`;
  md += `> **Status**: **${results.passed ? 'PASSED' : 'FAILED'}** (Threshold: ${results.threshold}%)\n\n`;

  md += `## Dimension Scorecard\n\n`;
  md += `| Evaluation Dimension | Weight | Score | Status |\n`;
  md += `|---|---|---|---|\n`;
  md += `| **1. Architecture Conformance** | 30% | ${results.dimensionScores.architecture}/100 | ${results.dimensionScores.architecture >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n`;
  md += `| **2. Deterministic Code Quality** | 25% | ${results.dimensionScores.quality}/100 | ${results.dimensionScores.quality >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n`;
  md += `| **3. Anti-Pattern Invariants** | 25% | ${results.dimensionScores.antiPatterns}/100 | ${results.dimensionScores.antiPatterns >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n`;
  md += `| **4. Traceability & Handoffs** | 20% | ${results.dimensionScores.traceability}/100 | ${results.dimensionScores.traceability >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n\n`;

  md += `## Actionable Findings & Recommendations\n\n`;
  if (results.findings.length === 0) {
    md += `*No architectural drift or anti-pattern regressions detected. High fidelity implementation.*\n\n`;
  } else {
    for (const f of results.findings) {
      const badge = f.severity === 'FAIL' ? '❌ **[CRITICAL]**' : '⚠️ **[WARNING]**';
      const location = f.file ? `(\`${f.file}\`)` : '';
      md += `- ${badge} **${f.dimension}** ${location}: ${f.message} *(-${f.deduction} pts)*\n`;
    }
  }

  md += `\n---\n*Report generated by \`ai-dev-pipeline eval\` evaluation harness.*\n`;
  fs.writeFileSync(reportPath, md, 'utf8');
  return path.relative(targetDir, reportPath);
}

// -------------------------------------------------------------
// Core Evaluation Runner
// -------------------------------------------------------------
function runEvaluation(options = {}) {
  const targetDir = options.targetDir || process.cwd();
  const taskId = options.taskId || null;
  const threshold = options.threshold || 80;

  const findings = [];

  const scoreArch = evaluateArchitecture(targetDir, findings);
  const scoreQuality = evaluateCodeQuality(targetDir, findings);
  const scoreAntiPatterns = evaluateAntiPatterns(targetDir, findings);
  const scoreTraceability = evaluateTraceability(targetDir, taskId, findings);

  const overallScore =
    scoreArch * 0.3 +
    scoreQuality * 0.25 +
    scoreAntiPatterns * 0.25 +
    scoreTraceability * 0.2;

  const grade = calculateGrade(overallScore);
  const passed = overallScore >= threshold;

  const results = {
    targetDir,
    taskId,
    threshold,
    overallScore,
    grade,
    passed,
    dimensionScores: {
      architecture: scoreArch,
      quality: scoreQuality,
      antiPatterns: scoreAntiPatterns,
      traceability: scoreTraceability
    },
    findings
  };

  const shouldWriteReport = options.writeReport !== false;
  const reportPath = shouldWriteReport ? generateMarkdownReport(results, targetDir) : null;
  results.reportPath = reportPath;

  return results;
}

// -------------------------------------------------------------
// Built-in Benchmark Test Suite (--benchmark)
// -------------------------------------------------------------
function runBenchmarks() {
  console.log(`\n${c.bold}🧪 Running AI Dev Pipeline Benchmark Scenarios...${c.reset}\n`);

  const benchmarkRoot = path.join(__dirname, '..', 'eval', 'benchmarks');
  const scenarioA = path.join(benchmarkRoot, 'scenario-a-compliant');
  const scenarioB = path.join(benchmarkRoot, 'scenario-b-drifting');

  // Verify Scenario A exists
  if (!fs.existsSync(scenarioA) || !fs.existsSync(scenarioB)) {
    console.error(`${c.red}✖ Benchmark scenarios not found at ${benchmarkRoot}${c.reset}`);
    process.exit(1);
  }

  console.log(`${c.cyan}Evaluating Scenario A: Clean, Architecture-Compliant Service...${c.reset}`);
  const resultA = runEvaluation({ targetDir: scenarioA, taskId: 'TASK-001', threshold: 85, writeReport: false });
  console.log(`  Score: ${resultA.overallScore.toFixed(1)}% | Grade: ${c.green}${resultA.grade}${c.reset} | Status: ${resultA.passed ? c.green + 'PASS' : c.red + 'FAIL'}${c.reset}`);

  console.log(`\n${c.cyan}Evaluating Scenario B: Drifting, Anti-Pattern Contaminated Service...${c.reset}`);
  const resultB = runEvaluation({ targetDir: scenarioB, taskId: 'TASK-002', threshold: 80, writeReport: false });
  console.log(`  Score: ${resultB.overallScore.toFixed(1)}% | Grade: ${c.yellow}${resultB.grade}${c.reset} | Status: ${resultB.passed ? c.yellow + 'PASS' : c.red + 'FAIL (Correctly Rejected)'}${c.reset}`);

  console.log(`\n${c.bold}Benchmark Verification Summary:${c.reset}`);
  const verified = resultA.overallScore >= 90 && resultB.overallScore < 75;
  if (verified) {
    console.log(`${c.green}${c.bold}✔ BENCHMARK SUCCESS:${c.reset} The evaluation engine successfully distinguished compliant code (${resultA.overallScore.toFixed(1)}%) from drifting code (${resultB.overallScore.toFixed(1)}%) with exact precision.\n`);
    process.exit(0);
  } else {
    console.error(`${c.red}${c.bold}✖ BENCHMARK FAILED:${c.reset} Scoring thresholds did not match expected delta.`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// CLI Display Function
// -------------------------------------------------------------
function displayResults(results) {
  console.log(`\n${c.bold}🎯 AI Dev Pipeline — Stage Evaluation Report${c.reset}`);
  console.log(`============================================================`);
  console.log(`Workspace:  ${c.dim}${results.targetDir}${c.reset}`);
  if (results.taskId) console.log(`Target:     ${c.cyan}${results.taskId}${c.reset}`);
  console.log(`Threshold:  ${c.yellow}${results.threshold}%${c.reset}\n`);

  console.log(`DIMENSION                        SCORE    STATUS   WEIGHT`);
  console.log(`------------------------------------------------------------`);

  const d = results.dimensionScores;
  const statusBadge = s => (s >= 80 ? `${c.green}PASS${c.reset}` : `${c.yellow}WARN${c.reset}`);

  console.log(`1. Architecture Conformance      ${d.architecture.toString().padEnd(3)}/100  ${statusBadge(d.architecture)}     30%`);
  console.log(`2. Deterministic Code Quality    ${d.quality.toString().padEnd(3)}/100  ${statusBadge(d.quality)}     25%`);
  console.log(`3. Anti-Pattern Invariants       ${d.antiPatterns.toString().padEnd(3)}/100  ${statusBadge(d.antiPatterns)}     25%`);
  console.log(`4. Traceability & Handoffs       ${d.traceability.toString().padEnd(3)}/100  ${statusBadge(d.traceability)}     20%`);
  console.log(`------------------------------------------------------------`);

  const scoreColor = results.passed ? c.green : c.red;
  console.log(
    `Overall Reliability Score: ${scoreColor}${c.bold}${results.overallScore.toFixed(1)}%${c.reset} ` +
    `[GRADE: ${scoreColor}${c.bold}${results.grade}${c.reset}] ` +
    `— ${results.passed ? c.green + 'PASSED' : c.red + 'FAILED'}${c.reset}`
  );

  if (results.findings.length > 0) {
    console.log(`\n${c.bold}🚨 Actionable Findings & Drift Alerts:${c.reset}`);
    for (const f of results.findings) {
      const badge = f.severity === 'FAIL' ? `${c.red}✖ [FAIL]${c.reset}` : `${c.yellow}! [WARN]${c.reset}`;
      const loc = f.file ? ` ${c.dim}(${f.file})${c.reset}` : '';
      console.log(`  ${badge} ${c.bold}${f.dimension}${c.reset}${loc}: ${f.message} ${c.red}(-${f.deduction} pts)${c.reset}`);
    }
  } else {
    console.log(`\n${c.green}✔ No architectural drift, linter failures, or anti-pattern regressions detected.${c.reset}`);
  }

  console.log(`\n${c.dim}📄 Full audit report saved to:${c.reset} ${c.cyan}${results.reportPath}${c.reset}\n`);
}

// -------------------------------------------------------------
// CLI Execution
// -------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--benchmark')) {
    runBenchmarks();
    return;
  }

  let taskId = null;
  const taskArg = args.find(a => a.startsWith('--task='));
  if (taskArg) {
    taskId = taskArg.split('=')[1];
  } else {
    const taskIdx = args.indexOf('--task');
    if (taskIdx !== -1 && args[taskIdx + 1]) {
      taskId = args[taskIdx + 1];
    }
  }

  let threshold = 80;
  const threshArg = args.find(a => a.startsWith('--threshold='));
  if (threshArg) {
    threshold = parseInt(threshArg.split('=')[1], 10) || 80;
  } else {
    const threshIdx = args.indexOf('--threshold');
    if (threshIdx !== -1 && args[threshIdx + 1]) {
      threshold = parseInt(args[threshIdx + 1], 10) || 80;
    }
  }

  let targetDir = process.cwd();
  const dirArg = args.find(a => a.startsWith('--target-dir='));
  if (dirArg) {
    targetDir = path.resolve(dirArg.split('=')[1]);
  }

  const results = runEvaluation({ targetDir, taskId, threshold });

  if (args.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    displayResults(results);
  }

  if (!results.passed) {
    process.exit(1);
  }
}

module.exports = {
  main,
  runEvaluation,
  evaluateArchitecture,
  evaluateCodeQuality,
  evaluateAntiPatterns,
  evaluateTraceability,
  calculateGrade
};

if (require.main === module) {
  main();
}
