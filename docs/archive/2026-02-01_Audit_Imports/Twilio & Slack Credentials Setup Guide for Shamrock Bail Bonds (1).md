# Twilio & Slack Credentials Setup Guide for Shamrock Bail Bonds

**Generated:** February 01, 2026  
**Purpose:** Step-by-step guide to configure Twilio and Slack integration with extracted credentials

---

## 📋 EXTRACTED CREDENTIALS SUMMARY

### Twilio Account Information

| Credential | Value | Source |
|:-----------|:------|:-------|
| **Account SID** | `[REDACTED]` | CSV compliance report |
| **Auth Token** | ⚠️ **NEEDS TO BE RETRIEVED** | Twilio Console (see instructions below) |
| **Primary Phone Number** | `+1 (727) 295-2245` | Active Numbers page |
| **Toll-Free Number** | `+1 (877) 313-8871` | Active Numbers page (needs verification) |

### Slack Bot Information

| Credential | Value | Source |
|:-----------|:------|:-------|
| **Bot User OAuth Token** | `[REDACTED]` | OAuth & Permissions page |
| **App Name** | `Shamrock Bail Bonds` | Slack App configuration |
| **Scopes** | `assistant:write`, `incoming-webhook` | Bot Token Scopes |

---

## 🔧 PART 1: TWILIO SETUP

### Step 1: Get Your Twilio Auth Token

Your **Account SID** is already visible: `[REDACTED]`

To get your **Auth Token**:

1. Go to [Twilio Console Dashboard](https://console.twilio.com/)
2. Log in to your Shamrock account
3. On the main dashboard, you'll see:
   - **Account SID** (already have this)
   - **Auth Token** (click "Show" to reveal it)
4. Copy the Auth Token - it will look like a 32-character string

**⚠️ IMPORTANT:** The Auth Token is sensitive. Never commit it to GitHub or share it publicly.

---

### Step 2: Understand Your Phone Number Status

From your screenshots, here's your current Twilio phone number situation:

| Phone Number | Type | Status | Issue |
|:-------------|:-----|:-------|:------|
| `+1 (727) 295-2245` | Local (Saint Petersburg, FL) | ⚠️ **UNREGISTERED** | A2P 10DLC registration required |
| `+1 (877) 313-8871` | Toll-Free | ⚠️ **Toll free verification needed** | Cannot send SMS until verified |

**What This Means:**

- **Primary number (727)**: Can receive calls/SMS, but **CANNOT send SMS** until A2P 10DLC registration is approved
- **Toll-free (877)**: Can receive calls, but **CANNOT send SMS** until toll-free verification is complete
- **Voice calls**: Both numbers can make/receive voice calls immediately

---

### Step 3: A2P 10DLC Registration Status

According to your compliance CSV and the Twilio A2P report in your project files:

✅ **Campaign is registered and under review**
- Status: `TWILIO_APPROVED` for bundles
- Phone number status: `UNREGISTERED` (waiting for campaign approval)
- Expected approval time: 2-3 weeks from registration date

**What You Need to Do:**

1. **Wait for approval email** from Twilio
2. **Check status periodically**: 
   - Go to Twilio Console → Messaging → Regulatory Compliance → Campaigns
3. **Once approved**, your `(727) 295-2245` number will be able to send SMS

**For now, you can still configure the credentials** - SMS sending will automatically work once approved.

---

### Step 4: Configure Twilio in Google Apps Script

#### Option A: Using Script Properties (Recommended)

1. Open your Google Apps Script project:
   ```
   https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit
   ```

2. Go to **Project Settings** (gear icon on left sidebar)

3. Scroll down to **Script Properties**

4. Click **Add script property** and add these:

   | Property Name | Value |
   |:--------------|:------|
   | `TWILIO_ACCOUNT_SID` | `[REDACTED]` |
   | `TWILIO_AUTH_TOKEN` | `<YOUR_AUTH_TOKEN_FROM_CONSOLE>` |
   | `TWILIO_PHONE_NUMBER` | `+17272952245` |
   | `TWILIO_PHONE_NUMBER_FORMATTED` | `(727) 295-2245` |

5. Click **Save script properties**

#### Option B: Using the Setup Function

Alternatively, run this function in your GAS project:

```javascript
function setupTwilioCredentials() {
  const props = PropertiesService.getScriptProperties();
  
  // Set Twilio credentials
  props.setProperty('TWILIO_ACCOUNT_SID', '[REDACTED]');
  props.setProperty('TWILIO_AUTH_TOKEN', 'YOUR_AUTH_TOKEN_HERE'); // Replace with actual token
  props.setProperty('TWILIO_PHONE_NUMBER', '+17272952245');
  props.setProperty('TWILIO_PHONE_NUMBER_FORMATTED', '(727) 295-2245');
  
  console.log('✅ Twilio credentials saved to Script Properties');
  
  // Verify the credentials
  const accountSid = props.getProperty('TWILIO_ACCOUNT_SID');
  console.log('Verified Account SID:', accountSid);
}
```

---

### Step 5: Configure Twilio in Node.js Scrapers

For the Node.js arrest scrapers, add these to your `.env` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=[REDACTED]
TWILIO_AUTH_TOKEN=<YOUR_AUTH_TOKEN_HERE>
TWILIO_PHONE_NUMBER=+17272952245
TWILIO_PHONE_NUMBER_FORMATTED=(727) 295-2245
```

**Location:** `/home/ubuntu/swfl-arrest-scrapers/.env`

**⚠️ Security Note:** The `.env` file is already in `.gitignore`, so it won't be committed to GitHub.

---

### Step 6: Test Twilio Integration

Once you have the Auth Token configured, test the integration:

#### Test Function for GAS:

```javascript
function testTwilioConnection() {
  const props = PropertiesService.getScriptProperties();
  const accountSid = props.getProperty('TWILIO_ACCOUNT_SID');
  const authToken = props.getProperty('TWILIO_AUTH_TOKEN');
  
  if (!accountSid || !authToken) {
    console.error('❌ Twilio credentials not configured');
    return false;
  }
  
  try {
    // Test API connection by fetching account info
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const auth = Utilities.base64Encode(accountSid + ':' + authToken);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + auth
      },
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    
    if (code === 200) {
      const account = JSON.parse(response.getContentText());
      console.log('✅ Twilio Connected Successfully');
      console.log('Account Name:', account.friendly_name);
      console.log('Account Status:', account.status);
      return true;
    } else {
      console.error('❌ Twilio Connection Failed:', response.getContentText());
      return false;
    }
  } catch (e) {
    console.error('❌ Twilio Test Exception:', e.message);
    return false;
  }
}
```

**Run this function** to verify your credentials are correct.

---

### Step 7: Webhook Configuration (Already Set)

From your screenshots, I can see your webhooks are already configured:

**Voice Webhook:**
- URL: `https://demo.twilio.com/welcome/voice/`
- Method: `HTTP POST`

