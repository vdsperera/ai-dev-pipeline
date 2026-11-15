/**
 * tests/cli.test.js — Unit Tests for CLI Argument Parser & Commands
 *
 * Uses Node.js native test runner (node:test). Zero external dependencies.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, getPkgVersion } = require('../bin/cli');

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
});

test('getPkgVersion returns a valid semver string', () => {
  const version = getPkgVersion();
  assert.match(version, /^\d+\.\d+\.\d+/);
});
