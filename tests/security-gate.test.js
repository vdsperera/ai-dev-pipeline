/**
 * tests/security-gate.test.js — Unit Tests for SDLC Security & Dependency Gate
 *
 * Uses Node.js native test runner (node:test). Zero external dependencies.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseTasksFromMarkdown,
  checkTaskDependencyGate,
  handleToolCallHook
} = require('../scripts/security-gate');

const sampleTasksMd = `
# Task Backlog

### TASK-001 — Initialize Repository & Toolchain
- **Layer:** 1 — Infrastructure
- **Depends on:** —
- **Status:** [x] Done

### TASK-002 — User Model & Schema
- **Layer:** 2 — Data models
- **Depends on:** TASK-001
- **Status:** [x] Done

### TASK-003 — Authentication Endpoints
- **Layer:** 3 — API contracts
- **Depends on:** TASK-002
- **Status:** [~] In progress

### TASK-004 — Profile Management Service
- **Layer:** 4 — Business logic
- **Depends on:** TASK-003
- **Status:** [ ] Todo
`;

test('parseTasksFromMarkdown correctly extracts tasks, statuses, and dependencies', () => {
  const tasks = parseTasksFromMarkdown(sampleTasksMd);
  assert.ok(tasks['TASK-001']);
  assert.equal(tasks['TASK-001'].status, 'done');
  assert.deepEqual(tasks['TASK-001'].dependsOn, []);

  assert.ok(tasks['TASK-002']);
  assert.equal(tasks['TASK-002'].status, 'done');
  assert.deepEqual(tasks['TASK-002'].dependsOn, ['TASK-001']);

  assert.ok(tasks['TASK-003']);
  assert.equal(tasks['TASK-003'].status, 'in_progress');
  assert.deepEqual(tasks['TASK-003'].dependsOn, ['TASK-002']);

  assert.ok(tasks['TASK-004']);
  assert.equal(tasks['TASK-004'].status, 'todo');
  assert.deepEqual(tasks['TASK-004'].dependsOn, ['TASK-003']);
});

test('checkTaskDependencyGate allows task when all dependencies are completed', () => {
  const result = checkTaskDependencyGate('TASK-002', sampleTasksMd);
  assert.equal(result.allowed, true);
  assert.equal(result.taskId, 'TASK-002');
});

test('checkTaskDependencyGate blocks task when a dependency is incomplete', () => {
  const result = checkTaskDependencyGate('TASK-004', sampleTasksMd);
  assert.equal(result.allowed, false);
  assert.equal(result.taskId, 'TASK-004');
  assert.equal(result.blockingTask, 'TASK-003');
  assert.equal(result.status, 'in_progress');
  assert.match(result.reason, /TASK-004 depends on TASK-003 \(status: in_progress\)/);
});

test('checkTaskDependencyGate allows task with no dependencies', () => {
  const result = checkTaskDependencyGate('TASK-001', sampleTasksMd);
  assert.equal(result.allowed, true);
});

test('checkTaskDependencyGate allows unlisted or ad-hoc tasks gracefully', () => {
  const result = checkTaskDependencyGate('TASK-999', sampleTasksMd);
  assert.equal(result.allowed, true);
});

test('handleToolCallHook asks user confirmation before git commit', () => {
  const input = {
    toolCall: {
      name: 'run_command',
      args: { CommandLine: 'git commit -m "feat: user login"' }
    }
  };
  const decision = handleToolCallHook(input);
  assert.equal(decision.decision, 'ask');
  assert.match(decision.reason, /Security Gate: You are attempting to commit code/);
});

test('handleToolCallHook allows normal non-commit commands', () => {
  const input = {
    toolCall: {
      name: 'run_command',
      args: { CommandLine: 'npm test' }
    }
  };
  const decision = handleToolCallHook(input);
  assert.equal(decision.decision, 'allow');
});
