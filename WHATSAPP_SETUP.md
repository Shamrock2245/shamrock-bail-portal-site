# WhatsApp Integration — Complete Setup Guide
## Shamrock Bail Bonds

**WhatsApp Business Number:** +1 (239) 955-0178 ✅ Confirmed  
**Phone Number ID:** 945804478623321  
**WABA ID:** 3050872911967629  
**Business Portfolio ID:** 877128086156188  

---

## Current Status

| Item | Status |
|------|--------|
| WhatsApp Business Account (WABA) | ✅ Active (ID: 3050872911967629) |
| Phone number +1 239-955-0178 added | ✅ Added |
| Phone number verified | ⏳ Pending — retry verification in ~1 hr (rate limit) |
| `whatsapp-auth.jsw` (Wix backend) | ✅ Complete |
| `http-functions.js` webhook endpoints | ✅ Complete |
| `WhatsApp_CloudAPI.js` (GAS) | ✅ Complete |
| `WhatsApp_Auth.js` (GAS) | ✅ Complete |
| `WhatsApp_Webhook.js` (GAS) | ✅ Complete |
| `WhatsApp_Notifications.js` (GAS) | ✅ Complete + Templates + ElevenLabs |
| `Setup_Properties_WhatsApp.js` (GAS) | ✅ Complete — fill in credentials |
| Meta credentials entered in GAS | ❌ Needs your values |
| Wix Secrets configured | ❌ Needs your values |
| Meta webhook registered | ❌ After phone verified |
| Message templates created | ❌ 5 templates to create |

---

## Step 1 — Verify the Phone Number

Go to: https://business.facebook.com/latest/whatsapp_manager/phone_numbers?business_id=877128086156188&asset_id=3050872911967629

1. Click the **gear icon** next to +1 239-955-0178
2. Click the **Profile** tab
3. Click **"Send verification code"** → select **Text message** → click **Next**
4. Check 239-955-0178 for the 6-digit code
5. Enter the code → click **Verify**

> **Note:** If you see "Verification code limit exceeded," wait 1–2 hours and try again. This is a Meta rate limit that resets automatically.

---

## Step 2 — Get Your Meta Credentials

Go to: https://developers.facebook.com/apps → select your Shamrock app

| Credential | Where to Find It |
|-----------|-----------------|
| **Phone Number ID** | WhatsApp > API Setup → "Phone number ID" field (already known: `945804478623321`) |
| **Access Token** | Business Settings > System Users → create a System User with `whatsapp_business_messaging` permission → Generate token |
| **App Secret** | App Settings > Basic → "App secret" |
| **WABA ID** | Already known: `3050872911967629` |

> **Important:** Use a **permanent System User token**, not the temporary token shown in API Setup. Temporary tokens expire in 24 hours.

---

## Step 3 — Configure Google Apps Script Properties

1. Open your GAS project
2. Open `Setup_Properties_WhatsApp.js`
3. Fill in `WA_SETUP_VALUES` at the top of the file:

```javascript
const WA_SETUP_VALUES = {
    WHATSAPP_PHONE_NUMBER_ID:     '945804478623321',  // ← Already known
    WHATSAPP_ACCESS_TOKEN:        'YOUR_SYSTEM_USER_TOKEN',
    WHATSAPP_BUSINESS_ACCOUNT_ID: '3050872911967629', // ← Already set
    WHATSAPP_APP_SECRET:          'YOUR_APP_SECRET',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'shamrock_webhook_verify_2026',
    // ... rest is already filled in
};
```

4. Run `RUN_SetupWhatsAppProperties()` — this writes all values to Script Properties
5. Run `AUDIT_WhatsAppProperties()` — confirms everything is set
6. Run `testWhatsAppConnection()` — sends a test message to 239-955-0178

---

## Step 4 — Configure Wix Secrets Manager

In your Wix Editor → Settings → Secrets Manager, add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `WHATSAPP_ACCESS_TOKEN` | Same System User token from Step 2 |
| `WHATSAPP_PHONE_NUMBER_ID` | `945804478623321` |
| `WHATSAPP_APP_SECRET` | Same App Secret from Step 2 |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `shamrock_webhook_verify_2026` |

