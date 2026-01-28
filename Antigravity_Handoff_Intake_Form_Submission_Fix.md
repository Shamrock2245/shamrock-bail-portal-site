# Antigravity Handoff: Intake Form & Magic Link Fixes

## 1. Intake Form Submission
*   **Permissions**: `src/backend/intakeQueue.jsw` now uses `{ suppressAuth: true }` for all database interactions. This ensures `submitIntakeForm` works regardless of the user's login state or collection permissions.
*   **GAS Sync**: The `notifyGASOfNewIntake` function is correctly called after submission.
*   **Robustness**: `src/backend/gasIntegration.jsw` also uses `suppressAuth` to prevent permission errors during GAS queries.

## 2. Magic Link Login
*   **Backend Logic**: `src/backend/portal-auth.jsw` generates a token and sends an email via GAS.
*   **GAS Handler**: Added `action: 'sendEmail'` support to `backend-gas/Code.js`. This is **crucial** for magic links to be delivered.
*   **URL Update**: Updated all GAS URL references to the new deployment.

## 3. Deployment Instructions (CRITICAL)

### GAS Project Update
You **must** update your Google Apps Script project with the latest code from this repo:

1.  **Open** your GAS project: `https://script.google.com/home`
2.  **Update `Code.gs`**: Copy content from `backend-gas/Code.js`. (Ensure `handleSendEmail` is present at the bottom and linked in `handleAction`).
3.  **Update `WixPortalIntegration.gs`**: Copy content from `backend-gas/WixPortalIntegration.js`.
4.  **Deploy**: Click "Deploy" -> "New Deployment" -> type "Web App" -> **Execute as: Me** -> **Who has access: Anyone**.
5.  **Copy URL**: Get the new Web App URL.

### Wix Secrets Update
1.  Go to Wix Dashboard -> Settings -> **Secrets Manager**.
2.  Update `GAS_WEB_APP_URL` with the URL you just copied.

### Testing
1.  **Intake**: Submit a form on `/portal-indemnitor`. Verify it appears in Wix Collection `IntakeQueue` and the GAS `IntakeQueue` sheet.
2.  **Magic Link**: Go to `/portal-landing`, enter your email. Verify you receive the "Access Your Portal" email.
