# Atlas Action Plan - Shamrock Bail Bonds Website Completion

**Date:** December 24, 2025  
**Priority:** HIGH  
**Estimated Time:** 32-43 hours

---

## Overview

The website has excellent visual design but is missing core pages and functionality. This action plan outlines specific tasks to complete the website before launch.

---

## Phase 1: Create Missing Pages (8-10 hours)

### Task 1.1: Create "How Bail Works" Page
**Priority:** HIGH  
**Time:** 2 hours

**Steps:**
1. In Wix Editor, create new page: "How Bail Works"
2. Set URL: `/how-bail-works`
3. Copy content from: `content/pages/how-bail-works.md`
4. Apply design system styling
5. Add 3-step process visual elements
6. Ensure mobile responsiveness
7. Set SEO meta title and description

**Content Source:** `/content/pages/how-bail-works.md`

---

### Task 1.2: Create "Become a Bondsman" Page
**Priority:** HIGH (Required Deliverable)  
**Time:** 2 hours

**Steps:**
1. Create new page: "How to Become a Bondsman"
2. Set URL: `/how-to-become-a-bondsman`
3. Copy content from: `content/pages/become-bondsman.md`
4. Add section: "Stay tuned for Shamrock Bail School schedule"
5. Add email signup form for Bail School interest
6. Connect form to `BailSchoolSignups` collection
7. Set SEO meta tags

**Content Source:** `/content/pages/become-bondsman.md`

**Special Note:** Must include placeholder for future Bail School schedules

---

### Task 1.3: Create "Florida Counties" Directory Page
**Priority:** HIGH  
**Time:** 3 hours

**Steps:**
1. Create new page: "Florida Counties"
2. Set URL: `/florida-counties`
3. Add page title: "Bail Bonds in All 67 Florida Counties"
4. Create repeater connected to `FloridaCounties` collection
5. Display county cards with:
   - County name
   - Link to dynamic county page
   - "Active" badge if applicable
6. Add filter/search functionality (optional but recommended)
7. Group by region (Southwest, Southeast, Central, etc.)
8. Set SEO meta tags

**Data Source:** `FloridaCounties` CMS collection

---

### Task 1.4: Create "Why Choose Us" Page
**Priority:** MEDIUM  
**Time:** 1-2 hours

**Steps:**
1. Check if page exists (navigation link present)
2. If missing, create new page
3. Set URL: `/why-choose-us`
4. Add content highlighting:
   - 24/7 availability
   - Licensed since 2012
   - Bilingual support
   - Fast release (2 hours)
   - Flexible payment plans
   - All 67 counties coverage
5. Add testimonials section
6. Set SEO meta tags

---

## Phase 2: Implement Dynamic County Pages (4-6 hours)

### Task 2.1: Create Dynamic County Page Template
**Priority:** CRITICAL  
**Time:** 4-6 hours

**Steps:**
1. In Wix Editor, create new **Dynamic Page**
2. Connect to `FloridaCounties` collection
3. Set URL pattern: `/county/{slug}`
4. Design page layout with sections:
   - Hero with county name
   - Jail information (name, phone, booking URL)
   - Clerk of Court information (name, phone, website)
   - Sheriff's office information
   - Local bail bond process
   - FAQ section (county-specific)
   - CTA: "Get Bail Bond in [County Name]"

**Page Code File:** Create `/src/pages/county-dynamic.js`

**Code Implementation:**
```javascript
import wixLocation from 'wix-location';
import { generateCountyPage } from 'backend/county-generator';

$w.onReady(function () {
    const countySlug = wixLocation.path[0]; // Get slug from URL
    
    generateCountyPage(countySlug)
        .then((countyData) => {
            // Populate page elements
            $w('#countyName').text = countyData.countyName;
            $w('#jailName').text = countyData.jailName;
            $w('#jailPhone').text = countyData.jailPhone;
            $w('#jailUrl').link = countyData.inmateSearchUrl;
            $w('#clerkName').text = countyData.clerkName;
            $w('#clerkPhone').text = countyData.clerkPhone;
            $w('#clerkUrl').link = countyData.clerkWebsite;
            $w('#sheriffName').text = countyData.sheriffOfficeName;
            $w('#sheriffUrl').link = countyData.sheriffWebsite;
            
            // Set SEO
            $w('#page').title = countyData.metaTitle;
            $w('#page').description = countyData.metaDescription;
        })
        .catch((error) => {
            console.error('Error loading county page:', error);
            wixLocation.to('/404');
        });
});
```

**Testing:** Test with Lee, Collier, and Charlotte counties

---

## Phase 3: Wire Up Homepage Functionality (2-3 hours)

### Task 3.1: Connect County Selector Dropdown
**Priority:** HIGH  
**Time:** 1 hour

