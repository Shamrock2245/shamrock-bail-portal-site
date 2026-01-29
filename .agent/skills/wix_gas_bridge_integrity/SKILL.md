---
name: Wix-GAS Bridge Integrity Check
description: Diagnose and repair the connection between Wix Velo and Google Apps Script
version: 1.0.0
---

# Skill: Wix-GAS Bridge Integrity Check

Use this skill when:
*   Submissions are not appearing in GAS.
*   "Success" message appears but no data moves.
*   You receive `500` or `404` errors from the GAS endpoint.

## Step 1: Verify Secrets
The connection relies on `GAS_WEB_APP_URL` and `GAS_API_KEY`.
1.  **Action:** Ask user to check Wix Secrets Manager.
2.  **Check:** Does `GAS_WEB_APP_URL` end in `/exec`? (Common fatal error: ending in `/edit`)

## Step 2: Live Log Trace
Run this trace to see where the packet drops.
1.  **Frontend:** Console > "Submitting form..."
2.  **Backend:** `intakeQueue.jsw` > "Sending to GAS..."
3.  **GAS Side:** View Stackdriver Logs (Executions). Do you see a `POST` request?

## Step 3: The "Push" Simulation
If the bridge is down, force a manual push to test connectivity.
```javascript
// Run this in a temporary backend file to test connection
import { notifyGASOfNewIntake } from 'backend/gasIntegration';

export async function testBridge() {
    const result = await notifyGASOfNewIntake('TEST-CASE-ID-001');
    console.log(result);
}
```

## Step 4: Common Fixes
*   **Redirect Loop:** If GAS returns 302, your script is not deployed as "Web App" with "Execute as: Me" and "Who has access: Anyone".
*   **CORS Error:** GAS does not support CORS preflight. Use `POST` with `application/x-www-form-urlencoded` or `JSON` properly stringified.
