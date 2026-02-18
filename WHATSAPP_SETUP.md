# WhatsApp Integration Setup Guide
## Shamrock Bail Bonds

This document covers everything needed to activate the WhatsApp integration.
The code is fully written — you just need to plug in the credentials.

---

## Current Status

| Item | Status |
|------|--------|
| WhatsApp Business Account (WABA) | ✅ Created (ID: 3050872911967629) |
| Phone number +1 239-955-0178 added | ✅ Added |
| Phone number verified | ⏳ Pending (rate limit — retry in ~1 hr) |
| `whatsapp-auth.jsw` (Wix) | ✅ Complete |
| `http-functions.js` webhook endpoints | ✅ Complete |
| `WhatsApp_Webhook.js` (GAS) | ✅ Complete |
| `WhatsApp_Notifications.js` (GAS) | ✅ Complete |
| `WhatsApp_CloudAPI.js` (GAS) | ✅ Existing |
| `WhatsApp_Auth.js` (GAS) | ✅ Existing |
| `notificationService.jsw` wired | ✅ Complete |
| Credentials entered | ❌ Needs your values |
| Wix Secrets configured | ❌ Needs your values |
| Meta webhook registered | ❌ After phone verified |

---

## Step 1 — Complete Phone Number Verification

The rate limit on the verification code will clear within 1–2 hours.