**Steps:**
1. Open homepage in Wix Editor
2. Find county selector dropdown element
3. Connect to `FloridaCounties` collection
4. Populate dropdown with county names
5. Add onChange handler to redirect to county page

**Code for Home.js:**
```javascript
import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(function () {
    // Populate county dropdown
    wixData.query('FloridaCounties')
        .ascending('countyName')
        .find()
        .then((results) => {
            const options = results.items.map(county => ({
                label: county.countyName,
                value: county.slug
            }));
            $w('#countyDropdown').options = options;
        });
    
    // Handle "Get Started" button click
    $w('#getStartedButton').onClick(() => {
        const selectedSlug = $w('#countyDropdown').value;
        if (selectedSlug) {
            wixLocation.to(`/county/${selectedSlug}`);
        } else {
            // Show error or default to contact page
            $w('#errorText').show();
        }
    });
});
```

---

### Task 3.2: Wire "Start Your Bond Now" Button
**Priority:** HIGH  
**Time:** 30 minutes

**Steps:**
1. Determine destination (Member Login or Contact?)
2. Add onClick handler
3. Redirect to appropriate page

**Recommended:** Redirect to Member Login page once created

---

## Phase 4: Create Member Portal Pages (6-8 hours)

### Task 4.1: Create Member Login Page
**Priority:** HIGH  
**Time:** 2 hours

**Steps:**
1. Create new page: "Member Login"
2. Set URL: `/member-login`
3. Add Wix Members login element OR custom login form
4. If custom: implement magic link authentication
5. Add "Don't have an account? Contact us" message
6. Style to match design system

**Code Reference:** Use `portal-auth.jsw` backend module

---

### Task 4.2: Create Member Dashboard Page
**Priority:** HIGH  
**Time:** 4-6 hours

**Steps:**
1. Create new page: "Member Dashboard"
2. Set URL: `/member-dashboard`
3. Restrict to logged-in members only
4. Add sections:
   - Welcome message with member name
   - Pending documents list
   - Required documents list
   - "Start Bail Paperwork" button (SignNow handoff)
   - Document upload area
   - Check-in history (if applicable)
5. Connect to CMS collections:
   - `PendingDocuments`
   - `RequiredDocuments`
   - `MemberDocuments`

**Critical Code - SignNow Handoff:**
```javascript
import { initiateSignNowHandoff } from 'backend/signNowIntegration';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';

$w.onReady(function () {
    // Check if user is logged in
    if (!wixUsers.currentUser.loggedIn) {
        wixLocation.to('/member-login');
        return;
    }
    
    // Handle "Start Bail Paperwork" button
    $w('#startPaperworkButton').onClick(() => {
        $w('#loadingSpinner').show();
        
        wixUsers.currentUser.getEmail()
            .then((email) => {
                return initiateSignNowHandoff(email);
            })
            .then((signNowUrl) => {
                // Redirect to SignNow
                wixLocation.to(signNowUrl);
            })
            .catch((error) => {
                console.error('SignNow handoff error:', error);
                $w('#errorMessage').text = 'Unable to start paperwork. Please contact us.';
                $w('#errorMessage').show();
            })
            .finally(() => {
                $w('#loadingSpinner').hide();
            });
    });
});
```

---

## Phase 5: Deploy Backend Modules (2-3 hours)

**CRITICAL:** Backend modules exist in GitHub but must be deployed to Wix.

### Task 5.1: Deploy All Backend Modules
**Priority:** CRITICAL  
**Time:** 2-3 hours

**Method 1: Wix CLI (Recommended)**
```bash
# From repository root
wix login
wix init
wix sync
```

**Method 2: Manual Copy-Paste**
1. Open Wix Editor
2. Go to Code Files > Backend
3. For each `.jsw` file in `/src/backend/`:
   - Create new backend file in Wix
   - Copy entire file content
   - Paste into Wix
   - Save

**Files to Deploy:**
- `wixApi.jsw` (NEW - from patch)
- `bailCalculator.jsw` (NEW - from patch)
- `location.jsw` (MODIFIED - from patch)
- `routing.jsw`
- `counties.jsw`
- `county-generator.jsw`
- `signNowIntegration.jsw`
- `portal-auth.jsw`
- `call-tracking.jsw`
- `http-functions.js`
- All other existing `.jsw` files

**Verification:**
- Check that all imports resolve without errors
- Test a backend function from browser console

---

## Phase 6: Implement Global Logic (2-3 hours)

### Task 6.1: Implement masterPage.js
**Priority:** HIGH  
**Time:** 2-3 hours

**Steps:**
1. Open Site Structure > masterPage.js in Wix Editor
2. Implement global logic:
   - Session management
   - Geolocation detection
   - Dynamic phone number injection
   - Call tracking event listeners

**Code Reference:** See `docs/FrontendCodeReferenceforChatGPTAtlas.md` Section 5.1

