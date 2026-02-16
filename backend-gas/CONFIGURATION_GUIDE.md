# Shamrock Bail Bonds - Complete Configuration Guide

This guide walks you through the final configuration steps to complete the SignNow + Wix portal integration.

---

## Overview

The integration connects three systems:
1. **Dashboard.html (GAS)** - Your control center for generating bail bond packets
2. **SignNow** - Document signing service
3. **Wix Portal (shamrockbailbonds.biz)** - Client-facing portal where defendants/indemnitors can view and sign documents

---

## Step 0: Master Configuration (One-Click Setup)

We have consolidated all configuration into a single file: `Setup_Properties.js`.

1.  Open `backend-gas/Setup_Properties.js` in the GAS Editor.
2.  Paste your keys (OpenAI, Grok, Twilio, SignNow, etc.) into the `MASTER_CONFIG` object.
3.  Run `RUN_UpdateAllProperties()` from the toolbar.

This replaces all previous "Bulk Update" or "Set Properties" scripts.

---

## Step 1: Add GAS Files to Your Project

### Files to Add

In your Google Apps Script project, add these new files:

| File | Purpose |
|------|---------|
| `EmbeddedSigningLinks.gs` | Creates embedded signing links with redirect support |
| `WixPortalIntegration.gs` | Saves signing links to Wix CMS |
| `SignNow_Integration_Complete.gs` | Multi-signer workflow (already in signnow_integration folder) |

### How to Add

1. Open your GAS project: https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit
2. Click **+** next to "Files"
3. Select "Script"
4. Name it (e.g., `EmbeddedSigningLinks`)
5. Paste the contents from the GitHub repo
6. Repeat for each file
7. Click **Save**

---

## Step 2: Verify Your Existing Script Properties

### Properties You Already Have (DO NOT CHANGE)

Your GAS project already has these properties configured:

| Property | Your Value | Description |
|----------|------------|-------------|
| `SIGNNOW_ACCESS_TOKEN` | `0c35edbbf6823555a8434624aaec4830fd44...` | SignNow API token |
| `SIGNNOW_API_BASE_URL` | `https://api.signnow.com` | SignNow API base URL |
| `SIGNNOW_SENDER_EMAIL` | `admin@shamrockbailbonds.biz` | Email shown as sender |
| `SIGNNOW_MASTER_TEMPLATE_ID` | `e01325b536d34f718f707cfb5f63f4e202013` | Master template ID |
| `GOOGLE_DRIVE_FOLDER_ID` | `1ovsOYPDHuT7Sr9W6S5zQQpzhPsyf6tHR` | Input folder |
| `GOOGLE_DRIVE_OUTPUT_FOLDER_ID` | `1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3` | Completed bonds folder |
| `REDIRECT_URL` | `https://www.shamrockbailbonds.biz` | Redirect after signing |

### Property to DELETE

| Property | Action |
|----------|--------|
| `SIGNNOW_API_TOKEN` | **DELETE** - Duplicate of SIGNNOW_ACCESS_TOKEN |

### Property to ADD

| Property | Value | Description |
|----------|-------|-------------|
| `WIX_API_KEY` | (generate below) | Authenticates GAS → Wix API calls |

### Generate WIX_API_KEY

Run this function in GAS to generate a secure API key:

```javascript
function generateWixApiKey() {
  const key = Utilities.getUuid() + '-' + Utilities.getUuid();
  console.log('Your WIX_API_KEY:', key);
  console.log('Save this in both GAS Script Properties AND Wix Secrets Manager');
  return key;
}
```

---

## Step 3: Configure Wix Secrets Manager

### Add These Secrets

In Wix: **Dashboard** → **Developer Tools** → **Secrets Manager** → **+ New Secret**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GAS_API_KEY` | (same as WIX_API_KEY above) | Must match the GAS property |
| `GAS_WEBHOOK_URL` | (your GAS web app URL) | For syncing uploads to Drive |

### Get Your GAS Web App URL

1. In GAS, click **Deploy** → **New deployment**
2. Select **Web app**
3. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the Web app URL
6. Add it to Wix Secrets Manager as `GAS_WEBHOOK_URL`

---

## Step 4: Register SignNow Webhook

### Create Webhook in SignNow

1. Go to SignNow Dashboard: https://app.signnow.com
2. Navigate to **API** → **Webhooks** (or Settings → Integrations)
3. Click **Add Webhook**
4. Configure:
   - **URL:** `https://www.shamrockbailbonds.biz/_functions/webhookSignnow`
   - **Event:** `document.complete`
   - **Active:** Yes
