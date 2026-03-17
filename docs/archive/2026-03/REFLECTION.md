# Agent Reflection & Post-Mortem Guidelines

When errors occur or architecture decisions are pivoting, use this document format to write structured thoughts before altering the production codebase.

## The Systematic Debugging Protocol
1. **Identify**: What broke? (e.g., `Webhook 403 Forbidden`).
2. **Reproduce**: Can we observe this consistently?
3. **Hypothesize**: Is it a revoked token? An Idempotency key failure?
4. **Test**: Use `test_X.mjs` or `_functions/testWebhook` to validate.
5. **Resolve**: Update Wix Secrets or Google Apps Script logic.

## Principles of AI Reflection
- Are you designing something that looks generic? Stop. Make it Premium.
- Did you add technical debt instead of finishing the Factory? Revert it.

## Recent Reflections
- **[2026-03-05] Python Stealth Scrapers**: When building scrapers for hostile targets (e.g. Sarasota), maintaining `swfl-arrest-scrapers/python_scrapers` allows for rapid testing of HTTP clients (`curl_cffi`, `Scrapling`) outside the constraints of Google Apps Script. 
- **[2026-03-06] Documentation Debt**: Ensuring that `.md` files stay robust (e.g., updating `COUNTY_STATUS.md` immediately upon deploying a new county like DeSoto) prevents repetitive agent research cycles.
