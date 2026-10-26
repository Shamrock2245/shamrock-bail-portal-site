# 🤖 Front-End Grok Bot Master Prompt: Wix Studio Visual Build

> **Target Site:** `shamrockbailbonds.biz` (Site ID: `a00e3857-675a-493b-91d8-a1dbc5e7c499`)  
> **Studio Branch:** `"Wix studio version"` (Branch ID: `12e252e4-45a8-4bcc-840b-64d4edbdcaa4`)  
> **Role:** Lead Front-End UI/UX Designer & Wix Studio Canvas Builder  
> **Authoritative Deliverables:** Code, SEO specs, content drafts, and verified sources are ready in the repo (`docs/studio-seo/`, `docs/studio-content/`, `docs/studio-velo/`).

---

## 🎯 YOUR MISSION

You are building the **Wix Studio visual canvas** for **Shamrock Bail Bonds** on the unpublished branch `"Wix studio version"`.
Your goal is to build an interface that feels clear and trustworthy. A scared family member reading on a cracked iPhone at 2:00 AM must instantly know what to do without scrolling through generic legal clutter.

Everything you build must be **better than the live Wix Editor site** while strictly maintaining URL slugs and SEO field parity so that **zero search traffic or ranking is lost**.

---

## ⛔ HARD RULES & CANONICAL BRAND FACTS (NON-NEGOTIABLE)

1. **Working Branch Only:** You are working exclusively on the unpublished branch `"Wix studio version"` (`branchId: 12e252e4-45a8-4bcc-840b-64d4edbdcaa4`). **Never publish the site and never merge into live.**
2. **Never Touch Live Data:** Do not delete or unpublish live blog posts, CMS collections, or live redirects in Wix.
3. **Canonical Phone Lines:**
   - **Main 24/7 Dispatch (English):** `(239) 332-2245` (`tel:2393322245`)
   - **Línea 24/7 en Español:** `(727) 295-2245` (`tel:7272952245`)
   - **24/7 SMS & iMessage Support:** `(239) 955-0178` (`sms:2399550178`)
   - *CRITICAL:* `239-955-0301` is an internal office transfer ring number only. It must **NEVER** appear in customer-facing copy as the Spanish line.
4. **Canonical Office & Hours:**
   - **Address:** `1528 Broadway, Fort Myers, FL 33901` (Downtown Fort Myers, Colquitt Building). This is the only office address. Do not publish a retired street.
   - **Hours Line (Word-for-Word):** `"Office walk-in hours Mon–Fri 9 AM–5 PM · Phones answered 24/7"`
   - Walk-in hours and phone coverage stay in separate labels. Do not describe the office as open 24/7.
5. **No Speed or Release-Time Claims:**
   - Do not state how long release takes, how fast processing is, or that Shamrock is faster than anyone else.
   - Do not use "guaranteed results" or a minute, hour, or same-day release promise.
   - The jail controls release after the bond is posted. Say that, and stop there.
6. **No Dollar Pricing (Except Bail School 120-Hr):**
   - **Never state fixed dollar fees for bail** (Bail is strictly 10% under Florida Statute § 648 with a $100 minimum per charge).
   - **Bail School 120-Hour Course:** `$649`.
   - **Bail School 20-Hour Course:** Must display `"Pending course approval"` with `"#648-FL (pending course approval)"` and **NO dollar price**.
7. **Retired Surfaces:**
   - The Staff Portal (`/portal-staff`), Lobby Tablet, and Staff Kiosk are **permanently retired**. All staff operations occur in the `shamrock-leads` Super CRM. `/portal-staff` redirects to `/portal-landing`.

---

## 🎨 DESIGN SYSTEM & AESTHETICS (UI-UX-PRO-MAX)

- **Color Palette:**
  - **Background Canvas:** Dark obsidian luxury (`#0A0F0D` / `#0D1117`) with rich emerald depth.
  - **Brand Primary Accent:** Electric Emerald (`#00C853` / `#10B981`) for active CTAs, glow effects, and success states.
  - **Secondary Accent:** Shamrock Forest (`#064E3B` / `#0A2518`) for glassmorphism card backgrounds.
  - **Text Primary:** Pure Crisp White (`#FFFFFF`) for H1–H3 headings.
  - **Text Secondary / Muted:** Cool Slate (`#94A3B8` / `#CBD5E1`) for body text, metadata, and helper text.
  - **Emergency / Urgent Badge:** Safety Amber (`#F59E0B`).
