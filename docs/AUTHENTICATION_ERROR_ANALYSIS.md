# Shamrock Authentication Error Analysis

**Date:** February 2, 2026  
**Issue:** Persistent authentication failures - sessions not persisting  
**Affected:** Google OAuth and Magic Link login

---

## Console Errors Identified

### Error 1: POST 401 Unauthorized
```
POST https://www.wix.com/_api/wix-sm-webapp/tokens/verify/email 401 (Unauthorized)
```

### Error 2: Failed to load resources (401)
Multiple 401 errors for:
- `https://www.wix.com/_api/communities-blog-node-api/...` 
- Various Wix API endpoints returning 401

### Error 3: Property 'sortOrder' cannot be read
```
Cannot read properties of undefined (reading 'sortOrder')
```

### Error 4: Wix Code SDK errors
Multiple "Failed to load resource" errors related to:
- `wix-code-sdk`
- `wix-data`
- `wix-users`
- Authentication modules

---

## Root Cause Analysis

### Issue 1: Session Token Not Persisting
**Symptom:** User logs in successfully but session is lost on page refresh/navigation

**Likely Causes:**
1. Session token not being stored in Wix session storage
2. Custom authentication bypassing Wix's built-in session management
3. Token expiration not being handled
4. Missing `wix-users-backend` session creation

### Issue 2: Google OAuth Token Not Being Verified
**Symptom:** Google login succeeds but Wix API returns 401

**Likely Causes:**
1. OAuth token not being exchanged for Wix session token
2. Missing `registerMember()` or `approveByToken()` call
3. OAuth callback not creating Wix member session

### Issue 3: Magic Link Token Verification Failing
**Symptom:** Email sent but clicking link doesn't authenticate

**Likely Causes:**
1. Token not being properly generated/stored
2. Token verification endpoint not matching generation
3. Session not being created after successful verification

---

## Files to Audit

### Authentication Files
1. `/src/backend/authentication.jsw` - Core auth logic
2. `/src/backend/google-oauth.jsw` - Google OAuth handler
3. `/src/backend/magiclink.jsw` - Magic link generation/verification
4. `/src/pages/login.js` - Login page frontend
5. `/src/pages/auth-callback.js` - OAuth callback handler

### Session Management Files
6. `/src/backend/session-manager.jsw` - Session storage/retrieval
7. `/src/backend/member-management.jsw` - Member creation/lookup

---

## Next Steps

1. Research latest Wix/Velo authentication documentation
2. Audit Google OAuth implementation
3. Audit Magic Link implementation
4. Fix session persistence
5. Test both flows end-to-end
