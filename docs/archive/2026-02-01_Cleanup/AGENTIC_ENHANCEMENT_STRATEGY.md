# AGENTIC_ENHANCEMENT_STRATEGY.md
> **Blueprint for "Meta-Programming" the Shamrock Ecosystem**
> *Based on: awesome-copilot-agents, agents.md, ai-agent-guidebook*

## 1. Executive Summary
We are moving from "Pair Programming" to "Systematic Autonomy." By embedding the patterns below, future agents (Manus, Antigravity) will understand *how* to solve problems without needing to be retaught the stack every time.

**Top Investment Priorities:**
1.  **Reliability (Error Patterns):** Stops the "Why did GAS fail?" guessing game.
2.  **Legal Automation (PDF Skills):** Drastically reduces time to add new forms.
3.  **Security (Secret Scans):** Prevents catastrophic credential leaks.

---

## 2. New Skills Architecture (`.agent/skills/`)
Skills are "downloadable brains" for agents. We will implement these immediately:

### A. `@security-compliance` (High Priority)
*   **Skill:** `audit-security`
*   **Function:** Scans `utils.jsw` and `Code.gs` for hardcoded keys BEFORE a commit.
*   **Workflow:** Agent runs this check as a "pre-flight" for every `wix publish`.

### B. `@error-handling` (The Bridge Healer)
*   **Skill:** `error_handling_patterns`
*   **Function:** Replaces generic `500` errors with structured JSON:
    ```json
    { "success": false, "code": "AUTH_FAIL", "message": "Secret Mismatch", "retryable": false }
    ```
*   **Benefit:** Allows the Frontend to show "Access Denied" vs. "Server Busy, Try Again."

### C. `@pdf-architect` (Document Automation)
*   **Skill:** `pdf_template_manager`
*   **Function:** Auto-documents the X/Y coordinates of SignNow fields.
*   **Benefit:** Agent reads this map effectively saying: *"Put 'Defendant Name' at [100, 200] on Page 1."*

---

## 3. Workflow Implementation Plan

### Phase 1: Hardening the Core (Immediate)
*   [ ] Implement `secrets-management` pattern (Systematize `wix-secrets-frontend`).
*   [ ] Create `scripts/normalize-frontmatter.js` (Sanitize user input before it hits GAS).
*   [ ] Deploy `health-check` pinger (Simple uptime monitor for GAS).

### Phase 2: User Experience (Short Term)
*   [ ] `ui-visual-validator`: Automated check of "Sticky Mobile CTA" visibility.
*   [ ] `geolocation-client`: Upgrade to use "Bounding Box" logic for Tier 2 counties.

### Phase 3: AI Concierge (Future)
*   [ ] `rag-implementation`: Ingest "County Protocol JSONs" so the chatbot knows: *"In Lee County, you check in at the Main Lobby."*

---

## 4. Return on Investment (ROI)
*   **Most Time Saved:** `error_handling_patterns`. Currently, debugging a GAS sync failure takes 15+ mins of log tracing. With this, it takes 10 seconds (Structured Error returns exact cause).
*   **Most Useful:** `pdf_template_manager`. Removes the fear of breaking legal docs when changing code.

## 5. Next Action
I will immediately create the **Error Handling** and **PDF Manager** skills to lock in the highest ROI enhancements.
