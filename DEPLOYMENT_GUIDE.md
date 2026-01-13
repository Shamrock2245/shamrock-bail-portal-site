# Deployment Guide - Shamrock Bail Bonds Website

**Date:** January 13, 2026  
**Repository:** Shamrock2245/shamrock-bail-portal-site  
**Commit:** 858d66a

---

## Overview

This guide provides step-by-step instructions for deploying the newly implemented design system and mobile-optimized county pages to your Wix website at `shamrockbailbonds.biz`.

---

## What Was Implemented

### CSS Files (Design System)

| File | Purpose | Size | Load Order |
|------|---------|------|------------|
| `design-system.css` | Core design tokens (colors, spacing, typography) | 11KB | 1st (Global) |
| `components.css` | Reusable component library (buttons, cards, forms) | 13KB | 2nd (Global) |
| `global.css` | Global styles and utilities | 11KB | 3rd (Global) |
| `county-page-mobile.css` | Mobile-optimized county page styles | 10KB | Page-specific |

### JavaScript Files

| File | Purpose | Location |
|------|---------|----------|
| `CountyPage-Dynamic.js` | Enhanced county page functionality | `src/pages/` |
| `FloridaCounties-Mobile-Enhanced.js` | Mobile-optimized county page logic | `src/pages/` |
| `EmergencyCtaLightbox.js` | Emergency CTA lightbox handler | `src/lightboxes/` |

### Documentation Files

| File | Purpose |
|------|---------|
| `QuickStartMobile-OptimizedCountyPages.md` | Quick start guide for mobile county pages |
| `WorkflowMapping-ShamrockBailBonds.md` | Comprehensive workflow mapping |

---

## Deployment Steps

### Step 1: Add Global CSS to Wix

**Location:** Wix Editor → Site Settings → Custom Code → Head Section

**Order matters!** Add these in the following sequence:

#### 1.1 Add Design System CSS (First)

```html
<!-- Design System - Load First -->
<link rel="stylesheet" href="https://raw.githubusercontent.com/Shamrock2245/shamrock-bail-portal-site/main/src/styles/design-system.css">
```

**OR** copy the contents of `src/styles/design-system.css` directly into:
- Wix Editor → Site Settings → Custom Code → All Pages → Head

#### 1.2 Add Components CSS (Second)

```html
<!-- Component Library - Load Second -->
<link rel="stylesheet" href="https://raw.githubusercontent.com/Shamrock2245/shamrock-bail-portal-site/main/src/styles/components.css">
```

**OR** copy the contents of `src/styles/components.css` directly into:
- Wix Editor → Site Settings → Custom Code → All Pages → Head

#### 1.3 Add Global CSS (Third)

```html
<!-- Global Styles - Load Third -->
<link rel="stylesheet" href="https://raw.githubusercontent.com/Shamrock2245/shamrock-bail-portal-site/main/src/styles/global.css">
```

**OR** copy the contents of `src/styles/global.css` directly into:
- Wix Editor → Site Settings → Custom Code → All Pages → Head

**Note:** Using direct CSS paste is recommended for production to avoid external dependencies.

---

### Step 2: Update County Pages

#### 2.1 Add County Page Mobile CSS

1. Open Wix Editor
2. Navigate to **Pages** → **FloridaCounties (Item)** (dynamic page)
3. Click **Page Settings** (gear icon)
4. Go to **Advanced Settings** → **Custom Code**
5. Add to **Head** section:

```html
<!-- County Page Mobile Styles -->
<link rel="stylesheet" href="https://raw.githubusercontent.com/Shamrock2245/shamrock-bail-portal-site/main/src/styles/county-page-mobile.css">
```

**OR** copy the contents of `src/styles/county-page-mobile.css` into the page's custom CSS.

#### 2.2 Update County Page JavaScript

1. In Wix Editor, open **FloridaCounties (Item)** page
2. Click **Code** (</> icon) to open Velo code panel
3. Locate the page code file (e.g., `FloridaCounties (Item).js`)
4. **Backup existing code** (copy to a text file)
5. Replace with contents of either:
   - `src/pages/CountyPage-Dynamic.js` (recommended for new implementation)
   - `src/pages/FloridaCounties-Mobile-Enhanced.js` (enhanced mobile version)

**Choose based on your needs:**
- **CountyPage-Dynamic.js**: Full-featured, dynamic county page with all functionality
- **FloridaCounties-Mobile-Enhanced.js**: Optimized specifically for mobile devices

#### 2.3 Verify Element IDs

Ensure the following element IDs exist on your county page:

| Element ID | Type | Purpose |
|------------|------|---------|
| `#countyName` | Text | County name display |
| `#dynamicHeader` | Text | Dynamic header text |
| `#quickRefHeader` | Text | Quick reference header |
| `#sheriffPhone` | Text/Link | Sheriff's office phone |
| `#sheriffWebsite` | Link | Sheriff's website link |
| `#jailName` | Text | Jail name display |
| `#jailAddress` | Text | Jail address display |
| `#clerkPhone` | Text/Link | Clerk's office phone |
| `#clerkWebsite` | Link | Clerk's website link |
| `#countySeat` | Text | County seat location |
| `#callCountiesBtn` | Button | Call button |

**If element IDs don't match**, update them in the Wix Editor to match the code expectations.

---

### Step 3: Update Emergency CTA Lightbox

#### 3.1 Open Emergency CTA Lightbox

1. In Wix Editor, go to **Site Structure** → **Lightboxes**
2. Find and open **Emergency CTA Lightbox** (or similar name)

#### 3.2 Update Lightbox Code

1. Click **Code** (</> icon)
2. Locate the lightbox code file
3. **Backup existing code**
4. Replace with contents of `src/lightboxes/EmergencyCtaLightbox.js`

