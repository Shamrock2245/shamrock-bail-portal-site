# Systematic Debugging

<SKILL_METADATA>
description: A rigorous, step-by-step process for solving complex technical issues without guessing
version: 1.0.0
author: sickn33
</SKILL_METADATA>

## Overview
Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use
Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Manager wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases
You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation
**Goal**: Identify the exact line of code, configuration, or data that is causing the issue.
**Output**: A confirmed hypothesis backed by evidence (logs, reproduction).

1.  **Reproduce**: Can you make it fail consistently? If not, valid logging is your first task.
2.  **Isolate**: Remove variables. Does it happen in dev? With a different user? With mocked data?
3.  **Trace**: Follow the execution path. Don't guess—read the logs or add logging to see the state at each step.

### Phase 2: Pattern Analysis
**Goal**: Understand WHY the error happened, not just WHERE.
**Output**: Understanding of the systemic flaw.

1.  **History**: Has this code changed recently?
2.  **Similarities**: Are there other places using this same pattern that might also be broken?
3.  **Assumptions**: What assumption turned out to be false? (e.g., "The API always returns JSON")

### Phase 3: Hypothesis and Testing
**Goal**: Propose a fix and PROVE it works before applying.
**Output**: A verified solution plan.

1.  **Propose**: Design the fix.
2.  **Verify**: How will you prove the fix works? (e.g., "If I change X, the log should show Y").

### Phase 4: Implementation
**Goal**: Apply the fix and prevent regression.
**Output**: Committed code and regression test.

1.  **Apply**: Write the code.
2.  **Test**: Run your verification steps.
3.  **Future-proof**: Add a test case or improving logging so this failure mode is obvious next time.

## Red Flags - STOP and Follow Process
If you catch yourself saying these things, you are spiraling. STOP.

- "It should work." (It doesn't to.)
- "I'll just try changing this." (Guessing.)
- "That's impossible." (Reality disagrees.)
- "It works on my machine." (Irrelevant.)
- "I implemented it exactly like the docs." (Docs might be wrong, or your understanding might be.)
