# Magic Link Email Fix - Testing & Deployment Guide

## ✅ What Was Fixed

Added comprehensive error logging to the `sendMagicLinkEmail()` function in `portal-auth.jsw` to diagnose why emails aren't being sent despite CMS records being created.

**Changes Pushed to GitHub:** Commit `b937a2f`

---

## 🔍 Root Cause Analysis

The issue is that:
1. ✅ Magic link records ARE being created in the `Magiclinks` CMS collection
2. ✅ The GAS `handleSendEmail` function EXISTS and is properly wired (Code.js line 214, 1127-1143)
3. ✅ Test emails from GAS Script Editor work fine
4. ❌ But production emails from Wix → GAS are not arriving

**This indicates a configuration issue, not a code issue.**

---

## 🔧 Configuration Check Required

### Step 1: Verify Wix Secrets

The following secrets MUST be set correctly in Wix:

1. **GAS_WEB_APP_URL**
   - Should be: `https://script.google.com/a/macros/shamrockbailbonds.biz/s/AKfycbzM87__8sLZhhvWyUif2VN3u48LND7UldEbxMhhklttd3ikrW-jfbPEHWKMcLWWx-RNSQ/exec`
   - Check in: Wix Dashboard → Developer Tools → Secrets Manager

2. **GAS_API_KEY**
   - Must match the value set in GAS Script Properties (`GAS_API_KEY`)
   - Antigravity updated this - verify it matches on both sides

### Step 2: Verify GAS Script Properties

In your GAS project, check Script Properties:

1. Open: https://script.google.com/home
2. Find your project
3. Project Settings → Script Properties
4. Verify `GAS_API_KEY` exists and matches the Wix secret

---

## 🧪 Testing Instructions

### Test 1: Check Wix Logs

1. Go to portal-landing page
2. Enter email: `bbond239@gmail.com`
3. Click "Send Magic Link"
4. Immediately check Wix Logs (Developer Tools → Logging Tools → Wix Logs)
5. Look for these new debug messages:

```
🔧 sendMagicLinkEmail DEBUG:
  - GAS URL: SET or MISSING
  - API Key: SET or MISSING
  - Recipient: bbond239@gmail.com
  - Role: indemnitor
📤 Sending email request to GAS...
📥 GAS Response Status: 200
📥 GAS Response Body: {"success":true}
✅ Email sent successfully!
```

### Test 2: Check for Errors

If you see error messages like:
- `❌ Email send failed with status: 401` → **API Key mismatch**
- `❌ Email send failed with status: 404` → **Wrong GAS URL**
- `❌ GAS returned success: false` → **GAS internal error**

---

## 🐛 Debugging Scenarios

### Scenario 1: "GAS URL: MISSING" or "API Key: MISSING"

**Problem:** Wix Secrets not configured

**Fix:**
1. Go to Wix Dashboard → Developer Tools → Secrets Manager
2. Add/update secrets:
   - `GAS_WEB_APP_URL` = (your GAS web app URL)
   - `GAS_API_KEY` = (your API key)
3. Publish the site
4. Test again

### Scenario 2: "Email send failed with status: 401"

**Problem:** API Key mismatch between Wix and GAS

**Fix:**
1. In GAS: Project Settings → Script Properties → Check `GAS_API_KEY` value
2. In Wix: Secrets Manager → Check `GAS_API_KEY` value
3. Make sure they EXACTLY match (case-sensitive)
4. Update whichever is wrong
5. Publish Wix site
6. Test again

### Scenario 3: "Email send failed with status: 404"

**Problem:** Wrong GAS URL

**Fix:**
1. In GAS: Deploy → Manage Deployments → Copy Web App URL
2. In Wix: Secrets Manager → Update `GAS_WEB_APP_URL`
3. Publish Wix site
4. Test again

### Scenario 4: Logs show success but email still not arriving

**Problem:** Email delivery issue (not code issue)

**Possible causes:**
1. Gmail spam filter (check spam folder)
2. Email reputation issue (check Google Workspace admin console)
3. MailApp quota exceeded (check GAS quotas)

**Fix:**
1. Check spam folder
2. Add `admin@shamrockbailbonds.biz` to contacts
3. Check GAS execution logs for MailApp errors
4. Consider using SendGrid or another email service

---

## 📋 Deployment Checklist

- [ ] Pull latest code from GitHub (commit `b937a2f`)
- [ ] Verify `GAS_WEB_APP_URL` secret in Wix
- [ ] Verify `GAS_API_KEY` secret in Wix
- [ ] Verify `GAS_API_KEY` property in GAS
- [ ] Publish Wix site
- [ ] Test magic link request
- [ ] Check Wix logs for debug output
- [ ] Verify email arrives in inbox
- [ ] Test magic link login

---

## 🎯 Expected Outcome

After fixing the configuration:

1. User enters email on portal-landing
2. Wix logs show: `✅ Email sent successfully!`
3. User receives email within 30 seconds
4. Email contains working magic link
5. User clicks link → redirects to appropriate portal

---

## 📞 Next Steps

1. **Sync with Antigravity** - Share this guide
2. **Verify configuration** - Check secrets and properties
3. **Test thoroughly** - Use debug logs to diagnose
4. **Report results** - Share Wix logs if still failing

The code is now instrumented for full visibility. The logs will tell us exactly what's happening.
