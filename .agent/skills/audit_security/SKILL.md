---
name: Audit Security
description: Automated pre-flight security checks for secrets and PII.
version: 1.0.0
---

# Skill: Audit Security

Use this skill to perform a "Pre-Flight Security Check" before any deployment.

## 1. Secret Scanning
**Goal:** Ensure no hardcoded API keys exist in the codebase.
**Action:** Run a grep search for these patterns. If found outside of `wix-secrets`, FAIL the audit.

*   `GAS_WEB_APP_URL = "https://..."` (Hardcoded URL)
*   `Authorization: "Bearer ..."` (Hardcoded Token)
*   `AI_API_KEY` or `SIGNNOW_KEY`

**Correct Pattern:**
```javascript
import { getSecret } from 'wix-secrets-backend';
const apiKey = await getSecret('GAS_API_KEY');
```

## 2. PII Log Check
**Goal:** Ensure no customer data is logged in plain text.
**Action:** Review `console.log` statements in backend files.

*   ❌ `console.log("User Data:", userData);` (Dumps everything)
*   ✅ `console.log("User updated:", userData._id);` (Logs ID only)

## 3. Bridge Integrity
**Goal:** Verify the public/private boundary.
*   Check that `http-functions.js` (if it exists) has `suppressAuth: true` ONLY where absolutely necessary.
*   Ensure `gasIntegration.jsw` exports only meant for Admin use are not effectively public (though .jsw are internal-ish, always check permissions).

## 4. Execution
To run a manual audit:
1.  Search project for `AKfy` (Common Google Script ID start).
2.  Search project for `AIza` (Generic Google API Key start).
3.  Search project for `@gmail.com` (Hardcoded emails).

If any are found in code files (not Markdown), alert the user immediately.
