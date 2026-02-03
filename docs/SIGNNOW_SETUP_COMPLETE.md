# SignNow API & Webhook Setup Guide

**Date:** February 3, 2026  
**Status:** Credentials Updated - Ready for Testing

---

## ✅ Credentials Updated

### Google Apps Script (GAS)
**File:** `backend-gas/SetProperties.js`

Updated the following properties:
```javascript
'SIGNNOW_API_KEY': 'd7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4'
'SIGNNOW_API_TOKEN': 'd7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4'
'SIGNNOW_WEBHOOK_SECRET': 'b4633bfe7f90483abcf4801620aedc59'
'SIGNNOW_CLIENT_ID': '3b4dd51e0a07557e5b0e6b42415759db'
'SIGNNOW_BASIC_TOKEN': 'M2I0ZGQ1MWUwYTA3NTU3ZTViMGU2YjQyNDE1NzU5ZGI6YjQ2MzNiZmU3ZjkwNDgzYWJjZjQ4MDE2MjBhZWRjNTk='
```

**Action Required:** Run `ADMIN_UpdateAllProperties()` in Apps Script Editor to apply changes.

### Wix Secrets Manager
**Required Secrets:**

1. **SIGNNOW_API_KEY**
   - Value: `d7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4`
   - Usage: Primary authentication for all SignNow API calls

2. **SIGNNOW_WEBHOOK_SECRET**
   - Value: `b4633bfe7f90483abcf4801620aedc59`
   - Usage: HMAC signature verification for incoming webhooks

**Action Required:** Add these secrets in Wix Editor → Settings → Secrets Manager

---

## 🔐 Authentication Method

Based on SignNow documentation, we're using **API Key authentication** (simplest method):

```bash
Authorization: Bearer d7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4
```

This is the recommended method for server-to-server communication and works for all API operations.

---

## 📡 Webhook Configuration

### Current Implementation

**Wix Backend:** `src/backend/signnow-webhooks.jsw`
- ✅ HMAC-SHA256 signature verification implemented
- ✅ Uses `SIGNNOW_WEBHOOK_SECRET` from Wix Secrets
- ✅ Handles document completion, signing, decline, expiration events

**GAS Backend:** `backend-gas/SOC2_WebhookHandler.js`
- ✅ HMAC-SHA256 signature verification implemented
- ✅ Uses `SIGNNOW_WEBHOOK_SECRET` from Script Properties
- ✅ Routes to `handleDocumentComplete()` for business logic

### Webhook Endpoints

**Wix Endpoint:**
```
POST https://www.shamrockbailbonds.biz/_functions/webhookSignnow
```

**GAS Endpoint:**
```
POST https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?source=signnow
```

### Webhook Events to Subscribe To

1. **document.complete** - All signatures collected (CRITICAL)
2. **document.signed** - Individual signature added
3. **document.declined** - Signer declined to sign
4. **document.expired** - Document signing link expired

---

## 🔧 Setup Steps

### Step 1: Update GAS Properties

1. Open Google Apps Script Editor
2. Open `SetProperties.js`
3. Run function: `ADMIN_UpdateAllProperties()`
4. Check execution log for confirmation

### Step 2: Update Wix Secrets

1. Open Wix Editor
2. Go to **Settings** → **Secrets Manager**
3. Add/Update:
   - `SIGNNOW_API_KEY` = `d7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4`
   - `SIGNNOW_WEBHOOK_SECRET` = `b4633bfe7f90483abcf4801620aedc59`
4. Save changes

### Step 3: Configure Webhooks in SignNow Dashboard

1. Log in to SignNow: https://app.signnow.com
   - Email: `admin@shamrockbailbonds.biz`
   - Password: `WTFlorida1520!`

2. Go to **API Dashboard** → **Webhooks**

3. Create webhook subscription:
   ```bash
   curl --request POST \
     --url https://api.signnow.com/v2/event-subscriptions \
     --header 'Authorization: Bearer d7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4' \
     --header 'Content-Type: application/json' \
     --data '{
       "event": "document.complete",
       "callback_url": "https://www.shamrockbailbonds.biz/_functions/webhookSignnow",
       "secret_key": "b4633bfe7f90483abcf4801620aedc59"
     }'
   ```

4. Repeat for other events (document.signed, document.declined, document.expired)

### Step 4: Test API Connection

Run this test from command line or Postman:

```bash
curl --request GET \
  --url https://api.signnow.com/user \
  --header 'Authorization: Bearer d7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4'
```

**Expected Response:**
```json
{
  "id": "...",
  "email": "admin@shamrockbailbonds.biz",
  "first_name": "...",
  "last_name": "..."
}
```

### Step 5: Test Webhook Delivery

1. Create a test document in SignNow
2. Send for signature
3. Complete the signature
4. Check Wix Site Monitoring for webhook delivery
5. Check GAS execution logs for webhook processing

---

## 🔍 Verification Checklist

### API Connection
- [ ] GAS Script Properties updated
- [ ] Wix Secrets Manager updated
- [ ] Test API call returns user info
- [ ] No 401 Unauthorized errors

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

## 🐛 Troubleshooting

### API Calls Failing (401 Unauthorized)
**Cause:** Invalid or expired API key  
**Fix:** Verify API key is correct in both GAS and Wix Secrets

### Webhooks Not Received
**Cause:** Webhook not configured in SignNow dashboard  
**Fix:** Create webhook subscription using the curl command above

### Webhook Signature Verification Failing
**Cause:** Webhook secret mismatch  
**Fix:** Ensure `SIGNNOW_WEBHOOK_SECRET` matches in:
- SignNow webhook configuration
- Wix Secrets Manager
- GAS Script Properties

### Document Not Downloading
**Cause:** Missing permissions or invalid document ID  
**Fix:** Check API key has document download permissions

---

## 📚 Reference Documentation

- **SignNow API Docs:** https://docs.signnow.com/docs/signnow/authentication
- **Webhook Guide:** https://docs.signnow.com/docs/signnow/manage-event-subscriptions
- **API Dashboard:** https://app.signnow.com/api/

---

## 🔐 Security Notes

1. **Never commit credentials to Git** - Use Secrets Manager and Script Properties
2. **Always verify webhook signatures** - Prevents unauthorized webhook spoofing
3. **Use HTTPS only** - All webhook endpoints must use HTTPS
4. **Rotate keys periodically** - Update API keys every 90 days
5. **Monitor failed webhooks** - Check SignNow dashboard for delivery failures

---

## 📝 Next Steps

1. **Deploy GAS changes** - Push updated SetProperties.js and run setup function
2. **Update Wix Secrets** - Add SIGNNOW_API_KEY and SIGNNOW_WEBHOOK_SECRET
3. **Configure webhooks** - Create webhook subscriptions in SignNow dashboard
4. **Test end-to-end** - Create test document, sign, verify webhook delivery
5. **Monitor production** - Check Wix Site Monitoring and GAS logs for errors

---

## 🎯 Success Criteria

✅ API calls authenticate successfully  
✅ Webhooks deliver to both Wix and GAS endpoints  
✅ Signature verification passes  
✅ Signed documents download and save to Drive  
✅ Case status updates automatically  
✅ Notifications sent to staff

---

## 📞 Support

**SignNow Support:** https://help.signnow.com  
**API Status:** https://status.signnow.com  
**Account Email:** admin@shamrockbailbonds.biz
