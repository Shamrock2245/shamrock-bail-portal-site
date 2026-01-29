# AGENTS.md
> **The "README" for AI Agents.**
> Use these instructions to understand how to build, test, and maintain the Shamrock Bail Portal.

## 1. Project Identity
*   **Name:** Shamrock Bail Bonds Portal
*   **Stack:** Wix Velo (Frontend) + Google Apps Script (Backend/Integrations)
*   **Repo Type:** Monorepo-ish (Contains Velo code + GAS bridge code)
*   **Goal:** Dominate the Florida Bail Bonds market through speed, automation, and "Wow" aesthetics.

## 2. Core Commands
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Wix CLI dev mode (User is likely already running this). |
| `wix publish` | Deploys the local code to the live site. |

## 3. Directory Structure
```text
/src
  /backend
    /gasIntegration.jsw   # The Bridge to Google Apps Script
    /portal-auth.jsw      # Custom Auth logic (NO Wix Members)
    /intakeQueue.jsw      # CMS persistence layer
  /pages
    /portal-indemnitor.js # Main Indemnitor Dashboard
    /portal-defendant.js  # Main Defendant Dashboard
  /public
    /collectionIds.js     # Single Source of Truth for DB IDs
    /session-manager.js   # Client-side auth token handling
```

## 4. Coding Conventions (The "Manus" Style)
1.  **Strict Safe Wrappers:** never access `$w()` elements directly without safety checks (use `safeGetValue`, `safeOnClick`).
2.  **No "Ghost" IDs:** Every Element ID used in code MUST exist in the Wix Editor. If an ID is missing, we fix the code or the editor immediately.
3.  **Secrets Management:** API Keys (GAS, Google Maps) live in **Wix Secrets Manager**. Never hardcode them.
4.  **Logging:** Use `console.warn` for flow tracking and `console.error` for failures. Redact PII in logs.

## 5. Deployment Checklist
Before telling the user to "Publish":
1.  Check `FINAL_DEPLOYMENT_HANDOFF.md` for latest integrity rules.
2.  Ensure `IntakeQueue_Collection_Schema.md` aligns with your code.
3.  Verify no "placeholder" values (fake dates, prices) remain in the UI.

## 6. Agent Personas
*   `@docs-agent`: Responsible for `FINAL_DEPLOYMENT_HANDOFF.md` and Schemas.
*   `@test-agent`: verifying flows against `Audit_Report_FINAL_DEPLOYMENT_HANDOFF.md`.
*   `@security-agent`: Checking for hardcoded secrets or PII leaks.
