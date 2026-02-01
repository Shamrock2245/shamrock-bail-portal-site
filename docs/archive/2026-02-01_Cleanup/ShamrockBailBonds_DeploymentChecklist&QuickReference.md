# Shamrock Bail Bonds: Deployment Checklist & Quick Reference

**Version:** 1.0
**Date:** December 23, 2025

---

## Pre-Deployment Checklist

### Phase 1: Backend Infrastructure ✅

- [ ] **Create all Wix Data Collections** (11 collections total)
  - [ ] PendingDocuments
  - [ ] MemberDocuments
  - [ ] RequiredDocuments
  - [ ] UserLocations
  - [ ] PortalUsers
  - [ ] PortalSessions
  - [ ] MagicLinks
  - [ ] FloridaCounties (ensure schema alignment)
  - [ ] BookingCache
  - [ ] CallLogs
  - [ ] AnalyticsEvents

- [ ] **Configure Wix Secrets Manager** (6 secrets)
  - [ ] GAS_API_KEY
  - [ ] GAS_WEB_APP_URL
  - [ ] GAS_BOOKING_ENDPOINT
  - [ ] GOOGLE_MAPS_API_KEY
  - [ ] SIGNNOW_API_TOKEN
  - [ ] SIGNNOW_TEMPLATE_ID

- [ ] **Deploy Backend Modules** (`.jsw` files)
  - [ ] wixApi.jsw
  - [ ] bailCalculator.jsw
  - [ ] location.jsw
  - [ ] routing.jsw
  - [ ] call-tracking.jsw
  - [ ] county-generator.jsw
  - [ ] signNowIntegration.jsw
  - [ ] http-functions.js

- [ ] **Upload Data Files** (JSON files to `/backend/data/`)
  - [ ] county-template.json
  - [ ] florida-county-boundaries.json
  - [ ] florida-sheriff-clerk-directory.json
  - [ ] phone-registry.json

### Phase 2: Visual Design ✅

- [ ] **Apply Design System**
  - [ ] Configure Site Colors (Deep Navy, Action Blue, Shamrock Gold, etc.)
  - [ ] Create Text Themes (Poppins for headings, Inter for body)
  - [ ] Create Button Styles (Primary, Secondary, Outline)

- [ ] **Create Page Layouts**
  - [ ] Home
  - [ ] How Bail Works
  - [ ] Become a Bondsman
  - [ ] Contact
  - [ ] Blog (Main Page)
  - [ ] Blog Post (Template)
  - [ ] County Page (Dynamic)
  - [ ] Members Area (Login)
  - [ ] Member Portal (Dashboard)

### Phase 3: Frontend Development ✅

- [ ] **Global Logic**
  - [ ] Implement `masterPage.js` (session, geolocation, phone injection)
  - [ ] Create `public/geolocation-client.js`
  - [ ] Create `public/phone-injector.js`

- [ ] **Page Code**
  - [ ] Implement `home.js` (featured counties, CTAs)
  - [ ] Implement `county-dynamic.js` (dynamic content, SEO)
  - [ ] Implement `dashboard.js` (member portal, SignNow handoff)
  - [ ] Implement `login.js` (magic link authentication)

- [ ] **Element Configuration**
  - [ ] Add `data-phone` attributes to all phone elements
  - [ ] Configure repeaters for counties, FAQs, documents
  - [ ] Link all CTAs correctly

### Phase 4: Content & Links ✅

- [ ] **Populate Static Pages**
  - [ ] Home (from `home.md`)
  - [ ] How Bail Works (from `how-bail-works.md`)
  - [ ] Become a Bondsman (from `become-bondsman.md`)
  - [ ] Contact (from `contact.md`)

- [ ] **Verify County Links**
  - [ ] Process CSV of sheriff/clerk links
  - [ ] Manually verify each link
  - [ ] Update `FloridaCounties` collection with corrected links

- [ ] **Populate County Data**
  - [ ] Import all 67 counties into `FloridaCounties` collection
  - [ ] Set `active` and `featured` flags for Tier 1 counties
  - [ ] Verify phone numbers for each county

### Phase 5: Testing ✅

- [ ] **Functionality Testing**
  - [ ] Test geolocation on mobile and desktop
  - [ ] Verify phone numbers update based on county
  - [ ] Test call tracking (check `CallLogs` collection)
  - [ ] Test dynamic county pages (all 67 counties)
  - [ ] Test member login and magic link
  - [ ] Test SignNow handoff (critical!)

- [ ] **SEO Testing**
  - [ ] Verify meta titles and descriptions for all pages
  - [ ] Check county page SEO tags
  - [ ] Test internal linking
  - [ ] Verify 301 redirects (if any)

- [ ] **Mobile Testing**
  - [ ] Test on iOS (Safari)
  - [ ] Test on Android (Chrome)
  - [ ] Verify sticky mobile CTA bar
  - [ ] Test touch targets (minimum 44px)

- [ ] **Cross-Browser Testing**
  - [ ] Chrome
  - [ ] Safari
  - [ ] Firefox
  - [ ] Edge

### Phase 6: Launch ✅

- [ ] **Pre-Launch**
  - [ ] Backup current site
  - [ ] Review all non-negotiables (workflow protection, schema alignment)
  - [ ] Final review of SignNow integration

- [ ] **Publish**
  - [ ] Publish site to production
  - [ ] Monitor error logs for first 24 hours
  - [ ] Test live site on multiple devices

- [ ] **Post-Launch**
  - [ ] Monitor `CallLogs` and `AnalyticsEvents` collections
  - [ ] Verify Google Analytics tracking
  - [ ] Check SignNow workflow (end-to-end test)

---

## Quick Reference: Key URLs & Resources

### Documentation
- **Wix Velo Docs:** https://dev.wix.com/docs/velo
- **Wix Data API:** https://dev.wix.com/docs/velo/apis/wix-data/introduction
- **Arrest Scraper Schema:** `/home/ubuntu/swfl-arrest-scrapers/config/schema.json`

### Project Files
- **Design System:** `DESIGN-SYSTEM.md`
- **Backend Architecture:** `BACKEND_ARCHITECTURE.md`
- **Backend Implementation Guide:** `BACKEND_IMPLEMENTATION_GUIDE.md`
- **Frontend Code Reference:** `frontend-code-reference.md`
- **Implementation Guide:** `implementation-guide.md`

### GitHub Repositories
- **Website:** https://github.com/Shamrock2245/shamrock-bail-portal-site
- **Arrest Scrapers:** https://github.com/Shamrock2245/swfl-arrest-scrapers

### Google Sheets
- **Master Arrest Sheet:** https://docs.google.com/spreadsheets/d/121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E/edit

---

## Common Issues & Solutions

### Issue: Geolocation not working
**Solution:** Ensure the site is served over HTTPS. Geolocation requires a secure context.

### Issue: Phone numbers not updating
**Solution:** Check that `routing.jsw` is correctly deployed and that the `phone-registry.json` file is in `/backend/data/`.

### Issue: County page returns 404
**Solution:** Verify the county slug in the URL matches a `countySlug` in the `FloridaCounties` collection.

### Issue: SignNow handoff fails
**Solution:** Check that `SIGNNOW_API_TOKEN` and `GAS_WEB_APP_URL` are correctly set in Secrets Manager. Verify the backend function is receiving the correct member email.

### Issue: Call tracking not logging
**Solution:** Ensure `call-tracking.jsw` is deployed and that the `CallLogs` collection exists with correct permissions.

---

## Support Contacts

For technical issues related to Wix, submit a request at: https://help.manus.im

---

**End of Deployment Checklist**