---

## Step 5 — Register the Webhook in Meta

Go to: https://developers.facebook.com/apps → your app → WhatsApp > Configuration → Webhooks

| Field | Value |
|-------|-------|
| **Callback URL** | `https://www.shamrockbailbonds.biz/_functions/webhookWhatsApp` |
| **Verify Token** | `shamrock_webhook_verify_2026` |

Click **Verify and Save**, then subscribe to:
- `messages`
- `message_status_updates`

---

## Step 6 — Create the 5 Message Templates

Go to: https://business.facebook.com/latest/whatsapp_manager/message_templates?business_id=877128086156188&asset_id=3050872911967629

### Template 1: `shamrock_otp_login` (Authentication)

| Field | Value |
|-------|-------|
| Category | Authentication |
| Name | `shamrock_otp_login` |
| Language | English (US) |
| Body | `{{1}} is your Shamrock Bail Bonds verification code.` |
| Footer | `This code expires in 10 minutes.` |
| Button | **Copy Code** (NOT "One-tap autofill") |

> **Critical:** Leave "Package name" and "App signature hash" **blank** — those are for native Android apps, not websites.

---

### Template 2: `court_date_reminder` (Utility)

| Field | Value |
|-------|-------|
| Category | Utility |
| Name | `court_date_reminder` |
| Language | English (US) |
| Header | `Court Date Reminder` |
| Body | `Hello {{1}}, this is a reminder for your court date on {{2}} at {{3}}. Location: {{4}}. Case #: {{5}}. Failure to appear may result in a warrant.` |
| Footer | `Shamrock Bail Bonds • (239) 332-2245` |
| Button 1 | Call Phone Number → "Call Office" → `+12393322245` |
| Button 2 | Quick Reply → "I will be there" |

---

### Template 3: `document_signature_request` (Utility)

| Field | Value |
|-------|-------|
| Category | Utility |
| Name | `document_signature_request` |
| Language | English (US) |
| Body | `Hello {{1}}, your bail documents are ready for your signature. Please sign them immediately here: {{2}}` |
| Footer | `Shamrock Bail Bonds` |
| Button | Visit Website → "Sign Documents" → Dynamic URL `{{1}}` |

---

### Template 4: `payment_request` (Utility)

| Field | Value |
|-------|-------|
| Category | Utility |
| Name | `payment_request` |
| Language | English (US) |
| Body | `Hello {{1}}, this is a notice regarding your payment of {{2}}. Status: {{3}}. Please pay securely here: {{4}}` |
| Footer | `Shamrock Bail Bonds` |
| Button | Visit Website → "Pay Now" → Dynamic URL `{{1}}` |

---

### Template 5: `general_followup` (Utility)

| Field | Value |
|-------|-------|
| Category | Utility |
| Name | `general_followup` |
| Language | English (US) |
| Body | `Hello {{1}}, please confirm you received this message regarding your bond status. Reference: {{2}}` |
| Button 1 | Quick Reply → "Confirm Receipt" |
| Button 2 | Quick Reply → "Call Me" |

> Templates are usually approved within 1–2 hours. While pending, the system automatically falls back to plain text messages.

---

## Architecture Overview

```
Customer Phone
     │
     ▼
WhatsApp Cloud API (Meta)
     │
     ├── Inbound messages ──► Wix http-functions.js (webhookWhatsApp)
     │                              │
     │                              ▼
     │                        GAS doPost (whatsapp_inbound_message)
     │                              │
     │                              ▼
     │                        WhatsApp_Webhook.js
     │                        (HERE, PAY, HELP, STOP, OTP replies)
     │
     └── Outbound messages ◄── WhatsApp_Notifications.js
                                (court reminders, docs, payments)
                                      │
                                      ├── Plain text (sendText)
                                      ├── Templates (sendTemplate)
                                      └── Voice notes (sendAudio)
                                                │
                                                └── ElevenLabs TTS
                                                    (WA_sendElevenLabsVoiceNote)
```

---

## Key Functions Reference

### GAS — WhatsApp_Notifications.js

