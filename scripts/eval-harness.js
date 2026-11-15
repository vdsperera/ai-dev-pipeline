#!/usr/bin/env node

/**
 * eval-harness.js — AI Dev Pipeline Stage Evaluation Harness
 *
 * Fast, zero-dependency static hygiene evaluator for coding agent outputs.
 * Inspects layer boundaries, linter scripts, known anti-patterns, and task
 * traceability. Produces actionable hygiene scorecards and markdown audit reports.
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
  red: supportsColor ? '\x1b[31m' : ''
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isTestFile(relPath) {
  const n = relPath.replace(/\\/g, '/');
  return (
    /(^|\/)(tests?|__tests__|fixtures?|e2e|spec)(\/|$)/i.test(n) ||
    /\.(test|spec)\.[a-z0-9]+$/i.test(n)
  );
}

function isScriptOrCliFile(relPath) {
  const n = relPath.replace(/\\/g, '/');
  return (
    /(^|\/)(scripts|bin)(\/|$)/i.test(n) ||
    /(cli|eval-harness|sync-tools)\.js$/i.test(n)
  );
}

// Recursively find source files (excluding ignored build / cache directories)
function getSourceFiles(dir, extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs'], isBenchmark = false) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const isBench = isBenchmark || dir.includes('benchmarks');
  const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next']);

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name) || (!isBench && entry.name === 'benchmarks')) continue;
      results.push(...getSourceFiles(path.join(dir, entry.name), extensions, isBench));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }
  return results;
}

// -------------------------------------------------------------
// DIMENSION 1: Architecture & Layer Isolation (Weight: 30%)
// -------------------------------------------------------------
function evaluateArchitecture(targetDir, findings) {
  let score = 100;
  const archPath = path.join(targetDir, 'docs', 'architecture.md');

  if (!fs.existsSync(archPath)) {
    findings.push({
      dimension: 'Architecture',
      severity: 'WARN',
      message: 'No docs/architecture.md found. Pipeline cannot verify component boundaries or API contracts.',
      deduction: 15
    });
    score -= 15;
  } else {
    const archContent = fs.readFileSync(archPath, 'utf8');
    if (archContent.trim().length < 50) {
      findings.push({
        dimension: 'Architecture',
        severity: 'WARN',
        message: 'docs/architecture.md is minimal (< 50 chars). Architectural contracts should define boundaries.',
        deduction: 10
      });
      score -= 10;
    }
  }

  const sourceFiles = getSourceFiles(targetDir);
  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    if (isTestFile(relPath) || isScriptOrCliFile(relPath)) continue;

    const isPresentationOrRoute = /(routes|controllers|views|pages|components)[\\/]/i.test(relPath);
    if (!isPresentationOrRoute) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let hasDirectSql = false;
    let hasDirectDbPool = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('#')) continue;

      if (!hasDirectSql && /(\bSELECT\s+.+\s+FROM\b|\bINSERT\s+INTO\b|\bUPDATE\s+.+\s+SET\b|\bDELETE\s+FROM\b)/i.test(line)) {
        hasDirectSql = true;
      }
      if (!hasDirectDbPool && /(\bpg\.Pool\b|\bnew\s+Pool\b|\bprisma\.\w+\.(find|create|update|delete)\b|\bmongoose\.model\b)/i.test(line)) {
        hasDirectDbPool = true;
      }
    }

    if (hasDirectSql) {
      findings.push({
        dimension: 'Architecture',
        severity: 'FAIL',
        file: relPath,
        message: 'Direct SQL execution detected in presentation/route layer. Violates layer boundary isolation.',
        deduction: 20
      });
      score -= 20;
    }
    if (hasDirectDbPool) {
      findings.push({
        dimension: 'Architecture',
        severity: 'WARN',
        file: relPath,
        message: 'Direct database/ORM connection initiated in presentation/controller layer. Route through service or repository.',
        deduction: 10
      });
      score -= 10;
    }
  }

  return Math.max(0, score);
}

// -------------------------------------------------------------
// DIMENSION 2: Code Quality & Static Analysis Gate (Weight: 25%)
// -------------------------------------------------------------
function evaluateCodeQuality(targetDir, findings) {
  let score = 100;
  const pkgPath = path.join(targetDir, 'package.json');

  // 1. Run official project linter if present
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const lintScript = (pkg.scripts && (pkg.scripts.lint || pkg.scripts['lint:check'])) ? (pkg.scripts.lint ? 'lint' : 'lint:check') : null;
      if (lintScript) {
        try {
          execSync(`npm run ${lintScript} --silent`, { cwd: targetDir, stdio: 'pipe', timeout: 30000 });
        } catch {
          findings.push({
            dimension: 'Code Quality',
            severity: 'FAIL',
            message: `Static analysis command 'npm run ${lintScript}' exited with errors. Code must satisfy linter rules.`,
            deduction: 15
          });
          score -= 15;
        }
      }
    } catch {
      // Ignore package.json parsing issues
    }
  }

  // 2. Static heuristic checks for file sizing and block nesting
  const sourceFiles = getSourceFiles(targetDir);
  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    if (isTestFile(relPath)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

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

    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) continue;
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
        message: `Deep block nesting: nesting depth of ${maxNesting} levels detected. Split into focused helper functions.`,
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
  const antiPatternsPath = path.join(targetDir, 'docs', 'anti-patterns.md');
  const customDetectPatterns = [];

  if (!fs.existsSync(antiPatternsPath)) {
    findings.push({
      dimension: 'Anti-Patterns',
      severity: 'WARN',
      message: 'No docs/anti-patterns.md found. Pipeline cannot track persistent defect memory or project invariants.',
      deduction: 10
    });
    score -= 10;
  } else {
    try {
      const apContent = fs.readFileSync(antiPatternsPath, 'utf8');
      const detectMatches = apContent.matchAll(/###\s*(AP-\d+)[^\n]*\n[\s\S]*?(?:- \*\*Detect\*\*|Detect):\s*`?\/([^\/\n]+)\/([gimsuy]*)`?/gi);
      for (const m of detectMatches) {
        customDetectPatterns.push({ id: m[1], regex: new RegExp(m[2], m[3]) });
      }
    } catch {
      // Ignore custom regex syntax errors
    }
  }

  const sourceFiles = getSourceFiles(targetDir);
  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    if (isTestFile(relPath) || isScriptOrCliFile(relPath)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) return;

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

      if (
        /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b).*\+\s*[a-zA-Z0-9_]+/i.test(line) ||
        /(\bquery\b|\bexecute\b)\s*\(\s*`[^`]*\$\{/i.test(line)
      ) {
        findings.push({
          dimension: 'Anti-Patterns',
          severity: 'FAIL',
          file: `${relPath}:${lineNum}`,
          message: 'SQL Injection Risk: unparameterized query using string concatenation or template literal.',
          deduction: 25
        });
        score -= 25;
      }

      if (
        /(api[_-]?key|secret[_-]?key|auth[_-]?token|bearer|jwt[_-]?secret|password)\s*[:=]\s*["'][a-zA-Z0-9_\-\.]{12,}["']/i.test(line) &&
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

      if (/\bconsole\.log\s*\(/.test(line)) {
        findings.push({
          dimension: 'Anti-Patterns',
          severity: 'WARN',
          file: `${relPath}:${lineNum}`,
          message: 'console.log statement found in production path. Use structured project logger.',
          deduction: 5
        });
        score -= 5;
      }

      for (const custom of customDetectPatterns) {
        if (custom.regex.test(line)) {
          findings.push({
            dimension: 'Anti-Patterns',
            severity: 'FAIL',
            file: `${relPath}:${lineNum}`,
            message: `Violation of registered anti-pattern ${custom.id}.`,
            deduction: 15
          });
          score -= 15;
        }
      }
    });
  }

  return Math.max(0, score);
}

// -------------------------------------------------------------
// DIMENSION 4: Traceability & Task Handoffs (Weight: 20%)
// -------------------------------------------------------------
function evaluateTraceability(targetDir, taskId, findings) {
  let score = 100;
  const tasksPath = path.join(targetDir, 'docs', 'tasks.md');

  if (fs.existsSync(tasksPath)) {
    const tasksContent = fs.readFileSync(tasksPath, 'utf8');
    if (taskId) {
      const match = tasksContent.match(new RegExp(`\\[([ x/])\\]\\s*\\*\\*${taskId}\\*\\*`, 'i'));
      if (match && match[1] !== 'x') {
        findings.push({
          dimension: 'Traceability',
          severity: 'WARN',
          message: `Task ${taskId} is marked '[${match[1]}]' in docs/tasks.md; completed tasks should be '[x]'.`,
          deduction: 15
        });
        score -= 15;
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
      const content = fs.readFileSync(handoffPath, 'utf8');
      const requiredSections = ['Summary', 'Files Changed', 'Architecture Alignment', 'Verification'];
      for (const sec of requiredSections) {
        if (!new RegExp(`##\\s+.*${sec}`, 'i').test(content)) {
          findings.push({
            dimension: 'Traceability',
            severity: 'WARN',
            message: `Handoff note ${taskId}.md is missing required section '## ${sec}'.`,
            deduction: 8
          });
          score -= 8;
        }
      }
    }
  }

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
    // Non-git environment or empty repo
  }

  return Math.max(0, score);
}

function calculateGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

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
  md += `> **Hygiene Score**: **${results.overallScore.toFixed(1)}%** (Grade: **${results.grade}**)  \n`;
  md += `> **Status**: **${results.passed ? 'PASSED' : 'FAILED'}** (Threshold: ${results.threshold}%)\n\n`;

  md += `## Dimension Scorecard\n\n`;
  md += `| Evaluation Dimension | Weight | Score | Status |\n`;
  md += `|---|---|---|---|\n`;
  md += `| **1. Architecture & Layer Isolation** | 30% | ${results.dimensionScores.architecture}/100 | ${results.dimensionScores.architecture >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n`;
  md += `| **2. Code Quality & Static Analysis** | 25% | ${results.dimensionScores.quality}/100 | ${results.dimensionScores.quality >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n`;
  md += `| **3. Anti-Pattern Invariants & Security** | 25% | ${results.dimensionScores.antiPatterns}/100 | ${results.dimensionScores.antiPatterns >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n`;
  md += `| **4. Traceability & Task Handoffs** | 20% | ${results.dimensionScores.traceability}/100 | ${results.dimensionScores.traceability >= 80 ? '✅ PASS' : '⚠️ WARN'} |\n\n`;

  md += `## Actionable Findings & Recommendations\n\n`;
  if (results.findings.length === 0) {
    md += `*No architectural drift, linter issues, or anti-pattern regressions detected. High fidelity implementation.*\n\n`;
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

  const results = {
    targetDir,
    taskId,
    threshold,
    overallScore,
    grade: calculateGrade(overallScore),
    passed: overallScore >= threshold,
    dimensionScores: {
      architecture: scoreArch,
      quality: scoreQuality,
      antiPatterns: scoreAntiPatterns,
      traceability: scoreTraceability
    },
    findings
  };

  const shouldWriteReport = options.writeReport !== false;
  results.reportPath = shouldWriteReport ? generateMarkdownReport(results, targetDir) : null;
  return results;
}

function runBenchmarks() {
  console.log(`\n${c.bold}🧪 Running AI Dev Pipeline Benchmark Scenarios...${c.reset}\n`);

  const benchmarkRoot = path.join(__dirname, '..', 'eval', 'benchmarks');
  const scenarioA = path.join(benchmarkRoot, 'scenario-a-compliant');
  const scenarioB = path.join(benchmarkRoot, 'scenario-b-drifting');

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
    console.log(`${c.green}${c.bold}✔ BENCHMARK SUCCESS:${c.reset} Evaluator verified against benchmark fixtures: compliant scenario (${resultA.overallScore.toFixed(1)}%) passed, drifting scenario (${resultB.overallScore.toFixed(1)}%) correctly failed.\n`);
    process.exit(0);
  } else {
    console.error(`${c.red}${c.bold}✖ BENCHMARK FAILED:${c.reset} Scoring thresholds did not match expected delta.`);
    process.exit(1);
  }
}

function displayResults(results) {
  console.log(`\n${c.bold}🎯 AI Dev Pipeline — Stage Hygiene & Quality Scorecard${c.reset}`);
  console.log(`============================================================`);
  console.log(`Workspace:  ${c.dim}${results.targetDir}${c.reset}`);
  if (results.taskId) console.log(`Target:     ${c.cyan}${results.taskId}${c.reset}`);
  console.log(`Threshold:  ${c.yellow}${results.threshold}%${c.reset}\n`);

  console.log(`DIMENSION                        SCORE    STATUS   WEIGHT`);
  console.log(`------------------------------------------------------------`);

  const d = results.dimensionScores;
  const statusBadge = s => (s >= 80 ? `${c.green}PASS${c.reset}` : `${c.yellow}WARN${c.reset}`);

  console.log(`1. Architecture & Layering       ${d.architecture.toString().padEnd(3)}/100  ${statusBadge(d.architecture)}     30%`);
  console.log(`2. Code Quality & Linter         ${d.quality.toString().padEnd(3)}/100  ${statusBadge(d.quality)}     25%`);
  console.log(`3. Anti-Pattern Invariants       ${d.antiPatterns.toString().padEnd(3)}/100  ${statusBadge(d.antiPatterns)}     25%`);
  console.log(`4. Traceability & Handoffs       ${d.traceability.toString().padEnd(3)}/100  ${statusBadge(d.traceability)}     20%`);
  console.log(`------------------------------------------------------------`);

  const scoreColor = results.passed ? c.green : c.red;
  console.log(
    `Codebase Hygiene Score: ${scoreColor}${c.bold}${results.overallScore.toFixed(1)}%${c.reset} ` +
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
    if (taskIdx !== -1 && args[taskIdx + 1]) taskId = args[taskIdx + 1];
  }

  let threshold = 80;
  const threshArg = args.find(a => a.startsWith('--threshold='));
  if (threshArg) {
    threshold = parseInt(threshArg.split('=')[1], 10) || 80;
  } else {
    const threshIdx = args.indexOf('--threshold');
    if (threshIdx !== -1 && args[threshIdx + 1]) threshold = parseInt(args[threshIdx + 1], 10) || 80;
  }

  let targetDir = process.cwd();
  const dirArg = args.find(a => a.startsWith('--target-dir='));
  if (dirArg) targetDir = path.resolve(dirArg.split('=')[1]);

  const results = runEvaluation({ targetDir, taskId, threshold });

  if (args.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    displayResults(results);
  }

  if (!results.passed) process.exit(1);
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