**Messaging Webhook:**
- URL: `https://demo.twilio.com/welcome/sms/reply`
- Method: `HTTP POST`

**⚠️ ACTION REQUIRED:** These are demo URLs. You'll need to update them to your actual endpoints:

```
Voice: https://www.shamrockbailbonds.biz/_functions/twilioVoice
Messaging: https://www.shamrockbailbonds.biz/_functions/twilioSms
```

**How to Update:**

1. Go to Twilio Console → Phone Numbers → Manage → Active numbers
2. Click on `(727) 295-2245`
3. Scroll to "Voice Configuration" and "Messaging Configuration"
4. Update the webhook URLs to your Wix endpoints
5. Click **Save**

---

## 🔧 PART 2: SLACK SETUP

### Step 1: Your Slack Bot Token

From your screenshot, your **Bot User OAuth Token** is:

```
[REDACTED]
```

**Scopes configured:**
- `assistant:write` - Allows the bot to act as an App Agent
- `incoming-webhook` - Allows posting messages to specific channels

---

### Step 2: Configure Slack in Google Apps Script

#### Add to Script Properties:

1. Open your GAS project
2. Go to **Project Settings** → **Script Properties**
3. Add these properties:

   | Property Name | Value |
   |:--------------|:------|
   | `SLACK_BOT_TOKEN` | `[REDACTED]` |
   | `SLACK_ENABLED` | `true` |

#### Or use this function:

```javascript
function setupSlackCredentials() {
  const props = PropertiesService.getScriptProperties();
  
  props.setProperty('SLACK_BOT_TOKEN', '[REDACTED]');
  props.setProperty('SLACK_ENABLED', 'true');
  
  console.log('✅ Slack credentials saved to Script Properties');
}
```

---

### Step 3: Configure Slack in Node.js Scrapers

