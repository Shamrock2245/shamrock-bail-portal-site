# Shamrock Bail Bonds - Front-End Redesign

This document covers the front-end redesign implementation for the Shamrock Bail Bonds website.

## 🍀 Redesign Overview

This redesign implements a modern, professional, mobile-first website that improves conversions and makes the bail process feel effortless—while preserving all existing operational workflows.

### Design Principles

- **Mobile-First**: Optimized for the majority of users who access on mobile devices
- **Conversion-Focused**: Clear CTAs visible within 3 seconds
- **Trust-Building**: Professional, calm aesthetic for high-stress situations
- **SEO-Optimized**: 67 individual county pages for statewide dominance

## 📁 Front-End Code Structure

```
src/
├── pages/                        # Page-specific Velo code
│   ├── Home.js                   # Homepage with hero, CTAs, trust indicators
│   ├── HowBailWorks.js           # Educational content with timeline
│   ├── CountyDirectory.js        # All 67 counties listing with filters
│   ├── CountyPage.js             # Individual county template (dynamic)
│   ├── BecomeBondsman.js         # Career information + Bail School teaser
│   ├── Blog.js                   # Blog listing with categories
│   ├── Contact.js                # Contact form and info
│   ├── SheriffsDirectory.js      # Sheriffs & Clerks resource directory
│   ├── masterPage.js             # Global page code (header, footer, analytics)
│   └── members/
│       ├── StartBail.js          # Consent collection → SignNow handoff
│       └── Account.js            # Member profile + document upload
├── public/                       # Shared modules
│   ├── countyUtils.js            # County data (67 counties) + utilities
│   ├── siteHeader.js             # Header component with navigation
│   └── siteFooter.js             # Footer component
├── backend/
│   └── signNowIntegration.jsw    # SignNow API integration (server-side)
├── styles/
│   └── global.css                # Complete CSS design system
└── data/
    └── floridaCounties.json      # County data with sheriff/clerk info
```

## 🎨 Design System

### Color Palette

| Color | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Deep Navy Blue | `#1B3A5F` | `--color-navy` | Primary brand, headers |
| Action Blue | `#0066CC` | `--color-action` | CTAs, links, buttons |
| Shamrock Gold | `#FDB913` | `--color-gold` | Accent, highlights |
| Soft White | `#F8F9FA` | `--color-soft-white` | Page backgrounds |
| Charcoal | `#2D3436` | `--color-charcoal` | Body text |
| Success Green | `#00B894` | `--color-success` | Confirmations |
| Alert Red | `#E74C3C` | `--color-error` | Warnings, errors |

### Typography

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-heading: 'Poppins', var(--font-primary);
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Button Styles

- `.btn-primary` - Action Blue, main CTAs
- `.btn-secondary` - Navy, secondary actions
- `.btn-accent` - Gold, special highlights
- `.btn-outline` - Bordered, subtle actions
- `.btn-ghost` - Transparent, minimal

## 📱 Mobile-First Features

### Sticky Mobile CTA Bar

A fixed bottom bar on mobile with two primary actions:
- **Call Now** - Direct phone link
- **Start Bail** - Navigate to members portal

### Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## 📄 Page Specifications

### Home Page (`/`)

**Sections:**
1. Hero with dual CTAs (Call Now, Start Bail)
2. Trust indicators bar
3. How it works (3-step process)
4. County selector
5. Testimonials
6. FAQ preview
7. Final CTA

**Key Elements:**
- `#heroSection` - Main hero
- `#callNowBtn` - Primary CTA
- `#startBailBtn` - Secondary CTA
- `#countySelector` - County dropdown
- `#stickyMobileCTA` - Mobile sticky bar

### County Pages (`/bail-bonds/{county}-county`)

**Dynamic content:**
- County name and hero
- Sheriff/Clerk quick links
- Local jail information
- Nearby counties
- SEO-optimized meta tags

**Data Source:** `public/countyUtils.js` or Wix Data collection

### Members Portal

**Start Bail Page (`/members/start-bail`):**
1. Login check (redirect if not authenticated)
2. Consent collection:
   - Geolocation permission
   - Terms of service
   - Communication preferences
3. **SignNow handoff** (SignNow owns everything after this)

**Account Page (`/members/account`):**
- Profile information
- Document upload (Government ID required)
- Case history (if applicable)

## 🔧 Wix Editor Setup

### Element ID Mapping

When setting up pages in Wix Editor, use these element IDs:

```
Header:
- #headerLogo
- #headerCallBtn
- #startBailBtn
- #loginBtn / #accountBtn
- #mobileMenuBtn

Footer:
- #footerPhone
- #footerEmail
- #footerAddress
- #copyrightText

Home Page:
- #heroSection
- #heroTitle
- #heroSubtitle
- #callNowBtn
- #startBailBtn
- #countySelector
- #trustBar
- #stickyMobileCTA

County Pages:
- #countyName
- #sheriffLink
- #sheriffPhone
- #clerkLink
- #clerkPhone
- #recordsLink
- #nearbyCountiesRepeater

Members Pages:
- #geolocationConsent
- #termsConsent
- #startPaperworkBtn
- #idUploadBtn
- #documentsRepeater
```

### Data Collections

Create these Wix Data collections:

1. **FloridaCounties** - County information
2. **MemberProfiles** - Extended member data
3. **MemberDocuments** - Uploaded documents
4. **ContactSubmissions** - Contact form submissions
5. **SignNowHandoffs** - Handoff logging
6. **BailStartLogs** - Bail initiation logs

## 🚀 Implementation Steps

### Phase 1: Core Pages
1. Set up design system (colors, fonts, spacing)
2. Create master page with header/footer
3. Build Home page
4. Build How Bail Works page
5. Build Contact page

### Phase 2: County System
1. Create County Directory page
2. Create County Page template
3. Populate with 67 county data
4. Set up dynamic routing

### Phase 3: Members Portal
1. Set up Members Area in Wix
2. Create Login page
3. Create Account page with document upload
4. Create Start Bail page with consent flow
5. Integrate SignNow handoff

### Phase 4: Supporting Pages
1. Become a Bondsman page
2. Sheriffs & Clerks Directory
3. Blog structure
4. Legal pages (Privacy, Terms)

### Phase 5: Polish
1. SEO optimization
2. Performance optimization
3. Analytics setup
4. Testing across devices

## ⚠️ Critical Reminders

### SignNow Integration

The website is a **launchpad only**. After the user clicks "Start Bail Paperwork":
- SignNow owns the entire paperwork experience
- Do not duplicate or intercept SignNow flows
- Do not store sensitive paperwork data on Wix

### Schema Alignment

All data must align with: `https://github.com/Shamrock2245/swfl-arrest-scrapers`

### Workflow Protection

- Do not modify Google Apps Script workflows
- Do not break existing automations
- Build around existing systems

## 📞 Support

- **Phone**: 239-332-2245
- **Email**: info@shamrockbailbonds.biz

---

*Shamrock Bail Bonds Website Redesign - December 2024*
