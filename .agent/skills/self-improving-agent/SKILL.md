---
name: self-improving-agent
description: Enables the AI agent to iteratively improve itself by logging lessons learned, creating new skills from session patterns, and maintaining a living knowledge base.
---

# Self-Improving Agent

> The agent that learns from every session and gets better at its job.

## Purpose
This skill enables the AI agent to:
1. **Log lessons learned** from each session into a persistent knowledge base
2. **Create new micro-skills** when it discovers repeatable patterns
3. **Update existing skills** when better approaches are found
4. **Maintain session retrospectives** that feed future improvements
5. **Track agent performance metrics** over time

## When to Use
- At the END of every significant session (after completing a task)
- When discovering a new pattern that could be reused
- When a workaround is found for a recurring problem
- When the agent makes an error and wants to prevent it in the future

## Self-Improvement Workflow

### Step 1: Session Retrospective
After completing a task, generate a structured retrospective:

```markdown
## Session Retrospective — [DATE]

### What Worked
- List techniques, approaches, and tools that were effective

### What Didn't Work
- List failed approaches, dead ends, and time wasters

### Lessons Learned
- Distill actionable insights from the session

### Patterns Discovered
- Repeatable patterns that could become skills or workflows

### Knowledge Gaps
- Areas where more information or skills are needed
```

Save to: `<appDataDir>/knowledge/<topic>/artifacts/retrospective_<date>.md`

### Step 2: Pattern Detection
Analyze retrospectives for recurring patterns:

| Pattern Type | Action | Example |
|---|---|---|
| **Repeated fix** | Create a workflow | "Every time X breaks, do Y" |
| **Common research path** | Create a knowledge item | "The answer to X is always found at Y" |
| **Tool chain** | Create a skill | "To do X, always run A→B→C" |
| **Error resolution** | Create a troubleshooting guide | "Error X is caused by Y, fixed by Z" |

### Step 3: Skill Generation
When a pattern is detected ≥2 times, create a new skill:

```bash
# Create skill directory
mkdir -p .agent/skills/<skill-name>

# Generate SKILL.md with:
# - Frontmatter (name, description)
# - When to use
# - Step-by-step instructions
# - Examples from past sessions
```

### Step 4: Knowledge Base Update
Update the agent's knowledge items:

```bash
# Create/update knowledge item
mkdir -p <appDataDir>/knowledge/<topic>/artifacts/

# Write metadata.json
{
  "title": "<Topic Title>",
  "summary": "<What was learned>",
  "created": "<timestamp>",
  "lastAccessed": "<timestamp>",
  "references": ["<source files>"]
}

# Write artifact(s)
# - architecture.md, patterns.md, troubleshooting.md, etc.
```

### Step 5: Metrics Tracking
Log performance metrics for continuous improvement:

```markdown
## Agent Performance Log

| Date | Task | Time | Success | Score | Notes |
|------|------|------|---------|-------|-------|
| 2026-04-02 | SEO Audit | 15min | ✅ | 92 | Used squirrel CLI |
| 2026-04-02 | Schema Fix | 5min | ✅ | 100 | Reused pattern |
```

Save to: `<appDataDir>/knowledge/agent-performance/artifacts/metrics.md`

## Improvement Categories

### 1. Shamrock-Specific Patterns
- Wix Velo element ID discovery workflow
- GAS deployment verification steps
- CMS data integrity checks
- Schema markup validation

### 2. SEO Intelligence
- County page generation optimization
- FAQ content enhancement patterns
- Structured data best practices
- Sitemap discovery techniques

### 3. System Integration
- Wix ↔ GAS bridge debugging
- SignNow packet validation
- Telegram bot flow testing
- Node-RED cron job monitoring

### 4. Error Recovery
- Common GAS deployment failures
- Wix sync conflicts
- npm permission issues
- Git merge strategies

## Auto-Improvement Triggers

The agent should automatically trigger self-improvement when:
1. ❌ **An error occurs** → Log the error, root cause, and fix
2. 🔄 **A task is repeated** → Create a workflow or skill
3. 💡 **A new technique is discovered** → Update knowledge base
4. 📊 **A task takes >30min** → Analyze for optimization opportunities
5. 🎯 **A score improves** → Document what changed and why

## Integration with Existing Skills

This skill enhances all other skills by:
- Adding retrospective data to `using-superpowers` checks
- Feeding audit results into `production-code-audit`
- Updating `wix_gas_bridge_integrity` with new failure modes
- Enriching `systematic-debugging` with resolved cases

## Example: Auto-Generated Skill

When the agent notices it has fixed "County County" redundancy 3 times:

```markdown
---
name: county-name-sanitizer
description: Strip trailing "County" suffix from CMS county names to prevent "Lee County County" redundancy
---

# County Name Sanitizer

## When to Use
When generating county-specific content from CMS data.

## Fix
```javascript
const cleanName = countyName.replace(/\s+County$/i, '');
```

## Files Affected
- `county-generator.jsw` (line 114)
- Any template using `${countyName} County`
```
