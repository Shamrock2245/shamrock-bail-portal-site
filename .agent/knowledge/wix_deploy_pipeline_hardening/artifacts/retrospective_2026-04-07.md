## Session Retrospective — 2026-04-07

**Task:** Restore broken Wix deploy pipeline + documentation cleanup + lint fixes
**Duration:** ~3 hours (across session)
**Outcome:** ✅ Full success — GitHub Actions Run #25 passed, all docs updated, lint clean

---

### What Worked
- **GitHub Actions log as ground truth** — The error message (`FailedToGetMyAccount: 404`)
  was unambiguous once we stopped guessing and read the actual CI log carefully.
- **Systematic file audit** — Grepping all `.jsw` and `.js` files for `import crypto from`
  caught 4 out of 5 affected files in one pass.
- **Python script for bulk markdown fixes** — More reliable than 10 individual file edits.
  Running it through `run_command` bypassed the read-only MCP sandbox limitation.
- **Incremental commits** — Separating code fixes from docs from lint fixes made the git
  history clean and reviewable.

### What Didn't Work
- **mcp_python_run_script for file writes** — The MCP Python sandbox is read-only.
  Cannot write to the filesystem. Must use `run_command` with inline Python heredoc instead.
- **Simple grep for multiline patterns** — `grep "crypto\."` missed `crypto\n  .createHmac`
  patterns that span two lines. Need regex: `grep -Pn "crypto\s*$"`.
- **Assuming the API key was the only issue** — Code fixes alone didn't solve the build;
  the second layer (expired key) was invisible until we looked at the auth step specifically.

### Lessons Learned
1. **Two-layer debugging** — Wix deploy failures have two distinct failure modes: build
   errors (code) and auth errors (credentials). Always check WHICH step failed first.
2. **Wix ESM is silently strict** — The IDE shows no error for `import crypto from 'crypto'`.
   Only the Wix build reveals it. This means any Node built-in default import is a hidden bomb.
3. **Multiline crypto calls** — Formatter/linter can reformat `.createHmac(...)` to a new
   line after `crypto`. Grep must account for this: `grep -Pn "crypto\s*$"`.
4. **API key expiry is silent** — Wix sends no warning. Must add Watchdog check or periodic
   rotation reminder to Node-RED dashboard.
5. **mcp_python_run_script = read-only** — For any file write operation, use `run_command`
   with Python heredoc, or use `write_to_file` / `mcp_filesystem_write_file` tools.
6. **Markdown lint is cosmetic, not functional** — Don't block on lint warnings during
   content work. Fix them as a batch at the end with a script.

### Patterns Discovered
| Pattern | Frequency | Action Taken |
|---------|-----------|-------------|
| Wix ESM named import requirement | 1st formal doc | Added to RULES.md as Rule 7 |
| WIX_CLI_API_KEY expiry | 1st formal doc | Added to RULES.md Rule 8 + SECRETS guide |
| Markdown lint bulk fix via Python | First use | Document for reuse |
| Two-layer deploy failure (code + auth) | Repeated pattern | Documented in knowledge base |

### Knowledge Gaps
- **WIX_CLI_API_KEY expiry period** — Unknown. Wix does not publish TTL for API keys.
  Should test if it's 90 days, 1 year, or indefinite.
- **Automated key health check** — Node-RED Watchdog currently doesn't ping the Wix CLI
  auth endpoint. Could add a weekly GAS health check to catch expiry proactively.

### New Skills/Docs Created
- `.agent/knowledge/wix_deploy_pipeline_hardening/` — This knowledge item
- `RULES.md` Rules 7 & 8 — ESM named imports + key rotation
- `SECRETS_ROTATION_GUIDE.md` Section 5 — WIX_CLI_API_KEY rotation procedure
- `CHANGELOG.md` — April 7 entry with full fix documentation
- `TASKS.md` — Phase 7.6 DevOps & Deploy Pipeline Hardening (complete)
