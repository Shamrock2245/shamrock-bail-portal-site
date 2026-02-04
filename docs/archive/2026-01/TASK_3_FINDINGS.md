# TASK 3: REINFORCE PORTAL-LANDING FLOW WITH DETERMINISTIC PRECEDENCE

## Findings

### Current Precedence Order (Lines 34-94):

1. **Magic link token** (`query.token`) - Line 37
   - ✅ Correctly checks `wixWindow.rendering.env === 'browser'` to prevent SSR consumption
   - ✅ Calls `handleMagicLinkLogin()` and returns
   
2. **Session token in URL** (`query.st`) - Line 44
   - ✅ Stores token via `setSessionToken()`
   - ✅ Validates via `validateCustomSession()`
   - ✅ Redirects to portal based on role
   
3. **Social login result** (`query.sessionToken`) - Line 59
   - ✅ Calls `handleSocialSession()`
   - ✅ Handles OAuth callback
   
4. **Existing session in storage** - Line 73
   - ✅ Has loop breaker for `auth_error` or `logout` query params
   - ✅ Validates existing session
   - ✅ Auto-redirects if valid
   - ✅ Clears if invalid

5. **Show login form** - Line 94
   - ✅ Falls through to `setupSimplifiedLogin()`

---

## Analysis

### ✅ Precedence Order is CORRECT

The current implementation follows the required precedence exactly:

1. ✅ `query.token` (magic link) → handled first
2. ✅ `query.st` (session token) → handled second
3. ✅ Existing session → checked last (with loop breaker)
4. ✅ Show login UI → default fallback

### ✅ No Redundancy Found

Each branch:
- Has a single responsibility
- Returns after handling (no fall-through)
- Does not conflict with other branches

### ✅ Query Params Not Consumed Incorrectly

- Magic link token only processed in browser environment
- Session token properly stored and validated
- Loop breaker prevents infinite redirects

---

## Minor Issues Found

### Issue 1: Duplicate Comment (Line 35-36)

**Current:**
```javascript
// 1. PRIORITY: Check for magic link token in URL (returning from email/SMS)
// 1. PRIORITY: Check for magic link token in URL (returning from email/SMS)
// ONLY run on client-side to prevent SSR from consuming the token
```

**Fix:** Remove duplicate line

---

### Issue 2: Duplicate Comment (Line 65-66)

**Current:**
```javascript
// 4. LAST: Check if user already has a valid session in storage
// 4. LAST: Check if user already has a valid session in storage
// Loop Breaker: If we just came from a failed auth redirect, DO NOT auto-redirect again
```

**Fix:** Remove duplicate line

---

### Issue 3: `handleSocialSession()` Function Signature

**Current call (Line 61):**
```javascript
await handleSocialSession(query.sessionToken, query.role);
```

**Function definition (Line 350):**
```javascript
async function handleSocialSession(sessionToken, role) {
```

**Issue:** The `role` parameter is passed but never used (function always defaults to 'indemnitor')

**Fix:** Remove unused `role` parameter from function call

---

## Exact Changes Required

### A) Remove duplicate comments (Lines 35, 66)

**File:** `src/pages/portal-landing.bagfn.js`

**Line 35:** Remove this line:
```javascript
// 1. PRIORITY: Check for magic link token in URL (returning from email/SMS)
```

**Line 66:** Remove this line:
```javascript
// 4. LAST: Check if user already has a valid session in storage
```

### B) Simplify handleSocialSession call (Line 61)

**Current:**
```javascript
await handleSocialSession(query.sessionToken, query.role);
```

**Change to:**
```javascript
await handleSocialSession(query.sessionToken);
```

### C) Update handleSocialSession signature (Line 350)

**Current:**
```javascript
async function handleSocialSession(sessionToken, role) {
```

**Change to:**
```javascript
async function handleSocialSession(sessionToken) {
```

---

## What NOT to Change

- ❌ Do not modify precedence order
- ❌ Do not add new auth branches
- ❌ Do not change loop breaker logic
- ❌ Do not modify query param names
- ❌ Do not change redirect logic

---

## Test Steps

### In Wix Preview:

1. **Test magic link flow:**
   - Request magic link
   - Click link with `?token=...`
   - **Verify:** Redirects to `/portal-indemnitor`
   - **Verify:** No duplicate processing

2. **Test session token flow:**
   - Visit `/portal-landing?st=...`
   - **Verify:** Stores token and redirects
   - **Verify:** No conflicts with magic link

3. **Test social login flow:**
   - Click "Sign in with Google"
   - Complete OAuth
   - **Verify:** Redirects to `/portal-indemnitor`
   - **Verify:** No role parameter issues

4. **Test existing session:**
   - Log in once
   - Revisit `/portal-landing`
   - **Verify:** Auto-redirects to portal
   - **Verify:** No infinite loops

5. **Test loop breaker:**
   - Visit `/portal-landing?auth_error=true`
   - **Verify:** Shows login form (no auto-redirect)
   - **Verify:** Session cleared

### In Live Site:
- Repeat all preview tests
- **Verify:** No console errors
- **Verify:** No 404 errors

---

## Stop Condition

**DONE MEANS:**

1. ✅ No duplicate comments in `$w.onReady`
2. ✅ `handleSocialSession()` called with one parameter only
3. ✅ Function signature matches call signature
4. ✅ Precedence order remains unchanged
5. ✅ All test scenarios pass without errors

**The flow is deterministic with no redundancy or competing branches.**


---

## ✅ TASK 3 COMPLETE

### Changes Applied:

1. **Removed duplicate comment (Line 35)**
   - ✅ Cleaned up duplicate "1. PRIORITY" comment

2. **Removed duplicate comment (Line 65)**
   - ✅ Cleaned up duplicate "4. LAST" comment

3. **Simplified `handleSocialSession()` call (Line 60)**
   - ✅ Removed unused `query.role` parameter
   - Changed from: `await handleSocialSession(query.sessionToken, query.role);`
   - Changed to: `await handleSocialSession(query.sessionToken);`

4. **Updated `handleSocialSession()` signature (Line 352)**
   - ✅ Removed unused `role` parameter
   - Changed from: `async function handleSocialSession(sessionToken, role) {`
   - Changed to: `async function handleSocialSession(sessionToken) {`

5. **Updated outdated comments**
   - ✅ Changed "FIXED: Now calls applySessionToken()" → "Uses custom session tokens only"
   - Applied to both `handleMagicLinkLogin()` and `handleSocialSession()`

### Precedence Order Verified:

1. ✅ `query.token` (magic link) → handled first, browser-only
2. ✅ `query.st` (session token) → handled second
3. ✅ `query.sessionToken` (social login) → handled third
4. ✅ Existing session → checked last with loop breaker
5. ✅ Show login UI → default fallback

**The flow is now clean, deterministic, and has no redundancy or competing branches.**
