# WhatsApp OTP Authentication - Deployment Guide

**Project:** Shamrock Bail Bonds Portal  
**Feature:** WhatsApp OTP Login (No Twilio Dependency)  
**Date:** February 17, 2026  
**Status:** Ready for Deployment

---

## Overview

This implementation adds **WhatsApp OTP authentication** to the Shamrock Bail Bonds portal while maintaining the existing **email magic link** login. Users can now login using their WhatsApp number by receiving a one-time password directly in WhatsApp.

**Key Benefits:**
- No Twilio A2P registration required
- Direct WhatsApp Cloud API integration
- Secure OTP authentication
- Maintains existing email magic link flow
- AI agent (Manus) updated to use direct WhatsApp API

---

## Architecture

### Authentication Flow Comparison

| Method | Input | Delivery | Verification |
|--------|-------|----------|--------------|
| **Email Magic Link** | Email address | Email | Click link |
| **WhatsApp OTP** | Phone number | WhatsApp message | Enter 6-digit code |

### System Components

**Backend (Google Apps Script):**
- `WhatsApp_CloudAPI.js` - Direct Meta Graph API client
- `WhatsApp_Auth.js` - OTP generation and validation
- `Manus_Brain.js` - Updated to use direct API
- `NotificationService.gs` - Updated to use direct API
- `SOC2_WebhookHandler.js` - Added OTP endpoints

**Frontend (Wix):**
- `whatsapp-auth.jsw` - Backend functions for Wix
- `portal-landing.bagfn.js` - Updated login page
- New UI elements for OTP input

---

## Deployment Steps

### Phase 1: Meta Developer Setup (30-60 minutes)

#### Step 1.1: Create/Configure Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/apps)
2. Click **"Create App"** or select existing app
3. Choose **"Business"** as app type
4. Add **WhatsApp** product to your app

#### Step 1.2: Get Phone Number ID

1. In Meta App Dashboard, go to **WhatsApp > API Setup**
2. Copy the **Phone Number ID** (looks like: `123456789012345`)
3. Save this for later (needed in Script Properties)

#### Step 1.3: Generate Permanent Access Token

1. Go to **Business Settings** (top right menu)
2. Navigate to **Users > System Users**
3. Click **"Add"** to create new system user
4. Name: `shamrock-whatsapp-api`
5. Role: **Admin**
6. Click **"Generate New Token"**
7. Select your app
8. Permissions needed:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
9. Token expiration: **Never**
10. Copy the token (starts with `EAAB...`)
11. **IMPORTANT:** Save this token securely - you can't view it again!

#### Step 1.4: Get Business Account ID

1. In **Business Settings**, go to **Accounts > WhatsApp Accounts**
2. Copy the **WhatsApp Business Account ID** (WABA ID)
3. Save this for later

#### Step 1.5: Get App Secret

1. In Meta App Dashboard, go to **Settings > Basic**
2. Copy the **App Secret** (click "Show" button)
3. Save this for later

---

### Phase 2: Create Authentication Template (1-2 business days approval)

#### Step 2.1: Create Template

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Select your business
3. Navigate to **WhatsApp Manager > Message Templates**
4. Click **"Create Template"**

#### Step 2.2: Template Configuration

**Template Details:**
- **Name:** `shamrock_otp`
- **Category:** Authentication
- **Language:** English (US)

**Template Content** (auto-filled by Meta):
```
Body: *{{1}}* is your verification code. For your security, do not share this code.
Footer: This code expires in 10 minutes.
Button: Copy code (OTP type)
```

**Variable {{1}}:** This will be replaced with the actual OTP code

#### Step 2.3: Submit for Approval

1. Click **"Submit"**
2. Wait for approval (usually 1-2 hours, max 24 hours)
3. You'll receive email notification when approved
4. **IMPORTANT:** You cannot send OTP messages until template is approved!

---

### Phase 3: Configure Google Apps Script (15 minutes)

#### Step 3.1: Upload New Files

1. Open [Google Apps Script Project](https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit)
2. Ensure you're logged in as `admin@shamrockbailbonds.biz`
3. Upload these new files from the repository:
   - `backend-gas/WhatsApp_CloudAPI.js`
   - `backend-gas/WhatsApp_Auth.js`
4. Update these existing files:
   - `backend-gas/Manus_Brain.js`
   - `backend-gas/NotificationService.gs`
   - `backend-gas/SOC2_WebhookHandler.js` (add handlers from `SOC2_WebhookHandler_WhatsAppOTP.js`)

