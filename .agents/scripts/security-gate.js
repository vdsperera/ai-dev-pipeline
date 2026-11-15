#!/usr/bin/env node

/**
 * security-gate.js — Cross-platform security and review gate hook
 *
 * Runs as a PreToolUse hook for agent execution or standalone git pre-commit check.
 * Replaces platform-specific PowerShell scripts with pure, cross-platform Node.js.
 */

'use strict';

const fs = require('fs');

function handleToolCallHook(inputJson) {
  const output = { decision: 'allow' };

  if (inputJson && inputJson.toolCall && inputJson.toolCall.name === 'run_command') {
    const command = (inputJson.toolCall.args && inputJson.toolCall.args.CommandLine) || '';
    if (/\bgit\s+commit\b/i.test(command)) {
      return {
        decision: 'ask',
        reason: "Security Gate: You are attempting to commit code. Have you run the 'sdlc-review' skill to check for vulnerabilities first?"
      };
    }
  }

  return output;
}

function main() {
  let inputStr = '';
  try {
    inputStr = fs.readFileSync(0, 'utf8').trim();
  } catch {
    // Stdin empty or not available
  }

  if (inputStr && (inputStr.startsWith('{') || inputStr.startsWith('['))) {
    try {
      const inputJson = JSON.parse(inputStr);
      const result = handleToolCallHook(inputJson);
      process.stdout.write(JSON.stringify(result) + '\n');
      return;
    } catch {
      // JSON parse failure, default allow
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }
  }

  // Fallback for direct execution
  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = { handleToolCallHook, main };