5. Save

This webhook notifies your Wix site when documents are fully signed, triggering:
- Status update in PendingDocuments collection
- Auto-save of completed PDF to Google Drive

---

## Step 5: Update Dashboard.html

### Option A: Add Integration Module (Recommended)

Add this script tag before `</body>` in Dashboard.html:

```html
<script>
// Include the contents of Dashboard_WixIntegration.js here
// Or load it dynamically
</script>
```

### Option B: Replace generateAndSend Function

Replace the existing `generateAndSend()` function with `generateAndSendWithWixPortal()` from the integration module.

### Option C: Add a Toggle

Add a checkbox to Dashboard.html to enable/disable portal integration:

```html
<label class="checkbox-label">
    <input type="checkbox" id="enable-wix-portal" checked>
    Save to Client Portal
</label>
```

---

## Step 6: Sync Wix Site with GitHub

Your Wix site should auto-sync with the `shamrock-bail-portal-site` GitHub repo. If not:

1. Go to Wix Editor
2. Click **Dev Mode** → **Turn on Dev Mode**
3. Click the Git icon in the left panel
4. Click **Pull** to get the latest changes

---

## Step 7: Test the Integration

### Test Checklist

- [ ] **Generate a test packet** from Dashboard.html
- [ ] **Check Wix CMS** - Verify the signing link appears in PendingDocuments
- [ ] **Log in as a test member** on shamrockbailbonds.biz
- [ ] **Verify pending documents appear** in the member portal
- [ ] **Click to sign** - Verify SignNow overlay opens
- [ ] **Complete signing** - Verify redirect to homepage
- [ ] **Check document status** - Should update to "signed"
- [ ] **Check Google Drive** - Completed PDF should be saved
- [ ] **Test ID upload** - Upload a test ID and verify GPS capture

### Test Member Account

Create a test member account on your Wix site:
1. Go to shamrockbailbonds.biz
2. Click Login → Sign Up
3. Use a test email you control
4. Verify the account

---

## Troubleshooting

### Signing links not appearing in portal

1. Check browser console for errors
2. Verify `WIX_API_KEY` matches in both GAS and Wix
3. Check that the Wix HTTP functions are deployed

### Webhook not triggering

1. Verify webhook URL is correct in SignNow
2. Check Wix site logs for incoming requests
3. Test the webhook endpoint manually:
   ```bash
   curl -X POST https://www.shamrockbailbonds.biz/_functions/webhookSignnow \
     -H "Content-Type: application/json" \
     -d '{"event":"document.complete","document_id":"test123"}'
   ```

### Documents not saving to Google Drive

1. Check GAS execution logs
2. Verify `COMPLETED_BONDS_FOLDER_ID` is set correctly
3. Ensure the GAS service account has Drive access

### ID upload not working

1. Check that MemberDocuments collection exists
2. Verify member is logged in
3. Check browser console for upload errors

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     STAFF WORKFLOW                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Sheriff Site │───▶│ Dashboard.html│───▶│   SignNow    │       │
│  │  (Booking)   │    │  (GAS/Sheets) │    │   (API)      │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│    Bookmarklet         Fill PDFs          Create Invites        │
│    scrapes data        Add fields         Generate Links        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WIX PORTAL (shamrockbailbonds.biz)           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Pending Docs │    │  Member Page │    │  ID Upload   │       │
│  │  Collection  │◀──▶│   (Portal)   │───▶│  + GPS Meta  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│    Stores links        Shows docs           Captures ID         │
│    from GAS           to signers           with location        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT WORKFLOW                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  SMS/Email   │───▶│  Wix Portal  │───▶│   SignNow    │       │
│  │ Notification │    │   (Login)    │    │  (Signing)   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│   Receives link       Views pending         Signs docs          │
│   to portal          documents             in overlay           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETION                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Webhook    │───▶│ Google Drive │    │ Status Update│       │
│  │  (SignNow)   │    │   (Save)     │    │   (Wix CMS)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│   Triggers on          Saves signed        Updates to           │
│   completion           PDF + IDs           "signed"             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Support

For questions about this integration:
- **SignNow API:** https://docs.signnow.com
- **Wix Velo:** https://www.wix.com/velo/reference
- **Google Apps Script:** https://developers.google.com/apps-script