#### Step 3.2: Set Script Properties

1. In GAS Editor, open `Setup_Properties.js`
2. Add these properties to `MASTER_CONFIG`:

```javascript
// [WHATSAPP CLOUD API] - Direct Meta Integration
"WHATSAPP_ACCESS_TOKEN": "EAAB...", // From Step 1.3
"WHATSAPP_PHONE_NUMBER_ID": "123456789012345", // From Step 1.2
"WHATSAPP_BUSINESS_ACCOUNT_ID": "987654321098765", // From Step 1.4
"WHATSAPP_APP_SECRET": "abc123...", // From Step 1.5
"WHATSAPP_VERIFY_TOKEN": "shamrock_webhook_2026", // Create your own secure string
"WHATSAPP_AUTH_TEMPLATE_NAME": "shamrock_otp", // From Step 2.2
```

3. Run function: `RUN_UpdateAllProperties()`
4. Authorize the script if prompted
5. Run function: `AUDIT_CurrentProperties()` to verify

#### Step 3.3: Test WhatsApp Connection

1. In GAS Editor, open `Setup_Properties_WhatsApp.js`
2. Update test phone number in `testWhatsAppConnection()` to your number
3. Run function: `testWhatsAppConnection()`
4. Check execution log for success message
5. Check your WhatsApp for test message

**Expected Result:**
```
✅ WhatsApp Cloud API is configured
Phone Number ID: 123456789012345
Test message result: { success: true, messageId: "wamid.xxx..." }
```

#### Step 3.4: Test OTP Send

1. Update test phone number in `testWhatsAppOTP()`
2. Run function: `testWhatsAppOTP()`
3. Check your WhatsApp for OTP code
4. **NOTE:** This will only work if authentication template is approved!

---

### Phase 4: Configure WhatsApp Webhook (10 minutes)

#### Step 4.1: Get GAS Web App URL

1. In GAS Editor, click **Deploy > New deployment**
2. Type: **Web app**
3. Description: `WhatsApp OTP Integration`
4. Execute as: **Me** (`admin@shamrockbailbonds.biz`)
5. Who has access: **Anyone**
6. Click **Deploy**
7. Copy the **Web App URL** (looks like: `https://script.google.com/macros/s/AKfycbz.../exec`)
8. Save this URL

#### Step 4.2: Configure Webhook in Meta

1. In Meta App Dashboard, go to **WhatsApp > Configuration**
2. Click **"Edit"** next to Webhook
3. **Callback URL:** `{YOUR_WEB_APP_URL}?source=whatsapp`
   - Example: `https://script.google.com/macros/s/AKfycbz.../exec?source=whatsapp`
4. **Verify Token:** Use the value you set in `WHATSAPP_VERIFY_TOKEN` (Step 3.2)
5. Click **"Verify and Save"**

#### Step 4.3: Subscribe to Webhook Events

1. Under **Webhook fields**, click **"Manage"**
2. Subscribe to:
   - ✅ `messages`
   - ✅ `message_status`
3. Click **"Save"**

---

### Phase 5: Update Wix Portal (30 minutes)

#### Step 5.1: Add Backend Module

1. Open Wix Editor for `shamrockbailbonds.biz`
2. Go to **Code Files** (Developer Tools)
3. Create new backend file: `backend/whatsapp-auth.jsw`
4. Copy content from `src/backend/whatsapp-auth.jsw`
5. Save and publish

#### Step 5.2: Store GAS URL in Wix Secrets

1. In Wix Editor, go to **Secrets Manager** (Developer Tools)
2. Add new secret:
   - **Name:** `GAS_WEB_APP_URL`
   - **Value:** Your GAS Web App URL from Step 4.1
3. Save

#### Step 5.3: Update Portal Landing Page

1. Open page: `portal-landing`
2. Add new UI elements (if not already present):
   - **Container:** `#otpInputBox` (hidden by default)
   - **Text Input:** `#otpInput` (placeholder: "Enter 6-digit code")
   - **Button:** `#verifyOtpBtn` (label: "Verify Code")
3. Update page code: `portal-landing.bagfn.js`
   - Replace `handleGetStarted()` with version from `portal-landing-whatsapp-additions.js`
   - Add new functions: `handleEmailMagicLinkFlow()`, `handleWhatsAppOTPFlow()`, `handleVerifyOTP()`
4. Save and publish

#### Step 5.4: Update Page Imports

Ensure these imports are present at the top of `portal-landing.bagfn.js`:

