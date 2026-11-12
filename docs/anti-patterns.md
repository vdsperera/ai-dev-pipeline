# Anti-Patterns & Lessons Learned

This document serves as the persistent memory bank of corrected AI mistakes, invalid assumptions, deprecated API usages, and recurring defects for this project.

> **Mandatory Rule for Agents**: Before implementing any task or fixing a bug, read this document to guarantee previously identified mistakes are never repeated.

---

## Anti-Pattern Registry

### AP-001: Example / Template Entry
- **Mistake**: What went wrong or was incorrectly assumed (e.g., swallowed exceptions, assumed Python 3.12 syntax in a Python 3.9 environment).
- **Correction**: The correct approach, pattern, or API to use instead.
- **Rule**: The permanent invariant agents must follow in this codebase.

### AP-002: Unreleased Resource Pools on Error Catch
- **Mistake**: Acquiring pooled connections (database, socket, HTTP client) without guaranteed release in a mandatory `finally` block, causing connection starvation when upstream calls time out or throw errors.
- **Correction**: Always encapsulate pooled resource acquisition in `try { ... } finally { client.release(); }`.
- **Rule**: Every pooled connection acquired must be released in a `finally` block in the exact same scope where it was acquired. Never release connections only at the end of the `try` block.

### AP-003: Autonomous Bug Fixing Without Prior Root Cause Explanation & Approval
- **Mistake**: When investigating a test failure, bug report, or CI crash, jumping directly into modifying code, committing, or pushing in the same turn without first explaining the root cause and proposed fix to the user.
- **Correction**: Always separate bug investigation into two distinct human-in-the-loop phases:
  1. **Diagnosis Phase (Turn 1)**: Explain the root cause in plain English, show what code is affected, and propose the minimal fix.
  2. **Fix Phase (Turn 2)**: Do not modify files, execute git commits, or push until the user explicitly confirms (e.g., "yes", "proceed").
- **Rule**: Never apply a fix or commit code for an unexpected error or CI failure in the same turn it is diagnosed. Human-in-the-loop confirmation is the mandatory default. Autonomous fixes are only permitted when the user explicitly commands an "auto-fix" upfront.

<!-- Add newly learned project anti-patterns below in the AP-NNN format -->
