# CHANGELOG.md

## Overview
This changelog tracks major changes to the Shamrock Bail Bonds Portal.  
Format: **[Date] — [Version] — [Category] — [Change]**

---

### 2026-08-21 — v2.8.3 — Public HTTP and factory surface hardening

**Wix HTTP functions:**
- Retired unauthenticated diagnostics (`testAuth`, `testTwilio`, `testGasConnection`, `debugCounties`).
- Fail-closed, timing-safe `GAS_API_KEY` checks on admin/sync/intake/SMS/secrets endpoints.
- Removed spoofable `x-gas-caller` bootstrap that returned `GAS_API_KEY`. Secrets dump is now allowlisted and never returns `GAS_API_KEY`.
- Twilio status/inbound signatures fail closed; inbound TwiML XML-escapes caller content.
- Telegram webhook verifies `X-Telegram-Bot-Api-Secret-Token` when `TELEGRAM_WEBHOOK_SECRET` is set.
- Intake webhook, county sync, and setup routes no longer run without a key.
- Public responses no longer echo `error.message` / stacks.

**Other portal hardening:**
- `callGasAction` allowlists GAS actions so anonymous web-method callers cannot fire arbitrary factory actions.
- Locked dangerous `.jsw` web methods (secrets, admin provisioning, cron, debug/test modules) away from anonymous invoke.
- Staff portal HTML-escapes roster fields and restricts iframe `postMessage` origin.

**GAS factory:**
- Unauthenticated `?test=connection` no longer returns masked keys or script URLs.
- `?testDoc`, `?format=json` scrape/test/setup, and all GET `action=` routes except `ping`/`health` now require `apiKey`.

**Follow-up hardening:**
- Locked unauthenticated `integrations.web.js` routes (`documentsAdd/Batch/Status`, arrest leads, Slack notify, sheets sync). Contact form stays public with field-length limits.
- GAS doPost API-key compare is fail-closed and timing-safe; client error bodies no longer include stack traces.
- Mini-app Drive uploads are MIME/size/filename constrained and rate-limited.

**Ops:** Wix publish + `clasp deploy -i <existing ID>` (no new `/exec` URL). Node-RED jobs now send `apiKey` in the GAS JSON body (headers are ignored by Apps Script). Re-run Telegram webhook setup after `TELEGRAM_WEBHOOK_SECRET` is set so Telegram sends the secret token. Sync `shamrock-node-red` flows to the VPS after pull.

### 2026-08-16 — v2.8.2 — Legacy e-sign retirement and DocuSeal binding gate

**Production release:**
- Promoted portal commit `6fae72c` and factory-load follow-up `90f0aac` to `main`; Wix release workflow `31976250717` completed successfully.
- Updated the **existing** stable Apps Script deployment to **@464** (`V464 - fix retired legacy export`) without changing its `/exec` URL.

**Retirement and safety controls:**
- Removed active legacy e-sign provider modules, direct webhooks, factory senders, provider network calls, embedded-signing lightboxes, Node-RED tracker flows, and unverified signing-link delivery routes.
- Retained historical packet fields as read-only compatibility data; no signed packet is mutated in place.
- Hardened active DocuSeal packet creation to require validated Match, bound BondCase, explicit OSI/Palmetto surety, assigned POA tier, canonical recipient email, and a fresh packet ID. Packet-time identity, recipient, case, POA, and financial overrides now fail closed.

**Verification:**
- Focused DocuSeal service suite passed (**19 tests**); deployment workflows for the portal, Auto-CRM, and Node-RED completed successfully.
- Stable factory health returned `success:true`; leads, DocuSeal, Bail School, paperwork portal, and Postiz `/auth` returned `200`.
- This release does **not** complete the staff-gated write-bond → DocuSeal → payment → active-bond smoke, staff-approved outbound iMessage smoke, or historical secret rotation.

### 2026-08-16 — v2.8.1 — Direct paperwork safety guard

