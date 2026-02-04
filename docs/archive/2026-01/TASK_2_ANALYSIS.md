# TASK 2: Analysis - Do We Need Wix Member Sessions?

## Investigation Results

### What Your Workflows Use:

1. **Backend Functions (`.jsw` files)**
   - Use `wixData` extensively (PendingDocuments, IntakeQueue, Cases, etc.)
   - **ALL backend calls use `{ suppressAuth: true }`**
   - This means backend functions bypass Wix member authentication
   - Backend functions authenticate using custom session validation instead

2. **Frontend Portal Pages (`.js` files)**
   - `portal-indemnitor.k53on.js` queries IntakeQueue, FloridaCounties
   - `portal-staff.qs9dx.js` uses wixData
   - These are **frontend calls** that may require authentication

### Key Discovery: Backend Uses `suppressAuth: true`

**Example from `src/backend/accessCodes.jsw`:**
```javascript
const results = await wixData.query(COLLECTIONS.MAGIC_LINKS)
    .find({ suppressAuth: true }); // Admin read to validate
```

**What this means:**
- Backend functions explicitly bypass Wix member authentication
- They use `suppressAuth: true` to run with elevated permissions
- Your custom session validation (`validateCustomSession()`) controls access

---

## Answer: **You DON'T Need Wix Member Sessions**

### Reasoning:

1. **Backend functions** use `suppressAuth: true` (no member session needed)
2. **Custom session validation** (`validateCustomSession()`) controls access
3. **Custom portal pages** (`/portal-*`) don't use Wix Members Area
4. **Frontend wixData calls** from portal pages will work if:
   - Collection permissions are set to "Anyone" or "Site Member" (with suppressAuth in backend)
   - OR backend functions handle all data operations (recommended)

### The Conflict:

The recent authentication fix added `applySessionToken()` to solve 401 errors, but:
- Those 401 errors were likely from **frontend wixData calls** in portal pages
- The proper fix is to **move data operations to backend functions** with `suppressAuth: true`
- NOT to create Wix member sessions

---

## Recommended Fix for TASK 2:

### A) Remove `applySessionToken()` calls (Lines 306-309, 366-369)

**File:** `src/pages/portal-landing.bagfn.js`

Remove these blocks entirely:
```javascript
// REMOVE:
await authentication.applySessionToken(result.sessionToken);
```

### B) Remove `wix-members-frontend` import (Line 27)

```javascript
// REMOVE:
import { authentication } from 'wix-members-frontend';
```

### C) Keep custom session flow

**Keep these (they work):**
- `setSessionToken(token)` - Store custom session in browser
- `validateCustomSession(token)` - Validate via backend
- `redirectToPortalWithToken(role, token)` - Route to correct portal

### D) Ensure backend functions handle all data operations

**Pattern:**
```javascript
// Frontend (portal page):
import { getMyDocuments } from 'backend/documents';

const docs = await getMyDocuments(sessionToken);

// Backend (documents.jsw):
export async function getMyDocuments(sessionToken) {
    // Validate custom session
    const validation = await validateCustomSession(sessionToken);
    if (!validation.valid) {
        return { error: 'Unauthorized' };
    }
    
    // Query with suppressAuth
    const results = await wixData.query('PendingDocuments')
        .eq('personId', validation.personId)
        .find({ suppressAuth: true });
    
    return results.items;
}
```

---

## Why This Works:

1. ✅ **No Wix member sessions** (not needed)
2. ✅ **Custom sessions** control access via `validateCustomSession()`
3. ✅ **Backend functions** use `suppressAuth: true` for elevated permissions
4. ✅ **Custom portal pages** (`/portal-*`) route users correctly
5. ✅ **No 401 errors** because backend handles all data operations

---

## Conclusion:

**The concepts DON'T conflict.**

You can have:
- ✅ Custom authentication (magic links, custom sessions)
- ✅ Custom portal pages (`/portal-*`)
- ✅ Backend functions with `suppressAuth: true`
- ❌ NO Wix member sessions
- ❌ NO Wix Members Area routes (`/members/*`)

**Proceeding with TASK 2: Remove `applySessionToken()` calls.**
