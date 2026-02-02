# 🐛 CRITICAL AUTHENTICATION BUG IDENTIFIED

## Issue Summary
**Google OAuth login is NOT creating persistent Wix member sessions because `applySessionToken()` is never called.**

---

## Root Cause Analysis

### What's Happening Now (BROKEN)

1. ✅ User clicks "Sign in with Google"
2. ✅ Google OAuth flow completes successfully
3. ✅ Backend (`http-functions.js`) calls `createCustomSession()` and generates a session token
4. ✅ Backend redirects to `/portal-landing?sessionToken=...&role=...`
5. ✅ Frontend (`portal-landing.bagfn.js`) receives the session token
6. ✅ Frontend stores token in browser local storage via `setSessionToken()`
7. ✅ Frontend validates token via `validateCustomSession()`
8. ✅ Frontend redirects to role-specific portal (e.g., `/portal-defendant`)
9. ❌ **BUG: `applySessionToken()` is NEVER called**
10. ❌ **Result: No Wix member session is created**
11. ❌ **Result: User appears logged out, gets 401 errors**

---

## The Problem

### Shamrock's Current Flow (Custom Sessions Only)
```javascript
// backend/http-functions.js (OAuth callback)
const sessionToken = await createCustomSession(lookup.personId, lookup.role, lookup.caseId);

// Returns redirect with token in URL
return response(200, renderCloseScript({
    success: true,
    token: sessionToken,
    role: role,
    message: "Login successful!"
}));
```

```javascript
// src/pages/portal-landing.bagfn.js
async function handleSocialSession(sessionToken, role) {
    // Validates custom session
    session = await validateCustomSession(sessionToken);
    
    // Stores in browser
    setSessionToken(sessionToken);
    
    // Redirects to portal
    redirectToPortalWithToken(targetRole, sessionToken);
    
    // ❌ MISSING: applySessionToken() call
}
```

### What's Missing (Wix Official OAuth Flow)

According to Wix documentation, after generating a session token in the backend, you MUST call `applySessionToken()` on the frontend to actually log the user into Wix Members:

```javascript
// BACKEND (http-functions.js)
import { authentication } from 'wix-members-backend';

const sessionToken = await authentication.generateSessionToken(email);
// Returns token to frontend

// FRONTEND (portal-landing page)
import { authentication } from 'wix-members-frontend';

await authentication.applySessionToken(sessionToken);
// ← THIS IS MISSING IN SHAMROCK CODE
```

---

## Why This Matters

### Custom Sessions vs Wix Member Sessions

**Shamrock is using CUSTOM sessions** (stored in `AuthSessions` collection) instead of **Wix Member sessions**.

This means:
- ✅ Custom session tokens work for custom authentication logic
- ❌ Wix Members API calls fail (401 Unauthorized)
- ❌ No persistent login across page refreshes
- ❌ No access to Wix Members features (profile, roles, etc.)

---

## The Fix

### Option 1: Add `applySessionToken()` to Create Wix Member Session

**Modify `portal-landing.bagfn.js`:**

```javascript
import { authentication } from 'wix-members-frontend';

async function handleSocialSession(sessionToken, role) {
    console.log("🔐 Processing social session...");
    showMessage("Finalizing login...", "info");
    showLoading();

    try {
        // Validate custom session
        const session = await validateCustomSession(sessionToken);
        
        if (session && session.valid) {
            // Store custom session
            setSessionToken(sessionToken);
            
            // ✅ NEW: Apply Wix member session
            await authentication.applySessionToken(sessionToken);
            console.log("✅ Wix member session created");
            
            // Redirect to portal
            redirectToPortalWithToken(session.role, sessionToken);
        } else {
            throw new Error("Session validation failed");
        }
    } catch (error) {
        console.error("❌ Login failed:", error);
        showMessage("Login failed. Please try again.", "error");
        hideLoading();
    }
}
```

**Modify `http-functions.js` backend:**

```javascript
import { authentication } from 'wix-members-backend';

export async function get_authCallback(request) {
    // ... existing OAuth code ...
    
    // After getting user profile
    const userProfile = await verifyGoogleUser(code);
    const email = userProfile.email;
    
    // ✅ Generate Wix member session token (not custom session)
    const sessionToken = await authentication.generateSessionToken(email);
    
    // Return token to frontend
    return response(200, renderCloseScript({
        success: true,
        token: sessionToken,
        role: role,
        message: "Login successful!"
    }));
}
```

---

### Option 2: Use Wix Members Entirely (Recommended)

**Replace custom session system with Wix Members:**

1. Create Wix Members for all users (defendants, indemnitors, staff)
2. Use `authentication.generateSessionToken(email)` in backend
3. Use `authentication.applySessionToken(token)` in frontend
4. Use `wix-members` API for all auth checks
5. Remove `AuthSessions` collection and custom session logic

**Benefits:**
- ✅ Persistent sessions across page refreshes
- ✅ Built-in session management
- ✅ No 401 errors
- ✅ Access to Wix Members features
- ✅ Simpler codebase

---

## Immediate Action Required

1. **Add `applySessionToken()` call** to `portal-landing.bagfn.js` in `handleSocialSession()`
2. **Test Google OAuth login** to verify persistent session
3. **Apply same fix to Magic Link login** in `handleMagicLinkLogin()`
4. **Consider migrating to Wix Members entirely** for long-term stability

---

## Related Files

- `/home/ubuntu/shamrock-bail-portal-site/src/backend/http-functions.js` (OAuth callback)
- `/home/ubuntu/shamrock-bail-portal-site/src/pages/portal-landing.bagfn.js` (Session handling)
- `/home/ubuntu/shamrock-bail-portal-site/src/backend/portal-auth.jsw` (Custom session logic)
- `/home/ubuntu/shamrock-bail-portal-site/src/backend/social-auth.jsw` (OAuth helpers)

---

## Console Errors Explained

The 401 errors in the screenshots are caused by:
1. No Wix member session exists (because `applySessionToken()` wasn't called)
2. Wix API calls require authenticated member session
3. Custom session tokens don't work with Wix Members API

**Fix:** Call `applySessionToken()` to create the Wix member session.
