# Magic Link Email Fix Guide

**Issue:** Magic link emails are not being sent when users try to log in to the portal.

**Root Cause:** Wix Secrets Manager is missing required configuration for Google Apps Script backend communication.

---

## ✅ Solution: Add Missing Secrets to Wix

### Required Secrets

You need to add 2 secrets to Wix Secrets Manager:

1. **GAS_WEB_APP_URL** - Your Google Apps Script web app URL
2. **GAS_API_KEY** - Shared secret for authentication

---

## 📋 Step-by-Step Fix

### Step 1: Get Your GAS Web App URL

1. Open your Google Apps Script project:
   - URL: https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit

2. Click **Deploy** → **Manage deployments**

3. Copy the **Web app URL** (it looks like):
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

4. Save this URL - you'll need it in Step 3

### Step 2: Set GAS API Key

1. Open your Google Apps Script project

2. Open file: `SetProperties.js`

3. Find line 13:
   ```javascript
   'GAS_API_KEY': 'REPLACE_WITH_GAS_API_KEY',
   ```

4. Replace with a secure random string (or use this one):
   ```javascript
   'GAS_API_KEY': 'shamrock_gas_2026_secure_key_' + Math.random().toString(36).substring(2, 15),
   ```

   **Example secure key:**
   ```
   shamrock_gas_2026_secure_key_a7b3c9d2e5f8
   ```

5. Run the function: `ADMIN_UpdateAllProperties()`

6. Check execution log to confirm it was set

7. **IMPORTANT:** Copy the API key you just set - you'll need it in Step 3

### Step 3: Add Secrets to Wix

1. Open Wix Editor for your site

2. Go to **Settings** (gear icon) → **Secrets Manager**

3. Click **+ New Secret**

4. Add first secret:
   - **Name:** `GAS_WEB_APP_URL`
   - **Value:** (paste the URL from Step 1)
   - Click **Add**

5. Click **+ New Secret** again

6. Add second secret:
   - **Name:** `GAS_API_KEY`
   - **Value:** (paste the API key from Step 2)
   - Click **Add**

7. **Publish your site** for changes to take effect

---

## 🧪 Testing

### Test 1: Check Secrets are Loaded

1. Open browser console on your portal-landing page

2. Look for this log message:
   ```
   🔧 sendMagicLinkEmail DEBUG:
     - GAS URL: SET
     - API Key: SET
   ```

3. If you see "MISSING" instead of "SET", the secrets aren't configured correctly

### Test 2: Send Test Magic Link

1. Go to: https://www.shamrockbailbonds.biz/portal-landing

2. Enter a test email (your own email)

3. Click "Get Started"

4. Check for:
   - ✅ "Sending your secure link..." message
   - ✅ "Check your email for your secure link" success message
   - ✅ Email arrives in inbox within 1-2 minutes

5. Check browser console for errors:
   - ❌ If you see "Failed to send email", check GAS logs
   - ❌ If you see "GAS Network Error", check the web app URL
   - ❌ If you see "Internal Configuration Error", secrets aren't set

### Test 3: Verify Email Content

1. Open the magic link email

2. Verify it contains:
   - ✅ "Shamrock Bail Bonds" header
   - ✅ "Access Your Portal" button
   - ✅ Correct role (Cosigner, Client, Staff, or Administrator)
   - ✅ Link expires in 24 hours notice
   - ✅ Company contact info in footer

3. Click the "Access Your Portal" button

4. Verify you're redirected to the correct portal page

---

## 🔍 Troubleshooting

### Error: "Internal Configuration Error"

**Cause:** Secrets not set in Wix Secrets Manager

**Fix:**
1. Double-check secret names are EXACT (case-sensitive):
   - `GAS_WEB_APP_URL` (not `GAS_WEB_APP_Url` or `gas_web_app_url`)
   - `GAS_API_KEY` (not `GAS_Api_Key` or `gas_api_key`)

2. Verify secrets have values (not empty)

3. Publish site after adding secrets

### Error: "GAS Network Error (403)"

**Cause:** GAS API key mismatch

**Fix:**
1. Check the API key in GAS Script Properties matches Wix Secrets Manager

2. Run this in GAS Editor to verify:
   ```javascript
   function checkApiKey() {
     const key = PropertiesService.getScriptProperties().getProperty('GAS_API_KEY');
     Logger.log('Current GAS_API_KEY: ' + key);
   }
   ```

3. Update Wix secret if they don't match

### Error: "GAS Network Error (404)"

**Cause:** Wrong web app URL

**Fix:**
1. Go to GAS project → Deploy → Manage deployments

2. Make sure deployment is **Active**

3. Copy the correct URL (should end with `/exec`)

4. Update `GAS_WEB_APP_URL` in Wix Secrets Manager

5. Publish site

### Error: "Failed to send email: ..."

**Cause:** GAS MailApp issue

**Fix:**
1. Open GAS Editor

2. Run this test function:
   ```javascript
   function testEmailSimple() {
     const email = Session.getActiveUser().getEmail();
     Logger.log("Attempting to send email to: " + email);
     try {
       MailApp.sendEmail({
         to: email,
         subject: "Test Email from Script Editor",
         body: "If you receive this, MailApp is working."
       });
       Logger.log("Email sent successfully.");
       return "Sent";
     } catch (e) {
       Logger.log("Error sending email: " + e.message);
       return "Error: " + e.message;
     }
   }
   ```

3. Check if test email arrives

4. If test email works but magic links don't, check GAS execution logs for errors

### Emails Not Arriving (No Errors)

**Possible causes:**

1. **Spam folder** - Check spam/junk folder

2. **Email provider blocking** - Some providers block automated emails

3. **GAS quota exceeded** - Check GAS quotas in Apps Script dashboard

4. **Recipient email typo** - Verify email address is correct

---

## 📊 Verification Checklist

Before marking this as complete, verify:

- [ ] GAS web app is deployed and URL is copied
- [ ] GAS_API_KEY is set in GAS Script Properties
- [ ] GAS_WEB_APP_URL is added to Wix Secrets Manager
- [ ] GAS_API_KEY is added to Wix Secrets Manager (same value as GAS)
- [ ] Wix site is published after adding secrets
- [ ] Test email sent successfully
- [ ] Test email received in inbox
- [ ] Magic link in email works and redirects correctly
- [ ] Browser console shows no errors
- [ ] GAS execution logs show successful email send

---

## 🔐 Security Notes

**API Key Security:**
- The GAS_API_KEY is a shared secret between Wix and GAS
- It prevents unauthorized access to your GAS backend
- Keep it secret - never commit to GitHub or share publicly
- Rotate it every 90 days for security

**Web App URL:**
- The web app URL is public but requires API key to use
- Anyone can see the URL but can't use it without the key
- If compromised, redeploy the GAS project to get a new URL

---

## 📞 Support

If you're still having issues after following this guide:

1. Check GAS execution logs for detailed error messages
2. Check Wix Site Monitoring for backend errors
3. Check browser console for frontend errors
4. Verify all secrets are spelled correctly (case-sensitive)
5. Try redeploying the GAS web app

---

## 🎯 Quick Reference

**GAS Project:**
https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit

**GAS Spreadsheet:**
https://docs.google.com/spreadsheets/d/121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E/edit

**Wix Site:**
https://www.shamrockbailbonds.biz/portal-landing

**Test Email Function:** `testEmailSimple()` in GAS Editor

**Setup Function:** `ADMIN_UpdateAllProperties()` in SetProperties.js

---

**Last Updated:** February 3, 2026  
**Status:** Ready for implementation
