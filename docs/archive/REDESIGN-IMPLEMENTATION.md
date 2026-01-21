# Shamrock Bail Bonds - Redesign Implementation Guide

This document provides instructions for implementing the redesigned Shamrock Bail Bonds website using the Velo code files in this repository.

## 📦 What's Been Built

The following Velo code files have been created for the redesign:

### Backend Modules

- **`src/backend/counties.jsw`** - Backend module for securely accessing Florida county data
- **`src/backend/data/florida-sheriff-clerk-directory.json`** - Complete data for all 67 Florida counties

### Page Code Files

- **`src/pages/Home-Redesign.js`** - Redesigned homepage with county selector and action form
- **`src/pages/CountyDirectory-Redesign.js`** - Florida County Directory page with search and filtering
- **`src/pages/CountyPage-Redesign.js`** - Template for individual county pages (67 pages)
- **`src/pages/BecomeABondsman-Redesign.js`** - "How to Become a Bondsman" educational page

## 🎨 Design System

### Color Palette

The redesign uses a professional, trust-building color palette:

- **Primary Navy Blue:** `#1B3A5F` (headers, navigation, primary text)
- **Clean White:** `#FFFFFF` (backgrounds, text-on-dark)
- **Neutral Gray:** `#F5F7FA` (secondary backgrounds)
- **Shamrock Gold:** `#FDB913` (accent color from logo)
- **Action Blue:** `#0066CC` (primary CTA buttons)
- **Success Green:** `#28A745` (status indicators)
- **Alert Red:** `#DC3545` (errors, urgent notices)

### Typography

- **Headlines (H1, H2):** Serif font (Merriweather or Playfair Display)
- **Body Text & UI:** Sans-serif font (Open Sans or Inter)
- **Font Sizes:**
  - H1: 48px desktop / 32px mobile
  - H2: 36px desktop / 28px mobile
  - Body: 18px desktop / 16px mobile

## 🔧 Implementation Steps

### Step 1: Set Up in Wix Editor

1. Open your Wix site in the Wix Editor
2. Enable Velo Dev Mode (if not already enabled)
3. Sync your GitHub repository with Wix

### Step 2: Create Pages in Wix Editor

You need to create the following pages in the Wix Editor. The Velo code files will connect to these pages.

#### Homepage
- **Page Name:** Home
- **URL:** `/`
- **Code File:** `Home-Redesign.js`

**Required Elements:**
- `#countyDropdown` - Dropdown for county selection
- `#getStartedButton` - Primary CTA button
- `#callNowButton` - Phone number button
- `#memberLoginButton` - Member login link
- `#trustIndicator1` through `#trustIndicator4` - Trust bar elements
- `#learnMoreButton` - Learn more CTA
- `#viewDirectoryButton` - View directory CTA

#### Florida County Directory
- **Page Name:** Florida County Directory
- **URL:** `/florida-county-directory`
- **Code File:** `CountyDirectory-Redesign.js`

**Required Elements:**
- `#searchInput` - Search bar for filtering counties
- `#countiesRepeater` - Repeater to display all counties
  - Inside repeater: `#countyName`, `#bailBondsButton`, `#sheriffLink`, `#clerkLink`, `#statusBadge`
- `#countyCountText` - Display total county count
- `#noResultsMessage` - Message when no search results

#### Individual County Pages
- **Page Type:** Dynamic Page
- **URL Pattern:** `/bail-bonds/:countySlug`
- **Code File:** `CountyPage-Redesign.js`

**Required Elements:**
- `#pageTitle` - County name headline
- `#introText` - Introduction paragraph
- `#statusBadge` - Active/Planned status
- `#sheriffNameText`, `#clerkNameText` - Official names
- `#sheriffLink`, `#clerkLink` - Resource links
- `#startBailButton` - Primary CTA
- `#callNowButton` - Phone CTA
- `#localContentText` - Unique local content

#### How to Become a Bondsman
- **Page Name:** How to Become a Bondsman
- **URL:** `/become-a-bondsman`
- **Code File:** `BecomeABondsman-Redesign.js`

