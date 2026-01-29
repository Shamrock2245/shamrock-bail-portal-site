---
name: Error Handling Patterns
description: Standardized error responses to replace generic 500s with useful JSON
version: 1.0.0
---

# Skill: Error Handling Patterns

Use this skill to implement structured error handling across the Wix-GAS Bridge.

## 1. The Standard Error Response (GAS)
Stop throwing raw text. Always return this JSON object from GAS `doPost()` catches:

```javascript
return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: {
        code: "ERROR_CODE_ENUM",
        message: "Human readable message for logging",
        userMessage: "Friendly message for UI",
        retryable: true|false
    }
})).setMimeType(ContentService.MimeType.JSON);
```

## 2. Standard Error Codes
| Code | Meaning | User Message | Retry? |
| :--- | :--- | :--- | :--- |
| `AUTH_FAIL` | API Key Invalid | "Access Denied. Contact Support." | No |
| `SCHEMA_MISMATCH` | Missing fields | "Form Error. Please refresh." | No |
| `SIGNNOW_API_FAIL` | SignNow is down | "Document Service Busy. Retrying..." | Yes |
| `LOCK_TIMEOUT` | Simultaneous edits | "System Busy. Please submit again." | Yes |
| `DRIVE_QUOTA` | Google Drive full | "Storage Error. Call Dispatch." | No |

## 3. Frontend Implementation (Velo)
When parsing the GAS response in `gasIntegration.jsw`:

```javascript
// backend/gasIntegration.jsw
if (!result.success) {
    console.error(`GAS Error [${result.error.code}]: ${result.error.message}`);
    
    // Throw standard error for UI to catch
    throw new Error(result.error.userMessage || "System Error");
}
```

## 4. UI Implementation (Page Code)
In `portal-indemnitor.js`'s catch block:
```javascript
catch (error) {
    // Show the user-friendly message from the backend
    showError(error.message); 
    
    // If "System Busy", auto-retry logic could go here
}
```
