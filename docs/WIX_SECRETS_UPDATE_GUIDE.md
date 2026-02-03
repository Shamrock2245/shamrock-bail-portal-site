# Wix Secrets Manager - Magic Link Fix

**Issue:** Magic links not sending emails  
**Root Cause:** Secrets may be incorrect or misnamed  
**Solution:** Verify and update Wix Secrets Manager

---

## ✅ Correct Values (Confirmed)

These are the EXACT values that must be in Wix Secrets Manager:

### Secret 1: GAS_API_KEY
```
Name: GAS_API_KEY
Value: shamrock-secure-2026
```

### Secret 2: GAS_WEB_APP_URL
```
Name: GAS_WEB_APP_URL
Value: https://script.google.com/macros/s/AKfycbw6rv8C3vDSSESiIUrJJ7Db8vAhKfuyoMNug7kdx_a37stdiqA5GPVWQwf5hFA5FzuRmg/exec
```

---

## 📋 Step 1: Verify GAS Script Properties

1. Open your Google Apps Script project:
   https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit

2. Create a new file or open an existing one

3. Copy the verification script from `/home/ubuntu/verify_gas_setup.js`

4. Run function: `verifyAndUpdateGASSetup()`

5. Check execution log - it should show:
   ```
   ✅ ALL PROPERTIES ARE CORRECT!
   ```

6. If it says "NEEDS UPDATE", the function will automatically fix it

---

## 📋 Step 2: Update Wix Secrets Manager

### Option A: Update Existing Secrets

1. Open Wix Editor

2. Go to **Settings** (gear icon) → **Secrets Manager**

3. Find **GAS_API_KEY**:
   - Click the **Edit** (pencil) icon
   - Update value to: `shamrock-secure-2026`
   - Click **Save**

4. Find **GAS_WEB_APP_URL**:
   - Click the **Edit** (pencil) icon
   - Update value to: `https://script.google.com/macros/s/AKfycbw6rv8C3vDSSESiIUrJJ7Db8vAhKfuyoMNug7kdx_a37stdiqA5GPVWQwf5hFA5FzuRmg/exec`
   - Click **Save**

### Option B: Delete and Recreate (Recommended)

1. Open Wix Editor

2. Go to **Settings** (gear icon) → **Secrets Manager**

3. Delete existing secrets:
   - Find `GAS_API_KEY` → Click **Delete** → Confirm
   - Find `GAS_WEB_APP_URL` → Click **Delete** → Confirm

4. Create new secrets:
   - Click **+ New Secret**
   - Name: `GAS_API_KEY`
   - Value: `shamrock-secure-2026`
   - Click **Add**

5. Create second secret:
   - Click **+ New Secret**
   - Name: `GAS_WEB_APP_URL`
   - Value: `https://script.google.com/macros/s/AKfycbw6rv8C3vDSSESiIUrJJ7Db8vAhKfuyoMNug7kdx_a37stdiqA5GPVWQwf5hFA5FzuRmg/exec`
   - Click **Add**

6. **CRITICAL:** Click **Publish** to deploy changes

---

## 📋 Step 3: Test Email Sending

### Test 1: GAS Email Test

1. Open Google Apps Script Editor

2. Run function: `testMagicLinkEmail()`

3. Check execution log for:
   ```
   ✅ TEST EMAIL SENT SUCCESSFULLY!
   ```

4. Check your email inbox (the email associated with your Google account)

5. Verify you received the test email

### Test 2: Wix Integration Test

1. Open Google Apps Script Editor

2. Run function: `testWixIntegration()`

3. Check execution log - it should show the correct API key and request format

### Test 3: End-to-End Magic Link Test

1. Open browser in **Incognito/Private mode**

2. Go to: https://www.shamrockbailbonds.biz/portal-landing

3. Enter your email address

4. Click **Get Started**

5. Watch browser console (F12) for logs:
   ```
   🔧 sendMagicLinkEmail DEBUG:
     - GAS URL: SET
     - API Key: SET
   ```

6. If you see "MISSING", secrets aren't configured correctly

7. Check for success message:
   ```
   Check your email for your secure link
   ```

8. Check your email inbox

