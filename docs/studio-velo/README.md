# 🚀 Wix Studio Velo Code Directory & Element ID Cheatsheet

> **Target Site:** `a00e3857-675a-493b-91d8-a1dbc5e7c499`  
> **Studio Branch:** "Wix studio version" (`branchId: 12e252e4-45a8-4bcc-840b-64d4edbdcaa4`)  
> **Location:** `docs/studio-velo/`

---

## 1. File Inventory & Studio Page Mapping

| Studio Velo Script | Wix Studio Page Target | Canonical URL | Role & Features |
|---|---|---|---|
| `masterPage.js` | Global Master Page | Site-Wide | Header call/text tracking, mobile drawer, footer dynamic copyright & NAP, GA4 event dispatch. |
| `home.js` | Home | `/` | Emergency hero CTAs, 67-county quick navigator dropdown, 10% Florida bail calculator, FAQ accordion. |
| `county-page.js` | Florida Counties (Item) | `/florida-bail-bonds/{slug}` | Dynamic SEO metadata injection, LocalBusiness JSON-LD schema, official inmate booking & court link buttons. |
| `contact.js` | Contact Us | `/contact` | Emergency intake form submitting to `backend/leadsIntake.jsw` (CRM webhook), spinner states, phone links. |
| `first-appearance.js` | First Appearance Schedules | `/first-appearance` | 20 Florida Judicial Circuit schedule search filter, weekend/holiday times, Zoom court link modals. |
| `portal-landing.js` | Member Portal Login | `/portal-landing` | Role selection (Defendant vs Indemnitor), passwordless Magic Link / SMS OTP access, CRM case session lookup. |

---

## 2. Standard Element ID Dictionary

When building on the visual canvas in Wix Studio, **assign these exact element IDs** in the Studio Inspector panel so the Velo code binds automatically:

### Master Page (Global Header & Footer)
- `#headerCallEnglish` — English Emergency Call button (`tel:2393322245`)
- `#headerCallSpanish` — Spanish Emergency Call button (`tel:7272952245`)
- `#headerTextLink` — 24/7 Text/SMS button (`sms:2399550178`)
- `#headerPortalLogin` — "Client Login" button
- `#headerStartOnline` — "Start Online" emergency button
- `#mobileMenuBtn` — Hamburger menu toggle button
- `#mobileNavDrawer` — Fullscreen / slide-out mobile navigation container
- `#closeNavBtn` — Close button inside mobile navigation
- `#emergencyBanner` — Top alert notification banner
- `#closeBannerBtn` — Dismiss button for top banner
- `#footerYear` — Text element displaying dynamic copyright year
- `#footerCallEnglish`, `#footerCallSpanish`, `#footerTextLink` — Footer contact links

### Home Page (`/`)
- `#heroStartOnline` — Primary Hero CTA ("Start Bail Online Now")
- `#heroCallEnglish` — Hero English Call CTA
- `#heroCallSpanish` — Hero Spanish Call CTA
- `#heroTextSMS` — Hero Text Message CTA
- `#countyDropdown` — 67-County selector dropdown (`#countyDropdown`)
- `#countyGoBtn` — "Go to County Jail" button
- `#calcBailInput` — Total bail amount currency input field
- `#calcSubmitBtn` — "Calculate Premium" button
- `#calcResultBox` — Expandable calculation result container
- `#calcPremiumAmount` — Text displaying calculated 10% premium
- `#calcStatutoryNote` — Legal statutory disclaimer text
- `#faqToggle1` through `#faqToggle6` — Accordion toggle buttons
- `#faqAnswer1` through `#faqAnswer6` — Expandable FAQ answer boxes
- `#faqIcon1` through `#faqIcon6` — `+` / `−` icon indicator text

### Dynamic County Page (`/florida-bail-bonds/{slug}`)
- `#countyDataset` — Wix CMS dataset connected to `Florida Counties`
- `#inmateLookupBtn` — "Search Inmate Roster" button
- `#callJailFacilityBtn` — "Call County Jail" button
- `#clerkWebsiteBtn` — "Clerk of Court Records" button
- `#bondsmanCallBtn` — "Call Bondsman (English)" button
- `#spanishCallBtn` — "Llamar en Español" button
- `#smsBondsmanBtn` — "Text Bondsman" button
- `#startOnlineBtn` — "Start Paperwork Online" button

### Contact Page (`/contact`)
- `#inputName` — Full Name text input
- `#inputPhone` — Phone number text input
- `#inputEmail` — Email address text input
- `#dropdownCounty` — Florida county selection dropdown
- `#inputInmateName` — Inmate full legal name input
- `#inputMessage` — Situation / notes multiline input
- `#submitContactBtn` — "Submit Emergency Inquiry" button
- `#submitSpinner` — Loading spinner indicator (hidden by default)
- `#successBox` — Expandable confirmation container
- `#errorBox` — Expandable error alert container
- `#errorMsgText` — Error message text element

### First Appearance Page (`/first-appearance`)
- `#searchCountyInput` — Real-time filter text input
- `#clearFilterBtn` — Clear search filter button
- `#repeaterSchedules` — Repeater element for court schedules
- `#textCircuitTitle` — Circuit heading inside repeater item
- `#textCountiesList` — Counties served inside repeater item
- `#textWeekdaysTime` — Mon–Fri hearing time text
- `#textWeekendsTime` — Weekend/holiday hearing time text
- `#textCourtLocation` — Courtroom address text
- `#textScheduleNotes` — Special procedures / video notes
- `#btnOpenZoomLink` — "Open Hearing / Zoom Link" button
- `#noResultsBox` — "No circuits match your search" container

### Portal Landing Page (`/portal-landing`)
- `#tabDefendant` — "Defendant Login" tab button
- `#tabIndemnitor` — "Cosigner / Indemnitor Login" tab button
- `#roleDescriptionText` — Dynamic description of chosen portal
- `#inputLoginPhone` — Mobile phone number input
- `#inputLoginEmail` — Email address input
- `#btnSendMagicLink` — "Send Access Link" button
- `#loginSpinner` — Loading spinner indicator
- `#loginSuccessBox` — "Link Dispatched" confirmation container
- `#successDetailText` — Confirmation message details
- `#loginErrorBox` — Error alert container
- `#loginErrorText` — Error details text
