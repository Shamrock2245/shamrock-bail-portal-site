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
| `src/backend/http-auth.js` | API key validation for incoming webhooks. Reads the Wix secret `GAS_API_KEY`. | Backend → `http-auth.js` | 🔴 P0 Critical |
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
5. `src/backend/data/bailSchoolCourses.json` — Curriculum descriptions and course hour totals. Publish no course price. The 120-hour and 20-hour courses are pending course approval.

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

### F. Dependency closure for the mapped pages

Sections A–D list selected modules. They are not sufficient for the copy-paste path. Each file below is imported by a mapped page in section E, or by something that page imports. Copy the whole closure into the Studio Code Panel or those pages fail at publish with unresolved imports. Examples that were missing from the earlier tables: `Contact.ilgty.js` needs `backend/contact-api.jsw` and `public/countyUtils.js`; `portal-landing.bagfn.js` needs `backend/social-auth.jsw`, `public/session-manager.js`, and `public/ai-concierge.js`.

Wix platform modules (`wix-location`, `wix-seo`, `wix-data`, `wix-window`, `wix-storage`, `wix-users`) ship with Studio. Do not copy those.

| Repo file | Required because |
|---|---|
| `src/backend/contact-api.jsw` | `Contact.ilgty.js` |
| `src/backend/counties.jsw` | `Florida Counties.qx7lv.js` |
| `src/backend/county-generator.jsw` | `Florida Counties.qx7lv.js` |
| `src/backend/bailSchoolInterest.jsw` | `Bail School.sftg6.js` |
| `src/backend/first-appearance-api.jsw` | `first-appearance.h4fpl.js` |
| `src/backend/first-appearance-catalog.js` | imported by `first-appearance-api.jsw` and `county-generator.jsw` |
| `src/backend/analytics.jsw` | imported by `first-appearance-api.jsw` and `bailSchoolInterest.jsw` |
| `src/backend/documentUpload.jsw` | defendant and indemnitor dashboards |
| `src/backend/leadsIntake.jsw` | defendant and indemnitor dashboards |
| `src/backend/portal-auth.jsw` | portal landing and both dashboards |
| `src/backend/social-auth.jsw` | `portal-landing.bagfn.js` |
| `src/backend/auth-utils.js` | imported by `portal-auth.jsw` |
| `src/backend/config-loader.jsw` | imported by `portal-auth.jsw` |
| `src/backend/portal-url.jsw` | imported by `portal-auth.jsw` |
| `src/backend/super-admin.js` | imported by `portal-auth.jsw` |
| `src/backend/twilio-client.jsw` | imported by `portal-auth.jsw` |
| `src/backend/utils.js` | imported by `portal-auth.jsw` |
| `src/backend/gasIntegration.jsw` | imported by `analytics.jsw` |
| `src/backend/normalization.js` | imported by `gasIntegration.jsw` |
| `src/backend/notificationService.jsw` | imported by `contact-api.jsw` |
| `src/backend/secretsManager.jsw` | imported by `leadsIntake.jsw` and `notificationService.jsw` |
| `src/backend/ai-service.jsw` | imported by `public/ai-concierge.js` |
| `src/backend/portal-api-client.jsw` | imported by `ai-service.jsw` |
| `src/backend/geocoding.jsw` | imported by `public/geolocation-client.js` |
| `src/backend/location.jsw` | imported by `public/location-tracker.js` |
| `src/backend/location-tracker.jsw` | imported by `twilio-client.jsw` |
| `src/backend/fraud-detection.jsw` | imported by `location.jsw` |
| `src/backend/gsc-county-local.js` | imported by `county-generator.jsw` |
| `src/backend/local-landings.js` | imported by `county-generator.jsw` |
| `src/backend/seoConfig.js` | imported by `county-generator.jsw` |
| `src/backend/data/allFloridaCounties.json` | imported by the county and first-appearance backends |
| `src/backend/data/florida-city-landings.json` | imported by `local-landings.js` |
| `src/backend/data/florida-county-boundaries.json` | imported by `geocoding.jsw` |
| `src/backend/data/florida-local-geo.json` | imported by `local-landings.js` |
| `src/backend/data/gsc-county-local.json` | imported by `gsc-county-local.js` |
| `src/public/countyUtils.js` | `Contact.ilgty.js` |
| `src/public/portal-config.js` | contact, how bail works, county, first appearance, and portal pages |
| `src/public/collectionIds.js` | `How Bail Works.lrh65.js` |
| `src/public/cityHeroHeadline.js` | `Florida Counties.qx7lv.js` |
| `src/public/floridaCountyDirectory.js` | `Florida Counties.qx7lv.js` |
| `src/public/sanitizeLandingCopy.js` | imported by `county-generator.jsw` |
| `src/public/session-manager.js` | portal landing and both dashboards |
| `src/public/ai-concierge.js` | `portal-landing.bagfn.js` |
| `src/public/lightbox-controller.js` | defendant and indemnitor dashboards |
| `src/public/geolocation-client.js` | `portal-defendant.skg9y.js` |
| `src/public/location-tracker.js` | `portal-defendant.skg9y.js` |

