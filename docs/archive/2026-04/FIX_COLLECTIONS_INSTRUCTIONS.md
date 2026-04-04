# Fix Portal Sessions & Magiclinks Collections - Step-by-Step

**Date:** February 2, 2026  
**Issue:** Authentication failing due to missing/incorrect collection fields  
**Solution:** Delete and re-upload collections with correct schemas

---

## 🎯 Goal

Ensure **Portal Sessions** and **Magiclinks** collections have ALL required fields with correct types.

---

## 📋 Step-by-Step Instructions

### STEP 1: Delete Existing Collections

1. Go to **Wix CMS Dashboard** (you're already there in the screenshot)
2. Find **"Portal Sessions"** collection
   - Click the **⋮** (three dots) menu
   - Select **"Delete Collection"**
   - Confirm deletion
3. Find **"Magiclinks"** collection
   - Click the **⋮** (three dots) menu
   - Select **"Delete Collection"**
   - Confirm deletion

**⚠️ Important:** Make sure you're deleting the correct collections. Look for exact name matches.

---

### STEP 2: Create Portal Sessions Collection

1. Click **"+ Create Collection"** button
2. **Collection Name:** `Portal Sessions`
3. Click **"Create"**
4. **Add Fields** (click "+ Add Field" for each):

| Field Name | Field Key | Type | Required |
|------------|-----------|------|----------|
| Session Token | `sessionToken` | Text | ✅ Yes |
| Person ID | `personId` | Text | ✅ Yes |
| Role | `role` | Text | ✅ Yes |
| Case ID | `caseId` | Text | ❌ No |
| Email | `email` | Text | ❌ No |
| Phone | `phone` | Text | ❌ No |
| Name | `name` | Text | ❌ No |
| Created At | `createdAt` | Date & Time | ✅ Yes |
| Expires At | `expiresAt` | Date & Time | ✅ Yes |
| Is Active | `isActive` | Boolean | ✅ Yes |
| Invalidated At | `invalidatedAt` | Date & Time | ❌ No |

5. **Set Permissions:**
   - Read: **Admin**
   - Create: **Admin**
   - Update: **Admin**
   - Delete: **Admin**

6. Click **"Save"**

---

### STEP 3: Create Magiclinks Collection

1. Click **"+ Create Collection"** button
2. **Collection Name:** `Magiclinks`
3. Click **"Create"**
4. **Add Fields** (click "+ Add Field" for each):

| Field Name | Field Key | Type | Required |
|------------|-----------|------|----------|
| Token | `token` | Text | ✅ Yes |
| Contact | `contact` | Text | ✅ Yes |
| Role | `role` | Text | ✅ Yes |
| Case ID | `caseId` | Text | ❌ No |
| Created At | `createdAt` | Date & Time | ✅ Yes |
| Expires At | `expiresAt` | Date & Time | ✅ Yes |
| Used | `used` | Boolean | ✅ Yes |
| Used At | `usedAt` | Date & Time | ❌ No |

5. **Set Permissions:**
   - Read: **Admin**
   - Create: **Admin**
   - Update: **Admin**
   - Delete: **Admin**

6. Click **"Save"**

---

### STEP 4: Verify Collections Work

1. Open **Wix Code** (if not already open)
2. Go to **Backend** section
3. Find **`test-collections.jsw`** file (I created this)
4. In the **Console** at the bottom, run:
   ```javascript
   import { testAllAuthCollections } from 'backend/test-collections';
   testAllAuthCollections();
   ```
5. **Expected Output:**
   ```
   ✅ Portal Sessions: PASS
   ✅ Magiclinks: PASS
   ✅ ALL TESTS PASSED
   ```

6. If you see **❌ FAIL**, check the error message and verify:
   - Collection name is exactly correct (case-sensitive)
   - All fields exist with correct field keys
   - Field types match the schema

---

### STEP 5: Test Authentication

1. Go to your site: `https://www.shamrockbailbonds.biz/portal-landing`
2. Enter your email: `admin@shamrockbailbonds.biz`
3. Click **"Get Started"** or **"Send Magic Link"**
4. Check your email for the magic link
5. Click the link
6. **Expected:** You should be redirected to the staff portal with NO 401 errors
7. Open browser console (F12) and verify:
   - ✅ No "401 Unauthorized" errors
   - ✅ No "Failed to load resources" errors
   - ✅ Session token appears in URL: `?st=...`

---

## 🔧 Alternative: Upload CSV Method

If you prefer to upload CSV files instead of manually creating fields:

### For Portal Sessions:

1. Download: `/database/Portal_Sessions_CORRECTED.csv`
2. In Wix CMS, click **"+ Create Collection"**
3. Select **"Import from CSV"**
4. Upload `Portal_Sessions_CORRECTED.csv`
5. **Collection Name:** `Portal Sessions`
6. Map fields (should auto-map)
7. Set permissions to **Admin only**
8. Save

### For Magiclinks:

1. Download: `/database/Magiclinks_CORRECTED.csv`
2. In Wix CMS, click **"+ Create Collection"**
3. Select **"Import from CSV"**
4. Upload `Magiclinks_CORRECTED.csv`
5. **Collection Name:** `Magiclinks`
6. Map fields (should auto-map)
7. Set permissions to **Admin only**
8. Save

---

## ✅ Success Criteria

After completing these steps, you should have:

- ✅ **Portal Sessions** collection with 11 fields
- ✅ **Magiclinks** collection with 8 fields
- ✅ Both collections set to **Admin-only** permissions
- ✅ Test script passes with "ALL TESTS PASSED"
- ✅ Authentication works with no 401 errors
- ✅ Magic link login functional
- ✅ Session persistence working

---

## 🚨 Troubleshooting

### Issue: "Collection not found" error

**Solution:** Double-check collection name is exactly `Portal Sessions` (with space) and `Magiclinks` (no space, capital M)

### Issue: "Field not found" error

**Solution:** Verify field keys match exactly (case-sensitive):
- `sessionToken` (not `SessionToken` or `session_token`)
- `isActive` (not `IsActive` or `is_active`)

### Issue: Test script still fails

**Solution:** 
1. Check browser console for specific error
2. Verify all required fields are marked as "Required" in CMS
3. Verify permissions are set to Admin only
4. Try refreshing the Wix editor

### Issue: 401 errors persist

**Solution:**
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Verify `WIX_API_KEY` is set in Wix Secrets Manager
4. Check that backend functions use `suppressAuth: true`

---

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for specific error messages
2. Run the test script and share the output
3. Verify collection schemas match the documentation exactly
4. Ensure all environment variables are set correctly

---

**Once completed, authentication should work immediately!**