```javascript
import { sendWhatsAppOTP, validateWhatsAppOTP, resendWhatsAppOTP } from 'backend/whatsapp-auth';
```

---

### Phase 6: Testing (30 minutes)

#### Test 1: Email Magic Link (Regression Test)

1. Go to portal landing page: `https://www.shamrockbailbonds.biz/portal-landing`
2. Enter email address: `test@example.com`
3. Click **"Get Started"**
4. Check email for magic link
5. Click link and verify redirect to portal

**Expected:** Email magic link flow still works as before

#### Test 2: WhatsApp OTP (New Feature)

1. Go to portal landing page
2. Enter WhatsApp number: `+1-239-555-0178` (use your actual WhatsApp number)
3. Click **"Get Started"**
4. Verify:
   - ✅ Button changes to "Code Sent! ✓"
   - ✅ Status message: "Check WhatsApp for your verification code"
   - ✅ OTP input box appears
5. Check WhatsApp for message with OTP code
6. Enter 6-digit code in OTP input
7. Click **"Verify Code"**
8. Verify:
   - ✅ Status message: "Login successful! Redirecting..."
   - ✅ Redirected to appropriate portal (indemnitor by default)

#### Test 3: Invalid OTP

1. Request OTP code
2. Enter wrong code (e.g., `000000`)
3. Click **"Verify Code"**
4. Verify:
   - ✅ Error message: "Invalid code. Please try again."
   - ✅ Attempts remaining shown
   - ✅ Input cleared and focused

#### Test 4: Expired OTP

1. Request OTP code
2. Wait 11 minutes (OTP expires after 10 minutes)
3. Enter the expired code
4. Verify:
   - ✅ Error message: "OTP has expired. Please request a new code."

#### Test 5: Resend OTP

1. Request OTP code
2. Wait 30 seconds
3. Click **"Resend Code"** button
4. Verify:
   - ✅ New OTP sent to WhatsApp
   - ✅ Old OTP invalidated

#### Test 6: Rate Limiting

1. Request OTP 3 times in quick succession
2. Try to request 4th time
3. Verify:
   - ✅ Error message: "Too many requests. Please wait 15 minutes..."

#### Test 7: Manus AI Agent (WhatsApp)

1. Send WhatsApp message to `+1-239-955-0178`
2. Message: "Hi, I need help with bail"
3. Verify:
   - ✅ Receive text response from Manus
   - ✅ Receive voice note (if applicable)
4. Check GAS logs for direct API usage (no Twilio)

---

## Troubleshooting

### Issue: "WhatsApp Cloud API not configured"

**Cause:** Missing Script Properties  
**Solution:**
1. Run `AUDIT_CurrentProperties()` in GAS
2. Verify all `WHATSAPP_*` properties are set
3. Re-run `RUN_UpdateAllProperties()`

### Issue: "Template not found" or "Template not approved"

**Cause:** Authentication template not approved yet  
**Solution:**
1. Check template status in Meta Business Manager
2. Wait for approval (can take up to 24 hours)
3. Verify template name matches `WHATSAPP_AUTH_TEMPLATE_NAME`

### Issue: OTP not received

**Possible Causes:**
1. **Phone number format:** Must be E.164 format (e.g., `+12399550178`)
2. **WhatsApp not installed:** User must have WhatsApp on that number
3. **Template not approved:** Check Meta Business Manager
4. **API quota exceeded:** Check Meta App Dashboard for limits

**Solution:**
1. Check GAS execution logs for errors
2. Run `testWhatsAppOTP()` with your number
3. Verify phone number format
4. Check Meta App Dashboard for API errors

### Issue: "Invalid session token" after OTP login

**Cause:** Session creation failed  
**Solution:**
1. Check GAS logs for `createCustomSession()` errors
2. Verify Script Properties has storage space
3. Check Cache Service quota

### Issue: Webhook not receiving messages

**Cause:** Webhook verification failed  
**Solution:**
1. Verify webhook URL includes `?source=whatsapp`
2. Check `WHATSAPP_VERIFY_TOKEN` matches in both GAS and Meta
3. Re-deploy GAS Web App
4. Re-verify webhook in Meta Dashboard

---

## Security Considerations

### OTP Security

- **Expiration:** OTPs expire after 10 minutes
- **Attempts:** Maximum 5 attempts per OTP
- **Rate Limiting:** Maximum 3 OTPs per 15 minutes per phone number
- **Single Use:** OTP is deleted after successful validation
- **No Forwarding:** WhatsApp disables forwarding of authentication messages

### API Security

