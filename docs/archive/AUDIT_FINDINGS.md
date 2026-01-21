# Shamrock Bail Bonds - Code Audit Findings & Changes

## Date: January 16, 2026

---

## 1. CHANGES COMPLETED

### Files Deleted
- ✅ `src/backend/googleDriveIntegration.jsw` - Obsolete, replaced by googleDriveService.jsw

### Files Updated
- ✅ `src/lightboxes/DefendantDetails.js` - Removed mock data, now uses real case data
- ✅ `src/backend/signing-methods.jsw` - Added direct Twilio SMS integration
- ✅ `src/backend/http-functions.js` - Added SMS API endpoints for GAS

---

## 2. NEW API ENDPOINTS ADDED

### POST /_functions/sms/send
Allows GAS to send SMS via Wix's Twilio integration.
```json
{
  "apiKey": "your-api-key",
  "to": "2395551234",
  "body": "Your message here"
}
```

### POST /_functions/sms/signing-link
Convenience endpoint to send signing links via SMS.
```json
{
  "apiKey": "your-api-key",
  "phone": "2395551234",
  "signingLink": "https://app.signnow.com/...",
  "recipientType": "defendant"
}
```

---

## 3. INTEGRATION FLOW (COMPLETE)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SHAMROCK AUTOMATION FACTORY                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. SCRAPER → GAS DASHBOARD                                             │
│     • Bookmarklet triggers swfl-arrest-scrapers                         │
│     • Data pushed to Dashboard.html (34-column schema)                  │
│                                                                          │
│  2. GAS DASHBOARD → PAPERWORK                                           │
│     • Manual input: Indemnitor name, demographics, references           │
│     • "Generate Packet" creates 20+ page packet                         │
│     • Documents uploaded to SignNow                                      │
│                                                                          │
│  3. GAS → WIX (Data Sync)                                               │
│     • POST /api/syncCaseData - Syncs case to Wix CMS                   │
│     • POST /api/documents/add - Registers pending documents             │
│                                                                          │
│  4. WIX PORTAL → SIGNING                                                │
│     • Staff selects signing method (Email/SMS/Kiosk)                    │
│     • Email: SignNow sends email directly                               │
│     • SMS: Wix sends via Twilio (credentials in Wix Secrets)           │
│     • Kiosk: Embedded signing in lightbox                               │
│                                                                          │
│  5. SIGNNOW → WIX (Webhook)                                             │
│     • POST /api/webhook/signnow - Document completion                   │
│     • Updates case status to "Signed"                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. SECRETS REQUIRED IN WIX

| Secret Name | Status | Purpose |
|-------------|--------|---------|
| TWILIO_ACCOUNT_SID | ✅ CONFIGURED | Twilio API authentication |
| TWILIO_AUTH_TOKEN | ✅ CONFIGURED | Twilio API authentication |
| TWILIO_PHONE_NUMBER | ✅ EXISTS | +17272952245 |
| GAS_WEB_APP_URL | ⚠️ VERIFY | GAS backend URL |
| GAS_API_KEY | ⚠️ VERIFY | API key for GAS calls |
| SIGNNOW_API_TOKEN | ⚠️ VERIFY | SignNow API access |

---

## 5. SMS FLOW ARCHITECTURE

### Option A: Wix-Initiated SMS (RECOMMENDED)
```
Staff Portal → signing-methods.jsw → twilio-client.jsw → Twilio API
```
- Twilio credentials stay in Wix Secrets
- Full control over message content
- Works with any signing link

### Option B: GAS-Initiated SMS (via Wix API)
```
GAS Dashboard → POST /api/sms/send → Wix → twilio-client.jsw → Twilio API
```
- GAS can trigger SMS without storing Twilio credentials
- Requires GAS_API_KEY for authentication
- Useful for automated notifications

---

## 6. REMAINING VERIFICATION NEEDED

1. **Wix Secrets Manager** - Verify all secrets are properly set:
   - GAS_WEB_APP_URL
   - GAS_API_KEY
   - SIGNNOW_API_TOKEN

2. **GAS Script Properties** - Verify these are set:
   - SIGNNOW_API_TOKEN
   - WIX_API_URL (for calling back to Wix)
   - WIX_API_KEY (same as GAS_API_KEY)

3. **SignNow Webhook** - Ensure webhook is registered:
   - URL: https://www.shamrockbailbonds.biz/_functions/webhook/signnow
   - Events: document.complete

---

## 7. TESTING CHECKLIST

- [ ] Send test SMS from Staff Portal
- [ ] Generate packet from GAS Dashboard
- [ ] Verify case syncs to Wix CMS
- [ ] Test email signing flow
- [ ] Test SMS signing flow
- [ ] Test kiosk signing flow
- [ ] Verify webhook receives completion events

