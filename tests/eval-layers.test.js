/**
 * tests/eval-layers.test.js — Unit Tests for Layer Contracts, KLOC, & Planning Integrity
 *
 * Uses Node.js native test runner (node:test). Zero external dependencies.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  parseLayerContract,
  checkLayerContract,
  computeDocChecksum,
  verifyPlanningChecksums,
  calculateKlocMetrics
} = require('../scripts/eval-layers');

test('parseLayerContract parses comment-style layer contract declarations', () => {
  const sampleDoc = `
# Architecture Document

<!-- layer-contract:
controllers: [services, utils]
services: [models, utils]
models: [utils]
-->

Some additional architecture text.
`;
  const contract = parseLayerContract(sampleDoc);
  assert.ok(contract);
  assert.ok(contract.controllers);
  assert.deepEqual(contract.controllers.mayImport, ['services', 'utils']);
  assert.ok(contract.services);
  assert.deepEqual(contract.services.mayImport, ['models', 'utils']);
  assert.ok(contract.models);
  assert.deepEqual(contract.models.mayImport, ['utils']);
});

test('parseLayerContract parses markdown section bullet declarations', () => {
  const sampleDoc = `
# Architecture Document

### Layer Contract
- **controllers** (\`src/controllers\`): may import \`services\`, \`utils\`
- **services** (\`src/services\`): may import \`models\`, \`utils\`
- **models** (\`src/models\`): may import none
`;
  const contract = parseLayerContract(sampleDoc);
  assert.ok(contract);
  assert.ok(contract.controllers);
  assert.deepEqual(contract.controllers.mayImport, ['services', 'utils']);
  assert.ok(contract.models);
  assert.deepEqual(contract.models.mayImport, []);
});

test('checkLayerContract detects layer violations and allows compliant imports', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'layer-test-'));
  const srcDir = path.join(tmpDir, 'src');
  const ctrlDir = path.join(srcDir, 'controllers');
  const srvDir = path.join(srcDir, 'services');
  const modDir = path.join(srcDir, 'models');

  fs.mkdirSync(ctrlDir, { recursive: true });
  fs.mkdirSync(srvDir, { recursive: true });
  fs.mkdirSync(modDir, { recursive: true });

  const srvFile = path.join(srvDir, 'order-service.js');
  const modFile = path.join(modDir, 'order-model.js');
  const ctrlCompliantFile = path.join(ctrlDir, 'good-controller.js');
  const ctrlBypassingFile = path.join(ctrlDir, 'bad-controller.js');

  fs.writeFileSync(srvFile, 'module.exports = {};', 'utf8');
  fs.writeFileSync(modFile, 'module.exports = {};', 'utf8');
  fs.writeFileSync(ctrlCompliantFile, "const svc = require('../services/order-service');", 'utf8');
  fs.writeFileSync(ctrlBypassingFile, "const model = require('../models/order-model');", 'utf8');

  const contract = {
    controllers: {
      name: 'controllers',
      pathPattern: /(?:^|[\\/])controllers(?:[\\/]|$)/i,
      mayImport: ['services']
    },
    services: {
      name: 'services',
      pathPattern: /(?:^|[\\/])services(?:[\\/]|$)/i,
      mayImport: ['models']
    },
    models: {
      name: 'models',
      pathPattern: /(?:^|[\\/])models(?:[\\/]|$)/i,
      mayImport: []
    }
  };

  // 1. Compliant file
  const findingsGood = [];
  const dedGood = checkLayerContract(tmpDir, [ctrlCompliantFile], contract, findingsGood);
  assert.equal(dedGood, 0);
  assert.equal(findingsGood.length, 0);

  // 2. Bypassing file
  const findingsBad = [];
  const dedBad = checkLayerContract(tmpDir, [ctrlBypassingFile], contract, findingsBad);
  assert.equal(dedBad, 15);
  assert.equal(findingsBad.length, 1);
  assert.match(findingsBad[0].message, /Layer Contract Violation/);
  assert.match(findingsBad[0].message, /prohibited from importing 'models'/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('computeDocChecksum generates valid short SHA-256 hash', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hash-test-'));
  const testFile = path.join(tmpDir, 'test.md');
  fs.writeFileSync(testFile, '# Test Doc\nContent.', 'utf8');

  const hash = computeDocChecksum(testFile);
  assert.ok(hash);
  assert.equal(hash.length, 8);
  assert.match(hash, /^[a-f0-9]{8}$/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('verifyPlanningChecksums detects stale task backlogs when upstream docs change', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-test-'));
  const docsDir = path.join(tmpDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  const reqFile = path.join(docsDir, 'requirements.md');
  const archFile = path.join(docsDir, 'architecture.md');
  const tasksFile = path.join(docsDir, 'tasks.md');

  fs.writeFileSync(reqFile, '# Requirements V1\nBase.', 'utf8');
  fs.writeFileSync(archFile, '# Architecture V1\nBase.', 'utf8');

  const reqHash = computeDocChecksum(reqFile);
  const archHash = computeDocChecksum(archFile);

  // 1. Stamped tasks.md matching current files
  fs.writeFileSync(
    tasksFile,
    `# Task Backlog\n\n<!-- planning-checksums:\nrequirements: ${reqHash}\narchitecture: ${archHash}\n-->`,
    'utf8'
  );

  const findings1 = [];
  const ded1 = verifyPlanningChecksums(tmpDir, findings1);
  assert.equal(ded1, 0);
  assert.equal(findings1.length, 0);

  // 2. Modify requirements.md to make tasks.md stale
  fs.writeFileSync(reqFile, '# Requirements V2 — MODIFIED\nNew features added.', 'utf8');

  const findings2 = [];
  const ded2 = verifyPlanningChecksums(tmpDir, findings2);
  assert.equal(ded2, 10);
  assert.equal(findings2.length, 1);
  assert.match(findings2[0].message, /Stale Task Backlog/);
  assert.match(findings2[0].message, /docs\/requirements\.md has changed/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('calculateKlocMetrics accurately counts SLOC, KLOC, and density scaling factor', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloc-test-'));
  const file1 = path.join(tmpDir, 'file1.js');
  const file2 = path.join(tmpDir, 'file2.js');

  fs.writeFileSync(file1, 'const a = 1;\nconst b = 2;\n\nconst c = 3;\n', 'utf8'); // 3 non-empty lines
  fs.writeFileSync(file2, 'function foo() {\n  return 42;\n}\n', 'utf8'); // 3 non-empty lines

  const metrics = calculateKlocMetrics([file1, file2], tmpDir, () => false);
  assert.equal(metrics.fileCount, 2);
  assert.equal(metrics.totalSloc, 6);
  assert.equal(metrics.kloc, 0.01);
  assert.equal(metrics.densityFactor, 1.0); // Baseline floor is 1.0

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
