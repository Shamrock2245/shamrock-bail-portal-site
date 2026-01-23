# Shamrock Bail Bonds - SignNow + Wix Integration Summary

## Overview

This document summarizes the complete integration between your Dashboard.html/GAS workflow, SignNow for document signing, and your Wix site (shamrockbailbonds.biz) for the client portal.

---

## What Was Built

### 1. Wix CMS Collections (Created via API)

| Collection | Purpose | Permissions |
|------------|---------|-------------|
| **FloridaCounties** | All 67 Florida counties with Sheriff/Clerk info | Public read |
| **PendingDocuments** | Stores signing links for clients to access | Member read, Admin write |
| **MemberDocuments** | Stores uploaded IDs and supporting documents | Member read/write, Admin manage |
| **RequiredDocuments** | Tracks what documents each member needs to upload | Member read, Admin write |

### 2. SignNow Custom Embed (Added to Wix Site)

**Embed ID:** `77d9a4df-8cab-42ec-9b1f-758074db7dff`

Features:
- Full-screen signing overlay with Shamrock branding
- Automatic detection of signing links via URL parameters
- Redirect to shamrockbailbonds.biz after signing
- Global `ShamrockSignNow.openSigningLink(url)` function

### 3. Wix Portal Code (shamrock-bail-portal repo)

**Files Created:**

```
src/
├── pages/
│   ├── Custom Member Page.fz49n.js     # Main member portal with pending docs
│   └── Custom Member Page.idUpload.js  # ID and document upload module
├── backend/
│   ├── location.jsw          # GPS location tracking
│   ├── wixApi.jsw            # API for receiving data from GAS
│   ├── documentUpload.jsw    # ID and document upload to Drive
│   └── http-functions.js     # HTTP endpoints for GAS integration
```

### 4. GAS Integration Code (swfl-arrest-scrapers repo)

**Files Created:**

```
apps_script/
├── signnow_integration/
│   ├── SignNow_Integration_Complete.gs  # Multi-signer embedded signing
│   └── IMPLEMENTATION_GUIDE.md          # Setup instructions
└── WixPortalIntegration.gs              # Saves signing links to Wix
```

---

## The Complete Workflow

### Step 1: Data Entry (Dashboard.html)
1. You fill in defendant + indemnitor information
2. Add multiple indemnitors using the existing "+ Add Indemnitor" button
3. Select which documents to include via checkboxes
4. Click "Generate & Send"

### Step 2: Document Generation (GAS)
1. `generateAndSendWithWixPortal()` is called
2. SignNow creates the document packet with all fields
3. Embedded signing links are generated for each signer
4. Links are saved to Wix `PendingDocuments` collection
5. SMS/Email notifications are sent to signers

### Step 3: Client Signs (Wix Portal)
1. Client receives SMS/email with link
2. Client clicks link → goes to shamrockbailbonds.biz
3. SignNow overlay opens automatically
4. Client signs all documents
5. Redirected to homepage with success message

### Step 4: ID Upload (Member Portal)
1. After signing, client logs into their account
2. Sees "ID Required" prompt
3. Uploads front/back of government ID
4. GPS coordinates and metadata are captured
5. ID is saved to Wix Media and synced to Google Drive

### Step 5: Completion (Automatic)
1. SignNow webhook notifies GAS when all signatures complete
2. Document status updated to "signed" in Wix
3. Completed PDF saved to Google Drive folder:
   `Completed Bonds/{Defendant Name} - {Date}/`
4. ID photos saved to same folder

---

## Configuration Required

### 1. Wix Secrets Manager
Add these secrets in Wix Dashboard → Developer Tools → Secrets Manager:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `GAS_API_KEY` | (generate with `generateWixApiKey()`) | Authenticates GAS → Wix API calls |
| `GAS_WEBHOOK_URL` | Your GAS web app URL | For syncing uploads to Drive |

### 2. GAS Script Properties
Add these in GAS → Project Settings → Script Properties:

| Property | Value | Purpose |
|----------|-------|---------|
| `WIX_API_KEY` | Same as GAS_API_KEY above | Authenticates GAS → Wix calls |

### 3. SignNow Webhook
Register this webhook in SignNow dashboard:
- **URL:** `https://www.shamrockbailbonds.biz/_functions/webhookSignnow`
- **Event:** `document.complete`

---

## API Endpoints (Wix HTTP Functions)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/_functions/documentsAdd` | POST | Add single pending document |
| `/_functions/documentsBatch` | POST | Add multiple documents at once |
| `/_functions/documentsStatus` | POST | Update document status |
| `/_functions/webhookSignnow` | POST | SignNow completion webhook |
| `/_functions/health` | GET | Health check |

---

## Member Portal Features

### Pending Documents Section
- Shows all documents awaiting signature
- Displays defendant name, case number, role
- Expiration warnings
- "Sign Now" button opens SignNow overlay

### Signed Documents History
- Shows last 10 signed documents
- Date signed, defendant name

### ID Upload Section
- Front and back of ID upload
- GPS coordinates captured automatically
- Preview before submission
- Status indicator (Required → Uploaded → Verified)

### Additional Documents
- Dynamic list of required documents per case
- Upload with metadata tracking
- Status tracking

---

## Files to Add to Your GAS Project

1. **SignNow_Integration_Complete.gs** - Add as new file
2. **WixPortalIntegration.gs** - Add as new file

These work alongside your existing `SignNowAPI.gs` and `Dashboard.html`.

---

## Next Steps

1. **Get new GitHub PAT** with repo access for both repositories
2. **Push code** to GitHub repos
3. **Sync Wix site** with GitHub (it should auto-sync)
4. **Add secrets** to Wix Secrets Manager
5. **Add script properties** to GAS
6. **Register SignNow webhook**
7. **Test the complete flow**

---

## Testing Checklist

- [ ] Generate signing links from Dashboard.html
- [ ] Verify links appear in Wix PendingDocuments collection
- [ ] Client receives SMS/email notification
- [ ] Client can log in and see pending documents
- [ ] SignNow overlay opens and allows signing
- [ ] Redirect to homepage after signing
- [ ] Document status updates to "signed"
- [ ] ID upload works with GPS capture
- [ ] Completed documents save to Google Drive

---

## Support

For questions about this integration:
- **SignNow API:** https://docs.signnow.com
- **Wix Velo:** https://www.wix.com/velo/reference
- **Google Apps Script:** https://developers.google.com/apps-script