- **Access Token:** Permanent token stored in Script Properties (encrypted by Google)
- **Webhook Verification:** HMAC-SHA256 signature verification
- **HTTPS Only:** All API calls use HTTPS
- **Error Masking:** Sensitive errors not exposed to frontend

### Session Security

- **Token Generation:** SHA-256 hashed with random salt
- **Expiration:** Sessions expire after 7 days
- **Storage:** Dual storage (Cache + Script Properties)
- **Validation:** Session validated on every portal access

---

## Monitoring and Logging

### Slack Notifications

OTP events are logged to Slack `#alerts` channel:
- 📱 OTP sent to user
- ✅ Successful WhatsApp login
- ❌ Failed validation attempts

### GAS Execution Logs

Monitor these functions in GAS logs:
- `WA_sendOTP()` - OTP generation and sending
- `WA_validateOTP()` - OTP validation
- `WhatsAppCloudAPI._makeRequest()` - API calls

### Wix Console Logs

Monitor browser console on portal-landing page:
- `📱 Detected phone number, sending WhatsApp OTP`
- `✅ OTP validation result`
- `❌ CRITICAL ERROR`

---

## Rollback Plan

If issues arise, you can disable WhatsApp OTP without affecting email magic link:

### Option 1: Frontend Disable (Immediate)

1. In Wix Editor, open `portal-landing.bagfn.js`
2. Comment out the phone detection logic:
```javascript
// const isPhone = /^[\d\s\-\+\(\)]+$/.test(emailOrPhone);
const isPhone = false; // Force email magic link
```
3. Publish

### Option 2: Backend Disable (Complete)

1. In GAS, open `WhatsApp_Auth.js`
2. Add at top of `WA_sendOTP()`:
```javascript
return { success: false, message: 'WhatsApp login temporarily unavailable' };
```
3. Save

### Option 3: Full Rollback

1. Restore previous versions of:
   - `portal-landing.bagfn.js`
   - `Manus_Brain.js`
   - `NotificationService.gs`
2. Remove WhatsApp backend files from Wix
3. Email magic link will continue working

---

## Maintenance

### Monthly Tasks

1. **Check API Quota:** Meta App Dashboard > Analytics
2. **Review Slack Logs:** Check for unusual patterns
3. **Test OTP Flow:** Perform end-to-end test
4. **Verify Template Status:** Ensure template still approved

### Quarterly Tasks

1. **Rotate Access Token:** Generate new permanent token
2. **Audit Session Storage:** Clean up expired sessions
3. **Review Error Logs:** Identify recurring issues
4. **Update Documentation:** Reflect any changes

---

## Support

### Meta Support

- **Developer Support:** https://developers.facebook.com/support/
- **WhatsApp Business API Docs:** https://developers.facebook.com/docs/whatsapp/cloud-api

### Internal Contacts

- **GAS Project:** `admin@shamrockbailbonds.biz`
- **Wix Portal:** `admin@shamrockbailbonds.biz`
- **Slack Alerts:** `#alerts` channel

---

## Appendix: File Changes Summary

### New Files Created

**Backend (GAS):**
- `WhatsApp_CloudAPI.js` - Direct Meta API client
- `WhatsApp_Auth.js` - OTP authentication logic
- `Setup_Properties_WhatsApp.js` - Configuration helper
- `SOC2_WebhookHandler_WhatsAppOTP.js` - Webhook handlers

**Frontend (Wix):**
- `backend/whatsapp-auth.jsw` - Wix backend functions

**Documentation:**
- `portal-landing-whatsapp-additions.js` - Code snippets for portal update

### Modified Files

**Backend (GAS):**
- `Manus_Brain.js` - Updated to use direct API (4 changes)
- `NotificationService.gs` - Added direct API method (1 change)
- `SOC2_WebhookHandler.js` - Added OTP endpoints (3 handlers)

**Frontend (Wix):**
- `portal-landing.bagfn.js` - Added WhatsApp OTP flow (3 functions)

---

## Success Criteria

✅ **Deployment Complete When:**

1. Meta authentication template approved
2. GAS Script Properties configured
3. Webhook verified and subscribed
4. Wix portal updated and published
5. All 7 tests passing
6. Slack notifications working
7. Email magic link still functional

✅ **Production Ready When:**

- Successfully tested with 3+ different phone numbers
- Monitored for 24 hours with no errors
- Rollback plan tested and documented
- Team trained on troubleshooting

---

**End of Deployment Guide**

For questions or issues, check GAS execution logs first, then Slack `#alerts` channel.
