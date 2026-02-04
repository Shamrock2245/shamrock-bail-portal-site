# Wix Authentication Research Findings

**Date:** February 2, 2026  
**Source:** Wix Velo Official Documentation

---

## Key Finding #1: generateSessionToken() Workflow

### Purpose
- Creates a session token for members authenticated by 3rd party (e.g., Google OAuth, Magic Link)
- Bypasses Wix's built-in authentication
- Used for SSO (Single Sign-On) implementations

### Behavior
1. **If email exists:** Generates session token for existing member
2. **If email doesn't exist:** Creates new member with random password + generates token

### Critical Implementation Detail
```javascript
import { Permissions, webMethod } from "wix-web-module";
import { authentication } from "wix-members-backend";

export const myGenerateSessionTokenFunction = webMethod(
  Permissions.Anyone,
  (email) => {
    return authentication
      .generateSessionToken(email)
      .then((sessionToken) => {
        return sessionToken;
      })
      .catch((error) => {
        console.error(error);
      });
  }
);
```

### Token Format
```
JWS.eyJraWQiOiJQSXpvZGJiQiIsImFsZyI6IkhTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcImM2OTE2N2FmLTY0ODgtNDYzNS1iYmU3LTg5YzFjZWY2MTEwN1wiLFwiY29sbGVjdGlvbklkXCI6XCI5YmVjNThlNi02NDExLTQ5OTEtOGU1ZC0wYWRhOTE4MmI5NWVcIixcIm1ldGFTaXRlSWRcIjpcIjFmZjQ2YTk2LWRlYTYtNDlkYS04M2JhLTUxNjRmYjYyZDgzOVwiLFwib3duZXJcIjpmYWxzZSxcImNyZWF0aW9uVGltZVwiOjE2MjI0MDMwOTM5MTEsXCJleHBpcmVzSW5cIjoxMjA5NjAwMDAwLFwiZXhwaXJhdGlvblRpbWVcIjoxNjIyNDAzMjEzOTExLFwibGFzdFJlZnJlc2hlZFwiOjAsXCJhZG1pblwiOmZhbHNlfSIsImlhdCI6MTYyMjQwMzA5M30.xDMCeRG2DIDa4YR6_XuTf7KBRgHFb0qW7K6gsVMLXUM
```

**Token contains:**
- Member ID
- Collection ID
- Meta Site ID
- Creation time
- Expiration time (expiresIn: 1209600000 ms = 14 days)
- Last refreshed timestamp

---

## Next: applySessionToken()

The backend generates the token, but **frontend must apply it** to complete login.

URL to check: https://dev.wix.com/docs/velo/apis/wix-members-frontend/authentication/apply-session-token


---

## Key Finding #2: applySessionToken() - Frontend Completion

### Purpose
- **Completes the login process** by applying the session token on the frontend
- Must be called in **page code** (frontend), not backend

### Critical Flow
```
Backend (wix-members-backend)
  ↓
  generateSessionToken(email) → returns token
  ↓
Frontend (wix-members-frontend)
  ↓
  applySessionToken(token) → logs member in
```

### Method Declaration
```javascript
applySessionToken(sessionToken: string): Promise<void>
```

### Sources of Session Tokens
1. `approveByEmail()` (Velo)
2. `approveByToken()` (Velo)
3. `register()` (SDK | Velo)
4. `generateSessionToken()` ← **This is what we need**
5. `login()` (SDK | Velo)

---

## CRITICAL ISSUE IDENTIFIED

### Problem
The session token is generated in **backend** but must be applied in **frontend page code**.

### Common Mistake
❌ Generating token in backend but **not passing it to frontend**  
❌ Not calling `applySessionToken()` in page code  
❌ Token generated but **session never actually created**

### Correct Implementation
```javascript
// BACKEND (http-functions.js or .jsw file)
import { authentication } from 'wix-members-backend';

export async function generateToken(email) {
  const token = await authentication.generateSessionToken(email);
  return token; // Return to frontend
}

// FRONTEND (page code)
import { authentication as authFrontend } from 'wix-members-frontend';
import { generateToken } from 'backend/auth-backend';

async function loginUser(email) {
  try {
    // Step 1: Get token from backend
    const token = await generateToken(email);
    
    // Step 2: Apply token on frontend (THIS IS CRITICAL)
    await authFrontend.applySessionToken(token);
    
    // Step 3: Session is now active
    console.log('User logged in successfully');
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

---

## Next: Check OAuth SSO Tutorial

URL: https://dev.wix.com/docs/develop-websites/articles/code-tutorials/wix-editor-elements/using-oauth-sso-with-velo


---

## Key Finding #3: Complete OAuth SSO Flow

### Official Wix OAuth Flow (11 Steps)

1. User clicks "Sign in with Google"
2. Wix site requests **authorization URL**
3. Browser forwards to OAuth provider (Google) using authorization URL
4. OAuth provider calls Wix site URL, passing **authorization code**
5. Wix backend requests **access token** using authorization code
6. Wix backend requests **user information** using access token
7. **Wix backend creates session token** using `generateSessionToken(email)`
8. Wix backend returns **redirect URL** to OAuth provider including session token
9. OAuth provider redirects browser using returned URL
10. Browser redirects to Wix **frontend page** using URL
11. **Wix site uses session token to log user in** via `applySessionToken()`

### Critical Code Pattern

**Backend (http-functions.js):**
```javascript
import { authentication } from 'wix-members-backend';

export async function get_getAuth(request) {
  // Get authorization code from Google
  const code = request.query.code;
  const state = request.query.state;
  
  // Exchange code for access token
  const tokens = await authConnection.getToken(code);
  
  // Get user info from Google
  const userInfo = await getUserInfo(tokens.access_token);
  const email = userInfo.email;
  
  // CRITICAL: Generate Wix session token
  const sessionToken = await authentication.generateSessionToken(email);
  
  // Return redirect with session token in URL
  return {
    status: 302,
    headers: {
      Location: `https://yoursite.com/callback?sessionToken=${sessionToken}&state=${state}`
    }
  };
}
```

**Frontend (callback page):**
```javascript
import { authentication } from 'wix-members-frontend';
import { session } from 'wix-storage-frontend';
import wixLocation from 'wix-location-frontend';

$w.onReady(async function() {
  // Get session token from URL
  const sessionToken = wixLocation.query.sessionToken;
  const responseState = wixLocation.query.state;
  
  // Get stored state (CSRF protection)
  const requestState = session.getItem('requestState');
  
  // Verify state matches
  if (sessionToken && requestState === responseState) {
    // CRITICAL: Apply session token to log user in
    await authentication.applySessionToken(sessionToken);
    
    console.log('✅ User logged in successfully');
    
    // Redirect to dashboard
    wixLocation.to('/dashboard');
  } else {
    console.error('❌ State mismatch or missing token');
  }
});
```

---

## SHAMROCK-SPECIFIC ISSUE IDENTIFIED

### Problem
Based on console errors showing `401 Unauthorized`, the likely issues are:

1. **Session token not being applied** - `applySessionToken()` not called
2. **Token passed incorrectly** - Token not reaching frontend
3. **State mismatch** - CSRF protection blocking login
4. **Member not created** - `generateSessionToken()` failing

### Next Steps
1. Audit Shamrock's Google OAuth implementation
2. Verify `generateSessionToken()` is being called
3. Verify `applySessionToken()` is being called on callback page
4. Check state variable storage and verification
5. Add error logging to identify exact failure point