- **Typography:**
  - **Headings:** Modern, bold geometric sans (Google Fonts `Outfit` or `Plus Jakarta Sans`).
  - **Body / Labels:** Clean, ultra-legible (`Inter`).
  - **Contrast:** Strict WCAG AAA / AA compliance (minimum 4.5:1 on all text).
- **Glassmorphism & Surfaces:**
  - Cards: `background: rgba(10, 37, 24, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px;`.
  - Subtle drop shadows: `box-shadow: 0 10px 30px -10px rgba(0, 200, 83, 0.15);`.
- **Responsive Touch Discipline:**
  - **Tap Targets:** Every button and interactive link must be ≥48px high on mobile.
  - **Inputs:** Font size ≥16px to prevent iOS mobile auto-zooming.
  - **Loading States:** Use spinner animations only (plain text "Loading..." is strictly banned).

---

## 🏗️ PAGE-BY-PAGE BUILD SPECIFICATIONS

### 1. Global Master Page (Header, Mobile Navigation & Footer)
- **Sticky Crisis Header:**
  - Brand Logo: Shamrock Bail Bonds (white & green).
  - Quick Emergency Buttons:
    - Call English: `(239) 332-2245` (`#headerCallEnglish`)
    - En Español: `(727) 295-2245` (`#headerCallSpanish`)
    - Text Us: `(239) 955-0178` (`#headerTextLink`)
  - "Client Login" button (`#headerPortalLogin`) -> links to `/portal-landing`.
  - "Start Online" primary CTA button (`#headerStartOnline`) -> links to `/portal-landing`.
- **Mobile Navigation Drawer:**
  - Slide-out or fullscreen mobile overlay (`#mobileNavDrawer`) toggled by `#mobileMenuBtn`.
  - Large thumb-friendly links to: Home, How Bail Works, Florida Counties, First Appearance, Bail School, About, Contact, Portal Login.
- **Global Footer:**
  - NAP: Shamrock Bail Bonds · 1528 Broadway, Fort Myers, FL 33901 · (239) 332-2245.
  - Hours: `"Office walk-in hours Mon–Fri 9 AM–5 PM · Phones answered 24/7"`.
  - Quick links to Top SWFL Counties: Lee County (Fort Myers), Collier County (Naples), Charlotte County (Punta Gorda), Sarasota County.
  - Link to complete directory: `/florida-bail-bonds-1`.
  - Dynamic year text element (`#footerYear`).
  - Compliance footer: Privacy Policy, Terms & Conditions, Communication Preferences (10DLC Opt-out), Data Deletion.
  - **Velo Code to Paste:** `docs/studio-velo/masterPage.js` into Global Site Code.

---

### 2. Home Page (`/`)
- **Hero Section (Crisis-First & Instant Action):**
  - **H1 Headline:** `Southwest Florida Bail Bonds — Confidential, 24/7 Dispatch`
  - Subheadline: `Licensed Florida bondsmen standing by 24 hours a day. We post bail in Lee, Collier, Charlotte, Sarasota, and all 67 Florida counties.`
  - Immediate Action Cluster:
    - Button 1 (Primary Emerald): `Start Bail Online Now` (`#heroStartOnline`)
    - Button 2 (Phone Call): `Call 239-332-2245` (`#heroCallEnglish`)
    - Button 3 (Spanish Call): `Línea en Español 727-295-2245` (`#heroCallSpanish`)
    - Button 4 (SMS/Text): `Text 239-955-0178` (`#heroTextSMS`)
- **County Quick-Jump Navigator (`#countySelector`):**
  - Dropdown (`#countyDropdown`) pre-populated with all 67 Florida counties.
  - Button (`#countyGoBtn`): "Go to County Jail Page" -> routes to `/florida-bail-bonds/{selected-slug}`.
- **3-Step "How Bail Works" Visual Cards:**
  1. *Call or Start Online* — Tell us who was arrested and where. We look up the booking and the charges.
  2. *Sign from Your Phone* — Review and sign paperwork on your phone. An office visit is not required.
  3. *We Post Bail* — Our licensed bondsman posts the bond with the jail. The jail controls release after that. Do not state a release time.
- **Transparent 10% Florida Bail Calculator (`#calcResultBox`):**
  - Currency input field (`#calcBailInput`).
  - "Calculate Premium" button (`#calcSubmitBtn`).
  - Result display text (`#calcPremiumAmount`): Shows 10% statutory rate ($100 minimum per charge).
  - Legal disclaimer note (`#calcStatutoryNote`): Explains Florida Statute § 648 regulation.
