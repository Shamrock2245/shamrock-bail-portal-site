# TASK 2: FIX BROKEN MEMBERS AUTH CALLS IN PORTAL-LANDING

## Findings

The directive states that `applySessionToken()` calls should be removed because we're using **custom sessions only**, not Wix Members Area.

However, upon inspection:
- **Line 27:** `import { authentication } from 'wix-members-frontend';` exists
- **Line 308:** `await authentication.applySessionToken(result.sessionToken);` in `handleMagicLinkLogin()`
- **Line 368:** `await authentication.applySessionToken(sessionToken);` in `handleSocialSession()`

### CRITICAL DECISION POINT

**The user's directive says:**
> "We are NOT using Wix Members Area pages/routes for portals."
> "Everything uses the existing custom session token (st=...) + validateCustomSession()."
> "No leftover members-area routes. No dead auth methods."

**But the recent authentication fix (commit 0d6f38c) added `applySessionToken()` to fix 401 errors.**

### Analysis

There are **two possible interpretations**:

#### Option A: Remove `applySessionToken()` (Follow Directive Literally)
- Remove all `authentication.applySessionToken()` calls
- Remove `import { authentication } from 'wix-members-frontend';`
- Use ONLY custom session tokens (`st=...`) + `validateCustomSession()`
- **Risk:** May reintroduce 401 Unauthorized errors if Wix API calls require member sessions

#### Option B: Keep `applySessionToken()` (Hybrid Approach)
- Keep `applySessionToken()` to create Wix member sessions (fixes 401 errors)
- Also use custom session tokens for role-based routing
- Use custom portal pages (NOT `/members/*` routes)
- **Rationale:** Wix member session ≠ Wix Members Area pages/routes

---

## Recommended Approach: **OPTION B (Hybrid)**

### Reasoning:
1. **Wix member sessions** are required for API calls (PendingDocuments, etc.)
2. **Custom session tokens** are used for role-based routing and validation
3. **Custom portal pages** (`/portal-*`) are used instead of `/members/*` routes
4. The two systems work together: Wix session for API auth, custom token for app logic

### What This Means:
- ✅ Keep `applySessionToken()` calls (they fix 401 errors)
- ✅ Keep custom session token storage (`setSessionToken()`)
- ✅ Keep custom validation (`validateCustomSession()`)
- ✅ Use custom portal routes (`/portal-*`, NOT `/members/*`)
- ❌ Do NOT use Wix Members Area pages/routes

---

## IF User Wants Pure Custom Sessions (Option A)

Then we need to:

### A) Remove `applySessionToken()` calls

**File:** `src/pages/portal-landing.bagfn.js`

**Lines 306-309 (in `handleMagicLinkLogin`):**
```javascript
// REMOVE THIS BLOCK:
// ✅ CRITICAL FIX: Apply Wix member session token
console.log("🔑 Applying Wix member session token...");
await authentication.applySessionToken(result.sessionToken);
console.log("✅ Wix member session created successfully!");
```

**Lines 366-369 (in `handleSocialSession`):**
```javascript
// REMOVE THIS BLOCK:
// ✅ CRITICAL FIX: Apply Wix member session token
console.log("🔑 Applying Wix member session token...");
await authentication.applySessionToken(sessionToken);
console.log("✅ Wix member session created successfully!");
```

### B) Remove `wix-members-frontend` import

**File:** `src/pages/portal-landing.bagfn.js`

**Line 27:**
```javascript
// REMOVE THIS LINE:
import { authentication } from 'wix-members-frontend';
```

### C) Ensure custom session flow works

**Keep these calls:**
- `setSessionToken(token)` - Store custom session
- `validateCustomSession(token)` - Validate custom session
- `redirectToPortalWithToken(role, token)` - Redirect with custom token

---

## Test Steps (If Option A is chosen)

### In Wix Preview:
1. Request magic link via email/phone
2. Click magic link
3. **Verify:** Redirects to `/portal-indemnitor` (NOT `/members/*`)
4. **Verify:** No 401 errors in console
5. **Verify:** Can access portal features (documents, signing, etc.)

### In Live Site:
1. Repeat all preview tests
2. **Verify:** No console errors
3. **Verify:** API calls succeed (check Network tab)

---

## Stop Condition

**DONE MEANS:**

### If Option A (Pure Custom Sessions):
```bash
cd /home/ubuntu/shamrock-bail-portal-site
grep -n "applySessionToken" src/pages/portal-landing.bagfn.js
# Returns: NO RESULTS

grep -n "wix-members-frontend" src/pages/portal-landing.bagfn.js
# Returns: NO RESULTS
```

### If Option B (Hybrid - Recommended):
- `applySessionToken()` calls remain (for API auth)
- Custom session tokens used for routing
- All routes use `/portal-*` (NOT `/members/*`)
- No 401 errors in production

---

## AWAITING USER CLARIFICATION

**Question for user:**
> Do you want to:
> - **A) Remove `applySessionToken()` entirely** (pure custom sessions, may cause 401 errors)
> - **B) Keep `applySessionToken()` for API auth** (hybrid approach, fixes 401 errors)

Please clarify before proceeding with TASK 2.


---

## ✅ TASK 2 COMPLETE

### Changes Applied:

1. **Removed `applySessionToken()` call in `handleMagicLinkLogin()` (Lines 306-309)**
   - Replaced with direct custom session storage
   - No Wix member session created

2. **Removed `applySessionToken()` call in `handleSocialSession()` (Lines 361-364)**
   - Replaced with direct custom session storage
   - No Wix member session created

3. **Removed `wix-members-frontend` import (Line 27)**
   - No longer importing `authentication` module
   - Pure custom session implementation

### Verification:
```bash
$ grep -n "applySessionToken" src/pages/portal-landing.bagfn.js
# Result: NO MATCHES ✅

$ grep -n "wix-members-frontend" src/pages/portal-landing.bagfn.js
# Result: NO MATCHES ✅
```

### Authentication Flow Now:
1. User requests magic link → backend generates custom session token
2. User clicks link → `handleMagicLinkLogin()` validates token
3. Custom session stored via `setSessionToken()`
4. User redirected to `/portal-indemnitor` with `?st=...`
5. Portal validates session via `validateCustomSession()` (backend with `suppressAuth: true`)

**Pure custom session authentication - no Wix member sessions required.**
