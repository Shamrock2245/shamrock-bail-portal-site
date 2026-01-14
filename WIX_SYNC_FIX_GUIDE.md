# Wix CLI Code Sync Fix Guide

## 🔴 Problem Summary

Code written locally for several pages is **not appearing** in the Wix Editor's code panel, causing repeaters and dynamic logic to render blank on Preview.

**Affected Pages:**
- **Locate An Inmate** (Page ID: `kyk1r`)
- **How Bail Works** (Page ID: `lrh65`)
- **How to Become a Bondsman** (Page ID: `y8dfc`)

---

## ✅ Root Cause Identified

**The primary issue**: The file `Locate .kyk1r.js` had a **trailing space** in the filename (`Locate ` instead of `Locate`), causing a mismatch with the Wix Editor page name.

### How Wix CLI File Mapping Works

Wix CLI expects files to be named: **`PageName.PageID.js`**

Where:
- `PageName` = The **exact** name of the page in the Wix Editor (including spaces)
- `PageID` = The unique page identifier (e.g., `kyk1r`, `lrh65`, `y8dfc`)

**Example:**
- ✅ Correct: `Locate.kyk1r.js` (if page is named "Locate")
- ❌ Wrong: `Locate .kyk1r.js` (trailing space causes mismatch)

---

## 🔧 Fixes Applied

### Fix #1: Renamed Locate Page File ✅

**Before:** `src/pages/Locate .kyk1r.js` (with trailing space)  
**After:** `src/pages/Locate.kyk1r.js` (no trailing space)

This fix has been applied and staged in Git.

---

## 📋 Step-by-Step Sync Instructions

### Step 1: Commit the File Rename

```bash
cd /home/ubuntu/shamrock-bail-portal-site

# Commit the rename
git commit -m "fix: rename Locate page file to remove trailing space for Wix CLI sync

- Renamed 'Locate .kyk1r.js' to 'Locate.kyk1r.js'
- Fixes Wix CLI file mapping issue causing code not to appear in Editor
- Ensures local code is source of truth for Locate An Inmate page"

# Push to GitHub
git push origin main
```

### Step 2: Stop Wix Dev Server (if running)

```bash
# Press Ctrl+C in the terminal where wix dev is running
# Or kill the process
pkill -f "wix dev"
```

