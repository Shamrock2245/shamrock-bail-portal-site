
# Antigravity Handoff: Intake Form & Magic Link Fixes (FINAL)

## 🚨 IMMEDIATE ACTION REQUIRED 🚨

You must update your Google Apps Script project **NOW** to enable the Magic Link emails and the new Intake functionality.

### 1. Update GAS Files
Go to your [GAS Project](https://script.google.com/home), open the project, and update the following files by copy-pasting the content from this repository:

| Local File (in repo) | GAS File (in Script Editor) | Status |
| :--- | :--- | :--- |
| `backend-gas/Code.js` | **`Code.gs`** | **UPDATED (v5.7)** - Handles email sending & versioning. |
| `backend-gas/WixPortalIntegration.js` | **`WixPortalIntegration.gs`** | **UPDATED** - Uses dynamic URL for emails. |
| `backend-gas/Dashboard.html` | **`Dashboard.html`** | **UPDATED** - Accepts dynamic URL injection. |

### 2. Deploy Web App
1.  Click **Deploy** -> **New Deployment**.
2.  Select **Type**: Web App.
3.  **Description**: `v5.7 - Magic Links & Intake Fixes`.
4.  **Execute as**: `Me` (your email).
5.  **Who has access**: `Anyone`.
6.  Click **Deploy**.

### 3. Update Wix Secrets (If URL Changed)
1.  Copy the **Web App URL** from the deployment success screen.
2.  Go to Wix Dashboard -> Settings -> **Secrets Manager**.
3.  Update the secret `GAS_WEB_APP_URL` with the new URL.
    *   *Note: If you used "Manage Deployments" -> "Edit" -> "New Version", the URL might remain the same. Always double-check.*

### 4. Verify
1.  **Magic Link**: Go to `/portal-landing`, enter your email. You should receive an email with a link.
2.  **Intake**: Submit a form on `/portal-indemnitor`. Check the GAS `IntakeQueue` sheet.

---
**Status**: All code is locally synced and ready for deployment.
