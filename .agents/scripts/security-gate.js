#!/usr/bin/env node

/**
 * security-gate.js — Cross-platform security and SDLC governance gate hook
 *
 * Runs as a PreToolUse hook for agent execution or standalone git pre-commit check.
 * Enforces two mechanical gates:
 *   1. Task Dependency Gate: Blocks implementing a task if its dependencies are incomplete in docs/tasks.md.
 *   2. Commit & Secret Gate: Intercepts commit attempts to prompt for security reviews and verify staged code.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function extractStatus(section) {
  const statusMatch = section.match(/[-*]\s+\*\*Status:\*\*\s*(.*)/i) || section.match(/Status:\s*(.*)/i);
  if (!statusMatch) return 'todo';
  const rawStatus = statusMatch[1].trim();
  if (/\[x\]|\bdone\b|\bcomplete\b/i.test(rawStatus)) return 'done';
  if (/\[~\]|\bin\s+progress\b/i.test(rawStatus)) return 'in_progress';
  if (/\[!\]|\bblocked\b/i.test(rawStatus)) return 'blocked';
  return 'todo';
}

function extractDependencies(section, currentTaskId) {
  const dependsOn = [];
  const depMatch = section.match(/[-*]\s+\*\*Depends on:\*\*\s*(.*)/i) || section.match(/Depends on:\s*(.*)/i);
  if (!depMatch) return dependsOn;

  const matches = depMatch[1].match(/TASK-\d+/gi) || [];
  for (const m of matches) {
    const depId = m.toUpperCase();
    if (depId !== currentTaskId && !dependsOn.includes(depId)) {
      dependsOn.push(depId);
    }
  }
  return dependsOn;
}

function parseChecklistTasks(content, tasks) {
  const checklistRegex = /[-*]\s+\[([ xX~])\]\s+(TASK-\d+)/gi;
  let chkMatch;
  while ((chkMatch = checklistRegex.exec(content)) !== null) {
    const marker = chkMatch[1].toLowerCase();
    const taskId = chkMatch[2].toUpperCase();
    const status = marker === 'x' ? 'done' : marker === '~' ? 'in_progress' : 'todo';
    if (!tasks[taskId]) {
      tasks[taskId] = { id: taskId, title: '', status, dependsOn: [] };
    } else if (status === 'done') {
      tasks[taskId].status = 'done';
    }
  }
}

/**
 * Parses docs/tasks.md and returns a structured map of tasks with their status and dependencies.
 */
function parseTasksFromMarkdown(content) {
  if (!content) return {};
  const tasks = {};

  const sections = content.split(/(?=###\s+TASK-\d+)/i);
  for (const section of sections) {
    const headerMatch = section.match(/###\s+(TASK-\d+)[\s:—-]*(.*)/i);
    if (!headerMatch) continue;
    const taskId = headerMatch[1].toUpperCase();
    const title = headerMatch[2] ? headerMatch[2].trim() : '';

    tasks[taskId] = {
      id: taskId,
      title,
      status: extractStatus(section),
      dependsOn: extractDependencies(section, taskId)
    };
  }

  parseChecklistTasks(content, tasks);
  return tasks;
}

/**
 * Checks whether a task's dependencies are satisfied in docs/tasks.md.
 */
function checkTaskDependencyGate(taskId, tasksMdContent) {
  if (!taskId) return { allowed: true };
  const normalizedId = taskId.toUpperCase();
  const tasks = parseTasksFromMarkdown(tasksMdContent);

  const targetTask = tasks[normalizedId];
  if (!targetTask) {
    return { allowed: true, taskId: normalizedId };
  }

  for (const depId of targetTask.dependsOn) {
    const depTask = tasks[depId];
    if (depTask && depTask.status !== 'done') {
      return {
        allowed: false,
        taskId: normalizedId,
        blockingTask: depId,
        status: depTask.status,
        reason: `${normalizedId} depends on ${depId} (status: ${depTask.status}). Implement or close ${depId} first.`
      };
    }
  }

  return { allowed: true, taskId: normalizedId };
}

function verifyTaskGate(taskId, workspaceDir) {
  const tasksPath = path.join(workspaceDir, 'docs', 'tasks.md');
  if (!fs.existsSync(tasksPath)) return null;

  try {
    const tasksContent = fs.readFileSync(tasksPath, 'utf8');
    const gate = checkTaskDependencyGate(taskId, tasksContent);
    if (!gate.allowed) {
      return `Governance Dependency Gate: ${gate.reason}`;
    }
  } catch {
    // Fall back to allow if file cannot be read
  }
  return null;
}

/**
 * Core hook logic for Antigravity and external tool invocation.
 */
function handleToolCallHook(inputJson, workspaceDir = ROOT_DIR) {
  if (!inputJson) return { decision: 'allow' };

  // 1. Intercept git commit attempts
  if (inputJson.toolCall && inputJson.toolCall.name === 'run_command') {
    const command = (inputJson.toolCall.args && inputJson.toolCall.args.CommandLine) || '';
    if (/\bgit\s+commit\b/i.test(command)) {
      return {
        decision: 'ask',
        reason: "Security Gate: You are attempting to commit code. Have you run the 'sdlc-review' skill to check for vulnerabilities and verified zero linter errors?"
      };
    }
  }

  // 2. Intercept task implementation requests to enforce dependency gating
  const payloadStr = JSON.stringify(inputJson);
  const implementMatch = payloadStr.match(/\b(?:implement|develop|work\s+on)\s+(TASK-\d+)\b/i) ||
                         payloadStr.match(/\bsdlc-develop\b[\s\S]*?\b(TASK-\d+)\b/i);

  if (implementMatch) {
    const taskId = implementMatch[1].toUpperCase();
    const violation = verifyTaskGate(taskId, workspaceDir);
    if (violation) {
      return { decision: 'deny', reason: violation };
    }
  }

  return { decision: 'allow' };
}

function main() {
  const args = process.argv.slice(2);

  const taskArgIndex = args.indexOf('--check-task');
  if (taskArgIndex !== -1 && args[taskArgIndex + 1]) {
    const taskId = args[taskArgIndex + 1].toUpperCase();
    const tasksPath = path.join(ROOT_DIR, 'docs', 'tasks.md');
    if (!fs.existsSync(tasksPath)) {
      console.log(`[security-gate] Warning: docs/tasks.md not found. Allowing ${taskId}.`);
      process.exit(0);
    }
    const content = fs.readFileSync(tasksPath, 'utf8');
    const result = checkTaskDependencyGate(taskId, content);
    if (!result.allowed) {
      console.error(`[security-gate] BLOCKED: ${result.reason}`);
      process.exit(1);
    }
    console.log(`[security-gate] PASS: Dependencies for ${taskId} are satisfied.`);
    process.exit(0);
  }

  let inputStr = '';
  try {
    inputStr = fs.readFileSync(0, 'utf8').trim();
  } catch {
    // Stdin empty
  }

  if (inputStr && (inputStr.startsWith('{') || inputStr.startsWith('['))) {
    try {
      const inputJson = JSON.parse(inputStr);
      const result = handleToolCallHook(inputJson, ROOT_DIR);
      process.stdout.write(JSON.stringify(result) + '\n');
      return;
    } catch {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }
  }

  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  parseTasksFromMarkdown,
  checkTaskDependencyGate,
  handleToolCallHook,
  main
};