**Production release:**
- Promoted `ff28e9e` to `main`; Wix release workflow `31973032502` completed successfully.
- Pushed the portal factory and redeployed the **existing** stable Apps Script deployment as **@462** (`V462 - fail closed retired direct paperwork routes`). The stable `/exec` URL did not change.

**Fail-closed paperwork control:**
- Retired direct SignNow routes for Shannon, staff packet generation, Phase 1, and Phase 2 now return a non-mutating block before any packet, signing link, payment request, client contact, or record mutation.
- Active paperwork remains **Super CRM DocuSeal-only**, following validated Match → BondCase → explicit surety → assigned POA → staff approval.

**Verification:**
- Stable factory health returned `success:true` (`V409` health identifier); leads `/health`, DocuSeal, Bail School, paperwork portal, and Postiz `/auth` returned `200`.
- This release does **not** complete the staff-gated write-bond → DocuSeal paperwork or outbound iMessage smokes, and does not replace historical secret rotation.

### 2026-08-06 — v2.8.0 — Bail School catalog alignment + embed harden

**Bail School (public marketing):**
- Replaced retired offerings (*Indemnitor Basics*, *The Agent Path*, *30-Hour Correspondence*, *Masterclass*, etc.) with the live LMS catalog from `shamrock-bail-school/lib/courses.ts`:
  - **20-Hour Correspondence** — $199 (list $299), SwipeSimple 20hr link, dashboard `/dashboard/correspondence`
  - **120-Hour Pre-Licensing** — $649 (list $1,200), SwipeSimple 120hr link + schedule CTA, dashboard `/dashboard/120hr`
  - **Simulator pass** — $49 (list $99; included free with 120hr)
- Updated `netlify-embeds/bail-school.html` + mirror `src/custom-embeds/bail-school-embed.html` (meta, JSON-LD, FAQ, hero, CTAs).
- Rewrote `src/backend/data/bailSchoolCourses.json` and Wix `Bail School.sftg6.js` SEO FAQ/Course schema.
- Updated `content/pages/become-bondsman.md`, Telegram hub school banner, curriculum docs.

**Hardening:**
- Embed: HTML escape for FAQ/cards, payment URL host allowlist, dual postMessage types (`setHeight`/`RESIZE`, `SUBSCRIBE_EMAIL`/`bailSchoolNotify`), parent ACK for subscribe success/error, email validation.
- Wix page: cache-busted embed URL (`?v=`), dual message listeners, height clamp, safer email handling.
- Netlify local link for embeds folder points at site **`shamrock-embeds`** (not telegram).

**Ops:** Netlify `shamrock-embeds` prod redeployed; **Wix publish still required** for Velo page code.

---

### 2026-07-08 — v2.7.0 — Security scrub, school price alignment, ecosystem docs

**Security:**
- Removed hardcoded API secrets / token dumpers from GAS setup & tests; fail closed without `GAS_API_KEY` where applicable.
- Expanded `.gitignore` / `.claspignore`; documented rotation in `SECRETS_ROTATION_GUIDE.md`.
- `location-tracker.jsw` no longer uses a hardcoded fallback key.

**Bail School (marketing + payments):**
- Public Agent Path / 120hr price set to **$649** across embeds, FAQ, and Course schema (was $699).
- Removed incorrect $249 “pay” CTA that reused the $649 SwipeSimple link.
- SwipeSimple unlock mapping remains `$199`→20hr, `$649`→120hr in `BailSchoolPayments.js`.

**Docs / tooling:**
- Added `STATUS.md` (true git vs ops state).
- Added `scripts/check_ecosystem_secrets.py` wrapper (delegates to `shamrock-leads`).

**Ops still required:** rotate leaked secrets; redeploy GAS; republish Wix; redeploy Netlify bail-school embed host.

---

### 2026-04-24 — v2.6.0 — Infrastructure Sync & Documentation Overhaul

**Added:**
- `backend-gas/Code.js` — Twilio webhook forward in `twilio_check_in` action: fire-and-forget relay of SMS check-in data to Bond Tracker VPS (`178.156.179.237:8001/webhook/sms`) for IP geolocation tagging.

