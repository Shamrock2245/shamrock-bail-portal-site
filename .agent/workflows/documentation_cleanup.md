---
description: Standard procedure for auditing, updating, and archiving documentation.
---

# Documentation Maintenance Protocol

Run this workflow at the end of every major feature cycle or weekly.

1. **Audit Root Documentation**
   - Check `README.md`: Does the "Tech Stack" match `package.json` and `backend-gas`?
   - Check `TASKS.md`: Are completed items marked? Are new items added?
   - Check `AGENTS.md`: Are the guardrails still valid?

2. **Integrity Check**
   - Ensure `ANTIGRAVITY-FOUNDATION-SPEC.md` is still the supreme authority. If code violates it, either fix the code or (rarely) update the spec with user approval.

3. **Identify Stale Artifacts**
   - Look for `.md` files that refer to deprecated systems (e.g., "FastAPI", "Python", "Node.js Backend").
   - Look for "Audit" or "Report" files that are older than 30 days.

4. **Archival Process**
   - **Do not delete** unless receiving explicit permission.
   - Move stale files to `docs/archive/YYYY-MM/` folders.
   - Example: `mv OLD_AUDIT.md docs/archive/2025-01/`

5. **Update Index**
   - If you create new key docs, add them to `README.md` under "Documentation".

6. **Agent Self-Correction**
   - If you find yourself confused by any instruction file, flag it for rewrite immediately.