`HOME.c1dmp.js`, `About.xal5r.js`, and `masterPage.js` import only Wix platform modules. They still get copied from section E. They do not add files to this closure.

---

### G. Dependency closure for the P0 HTTP entry point

Section F is the mapped-page closure. `src/backend/http-functions.js` is a separate publish path. Copy every local module it imports, including dynamic `import()` calls, and every local module those files import. Wix platform modules (`wix-http-functions`, `wix-secrets-backend`, `wix-data`, `wix-fetch`, `crypto`) ship with Studio.

These files are not listed in sections A–F. `http-functions.js` fails to publish without them:

| Repo file | Required because |
|---|---|
| `src/backend/wixApi.jsw` | static import from `http-functions.js` (`addPendingDocument`, intake and document status helpers). It also dynamically imports `backend/http-auth`. |
| `src/backend/logging.js` | static import `backend/logging` (`logSafe`) |
| `src/backend/cronJobs.jsw` | static import `backend/cronJobs` (`syncCountiesToCms`) |
| `src/backend/llmSitemapData.js` | static import from `http-functions.js` (`llmSitemapContent`) |
| `src/backend/llms-txt-builder.js` | static import from `http-functions.js` (`buildLlmsTxt`, `fetchLiveBlogPosts`) |
| `src/backend/signing-methods.jsw` | dynamic import from `http-functions.js` (`sendSigningLinkViaSms`) |
| `src/backend/telegram-webhook.jsw` | dynamic import from `http-functions.js` (`handleTelegramWebhook`, `getTelegramWebhookInfo`, `setTelegramWebhook`) |
| `src/backend/config/tenant.json` | imported by `config-loader.jsw`, which `portal-auth.jsw` and `cronJobs.jsw` load for this router |

The rest of this router's closure is already named above. Copy those files too: `http-auth.js`, `gasIntegration.jsw`, `portal-auth.jsw`, `portal-url.jsw`, `local-landings.js`, `social-auth.jsw`, `twilio-client.jsw`, `intakeQueue.jsw`, `config-loader.jsw`, `secretsManager.jsw`, `normalization.js`, `utils.js`, `auth-utils.js`, `super-admin.js`, `seoConfig.js`, `location-tracker.jsw`, `data/allFloridaCounties.json`, `data/florida-city-landings.json`, `data/florida-local-geo.json`, `public/cityHeroHeadline.js`, and `public/collectionIds.js`.

---

## 3. Required Wix Secrets Manager Keys

Ensure these keys are active in **Wix Studio → Developer Tools → Secrets Manager**. Wix rejects secret names that start with `WIX`, so do not create a secret named `WIX_WEBHOOK_SECRET`.

| Secret Key Name | Purpose | Value Source |
|---|---|---|
| `LEADS_WEBHOOK_SECRET` | Value passed as `X-Wix-Webhook-Secret` by `leadsIntake.jsw` (`getSecureSecret('LEADS_WEBHOOK_SECRET')`). Intake fails closed before it contacts the CRM if this secret is missing. | Must match `WIX_WEBHOOK_SECRET` in the leads VPS `.env`. The VPS variable keeps that name. Only the Wix Secrets Manager name is `LEADS_WEBHOOK_SECRET`. Do not commit the value. |
| `CRM_INTAKE_WEBHOOK_URL` | Endpoint on Hetzner VPS (`https://leads.shamrockbailbonds.biz/api/webhooks/wix-intake`) | Hetzner VPS production |
| `GAS_WEBAPP_URL` | Stable Google Apps Script deployment URL (`/macros/s/.../exec`) | `.gas-config.json` |
| `GAS_API_KEY` | Secret bearer key for Apps Script authorization | GAS Script Properties |
| `DOCUSEAL_API_KEY` | API key for `https://sign.shamrockbailbonds.biz` | DocuSeal instance |