### Step 3: Clear Wix CLI Cache (Optional but Recommended)

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Or just clear Wix cache
rm -rf .wix
```

### Step 4: Restart Wix Dev Server

```bash
npm run dev
```

### Step 5: Force Sync in Wix Editor

1. Open the Wix Editor in your browser
2. Go to **Dev Mode** (top bar)
3. Click **Code Files** panel
4. Look for the **Locate** page in the Pages section
5. If code appears, you're good! ✅
6. If not, try:
   - Refresh the Editor page
   - Close and reopen the Editor
   - Click "Sync" in the Dev Mode panel

---

## 🔍 Verifying Other Pages

### Check "How Bail Works" (lrh65)

**Current filename:** `How Bail Works.lrh65.js`

**Verification steps:**
1. Open Wix Editor
2. Navigate to the "How Bail Works" page
3. Check the **exact page name** in the page settings
4. If it matches "How Bail Works" exactly, the file is correct ✅
5. If the page has a different name (e.g., "How Bail Works Page"), rename the file:
   ```bash
   cd src/pages
   mv "How Bail Works.lrh65.js" "How Bail Works Page.lrh65.js"
   ```

### Check "How to Become a Bondsman" (y8dfc)

**Current filename:** `How to Become a Bondsman.y8dfc.js`

**Verification steps:**
1. Open Wix Editor
2. Navigate to the "How to Become a Bondsman" page
3. Check the **exact page name** in the page settings
4. If it matches "How to Become a Bondsman" exactly, the file is correct ✅
5. If the page has a different name, rename the file accordingly

---

## 🚨 Common Issues & Solutions

### Issue 1: Code Still Not Appearing After Rename

**Solution:**
1. Check the **exact page name** in Wix Editor (Settings → Page Info)
2. Ensure the local filename matches **character-for-character**
3. Check for:
   - Extra spaces
   - Different capitalization
   - Special characters

### Issue 2: Wix CLI Shows "Orphaned Files"

**Solution:**
This means the local file doesn't match any page in the Editor.

1. List all orphaned files:
   ```bash
   # Wix CLI will show this in the console when running wix dev
   ```
2. Either:
   - Rename the local file to match an existing page
   - Delete the orphaned file if it's no longer needed
   - Create a new page in the Editor with the matching name

### Issue 3: Changes Not Reflecting in Preview

**Solution:**
1. Save the file in VS Code
2. Wait for Wix CLI to detect the change (watch the console)
3. Refresh the Preview in the Editor
4. If still not working, restart `wix dev`

### Issue 4: Dynamic Page vs. Static Page Confusion

**Important:** The "Locate" page should be a **static page**, not a dynamic page.

**Verification:**
1. Open Wix Editor
2. Go to the Locate page settings
3. Check if it's marked as "Dynamic Page"
4. If it is, and you're not using Wix's dynamic page routing, change it to static

**Note:** The code in `Locate.kyk1r.js` manually handles routing via `wix-location`, so it doesn't need to be a dynamic page.

---

## 📝 Page Name Verification Checklist

Use this checklist to verify all page names match:

| Page ID | Expected Filename | Wix Editor Page Name | Status |
|---------|-------------------|----------------------|--------|
| `kyk1r` | `Locate.kyk1r.js` | ❓ (Check in Editor) | ✅ Fixed |
| `lrh65` | `How Bail Works.lrh65.js` | ❓ (Check in Editor) | ⏸️ Pending |
| `y8dfc` | `How to Become a Bondsman.y8dfc.js` | ❓ (Check in Editor) | ⏸️ Pending |

**Action Required:** Check the exact page names in the Wix Editor and update this table.

---

## 🔄 Force Push Local Code to Wix (Nuclear Option)

If all else fails, you can force the local code to be the source of truth:

### Option 1: Delete Page Code in Editor, Then Sync

1. Open Wix Editor
2. Go to the problematic page
3. Open the Code panel
4. Delete all code in the Editor
5. Save in Editor
6. In VS Code, make a small change to the local file (add a comment)
7. Save the file
8. Wix CLI should detect the change and push it to the Editor

### Option 2: Recreate the Page

1. In Wix Editor, duplicate the problematic page
2. Delete the original page
3. Rename the duplicate to the original name
4. Wix CLI should now sync the local code to the new page

### Option 3: Use Wix CLI Commands

```bash
# Force sync types
npm run postinstall

# Or manually
npx wix sync-types

# Restart dev server
npm run dev
```

---

## 📊 Verification Script

Create this script to verify all page files:

```bash
#!/bin/bash
# verify-wix-pages.sh

echo "=== Wix Page File Verification ==="
echo ""

cd src/pages

echo "Checking for files with trailing spaces..."
for file in *.js; do
  if [[ "$file" =~ \  ]]; then
    echo "⚠️  WARNING: '$file' contains spaces that may cause issues"
  fi
done

echo ""
echo "Current page files:"
ls -1 *.js | grep -E "\.(kyk1r|lrh65|y8dfc)\.js"

echo ""
echo "=== Verification Complete ==="
```

**Usage:**
```bash
chmod +x verify-wix-pages.sh
./verify-wix-pages.sh
```

---

## 🎯 Expected Outcome

After applying these fixes:

1. ✅ `Locate.kyk1r.js` code appears in Wix Editor
2. ✅ Repeater on Locate page populates with counties
3. ✅ Preview shows the correct content
4. ✅ All three pages sync correctly

---

## 📞 Next Steps

1. **Commit and push** the Locate page rename
2. **Restart Wix dev server**
3. **Verify in Wix Editor** that the code appears
4. **Check the other two pages** and rename if needed
5. **Test in Preview** to ensure everything works

---

## 🔗 Additional Resources

- [Wix CLI Documentation](https://dev.wix.com/docs/develop-websites/articles/wix-cli/getting-started/introduction)
- [Wix Velo File Structure](https://dev.wix.com/docs/develop-websites/articles/wix-cli/getting-started/file-structure)
- [Troubleshooting Wix CLI](https://dev.wix.com/docs/develop-websites/articles/wix-cli/troubleshooting)

---

**Last Updated:** January 14, 2026  
**Status:** Fix applied, awaiting verification in Wix Editor
