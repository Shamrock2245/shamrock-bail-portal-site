---
description: Full deployment workflow for Google Apps Script: Deploys new version, updates project URLs, sends Slack alert, and notifies user.
---

# GAS Deployment & Notification Workflow

This workflow automates the deployment of the Google Apps Script backend and ensures all frontend references are updated.

### 1. Verification & Setup
Ensure you are in the correct directory and `Code.js` has the correct version number.

```bash
cd backend-gas
# Check version in Code.js (e.g., // Version: 7.2)
grep "Version:" Code.js
```

### 2. Push Local Changes
Ensure the server has the latest code.
```bash
npx @google/clasp push -f
```

### 3. Deploy New Version
Create a new immutable deployment version on GAS.
```bash
npx @google/clasp deploy --description "Production Deployment"
```
**ACTION**: Capture the **Web App URL** from the output (ends in `/exec`).

### 4. Update Project References
Replace the old Web App URL with the new one in all codebase files.
Target files typically include:
- `src/backend/gasIntegration.jsw`
- `src/backend/utils.jsw`
- `backend-gas/QualifiedTabRouter.js`
- `backend-gas/Dashboard.html`
- `backend-gas/Bookmarklets.md`
- `test_*.mjs`

### 5. Send Slack Notification (Platform)
Execute the admin alert function on the server to notify the team.
*(Replace `[NEW_URL]` with the actual URL string)*.

```bash
npx @google/clasp run ADMIN_SendDeploymentAlert --params '["[NEW_URL]"]'
```

### 6. Notify User (Mandatory)
You **MUST** send a `notify_user` message containing the new URL in a code block for easy copy/pasting.

**Example Message:**
> **Deployment Complete**
> 
> New Web App URL:
> ```
> https://script.google.com/macros/s/.../exec
> ```
> Please update this in **Wix Secrets Manager** (Key: `GAS_WEB_APP_URL`).