1. Go to [WhatsApp Manager](https://business.facebook.com/latest/whatsapp_manager/phone_numbers?business_id=877128086156188&asset_id=3050872911967629)
2. Click the gear icon next to **+1 239-955-0178**
3. Click **Profile** tab
4. Click **"Send verification code"** → choose **Text message**
5. Enter the 6-digit code from your phone
6. Status will change to **Connected**

---

## Step 2 — Get Your Credentials from Meta

1. Go to [Meta Developer Apps](https://developers.facebook.com/apps)
2. Open your **Shamrock Bail Bonds** app
3. Navigate to **WhatsApp > API Setup**
4. Copy:
   - **Phone Number ID** (16-digit number next to your phone number)
   - **WhatsApp Business Account ID** (shown on the same page)
5. Generate a **Permanent System User Token**:
   - Go to [Business Settings > System Users](https://business.facebook.com/settings/system-users)
   - Create a System User (Admin role)
   - Click **Generate New Token** → select your app → grant `whatsapp_business_messaging` and `whatsapp_business_management` permissions
   - Copy the token (save it — it only shows once)
6. Get your **App Secret**:
   - App Dashboard > **App Settings > Basic** → copy App Secret

---

## Step 3 — Configure Google Apps Script Properties

1. Open your GAS project
2. Open **Setup_Properties_WhatsApp.js**
3. Fill in `WA_SETUP_VALUES` with your credentials:

```javascript
const WA_SETUP_VALUES = {
    WHATSAPP_PHONE_NUMBER_ID:       '123456789012345',  // from Step 2
    WHATSAPP_ACCESS_TOKEN:          'EAABsbCS1iHg...',  // from Step 2
    WHATSAPP_BUSINESS_ACCOUNT_ID:   '3050872911967629', // your WABA ID
    WHATSAPP_APP_SECRET:            'abc123def456...',  // from Step 2
    WHATSAPP_WEBHOOK_VERIFY_TOKEN:  'shamrock_webhook_verify_2026', // keep as-is
    WHATSAPP_AUTH_TEMPLATE_NAME:    'shamrock_otp',
    WHATSAPP_COURT_TEMPLATE_NAME:   'court_date_reminder',
    SHAMROCK_OFFICE_PHONE:          '(239) 332-2245',
    SHAMROCK_CELL_PHONE:            '(239) 955-0178',
    PAYMENT_LINK:                   'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd'
};
```

4. Run **`RUN_SetupWhatsAppProperties()`**
5. Run **`AUDIT_WhatsAppProperties()`** to confirm all values are set
6. Run **`testWhatsAppConnection()`** — you should receive a test text on 239-955-0178

---

## Step 4 — Configure Wix Secrets Manager

In your Wix site editor:
1. Go to **Settings > Secrets Manager** (or Dev Mode > Secrets)
2. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `WHATSAPP_ACCESS_TOKEN` | Your permanent system user token |
| `WHATSAPP_PHONE_NUMBER_ID` | Your phone number ID (16 digits) |
| `WHATSAPP_APP_SECRET` | Your app secret |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `shamrock_webhook_verify_2026` |

---

## Step 5 — Register the Webhook in Meta

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps) → your app
2. Navigate to **WhatsApp > Configuration**
3. Under **Webhook**, click **Edit**
4. Set:
   - **Callback URL**: `https://www.shamrockbailbonds.biz/_functions/webhookWhatsApp`
   - **Verify Token**: `shamrock_webhook_verify_2026`
5. Click **Verify and Save**
6. Under **Webhook fields**, subscribe to:
   - `messages`
   - `message_status_updates` (or `message_deliveries`, `message_reads`)

---

## Step 6 — Create Message Templates

### Authentication Template (for OTP login)

1. Go to [WhatsApp Manager > Message Templates](https://business.facebook.com/latest/whatsapp_manager/message_templates)
2. Click **Create Template**
3. Fill in:
   - **Category**: Authentication
   - **Name**: `shamrock_otp`
   - **Language**: English (US)
4. Meta auto-generates the body: *"{{1}} is your verification code."*
5. Submit for approval (usually approved within 1–2 hours)

### Court Date Reminder Template

1. Create another template:
   - **Category**: Utility
   - **Name**: `court_date_reminder`
   - **Language**: English (US)
   - **Header**: `Court Date Reminder`
   - **Body**: `Hello {{1}}, you have a court appearance on {{2}} at {{3}}. Case #{{4}}. Failure to appear may result in bond forfeiture. Questions? Call Shamrock Bail Bonds.`
   - **Footer**: `Shamrock Bail Bonds — (239) 332-2245`
2. Submit for approval

> **Note**: While templates are pending approval, the system automatically falls back to plain text messages for any open conversations.

---

## Step 7 — Set Up Daily Court Reminder Trigger

1. In GAS, go to **Triggers** (clock icon)
2. Add a new trigger:
   - Function: `WA_sendBulkCourtReminders`
   - Event source: Time-driven
   - Type: Day timer
   - Time: 8 AM – 9 AM (Eastern)
3. Save

This will automatically send WhatsApp reminders at 7 days, 3 days, and 1 day before each court date.

---

## Architecture Overview

```
User's Phone
    │
    ▼ (sends WhatsApp message)
Meta Cloud API
    │
    ▼ (POST webhook)
Wix: /_functions/webhookWhatsApp  (http-functions.js)
    │
    ├─► Log to WhatsAppMessages CMS collection
    ├─► Forward to GAS: action=whatsapp_inbound_message
    └─► Mark message as read
         │
         ▼
    GAS: handleWhatsAppInbound()  (WhatsApp_Webhook.js)
         │
         ├─► OTP reply → WA_validateOTP()
         ├─► "HERE" → log check-in, reply, notify Slack
         ├─► "PAY" → send payment link
         ├─► "HELP" → send menu
         └─► Unknown → notify staff, send default reply

Outbound (from your system):
Wix notificationService.jsw
    └─► sendWhatsAppNotification()
         └─► whatsapp-auth.jsw sendWhatsAppText()
              └─► Meta Cloud API → User's Phone

GAS WhatsApp_Notifications.js
    ├─► WA_notifyNewCase()
    ├─► WA_notifyCourtDateReminder()
    ├─► WA_notifyDocumentReady()
    ├─► WA_notifyDocumentSigned()
    ├─► WA_notifyPaymentReceived()
    ├─► WA_notifyPaymentOverdue()
    ├─► WA_sendStealthPing()
    ├─► WA_notifyForfeitureAlert()
    ├─► WA_notifyBondDischarge()
    └─► WA_sendBulkCourtReminders() [daily trigger]
```

---

## Wix CMS Collections Needed

Add these collections in your Wix CMS if they don't exist:

### `WhatsAppMessages`
| Field | Type | Notes |
|-------|------|-------|
| `waId` | Text | Sender's WhatsApp ID (phone without +) |
| `messageId` | Text | Meta message ID |
| `direction` | Text | `inbound` or `outbound` |
| `type` | Text | `text`, `image`, etc. |
| `body` | Text | Message text |
| `senderName` | Text | Display name |
| `timestamp` | Text | ISO timestamp |
| `deliveryStatus` | Text | `sent`, `delivered`, `read`, `failed` |
| `statusUpdatedAt` | Text | ISO timestamp |
| `rawPayload` | Text | Full JSON payload |

---

## Testing Checklist

- [ ] Run `testWhatsAppConnection()` in GAS → receive text on 239-955-0178
- [ ] Run `testWhatsAppOTP()` in GAS → receive 6-digit code on 239-955-0178
- [ ] Visit portal login page → enter 239-955-0178 → receive OTP → log in
- [ ] Send "HERE" to 239-955-0178 from another phone → check-in logged
- [ ] Send "PAY" → receive payment link
- [ ] Send "HELP" → receive menu
- [ ] Run `testCourtDateReminder()` → receive reminder on 239-955-0178
- [ ] Verify webhook in Meta console shows green checkmark

---

*Last updated: February 2026*
