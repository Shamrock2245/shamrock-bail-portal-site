# 🚀 QUICK FIX STEPS - Wix CLI Sync Issue

## ✅ What Was Fixed

**Primary Issue:** The file `Locate .kyk1r.js` had a trailing space that prevented Wix CLI from syncing it to the Editor.

**Fix Applied:** Renamed to `Locate.kyk1r.js` (no trailing space)

---

## 📋 IMMEDIATE STEPS TO TAKE

### 1. Pull Latest Changes (Already Done in Sandbox)

```bash
cd /path/to/shamrock-bail-portal-site
git pull origin main
```

### 2. Stop Wix Dev Server

If `wix dev` is currently running:
- Press `Ctrl+C` in the terminal, OR
- Run: `pkill -f "wix dev"`

### 3. Restart Wix Dev Server

```bash
npm run dev
```

### 4. Verify in Wix Editor

1. Open Wix Editor in browser
2. Navigate to **Locate** page
3. Open **Code Panel** (Dev Mode)
4. **Expected Result:** You should now see the full code from `Locate.kyk1r.js`

### 5. Test in Preview

1. Click **Preview** in Wix Editor
2. Navigate to the Locate page
3. **Expected Result:** County repeater should populate with data

---

## 🔍 If Code Still Doesn't Appear

### Option A: Force Refresh

1. In Wix Editor, click **Dev Mode** → **Sync**
2. Refresh the Editor page (F5)
3. Check Code Panel again

### Option B: Clear Cache & Restart

```bash
# Stop wix dev
pkill -f "wix dev"

# Clear node_modules (optional but thorough)
rm -rf node_modules
npm install

# Restart
npm run dev
```

### Option C: Verify Page Name in Editor

1. Open Wix Editor
2. Go to **Locate** page
3. Click **Settings** → **Page Info**
4. Check the **exact page name**
5. If it's NOT "Locate" (e.g., "Locate An Inmate"), rename the file:
   ```bash
   cd src/pages
   mv Locate.kyk1r.js "Locate An Inmate.kyk1r.js"
   ```

---

## 🔧 Verify Other Pages

Run the verification script:

```bash
./verify-wix-pages.sh
```

This will check:
- ✅ Locate.kyk1r.js
- ✅ How Bail Works.lrh65.js
- ✅ How to Become a Bondsman.y8dfc.js

---

## 📞 Next Actions

1. **Test the Locate page** in Preview
2. **Check the other two pages** (How Bail Works, Bail School)
3. If those pages also have blank code panels:
   - Verify the exact page names in Wix Editor
   - Rename files if needed
   - Restart `wix dev`

---

## 📚 Full Documentation

For detailed troubleshooting, see:
- **WIX_SYNC_FIX_GUIDE.md** - Complete guide with all solutions
- **verify-wix-pages.sh** - Automated verification script

---

## ✅ Success Criteria

- [ ] Code appears in Wix Editor for Locate page
- [ ] Repeater populates with counties in Preview
- [ ] No console errors in Wix Editor
- [ ] All three pages (Locate, How Bail Works, Bail School) sync correctly

---

**Status:** Fix deployed to GitHub (Commit: 71e7348)  
**Last Updated:** January 14, 2026