**Key Functions:**
- Auto-detect user location (county)
- Update all phone numbers based on county
- Track all phone call clicks
- Store session data

---

## Phase 7: Populate CMS Collections (2-3 hours)

### Task 7.1: Import County Data
**Priority:** HIGH  
**Time:** 1-2 hours

**Steps:**
1. Go to CMS > FloridaCounties collection
2. Import data from: `/src/data/floridaCounties.json`
3. Map JSON fields to collection fields
4. Verify all 67 counties imported
5. Set `isActive` = true for Tier 1 counties
6. Set `featured` = true for Lee, Collier, Charlotte

**Verification:** Check that county dropdown on homepage shows all counties

---

### Task 7.2: Add FAQs
**Priority:** MEDIUM  
**Time:** 1 hour

**Steps:**
1. Go to CMS > FAQs collection
2. Add common bail bond FAQs:
   - How much does a bail bond cost?
   - How long does release take?
   - What documents do I need?
   - Do you offer payment plans?
   - What counties do you serve?
3. Categorize appropriately
4. Set sort order

---

## Phase 8: Testing & Debugging (6-8 hours)

### Task 8.1: Functionality Testing
**Priority:** HIGH  
**Time:** 3-4 hours

**Test Checklist:**
- [ ] Homepage county selector works
- [ ] All navigation links work
- [ ] Dynamic county pages load correctly
- [ ] Member login works
- [ ] SignNow handoff works (CRITICAL)
- [ ] Phone numbers display correctly
- [ ] Call tracking logs to CallLogs collection
- [ ] All CTAs lead to correct destinations
- [ ] Forms submit correctly

---

### Task 8.2: Mobile Testing
**Priority:** HIGH  
**Time:** 2 hours

**Test On:**
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)

**Check:**
- [ ] Touch targets are 44px minimum
- [ ] Text is readable
- [ ] Images load properly
- [ ] Forms are usable
- [ ] Sticky CTA bar works
- [ ] Navigation menu works

---

### Task 8.3: Cross-Browser Testing
**Priority:** MEDIUM  
**Time:** 1-2 hours

**Test On:**
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## Phase 9: SEO Implementation (2 hours)

### Task 9.1: Set Meta Tags for All Pages
**Priority:** HIGH  
**Time:** 1 hour

**For Each Page:**
- Set unique meta title (50-60 characters)
- Set unique meta description (150-160 characters)
- Add relevant keywords
- Set Open Graph tags for social sharing

---

### Task 9.2: Verify Internal Linking
**Priority:** MEDIUM  
**Time:** 1 hour

**Check:**
- [ ] Homepage links to all main pages
- [ ] County directory links to all county pages
- [ ] Footer links work
- [ ] Breadcrumbs (if applicable)
- [ ] Related content links

---

## Critical Path Summary

**Must Complete Before Launch:**
1. ✅ Create all missing pages (Phase 1)
2. ✅ Implement dynamic county pages (Phase 2)
3. ✅ Deploy backend modules (Phase 5)
4. ✅ Create member portal (Phase 4)
5. ✅ Wire homepage functionality (Phase 3)
6. ✅ Test SignNow integration (Phase 8.1)

**Can Complete Post-Launch:**
- Advanced analytics
- Blog content
- Additional testimonials
- FAQ expansion

---

## Tools & Resources

**Documentation:**
- `docs/FrontendCodeReferenceforChatGPTAtlas.md` - Complete code reference
- `docs/ShamrockBailBonds_WixVeloRedesign&ImplementationGuide.md` - Implementation guide
- `DESIGN-SYSTEM.md` - Design specifications
- `BACKEND_IMPLEMENTATION_GUIDE.md` - Backend module documentation

**Data Files:**
- `content/pages/*.md` - Page content
- `src/data/floridaCounties.json` - County data
- `src/backend/data/*.json` - Backend data

**Wix Resources:**
- Wix Velo Docs: https://dev.wix.com/docs/velo
- Wix Data API: https://dev.wix.com/docs/velo/api-reference/wix-data

---

## Questions to Ask Before Starting

1. Do you have Wix Editor access?
2. Do you have Wix CLI installed?
3. Have backend modules been deployed to Wix yet?
4. Are Wix Secrets configured (API keys)?
5. Is the FloridaCounties collection populated?
6. Do you need help with any specific task?

---

## Success Criteria

**Website is "Done" When:**
- ✅ All required pages exist and are accessible
- ✅ All navigation links work (no 404s)
- ✅ Dynamic county pages work for all 67 counties
- ✅ Member portal allows login and SignNow handoff
- ✅ Homepage county selector functions correctly
- ✅ All CTAs lead to appropriate destinations
- ✅ Mobile experience is smooth
- ✅ Phone tracking works
- ✅ SEO tags are set for all pages
- ✅ No console errors
- ✅ SignNow integration tested end-to-end

---

**Let's get this done! 🚀**