9. Verify you received the magic link email

10. Click the "Access Your Portal" button

11. Verify you're redirected to the correct portal

---

## 🔍 Troubleshooting

### Issue: "Internal Configuration Error"

**Cause:** Secrets not found in Wix Secrets Manager

**Fix:**
1. Verify secret names are EXACT (case-sensitive):
   - `GAS_API_KEY` (not `gas_api_key` or `GAS_Api_Key`)
   - `GAS_WEB_APP_URL` (not `GAS_Web_App_URL`)

2. Verify secrets have values (not empty)

3. Publish site after adding/updating secrets

4. Clear browser cache and try again

### Issue: "GAS Network Error (403)"

**Cause:** API key mismatch between Wix and GAS

**Fix:**
1. Run `verifyAndUpdateGASSetup()` in GAS Editor

2. Check execution log for current API key

3. Update Wix secret to match GAS property

4. Publish Wix site

5. Test again

### Issue: "GAS Network Error (404)"

**Cause:** Wrong web app URL

**Fix:**
1. Go to GAS project → **Deploy** → **Manage deployments**

2. Verify deployment is **Active**

3. Copy the correct URL (should end with `/exec`)

4. Update `GAS_WEB_APP_URL` in Wix Secrets Manager

5. Publish Wix site

6. Test again

### Issue: Console shows "GAS URL: MISSING" or "API Key: MISSING"

**Cause:** Secrets not loaded by Wix backend

**Fix:**
1. Verify secrets exist in Wix Secrets Manager

2. Verify secret names are EXACT (case-sensitive)

3. Publish site (secrets only load after publish)

4. Wait 1-2 minutes for deployment

5. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

6. Test again

### Issue: Email not arriving

**Possible causes:**

1. **Spam folder** - Check spam/junk folder

2. **Email provider blocking** - Try a different email address

3. **GAS quota exceeded** - Check GAS quotas in Apps Script dashboard

4. **MailApp permissions** - Run `testMagicLinkEmail()` to verify permissions

---

## ✅ Verification Checklist

Before marking this as complete, verify:

- [ ] GAS_API_KEY is set in GAS Script Properties
- [ ] GAS_WEB_APP_URL is set in GAS Script Properties
- [ ] GAS_API_KEY is added to Wix Secrets Manager (exact value: `shamrock-secure-2026`)
- [ ] GAS_WEB_APP_URL is added to Wix Secrets Manager (exact URL)
- [ ] Wix site is published after updating secrets
- [ ] `testMagicLinkEmail()` runs successfully in GAS
- [ ] Test email received in inbox
- [ ] Browser console shows "GAS URL: SET" and "API Key: SET"
- [ ] Magic link email sent successfully from portal-landing
- [ ] Magic link email received in inbox
- [ ] Magic link works and redirects correctly

---

## 📊 Expected Console Output

When everything is working correctly, you should see this in the browser console:

```
🚀 Portal Landing v2.2: Fix Query Scope
📧 Sending magic link to: test@example.com
🔧 sendMagicLinkEmail DEBUG:
  - GAS URL: SET
  - API Key: SET
  - Recipient: te***@example.com
  - Role: indemnitor
📤 Sending email request to GAS...
📥 GAS Response Status: 200
📥 GAS Response Body: {"success":true}
✅ Parsed GAS response: {success: true}
✅ Email sent successfully!
```

---

## 🔐 Security Notes

**API Key:**
- The API key `shamrock-secure-2026` is a shared secret
- It must match EXACTLY in both GAS and Wix
- Keep it secret - never commit to GitHub
- Rotate every 90 days for security

**Web App URL:**
- The URL is public but requires API key to use
- Anyone can see the URL but can't use it without the key
- If compromised, redeploy GAS to get a new URL

---

## 📞 Support

If you're still having issues:

1. Run all 3 test functions in GAS Editor
2. Check GAS execution logs for errors
3. Check Wix Site Monitoring for backend errors
4. Check browser console for frontend errors
5. Verify all values are EXACT (no extra spaces, correct case)

---

**Last Updated:** February 3, 2026  
**Status:** Ready for implementation  
**Verified Values:** Confirmed correct
