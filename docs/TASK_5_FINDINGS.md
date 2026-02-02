# TASK 5: VERIFY STAFF ACCOUNTS AND ROUTING

## Findings

### ✅ Staff Accounts Configuration is CORRECT

**Location:** `src/backend/portal-auth.jsw` (Lines 44-56)

**Configured Staff Accounts:**
```javascript
STAFF_ACCOUNTS: {
    'admin@shamrockbailbonds.biz': {
        role: 'admin',
        personId: 'staff_admin_primary',
        name: 'Brendan (Admin)'
    },
    'shamrockbailoffice@gmail.com': {
        role: 'staff',
        personId: 'staff_office_secondary',
        name: 'Office Staff'
    }
}
```

**Status:** ✅ **CORRECT** - Exactly two staff accounts as specified

---

## Staff Detection Flow

### 1. User Requests Magic Link

**Function:** `sendMagicLinkSimplified(emailOrPhone)`

**Flow:**
1. User enters email/phone on portal-landing
2. Backend calls `lookupUserByContact(contact)`
3. Checks if email matches staff account
4. If yes → returns staff role and details
5. If no → checks Cases collection for defendant
6. If not found → defaults to indemnitor

---

### 2. Staff Account Detection

**Function:** `lookupUserByContact(contact)` (Lines ~560-600)

**Code:**
```javascript
// 1. Check if it's a hardcoded staff account
if (isEmail(contact) && isStaffAccount(contact)) {
    const staffDetails = getStaffAccountDetails(contact);
    console.log(`✅ Staff account identified: ${staffDetails.name} (${staffDetails.role})`);
    return {
        found: true,
        personId: staffDetails.personId,
        role: staffDetails.role,  // 'admin' or 'staff'
        email: normalized,
        name: staffDetails.name,
        isStaff: true
    };
}
```

**Status:** ✅ **WORKING**

---

### 3. Staff Routing

**Function:** `redirectToPortal(role)` and `redirectToPortalWithToken(role, sessionToken)`

**Location:** `src/pages/portal-landing.bagfn.js`

**Code:**
```javascript
function redirectToPortal(role) {
    const portalMap = {
        'defendant': '/portal-defendant',
        'indemnitor': '/portal-indemnitor',
        'coindemnitor': '/portal-indemnitor',
        'staff': '/portal-staff',
        'admin': '/portal-staff'
    };
    const destination = portalMap[role] || '/portal-indemnitor';
    console.log("🚀 Redirecting to: " + destination);
    wixLocation.to(destination);
}
```

**Status:** ✅ **CORRECT** - Both 'staff' and 'admin' route to `/portal-staff`

---

## Complete Staff Login Flow

### Scenario: admin@shamrockbailbonds.biz logs in

1. **User enters email** on portal-landing
2. **Clicks "Get Started"**
3. **Backend:**
   - Calls `sendMagicLinkSimplified('admin@shamrockbailbonds.biz')`
   - Calls `lookupUserByContact('admin@shamrockbailbonds.biz')`
   - Detects staff account via `isStaffAccount()`
   - Returns `{ role: 'admin', personId: 'staff_admin_primary', name: 'Brendan (Admin)' }`
   - Generates magic link with `role: 'admin'`
4. **User clicks magic link**
5. **Frontend:**
   - Calls `handleMagicLinkLogin(token)`
   - Validates token via `onMagicLinkLoginV2(token)`
   - Receives `{ ok: true, sessionToken: '...', role: 'admin' }`
   - Stores session token
   - Calls `redirectToPortalWithToken('admin', sessionToken)`
   - Redirects to `/portal-staff?st=...`
6. **Staff portal loads** with admin privileges

**Status:** ✅ **COMPLETE END-TO-END FLOW**

---

## Verification Checklist

### ✅ Staff Account Configuration
- [x] Exactly two staff accounts defined
- [x] `admin@shamrockbailbonds.biz` → role: 'admin'
- [x] `shamrockbailoffice@gmail.com` → role: 'staff'

### ✅ Staff Detection
- [x] `isStaffAccount()` checks email against STAFF_ACCOUNTS
- [x] `getStaffAccountDetails()` returns correct role and personId
- [x] `lookupUserByContact()` prioritizes staff check before Cases lookup

### ✅ Staff Routing
- [x] `redirectToPortal()` maps 'staff' → '/portal-staff'
- [x] `redirectToPortal()` maps 'admin' → '/portal-staff'
- [x] `redirectToPortalWithToken()` includes session token in URL
- [x] No `/members/*` routes used

### ✅ Default Role Policy
- [x] Non-staff emails default to indemnitor
- [x] New users default to indemnitor
- [x] Staff cannot land in indemnitor/defendant portals

---

## No Changes Required

**All staff account configuration and routing is already correct.**

No code changes needed for TASK 5.

---

## Test Steps

### In Wix Preview:

1. **Test staff login (admin):**
   - Enter `admin@shamrockbailbonds.biz`
   - Click "Get Started"
   - Click magic link from email
   - **Verify:** Redirects to `/portal-staff`
   - **Verify:** Admin privileges available

2. **Test staff login (office):**
   - Enter `shamrockbailoffice@gmail.com`
   - Click "Get Started"
   - Click magic link from email
   - **Verify:** Redirects to `/portal-staff`
   - **Verify:** Staff privileges available

3. **Test non-staff login:**
   - Enter any other email
   - Click "Get Started"
   - Click magic link from email
   - **Verify:** Redirects to `/portal-indemnitor` (NOT `/portal-staff`)

4. **Test staff cannot access other portals:**
   - Log in as staff
   - Try to manually navigate to `/portal-indemnitor`
   - **Verify:** Portal validates session and role
   - **Verify:** Either redirects or shows access denied

### In Live Site:
- Repeat all preview tests
- **Verify:** No console errors
- **Verify:** No 404 errors

---

## Stop Condition

**DONE MEANS:**

1. ✅ Exactly two staff accounts configured
2. ✅ Staff detection works via `isStaffAccount()`
3. ✅ Staff routing maps to `/portal-staff` (NOT `/members/*`)
4. ✅ Non-staff users default to indemnitor
5. ✅ Staff cannot land in indemnitor/defendant portals

**Staff accounts and routing are already correctly configured. No changes needed.**
