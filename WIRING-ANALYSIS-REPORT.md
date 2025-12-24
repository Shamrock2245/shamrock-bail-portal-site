# Shamrock Bail Portal - Frontend/Backend Wiring Analysis Report

**Date:** December 23, 2024  
**Repository:** shamrock-bail-portal-site  
**Analysis Scope:** Backend module imports, function exports, and integration points

---

## Executive Summary

This report documents the analysis of the Shamrock Bail Bonds Wix Velo portal codebase to identify and fix frontend/backend wiring issues. Several critical issues were identified and resolved.

---

## Issues Identified and Fixed

### 1. CRITICAL: Missing `wixApi.jsw` Module

**Status:** ✅ FIXED

**Problem:**  
The `http-functions.js` file imported from `backend/wixApi` but this module did not exist:

```javascript
import { addPendingDocument, addPendingDocumentsBatch, updateDocumentStatus } from 'backend/wixApi';
```

**Solution:**  
Created `/src/backend/wixApi.jsw` with the following exported functions:
- `addPendingDocument(document, apiKey)` - Add single pending document
- `addPendingDocumentsBatch(documents, apiKey)` - Batch add documents
- `updateDocumentStatus(signNowDocumentId, status, apiKey)` - Update document status
- `getPendingDocumentsForMember(memberEmail)` - Get pending docs for member
- `getAllDocumentsForMember(memberEmail)` - Get all docs for member
- `getDocumentById(documentId)` - Get document by ID
- `addRequiredDocument(requirement)` - Add required document
- `getRequiredDocuments(memberEmail)` - Get required documents
- `cleanupExpiredDocuments()` - Cleanup expired documents

---

### 2. CRITICAL: Missing `bailCalculator.jsw` Module

**Status:** ✅ FIXED

**Problem:**  
The `public/packages/bailCalculator.js` imported from `backend/bailCalculator.jsw`:

```javascript
import { fetchBookingData } from 'backend/bailCalculator.jsw';
```

**Solution:**  
Created `/src/backend/bailCalculator.jsw` with the following exported functions:
- `fetchBookingData(searchParams)` - Fetch booking data from county systems
- `calculateBondFee(bondAmount, chargeCount)` - Calculate bail bond premium
- `calculateTransferFee(county)` - Calculate transfer fee for out-of-area counties
- `calculateTotalCost(params)` - Calculate total estimated cost
- `getCollateralRequirements(bondAmount)` - Determine collateral requirements
- `formatCurrency(amount)` - Format currency for display
- `getCountyBailInfo(county)` - Get county-specific bail information

---

### 3. Missing `getCurrentLocation` Function in `location.jsw`

**Status:** ✅ FIXED

**Problem:**  
The `Home.js` page imported `getCurrentLocation` from `backend/location`:

```javascript
import { getCurrentLocation } from 'backend/location';
```

But this function was not exported from `location.jsw`.

**Solution:**  
Added `getCurrentLocation()` function to `/src/backend/location.jsw` that:
- Gets the current logged-in member
- Retrieves the most recent location from the database
- Returns location data with freshness indicator

---

## Verified Working Integrations

The following imports were verified as correctly wired:

| Module | Functions | Status |
|--------|-----------|--------|
| `backend/routing` | `getPhoneNumber` | ✅ Working |
| `backend/counties` | `getAllCounties`, `getFeaturedCounties`, `getCountyBySlug`, `searchCounties`, `getCountyStats` | ✅ Working |
| `backend/notificationService` | `reportSystemError` | ✅ Working |
| `backend/geocoding` | `detectCounty` | ✅ Working |
| `backend/location` | `saveUserLocation`, `getCurrentLocation` | ✅ Working (after fix) |
| `backend/signNowIntegration` | `initiateSignNowHandoff` | ✅ Working |
| `backend/signnow-integration.jsw` | `makeSignNowRequest`, `getDocumentStatus` | ✅ Working |
| `backend/documentUpload.jsw` | `uploadIdDocument` | ✅ Working |
| `backend/portal-api-client` | All CRUD functions | ✅ Working |
| `backend/portal-auth` | All auth functions | ✅ Working |
| `backend/call-tracking` | `logCall` | ✅ Working |

---

## Backend Module Inventory

### Existing Backend Files