| Function | Purpose |
|----------|---------|
| `WA_notifyNewCase(caseData)` | Alert staff of new case intake |
| `WA_notifyCourtDateReminder(caseData, daysUntil)` | Court date reminder (plain text) |
| `WA_templateCourtReminder(caseData)` | Court date reminder (approved template) |
| `WA_notifyDocumentReady(phone, name, link, docName)` | Document ready for signing |
| `WA_templateDocumentSignature(phone, name, link)` | Document signature (template) |
| `WA_notifyPaymentOverdue(phone, name, amount, dueDate)` | Payment overdue notice |
| `WA_templatePaymentRequest(phone, name, amount, status, link)` | Payment request (template) |
| `WA_sendStealthPing(phone, name, magicLink)` | Stealth check-in ping |
| `WA_templateGeneralFollowup(phone, name, reference)` | General follow-up (template) |
| `WA_notifyForfeitureAlert(caseData)` | Bond forfeiture alert |
| `WA_notifyBondDischarge(caseData)` | Bond discharged confirmation |
| `WA_sendBulkCourtReminders()` | Daily bulk court date scan (set as time trigger) |
| `WA_sendVoiceNote(phone, audioUrl, label)` | Send audio/voice note |
| `WA_sendElevenLabsVoiceNote(phone, text, label)` | Generate ElevenLabs TTS + send |

### GAS — WhatsApp_Auth.js

| Function | Purpose |
|----------|---------|
| `WA_sendOTP(phone)` | Send 6-digit OTP via `shamrock_otp_login` template |
| `WA_validateOTP(phone, code)` | Validate OTP, return session token |
| `WA_resendOTP(phone)` | Resend OTP (rate limited) |

### Wix — whatsapp-auth.jsw

| Export | Purpose |
|--------|---------|
| `sendWhatsAppOTP(phone)` | Send OTP (calls GAS) |
| `validateWhatsAppOTP(phone, code)` | Validate OTP (calls GAS) |
| `resendWhatsAppOTP(phone)` | Resend OTP (calls GAS) |
| `sendWhatsAppText(to, text)` | Direct Cloud API text send |
| `sendWhatsAppTemplate(to, name, lang, components)` | Direct Cloud API template send |
| `initiateWhatsAppLogin(phone)` | Alias for sendWhatsAppOTP |
| `verifyWhatsAppOTP(phone, code)` | Alias for validateWhatsAppOTP |

---

## ElevenLabs Integration

The system supports sending AI-generated voice notes via WhatsApp using ElevenLabs TTS.

**Required Script Properties:**
- `ELEVENLABS_API_KEY` — your ElevenLabs API key
- `ELEVENLABS_VOICE_ID` — voice ID (default: `EXAVITQu4vr4xnSDxMaL` = Bella)

**Usage example:**
```javascript
// Send a voice note to a defendant
WA_sendElevenLabsVoiceNote(
  '+13055551234',
  'Hello John, this is a reminder from Shamrock Bail Bonds. Your court date is tomorrow at 9 AM.',
  'Case-2026-001'
);
```

**Flow:**
1. Text sent to ElevenLabs API → returns MP3 audio
2. MP3 saved to Google Drive (public link)
3. Audio URL sent to WhatsApp Cloud API as voice note
4. Recipient receives it as a voice message in WhatsApp

---

## Inbound Message Commands

When someone texts your WhatsApp number, the system responds automatically:

| Command | Response |
|---------|----------|
| `HERE` | Logs check-in, confirms receipt |
| `PAY` | Sends SwipeSimple payment link |
| `HELP` | Sends full menu of options |
| `STOP` | Unsubscribes from notifications |
| `START` | Re-subscribes |
| `LOCATION` | Sends office address + Google Maps link |
| `FORMS` | Sends forms menu |
| 6-digit number | Treated as OTP reply |
| Anything else | Notifies staff via Slack, sends "we'll follow up" reply |

---

## Contacts

| Contact | Number |
|---------|--------|
| Shamrock Business Cell (WhatsApp) | (239) 955-0178 |
| Shamrock Office | (239) 332-2245 |
