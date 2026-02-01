# Complete Figma Site Analysis
**URL**: https://pause-heat-20846788.figma.site  
**Analysis Date**: 2026-01-12

## Site Structure Overview

### Navigation Structure

#### Primary Navigation (Top Header - Navy Blue)
- **Logo**: Shamrock Bail Bonds + Badge Icon
- **Tagline**: "Fort Myers Since 2012"
- **Main Menu Links**:
  - How It Works
  - Florida Counties  
  - Why Choose Us
  - Contact
- **CTA Buttons**:
  - Member Login (white button)
  - (239) 332-2245 (blue button with phone icon)

#### Demo Navigation Bar (Yellow Background) - TO REMOVE
This is the redundant demo section that should NOT be included in production:
- **Demo Pages**: County Pages, How Bail Works, Contact Us, Become a Bondsman
- **Popups**: Consent, Emergency, ID Upload, Signing, Help, Cancel
- **Staff Portal** button
- **Sample Counties**: Lee, Miami-Dade, Broward, Palm Beach

**ACTION**: Remove entire yellow demo bar from production implementation

---

## Pages in Figma Site

### 1. Homepage / County Page (Currently Showing Lee County)
**Design Elements to Keep**:

#### Hero Section
- Dark blue gradient background (#1B3A5F to #0066CC)
- Centered white text
- H1: "Bail Bonds in [County] County, Florida"
- Subtitle: Service description
- Two CTAs stacked vertically:
  - Blue button: "Call (239) 332-2245" with phone icon
  - Gold button: "Start Bail Process"

#### Quick Reference Card
- White card with shadow and rounded corners
- Title: "[County] Quick Reference"
- 2x2 Grid Layout:
  - **Sheriff's Office** (top-left): Phone + website link
  - **County Main Jail** (top-right): Address + Inmate Search button
  - **Clerk of Court** (bottom-left): Phone + website link
  - **County Information** (bottom-right): County seat + population

#### About Section
- White background
- H2: "About Bail Bonds in [County] County"
- Body paragraphs with county-specific content

#### Why Choose Us Section
- Light gray background (#F8F9FA)
- H2: "Why Choose Shamrock Bail Bonds in [County] County"
- Checkmark list with 6 features:
  - Available 24/7/365
  - Licensed & Bonded
  - Fast Release
  - Flexible Payment
  - Confidential Service
  - Expert Guidance

#### Process Steps Section
- White background
- H2: "How the Bail Process Works in [County] County"
- 3 numbered steps with blue circle numbers
- Each step has title + description

#### Serving Section
- Brief paragraph about coverage area

#### FAQ Section
- Light gray background
- H2: "Frequently Asked Questions"
- Collapsible/expandable questions
- 5 common questions listed

#### Final CTA Section
- Dark navy background (#1B3A5F)
- White text
- H2: "Need Bail Bonds in [County] County Right Now?"
- Subtitle with urgency message
- Large gold button: "Call (239) 332-2245 Now"

#### Footer
- Dark background (#212529)
- Three columns:
  - **Quick Links**: How Bail Works, Florida County Directory, Why Choose Us, Become a Bondsman, Blog
  - **Top Counties**: List of 8 major counties + "View All 67 Counties" link
  - **Contact Us**: Phone, email, physical address
- Copyright notice + license number
- Privacy Policy + Accessibility links

---

## Lightboxes/Popups (From Demo Bar)

The Figma shows these lightbox buttons in the demo bar. These ARE functional elements that should be implemented:

### 1. **Consent Lightbox**
**Purpose**: Capture consent for metadata and location tracking  
**Trigger**: When user starts paperwork or is out on bond  
**Keep**: YES - Critical for workflow

### 2. **Emergency Lightbox**
**Purpose**: Quick CTA for first-time visitors needing immediate help  
**Trigger**: First-time visitor detection or emergency situation  
**Keep**: YES - Important for conversions

### 3. **ID Upload Lightbox**
**Purpose**: Allow defendants/indemnitors to upload government-issued ID  
**Trigger**: During paperwork process  
**Keep**: YES - Required for automation workflow

### 4. **Signing Lightbox**
**Purpose**: Initiate SignNow paperwork signing process  
**Trigger**: When paperwork is ready for signature  
**Keep**: YES - Core to SignNow integration

### 5. **Help Lightbox**
**Purpose**: Provide help/support information  
**Trigger**: User clicks help or has issues  
**Keep**: YES - User support

### 6. **Cancel Lightbox**
**Purpose**: Confirmation before canceling process  
**Trigger**: When user attempts to cancel  
**Keep**: YES - Prevent accidental cancellations

---

## Additional Pages (Linked from Navigation)

### 2. How It Works Page
**Status**: Referenced in navigation  
**Design**: Not fully visible in current view  
**Action**: Need to navigate to capture design

### 3. Florida Counties Directory Page
**Status**: Referenced in navigation  
**Design**: Likely a list/grid of all 67 counties  
**Action**: Need to navigate to capture design

### 4. Why Choose Us Page
**Status**: Referenced in navigation  
**Design**: Not fully visible  
**Action**: Need to navigate to capture design

### 5. Contact Page
**Status**: Referenced in navigation  
**Design**: Not fully visible  
**Action**: Need to navigate to capture design

### 6. Become a Bondsman Page
**Status**: Referenced in footer and demo bar  
**Design**: Not fully visible  
**Action**: Need to navigate to capture design

---

## Design System Summary

### Colors
- **Primary Navy**: #1B3A5F
- **Action Blue**: #0066CC
- **Shamrock Gold**: #FDB913
- **White**: #FFFFFF
- **Off-White/Light Gray**: #F8F9FA
- **Near Black**: #212529
- **Dark Gray**: #343A40

### Typography
- **Headings**: Poppins, 600-700 weight
- **Body**: Inter, 400 weight
- **Mobile H1**: 36px
- **Mobile H2**: 28px
- **Mobile Body**: 16px

### Components
- **Buttons**: 8px border-radius, 14px padding
- **Cards**: 12px border-radius, 24px padding, subtle shadow
- **Icons**: 24px for section icons, 16px for checkmarks

### Spacing
- **Section Padding**: 48px top/bottom (mobile), 20px sides
- **Card Margins**: 24px between sections
- **Grid Gap**: 20px

---

## Elements to REMOVE (Demo/Redundant)

### Yellow Demo Navigation Bar
**Remove Entirely**:
- "Demo Pages:" label and all demo page buttons
- "Popups:" label (but keep the lightbox functionality)
- "Staff Portal" button in demo bar (may exist elsewhere legitimately)
- "Sample Counties:" label and county buttons (Lee, Miami-Dade, Broward, Palm Beach)

**Reason**: These are navigation aids for the Figma prototype, not production features

---

## Elements to KEEP

### All Functional Elements
✅ Primary navigation (navy header)  
✅ Logo and branding  
✅ Member Login button  
✅ Phone CTA button  
✅ Hero section with gradient  
✅ Quick Reference card  
✅ All content sections  
✅ Footer with links  
✅ All lightbox FUNCTIONALITY (just not the demo bar)  

### All Design Elements
✅ Color scheme  
✅ Typography  
✅ Button styles  
✅ Card designs  
✅ Grid layouts  
✅ Icons and checkmarks  
✅ Spacing and padding  

---

## Workflows to Preserve

Based on existing Wix repository analysis:

### 1. **SignNow Integration Workflow**
- ID Upload → Consent → Document Generation → Signing
- **Files**: `signnow-webhooks.web.js`, `SigningLightbox.js`
- **Status**: Must preserve completely

### 2. **Portal Authentication Workflow**
- Custom role-based system (not Wix default)
- Roles: Defendant, Indemnitor, Staff
- **Files**: `portal-landing.bagfn.js`, `portal-defendant.skg9y.js`, `portal-indemnitor.k53on.js`, `portal-staff.qs9dx.js`
- **Status**: Must preserve completely

### 3. **Location Tracking Workflow**
- GPS consent → Location capture → Storage
- **Files**: `geolocation-client.js`, `location-tracker.js`
- **Status**: Must preserve completely

### 4. **Lightbox Controller Workflow**
- Programmatic triggering of lightboxes
- **Files**: `lightbox-controller.js`
- **Status**: Must preserve completely

---

## Next Steps

1. ✅ Navigate to other pages in Figma to capture complete designs
2. ✅ Document lightbox designs in detail
3. ✅ Map Figma elements to existing Wix element IDs
4. ✅ Create comprehensive CSS for all pages
5. ✅ Update JavaScript to match Figma interactions
6. ✅ Test all workflows remain functional
7. ✅ Deploy to production

---

## Notes

- The Figma site is a **design prototype**, not a functional site
- The yellow demo bar is **scaffolding for the prototype** only
- All **lightbox functionality** exists in the real Wix site already
- The goal is to apply the **visual design** while preserving **all workflows**
- Focus on **mobile-first** implementation
