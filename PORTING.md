# 📦 Wix Studio Velo Code Porting Guide

> **Repo:** `Shamrock2245/shamrock-bail-portal-site`  
> **Source Branch:** Live Editor (`origin/main`)  
> **Target Branch:** Wix Studio Version (`branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4`)  
> **Target Site:** `a00e3857-675a-493b-91d8-a1dbc5e7c499`  
> **Doctrine:** *The website is a clipboard; the backend is the brain.*

---

## 1. Architectural Overview & Wix Studio CLI Context

Wix Studio branches created from templates initialize with clean default Velo files. Because the Wix CLI (`@wix/cli`) default targets branch `00000000-0000-0000-0000-000000000000` (the active live Editor branch), code transfer to the Studio branch must be executed either via Wix Studio Git branch synchronization or via direct copy-paste into the Wix Studio Code Panel.

**CRITICAL RULE:** Under no circumstances delete, unpublish, or modify the live site code in `src/`. All files below represent the production backend and page logic that powers intake, CRM sync, authentication, and dynamic routing.

---

## 2. Master File Inventory & Porting Targets

### A. HTTP Webhooks & Entry Points (`src/backend/`)

| File Path in Repo | Purpose & Functions | Studio Code Panel Destination | Priority |
|---|---|---|---|
| `src/backend/http-functions.js` | Main external HTTP webhook router. Handles `/get_intake`, `/post_intake`, `/post_docuseal_webhook`, `/post_swipesimple_webhook`, `/get_active_cases`. | Backend → `http-functions.js` | 🔴 P0 Critical |
| `src/backend/http-auth.js` | HMAC-SHA256 signature verification and API key validation for incoming webhooks (`WIX_WEBHOOK_SECRET`). | Backend → `http-auth.js` | 🔴 P0 Critical |
| `src/backend/data.js` | Wix CMS Data Hooks (`beforeInsert`, `beforeUpdate`, `afterInsert`) for collections: `IntakeQueue`, `Cases`, `MagicLinks`, `PortalSessions`. Normalizes phone numbers and logs audit events. | Backend → `data.js` | 🔴 P0 Critical |
| `src/backend/jobs.config` | Scheduled cron job configuration for periodic tasks (cleanup expired magic links, sync court appearances). | Backend → `jobs.config` | 🟡 P1 |

---

### B. Core CRM & Automation Web Modules (`src/backend/*.jsw` & `*.web.js`)

| File Path in Repo | Purpose & Exports | Studio Destination | Priority |
|---|---|---|---|
| `src/backend/leadsIntake.jsw` | Direct bridge to `shamrock-leads` Super CRM (`/api/webhooks/wix-intake`). Transmits web form leads with fail-closed security. | Backend → `leadsIntake.jsw` | 🔴 P0 Critical |
| `src/backend/intakeQueue.jsw` | Writes emergency intake submissions into Wix CMS collection `IntakeQueue` and triggers Google Apps Script alerts. | Backend → `intakeQueue.jsw` | 🔴 P0 Critical |
| `src/backend/portal-auth.jsw` | Passwordless Magic Link and Phone OTP authentication engine. Manages `PortalSessions` and role-based redirects. | Backend → `portal-auth.jsw` | 🔴 P0 Critical |
| `src/backend/magic-link-manager.jsw` | Generates time-bounded cryptographic tokens for defendant/indemnitor access. | Backend → `magic-link-manager.jsw` | 🔴 P0 Critical |
| `src/backend/portal-sync.jsw` | Syncs live bond status, check-in schedules, and court appearances from MongoDB Atlas / CRM to member dashboards. | Backend → `portal-sync.jsw` | 🔴 P0 Critical |
| `src/backend/gasIntegration.jsw` | Outbound bridge to Google Apps Script ("The Factory") for PDF generation and SignNow/DocuSeal orchestration. | Backend → `gasIntegration.jsw` | 🔴 P0 Critical |
| `src/backend/first-appearance-api.jsw` | Live First Appearance court schedules and calendar queries for all 20 judicial circuits. | Backend → `first-appearance-api.jsw` | 🟡 P1 |
| `src/backend/county-generator.jsw` | Programmatic dynamic data hydrator for Florida county and city landing pages. | Backend → `county-generator.jsw` | 🟡 P1 |
| `src/backend/seo-helper.jsw` | Server-side structured data and JSON-LD generation for pages. | Backend → `seo-helper.jsw` | 🟡 P1 |
| `src/backend/secretsManager.jsw` | Secure wrapper for `wix-secrets-backend` accessing environment secrets. | Backend → `secretsManager.jsw` | 🔴 P0 Critical |
| `src/backend/canonical-sync-service.jsw` | Case schema synchronizer. Enforces active sureties: OSI (`osi`) and Palmetto (`palmetto`). | Backend → `canonical-sync-service.jsw` | 🟡 P1 |
| `src/backend/signing-session-service.jsw` | DocuSeal session initialization and signing launchpad payload generation. | Backend → `signing-session-service.jsw` | 🟡 P1 |

