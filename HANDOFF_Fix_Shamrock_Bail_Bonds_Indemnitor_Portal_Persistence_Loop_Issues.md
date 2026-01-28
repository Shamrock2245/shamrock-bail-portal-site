# HANDOFF: Fix Shamrock Bail Bonds Indemnitor Portal - Persistence & Loop Issues

**Date:** January 28, 2026
**Repository:** `Shamrock2245/shamrock-bail-portal-site`
**Live Site:** www.shamrockbailbonds.biz
**Wix Site ID:** a00e3857-675a-493b-91d8-a1dbc5e7c499

---

## 🟢 COMPLETED FIXES

### 1. Fix Indemnitor Portal Infinite Redirect Loop
**Status:** ✅ **FIXED & DEPLOYED**
**Symptom:** Portal page was looping/redirecting continuously.
**Root Cause:** `portal-indemnitor` redirected to `portal-landing` on auth failure, but `portal-landing` auto-redirected back to `portal-indemnitor` because it thought a session existed or logic was flawed.
**Fix Applied:**
-   Modified `portal-indemnitor.k53on.js`: Add `?auth_error=1` to the redirect URL when session is invalid.
-   Modified `portal-landing.bagfn.js`: Check for `query.auth_error`. If present, **stop** the auto-redirect logic and clear the session.

### 2. Dependency Cleanup (Auth Conflict)
**Status:** ✅ **FIXED**
**Symptom:** Code imported `wix-members-backend` which conflicts with custom auth.
**Fix Applied:**
-   Removed unused `wix-members-backend` import from `src/backend/intakeQueue.jsw`.

---

## 🟡 ACTIVE DEBUGGING (PERSISTENCE)

### Issue: Form "Submitted" but Data Missing from Collection
**Symptom:** User sees "Success" message, but `IntakeQueue` collection appears empty.
**Current Status:**
-   Code Logic: **Verified Correct**. Uses `IntakeQueue` (Collection ID verified).
-   Logging: **Enhanced**. `portal-indemnitor.k53on.js` now alerts the actual `Case ID` returned by the backend on success.
-   **Hypothesis:** The write is successful (hence the success message), but the user is viewing the **Sandbox Database** instead of the **Live Database**.

**Immediate Debugging Steps (User Action):**
1.  **Publish** the site.
2.  **Submit** the form.
3.  **Check Success Message:** Look for `Case ID: CASE-2026-...` on the success screen.
    *   **If ID is present:** The backend **did** write to the DB. You must check the **Live** collection in the Dashboard.
    *   **If ID is missing:** The backend returned success but no ID (unlikely given code structure).

---

## SYSTEM ARCHITECTURE (DO NOT CHANGE)

### Authentication Flow (Custom Magic Links - NO Wix Members)
1. User enters email on `/portal-landing`
2. Magic link sent via `portal-auth.jsw` → `sendMagicLink()`
3. User clicks link → validates via `validateMagicLink()`
4. Session stored in browser (NOT Wix Members)
5. User accesses `/portal-indemnitor` with session

### Data Flow (End-to-End)
```
Indemnitor Form (portal-indemnitor.k53on.js)
    ↓
submitIntakeForm() in intakeQueue.jsw
    ↓
wixData.insert('IntakeQueue', record, { suppressAuth: true })
    ↓
IntakeQueue CMS Collection (LIVE)
    ↓
notifyGASOfNewIntake() → Google Apps Script Dashboard.html
```

---

## KEY FILES

### 1. `/src/pages/portal-indemnitor.k53on.js` (FRONTEND)
-   Handles form validation and submission.
-   **Debug Code Added:** Now alerts `result.caseId` on success.

### 2. `/src/backend/intakeQueue.jsw` (BACKEND)
-   Handles `wixData.insert` to `IntakeQueue`.
-   **Notes:** `suppressAuth: true` is set, so permissions should not block the write.

---

## NEXT STEPS

1.  **If User Confirms Case ID:**
    -   The issue is resolved (user error on DB view).
    -   Proceed to cleanup debug alerts.

2.  **If User Sees No Case ID:**
    -   Investigate backend return value in `intakeQueue.jsw`.

---
