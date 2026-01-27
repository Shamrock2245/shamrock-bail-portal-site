# Portal-Indemnitor Audit Report

**Date:** January 26, 2026  
**File:** `src/pages/portal-indemnitor.k53on.js`

---

## Executive Summary

This audit examines the portal-indemnitor page to verify all data capture fields and functions are working correctly. The page handles the indemnitor (co-signer) workflow for bail bond paperwork.

---

## Data Capture Fields

### Phase 1 - Basic Information

| Element ID | Purpose | Required | Backend Handler |
|------------|---------|----------|-----------------|
| `#inputDefendantName` | Defendant's full name | ✅ Yes | formData.defendantName |
| `#inputDefendantPhone` | Defendant's phone | ❌ Optional | formData.defendantPhone |
| `#inputIndemnitorName` | Indemnitor's full name | ✅ Yes | formData.indemnitorName |
| `#inputIndemnitorAddress` | Indemnitor's address | ✅ Yes | formData.indemnitorAddress |

### Phase 2 - Contact Information

| Element ID | Purpose | Required | Backend Handler |
|------------|---------|----------|-----------------|
| `#inputIndemnitorEmail` | Indemnitor's email | ✅ Yes | formData.indemnitorEmail |
| `#inputIndemnitorPhone` | Indemnitor's phone | ✅ Yes | formData.indemnitorPhone |

### Phase 3 - References

| Element ID | Purpose | Required | Backend Handler |
|------------|---------|----------|-----------------|
| `#inputRef1Name` | Reference 1 name | ✅ Yes | formData.reference1.name |
| `#inputRef1Phone` | Reference 1 phone | ✅ Yes | formData.reference1.phone |
| `#inputRef1Address` | Reference 1 address | ✅ Yes | formData.reference1.address |
| `#inputRef2Name` | Reference 2 name | ✅ Yes | formData.reference2.name |
| `#inputRef2Phone` | Reference 2 phone | ✅ Yes | formData.reference2.phone |
| `#inputRef2Address` | Reference 2 address | ✅ Yes | formData.reference2.address |

### Address Auto-Fill Fields

| Element ID | Purpose | Auto-Filled |
|------------|---------|-------------|
| `#inputIndemnitorCity` | City from geolocation | ✅ Yes |
| `#inputIndemnitorState` | State from geolocation | ✅ Yes |
| `#inputIndemnitorZip` | ZIP from geolocation | ✅ Yes |

---

## Dashboard Display Fields

| Element ID | Data Source | Purpose |
|------------|-------------|---------|
| `#welcomeText` | Session | Welcome message |
| `#liabilityText` | getIndemnitorDetails() | Total liability amount |
| `#totalPremiumText` | getIndemnitorDetails() | Total premium |
| `#downPaymentText` | getIndemnitorDetails() | Down payment amount |
| `#balanceDueText` | getIndemnitorDetails() | Balance due |
| `#chargesCountText` | getIndemnitorDetails() | Number of charges |
| `#defendantNameText` | getIndemnitorDetails() | Defendant name display |
| `#defendantStatusText` | getIndemnitorDetails() | Defendant status |
| `#lastCheckInText` | getIndemnitorDetails() | Last check-in date |
| `#nextCourtDateText` | getIndemnitorDetails() | Next court date |

---

## Action Buttons

| Element ID | Handler | Purpose |
|------------|---------|---------|
| `#startFinancialPaperworkBtn` | handlePaperworkStart() | Primary paperwork CTA |
| `#startPaperworkBtn` | handlePaperworkStart() | Alias paperwork CTA |
| `#logoutBtn` | handleLogout() | Logout functionality |
| `#callBtn` | tel:2393322245 | Call office |
| `#contactBtn` | /contact | Navigate to contact page |
| `#inputMessageSubmitBtn` | sendAdminNotification() | Send message to admin |

---

## Workflow Analysis

### Authentication Flow
```
1. Check for session token in URL (?st=xxx)
2. If found, store in local storage
3. Validate session with backend (validateCustomSession)
4. Check role is 'indemnitor' or 'coindemnitor'
5. If valid, load dashboard data
```
**Status:** ✅ Working

### Paperwork Start Flow
```
1. Collect all form data
2. Validate required fields
3. Check ID upload status (front + back required)
4. If missing, show IdUploadLightbox
5. Check consent status
6. If missing, show ConsentLightbox
7. Call createEmbeddedLink() with formData
8. Show SigningLightbox with embedded link
```
**Status:** ⚠️ Needs verification of GAS backend handling formData

### ID Upload Check
```
1. getMemberDocuments(email, sessionToken)
2. Filter for documentType === 'government_id'
3. Check for both 'front' and 'back' sides
4. Return true only if both exist
```
**Status:** ✅ Logic correct

---

## Issues Identified

### Issue 1: Duplicate setupPaperworkButtons() Call
**Location:** Line 68-69
```javascript
setupPaperworkButtons();
setupPaperworkButtons(); // DUPLICATE
```
**Severity:** Low (no functional impact, just redundant)
**Fix:** Remove duplicate line

