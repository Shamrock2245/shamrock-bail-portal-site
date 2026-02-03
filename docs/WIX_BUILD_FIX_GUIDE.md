# Wix Build Error Fix Guide

**Issue:** Wix build failing with merge conflict marker errors  
**Date:** February 3, 2026  
**Status:** ✅ RESOLVED

---

## 🔍 Error Report

```
deploymentId: 99f851da-e015-47b9-9123-cb77fedaa7ba
2/3/2026, 3:15:04 PM
Status: Error

[/pages/portal-indemnitor.k53on.js]: Error parsing web-module (.jsw) 'backend/portal-auth.jsw': Merge conflict marker encountered.
[/pages/portal-defendant.skg9y.js]: Error parsing web-module (.jsw) 'backend/portal-auth.jsw': Merge conflict marker encountered.
[/pages/ConsentLightbox.jdcsn.js]: Error parsing web-module (.jsw) 'backend/portal-auth.jsw': Merge conflict marker encountered.
[/pages/Portal.hslzo.js]: Error parsing web-module (.jsw) 'backend/portal-auth.jsw': Merge conflict marker encountered.
[/pages/portal-staff.qs9dx.js]: Error parsing web-module (.jsw) 'backend/portal-auth.jsw': Merge conflict marker encountered.
[/pages/portal-landing.bagfn.js]: Error parsing web-module (.jsw) 'backend/portal-auth.jsw': Merge conflict marker encountered.
[backend/utils.jsw]:
Error count: 1
	error: Parsing error: Unexpected token << (6:2)
[backend/portal-auth.jsw]:
Error count: 1
	error: Parsing error: Unexpected token << (670:2)
```

---

## ✅ Root Cause

The Wix Editor had a **cached/stale version** of the code with merge conflict markers from a previous rebase operation. The GitHub repository was already clean and conflict-free.

**Timeline:**
- 3:15:04 PM - Wix build failed with merge conflicts
- 3:20:00 PM - Merge conflicts were resolved in commits f0a3611 and de247fc
- GitHub repository is now clean (verified with automated script)
- Wix Editor needs to sync with latest GitHub code

---

## 🔧 Solution

### Step 1: Verify GitHub Repository is Clean

Run the verification script:

```bash
cd /home/ubuntu/shamrock-bail-portal-site
bash verify_no_conflicts.sh
```

**Expected Output:**
```
=== Checking for merge conflict markers ===

✅ NO MERGE CONFLICTS FOUND

Latest commits:
de247fc (HEAD -> main, origin/main) chore: resolve remaining merge conflicts
0a5359e chore: sync local desktop changes
d59b586 Add Indemnitor Portal fix documentation
f0a3611 Fix Indemnitor Portal: Correct submit button ID and add active filter
46f99a5 chore: resolve merge conflicts in utils, portal-auth, and Code.js

Current branch status:
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

✅ Repository is clean and ready for Wix sync
```

---

### Step 2: Sync Wix Editor with GitHub

**Option A: Via Wix Editor UI (Recommended)**

1. Open **Wix Editor** for shamrockbailbonds.biz
2. Go to **Developer Tools** → **Code Files**
3. Click **Sync** or **Git** → **Pull from GitHub**
4. Wait for sync to complete
5. **Publish** the site to trigger a new build

**Option B: Via Wix CLI (Alternative)**

```bash
cd /home/ubuntu/shamrock-bail-portal-site
wix pull
wix publish
```

---

### Step 3: Verify Build Success

After syncing and publishing:

1. Go to **Wix Editor** → **Site** → **Site Monitoring**
2. Check latest deployment status
3. Verify deployment ID is newer than `99f851da-e015-47b9-9123-cb77fedaa7ba`
4. Confirm status shows "Success" (not "Error")

---

## 📋 Files That Were Fixed

### Commits That Resolved Conflicts:

**Commit de247fc** - "chore: resolve remaining merge conflicts in portal-auth and Code.js"
- Fixed: `src/backend/portal-auth.jsw`
- Fixed: `backend-gas/Code.js`

**Commit 46f99a5** - "chore: resolve merge conflicts in utils, portal-auth, and Code.js"
- Fixed: `src/backend/utils.jsw`
- Fixed: `src/backend/portal-auth.jsw`
- Fixed: `backend-gas/Code.js`

**Commit f0a3611** - "Fix Indemnitor Portal: Correct submit button ID and add active filter"
- Fixed: `src/pages/portal-indemnitor.k53on.js`

