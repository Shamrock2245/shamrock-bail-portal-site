# Wix Sync Solution - GitHub to Wix Deployment

**Date:** January 13, 2026  
**Issue:** IDE shows complete code from GitHub, but Wix editor shows incomplete/placeholder files  
**Repository:** Shamrock2245/shamrock-bail-portal-site  
**Wix Site ID:** a00e3857-675a-493b-91d8-a1dbc5e7c499

---

## Problem Diagnosis

### Current State
- ✅ **GitHub Repository**: Contains complete, working code (all lightbox files are 4-13KB)
- ✅ **Local IDE**: Synced with GitHub, shows complete code
- ❌ **Wix Editor**: Shows "Still Connecting..." and incomplete/placeholder files
- ❌ **Sync Status**: Wix CLI not properly syncing local files to Wix servers

### Root Cause
The Wix CLI (`wix dev`) is not maintaining a stable connection between your local repository and the Wix editor. This creates a disconnect where:
1. Code exists in GitHub and your IDE
2. Wix editor doesn't recognize or load the code
3. Changes made locally don't appear in Wix

---

## Solution: Multi-Step Sync Strategy

### Step 1: Verify Wix CLI Installation and Login

```bash
# Check if Wix CLI is installed
wix --version

# If not installed or outdated, install/update
npm install -g @wix/cli

# Login to Wix (if not already logged in)
wix login

# Verify you're logged in
wix whoami
```

### Step 2: Initialize Wix Project Connection

```bash
# Navigate to your project directory
cd /home/ubuntu/shamrock-bail-portal-site

# Pull latest from Wix (this syncs Wix → Local)
wix pull

# This will download the current state from Wix
# May overwrite local files, so commit to Git first!
```

**⚠️ WARNING:** `wix pull` will overwrite local files with Wix's version. Make sure all your work is committed to Git first!

### Step 3: Start Wix Development Server

```bash
# Start the Wix dev server
wix dev

# This should output:
# ✓ Connected to Wix
# ✓ Watching for changes...
# ✓ Open your site in the editor: https://manage.wix.com/...
```

**Expected Output:**
```
🔗 Connected to site: shamrockbailbonds.biz
📂 Watching: /home/ubuntu/shamrock-bail-portal-site/src
✅ Sync active - changes will be pushed to Wix automatically
```

### Step 4: Force Push All Files to Wix

If `wix dev` is running but files still aren't syncing:

```bash
# Stop wix dev (Ctrl+C)

# Force push all local files to Wix
wix push --force

# This will upload all local files to Wix, overwriting Wix's versions
```

### Step 5: Verify Sync in Wix Editor

1. Open Wix Editor: https://manage.wix.com/dashboard/a00e3857-675a-493b-91d8-a1dbc5e7c499/home
2. Click **Code** (</> icon) in left sidebar
3. Navigate to **Lightboxes** → **SigningLightbox.js**
4. Verify the file shows complete code (should be ~299 lines)
5. Check other lightbox files:
   - `ConsentLightbox.js` (should be ~6KB)
   - `IdUploadLightbox.js` (should be ~13KB)
   - `DefendantDetails.js` (should be ~4KB)
   - `EmergencyCtaLightbox.js` (should be ~5KB)

---

## Alternative: Manual File Upload (If CLI Fails)

If Wix CLI continues to fail, use the Wix MCP server to upload files directly:

### Using Wix MCP Server

```bash
# List available Wix MCP tools
manus-mcp-cli tool list --server wix

# Upload a specific file
manus-mcp-cli tool call upload_file --server wix --input '{
  "filePath": "src/lightboxes/SigningLightbox.js",
  "destination": "lightboxes/SigningLightbox.js"
}'
```

### Manual Copy-Paste (Last Resort)

If all automated methods fail:

1. **For each lightbox file:**
   - Open the file in your IDE
   - Select all code (Cmd+A / Ctrl+A)
   - Copy (Cmd+C / Ctrl+C)

2. **In Wix Editor:**
   - Click **Code** (</> icon)
   - Navigate to the lightbox file
   - Click **Edit in Wix** (not IDE)
   - Delete existing code
   - Paste your code
   - Click **Save**

---

## Lightbox Files to Sync

| File | Size | Lines | Status | Priority |
|------|------|-------|--------|----------|
| `SigningLightbox.js` | 7.3KB | 299 | ❌ Needs sync | HIGH |
| `IdUploadLightbox.js` | 13KB | ~400 | ❌ Needs sync | HIGH |
| `ConsentLightbox.js` | 6.1KB | ~200 | ❌ Needs sync | HIGH |
| `EmergencyCtaLightbox.js` | 4.8KB | ~150 | ✅ Just added | MEDIUM |
| `DefendantDetails.js` | 4.3KB | ~150 | ❌ Needs sync | MEDIUM |

---

## Automated Sync Script

I'll create a script to automate the sync process:

```bash
#!/bin/bash
# File: sync-to-wix.sh
# Purpose: Sync all local files to Wix

echo "🔄 Starting Wix sync process..."

# 1. Ensure we're in the right directory
cd /home/ubuntu/shamrock-bail-portal-site || exit 1

# 2. Commit any uncommitted changes to Git
echo "📝 Committing local changes to Git..."
git add .
git commit -m "chore: sync before Wix push" || echo "No changes to commit"

# 3. Pull latest from GitHub
echo "⬇️  Pulling latest from GitHub..."
git pull origin main

# 4. Stop any running Wix dev servers
echo "🛑 Stopping existing Wix dev servers..."
pkill -f "wix dev" || echo "No running Wix dev servers"

# 5. Force push to Wix
echo "⬆️  Force pushing to Wix..."
wix push --force

# 6. Start Wix dev server
echo "🚀 Starting Wix dev server..."
wix dev &

echo "✅ Sync complete! Check Wix Editor to verify."
echo "📝 Wix dev server running in background (PID: $!)"
echo "🔗 Open editor: https://manage.wix.com/dashboard/a00e3857-675a-493b-91d8-a1dbc5e7c499/home"
```

---

## Verification Checklist

After syncing, verify these items in Wix Editor:

### Lightbox Files
- [ ] `SigningLightbox.js` shows 299 lines of code
- [ ] `IdUploadLightbox.js` shows complete upload logic
- [ ] `ConsentLightbox.js` shows consent capture logic
- [ ] `EmergencyCtaLightbox.js` shows CTA logic
- [ ] `DefendantDetails.js` shows defendant details logic

### Page Files
- [ ] `portal-landing.bagfn.js` shows 403 lines (complete)
- [ ] `portal-defendant.skg9y.js` shows complete portal logic
- [ ] `portal-indemnitor.k53on.js` shows complete portal logic
- [ ] `portal-staff.qs9dx.js` shows complete portal logic
- [ ] `FloridaCounties-Mobile-Enhanced.js` shows complete county logic

### Backend Files
- [ ] `backend/signnow-integration.jsw` exists and is complete
- [ ] `backend/portal-auth.jsw` exists and is complete
- [ ] `backend/counties.jsw` exists and is complete
- [ ] `backend/county-generator.jsw` exists and is complete

### CSS Files (Global)
- [ ] `design-system.css` is loaded in site settings
- [ ] `components.css` is loaded in site settings
- [ ] `global.css` is loaded in site settings

---

## Troubleshooting Common Issues

### Issue 1: "Still Connecting..." Never Resolves

**Cause:** Wix CLI not authenticated or connection timeout

**Solution:**
```bash
# Re-authenticate
wix logout
wix login

# Restart dev server
wix dev
```

### Issue 2: "File Not Found" Errors in Wix

**Cause:** File paths don't match Wix's expected structure

**Solution:**
- Wix expects files in specific directories
- Lightboxes: `src/lightboxes/`
- Pages: `src/pages/`
- Backend: `src/backend/`
- Public: `src/public/`

Verify your files are in the correct directories.

### Issue 3: Code Changes Don't Appear in Wix

**Cause:** Wix dev server not watching files

**Solution:**
```bash
# Stop dev server
pkill -f "wix dev"

# Clear Wix cache
rm -rf .wix/cache

# Restart dev server
wix dev
```

### Issue 4: Import Errors in Wix

**Cause:** Backend modules not deployed or incorrect import paths

**Solution:**
1. Verify backend files exist in `src/backend/`
2. Check import statements use `.jsw` extension for backend files
3. Example: `import { getDocumentStatus } from 'backend/signnow-integration.jsw';`

### Issue 5: "Permission Denied" Errors

**Cause:** Not logged in to Wix or insufficient permissions

**Solution:**
```bash
# Check who you're logged in as
wix whoami

# If not logged in or wrong account
wix logout
wix login

# Use the account that owns the site: admin@shamrockbailbonds.biz
```

---

## Ongoing Sync Workflow

### Daily Development Workflow

1. **Morning: Pull latest**
   ```bash
   cd /home/ubuntu/shamrock-bail-portal-site
   git pull origin main
   wix pull  # Sync Wix → Local
   ```

2. **During Development: Keep wix dev running**
   ```bash
   wix dev  # Keep this running in a terminal
   ```

3. **After Changes: Commit and push**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   wix push  # Sync Local → Wix
   ```

4. **Evening: Verify in Wix Editor**
   - Open Wix Editor
   - Test your changes
   - Publish if ready

### Best Practices

1. **Always commit to Git first** before running `wix pull` or `wix push`
2. **Keep `wix dev` running** during active development
3. **Test in Wix Preview** before publishing
4. **Use Git branches** for major changes
5. **Document element IDs** when adding new UI elements

---

## Emergency Rollback

If sync causes issues:

```bash
# Rollback Git
git reset --hard HEAD~1

# Rollback Wix (restore from backup)
wix pull --force  # This gets the last known good state from Wix

# Or restore from Git commit
git checkout <commit-hash>
wix push --force
```

---

## Next Steps

1. **Run the sync script** (I'll create it next)
2. **Verify all files** in Wix Editor
3. **Test lightboxes** on the live site
4. **Update DEPLOYMENT_GUIDE.md** with sync instructions
5. **Document any element ID mismatches** found during testing

---

## Support Resources

- **Wix CLI Documentation**: https://dev.wix.com/docs/cli
- **Wix Velo Documentation**: https://dev.wix.com/docs/velo
- **GitHub Repository**: https://github.com/Shamrock2245/shamrock-bail-portal-site
- **Wix Site Dashboard**: https://manage.wix.com/dashboard/a00e3857-675a-493b-91d8-a1dbc5e7c499/home

---

**Status:** 📋 Ready to implement  
**Next Action:** Run Step 1 to verify Wix CLI installation
