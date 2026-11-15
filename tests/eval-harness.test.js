/**
 * tests/eval-harness.test.js — Unit Tests for Evaluation Harness
 *
 * Uses Node.js native test runner (node:test). Zero external dependencies.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isTestFile, isScriptOrCliFile, calculateGrade } = require('../scripts/eval-harness');
const { checkLineInvariants } = require('../scripts/eval-dimensions');

test('isTestFile identifies test paths and prevents false positive exclusions', () => {
  // Real test paths (MUST match)
  assert.equal(isTestFile('tests/unit/user.test.js'), true);
  assert.equal(isTestFile('src/components/Modal.spec.tsx'), true);
  assert.equal(isTestFile('__tests__/auth.js'), true);
  assert.equal(isTestFile('test/api/orders.js'), true);
  assert.equal(isTestFile('src/fixtures/mock-db.js'), true);

  // Legitimate non-test paths with substring "test" (MUST NOT match)
  assert.equal(isTestFile('src/contest/contestController.js'), false);
  assert.equal(isTestFile('src/attestation/verifier.js'), false);
  assert.equal(isTestFile('src/services/latest-orders.js'), false);
  assert.equal(isTestFile('src/controllers/testamentService.js'), false);
});

test('isScriptOrCliFile identifies CLI and internal script paths', () => {
  assert.equal(isScriptOrCliFile('bin/cli.js'), true);
  assert.equal(isScriptOrCliFile('scripts/eval-harness.js'), true);
  assert.equal(isScriptOrCliFile('scripts/sync-tools.js'), true);

  assert.equal(isScriptOrCliFile('src/controllers/userController.js'), false);
  assert.equal(isScriptOrCliFile('src/models/user.js'), false);
});

test('checkLineInvariants detects anti-patterns and allows compliant code', () => {
  // 1. Bare empty catch
  const findingsCatch = [];
  const dedCatch = checkLineInvariants('} catch (err) {}', 'service.js', 10, [], findingsCatch);
  assert.equal(dedCatch, 20);
  assert.equal(findingsCatch[0].severity, 'FAIL');
  assert.match(findingsCatch[0].message, /bare empty catch block/i);

  // Compliant catch
  const findingsCleanCatch = [];
  const dedCleanCatch = checkLineInvariants('} catch (err) { logger.error("Failed", { err }); throw err; }', 'service.js', 10, [], findingsCleanCatch);
  assert.equal(dedCleanCatch, 0);

  // 2. SQL injection string concatenation
  const findingsSql = [];
  const dedSql = checkLineInvariants('const q = "SELECT * FROM users WHERE id = " + userId;', 'service.js', 20, [], findingsSql);
  assert.equal(dedSql, 25);
  assert.equal(findingsSql[0].severity, 'FAIL');

  // Compliant parameterized SQL
  const findingsCleanSql = [];
  const dedCleanSql = checkLineInvariants('const q = await db.query("SELECT * FROM users WHERE id = $1", [userId]);', 'service.js', 20, [], findingsCleanSql);
  assert.equal(dedCleanSql, 0);

  // 3. Hardcoded secret / token
  const findingsSecret = [];
  const dedSecret = checkLineInvariants('const apiKey = "sk_live_99999999999999999999";', 'service.js', 30, [], findingsSecret);
  assert.equal(dedSecret, 25);

  // Compliant environment variable secret
  const findingsEnv = [];
  const dedEnv = checkLineInvariants('const apiKey = process.env.API_KEY;', 'service.js', 30, [], findingsEnv);
  assert.equal(dedEnv, 0);

  // 4. console.log in production path
  const findingsLog = [];
  const dedLog = checkLineInvariants('console.log("Processing order");', 'service.js', 40, [], findingsLog);
  assert.equal(dedLog, 5);
  assert.equal(findingsLog[0].severity, 'WARN');

  // Comments should be ignored
  const findingsComment = [];
  const dedComment = checkLineInvariants('// console.log("debug")', 'service.js', 50, [], findingsComment);
  assert.equal(dedComment, 0);
});

test('calculateGrade maps numerical scores to academic grades accurately', () => {
  assert.equal(calculateGrade(100), 'A+');
  assert.equal(calculateGrade(95), 'A+');
  assert.equal(calculateGrade(94.9), 'A');
  assert.equal(calculateGrade(90), 'A');
  assert.equal(calculateGrade(89), 'B');
  assert.equal(calculateGrade(80), 'B');
  assert.equal(calculateGrade(75), 'C');
  assert.equal(calculateGrade(65), 'D');
  assert.equal(calculateGrade(50), 'F');
});
