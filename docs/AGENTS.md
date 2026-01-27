# Shamrock Bail Suite - AI Agent Handbook

Welcome, Agent. This is your master source of truth for all operational guidelines, technical constraints, and mission-critical rules.

## 1. Core Mission
Automate the "Arrest to Bail" pipeline: **Lead Capture** -> **Role-Based Portal** -> **Instant Legal Contracts**.

## 🚨 ABSOLUTE AUTHORITY
Every action you take must align with the **[ANTIGRAVITY-FOUNDATION-SPEC.md](ANTIGRAVITY-FOUNDATION-SPEC.md)**.
That file overrides everything else in this repo. Read it first.

## 2. Technical Stack (Current)
- **Wix Velo**: Frontend UI, Members Area, Custom Auth (Magic Links), and Client-Side Logic.
- **Google Apps Script (GAS)**: Backend API (Serverless). Handles PDF generation, SignNow calls, and Admin notifications.
- **SignNow API**: Digital signature workflow (Embedded Lightbox + Email Fallback).
- **Google Sheets**: Operational database backup and Admin Dashboard.

## 3. The Sacred Guardrails
1.  **34-Column Schema**: Leads/Intake payloads must match the structure defined in `backend-gas/Dashboard.html` logic.
2.  **Idempotency**: Magic Links and Sessions are idempotent. Always check for existing valid sessions before creating new ones.
3.  **No Node.js Backend**: We do NOT use a separate Node/Python server anymore. All backend logic is in GAS or Wix Backend (`.jsw`).
4.  **Security**: NEVER hardcode API keys. Use **Wix Secrets Manager** for `GAS_WEB_APP_URL` and `GOOGLE_MAPS_API_KEY`.
5.  **Clipboard Philosophy**: Wix is a clipboard. It collects data -> sends to GAS -> GAS creates the legal document. Wix does NOT store the final PDF.

## 4. Operational Handbooks

### Working on the Indemnitor Portal
1.  **Session Hydration**: The portal relies on `currentSession` containing `email`, `phone`, and `name`. If you break `portal-auth.jsw`, the form will not pre-fill.
2.  **SignNow Flow**: The "Submit" button does NOT just save data; it triggers a `createEmbeddedLink` call to GAS.
3.  **UI Feedback**: Always use `LightboxController` for success states (Selfie, DL Upload, Signing).

### Updating Google Apps Script (`backend-gas/`)
1.  **Edit Locally**: Edit files in `backend-gas/`.
2.  **Deploy via Clasp**: Use `clasp push` to update the script.
3.  **Versioning**: If you change the Web App URL, update it in Wix Secrets Manager AND `src/backend/utils.jsw` (fallback).

## 5. Ground Truth References
- [Foundation Spec](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/ANTIGRAVITY-FOUNDATION-SPEC.md)
- [Project Tasks](file:///Users/brendan/Desktop/shamrock-bail-portal-site/TASKS.md)
- [Frontend Reference](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/FrontendCodeReferenceforChatGPTAtlas.md)