**Required Elements:**
- `#faq1` through `#faq5` - FAQ accordion items
- `#interestForm` - Shamrock Bail School interest form
  - `#firstNameInput`, `#lastNameInput`, `#emailInput`
  - `#licensingStageDropdown`
  - `#submitInterestButton`
- `#successMessage` - Form success message
- `#formErrorMessage` - Form error message

### Step 3: Design the Pages

Use the design specifications in `/home/ubuntu/shamrock-redesign/` to design each page:

1. Apply the color palette to all elements
2. Set typography according to the design system
3. Add the Shamrock logo to the header
4. Use the Colquitt Building image as the hero background
5. Create the trust indicators section with icons
6. Design the county cards for the repeater
7. Style all buttons with the Action Blue color

### Step 4: Connect Code to Pages

1. In the Wix Editor, go to each page
2. Open the Code Panel
3. Replace the default code with the corresponding `-Redesign.js` file content
4. Ensure all element IDs match between the design and the code

### Step 5: Test Functionality

Test each page thoroughly:

- **Homepage:** Select a county and click "Get Started" - should navigate to county page
- **County Directory:** Search for counties, click links to sheriff/clerk sites
- **County Pages:** Verify all 67 counties load correctly with unique content
- **Become a Bondsman:** Submit the interest form and verify it creates a contact in Wix CRM

### Step 6: Mobile Testing

Test all pages on mobile devices:

- Verify the sticky call button appears on mobile
- Ensure all forms are easy to fill out on small screens
- Check that the county dropdown is touch-friendly
- Verify phone numbers are one-tap callable

### Step 7: SEO Configuration

For each page, configure:

- Page title (automatically set by code for county pages)
- Meta description
- Open Graph tags
- Structured data (LocalBusiness schema for county pages)

## 🚀 Deployment

Once testing is complete:

1. Commit all changes to your GitHub repository
2. Wix will automatically sync the changes
3. Publish the site from the Wix Editor
4. Monitor analytics for conversion improvements

## 📊 Expected Improvements

After implementation, you should see:

1. **SEO Rankings:** Improved rankings for "[county name] bail bonds" searches
2. **Conversion Rate:** Higher percentage of visitors starting the bail process
3. **Mobile Performance:** Better mobile user experience and engagement
4. **Brand Perception:** More professional, trustworthy appearance

## 🔗 Key Features

### Homepage
- Immediate action form with county selector
- Trust indicators (20+ years, licensed, 67 counties, 24/7)
- 3-step process visualization
- Statewide coverage map

### County Directory
- Real-time search and filtering
- Direct links to sheriff arrest searches
- Direct links to clerk of court websites
- Active/Planned status indicators

### County Pages
- SEO-optimized for local search
- Unique content for each county
- Direct resource links
- Conversion-focused CTAs

### Become a Bondsman
- Comprehensive step-by-step guide
- Shamrock Bail School lead capture
- FAQ accordion
- CRM integration

## ⚠️ Critical Notes

1. **SignNow Integration:** The Members Area pages (`portal-*.js`) have NOT been modified. The existing SignNow workflow remains completely intact.

2. **Backend Schema:** All county data follows the schema from the `swfl-arrest-scrapers` repository.

3. **Analytics:** The code includes placeholder analytics tracking. Integrate with your preferred analytics platform (Google Analytics, Facebook Pixel, etc.).

4. **CRM Integration:** The Become a Bondsman form uses Wix CRM. Ensure your CRM is properly configured.

## 📞 Support

For questions about this implementation, refer to:

- **Master Plan:** `/home/ubuntu/shamrock-redesign/SHAMROCK-REDESIGN-MASTER-PLAN.md`
- **Design Specs:** Individual page specification files in `/home/ubuntu/shamrock-redesign/`
- **Velo Docs:** https://dev.wix.com/docs/velo

---

**Implementation Date:** December 19, 2025  
**Version:** 1.0  
**Status:** Ready for Wix Editor Implementation
