# 🤖 Project: Shamrock Bail Portal (Wix Velo + GAS)

**Context:** Hybrid Monorepo. Wix Velo (Frontend) <-> Google Apps Script (Backend API).
**Core Files:** `src/pages/*` (UI), `backend-gas/Code.js` (API), `backend-gas/Dashboard.html` (Admin).

**Strict Rules:**
1. **No Next.js/React:** Velo logic only in `src/`. No DOM access.
2. **Security:** Validate `GAS_API_KEY` in `Code.js`. No raw secrets in code.
3. **Concurrency:** `IntakeQueue` (Sheet) writes MUST use `LockService`.

**Your Task:** Audit for PII leaks, weak Auth validation, and race conditions.
