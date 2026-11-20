/**
 * tests/check-release.test.js — Unit Tests for Release & Completeness Auditor
 *
 * Uses Node.js native test runner (node:test). Zero external dependencies.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  checkCrossToolSync,
  checkVersionAndChangelog,
  checkCountAlignment,
  checkGitStatus,
  runReleaseAudit
} = require('../scripts/check-release');

const ROOT_DIR = path.resolve(__dirname, '..');

test('checkCrossToolSync detects synchronized workspace state', () => {
  const result = checkCrossToolSync(ROOT_DIR);
  assert.equal(result.passed, true);
  assert.equal(result.label, 'Cross-Tool Parity');
  assert.match(result.details, /All \d+ editor configs/);
});

test('checkVersionAndChangelog validates version parity between package.json and CHANGELOG.md', () => {
  const result = checkVersionAndChangelog(ROOT_DIR);
  assert.equal(result.passed, true);
  assert.equal(result.label, 'Version & Changelog Parity');
  assert.match(result.details, /v1\.7\.0/);
});

test('checkVersionAndChangelog flags mismatch when version is not documented in CHANGELOG.md', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rel-test-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ version: '9.9.9' }), 'utf8');
  fs.writeFileSync(path.join(tmpDir, 'CHANGELOG.md'), '# Changelog\n\n## [1.0.0] - 2026-01-01\n', 'utf8');

  const result = checkVersionAndChangelog(tmpDir);
  assert.equal(result.passed, false);
  assert.match(result.details, /v9\.9\.9.*has no matching/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('checkCountAlignment verifies declared counts against actual prompts and skills', () => {
  const result = checkCountAlignment(ROOT_DIR);
  assert.equal(result.passed, true);
  assert.equal(result.label, 'Skill & Persona Count Parity');
  assert.match(result.details, /Verified 21 personas and 20 skills/);
});

test('checkGitStatus returns status result object', () => {
  const result = checkGitStatus(ROOT_DIR);
  assert.ok(typeof result.passed === 'boolean');
  assert.equal(result.label, 'Git Working Tree');
});

test('runReleaseAudit executes all checks and outputs status', () => {
  const audit = runReleaseAudit(ROOT_DIR);
  assert.ok(Array.isArray(audit.checks));
  assert.equal(audit.checks.length, 5);
  assert.equal(audit.passed, true);
});
