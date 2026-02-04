# TASK 1: REMOVE /members/* ROUTING

## Findings

Found **6 instances** of `/members/` routes in 2 files:

### File 1: `src/backend/accessCodes.jsw`
- **Line 49:** `redirectUrl = '/members/defendant-dashboard';`
- **Line 52:** `redirectUrl = '/members/indemnitor-dashboard';`
- **Line 55:** `redirectUrl = '/members/staff-dashboard';`
- **Line 58:** `redirectUrl = '/members/start-bail';`

### File 2: `src/lightboxes/EmergencyCtaLightbox.js`
- **Line 71:** `wixLocation.to(\`/members/start-bail?county=${selectedCounty}\`);`
- **Line 73:** `wixLocation.to('/members/start-bail');`

---

## Exact Changes Required

### A) Fix `src/backend/accessCodes.jsw` (Lines 45-60)

**Current code:**
```javascript
switch (role) {
    case 'defendant':
        redirectUrl = '/members/defendant-dashboard';
        break;
    case 'indemnitor':
        redirectUrl = '/members/indemnitor-dashboard';
        break;
    case 'staff':
        redirectUrl = '/members/staff-dashboard';
        break;
    default:
        redirectUrl = '/members/start-bail';
}
```

**Required fix:**
```javascript
switch (role) {
    case 'defendant':
        redirectUrl = '/portal-defendant';
        break;
    case 'indemnitor':
        redirectUrl = '/portal-indemnitor';
        break;
    case 'staff':
    case 'admin':
        redirectUrl = '/portal-staff';
        break;
    default:
        redirectUrl = '/portal-landing';
}
```

**What NOT to change:**
- Do not modify the token generation logic
- Do not change function signatures
- Do not rename variables

---

### B) Fix `src/lightboxes/EmergencyCtaLightbox.js` (Lines 71-73)

**Current code:**
```javascript
if (selectedCounty) {
    wixLocation.to(`/members/start-bail?county=${selectedCounty}`);
} else {
    wixLocation.to('/members/start-bail');
}
```

**Required fix:**
```javascript
if (selectedCounty) {
    wixLocation.to(`/portal-landing?county=${selectedCounty}`);
} else {
    wixLocation.to('/portal-landing');
}
```

**What NOT to change:**
- Do not modify the county selection logic
- Do not change button handlers
- Do not rename element IDs

---

## Test Steps

### In Wix Preview:
1. Generate an access code for each role (defendant, indemnitor, staff)
2. Click the access code link
3. **Verify:** Redirects to `/portal-defendant`, `/portal-indemnitor`, or `/portal-staff` (NOT `/members/*`)
4. Open Emergency CTA lightbox
5. Select a county and click "Get Started"
6. **Verify:** Redirects to `/portal-landing?county=...` (NOT `/members/start-bail`)

### In Live Site:
1. Repeat all preview tests
2. **Verify:** No 404 errors
3. **Verify:** No console errors about missing routes

---

## Stop Condition

**DONE MEANS:**
```bash
cd /home/ubuntu/shamrock-bail-portal-site
grep -r "/members/" src/ --include="*.js" --include="*.jsw"
# Returns: NO RESULTS (or only comments/documentation)
```

All portal-related routes must use `/portal-*` instead of `/members/*`.


---

## ✅ TASK 1 COMPLETE

### Changes Applied:

1. **`src/backend/accessCodes.jsw` (Lines 47-60)**
   - ✅ Changed `/members/defendant-dashboard` → `/portal-defendant`
   - ✅ Changed `/members/indemnitor-dashboard` → `/portal-indemnitor`
   - ✅ Changed `/members/staff-dashboard` → `/portal-staff`
   - ✅ Added `case 'admin':` to route to `/portal-staff`
   - ✅ Changed default `/members/start-bail` → `/portal-landing`

2. **`src/lightboxes/EmergencyCtaLightbox.js` (Lines 70-74)**
   - ✅ Changed `/members/start-bail?county=...` → `/portal-landing?county=...`
   - ✅ Changed `/members/start-bail` → `/portal-landing`

### Verification:
```bash
$ grep -r "/members/" src/ --include="*.js" --include="*.jsw"
# Result: NO MATCHES ✅
```

**All `/members/*` portal routes have been removed from the codebase.**