**Changed:**
- **GAS V368 @432 deployed** — Includes Twilio webhook forward integration.
- All active documentation migrated from `swfl-arrest-scrapers` to `shamrock-leads` repo references.
- Added `shamrock-bond-tracker` to repo listings (GPS/geolocation tracker microservice).
- County count updated from 19 → 20 across all docs (added Broward, Duval, Escambia, Pasco, Volusia).
- GAS version corrected from "v415+" → "V368 @432" across all docs.
- Repo count updated from 5 → 7 (added `shamrock-leads`, `shamrock-bond-tracker`).
- `COUNTY_STATUS.md` — Full rewrite: intervals now match `main.py` APScheduler config, counties alphabetized, expansion targets updated.
- `docs/hetzner.md` — All clone URLs, systemctl commands, and runner registration updated to `shamrock-leads`.
- `docs/ARCHITECTURE.md` — Mermaid diagram and scraper section updated.

---

### 2026-04-16 — v2.5.0 — Site Health & Documentation Refresh

**Fixed:**
- `src/pages/masterPage.js` — Added `setupFooterDynamic()` to `initCriticalUI()`. Dynamically sets copyright year via `new Date().getFullYear()` and overrides broken footer links at runtime.
- `src/public/siteFooter.js` — Corrected footer link paths: Counties → `/#counties`, Directory → `/#counties`, Become a Bondsman → `/how-to-become-a-bondsman`. Removed incorrect `-county` suffix from popular county slugs.
- `src/pages/Testimonials (List).bv3hz.js` — Schema fallback date changed from hardcoded `2025-01-01` to dynamic `${new Date().getFullYear()}-01-01`.

**Changed:**
- All 14 root documentation files updated to current project state (April 16, 2026).
- Node-RED stats corrected across all docs: 21 flow tabs, 836 nodes, 64 crons, 10 dashboard pages.
- `USER.md` priorities updated: MongoDB, CommPrefs, Hetzner runners marked as completed; Review Harvester and The Closer wiring added as immediate priorities.
- `ONBOARDING.md` fixed: replaced references to archived `LOGBOOK.md` and `STANDARD_OPERATING_PROCEDURES.md` with current workflows.
- `TOOLS.md` expanded: added SSH/Wix MCP servers, reorganized skills into categories, removed stale Mem0 reference.
- `COUNTY_STATUS.md` enriched: added cron schedules, accurate stacks from scraper repo, expanded Wave 1 SmartCOP details.
- `TASKS.md` — Added Phase 7.7 (Site Health & SEO Maintenance) as completed.

---

### 2026-04-07 — v2.4.0 — Wix Deploy Pipeline Repair (Crypto ESM + Auth)

**Fixed:**
- `src/backend/http-functions.js`, `auth-utils.jsw`, `auth-utils.js`, `portal-auth.jsw`, `signnow-webhooks.jsw` — Replaced all default `import crypto from 'crypto'` with named imports (`import { createHmac, createHash } from 'crypto'`). Wix Velo's ESM environment forbids CommonJS default imports of Node.js built-ins.
- Stripped all `crypto.` prefixes from call sites (e.g., `crypto.createHmac(...)` → `createHmac(...)`), including multiline chained patterns.
- Resolved naming conflict in `auth-utils.jsw` where local exported `createHash` collided with the import — aliased as `_cryptoCreateHash`.
- `GitHub Secrets / WIX_CLI_API_KEY` — Expired key regenerated from `manage.wix.com/account/api-keys`.

**Result:**
- GitHub Actions Run #25 — ✅ Succeeded (32 seconds)
- Auto-deploy on every push to `main` is fully operational

---

### 2026-04-02 — v2.3.0 — Site-Wide SEO Hardening & Documentation Cleanup

