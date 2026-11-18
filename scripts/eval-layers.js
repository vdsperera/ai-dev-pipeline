/**
 * scripts/eval-layers.js — Architectural Layer Contracts & Planning Integrity
 *
 * Provides:
 *   1. Layer Contract parsing from docs/architecture.md and import-boundary verification.
 *   2. Cryptographic planning checksum verification (stale task backlog detection).
 *   3. SLOC and KLOC metric calculation for normalized scoring.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Parses layer boundaries from docs/architecture.md.
 * Supports HTML comments (<!-- layer-contract: ... -->) and markdown sections (### Layer Contract).
 */
function parseLayerContract(archContent) {
  if (!archContent) return null;
  const layers = {};

  // 1. Comment block: <!-- layer-contract: ... -->
  const commentMatch = archContent.match(/<!--\s*layer-contract:([\s\S]*?)-->/i);
  if (commentMatch) {
    const lines = commentMatch[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([a-zA-Z0-9_\-]+)\s*:\s*\[?(.*?)\]?\s*$/);
      if (match) {
        const layerName = match[1].toLowerCase().trim();
        const mayImport = match[2]
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
        layers[layerName] = {
          name: layerName,
          pathPattern: new RegExp(`(?:^|[\\\\/])(?:src[\\\\/])?${layerName}(?:[\\\\/]|$|[\\\\.].+)`, 'i'),
          mayImport
        };
      }
    }
  }

  // 2. Markdown section: ### Layer Contract
  const sectionMatch = archContent.match(/###\s*(?:Layer Contract|Layers|Layer Isolation)([\s\S]*?)(?=\n###|\n##|$)/i);
  if (sectionMatch) {
    const lines = sectionMatch[1].split('\n');
    for (const line of lines) {
      const bulletMatch = line.match(/[-*]\s+\*\*([a-zA-Z0-9_\-]+)\*\*(?:\s*\(([^)]+)\))?\s*:\s*(?:may\s+import\s+)?([^\n]+)/i);
      if (bulletMatch) {
        const layerName = bulletMatch[1].toLowerCase().trim();
        const customPath = bulletMatch[2] ? bulletMatch[2].trim() : null;
        const rawImports = bulletMatch[3].trim().replace(/^(may\s+import\s*:?\s*)/i, '');
        const mayImport = rawImports
          .replace(/[`\[\]]/g, '')
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(s => Boolean(s) && s !== 'none');

        const pathRegex = customPath
          ? new RegExp(customPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\//g, '[\\\\/]'), 'i')
          : new RegExp(`(?:^|[\\\\/])(?:src[\\\\/])?${layerName}(?:[\\\\/]|$|[\\\\.].+)`, 'i');

        layers[layerName] = {
          name: layerName,
          pathPattern: pathRegex,
          mayImport
        };
      }
    }
  }

  return Object.keys(layers).length > 0 ? layers : null;
}

function checkSingleImport(specifier, file, relPath, sourceLayer, layerContract, targetDir, findings) {
  if (!specifier.startsWith('.')) return 0;
  const resolved = path.resolve(path.dirname(file), specifier);
  const relTarget = path.relative(targetDir, resolved).replace(/\\/g, '/');

  for (const [targetName, targetDef] of Object.entries(layerContract)) {
    if (targetName === sourceLayer.name || !targetDef.pathPattern.test(relTarget)) continue;
    if (!sourceLayer.mayImport.includes(targetName)) {
      findings.push({
        dimension: 'Architecture',
        severity: 'FAIL',
        file: relPath,
        message: `Layer Contract Violation: Layer '${sourceLayer.name}' is prohibited from importing '${targetName}' ('${specifier}'). Allowed: [${sourceLayer.mayImport.join(', ') || 'none'}].`,
        deduction: 15
      });
      return 15;
    }
  }
  return 0;
}

/**
 * Checks source files against declared architectural layer contracts.
 */
function checkLayerContract(targetDir, sourceFiles, layerContract, findings, isTestFile, isScriptOrCliFile) {
  if (!layerContract) return 0;
  let totalDeduction = 0;

  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file).replace(/\\/g, '/');
    if (isTestFile && isTestFile(relPath)) continue;
    if (isScriptOrCliFile && isScriptOrCliFile(relPath)) continue;

    const sourceLayer = Object.values(layerContract).find(def => def.pathPattern.test(relPath));
    if (!sourceLayer) continue;

    let content = '';
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const importRegex = /(?:import\s+(?:[\w*\s{},]*from\s+)?|export\s+(?:[\w*\s{},]*from\s+)?|require\s*\(\s*)['"]([^'"]+)['"]/g;
    let impMatch;
    while ((impMatch = importRegex.exec(content)) !== null) {
      totalDeduction += checkSingleImport(impMatch[1], file, relPath, sourceLayer, layerContract, targetDir, findings);
    }
  }

  return totalDeduction;
}

/**
 * Computes short SHA-256 checksum of normalized document content.
 */
function computeDocChecksum(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').trim();
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
  } catch {
    return null;
  }
}

/**
 * Verifies that docs/tasks.md is not stale relative to architecture or requirements documents.
 */
function verifyPlanningChecksums(targetDir, findings) {
  const tasksPath = path.join(targetDir, 'docs', 'tasks.md');
  if (!fs.existsSync(tasksPath)) return 0;

  let tasksContent = '';
  try {
    tasksContent = fs.readFileSync(tasksPath, 'utf8');
  } catch {
    return 0;
  }

  const checksumMatch = tasksContent.match(/<!--\s*planning-(?:checksums|hashes):([\s\S]*?)-->/i);
  if (!checksumMatch) return 0;

  const lines = checksumMatch[1].split('\n');
  const stamped = {};
  for (const line of lines) {
    const match = line.match(/^\s*([a-zA-Z0-9_\-]+)\s*:\s*([a-f0-9]+)\s*$/i);
    if (match) stamped[match[1].toLowerCase()] = match[2].toLowerCase();
  }

  let deduction = 0;
  const reqPath = path.join(targetDir, 'docs', 'requirements.md');
  if (stamped.requirements && fs.existsSync(reqPath)) {
    const current = computeDocChecksum(reqPath);
    if (current && current !== stamped.requirements) {
      findings.push({
        dimension: 'Traceability',
        severity: 'WARN',
        file: 'docs/tasks.md',
        message: `Stale Task Backlog: docs/requirements.md has changed since tasks were planned (expected ${stamped.requirements}, current ${current}).`,
        deduction: 10
      });
      deduction += 10;
    }
  }

  const archPath = path.join(targetDir, 'docs', 'architecture.md');
  if (stamped.architecture && fs.existsSync(archPath)) {
    const current = computeDocChecksum(archPath);
    if (current && current !== stamped.architecture) {
      findings.push({
        dimension: 'Traceability',
        severity: 'WARN',
        file: 'docs/tasks.md',
        message: `Stale Task Backlog: docs/architecture.md has changed since tasks were planned (expected ${stamped.architecture}, current ${current}).`,
        deduction: 10
      });
      deduction += 10;
    }
  }

  return deduction;
}

/**
 * Calculates physical SLOC and KLOC metrics across project source files.
 */
function calculateKlocMetrics(sourceFiles, targetDir, isTestFile) {
  let totalSloc = 0;
  let countedFiles = 0;

  for (const file of sourceFiles) {
    const relPath = path.relative(targetDir, file);
    if (isTestFile && isTestFile(relPath)) continue;

    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      totalSloc += lines.length;
      countedFiles++;
    } catch {}
  }

  const kloc = totalSloc / 1000;
  return {
    fileCount: countedFiles,
    totalSloc,
    kloc: parseFloat(kloc.toFixed(2)),
    densityFactor: Math.max(1.0, Math.sqrt(Math.max(1.0, kloc)))
  };
}

module.exports = {
  parseLayerContract,
  checkLayerContract,
  computeDocChecksum,
  verifyPlanningChecksums,
  calculateKlocMetrics
};
