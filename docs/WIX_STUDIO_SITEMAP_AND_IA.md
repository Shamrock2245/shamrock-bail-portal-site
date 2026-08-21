# 🗺 Wix Studio Sitemap & Information Architecture

> **Brand:** Shamrock Bail Bonds — *"The Uber of Bail Bonds: Fast. Frictionless. Everywhere."*  
> **HQ / Primary NAP:** 1528 Broadway, Fort Myers, FL 33901 · (239) 332-2245 · admin@shamrockbailbonds.biz  
> **Effective Date:** 2026-08-21  
> **Doctrine:** *The website is the clipboard. The backend is the brain.*

---

## 1. Public Surface Sitemap & Build Status

| Page Name | Canonical URL / Slug | Purpose & Layout Role | Source Code Mapping | Build Status |
|---|---|---|---|---|
| **Home** | `/` | SWFL-dominant hero, instant county/jail picker, 3-step bail explainer, live dispatch signal, testimonials, AI Concierge chat. | `src/pages/HOME.c1dmp.js`<br>`src/pages/masterPage.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Get Someone Out** | `/get-someone-out`<br>*(or `/start`)* | High-conversion emergency landing page for mobile ad traffic & urgent crisis callers; 1-tap role & ID scan launchpad. | `src/pages/HOME.c1dmp.js`<br>`src/pages/IdUploadLightbox.ihrs0.js`<br>`src/public/canonical-paperwork-mapper.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Locate / Jail Lookup** | `/locate`<br>*(or `/inmate-search`)* | Geolocation-driven jail lookup ("Find My Jail" button), direct booking URLs, sheriff contact numbers for all 67 counties. | `src/pages/masterPage.js`<br>`src/backend/geocoding.jsw`<br>`src/public/geolocation-client.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **How Bail Works** | `/how-bail-works` | Step-by-step bail process explainer, collateral rules, payment plans, cosigner responsibilities, FAQ schema. | `src/pages/How Bail Works.lrh65.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **First Appearance** | `/first-appearance`<br>`/first-appearance/:county` | Live first appearance court schedules, 20 judicial circuits, bond hearings, zoom links, and public defender info. | `src/pages/first-appearance.h4fpl.js`<br>`src/backend/first-appearance-router.js`<br>`src/backend/first-appearance-catalog.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Florida Counties** | `/florida-bail-bonds/:slug` | Programmatic dynamic pages for all 67 Florida counties (SEO, booking links, bail schedules, local courthouse NAP). | `src/pages/Florida Counties.qx7lv.js`<br>`src/backend/county-generator.jsw`<br>`src/backend/bail-bonds-router.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Cities / Local Landings** | `/florida-bail-bonds/:city-slug`<br>*(e.g., /cape-coral, /naples)* | High-intent municipality & jail landing pages (Cape Coral, Fort Myers, Naples, Punta Gorda, Lehigh Acres, Lee County Jail). | `src/pages/Florida Counties.qx7lv.js`<br>`src/backend/local-landings.js`<br>`backend/data/allFloridaCounties.json` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Multi-State Expansion** | `/bail-bonds/:state/:county`<br>*(e.g., /bail-bonds/ga/fulton)* | Out-of-state jurisdictional pages for 11+ states (GA, SC, NC, TX, etc.) active when `ServiceAreas.status = live`. | `src/backend/multi-state-router.js`<br>`src/backend/routers.js`<br>`src/public/portal-config.js` | 🔵 **Built-in-Code (Router)**<br>🟡 **Studio Canvas: Not Built** |
| **About Us** | `/about` | Agency history, licensed bondsman credentials, 24/7 dispatch fleet, local SWFL leadership, E-E-A-T schema. | `src/pages/About.xal5r.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Contact** | `/contact` | Office interactive map, live phone numbers (English/Spanish), emergency contact form, office directions. | `src/pages/Contact.ilgty.js`<br>`src/backend/contact-api.jsw` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Newsroom / Blog** | `/blog`<br>`/post/:slug` | Fortune-50 style legal newsroom, bail reform updates, arrest trends, legal explainers, SpeakableSpecification. | `src/pages/Blog.lttyy.js`<br>`src/pages/Post.nc3ia.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Bail School** | `/bail-school` | Public licensing course catalog ($199 20hr / $649 120hr / $49 simulator), state pre-licensing education funnel. | `src/pages/Bail School.sftg6.js`<br>`netlify-embeds/bail-school.html`<br>`src/backend/bailSchool.jsw` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Become a Bondsman** | `/how-to-become-a-bondsman` | Comprehensive career guide for aspiring Florida bail agents, licensing requirements, sponsorship, exam steps. | `src/pages/How to Become a Bondsman.y8dfc.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Legal & Preferences** | `/privacy-policy`<br>`/terms-and-conditions`<br>`/communication-preferences`<br>`/data-deletion` | Mandatory compliance pages: 10DLC SMS consent & opt-out preferences (`CommPrefsManager`), privacy policy, terms. | `src/pages/Privacy Policy.kq1bu.js`<br>`src/pages/terms-and-conditions.e6rv6.js`<br>`src/pages/Communication Preferences.f870g.js`<br>`src/pages/data-deletion.o9dzr.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |

---

## 2. Secure Member Surface Sitemap & Build Status

| Page Name | Canonical URL / Slug | Purpose & Layout Role | Source Code Mapping | Build Status |
|---|---|---|---|---|
| **Portal Landing** | `/portal-landing`<br>*(alias: `/portal`)* | Passwordless Magic Link & Phone OTP login hub; role detection and redirect engine. | `src/pages/portal-landing.bagfn.js`<br>`src/backend/portal-auth.jsw`<br>`src/backend/routers.js` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Autopilot Intake Wizard** | `/portal-start` | Mobile/tablet-first wizard: Role choice → Camera ID Scan → Cloud Vision OCR hydration → Delta fields → Preview. | `src/pages/portal-start.js`<br>`src/public/canonical-paperwork-mapper.js`<br>`src/backend/id-ocr-service.jsw`<br>`src/backend/wizard-draft-service.jsw` | 🔵 **Built-in-Code (Velo)**<br>🟡 **Studio Canvas: Not Built** |
| **Defendant Portal** | `/portal-defendant` | Defendant dashboard: Court date tracker, weekly GPS/selfie check-in, bond status, payment schedule. | `src/pages/portal-defendant.skg9y.js`<br>`src/backend/portal-sync.jsw` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Indemnitor Portal** | `/portal-indemnitor` | Primary Indemnitor & Co-Indemnitor dashboard: Party overview, payment plan manager, collateral receipts, signing status. | `src/pages/portal-indemnitor.k53on.js`<br>`src/backend/payments.jsw` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Staff Portal** | `/portal-staff` | Staff walk-in launcher, 15-second lead attachment, instant PIN handoff, bridge to Super CRM. | `src/pages/portal-staff.qs9dx.js`<br>`src/backend/lobby-tablet-service.jsw` | 🟢 **Editor-Live**<br>🟡 **Studio Canvas: Not Built** |
| **Signing Launchpad** | `/sign`<br>*(or `SigningLightbox`)* | Private launchpad hosting Netlify signing frame; renders DocuSeal signer form once staff has issued the verified packet. | `src/lightboxes/SigningLightbox.js`<br>`src/pages/SigningLightbox.sjr0i.js`<br>`src/backend/signing-session-service.jsw` | 🔵 **Built-in-Code (Lightbox)**<br>🟡 **Studio Canvas: Not Built** |
