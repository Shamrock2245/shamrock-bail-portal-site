# 🧪 Testing Guide

> **Purpose:** Validate core integrations and workflows end-to-end.
> **Last Updated:** April 16, 2026

---

## Prerequisites

Before running tests, ensure the following are configured in GAS Script Properties:

| Property | Description | Status |
|----------|-------------|--------|
| `OPENAI_API_KEY` | OpenAI API Key (GPT-4o-mini) | ✅ Required |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | ✅ Required |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ✅ Required |
| `TWILIO_PHONE_NUMBER` | Twilio From Number | ✅ Required |
| `SIGNNOW_AUTH_TOKEN` | SignNow Basic Auth | ✅ Required |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API Token | ✅ Required |
| `SLACK_WEBHOOK_OPS` | Slack Ops Channel Webhook | Optional |

---

## Test 1: AI Concierge — Happy Path (Lee County)

**Goal:** Verify a high-urgency Lee County lead triggers AI-generated SMS.

### Steps

1. **Open the GAS Dashboard**
   - Navigate to: `https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit`
   - Open `Dashboard.html` via "Deploy" > "Test deployments" menu.

2. **Create a Test Lead**
   - Add a row to the **Qualified** tab in the Master Sheet:
     ```
     | Full_Name    | County | Lead_Score | Lead_Status | Phone_Number   |
     |--------------|--------|------------|-------------|----------------|
     | Test User    | Lee    | 85         | Hot         | +1239XXXXXXX   |
     ```

3. **Trigger the Concierge**
   - In GAS Script Editor, run: `processConciergeQueue()`
   - Or wait for the 10-minute trigger.

4. **Verify SMS Received**
   - Check the test phone for an SMS from Shamrock.
   - The message should be personalized and mention Lee County specifics.

### Expected Outcome
| Check | Expected |
|-------|----------|
| GAS Log | `✅ SMS Sent to Test User (Lee) via Twilio` |
| SMS Content | Personalized, mentions Lee County, ~160 chars |
| AI Used | No "Falling back" warning in logs |

---

## Test 2: SignNow Packet Generation

**Goal:** Verify 14-document packet generation and signing flow.

### Steps
1. Create a test case in the Dashboard with valid defendant/indemnitor data.
2. Click "Send Paperwork" → verify SignNow packet is created.
3. Open the signing link → verify embedded signing works on mobile.
4. Sign a document → verify `document.complete` webhook fires.
5. Check Google Drive for signed PDF filing.

---

## Test 3: Telegram Bot

**Goal:** Verify conversational intake and inline quote.

### Steps
1. Open `@ShamrockBail_bot` in Telegram.
2. Type `@ShamrockBail_bot 5000 2 lee` in any chat (inline mode).
3. Verify premium quote card appears (~$500, 2 charges, Lee County).
4. Start a conversation → test the intake flow.

---

## Test 4: Shannon Voice AI

**Goal:** Verify after-hours voice intake.

### Steps
1. Call the Shamrock office number after hours.
2. Shannon should answer and guide through intake.
3. Test `calculate_premium` tool: "How much is a $5,000 bond?"
4. Test `lookup_defendant`: "Can you look up John Smith in Lee County?"
5. Test fallback: "I want to speak to a person" → should trigger `transfer_to_bondsman`.

---

## Test 5: Wix ↔ GAS Bridge

**Goal:** Verify the core data bridge is functional.

### Steps
1. Navigate to `shamrockbailbonds.biz`.
2. Trigger a magic link auth flow.
3. Verify the link arrives via SMS.
4. Open the link → verify portal loads with correct member data.

---

## Test 6: Bail School

**Goal:** Verify Bail School interest capture.

### Steps
1. Navigate to: `https://www.shamrockbailbonds.biz/bail-school`
2. Fill out the interest form.
3. Check the `BailSchoolInterest` CMS collection for the new entry.

---

## Troubleshooting

### "AI Fetch Failed" Error
- **Cause:** Invalid API key or quota exceeded.
- **Fix:** Verify `OPENAI_API_KEY` is set correctly. Check OpenAI dashboard for quota.

### "Missing Twilio Credentials" Error
- **Cause:** Script Properties not set.
- **Fix:** Run `forceUpdateConfig()` or manually set in Script Properties.

### SMS Not Received
- **Cause:** Invalid phone number format or Twilio issue.
- **Fix:** Ensure phone is in E.164 format (`+1XXXXXXXXXX`). Check Twilio logs.

### "FailedToGetMyAccount: 404" in GitHub Actions
- **Cause:** Expired `WIX_CLI_API_KEY`.
- **Fix:** See [SECRETS_ROTATION_GUIDE.md](./SECRETS_ROTATION_GUIDE.md) section 5.

---

## Sign-Off Checklist

- [ ] Test 1 (AI Concierge Happy Path) — PASS
- [ ] Test 2 (SignNow Packet Generation) — PASS
- [ ] Test 3 (Telegram Bot) — PASS
- [ ] Test 4 (Shannon Voice AI) — PASS
- [ ] Test 5 (Wix ↔ GAS Bridge) — PASS
- [ ] Test 6 (Bail School) — PASS

**Verified By:** _______________  
**Date:** _______________
