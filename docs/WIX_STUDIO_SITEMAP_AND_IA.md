# 🗺 Wix Studio Sitemap & Information Architecture

> **Brand:** Shamrock Bail Bonds — *"The Uber of Bail Bonds: Fast. Frictionless. Everywhere."*  
> **HQ / Primary NAP:** 1528 Broadway, Fort Myers, FL 33901 · (239) 332-2245 · admin@shamrockbailbonds.biz  
> **Effective Date:** 2026-08-21  
> **Doctrine:** *The website is the clipboard. The backend is the brain.*

---

## 1. Growth Ladder Navigation & Global Header / Footer Architecture

### Global Header Specifications
- **Sticky Emergency Bar:** `Call 24/7: (239) 332-2245` visible & clickable on every breakpoint (Mobile, Tablet, Desktop).
- **Primary CTA Button:** `Get Them Out` → routes to `/portal-start` or `/get-someone-out`.
- **Secondary CTA Button:** `Client Login` → routes to `/portal-landing`.
- **Header County Selector:** Quick dropdown prioritizing SWFL (Lee, Collier, Charlotte, Hendry, Glades) then all 67 FL counties.
- **Expansion Badge:** *"Licensed in Florida · Expanding Nationwide"* (CMS-driven dynamic states registry; does NOT clutter main navigation with inactive states).

### Global Footer Specifications
- **Flagship NAP Block:** Shamrock Bail Bonds LLC, 1528 Broadway, Fort Myers, FL 33901 · (239) 332-2245.
- **Interactive County Selector & Directory:** Full 67 Florida County directory links.
- **Licensed Expansion Footer Section:** Dynamic listing of active multi-state jurisdictions from `ServiceAreas` CMS (`GA`, `SC`, `NC`, `TX`, etc.).
- **Quick Links:** Bail School, First Appearance Live Calendars, How Bail Works, Inmate Lookup, Payment Plans, Privacy, Terms, Comm Prefs.
- **Dynamic Year:** © {Current Year} Shamrock Bail Bonds, LLC. All rights reserved.

---

## 2. Public Surface Sitemap

| Page Name | Canonical URL / Slug | Purpose & Layout Role | Existing Source Code Mapping |
|---|---|---|---|
| **Home** | `/` | SWFL-dominant hero, instant county/jail picker, 3-step bail explainer, live dispatch signal, testimonials, AI Concierge chat. | `src/pages/HOME.c1dmp.js`<br>`src/pages/masterPage.js` |
| **Get Someone Out** | `/get-someone-out`<br>*(or `/start`)* | High-conversion emergency landing page for mobile ad traffic & urgent crisis callers; 1-tap role & ID scan launchpad. | `src/pages/HOME.c1dmp.js`<br>`src/pages/IdUploadLightbox.ihrs0.js`<br>`src/public/canonical-paperwork-mapper.js` |
| **Locate / Jail Lookup** | `/locate`<br>*(or `/inmate-search`)* | Geolocation-driven jail lookup ("Find My Jail" button), direct booking URLs, sheriff contact numbers for all 67 counties. | `src/pages/masterPage.js`<br>`src/backend/geocoding.jsw`<br>`src/public/geolocation-client.js` |
| **How Bail Works** | `/how-bail-works` | Step-by-step bail process explainer, collateral rules, payment plans, cosigner responsibilities, FAQ schema. | `src/pages/How Bail Works.lrh65.js` |
| **First Appearance** | `/first-appearance`<br>`/first-appearance/:county` | Live first appearance court schedules, 20 judicial circuits, bond hearings, zoom links, and public defender info. | `src/pages/first-appearance.h4fpl.js`<br>`src/backend/first-appearance-router.js`<br>`src/backend/first-appearance-catalog.js` |
| **Florida Counties** | `/florida-bail-bonds/:slug` | Programmatic dynamic pages for all 67 Florida counties (SEO, booking links, bail schedules, local courthouse NAP). | `src/pages/Florida Counties.qx7lv.js`<br>`src/backend/county-generator.jsw`<br>`src/backend/bail-bonds-router.js` |
| **Cities / Local Landings** | `/florida-bail-bonds/:city-slug`<br>*(e.g., /cape-coral, /naples)* | High-intent municipality & jail landing pages (Cape Coral, Fort Myers, Naples, Punta Gorda, Lehigh Acres, Lee County Jail). | `src/pages/Florida Counties.qx7lv.js`<br>`src/backend/local-landings.js`<br>`backend/data/allFloridaCounties.json` |
| **Multi-State Expansion** | `/bail-bonds/:state/:county`<br>*(e.g., /bail-bonds/ga/fulton)* | Out-of-state jurisdictional pages for 11+ states (GA, SC, NC, TX, etc.) active when `ServiceAreas.status = live`. | `src/backend/multi-state-router.js`<br>`src/backend/routers.js`<br>`src/public/portal-config.js` |
| **About Us** | `/about` | Agency history, licensed bondsman credentials, 24/7 dispatch fleet, local SWFL leadership, E-E-A-T schema. | `src/pages/About.xal5r.js` |
| **Contact** | `/contact` | Office interactive map, live phone numbers (English/Spanish), emergency contact form, office directions. | `src/pages/Contact.ilgty.js`<br>`src/backend/contact-api.jsw` |
| **Newsroom / Blog** | `/blog`<br>`/post/:slug` | Fortune-50 style legal newsroom, bail reform updates, arrest trends, legal explainers, SpeakableSpecification. | `src/pages/Blog.lttyy.js`<br>`src/pages/Post.nc3ia.js` |
| **Bail School** | `/bail-school` | Public licensing course catalog ($199 20hr / $649 120hr / $49 simulator), state pre-licensing education funnel. | `src/pages/Bail School.sftg6.js`<br>`netlify-embeds/bail-school.html`<br>`src/backend/bailSchool.jsw` |
| **Become a Bondsman** | `/how-to-become-a-bondsman` | Comprehensive career guide for aspiring Florida bail agents, licensing requirements, sponsorship, exam steps. | `src/pages/How to Become a Bondsman.y8dfc.js` |
| **Legal & Preferences** | `/privacy-policy`<br>`/terms-and-conditions`<br>`/communication-preferences`<br>`/data-deletion` | Mandatory compliance pages: 10DLC SMS consent & opt-out preferences (`CommPrefsManager`), privacy policy, terms. | `src/pages/Privacy Policy.kq1bu.js`<br>`src/pages/terms-and-conditions.e6rv6.js`<br>`src/pages/Communication Preferences.f870g.js`<br>`src/pages/data-deletion.o9dzr.js` |

