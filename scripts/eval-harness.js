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
const reporters = require('./eval-reporters');
const dimensions = require('./eval-dimensions');

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
    /(cli|eval-harness|eval-reporters|eval-dimensions|sync-tools)\.js$/i.test(n)
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

function calculateGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function runEvaluation(options = {}) {
  const targetDir = options.targetDir || process.cwd();
  const taskId = options.taskId || null;
  const threshold = options.threshold || 80;
  const findings = [];
  const sourceFiles = getSourceFiles(targetDir);

  const scoreArch = dimensions.evaluateArchitecture(targetDir, findings, sourceFiles, isTestFile, isScriptOrCliFile);
  const scoreQuality = dimensions.evaluateCodeQuality(targetDir, findings, sourceFiles, isTestFile);
  const scoreAntiPatterns = dimensions.evaluateAntiPatterns(targetDir, findings, sourceFiles, isTestFile, isScriptOrCliFile);
  const scoreTraceability = dimensions.evaluateTraceability(targetDir, taskId, findings);

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
  results.reportPath = shouldWriteReport ? reporters.generateMarkdownReport(results, targetDir) : null;
  return results;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--benchmark')) {
    reporters.runBenchmarks(runEvaluation, c);
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
    reporters.displayResults(results, c);
  }

  if (!results.passed) process.exit(1);
}

module.exports = {
  main,
  runEvaluation,
  calculateGrade,
  isTestFile,
  isScriptOrCliFile,
  getSourceFiles
};

if (require.main === module) {
  main();
}