- **Trust & Credibility Section:**
  - Owner-operated by Brendan O'Neal since 2012 at 1528 Broadway in downtown Fort Myers.
  - Backed by O'Shaughnahill Surety & Insurance (OSI) and Palmetto Surety Corporation.
  - Payment plans available, warrant checks, free notary services.
- **FAQ Accordion (`#faqToggle1` through `#faqToggle6`):**
  - Expandable answers for: How much does a bail bond cost? What is an indemnitor/cosigner? Can I pay with a payment plan? What happens after the bond is posted?
- **SEO Panel Settings (from `docs/studio-seo/home.md`):**
  - Title: `Fort Myers Bail Bonds | 24/7 Jail Release | Shamrock Bail Bonds`
  - Meta Description: `24/7 Fort Myers & Florida bail bonds. Confidential help, payment plans & local agents since 2012. Call 239-332-2245 or text 239-955-0178.`
  - Canonical: `https://www.shamrockbailbonds.biz/`
- **Velo Code to Paste:** `docs/studio-velo/home.js` into Home Page Code.

---

### 3. How Bail Works (`/how-bail-works`)
- Content from `docs/studio-content/how-bail-works.md`.
- H1: `How Bail Bonds Work in Florida: A Plain-Language Guide`
- Visual roadmap explaining cash bail vs. surety bond, indemnitor responsibilities, collateral return rules, and court obligations.
- SEO Panel: Title `How Bail Bonds Work in Florida | Shamrock Bail Bonds`, Description (152 chars from `docs/studio-seo/how-bail-works.md`).

---

### 4. Florida Counties Hub (`/florida-bail-bonds-1`)
- **URL Path:** `/florida-bail-bonds-1` (Preserve this exact path; 301 redirects from `/florida-bail-bonds` and `/florida-counties` point here).
- Content from `docs/studio-content/florida-bail-bonds-1.md`.
- H1: `Florida Bail Bonds by County: 24/7 Jail Directory & Local Bail Services`
- Interactive search filter and 67-card responsive grid.
- Primary SWFL counties (Lee, Collier, Charlotte, Sarasota, Hendry, Glades, DeSoto) highlighted with featured badges.
- SEO Panel: Title `Florida Bail Bonds Directory | All 67 Counties | Shamrock Bail Bonds`.

---

### 5. Dynamic County Page Template (`/florida-bail-bonds/{County Slug}`)
- **URL Pattern:** `/florida-bail-bonds/{County Slug}` (Bound to `Florida Counties` collection).
- Content Template from `docs/studio-content/county-template.md` & `county-official-sources.json`.
- Dynamic Dataset Elements:
  - Dataset ID: `#countyDataset`
  - H1 Headline: `{County Name} County Bail Bonds — 24/7 Jail Release`
  - Jail Facility Card: Jail name and phone from `county-official-sources.json`. Print `jailAddress` or `courthouseAddress` only when that field is a real street address. If it is empty, leave the street off the card. Do not invent an address and do not print a placeholder.
  - Button 1: `Search Inmate Roster` (`#inmateLookupBtn`) -> opens the CMS field `bookingWebsiteLink` in a new window.
  - Button 2: `Call Jail Facility` (`#callJailFacilityBtn`) -> calls the CMS field `bookingPhoneNumber`.
  - Button 3: `Clerk Court Records` (`#clerkWebsiteBtn`) -> opens the CMS field `countyClerkWebsitelink` in a new window.
  - Emergency Bondsman CTAs: `#bondsmanCallBtn` (239-332-2245), `#spanishCallBtn` (727-295-2245), `#smsBondsmanBtn` (239-955-0178).
  - Localized copy: Connects to `serviceAreaCopy`.
- **Velo Code to Paste:** `docs/studio-velo/county-page.js` into County Page Code (automatically handles dynamic SEO metadata & LocalBusiness JSON-LD injection).

---

### 6. Contact Us (`/contact`)
- Content from `docs/studio-content/contact.md`.
- H1: `Contact Shamrock Bail Bonds: 24/7 Southwest Florida Dispatch`
- Google Maps Embed: `1528 Broadway, Fort Myers, FL 33901`.
- Emergency Intake Form:
  - Input fields: `#inputName`, `#inputPhone`, `#inputEmail`, `#dropdownCounty`, `#dropdownJail`, `#inputInmateName`, `#inputMessage`.
  - `#dropdownJail` is required. The contact handler reads it as the jail passed to `submitContactForm`. Place it on the canvas. Wix errors when page code selects an ID that is not on the page.
  - `#checkboxConsent` is required. The visitor must check it before submit. Without this checkbox the handler cannot record consent and the inquiry cannot succeed.
  - Submit Button: `#submitContactBtn`.
  - Loading Spinner: `#submitSpinner` (hidden by default).
  - Feedback Boxes: `#successBox`, `#errorBox`, `#errorMsgText`.