| File | Purpose |
|------|---------|
| `analytics.jsw` | Analytics tracking |
| `bailCalculator.jsw` | Bond fee calculations (NEW) |
| `bailFetcher.jsw` | Bail data fetching |
| `call-tracking.jsw` | Call tracking and analytics |
| `counties-api.web.js` | Counties API web module |
| `counties.js` | County data functions |
| `counties.jsw` | County backend functions |
| `county-generator.jsw` | County page generation |
| `documentUpload.jsw` | Document upload handling |
| `geocoding.jsw` | Geocoding and county detection |
| `googleDriveIntegration.jsw` | Google Drive integration |
| `googleDriveService.jsw` | Google Drive service |
| `http-functions.js` | HTTP API endpoints |
| `integrations.web.js` | External integrations |
| `location-enhanced.jsw` | Enhanced location features |
| `location.jsw` | User location tracking |
| `new-module.web.js` | New module template |
| `notificationService.jsw` | Notification handling |
| `portal-api-client.jsw` | External API client |
| `portal-auth.jsw` | Authentication and authorization |
| `routers.js` | URL routing |
| `routing.jsw` | Phone routing |
| `signNowIntegration.jsw` | SignNow direct integration |
| `signnow-integration.jsw` | SignNow via GAS backend |
| `signnow-webhooks.jsw` | SignNow webhook handlers |
| `signnow-webhooks.web.js` | SignNow webhook web module |
| `wixApi.jsw` | Wix CMS API functions (NEW) |

---

## Data Files

The following data files exist in `/src/backend/data/`:

| File | Purpose |
|------|---------|
| `county-template.json` | Template for county pages |
| `florida-county-boundaries.json` | County boundary data |
| `florida-sheriff-clerk-directory.json` | Sheriff and clerk contact info |
| `phone-registry.json` | Phone number registry |

---

## Required Wix CMS Collections

Based on the code analysis, the following Wix CMS collections are required:

| Collection | Purpose | Used By |
|------------|---------|---------|
| `PendingDocuments` | Stores signing links | `wixApi.jsw` |
| `MemberDocuments` | Stores uploaded IDs | `documentUpload.jsw` |
| `RequiredDocuments` | Tracks required uploads | `wixApi.jsw` |
| `UserLocations` | GPS check-in data | `location.jsw` |
| `PortalUsers` | User profiles and roles | `portal-auth.jsw` |
| `PortalSessions` | Session data | `portal-auth.jsw` |
| `MagicLinks` | Magic link tokens | `portal-auth.jsw` |
| `Counties` | County information | Multiple modules |
| `BookingCache` | Cached booking data | `bailCalculator.jsw` |

---

## Required Wix Secrets

The following secrets should be configured in Wix Secrets Manager:

| Secret Key | Purpose |
|------------|---------|
| `GAS_API_KEY` | API key for GAS backend authentication |
| `GAS_WEB_APP_URL` | Google Apps Script web app URL |
| `GAS_BOOKING_ENDPOINT` | Booking data endpoint |
| `GOOGLE_MAPS_API_KEY` | Google Maps API for geocoding |
| `SIGNNOW_API_TOKEN` | SignNow API token |
| `SIGNNOW_TEMPLATE_ID` | SignNow template ID |

---

## Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Wix Frontend Pages                           │
│  (Home.js, StartBail.js, portal-defendant.js, portal-indemnitor.js) │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Wix Backend Modules (.jsw)                     │
│  portal-auth.jsw │ location.jsw │ wixApi.jsw │ bailCalculator.jsw   │
│  signnow-integration.jsw │ documentUpload.jsw │ portal-api-client   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────────┐   ┌──────────────┐
            │ Wix CMS   │   │ GAS Backend   │   │ External API │
            │Collections│   │ (SignNow Hub) │   │   (Future)   │
            └───────────┘   └───────────────┘   └──────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │   SignNow     │
                            │     API       │
                            └───────────────┘
```

---

## HTTP Functions Endpoints

The following HTTP endpoints are exposed via `http-functions.js`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/_functions/health` | GET | Health check |
| `/_functions/documentsAdd` | POST | Add pending document |
| `/_functions/documentsBatch` | POST | Batch add documents |
| `/_functions/documentsStatus` | POST | Update document status |

---

## Recommendations

### Immediate Actions

1. **Deploy the new files** - Push the new `wixApi.jsw` and `bailCalculator.jsw` files to the Wix site
2. **Verify CMS collections** - Ensure all required collections exist in Wix CMS
3. **Configure secrets** - Add all required secrets to Wix Secrets Manager
4. **Test HTTP endpoints** - Verify the HTTP functions are accessible

### Future Improvements

1. **Add error monitoring** - Implement comprehensive error tracking
2. **Add logging** - Add structured logging for debugging
3. **Add rate limiting** - Protect HTTP endpoints from abuse
4. **Add caching** - Cache frequently accessed data
5. **Add tests** - Implement unit and integration tests

---

## Files Modified/Created

| File | Action |
|------|--------|
| `/src/backend/wixApi.jsw` | CREATED |
| `/src/backend/bailCalculator.jsw` | CREATED |
| `/src/backend/location.jsw` | MODIFIED (added getCurrentLocation) |

---

## Conclusion

The frontend/backend wiring analysis identified three critical issues that have been resolved:

1. Missing `wixApi.jsw` module - Created with full implementation
2. Missing `bailCalculator.jsw` module - Created with full implementation
3. Missing `getCurrentLocation` function - Added to `location.jsw`

All other imports and exports have been verified as correctly wired. The portal should now have all necessary backend functions available for the frontend to consume.