#### 3.3 Verify Lightbox Elements

Ensure the following element IDs exist in your lightbox:

| Element ID | Type | Purpose |
|------------|------|---------|
| `#countyDropdown` | Dropdown | County selector |
| `#callNowBtn` | Button | Call 24/7 button |
| `#startOnlineBtn` | Button | Start online button |
| `#closeBtn` | Button | Close lightbox button |

---

### Step 4: Test Deployment

#### 4.1 Test County Pages

1. **Publish** your Wix site
2. Navigate to a county page (e.g., `/county/lee`)
3. Verify:
   - [ ] Page loads without errors
   - [ ] Styling matches the Figma design
   - [ ] All county information displays correctly
   - [ ] Phone numbers are clickable (tel: links)
   - [ ] Website links work
   - [ ] Call button functions
   - [ ] Mobile responsive design works (test on phone)

#### 4.2 Test Emergency CTA Lightbox

1. Visit the homepage as a **new visitor** (incognito/private mode)
2. Wait 30 seconds (or configured trigger time)
3. Verify:
   - [ ] Lightbox appears automatically
   - [ ] County dropdown populates
   - [ ] "Call Now" button works
   - [ ] "Start Online" button navigates correctly
   - [ ] Close button dismisses lightbox
   - [ ] Lightbox doesn't reappear on same session

#### 4.3 Test Design System

1. Navigate through multiple pages
2. Verify:
   - [ ] Consistent colors across all pages
   - [ ] Buttons have consistent styling
   - [ ] Typography is consistent
   - [ ] Spacing is uniform
   - [ ] Mobile responsive on all pages
   - [ ] No console errors in browser developer tools

---

## Troubleshooting

### Issue: CSS Not Loading

**Symptoms:** Page looks unstyled or has broken layout

**Solutions:**
1. Check browser console for CSS loading errors
2. Verify CSS file URLs are correct
3. Try copying CSS directly into Wix Custom Code instead of linking
4. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. Check Wix site settings for any CSP (Content Security Policy) restrictions

### Issue: JavaScript Not Working

**Symptoms:** Buttons don't respond, data doesn't load

**Solutions:**
1. Open browser console and check for JavaScript errors
2. Verify element IDs in code match element IDs in Wix Editor
3. Check that all required backend modules are deployed (e.g., `counties.jsw`)
4. Ensure Wix Data collections exist (e.g., `FloridaCounties`)
5. Test in Wix Preview mode first before publishing

### Issue: Element IDs Don't Match

**Symptoms:** "Element not found" errors in console

**Solutions:**
1. In Wix Editor, select each element
2. Check its ID in the Properties panel
3. Update element IDs to match code expectations
4. Or update code to match existing element IDs
5. Refer to `IMPLEMENTATION_SUMMARY.md` for expected element IDs

### Issue: Mobile Layout Broken

**Symptoms:** Page looks wrong on mobile devices

**Solutions:**
1. Ensure `county-page-mobile.css` is loaded on county pages
2. Check that Wix mobile editor settings aren't overriding CSS
3. Test in actual mobile browser, not just desktop responsive mode
4. Verify viewport meta tag is present in page head
5. Check for conflicting CSS from Wix themes

---

## Rollback Procedure

If deployment causes issues, you can rollback:

### Rollback CSS

1. Go to Wix Editor → Site Settings → Custom Code
2. Remove the newly added CSS links/code
3. Restore previous CSS if backed up

### Rollback JavaScript

1. Open the affected page/lightbox in Wix Editor
2. Click **Code** (</> icon)
3. Restore the backed-up code you saved before replacement

### Rollback via Git

1. In your local repository:
   ```bash
   git revert 858d66a
   git push origin main
   ```

2. Re-deploy the previous version to Wix

---

## Post-Deployment Checklist

After successful deployment, verify:

- [ ] All pages load without errors
- [ ] Mobile responsive design works on actual devices
- [ ] All CTAs (Call buttons, Start Bail buttons) function correctly
- [ ] County pages display correct information for all 67 counties
- [ ] Emergency CTA lightbox triggers appropriately
- [ ] No console errors in browser developer tools
- [ ] Site performance is acceptable (page load < 3 seconds)
- [ ] SEO tags are intact
- [ ] Analytics tracking still works
- [ ] All workflows function (county selector → county page → portal)

---

## Additional Resources

### Documentation

- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **File Implementation Plan:** `FILE_IMPLEMENTATION_PLAN.md`
- **Quick Start Guide:** `docs/QuickStartMobile-OptimizedCountyPages.md`
- **Workflow Mapping:** `docs/WorkflowMapping-ShamrockBailBonds.md`
- **Portal Design Requirements:** `docs/PORTAL_DESIGN_REQUIREMENTS.md`

### Repository

- **GitHub:** https://github.com/Shamrock2245/shamrock-bail-portal-site
- **Branch:** main
- **Latest Commit:** 858d66a

### Wix Resources

- [Wix Velo Documentation](https://dev.wix.com/docs/velo)
- [Wix Custom CSS Guide](https://support.wix.com/en/article/adding-custom-css-to-your-site)
- [Wix Lightboxes Guide](https://support.wix.com/en/article/about-lightboxes)

---

## Support

If you encounter issues during deployment:

1. Check the **Troubleshooting** section above
2. Review browser console for error messages
3. Verify all element IDs match between code and Wix Editor
4. Test in Wix Preview mode before publishing
5. Refer to project documentation in `docs/` folder

---

**Status:** ✅ Ready for deployment  
**Last Updated:** January 13, 2026  
**Next Steps:** Follow Step 1 to begin deployment