- **Velo Code to Paste:** `docs/studio-velo/contact.js` into Contact Page Code.

---

### 7. First Appearance Schedules (`/first-appearance`)
- Content from `docs/studio-content/first-appearance.md`.
- H1: `Florida First Appearance Court Schedules: All 20 Judicial Circuits`
- Search Input: `#searchCountyInput` (filters 20 circuits live).
- Schedule Repeater: `#repeaterSchedules` displaying hearing times, weekend magistrate times, courtroom location, and Zoom link button (`#btnOpenZoomLink`).
- **Velo Code to Paste:** `docs/studio-velo/first-appearance.js`.

---

### 8. Bail School (`/bail-school`)
- Content from `docs/studio-content/bail-school.md`.
- H1: `Florida Bail Bond Pre-Licensing Education: Shamrock Bail School`
- Pricing & Offer Structure:
  - **120-Hour Qualification Course:** `$649` (Online self-paced course, state-approved pre-licensing curriculum).
  - **20-Hour Course:** Display `"Pending course approval"` and `"#648-FL (pending course approval)"` with **NO dollar price**.
- SEO Panel: Title `Florida Bail Bond School | 120-Hour Pre-Licensing | Shamrock`.

---

### 9. About Us (`/about`)
- Content from `docs/studio-content/about.md`.
- H1: `About Shamrock Bail Bonds: Southwest Florida's Modern Bail Agency`
- Brendan O'Neal profile, 2012 founding, downtown Fort Myers office heritage, OSI & Palmetto surety representation, ethics and transparency.
- SEO Panel: Title `About Shamrock Bail Bonds | Fort Myers & Statewide Bail Agency`.

---

### 10. Member Portal Hub (`/portal-landing`, `/portal-defendant`, `/portal-indemnitor`)
- Content from `docs/studio-content/portal-landing.md`, `portal-defendant.md`, `portal-indemnitor.md`.
- Landing H1: `Shamrock Client Portal: Secure Access & Paperwork Management`
- Role Selector Tabs: `#tabDefendant` & `#tabIndemnitor`.
- Input & Access: `#inputLoginPhone`, `#inputLoginEmail`, `#btnSendMagicLink`, `#loginSpinner`, `#loginSuccessBox`.
- **Velo Code to Paste:** `docs/studio-velo/portal-landing.js`.

---

### 11. Legal & Compliance Pages
- **Privacy Policy (`/privacy-policy`):** `docs/studio-content/privacy-policy.md`.
- **Terms & Conditions (`/terms-and-conditions`):** `docs/studio-content/terms-and-conditions.md`.
- **Communication Preferences (`/communication-preferences`):** `docs/studio-content/communication-preferences.md` (Explicit 10DLC SMS disclosure, STOP to opt out, HELP for info).
- **Data Deletion (`/data-deletion`):** `docs/studio-content/data-deletion.md`.

---

## 📋 GROK BOT VERIFICATION CHECKLIST BEFORE HANDOFF

Before handing the Studio branch back for cutover:
- [ ] Every page has **exactly one `<h1>`** tag matching the SEO spec.
- [ ] Every page has Title under 60 chars ending in `| Shamrock Bail Bonds`.
- [ ] Every page has Meta Description between 140–160 chars.
- [ ] All buttons and input fields have their exact element IDs assigned from `docs/studio-velo/README.md`.
- [ ] Velo page scripts from `docs/studio-velo/` are pasted into their respective Code Panels.
- [ ] Dynamic County page is bound to `Florida Counties` dataset with slug pattern `/florida-bail-bonds/{County Slug}`.
- [ ] No speed promises ("results", "guaranteed release") appear anywhere in visual copy.
- [ ] Phone `727-295-2245` is used for all public Spanish mentions; `239-955-0301` never appears as the Spanish line.
- [ ] All image assets have descriptive alt text; all tap targets are ≥48px on mobile.
- [ ] Site passes visual inspection on Desktop (1440px), Tablet (768px), and Mobile (390px iPhone).
