/**
 * scripts/eval-dimensions.js — Core Evaluation Dimensions
 *
 * Implements the 4 audit dimensions:
 *   1. Architecture & Layer Isolation (30%)
 *   2. Code Quality & Static Analysis Gate (25%)
 *   3. Anti-Pattern Invariants & Security (25%)
 *   4. Traceability & Task Handoffs (20%)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkPresentationLayer(relPath, content, findings) {
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

  let deduction = 0;
  if (hasDirectSql) {
    findings.push({
      dimension: 'Architecture',
      severity: 'FAIL',
      file: relPath,
      message: 'Direct SQL execution detected in presentation/route layer. Violates layer boundary isolation.',
      deduction: 20
    });
    deduction += 20;
  }
  if (hasDirectDbPool) {
    findings.push({
      dimension: 'Architecture',
      severity: 'WARN',
      file: relPath,
      message: 'Direct database/ORM connection initiated in presentation/controller layer. Route through service or repository.',
      deduction: 10
    });
    deduction += 10;
  }
  return deduction;
}

function evaluateArchitecture(targetDir, findings, sourceFiles, isTestFile, isScriptOrCliFile) {
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

  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    if (isTestFile(relPath) || isScriptOrCliFile(relPath)) continue;

    const isPresentationOrRoute = /(routes|controllers|views|pages|components)[\\/]/i.test(relPath);
    if (!isPresentationOrRoute) continue;

    const content = fs.readFileSync(file, 'utf8');
    score -= checkPresentationLayer(relPath, content, findings);
  }

  return Math.max(0, score);
}

function measureFileNesting(lines) {
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
  return maxNesting;
}

function runProjectLinter(targetDir, findings) {
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return 0;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const lintScript = (pkg.scripts && (pkg.scripts.lint || pkg.scripts['lint:check'])) ? (pkg.scripts.lint ? 'lint' : 'lint:check') : null;
    if (!lintScript) return 0;

    try {
      execSync(`npm run ${lintScript} --silent`, { cwd: targetDir, stdio: 'pipe', timeout: 30000 });
      return 0;
    } catch {
      findings.push({
        dimension: 'Code Quality',
        severity: 'FAIL',
        message: `Static analysis command 'npm run ${lintScript}' exited with errors. Code must satisfy linter rules.`,
        deduction: 15
      });
      return 15;
    }
  } catch {
    return 0;
  }
}

function evaluateCodeQuality(targetDir, findings, sourceFiles, isTestFile) {
  let score = 100 - runProjectLinter(targetDir, findings);

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

    const maxNesting = measureFileNesting(lines);
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

function checkLineInvariants(line, relPath, lineNum, customPatterns, findings) {
  let deduction = 0;
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) return 0;

  if (/catch\s*\([^\)]*\)\s*\{\s*\}/.test(line)) {
    findings.push({
      dimension: 'Anti-Patterns',
      severity: 'FAIL',
      file: `${relPath}:${lineNum}`,
      message: 'Silent error swallowing: bare empty catch block detected. Violates AGENTS.md § Error Handling.',
      deduction: 20
    });
    deduction += 20;
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
    deduction += 25;
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
    deduction += 25;
  }

  if (/\bconsole\.log\s*\(/.test(line)) {
    findings.push({
      dimension: 'Anti-Patterns',
      severity: 'WARN',
      file: `${relPath}:${lineNum}`,
      message: 'console.log statement found in production path. Use structured project logger.',
      deduction: 5
    });
    deduction += 5;
  }

  for (const custom of customPatterns) {
    if (custom.regex.test(line)) {
      findings.push({
        dimension: 'Anti-Patterns',
        severity: 'FAIL',
        file: `${relPath}:${lineNum}`,
        message: `Violation of registered anti-pattern ${custom.id}.`,
        deduction: 15
      });
      deduction += 15;
    }
  }

  return deduction;
}

function parseCustomAntiPatterns(antiPatternsPath) {
  if (!fs.existsSync(antiPatternsPath)) return [];
  const patterns = [];
  try {
    const apContent = fs.readFileSync(antiPatternsPath, 'utf8');
    const detectMatches = apContent.matchAll(/###\s*(AP-\d+)[^\n]*\n[\s\S]*?(?:- \*\*Detect\*\*|Detect):\s*`?\/([^\/\n]+)\/([gimsuy]*)`?/gi);
    for (const m of detectMatches) {
      patterns.push({ id: m[1], regex: new RegExp(m[2], m[3]) });
    }
  } catch {
    // Ignore invalid regex
  }
  return patterns;
}

function evaluateAntiPatterns(targetDir, findings, sourceFiles, isTestFile, isScriptOrCliFile) {
  let score = 100;
  const antiPatternsPath = path.join(targetDir, 'docs', 'anti-patterns.md');

  if (!fs.existsSync(antiPatternsPath)) {
    findings.push({
      dimension: 'Anti-Patterns',
      severity: 'WARN',
      message: 'No docs/anti-patterns.md found. Pipeline cannot track persistent defect memory or project invariants.',
      deduction: 10
    });
    score -= 10;
  }

  const customDetectPatterns = parseCustomAntiPatterns(antiPatternsPath);

  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    if (isTestFile(relPath) || isScriptOrCliFile(relPath)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let index = 0; index < lines.length; index++) {
      score -= checkLineInvariants(lines[index], relPath, index + 1, customDetectPatterns, findings);
    }
  }

  return Math.max(0, score);
}

function verifyTaskBacklog(targetDir, taskId, findings) {
  const tasksPath = path.join(targetDir, 'docs', 'tasks.md');
  if (!fs.existsSync(tasksPath)) {
    findings.push({
      dimension: 'Traceability',
      severity: 'WARN',
      message: 'No docs/tasks.md found. Task backlog traceability cannot be confirmed.',
      deduction: 10
    });
    return 10;
  }

  if (!taskId) return 0;
  const tasksContent = fs.readFileSync(tasksPath, 'utf8');
  const match = tasksContent.match(new RegExp(`\\[([ x/])\\]\\s*\\*\\*${taskId}\\*\\*`, 'i'));
  if (match && match[1] !== 'x') {
    findings.push({
      dimension: 'Traceability',
      severity: 'WARN',
      message: `Task ${taskId} is marked '[${match[1]}]' in docs/tasks.md; completed tasks should be '[x]'.`,
      deduction: 15
    });
    return 15;
  }
  return 0;
}

function verifyHandoffNote(targetDir, taskId, findings) {
  if (!taskId) return 0;
  const handoffPath = path.join(targetDir, 'docs', 'handoffs', `${taskId}.md`);

  if (!fs.existsSync(handoffPath)) {
    findings.push({
      dimension: 'Traceability',
      severity: 'FAIL',
      message: `Missing developer handoff note at docs/handoffs/${taskId}.md. Agent 6 requires a handoff document.`,
      deduction: 30
    });
    return 30;
  }

  let deduction = 0;
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
      deduction += 8;
    }
  }
  return deduction;
}

function verifyLastCommit(targetDir, findings) {
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
      return 10;
    }
  } catch {
    // Non-git environment or empty repo
  }
  return 0;
}

function evaluateTraceability(targetDir, taskId, findings) {
  let score = 100;
  score -= verifyTaskBacklog(targetDir, taskId, findings);
  score -= verifyHandoffNote(targetDir, taskId, findings);
  score -= verifyLastCommit(targetDir, findings);
  return Math.max(0, score);
}

module.exports = {
  evaluateArchitecture,
  evaluateCodeQuality,
  evaluateAntiPatterns,
  evaluateTraceability,
  checkPresentationLayer,
  checkLineInvariants,
  measureFileNesting,
  runProjectLinter,
  verifyTaskBacklog,
  verifyHandoffNote,
  verifyLastCommit
};