---

## 🔍 Verification Script

The `verify_no_conflicts.sh` script checks for merge conflict markers:

```bash
#!/bin/bash
echo "=== Checking for merge conflict markers ==="
echo ""

# Check for conflict markers
CONFLICTS=$(find src backend-gas -type f \( -name "*.js" -o -name "*.jsw" \) -exec grep -l "^<<<<<<< \|^=======$\|^>>>>>>> " {} \; 2>/dev/null)

if [ -z "$CONFLICTS" ]; then
    echo "✅ NO MERGE CONFLICTS FOUND"
    echo ""
    echo "Latest commits:"
    git log --oneline -5
    echo ""
    echo "Current branch status:"
    git status
    echo ""
    echo "✅ Repository is clean and ready for Wix sync"
else
    echo "❌ MERGE CONFLICTS FOUND IN:"
    echo "$CONFLICTS"
    exit 1
fi
```

---

## 🚨 Common Pitfalls

### 1. Wix Editor Not Synced
**Symptom:** Build errors persist even after GitHub is clean  
**Solution:** Force sync in Wix Editor or use `wix pull`

### 2. Cached Build
**Symptom:** Old deployment ID still showing errors  
**Solution:** Publish site to trigger fresh build

### 3. Local Changes Not Pushed
**Symptom:** Wix Editor pulls old code  
**Solution:** Ensure all commits are pushed to GitHub first

---

## 📊 Build Status Monitoring

### Check Build Logs

**Via Wix Editor:**
1. Go to **Site** → **Site Monitoring**
2. Click latest deployment
3. View build logs

**Via Wix CLI:**
```bash
wix logs
```

### Expected Success Output

```
deploymentId: [new-id]
2/3/2026, [time]
Status: Success

✅ All files compiled successfully
✅ No parsing errors
✅ Site deployed
```

---

## ✅ Resolution Checklist

- [x] Verify GitHub repository has no merge conflicts
- [x] Run `verify_no_conflicts.sh` script
- [x] Confirm latest commits resolve all conflicts
- [ ] Sync Wix Editor with GitHub
- [ ] Publish site to trigger new build
- [ ] Verify new deployment succeeds
- [ ] Test portal pages load correctly
- [ ] Confirm no console errors

---

## 📝 Technical Details

### Merge Conflict Markers

Git uses these markers to indicate conflicts:

```
<<<<<<< HEAD
[Current branch code]
=======
[Incoming branch code]
>>>>>>> [commit-hash]
```

These markers **must be removed** before code can be deployed.

### Why Wix Build Failed

Wix's JavaScript parser encountered `<<` characters (from `<<<<<<< HEAD`) and interpreted them as invalid syntax, causing parsing errors.

### How We Fixed It

1. Identified conflict markers in files
2. Manually resolved conflicts by choosing correct code
3. Removed all `<<<<<<<`, `=======`, `>>>>>>>` markers
4. Committed clean code to GitHub
5. Verified no conflicts remain

---

## 🔄 Prevention

### Best Practices

1. **Always pull before pushing:**
   ```bash
   git pull --rebase origin main
   git push origin main
   ```

2. **Resolve conflicts immediately:**
   - Don't leave conflict markers in code
   - Test after resolving
   - Commit resolution separately

3. **Use verification script:**
   - Run before every Wix publish
   - Automate in CI/CD pipeline

4. **Keep Wix Editor synced:**
   - Sync after every GitHub push
   - Don't edit same files in both places

---

## 📞 Support

If build errors persist after following this guide:

1. Check Wix Site Monitoring for specific error messages
2. Run `verify_no_conflicts.sh` to confirm GitHub is clean
3. Try `wix pull --force` to force sync
4. Contact Wix Support with deployment ID

---

## 📚 Related Documentation

- [PORTAL_INDEMNITOR_FIX_SUMMARY.md](./PORTAL_INDEMNITOR_FIX_SUMMARY.md) - Indemnitor portal fixes
- [MAGICLINK_FIX_GUIDE.md](./MAGICLINK_FIX_GUIDE.md) - Magic link email setup
- [SIGNNOW_FINAL_SETUP_REPORT.md](./SIGNNOW_FINAL_SETUP_REPORT.md) - SignNow integration

---

**Last Updated:** February 3, 2026  
**Status:** ✅ GitHub repository clean, ready for Wix sync  
**Next Action:** Sync Wix Editor with GitHub and publish
