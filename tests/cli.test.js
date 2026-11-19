/**
 * tests/cli.test.js — Unit Tests for CLI Argument Parser & Commands
 *
 * Uses Node.js native test runner (node:test). Zero external dependencies.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseArgs, getPkgVersion } = require('../bin/cli');
const { migrateTemplateTag, migrateProjectTemplates } = require('../bin/commands/migrate');

test('parseArgs correctly parses flags and positional subcommands', () => {
  const flags1 = parseArgs(['init', '--yes', '--tools=cursor,claude', '--preset=rapid-prototype']);
  assert.equal(flags1.command, 'init');
  assert.equal(flags1.yes, true);
  assert.deepEqual(flags1.tools, ['cursor', 'claude']);
  assert.equal(flags1.preset, 'rapid-prototype');

  const flags2 = parseArgs(['eval', '--threshold', '90', '--task', 'TASK-001']);
  assert.equal(flags2.command, 'eval');

  const flags3 = parseArgs(['status']);
  assert.equal(flags3.command, 'status');

  const flags4 = parseArgs(['--help']);
  assert.equal(flags4.help, true);

  const flags5 = parseArgs(['--version']);
  assert.equal(flags5.version, true);

  const flags6 = parseArgs(['sync', '--global']);
  assert.equal(flags6.command, 'sync');
  assert.equal(flags6.global, true);
});

test('getPkgVersion returns a valid semver string', () => {
  const version = getPkgVersion();
  assert.match(version, /^\d+\.\d+\.\d+/);
});

test('migrateTemplateTag injects template tags non-destructively', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-pipe-mig-'));
  const testFile = path.join(tmpDir, 'test-doc.md');

  // 1. Initial creation without tag
  fs.writeFileSync(testFile, '# Test Document\n\nSome custom content here.', 'utf8');

  // 2. Run migration
  const res1 = migrateTemplateTag(testFile, 'pipeline-template: test/v1', /^(#[^\n]+)/);
  assert.equal(res1.status, 'upgraded');

  const content1 = fs.readFileSync(testFile, 'utf8');
  assert.match(content1, /<!-- pipeline-template: test\/v1 -->/);
  assert.match(content1, /Some custom content here\./);

  // 3. Second run is idempotent
  const res2 = migrateTemplateTag(testFile, 'pipeline-template: test/v1', /^(#[^\n]+)/);
  assert.equal(res2.status, 'current');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('migrateProjectTemplates processes docs directory safely', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-pipe-proj-'));
  const docsDir = path.join(tmpDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  fs.writeFileSync(path.join(docsDir, 'architecture.md'), '# System Architecture\nComponents.', 'utf8');

  const results = migrateProjectTemplates(tmpDir);
  assert.equal(results.upgraded.length, 1);
  assert.equal(results.missing.length, 2);

  const res2 = migrateProjectTemplates(tmpDir);
  assert.equal(res2.upgraded.length, 0);
  assert.equal(res2.current.length, 1);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
