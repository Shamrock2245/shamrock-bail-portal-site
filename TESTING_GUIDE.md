# 🧪 TESTING GUIDE — Phase 4 Verification

> **Purpose:** Validate the AI Concierge integration is working end-to-end.
> **Last Updated:** January 2026

---

## Prerequisites

Before running tests, ensure the following are configured in GAS Script Properties:

| Property | Description | Status |
|----------|-------------|--------|
| `GEMINI_API_KEY` | Google AI API Key | ✅ Required |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | ✅ Required |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ✅ Required |
| `TWILIO_PHONE_NUMBER` | Twilio From Number | ✅ Required |
| `SLACK_WEBHOOK_LEADS` | Slack Webhook URL | Optional |

---

## Test 1: Happy Path (Lee County)

**Goal:** Verify a high-urgency Lee County lead triggers AI-generated SMS.

### Steps

1. **Open the GAS Dashboard**
   - Navigate to: `https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit`
   - Open `Dashboard.html` via the "Deploy" > "Test deployments" menu.

2. **Create a Test Lead**
   - Use the bookmarklet or manually add a row to the **Qualified** tab in the Master Sheet:
     ```
     | Full_Name    | County | Lead_Score | Lead_Status | Phone_Number   |
     |--------------|--------|------------|-------------|----------------|
     | Test User    | Lee    | 85         | Hot         | +1239XXXXXXX   |
     ```
   - Replace `+1239XXXXXXX` with a real test phone number.

3. **Trigger the Concierge**
   - In the GAS Script Editor, run: `processConciergeQueue()`
   - Or wait for the 10-minute trigger to fire.

4. **Check Logs**
   - Open: **View > Executions** in the GAS Editor.
   - Look for:
     - `🤖 AI Concierge: Starting run...`
     - `✅ SMS Sent to Test User (Lee) via Twilio`
   - If you see `Falling back to legacy RAG template`, the Gemini API call failed.

5. **Verify SMS Received**
   - Check the test phone for an SMS from Shamrock.
   - The message should be personalized and mention Lee County specifics.

### Expected Outcome

| Check | Expected |
|-------|----------|
| GAS Log | `✅ SMS Sent to Test User (Lee) via Twilio` |
| SMS Content | Personalized, mentions Lee County, ~160 chars |
| Gemini Used | No "Falling back" warning in logs |

---

## Test 2: Northern Expansion (Manatee/Pinellas)

**Goal:** Verify AI knows the specific jail locations and rules for expanded counties.

### Steps

1. Add a test lead with `County = Manatee` and `Lead_Score = 75`.
2. Run `processConciergeQueue()`.
3. Verify the SMS mentions Bradenton or Manatee-specific details.

### Expected Outcome

- SMS should reference "Bradenton" or "Port Manatee facility".
- No generic fallback text.

---

## Test 3: Fallback Behavior

**Goal:** Verify the system gracefully falls back if Gemini fails.

### Steps

1. Temporarily remove or invalidate the `GEMINI_API_KEY` in Script Properties.
2. Add a test lead and run `processConciergeQueue()`.
3. Check logs for: `Falling back to legacy RAG template (No API Key or Error)`.
4. Verify SMS is still sent (using template).
5. **Restore the API key after testing.**

### Expected Outcome

- SMS is sent using the rule-based template.
- No crash or unhandled error.

---

## Test 4: Education Flow (Bail School)

**Goal:** Verify Bail School interest capture works.

### Steps

1. Navigate to: `https://www.shamrockbailbonds.biz/bail-school`
2. Fill out the interest form.
3. Check the `BailSchoolInterest` CMS collection for the new entry.

### Expected Outcome

- Form submits successfully.
- Entry appears in CMS with correct data.

---

## Troubleshooting

### "Gemini Fetch Failed" Error

- **Cause:** Invalid API key or quota exceeded.
- **Fix:** Verify `GEMINI_API_KEY` is set correctly. Check Google AI Studio for quota.

### "Missing Twilio Credentials" Error

- **Cause:** Script Properties not set.
- **Fix:** Run `forceUpdateConfig()` or manually set in Script Properties.

### SMS Not Received

- **Cause:** Invalid phone number format or Twilio issue.
- **Fix:** Ensure phone is in E.164 format (`+1XXXXXXXXXX`). Check Twilio logs.

---

## Sign-Off Checklist

- [ ] Test 1 (Lee County Happy Path) — PASS
- [ ] Test 2 (Northern Expansion) — PASS
- [ ] Test 3 (Fallback Behavior) — PASS
- [ ] Test 4 (Bail School) — PASS

**Verified By:** _______________  
**Date:** _______________