Add to your `.env` file:

```bash
# Slack Configuration
SLACK_BOT_TOKEN=[REDACTED]
SLACK_WEBHOOK_URL=  # Optional: Add if you want to use incoming webhooks
SLACK_ENABLED=true
```

---

### Step 4: Set Up Slack Redirect URLs (Required)

From your screenshot, you need to configure **Redirect URLs** for OAuth:

⚠️ **Warning shown:** "At least one redirect URL needs to be set below before this app can be opted into token rotation"

**What to do:**

1. Go to your Slack App settings: [https://api.slack.com/apps/A08NLQ0G8QN](https://api.slack.com/apps/A08NLQ0G8QN)
2. Navigate to **OAuth & Permissions** (left sidebar)
3. Scroll to **Redirect URLs**
4. Click **Add New Redirect URL**
5. Add this URL:
   ```
   https://www.shamrockbailbonds.biz/_functions/slackOauth
   ```
6. Click **Add**
7. Click **Save URLs**

This allows Slack to redirect back to your Wix site after OAuth authorization.

---

### Step 5: Test Slack Integration

#### Test Function for GAS:

```javascript
function testSlackConnection() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('SLACK_BOT_TOKEN');
  
  if (!token) {
    console.error('❌ Slack token not configured');
    return false;
  }
  
  try {
    // Test API connection by calling auth.test
    const response = UrlFetchApp.fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      console.log('✅ Slack Connected Successfully');
      console.log('Team:', result.team);
      console.log('User:', result.user);
      console.log('Bot ID:', result.bot_id);
      return true;
    } else {
      console.error('❌ Slack Connection Failed:', result.error);
      return false;
    }
  } catch (e) {
    console.error('❌ Slack Test Exception:', e.message);
    return false;
  }
}
```

---

### Step 6: Send a Test Slack Message

```javascript
function sendTestSlackMessage(channel, message) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('SLACK_BOT_TOKEN');
  
  const payload = {
    channel: channel || '#general',  // Replace with your channel
    text: message || '🎉 Shamrock Bail Bonds automation is now connected to Slack!'
  };
  
  const response = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  const result = JSON.parse(response.getContentText());
  
  if (result.ok) {
    console.log('✅ Message sent successfully');
    return true;
  } else {
    console.error('❌ Failed to send message:', result.error);
    return false;
  }
}
```

**Usage:**
```javascript
sendTestSlackMessage('#notifications', 'Test message from Shamrock automation');
```

---

## 📝 COMPLETE ENVIRONMENT VARIABLES TEMPLATE

### For `.env` file in `/home/ubuntu/swfl-arrest-scrapers/.env`:

```bash
# ============================================================================
# SHAMROCK BAIL BONDS - COMPLETE ENVIRONMENT CONFIGURATION
# ============================================================================

# Google Sheets Configuration
GOOGLE_SHEETS_ID=1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc
GOOGLE_SERVICE_ACCOUNT_EMAIL=bail-suite-sa@shamrock-bail-suite.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./creds/service-account-key.json

# Timezone
TIMEZONE=America/New_York

# Twilio Configuration
TWILIO_ACCOUNT_SID=[REDACTED]
TWILIO_AUTH_TOKEN=<YOUR_AUTH_TOKEN_FROM_TWILIO_CONSOLE>
TWILIO_PHONE_NUMBER=+17272952245
TWILIO_PHONE_NUMBER_FORMATTED=(727) 295-2245

# Slack Configuration
SLACK_BOT_TOKEN=[REDACTED]
SLACK_WEBHOOK_URL=
SLACK_ENABLED=true

# Scraper Settings
DAYS_BACK=3
MAX_CONCURRENT_DETAILS=5
REQUEST_DELAY_MS=1000
RETRY_LIMIT=4
BACKOFF_BASE_MS=500

# Development
NODE_ENV=production
DEBUG=false
```

---

## 📋 GOOGLE APPS SCRIPT PROPERTIES CHECKLIST

Run this diagnostic function to verify all properties are set:

```javascript
function verifyAllCredentials() {
  const props = PropertiesService.getScriptProperties();
  const required = [
    'SIGNNOW_ACCESS_TOKEN',
    'SIGNNOW_API_BASE_URL',
    'SIGNNOW_SENDER_EMAIL',
    'SIGNNOW_MASTER_TEMPLATE_ID',
    'GOOGLE_DRIVE_FOLDER_ID',
    'GOOGLE_DRIVE_OUTPUT_FOLDER_ID',
    'WIX_API_KEY',
    'WEBHOOK_URL',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'SLACK_BOT_TOKEN'
  ];
  
  console.log('='.repeat(60));
  console.log('CREDENTIAL VERIFICATION REPORT');
  console.log('='.repeat(60));
  
  let missing = [];
  
  required.forEach(key => {
    const value = props.getProperty(key);
    if (value) {
      console.log(`✅ ${key}: configured`);
    } else {
      console.log(`❌ ${key}: MISSING`);
      missing.push(key);
    }
  });
  
  console.log('='.repeat(60));
  
  if (missing.length === 0) {
    console.log('✅ ALL CREDENTIALS CONFIGURED');
  } else {
    console.log(`❌ ${missing.length} CREDENTIALS MISSING:`);
    missing.forEach(key => console.log(`  - ${key}`));
  }
  
  console.log('='.repeat(60));
}
```

---

## 🚨 CRITICAL NEXT STEPS

### Immediate Actions (Do These Now):

1. ✅ **Get Twilio Auth Token**
   - Go to Twilio Console
   - Copy the Auth Token
   - Add to GAS Script Properties and `.env` file

2. ✅ **Add Slack Redirect URL**
   - Go to Slack App OAuth settings
   - Add: `https://www.shamrockbailbonds.biz/_functions/slackOauth`
   - Save

3. ✅ **Configure Credentials in GAS**
   - Add Twilio properties
   - Add Slack properties
   - Run `verifyAllCredentials()` to confirm

4. ✅ **Update Twilio Webhooks**
   - Change from demo URLs to your Wix endpoints
   - Voice: `https://www.shamrockbailbonds.biz/_functions/twilioVoice`
   - Messaging: `https://www.shamrockbailbonds.biz/_functions/twilioSms`

### Short-Term Actions (This Week):

5. ⏳ **Monitor A2P 10DLC Approval**
   - Check Twilio Console daily
   - Wait for approval email
   - Once approved, SMS sending will work automatically

6. ⏳ **Complete Toll-Free Verification**
   - If you want to use `(877) 313-8871` for SMS
   - Go to Twilio Console → Regulatory Compliance → Toll-Free Verification
   - Submit verification form

### Testing Actions (After Configuration):

7. 🧪 **Test Twilio Connection**
   - Run `testTwilioConnection()` in GAS
   - Verify credentials are correct

8. 🧪 **Test Slack Connection**
   - Run `testSlackConnection()` in GAS
   - Send test message to a channel

9. 🧪 **Test End-to-End Flow**
   - Generate a test bail bond packet
   - Verify Twilio notification is sent (once A2P approved)
   - Verify Slack notification is posted

---

## 🔒 SECURITY REMINDERS

### ✅ DO:
- Store Auth Token in Script Properties (encrypted by Google)
- Store Bot Token in Script Properties
- Use `.env` file for Node.js (already in `.gitignore`)
- Rotate tokens periodically (every 90 days recommended)

### ❌ DON'T:
- Never commit Auth Token or Bot Token to GitHub
- Never log tokens in console or logs
- Never share tokens via email or Slack
- Never hardcode tokens in code files

---

## 📞 SUPPORT RESOURCES

- **Twilio Support**: https://support.twilio.com/
- **Twilio A2P 10DLC Guide**: https://www.twilio.com/docs/sms/a2p-10dlc
- **Slack API Documentation**: https://api.slack.com/
- **Slack OAuth Guide**: https://api.slack.com/authentication/oauth-v2

---

## 📊 CURRENT STATUS SUMMARY

| Service | Status | Action Required |
|:--------|:-------|:----------------|
| **Twilio Account** | ✅ Active | Get Auth Token from console |
| **Twilio Phone (727)** | ⏳ A2P Pending | Wait for approval (2-3 weeks) |
| **Twilio Phone (877)** | ⚠️ Needs Verification | Complete toll-free verification |
| **Twilio Webhooks** | ⚠️ Demo URLs | Update to Wix endpoints |
| **Slack Bot** | ✅ Active | Add redirect URL, then ready to use |
| **Slack Scopes** | ✅ Configured | `assistant:write`, `incoming-webhook` |

---

**End of Setup Guide**

Once you complete these steps, your Twilio and Slack integrations will be fully operational! 🎉
