---
description: Deploy backend-gas to Google Apps Script WITH A VERSION DESCRIPTION!
---

# GAS Deployment & Notification Workflow

This is the **single canonical workflow** for deploying the GAS backend. It covers push, versioned deploy, URL propagation, and team notification.

## Steps

### 1. Navigate to Backend Directory
// turbo
```bash
cd /Users/brendan/Desktop/shamrock-bail-portal-site/backend-gas
```

### 2. Check Deployment Status
```bash
npx @google/clasp status
```

### 3. Push Local Changes (Force)
// turbo
```bash
npx @google/clasp push -f
```

### 4. Handle Authentication Failure (Conditional)
**IF** the push fails with `invalid_grant`, `Unauthenticated`, or `logged in` errors:
1. Run `npx @google/clasp login`
2. **USER ACTION**: Click the link, log in as `admin@shamrockbailbonds.biz`, and allow access.
3. Retry: `npx @google/clasp push -f`

### 5. Deploy New Version
**IMPORTANT:** Replace `"YOUR DESCRIPTION HERE"` with a meaningful version description (e.g., `"V290 - Fixed PDF mapping"`).
```bash
npx @google/clasp deploy -i AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z -d "YOUR DESCRIPTION HERE"
```
**ACTION**: Capture the **Web App URL** from the output (ends in `/exec`).

### 6. Update Project References (If URL Changed)
If the Web App URL changed, update it in:
- `src/backend/gasIntegration.jsw`
- `src/backend/utils.jsw`
- `backend-gas/QualifiedTabRouter.js`
- `backend-gas/Dashboard.html`
- Wix Secrets Manager (`GAS_WEB_APP_URL`)

### 7. Send Slack Notification
```bash
npx @google/clasp run ADMIN_SendDeploymentAlert --params '["[NEW_URL]"]'
```

### 8. Return to Root
// turbo
```bash
cd ..
```

### 9. Notify User (Mandatory)
Send a `notify_user` message containing the new URL in a code block.
