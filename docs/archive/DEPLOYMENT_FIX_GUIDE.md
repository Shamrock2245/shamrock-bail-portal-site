# Deployment Error Fix Guide

## Summary

This document outlines the fixes applied to resolve deployment errors on shamrockbailbonds.biz and provides instructions for completing the deployment.

## Errors Fixed

The following deployment errors have been addressed:

### 1. React Module Errors
**Error:** `[/pages/Portal.hslzo.js]: Cannot find module 'react' in 'public/pages/hslzo.js'`  
**Error:** `[public/react/script.js]: React is not defined`  
**Error:** `[public/bailBondDashboard.js]: ReactDOM is not defined`

**Root Cause:** Ghost files on the Wix site referencing React, which is not used in Wix Velo projects.

**Fix Applied:** Created stub files to overwrite the problematic ones:
- `src/public/react/script.js` - Empty stub with deprecation notice
- `src/public/bailBondDashboard.js` - Empty stub redirecting to new portal pages

### 2. Undefined Function Error
**Error:** `[public/pages/masterPage.js]: 'processBookingSheet' is not defined`

**Root Cause:** Missing import statement in masterPage.js

**Fix Applied:** Added import statement:
```javascript
import { processBookingSheet } from 'public/bookingSheetHandler';
```

### 3. Constant Reassignment Error
**Error:** `[backend/portal-validators.js]: 'age' is constant`

**Root Cause:** Stale code in backend directory that doesn't exist in the current GitHub repo.

**Fix Applied:** Created `src/backend/portal-validators.js` as a stub file that re-exports from the correct public module.

### 4. BAD_USER_CODE Error
**Error:** `[backend/___spi___/forms-submissions-extension-provider/bookingFormSub/bookingFormSub-config.js]: BAD_USER_CODE`

**Root Cause:** Invalid configuration structure in SPI config file.

**Fix Applied:** Simplified the config to return an empty object, as form handling is done in backend modules.

## Deployment Instructions

### Option 1: Sync from GitHub (Recommended)

1. **Open the Wix Editor** for shamrockbailbonds.biz
2. **Open the Code Panel** (Developer Tools → Code Files)
3. **Sync with GitHub:**
   - Click the GitHub icon in the Code Panel
   - Select "Pull from GitHub"
   - Choose the `main` branch
   - Confirm the sync

4. **Publish the site:**
   - Click "Publish" in the top-right corner
   - Wait for the deployment to complete

### Option 2: Manual File Cleanup (If sync fails)

If the GitHub sync doesn't work, manually clean up the problematic files:

1. **Delete Ghost Files in Wix Editor:**
   - Navigate to Code Files → Public
   - Delete the entire `react/` folder if it exists
   - Delete `bailBondDashboard.js` if it exists in Public
   - Navigate to Code Files → Backend
   - Delete `portal-validators.js` if it exists (the correct one is in Public)

2. **Update masterPage.js:**
   - Open `pages/masterPage.js`
   - Add this import at the top with other imports:
     ```javascript
     import { processBookingSheet } from 'public/bookingSheetHandler';
     ```

3. **Update bookingFormSub-config.js:**
   - Navigate to `backend/___spi___/forms-submissions-extension-provider/bookingFormSub/`
   - Open `bookingFormSub-config.js`
   - Replace the content with:
     ```javascript
     export function getConfig() {
         return {};
     }
     ```

4. **Publish the site**

## Verification Steps

After deployment, verify the fixes:

1. **Check the Deployment Log:**
   - Open Wix Editor
   - Click "Site" → "Dashboard"
   - Navigate to "Logs" or "History"
   - Verify no errors in the latest deployment

2. **Test the Site:**
   - Visit https://shamrockbailbonds.biz
   - Open browser console (F12)
   - Check for any JavaScript errors
   - Test the portal login functionality
   - Verify forms are working

## Additional Notes

### Why These Errors Occurred

The Wix site had **stale code** from previous development that wasn't in the current GitHub repository. This happens when:
- Files are deleted in GitHub but not synced to Wix
- Manual changes are made in Wix Editor without committing to GitHub
- Old development branches are merged incorrectly

### Prevention

To prevent future deployment errors:

1. **Always sync bidirectionally:**
   - Pull from GitHub before making changes in Wix Editor
   - Push to GitHub after making changes in Wix Editor

2. **Use GitHub as source of truth:**
   - Make all code changes in GitHub
   - Use Wix Editor only for visual design and testing

3. **Regular cleanup:**
   - Periodically review and delete unused files
   - Keep the codebase lean and organized

## Files Modified

The following files were modified in this fix:

1. `src/pages/masterPage.js` - Added missing import
2. `src/backend/portal-validators.js` - Created stub file
3. `src/public/react/script.js` - Created stub file
4. `src/public/bailBondDashboard.js` - Created stub file
5. `src/backend/___spi___/forms-submissions-extension-provider/bookingFormSub/bookingFormSub-config.js` - Simplified config

## Commit Information

**Commit Hash:** e296e51  
**Branch:** main  
**Repository:** https://github.com/Shamrock2245/shamrock-bail-portal-site

## Support

If you encounter any issues during deployment:

1. Check the Wix deployment logs for specific error messages
2. Verify all files are properly synced from GitHub
3. Clear browser cache and test again
4. Contact Wix support if errors persist

---

**Last Updated:** January 7, 2026  
**Author:** Manus AI Agent  
**Status:** Ready for Deployment
