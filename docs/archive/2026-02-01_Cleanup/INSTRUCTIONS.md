# INSTRUCTIONS.md
> **Explicit "Do Not" Rules & Tech Stack Constraints**

## 1. Prime Directives (The "Do Not" List)
1.  **Do NOT use direct DOM access.** This is Wix Velo. No `document.getElementById`, no `window` (except `wixWindow`), no `jQuery`.
2.  **Do NOT modify schemas without explicit intent.** The `IntakeQueue` schema is "Sacred." Do not rename fields just to match a variable. Fix the variable.
3.  **Do NOT hardcode secrets.** All API keys must use `wix-secrets-backend`.
4.  **Do NOT use "Wix Members" APIs for portal auth.** We use a custom "Magic Link" system defined in `portal-auth.jsw`. Do not import `wix-members`.

## 2. Technology Stack
*   **Frontend:** Wix Velo (Proprietary JS framework)
*   **Backend:** Node.js (Velo Backend) + Google Apps Script (External)
*   **Database:** Wix CMS (NoSQL-ish collections)
*   **Signing:** SignNow API (via GAS)
*   **Forms:** Custom Velo Forms (Not "Wix Forms" app)

## 3. Workflow Integrations
*   **Google Apps Script (GAS):** The "Brain" of the operation. It handles PDF generation and external API calls.
*   **SignNow:** The legal binding layer. Triggered ONLY by GAS.

## 4. Mobile Responsiveness Rules
*   **Touch Targets:** Minimum 44px height for all buttons.
*   **No Hovels:** Do not rely on "Hover" states for critical logic (Mobile has no hover).
*   **Keyboards:** Use proper input types (`tel`, `email`) to trigger the correct mobile keyboard.