---

### C. Static JSON Data Assets (`src/backend/data/`)

These files must be created under Backend → New File → (Name) in the Studio Code Panel:

1. `src/backend/data/allFloridaCounties.json` — 67 Florida counties database with jail addresses, inmate search URLs, and clerk contacts.
2. `src/backend/data/florida-city-landings.json` — High-intent city landing records (Cape Coral, Fort Myers, Naples, Punta Gorda, etc.).
3. `src/backend/data/phone-registry.json` — Dynamic phone number routing table (`239-332-2245` primary, `727-295-2245` Spanish, `239-955-0178` SMS).
4. `src/backend/data/gsc-county-local.json` — Local fact enrichments for indexed Florida counties.
5. `src/backend/data/bailSchoolCourses.json` — Curriculum descriptions and approved course hours.

---

### D. Public Shared Client Scripts (`src/public/`)

| File Path in Repo | Purpose & Exports | Studio Destination |
|---|---|---|
| `src/public/canonical-paperwork-mapper.js` | Normalizes form data into surety-specific DocuSeal template fields (OSI and Palmetto). | Public → `canonical-paperwork-mapper.js` |
| `src/public/portal-config.js` | Client-side endpoints, brand colors, phone numbers, and breakpoint configs. | Public → `portal-config.js` |
| `src/public/floridaCountyDirectory.js` | Renders HTML county lists with crawlable `/florida-bail-bonds/{slug}` anchors. | Public → `floridaCountyDirectory.js` |
| `src/public/geolocation-client.js` | Client browser geolocation helper for "Find My Jail" lookup. | Public → `geolocation-client.js` |
| `src/public/portal-validators.js` | Form validation rules: FL phone format, email, DOB, driver license. | Public → `portal-validators.js` |

---

### E. Page Code Mapping (`src/pages/`)

When Grok Bot creates the visual pages in Studio, copy the logic from the repository into each corresponding Studio page code tab:

| Repo Source File | Page Name | Slug | Studio Page ID Target |
|---|---|---|---|
| `src/pages/HOME.c1dmp.js` | Home | `/` | `TODO-PAGEID-HOME` |
| `src/pages/How Bail Works.lrh65.js` | How Bail Works | `/how-bail-works` | `TODO-PAGEID-HOW-BAIL-WORKS` |
| `src/pages/Contact.ilgty.js` | Contact | `/contact` | `TODO-PAGEID-CONTACT` |
| `src/pages/About.xal5r.js` | About | `/about` | `TODO-PAGEID-ABOUT` |
| `src/pages/Bail School.sftg6.js` | Bail School | `/bail-school` | `TODO-PAGEID-BAIL-SCHOOL` |
| `src/pages/first-appearance.h4fpl.js` | First Appearance | `/first-appearance` | `TODO-PAGEID-FIRST-APPEARANCE` |
| `src/pages/Florida Counties.qx7lv.js` | Florida Counties (Dynamic) | `/florida-bail-bonds/{County Slug}` | `TODO-PAGEID-COUNTY-DYNAMIC` |
| `src/pages/portal-landing.bagfn.js` | Portal Landing | `/portal-landing` | `TODO-PAGEID-PORTAL-LANDING` |
| `src/pages/portal-defendant.skg9y.js` | Defendant Dashboard | `/portal-defendant` | `TODO-PAGEID-PORTAL-DEFENDANT` |
| `src/pages/portal-indemnitor.k53on.js` | Indemnitor Dashboard | `/portal-indemnitor` | `TODO-PAGEID-PORTAL-INDEMNITOR` |
| `src/pages/masterPage.js` | Site-Wide Global Logic | (All Pages) | Global → `masterPage.js` |

---

## 3. Required Wix Secrets Manager Keys

Ensure these keys are active in **Wix Studio → Settings → Secrets Manager**:

| Secret Key Name | Purpose | Value Source |
|---|---|---|
| `WIX_WEBHOOK_SECRET` | HMAC signature verification for CRM webhooks | Must match VPS `.env` |
| `CRM_INTAKE_WEBHOOK_URL` | Endpoint on Hetzner VPS (`https://leads.shamrockbailbonds.biz/api/webhooks/wix-intake`) | Hetzner VPS production |
| `GAS_WEBAPP_URL` | Stable Google Apps Script deployment URL (`/macros/s/.../exec`) | `.gas-config.json` |
| `GAS_API_KEY` | Secret bearer key for Apps Script authorization | GAS Script Properties |
| `DOCUSEAL_API_KEY` | API key for `https://sign.shamrockbailbonds.biz` | DocuSeal instance |
