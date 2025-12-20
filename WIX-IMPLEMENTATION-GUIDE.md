# Shamrock Bail Bonds - Wix Implementation Guide

This guide walks you through implementing the redesigned Shamrock Bail Bonds website in Wix Editor. Follow these steps in order for the smoothest setup.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Site Setup & Colors](#phase-1-site-setup--colors)
3. [Phase 2: Create CMS Collections](#phase-2-create-cms-collections)
4. [Phase 3: Import County Data](#phase-3-import-county-data)
5. [Phase 4: Create Pages](#phase-4-create-pages)
6. [Phase 5: Add Velo Code](#phase-5-add-velo-code)
7. [Phase 6: Delete Unnecessary Pages](#phase-6-delete-unnecessary-pages)
8. [Phase 7: Test & Publish](#phase-7-test--publish)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Access to Wix Editor for shamrockbailbonds.biz
- [ ] The GitHub repository cloned: `WTFlorida239/shamrock-bail-portal-frontend`
- [ ] SignNow API credentials ready
- [ ] 30-60 minutes of uninterrupted time

---

## Phase 1: Site Setup & Colors

### Step 1.1: Set Site Colors

1. Open Wix Editor
2. Click **Site Design** (paintbrush icon) in the left panel
3. Click **Colors**
4. Set up your color palette:

| Slot | Color Name | Hex Code |
|------|------------|----------|
| Color 1 | Deep Navy | `#1B3A5F` |
| Color 2 | Action Blue | `#0066CC` |
| Color 3 | Shamrock Gold | `#FDB913` |
| Color 4 | White | `#FFFFFF` |
| Color 5 | Near Black | `#212529` |

### Step 1.2: Set Site Fonts

1. In **Site Design**, click **Text**
2. Set up text themes:

**Heading 1:**
- Font: Poppins (add from Google Fonts if needed)
- Size: 56px (desktop) / 36px (mobile)
- Weight: Bold

**Heading 2:**
- Font: Poppins
- Size: 42px (desktop) / 28px (mobile)
- Weight: Semi-Bold

**Paragraph:**
- Font: Inter (add from Google Fonts if needed)
- Size: 16px
- Weight: Regular

### Step 1.3: Add Global CSS

1. Click **Dev Mode** > **Turn on Dev Mode**
2. In the code panel, find **Global (Site)** > **global.css**
3. Copy the contents of `design/shamrock-styles.css` from the repo
4. Paste into the global.css file

---

## Phase 2: Create CMS Collections

### Step 2.1: Create Counties Collection

1. Go to **CMS** in the left panel
2. Click **Create Collection**
3. Name it: `Counties`
4. Set permissions: **Site content**
5. Add these fields:

| Field Name | Field ID | Type | Required |
|------------|----------|------|----------|
| County Name | `title` | Text | Yes |
| Slug | `slug` | Text | Yes |
| Region | `region` | Text | Yes |
| Sheriff Office Name | `sheriffOfficeName` | Text | Yes |
| Sheriff Website | `sheriffWebsite` | URL | Yes |
| Sheriff Phone | `sheriffPhone` | Text | Yes |
| Sheriff Address | `sheriffAddress` | Text | No |
| Jail Name | `jailName` | Text | No |
| Jail Phone | `jailPhone` | Text | No |
| Inmate Search URL | `inmateSearchUrl` | URL | No |
| Clerk Name | `clerkName` | Text | Yes |
| Clerk Website | `clerkWebsite` | URL | Yes |
| Clerk Phone | `clerkPhone` | Text | Yes |
| County Seat | `countySeat` | Text | No |
| Major Cities | `majorCities` | Text | No |
| Meta Title | `metaTitle` | Text | Yes |
| Meta Description | `metaDescription` | Text | Yes |
| Is Active | `isActive` | Boolean | Yes |
| Featured | `featured` | Boolean | No |
| Sort Order | `sortOrder` | Number | No |

### Step 2.2: Create Other Collections

Repeat the process for these collections (see `database/CMS-COLLECTIONS.md` for full schemas):

- **FAQs** - For FAQ content
- **Testimonials** - For customer testimonials
- **ContactSubmissions** - For contact form data
- **MemberDocuments** - For uploaded documents
- **BailSchoolSignups** - For bail school interest

---

## Phase 3: Import County Data

### Step 3.1: Prepare Data

1. Open `content/counties/all-counties-content.json`
2. Convert to CSV format (or use Wix's JSON import if available)

### Step 3.2: Import to Wix

1. Go to **CMS** > **Counties**
2. Click the **...** menu > **Import**
3. Upload your CSV file
4. Map columns to fields
5. Click **Import**

### Step 3.3: Add Sheriff/Clerk Data

For each county, you'll need to add the sheriff and clerk information from:
- `Florida_SheriffsandClerksDirectory_UPDATED.csv` in the project files

---

## Phase 4: Create Pages

### Step 4.1: Create Public Pages

Create these pages in Wix Editor:

| Page Name | URL | Template |
|-----------|-----|----------|
| Home | / | Blank |
| How Bail Works | /how-bail-works | Blank |
| County Directory | /counties | Blank |
| Contact | /contact | Blank |
| How to Become a Bondsman | /become-a-bondsman | Blank |
| Florida Sheriffs Directory | /sheriffs-directory | Blank |
| Blog | /blog | Use Wix Blog |
| About | /about | Blank |
| Privacy Policy | /privacy-policy | Blank |
| Terms of Service | /terms | Blank |

### Step 4.2: Create Dynamic County Page

1. Go to **CMS** > **Counties**
2. Click **Create Dynamic Page**
3. Set URL pattern: `/counties/{slug}`
4. Design the page layout (see below)

### Step 4.3: Create Members Pages

1. Go to **Members Area** in Wix
2. Create these member-only pages:

| Page Name | URL |
|-----------|-----|
| Start Bail | /members/start-bail |
| My Account | /members/account |
| My Cases | /members/cases |

---

## Phase 5: Add Velo Code

### Step 5.1: Enable Dev Mode

1. Click **Dev Mode** in the top menu
2. Click **Turn on Dev Mode**

### Step 5.2: Add Page Code

For each page, copy the corresponding code from `src/pages/`:

**Home Page:**
1. Select the Home page
2. In the code panel, click on the page code file
3. Copy contents of `src/pages/Home.js`
4. Paste and save

**Repeat for all pages:**
- `HowBailWorks.js` → How Bail Works page
- `CountyDirectory.js` → County Directory page
- `CountyPage-Dynamic.js` → Dynamic County page
- `Contact.js` → Contact page
- `BecomeBondsman.js` → Become a Bondsman page
- `SheriffsDirectory.js` → Sheriffs Directory page
- `members/StartBail.js` → Members Start Bail page
- `members/Account.js` → Members Account page

### Step 5.3: Add Backend Code

1. In the code panel, go to **Backend**
2. Create `signNowIntegration.jsw`
3. Copy contents of `src/backend/signNowIntegration.jsw`
4. Paste and save

### Step 5.4: Add Public Code

1. In the code panel, go to **Public**
2. Create these files and copy corresponding code:
   - `countyUtils.js`
   - `siteHeader.js`
   - `siteFooter.js`

### Step 5.5: Add Secrets

1. Go to **Secrets Manager** in Wix
2. Add these secrets:
   - `SIGNNOW_API_TOKEN` - Your SignNow API token
   - `SIGNNOW_TEMPLATE_ID` - Your document template ID

---

## Phase 6: Delete Unnecessary Pages

### Pages to Delete

Based on the master plan, delete these pages that are no longer needed:

1. **Duplicate/Old Pages:**
   - Any old home page versions
   - Duplicate county pages
   - Test pages

2. **Consolidated Pages:**
   - Old "Services" page (merged into How Bail Works)
   - Old "Areas We Serve" (replaced by County Directory)

3. **Unused Pages:**
   - Any blank placeholder pages
   - Draft pages never published

### How to Delete:

1. Go to **Pages** panel
2. Hover over the page to delete
3. Click the **...** menu
4. Select **Delete**
5. Confirm deletion

**⚠️ IMPORTANT:** Before deleting, check if the page has:
- Incoming links from other pages
- External backlinks (check Google Search Console)
- Good SEO rankings

If so, set up 301 redirects first:
1. Go to **Marketing & SEO** > **SEO Tools** > **URL Redirect Manager**
2. Add redirect from old URL to new URL

---

## Phase 7: Test & Publish

### Step 7.1: Test All Pages

Test each page on:
- [ ] Desktop browser
- [ ] Mobile browser (or use Wix mobile preview)
- [ ] Tablet

Check:
- [ ] All links work
- [ ] Forms submit correctly
- [ ] Phone numbers are clickable
- [ ] Images load properly
- [ ] Text is readable

### Step 7.2: Test Member Flow

1. Create a test member account
2. Log in
3. Navigate to Start Bail
4. Complete consent checkboxes
5. Verify SignNow handoff works

### Step 7.3: Test Contact Form

1. Submit a test contact form
2. Verify it saves to ContactSubmissions collection
3. Check any email notifications

### Step 7.4: SEO Check

For each page, verify:
- [ ] Page title is set
- [ ] Meta description is set
- [ ] URL is clean and descriptive
- [ ] Images have alt text

### Step 7.5: Publish

1. Click **Publish** in the top right
2. Review the publish dialog
3. Click **Publish**

---

## Page Design Reference

### Home Page Layout

```
┌─────────────────────────────────────────────┐
│                   HEADER                     │
│  Logo    Nav Links    Call Now   Login      │
├─────────────────────────────────────────────┤
│                                             │
│              HERO SECTION                   │
│   "Get Your Loved One Home Fast"            │
│   [Call Now]  [Start Bail Online]           │
│   Trust badges                              │
│                                             │
├─────────────────────────────────────────────┤
│            HOW IT WORKS                     │
│   Step 1 → Step 2 → Step 3                  │
├─────────────────────────────────────────────┤
│          WHY CHOOSE SHAMROCK                │
│   Feature cards (6 cards, 3x2 grid)         │
├─────────────────────────────────────────────┤
│           COUNTIES WE SERVE                 │
│   Featured county cards + "View All"        │
├─────────────────────────────────────────────┤
│            TESTIMONIALS                     │
│   3 testimonial cards                       │
├─────────────────────────────────────────────┤
│              FAQ PREVIEW                    │
│   3 FAQs + "View All FAQs"                  │
├─────────────────────────────────────────────┤
│            FINAL CTA                        │
│   "Need Help Now?" + Phone + Button         │
├─────────────────────────────────────────────┤
│                 FOOTER                      │
│   Links | Contact | Social | Copyright      │
└─────────────────────────────────────────────┘
```

### Element IDs to Use

When building pages in Wix Editor, use these element IDs so the Velo code works:

**Home Page:**
- `#heroTitle` - Main headline
- `#heroSubtitle` - Subheadline
- `#callNowBtn` - Primary CTA button
- `#startBailBtn` - Secondary CTA button
- `#mobileCallBtn` - Mobile sticky call button
- `#mobileStartBtn` - Mobile sticky start button
- `#stickyMobileCTA` - Mobile sticky bar container
- `#countyRepeater` - Featured counties repeater
- `#testimonialRepeater` - Testimonials repeater

**County Directory:**
- `#countySearch` - Search input
- `#regionFilter` - Region dropdown
- `#countyRepeater` - Counties repeater
- `#countyCount` - Count display
- `#noResultsMessage` - No results text

**Members Start Bail:**
- `#geolocationConsent` - Geolocation checkbox
- `#termsConsent` - Terms checkbox
- `#startPaperworkBtn` - Start button
- `#loadingIndicator` - Loading spinner
- `#errorMessage` - Error display

---

## Troubleshooting

### Code Not Working

1. Check browser console for errors (F12)
2. Verify element IDs match exactly
3. Ensure Dev Mode is enabled
4. Check that all imports are correct

### SignNow Not Connecting

1. Verify API token in Secrets Manager
2. Check that template ID is correct
3. Review backend code for errors
4. Test API connection separately

### Mobile Layout Issues

1. Use Wix's mobile editor to adjust
2. Check breakpoints in CSS
3. Verify mobile CTA bar is showing

### CMS Data Not Loading

1. Check collection permissions
2. Verify field names match code
3. Ensure data is published (not draft)

---

## Support

For questions about this implementation:
- Review the code comments in each file
- Check the `FRONTEND_README.md` for architecture details
- Consult Wix Velo documentation: https://dev.wix.com/docs/velo

For Shamrock business questions:
- Contact the Shamrock team directly