### Issue 2: wixApi.jsw Uses Hardcoded 'Import3' Collection Name
**Location:** `src/backend/wixApi.jsw` line 24
```javascript
const COLLECTION_MEMBER_DOCUMENTS = 'Import3';
```
**Severity:** High - Should use COLLECTIONS.MEMBER_DOCUMENTS ('Memberdocuments')
**Fix:** Update to use proper collection name

### Issue 3: getIndemnitorDetails Returns Limited Financial Data
**Location:** `src/backend/portal-auth.jsw`
**Issue:** The function doesn't return financial fields (totalLiability, totalPremium, etc.)
**Severity:** Medium - Dashboard will show $0.00 for financial fields
**Fix:** Enhance getIndemnitorDetails to return financial data from Cases collection

### Issue 4: formData Not Passed to GAS for Document Generation
**Location:** `src/backend/signnow-integration.jsw` line 66-74
**Issue:** formData is passed to GAS but GAS createEmbeddedLink() doesn't use it
**Severity:** High - Indemnitor data won't populate documents
**Fix:** Update GAS to use formData for document field population

### Issue 5: Consent Status Check Returns Boolean Instead of Object
**Location:** `portal-indemnitor.k53on.js` line 466-472
```javascript
async function checkConsentStatus(personId) {
    try {
        return await getUserConsentStatus(personId);
    } catch (e) {
        return false;
    }
}
```
**Issue:** getUserConsentStatus returns `{hasConsent: boolean, ...}` but code expects boolean
**Severity:** Medium - Consent check may always fail
**Fix:** Update to check `result.hasConsent`

---

## Recommended Fixes

### Fix 1: Remove Duplicate Function Call
```javascript
// Line 68-69: Remove duplicate
setupPaperworkButtons();
// setupPaperworkButtons(); // REMOVE THIS LINE
```

### Fix 2: Update wixApi.jsw Collection Name
```javascript
// Line 24: Change from
const COLLECTION_MEMBER_DOCUMENTS = 'Import3';
// To
const COLLECTION_MEMBER_DOCUMENTS = 'Memberdocuments';
```

### Fix 3: Update checkConsentStatus Function
```javascript
async function checkConsentStatus(personId) {
    try {
        const result = await getUserConsentStatus(personId);
        return result?.hasConsent || false;
    } catch (e) {
        console.error("Indemnitor checkConsentStatus error:", e);
        return false;
    }
}
```

### Fix 4: Enhance getIndemnitorDetails in portal-auth.jsw
Add financial fields to the return object:
- totalLiability
- totalPremium
- downPayment
- balanceDue
- chargesCount

---

## Backend Dependencies

| Module | Function | Status |
|--------|----------|--------|
| portal-auth.jsw | validateCustomSession | ✅ Implemented |
| portal-auth.jsw | getIndemnitorDetails | ⚠️ Missing financial fields |
| portal-auth.jsw | getUserConsentStatus | ✅ Implemented |
| documentUpload.jsw | getMemberDocuments | ✅ Implemented |
| signnow-integration.jsw | createEmbeddedLink | ✅ Implemented |
| wixApi.jsw | getAllDocumentsForMember | ✅ Implemented |
| notificationService.jsw | sendAdminNotification | ✅ Implemented |
| googleMaps.jsw | reverseGeocodeToCityStateZip | ✅ Implemented |
| googleMaps.jsw | geocodeAddressToCityStateZip | ✅ Implemented |

---

## Lightbox Dependencies

| Lightbox Name | Purpose | Triggered By |
|---------------|---------|--------------|
| IdUploadLightbox | ID document upload | Missing ID check |
| ConsentLightbox | Consent collection | Missing consent check |
| SigningLightbox | Embedded SignNow signing | After validation |

---

## Collection Dependencies

| Collection | Purpose | Used By |
|------------|---------|---------|
| PortalSessions | Session validation | validateCustomSession |
| Cases | Case data | getIndemnitorDetails |
| Memberdocuments | ID uploads | getMemberDocuments |
| PendingDocuments | Signing status | getAllDocumentsForMember |

---

## Fixes Applied

### Fix 1: Removed Duplicate Function Call ✅
- Removed duplicate `setupPaperworkButtons()` call at line 69

### Fix 2: Updated wixApi.jsw Collection Name ✅
- Changed `COLLECTION_MEMBER_DOCUMENTS` from 'Import3' to 'Memberdocuments'

### Fix 3: Fixed checkConsentStatus Function ✅
- Updated to properly check `result.hasConsent` property

### Fix 4: Enhanced getIndemnitorDetails ✅
- Added financial fields: totalLiability, totalPremium, downPayment, balanceDue, chargesCount
- Added defendant status fields: defendantStatus, lastCheckIn, nextCourtDate

### Fix 5: Added Portal Signing Session Handler ✅
- Added `createPortalSigningSession` action to GAS Code.js
- This handler generates documents from template and creates embedded signing links
- Added `mapPortalFormDataToSignNowFields` function for field mapping

### Fix 6: Updated signnow-integration.jsw ✅
- Modified `createEmbeddedLink` to detect when formData is provided
- Automatically routes to `createPortalSigningSession` when form data exists

---

## Next Steps

1. ✅ Fixes applied and committed
2. Test the complete paperwork flow
3. Verify SignNow embedded signing works
4. Confirm ID uploads are captured correctly
5. Validate data flows to GAS backend