**Added:**
- Unified `Organization`, `LocalBusiness`, `BreadcrumbList`, and `SpeakableSpecification` schema markup on all 9 public pages.
- `FAQPage` schema on Homepage (5 Q&As), About (4 Q&As), and Contact (4 Q&As) pages — 13 total FAQ pairs targeting AI search queries.
- Canonical URLs, Open Graph, and Twitter Card meta tags standardized across all pages.

**Fixed:**
- Standardized phone number format (`+1-239-332-2245`) across all schema markup.
- Added missing Telegram `sameAs` links to Blog, Post, and Testimonials page schemas.
- Corrected placeholder phone number `(239) 555-BAIL` → `(239) 332-2245` in Contact page error handler.

**Changed:**
- Reorganized `.gitignore` — added `*.csv` and `**/service_account*.json` patterns, grouped by category.
- Moved 6 stale root docs to `docs/archive/2026-04/`.
- Moved 11 root Python scripts to `scripts/data-tools/`.
- Moved 12 root JS/MJS test scripts to `scripts/testing/` and `scripts/utilities/`.
- Moved 6 root shell scripts to `scripts/utilities/`.
- Moved 15 root CSV/JSON data files to `data_imports/`.

---

### 2026-03-08 — v2.2.1 — Phase 5: Automated Reporting & Agency Management

**Added:**
- `backend-gas/BondReportingEngine.js` — Automated weekly liability tracking, Agent Commissions (1099), and Void/Discharge Reconciliation.
- `backend-gas/CourtReminderSystem.js` — Automated SMS/WhatsApp court reminders (7, 3, 1 day prior).
- `backend-gas/ClientCheckInSystem.js` — Weekly SMS check-ins for active clients.
- `backend-gas/PaymentPlanReconciliation.js` — SwipeSimple integration for delinquent payment plans (>30 days).

---

### 2026-02-28 — v2.2.0 — Telegram Mini App Intake Hardening

**Fixed:**
- `shared/brand.js` — Changed global Telegram SDK declarations from `const` to `var` to fix `SyntaxError`.
- `intake/app.js` — Complete rewrite: removed duplicate Telegram SDK declarations, wired all `brand.js` shared utilities.
- `intake/index.html` — Removed duplicate `theme.css` include, ensured correct script load order.
- `Telegram_IntakeQueue.js` — Consent field mapping: `consent` → `consentGiven` + `consentTimestamp`.

**Added:**
- `intake/app.js` — `captureLocationTiered()` (4-tier GPS cascade), `gasPost()` (real response handling), session persistence.
- `Telegram_IntakeQueue.js` — 7 new columns in `TelegramIntakeData` sheet.

**Cleaned:**
- Deleted 17 stale GAS deployments (was at 20/20 limit, now 4/20).

---

### 2026-02-27 — v2.1.0 — Automation Factory Gap-Fill

**Fixed:**
- `accessCodes.jsw` — Syntax bug in `generateRandomCode()`: `});` inside `for` loop body.

**Added:**
- `backend/intakeQueue.jsw` — Full IntakeQueue CMS bridge.
- `backend/pendingDocuments.jsw` — Full PendingDocuments CMS module.
- `backend/http-functions.js` — Wix HTTP Functions: `POST /signNowWebhook`, `POST /createPendingDoc`, `POST /submitIntake`, `GET /healthCheck`.
- Member dashboard pages: Defendant, Indemnitor, Staff.

---

### 2025-10-01 — v0.1.0 (MVP Draft)
- **Added**: Initial documentation scaffold: API_SPEC.md, SCHEMAS.md, PDF_TEMPLATES.md, FLOW.md, SECURITY.md, TASKS.md, AGENTS.md, OPS.md, DEPLOYMENT.md, STYLEGUIDE.md, ROADMAP.md, CONTRIBUTING.md, TESTING.md, METRICS.md.

---

### Template for Future Entries
`YYYY-MM-DD — vX.Y.Z`
- **Added**: new feature
- **Changed**: updated behavior
- **Fixed**: bug or issue
- **Removed**: deprecated feature
