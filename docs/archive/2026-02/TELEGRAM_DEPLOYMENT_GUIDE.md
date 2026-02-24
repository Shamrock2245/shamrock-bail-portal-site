# Telegram Bot Deployment Guide
## Shamrock Bail Bonds - Complete Setup Instructions

**Version:** 1.0.0  
**Date:** February 19, 2026  
**Platform:** Telegram + Wix + Google Apps Script

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Create Telegram Bot](#phase-1-create-telegram-bot)
4. [Phase 2: Deploy GAS Backend](#phase-2-deploy-gas-backend)
5. [Phase 3: Configure Wix Webhook](#phase-3-configure-wix-webhook)
6. [Phase 4: Test End-to-End](#phase-4-test-end-to-end)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Overview

This guide walks you through deploying the **Telegram bot integration** for Shamrock Bail Bonds. The bot enables indemnitors to complete the entire bail bond process via Telegram:

- ✅ Conversational intake (collect defendant/indemnitor info)
- ✅ Document generation and signing via SignNow
- ✅ Payment link delivery
- ✅ ID photo verification
- ✅ GPS location capture
- ✅ Automatic filing to Google Drive

**Architecture:**
```
Telegram User
    ↓
Telegram Bot API
    ↓
Wix Webhook (/_functions/telegram-webhook)
    ↓
Google Apps Script (Telegram_Webhook.js)
    ↓
Existing Handlers (Manus_Brain, IntakeFlow, PhotoHandler, etc.)
    ↓
SignNow, Drive, Payment Services
```

**Timeline:** 1-2 hours total

---

## Prerequisites

### Required Accounts
- ✅ Telegram account (personal or business)
- ✅ Wix website with backend code enabled
- ✅ Google Apps Script project (existing)
- ✅ GitHub account (for code repository)

### Required Information
- Wix site URL: `https://shamrockbailbonds.biz`
- GAS Web App URL: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
- Admin email: `admin@shamrockbailbonds.biz`

---

## Phase 1: Create Telegram Bot

### Step 1.1: Start Chat with BotFather

1. Open Telegram on your phone or desktop
2. Search for **@BotFather** (official Telegram bot creation tool)
3. Start a conversation: `/start`

### Step 1.2: Create New Bot

1. Send command: `/newbot`
2. BotFather will ask for a **name** (display name):
   ```
   Shamrock Bail Bonds Assistant
   ```
3. BotFather will ask for a **username** (must end in 'bot'):
   ```
   shamrock_bail_bot
   ```
   *(or any available username)*

### Step 1.3: Save Bot Token

BotFather will respond with:
```
Done! Congratulations on your new bot. You will find it at t.me/shamrock_bail_bot.

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890

Keep your token secure and store it safely, it can be used by anyone to control your bot.
```

**⚠️ IMPORTANT:** Copy this token immediately. You'll need it in Phase 2.

### Step 1.4: Configure Bot Settings

1. Set bot description (what users see before starting):
   ```
   /setdescription
   ```
   Then send:
   ```
   I'm Manus, your digital assistant for Shamrock Bail Bonds. I can help you complete bail bond paperwork, make payments, and check case status - all via Telegram!
   ```

2. Set bot about text (shown in bot profile):
   ```
   /setabouttext
   ```
   Then send:
   ```
   24/7 Bail Bond Assistance | Shamrock Bail Bonds
   ```

3. Set bot commands (for command menu):
   ```
   /setcommands
   ```
   Then send:
   ```
   start - Start conversation
   help - Show menu and options
   status - Check case status
   cancel - Cancel current operation
   ```

4. (Optional) Set bot profile photo:
   ```
   /setuserpic
   ```
   Then upload your company logo

### Step 1.5: Test Bot

1. Open your bot: `https://t.me/shamrock_bail_bot`
2. Click **START**
3. You should see: *"Hi! I'm your bot shamrock_bail_bot"*

✅ **Phase 1 Complete!** Your bot is created but not yet functional.

---

## Phase 2: Deploy GAS Backend

### Step 2.1: Upload New Files to GAS

1. Open your Google Apps Script project:
   ```
   https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit
   ```

2. Click **+** next to **Files** → **Script**

3. Create these new files (copy from GitHub repo):

   **File 1:** `Telegram_API.js`
   - Source: `backend-gas/Telegram_API.js`
   - Purpose: Telegram Bot API client

   **File 2:** `Telegram_Webhook.js`
   - Source: `backend-gas/Telegram_Webhook.js`
   - Purpose: Webhook message routing

### Step 2.2: Update Existing Files

Update these files with Telegram support:

1. **Manus_Brain.js**
   - Replace with updated version from `backend-gas/Manus_Brain.js`
   - Changes: Added platform detection and Telegram response handling

2. **WhatsApp_PhotoHandler.js**
   - Replace with updated version
   - Changes: Added `platform` parameter support

3. **LocationMetadataService.js**
   - Replace with updated version
   - Changes: Added platform detection

### Step 2.3: Configure Script Properties

1. In GAS, click **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. Click **Add script property**
4. Add this property:

   | Property | Value |
   |----------|-------|
   | `TELEGRAM_BOT_TOKEN` | *(paste your bot token from Phase 1)* |

### Step 2.4: Update Code.js doPost()

Add Telegram webhook routing to your `Code.js` file's `doPost()` function:

```javascript
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    // ... existing WhatsApp handling ...
    
    // NEW: Telegram webhook handling
    if (action === 'telegram_inbound_message') {
      return handleTelegramInbound(payload.update);
    }
    
    // ... rest of function ...
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Step 2.5: Deploy GAS Web App

1. Click **Deploy** → **Manage deployments**
2. Click **Edit** (pencil icon) on your existing deployment
3. Select **New version**
4. Click **Deploy**
5. Copy the **Web app URL** (you'll need it in Phase 3)

✅ **Phase 2 Complete!** GAS backend is ready to receive Telegram messages.

---

## Phase 3: Configure Wix Webhook

### Step 3.1: Update Wix Backend Files

1. Open your Wix Editor
2. Go to **Code Files** (left sidebar, `</>` icon)
3. Navigate to **Backend** folder

4. **Add new file:** `telegram-webhook.jsw`
   - Source: `src/backend/telegram-webhook.jsw`
   - Purpose: Telegram webhook handler

5. **Update existing file:** `http-functions.js`
   - Add the Telegram webhook endpoints (see source file)
   - Endpoints: `post_telegramWebhook` and `get_telegramWebhookInfo`

### Step 3.2: Configure Wix Secrets

1. In Wix Editor, go to **Settings** → **Secrets Manager**
2. Click **+ New Secret**
3. Add:

   | Secret Name | Value |
   |-------------|-------|
   | `TELEGRAM_BOT_TOKEN` | *(your bot token)* |
   | `GAS_WEBHOOK_URL` | *(your GAS Web App URL from Phase 2)* |

### Step 3.3: Update telegram-webhook.jsw

1. Open `backend/telegram-webhook.jsw`
2. Replace the placeholder with your GAS URL:

```javascript
// Get GAS webhook URL from Wix Secrets
const GAS_WEBHOOK_URL = await getSecret('GAS_WEBHOOK_URL');
```

### Step 3.4: Publish Wix Site

1. Click **Publish** (top right)
2. Wait for deployment to complete
3. Your webhook URL will be:
   ```
   https://shamrockbailbonds.biz/_functions/telegram-webhook
   ```

### Step 3.5: Set Telegram Webhook

**Option A: Using Telegram API directly**

Open this URL in your browser (replace placeholders):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://shamrockbailbonds.biz/_functions/telegram-webhook
```

You should see:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

**Option B: Using Wix function (recommended)**

1. Create a temporary Wix page
2. Add this code to page code:

```javascript
import { setTelegramWebhook } from 'backend/telegram-webhook';

$w.onReady(async function () {
  const botToken = 'YOUR_BOT_TOKEN';
  const webhookUrl = 'https://shamrockbailbonds.biz/_functions/telegram-webhook';
  
  const result = await setTelegramWebhook(botToken, webhookUrl);
  console.log('Webhook result:', result);
});
```

3. Preview the page
4. Check browser console for result
5. Delete the temporary page

### Step 3.6: Verify Webhook

Check webhook status:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://shamrockbailbonds.biz/_functions/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

✅ **Phase 3 Complete!** Telegram is now connected to your Wix webhook.

---

## Phase 4: Test End-to-End

### Test 1: Basic Message

1. Open your bot: `https://t.me/shamrock_bail_bot`
2. Send: `/start`
3. Expected response:
   ```
   👋 Welcome to Shamrock Bail Bonds!
   
   I'm Manus, your digital assistant...
   ```

### Test 2: Intake Flow

1. Send: `I need to bail someone out`
2. Bot should start asking questions:
   ```
   I can help you with that! Let's start with some information.
   
   What is the defendant's full legal name?
   ```
3. Answer each question
4. Verify bot progresses through intake flow

### Test 3: Photo Upload

1. During intake, bot will request ID photos
2. Take a photo of your driver license (front)
3. Send photo to bot
4. Expected response:
   ```
   ✅ ID front received and saved!
   
   Now please send the BACK of your ID.
   ```

### Test 4: Location Sharing

1. Click the 📍 button in Telegram
2. Share your location
3. Expected response:
   ```
   ✅ Location captured!
   
   Thank you for sharing your location.
   ```

### Test 5: Commands

Test each command:
- `/help` - Should show menu
- `/status` - Should ask for case number
- `/cancel` - Should cancel operation

### Test 6: Check GAS Logs

1. Open GAS project
2. Click **Executions** (left sidebar, clock icon)
3. Verify you see:
   - `handleTelegramInbound` executions
   - No errors
   - Successful completions

### Test 7: Check Wix Logs

1. In Wix Editor, open **Site Monitoring**
2. Go to **Logs** tab
3. Filter by `telegram`
4. Verify webhook calls are logged

### Test 8: Check Google Sheet

1. Open your tracking spreadsheet
2. Look for `Telegram_Inbound` sheet
3. Verify messages are logged with:
   - Timestamp
   - Chat ID
   - Username
   - Message content

✅ **Phase 4 Complete!** Telegram bot is fully functional!

---

## Troubleshooting

### Issue: Bot doesn't respond

**Possible causes:**
1. Webhook not set correctly
2. GAS deployment not updated
3. Wix site not published

**Solution:**
1. Check webhook status: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
2. Verify `url` field matches your Wix endpoint
3. Check GAS execution logs for errors
4. Verify Wix Secrets are configured

### Issue: "Webhook failed" error

**Possible causes:**
1. GAS Web App URL incorrect in Wix Secrets
2. GAS deployment permissions wrong

**Solution:**
1. Verify GAS_WEBHOOK_URL in Wix Secrets Manager
2. In GAS, go to Deploy → Manage deployments
3. Ensure "Execute as" = **Me**
4. Ensure "Who has access" = **Anyone**

### Issue: Photos not saving

**Possible causes:**
1. Google Drive folder permissions
2. TelegramBotAPI class not found

**Solution:**
1. Verify `GOOGLE_DRIVE_OUTPUT_FOLDER_ID` in GAS Script Properties
2. Ensure folder has "Anyone with link can view" permission
3. Check that `Telegram_API.js` is uploaded to GAS

### Issue: Intake flow not starting

**Possible causes:**
1. `WhatsApp_IntakeFlow.js` not uploaded
2. Function name mismatch

**Solution:**
1. Verify `WhatsApp_IntakeFlow.js` exists in GAS
2. Check that `processIntakeConversation` function is defined
3. Review GAS logs for "function not found" errors

### Issue: Voice notes not working

**Possible causes:**
1. ElevenLabs API key not configured
2. Drive folder not public

**Solution:**
1. Verify `ELEVENLABS_API_KEY` in GAS Script Properties
2. Verify `MANUS_VOICE_ID` is set
3. Ensure Drive output folder is public
4. Check ElevenLabs API quota

---

## Maintenance

### Daily Checks

1. **Monitor message volume:**
   - Check `Telegram_Inbound` sheet
   - Look for unusual patterns

2. **Review error logs:**
   - GAS Executions tab
   - Wix Site Monitoring logs

3. **Check webhook health:**
   - Visit: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
   - Verify `pending_update_count` is low (< 10)

### Weekly Tasks

1. **Review intake completions:**
   - Check how many users complete full intake
   - Identify drop-off points

2. **Update bot commands:**
   - Add new commands as features are added
   - Use `/setcommands` with BotFather

3. **Test new features:**
   - Send test messages after any code updates
   - Verify all flows still work

### Monthly Tasks

1. **Audit photo storage:**
   - Check Drive folder sizes
   - Archive old case photos

2. **Review bot analytics:**
   - Total users
   - Most common questions
   - Average completion time

3. **Update documentation:**
   - Keep this guide current
   - Document any new workflows

### Bot Updates

When you update bot code:

1. **GAS updates:**
   - Edit files in GAS
   - Deploy new version
   - No webhook changes needed

2. **Wix updates:**
   - Edit backend files
   - Publish site
   - Webhook automatically updates

3. **Bot settings:**
   - Use BotFather commands
   - No code deployment needed

---

## Advanced Configuration

### Custom Keyboards

Add interactive buttons to messages:

```javascript
// In Telegram_Webhook.js
const buttons = [
  [{ text: 'Start Paperwork', callback_data: 'start_intake' }],
  [{ text: 'Check Status', callback_data: 'check_status' }],
  [{ text: 'Make Payment', callback_data: 'make_payment' }]
];

const bot = new TelegramBotAPI();
bot.sendMessageWithKeyboard(chatId, 'What would you like to do?', buttons);
```

### Rich Media Messages

Send formatted messages:

```javascript
const message = `
*Bold text*
_Italic text_
[Link text](https://shamrockbailbonds.biz)
\`Code text\`

• Bullet point 1
• Bullet point 2
`;

bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
```

### Broadcast Messages

Send message to all users (use carefully):

```javascript
// Get all chat IDs from Google Sheet
const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Telegram_Inbound');
const data = sheet.getDataRange().getValues();
const chatIds = [...new Set(data.slice(1).map(row => row[1]))]; // Unique chat IDs

// Send broadcast
const bot = new TelegramBotAPI();
chatIds.forEach(chatId => {
  bot.sendMessage(chatId, 'Important announcement: ...');
  Utilities.sleep(100); // Rate limiting
});
```

---

## Security Best Practices

1. **Never expose bot token:**
   - Store in Wix Secrets Manager
   - Store in GAS Script Properties
   - Never commit to GitHub

2. **Validate webhook requests:**
   - Telegram sends updates to your webhook
   - Always validate structure before processing

3. **Rate limiting:**
   - Telegram allows 30 messages/second
   - Implement delays for bulk operations

4. **User verification:**
   - Match Telegram username to case records
   - Require phone number for sensitive operations

5. **Data privacy:**
   - Don't log sensitive info (SSN, full card numbers)
   - Encrypt data in transit (HTTPS)
   - Follow GDPR/CCPA guidelines

---

## Support

### Resources

- **Telegram Bot API Docs:** https://core.telegram.org/bots/api
- **BotFather Commands:** https://core.telegram.org/bots#botfather
- **Wix Backend Docs:** https://www.wix.com/velo/reference/
- **GAS Docs:** https://developers.google.com/apps-script

### Contact

- **Email:** admin@shamrockbailbonds.biz
- **Phone:** (239) 955-0178
- **GitHub Issues:** https://github.com/Shamrock2245/shamrock-bail-portal-site/issues

---

## Changelog

### Version 1.0.0 (2026-02-19)
- Initial release
- Complete Telegram bot integration
- Reuses 95% of WhatsApp infrastructure
- Full intake flow support
- Photo upload and GPS capture
- SignNow and payment integration

---

**🎉 Congratulations! Your Telegram bot is live and ready to process bail bonds 24/7!**
