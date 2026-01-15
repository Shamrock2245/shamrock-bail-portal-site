# SignNow Integration Audit - Shamrock Bail Bonds

## Date: January 15, 2026

---

## Executive Summary

The SignNow integration within the Wix portal is **structurally complete but not fully operational**. The codebase has all the necessary components, but there are critical configuration and deployment gaps that prevent the integration from working.

---

## Architecture Overview

### Current Flow (Intended)

1. **Portal Landing** → User enters with magic link token
2. **Authentication** → Custom session created (no Wix Members required)
3. **Defendant Dashboard** → User sees case info, clicks "Sign via Email/Kiosk"
4. **ID Upload Check** → Lightbox prompts for government ID if missing
5. **Consent Check** → Lightbox prompts for consent if missing
6. **SignNow Handoff** → `createEmbeddedLink()` called → Opens SigningLightbox with iframe
7. **Webhook Callback** → SignNow notifies Wix when document is signed
8. **Google Drive Upload** → Completed documents uploaded via GAS backend

### Key Files

| File | Purpose | Status |
|------|---------|--------|
| `signnow-integration.jsw` | Core SignNow API wrapper | ✅ Complete |
| `signing-methods.jsw` | Email/SMS/Kiosk/Print methods | ✅ Complete |
| `signnow-webhooks.web.js` | Webhook handler | ✅ Complete |
| `SigningLightbox.js` | Embedded signing UI | ✅ Complete |
| `portal-defendant.skg9y.js` | Defendant dashboard | ✅ Complete |
| `portal-auth.jsw` | Custom session auth | ✅ Complete |
| `utils.jsw` | GAS URL helper | ✅ Complete |

---

## Critical Blockers Identified

### 1. **GAS Backend Missing SignNow Actions**

The Wix portal calls `callGasBackend()` with actions like:
- `sendForSignature`
- `createEmbeddedLink`
- `getDocumentStatus`
- `generatePDFs`

**PROBLEM:** The current `Code.gs` in `shamrock-automations` repo only handles form submissions to Google Sheets. It does NOT have:
- SignNow API integration
- `handlePost()` function to route actions
- Token management for SignNow OAuth

**FIX REQUIRED:** Add SignNow API handlers to GAS backend

### 2. **Wix Secrets Not Configured**

The code references these secrets that must be set in Wix Secrets Manager:
- `GAS_WEB_APP_URL` - Google Apps Script web app URL
- `SIGNNOW_API_TOKEN` - SignNow access token
- `SIGNNOW_WEBHOOK_SECRET` - For webhook verification
- `SLACK_WEBHOOK_URL` - For notifications (optional)

**FIX REQUIRED:** Configure all secrets in Wix dashboard

### 3. **SignNow OAuth Token Management**

SignNow access tokens expire. The current code assumes a static token stored in secrets.

**FIX REQUIRED:** Implement token refresh logic or use long-lived API keys

### 4. **Backend Code Not Deployed to Wix**

The `.jsw` files exist in GitHub but may not be deployed to the live Wix site.

**FIX REQUIRED:** Deploy backend modules via Wix CLI or manual copy

### 5. **Webhook URL Not Registered with SignNow**

SignNow needs to know where to send webhook events.

**FIX REQUIRED:** Register `https://shamrockbailbonds.biz/_functions/signnowWebhook` in SignNow dashboard

---

## Quick Fixes (Priority Order)

### Priority 1: Configure Wix Secrets (30 min)
1. Log into Wix Dashboard
2. Go to Developer Tools → Secrets Manager
3. Add:
   - `GAS_WEB_APP_URL`: Your deployed GAS web app URL
   - `SIGNNOW_API_TOKEN`: Your SignNow API token

### Priority 2: Deploy Backend Code (1-2 hours)
1. Use Wix CLI: `wix sync` from repo root
2. OR manually copy each `.jsw` file to Wix Editor

### Priority 3: Create GAS SignNow Handler (2-4 hours)
Add to Code.gs:
```javascript
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  switch(payload.action) {
    case 'createEmbeddedLink':
      return createSignNowEmbeddedLink(payload);
    case 'sendForSignature':
      return sendSignNowDocument(payload);
    // ... etc
  }
}
```

### Priority 4: Register SignNow Webhook (15 min)
1. Log into SignNow dashboard
2. Go to API Settings → Webhooks
3. Add endpoint: `https://shamrockbailbonds.biz/_functions/signnowWebhook`
4. Select events: document.sign, document.complete

### Priority 5: Test End-to-End (1-2 hours)
1. Create test magic link
2. Log in as defendant
3. Click "Sign via Email"
4. Verify SignNow link opens
5. Sign document
6. Verify webhook received

---

## Code Issues Found

### Issue 1: `createEmbeddedLink` Response Mismatch

In `signnow-integration.jsw`:
```javascript
export async function createEmbeddedLink(documentId, email, role) {
    return await callGasBackend({
        action: 'createEmbeddedLink',
        documentId,
        signerEmail: email,
        signerRole: role,
        linkExpiration: 60
    });
}
```

In `portal-defendant.skg9y.js`:
```javascript
const result = await createEmbeddedLink(caseId, userEmail, 'defendant');
if (result.success) {
    LightboxController.show('signing', {
        signingUrl: result.embeddedLink,  // <-- expects 'embeddedLink'
        documentId: result.documentId
    });
}
```

**MISMATCH:** The function expects `result.embeddedLink` but the backend might return `result.link` or `result.links[0]`.

**FIX:** Normalize response in `signnow-integration.jsw`

### Issue 2: Consent Check Always Returns False

In `portal-defendant.skg9y.js`:
```javascript
async function checkConsentStatus(personId) {
    try {
        // TODO: Check consent in PortalUsers or custom collection
        // For now, return false to trigger consent flow
        return false;
    } catch (e) {
        return false;
    }
}
```

**PROBLEM:** This forces consent lightbox every time.

**FIX:** Implement actual consent check against collection

### Issue 3: Download Feature Not Implemented

```javascript
async function handleDownloadPaperwork() {
    // TODO: Implement PDF generation and download
    alert('Download feature coming soon!');
}
```

**FIX:** Implement PDF generation via GAS backend

---

## Wix Collections Required

Ensure these collections exist with correct schema:

| Collection | Required Fields |
|------------|-----------------|
| `PendingDocuments` | documentId, signerEmail, signingLink, status, expiresAt |
| `SigningSessions` | caseId, method, status, createdAt |
| `SignatureEvents` | caseId, method, result, eventTime |
| `PortalSessions` | token, personId, role, expiresAt |
| `MagicLinks` | token, personId, role, expiresAt, used |
| `Cases` | caseNumber, defendantEmail, bondAmount, status |

---

## Recommended Action Plan

### Day 1 (4-6 hours)
1. ✅ Configure Wix Secrets
2. ✅ Deploy backend code to Wix
3. ✅ Verify collections exist

### Day 2 (4-6 hours)
1. ✅ Create/update GAS backend with SignNow handlers
2. ✅ Deploy GAS web app
3. ✅ Register webhook with SignNow

### Day 3 (2-4 hours)
1. ✅ Test full flow with real SignNow account
2. ✅ Fix any response format mismatches
3. ✅ Implement consent check

---

## Files Modified During Audit

None yet - awaiting approval to make fixes.

---

## Next Steps

1. Confirm SignNow API credentials are available
2. Confirm GAS project access for adding SignNow handlers
3. Proceed with fixes in priority order
