# Wix <-> GAS Bridge Protocol

## 1. Overview
The connection between Wix (Frontend/Velo) and Google Apps Script (Backend Logic) is the single most critical dependency in this architecture.

## 2. Authentication & Secrets
- **Wix Secrets Manager**: The canonical source for the `GAS_WEB_APP_URL`.
- **Key Name**: `GAS_WEB_APP_URL` (Must match exactly).
- **Fallback**: `src/backend/utils.jsw` contains a `FALLBACK_GAS_URL` constant. This is a fail-safe only.

## 3. Request Payload Schema
All requests from Wix to GAS must follow this JSON structure:

```json
{
  "action": "submitIntake" | "createEmbeddedLink" | "sendEmail",
  "payload": {
    // Specific data for the action
  },
  "meta": {
    "source": "wix_portal",
    "version": "1.0",
    "timestamp": "ISO_STRING"
  }
}
```

## 4. Response Schema
GAS always returns a JSON object (even on error, if possible):

```json
{
  "status": "success" | "error",
  "message": "Human readable message",
  "data": {
    // Result data (e.g., signingUrl)
  },
  "errorCode": 500 // Optional
}
```

## 5. Critical Workflows

### 5.1 Intake Submission (`submitIntake`)
- **Direction**: Wix -> GAS
- **Payload**: Full `Dashboard` compliant object (Defendant, Indemnitor, References).
- **Outcome**: GAS parses JSON, appends row to `IntakeQueue`, triggers notifications.

### 5.2 Signing Session (`createEmbeddedLink`)
- **Direction**: Wix -> GAS
- **Payload**: `{ caseId, email, role, formData }`
- **Outcome**: GAS calls SignNow API -> Creates Invite -> Generates Embedded Link -> Returns URL.

## 6. Debugging
- **504 Gateway Timeout**: Usually means GAS took too long (>30s).
  - *Fix*: Check `backend-gas/Code.js` execution logs.
- **HTML Response**: SignNow or Google API error page returned instead of JSON.
  - *Fix*: Use `SN_makeRequest` hardening (already implemented in v5.2).

## 7. AI Agent Directives
- If you change `backend-gas/Code.js`, you **MUST** deploy via `clasp push` and **New Deployment** in GAS console.
- Always update the `GAS_WEB_APP_URL` in Wix if the deployment ID changes.