---

## 3. Secure Member Surface Sitemap

| Page Name | Canonical URL / Slug | Purpose & Layout Role | Existing Source Code Mapping |
|---|---|---|---|
| **Portal Landing** | `/portal-landing`<br>*(alias: `/portal`)* | Passwordless Magic Link & Phone OTP login hub; role detection and redirect engine. | `src/pages/portal-landing.bagfn.js`<br>`src/backend/portal-auth.jsw`<br>`src/backend/routers.js` |
| **Autopilot Intake Wizard** | `/portal-start` | Mobile/tablet-first wizard: Role choice → Camera ID Scan → Cloud Vision OCR hydration → Delta fields → Preview. | `src/public/canonical-paperwork-mapper.js`<br>`src/lightboxes/IdUploadLightbox.js`<br>`src/public/defendant-wizard.html`<br>`src/public/indemnitor-wizard.html` |
| **Defendant Portal** | `/portal-defendant` | Defendant dashboard: Court date tracker, weekly GPS/selfie check-in, bond status, payment schedule. | `src/pages/portal-defendant.skg9y.js`<br>`src/backend/portal-sync.jsw` |
| **Indemnitor Portal** | `/portal-indemnitor` | Primary Indemnitor & Co-Indemnitor dashboard: Party overview, payment plan manager, collateral receipts, signing status. | `src/pages/portal-indemnitor.k53on.js`<br>`src/backend/payments.jsw` |
| **Staff Portal** | `/portal-staff` | Staff intake queue monitor, instant PIN portal handoff, case lookup, bridge to Super CRM. | `src/pages/portal-staff.qs9dx.js`<br>`src/public/staff-portal.html`<br>`src/backend/intakeQueue.jsw` |
| **Signing Launchpad** | `/sign`<br>*(or `SigningLightbox`)* | Private launchpad hosting Netlify signing frame; renders DocuSeal signer form once staff has issued the verified packet. | `src/lightboxes/SigningLightbox.js`<br>`src/pages/SigningLightbox.sjr0i.js`<br>`src/public/portal-config.js` |

---

## 4. Lightboxes & Modals Mapping

| Lightbox Name | Role & Trigger | Existing Source Code Mapping |
|---|---|---|
| **`SigningLightbox`** | Primary paperwork iframe bridge (postMessage handshake with Netlify app & DocuSeal signer). | `src/lightboxes/SigningLightbox.js`<br>`src/pages/SigningLightbox.sjr0i.js` |
| **`IdUploadLightbox`** | Camera ID capture modal with dual-sided preview, OCR extraction, and fallback input fields. | `src/lightboxes/IdUploadLightbox.js`<br>`src/pages/IdUploadLightbox.ihrs0.js` |
| **`DefendantDetails`** | Quick case details preview showing charges, bond amount, jail facility, and court date. | `src/lightboxes/DefendantDetails.js`<br>`src/pages/DefendantDetails.jgsv8.js` |
| **`ConsentLightbox`** | Explicit 10DLC, terms of service, and electronic signature legal consent capture. | `src/lightboxes/ConsentLightbox.js`<br>`src/pages/ConsentLightbox.jdcsn.js` |
| **`EmergencyCtaLightbox`** | Instant 1-tap call/text emergency modal for urgent crisis visitors. | `src/lightboxes/EmergencyCtaLightbox.js` |
| **`StudentIntegrityLightbox`**| Florida Department of Financial Services (DFS) affidavit modal for Bail School students. | `src/lightboxes/StudentIntegrityLightbox.js` |

---

## 5. Architectural Guardrails & Clipboard Boundary

```
      WIX STUDIO (THE CLIPBOARD)                   SUPER CRM / GAS (THE BRAIN)
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  • Public Education & County SEO     │     │  • 20+ County Arrest Jail Scrapers   │
│  • Sticky (239) 332-2245 Header/CTA  │     │  • Flight Risk & Underwriting AI     │
│  • Magic Link & OTP Member Auth      │ ──→ │  • Party & Defendant Matching        │
│  • Camera ID Scan & OCR Hydration    │     │  • Surety Carrier & POA Selection    │
│  • Gaps-Only Delta Field Collection  │     │  • Staff Approval Gate               │
│  • SigningLightbox Launchpad Shell   │     │  • DocuSeal Submission Issuance      │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

- **Wix NEVER creates DocuSeal packets directly.**
- **Wix NEVER replaces Super CRM underwriting authority.**
- **Staff issues legal packets inside Super CRM (`shamrock-leads`); the client signs inside the Wix/Netlify launchpad.**
