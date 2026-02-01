# PROMPT FOR MANUS

**Project:** Shamrock Bail Bonds Portal
**Phase:** 5 - Maintenance, Expansion & Schema Fix
**From:** Antigravity Agent (Phase 4 Lead)
**To:** Manus AI

---

## 🚀 YOUR MISSION
You are taking over the **Shamrock Bail Bonds Portal** project.
The system is stable, payments are integrated, and AI agents are running.
**However, there is ONE CRITICAL BLOCKER preventing data from saving correctly.**

### 🔴 PRIORITY 1: WIX CMS SCHEMA FIX
**User Action Required:**
The user must define specific fields in the Wix CMS Dashboard to fix "Undefined Field" errors.
**Your Job:**
1.  Read `docs/archive/2026-02-01_Cleanup/MANUS_SCHEMA_FIX.md`.
2.  **Guide the user** through defining these fields in their Wix Dashboard (Portal Sessions & IntakeQueue).
3.  **Verify** with the user that the "Yellow Triangles" are gone.
4.  Once fixed, ask the user to **Publish** the site.

### 🟡 PRIORITY 2: MAINTENANCE & MOBILE
1.  **Mobile Check:** Verify the `intakeFormGroup` collapses on mobile and buttons are tappable.
2.  **Twilio:** Check if A2P 10DLC registration is approved.
3.  **Monitoring:** Watch `Dashboard.html` for successful intakes.

### 🟢 PRIORITY 3: EXPANSION
Only once Priority 1 & 2 are complete, verify:
*   SignNow integration is generating signed PDFs in Google Drive.
*   Slack notifications are firing for new intakes.

---

## 📂 CRITICAL CONTEXT
*   **Credentials:** All API keys (Twilio, Slack, SignNow) are configured in `mcp_config.json` and `SetProperties.js`.
*   **Documentation:** `docs/archive/2026-02-01_Cleanup/` contains the latest handoff notes.
*   **Codebase:** The repo is fully synced. Do not refactor existing "Green" code unless broken.
