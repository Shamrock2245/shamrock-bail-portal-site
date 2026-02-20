# SignNow API Test Results

**Date:** February 3, 2026  
**Test Status:** ✅ **SUCCESS**

---

## API Connection Test

**Endpoint:** `GET https://api.signnow.com/user`  
**Authorization:** Bearer API Key  
**Result:** ✅ **200 OK**

### Account Information Retrieved

```json
{
  "id": "22121bf4f6bb4682aeb53f963df5098c2b442ac1",
  "first_name": "Shamrock",
  "last_name": "Bail Bonds",
  "email": "admin@shamrockbailbonds.biz",
  "active": true,
  "verified": true,
  "type": "business"
}
```

### Organization Details

**Organization Name:** Shamrock Bail Bonds  
**Organization ID:** `f9afd5c65e814fe4b7c67c03ecd2fe438080c41f`  
**Workspace:** Yes (Teams enabled)  
**Admin Status:** Superadmin  
**Logo:** Active (uploaded 2024-08-07)

### Key Features Enabled

- ✅ Document signing
- ✅ Embedded editor
- ✅ Embedded signing
- ✅ Branding/white-labeling
- ✅ Team collaboration
- ✅ AI chat assistant
- ✅ Payment collection
- ✅ Cloud export
- ✅ Document max pages: 500

### Monthly Usage

**Documents this month:** 0  
**Status:** Active, no issues

---

## Next Steps

### 1. Configure Webhooks in SignNow Dashboard

**Required Webhooks:**

#### A. Document Complete Webhook (CRITICAL)
```bash
curl --request POST \
  --url https://api.signnow.com/v2/event-subscriptions \
  --header 'Authorization: Bearer REDACTED_SIGNNOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "event": "document.complete",
    "callback_url": "https://www.shamrockbailbonds.biz/_functions/webhookSignnow",
    "secret_key": "REDACTED_SIGNNOW_WEBHOOK_SECRET",
    "attributes": {
      "document_id": true,
      "document_name": true,
      "user_id": true
    }
  }'
```

#### B. Document Signed Webhook
```bash
curl --request POST \
  --url https://api.signnow.com/v2/event-subscriptions \
  --header 'Authorization: Bearer REDACTED_SIGNNOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "event": "document.signed",
    "callback_url": "https://www.shamrockbailbonds.biz/_functions/webhookSignnow",
    "secret_key": "REDACTED_SIGNNOW_WEBHOOK_SECRET"
  }'
```

#### C. Document Declined Webhook
```bash
curl --request POST \
  --url https://api.signnow.com/v2/event-subscriptions \
  --header 'Authorization: Bearer REDACTED_SIGNNOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "event": "document.declined",
    "callback_url": "https://www.shamrockbailbonds.biz/_functions/webhookSignnow",
    "secret_key": "REDACTED_SIGNNOW_WEBHOOK_SECRET"
  }'
```

### 2. Update Wix Secrets Manager

**Action Required:** Add these secrets in Wix Editor

1. **SIGNNOW_API_KEY**
   ```
   REDACTED_SIGNNOW_API_KEY
   ```

2. **SIGNNOW_WEBHOOK_SECRET**
   ```
   REDACTED_SIGNNOW_WEBHOOK_SECRET
   ```

### 3. Run GAS Setup Function

**Action Required:** Open Google Apps Script Editor

1. Open `SetProperties.js`
2. Run function: `ADMIN_UpdateAllProperties()`
3. Check execution log for confirmation
4. Verify all SignNow properties are set

### 4. Test Webhook Delivery

1. Create a test document in SignNow
2. Send for signature to a test email
3. Complete the signature
4. Check Wix Site Monitoring for webhook delivery
5. Verify document downloads and saves to Google Drive

---

## Verification Checklist

### API Connection
- [x] API key authenticates successfully
- [x] User account information retrieved
- [x] Organization details confirmed
- [ ] GAS Script Properties updated
- [ ] Wix Secrets Manager updated

### Webhook Configuration
- [ ] Webhooks created in SignNow dashboard
- [ ] Webhook secret matches in both systems
- [ ] Test document triggers webhook
- [ ] Webhook signature verification passes
- [ ] Document completion handler executes

### Business Logic
- [ ] Signed document downloads successfully
- [ ] Document saves to Google Drive
- [ ] Case status updates in CMS
- [ ] Email notifications sent
- [ ] Slack notifications sent (if configured)

---

## API Endpoints Available

Based on the account configuration, these endpoints are available:

### Document Operations
- `POST /document` - Upload document
- `GET /document/{id}` - Get document details
- `GET /document/{id}/download` - Download signed document
- `DELETE /document/{id}` - Delete document

### Signing Operations
- `POST /document/{id}/invite` - Send signing invite
- `POST /document/{id}/fieldinvite` - Send field invite
- `GET /document/{id}/signing-links` - Get signing links

### Embedded Operations
- `POST /link` - Create embedded signing link
- `POST /document/{id}/embedded-invite` - Create embedded invite

### Webhook Operations
- `GET /v2/event-subscriptions` - List webhooks
- `POST /v2/event-subscriptions` - Create webhook
- `DELETE /v2/event-subscriptions/{id}` - Delete webhook

---

## Success! 🎉

The SignNow API connection is working correctly. The account is active, verified, and ready for production use.

**Organization:** Shamrock Bail Bonds  
**Admin:** admin@shamrockbailbonds.biz  
**Status:** ✅ Active and Verified
