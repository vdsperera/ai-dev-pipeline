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
const { getSkillsCatalog, filterCatalog, formatTerminalOutput } = require('../bin/commands/cheatsheet');

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

  const flags7 = parseArgs(['cheatsheet', '--phase=planning', '--json']);
  assert.equal(flags7.command, 'cheatsheet');
  assert.equal(flags7.phase, 'planning');
  assert.equal(flags7.json, true);

  const flags8 = parseArgs(['list', '--search=debug']);
  assert.equal(flags8.command, 'list');
  assert.equal(flags8.search, 'debug');

  const flags9 = parseArgs(['check']);
  assert.equal(flags9.command, 'check');

  const flags10 = parseArgs(['audit']);
  assert.equal(flags10.command, 'audit');
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

test('getSkillsCatalog returns 7 SDLC phases and 20 skills', () => {
  const catalog = getSkillsCatalog();
  assert.equal(catalog.length, 7);

  const totalSkills = catalog.reduce((acc, phase) => acc + phase.skills.length, 0);
  assert.ok(totalSkills >= 20, `Expected at least 20 skills, got ${totalSkills}`);

  const phaseIds = catalog.map(p => p.phaseId);
  assert.ok(phaseIds.includes('planning'));
  assert.ok(phaseIds.includes('develop'));
  assert.ok(phaseIds.includes('review'));
  assert.ok(phaseIds.includes('test'));
  assert.ok(phaseIds.includes('deploy'));
  assert.ok(phaseIds.includes('docs'));
  assert.ok(phaseIds.includes('governance'));
});

test('filterCatalog correctly filters by phase and keyword', () => {
  const catalog = getSkillsCatalog();

  const planningOnly = filterCatalog(catalog, { phase: 'planning' });
  assert.equal(planningOnly.length, 1);
  assert.equal(planningOnly[0].phaseId, 'planning');

  const debugMatch = filterCatalog(catalog, { search: 'debug' });
  assert.ok(debugMatch.length > 0);
  assert.ok(debugMatch.some(g => g.skills.some(s => s.skill === 'sdlc-debug')));

  const noMatch = filterCatalog(catalog, { search: 'nonexistent-skill-xyz' });
  assert.equal(noMatch.length, 0);
});

test('formatTerminalOutput generates clean formatted string containing skills', () => {
  const catalog = getSkillsCatalog();
  const mockColors = {
    bold: '', reset: '', cyan: '', green: '', yellow: '', dim: '', magenta: ''
  };
  const output = formatTerminalOutput(catalog.slice(0, 1), [], mockColors);
  assert.match(output, /Capabilities Catalog & Quick Reference/);
  assert.match(output, /sdlc-plan/);
  assert.match(output, /docs\/quick-reference\.md/);
});
