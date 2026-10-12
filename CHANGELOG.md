# CHANGELOG.md

## Overview
This changelog tracks major changes to the Shamrock Bail Bonds Portal.  
Format: **[Date] — [Version] — [Category] — [Change]**

---

### 2026-10-08 — v2.8.16 — GAS Telegram Mini App actions require the API key

**Google Apps Script (`backend-gas/`):**
- The 8 Telegram Mini App `doPost` actions are added to `GAS_KEYED_DOPOST_ACTIONS_`: `telegram_mini_app_intake`, `telegram_mini_app_upload`, `telegram_payment_log`, `telegram_payment_lookup`, `telegram_checkin_log`, `telegram_client_update`, `telegram_status_lookup`, `telegram_document_lookup`. A missing or wrong key returns `Unauthorized: Invalid API Key`, logs `UNAUTHORIZED_API_ACCESS`, and touches no sheet, Drive folder, Slack channel or Mongo log.
- Before this change, anyone with the /exec URL could look up any client's case status, payments or documents by phone number, and could write intakes, uploads, check-ins and payment logs.
- Caller: shamrock-telegram-app moves the Mini App pages onto `/api/miniapp`. That proxy verifies Telegram initData, requires a Telegram-verified phone for lookups, and adds `GAS_API_KEY` server-side.
- `bail_school_upload` shares the upload route but is a separate action and is unchanged.
- Test: `scripts/test_gas_miniapp_actions_auth.mjs` runs `doPost` in a vm with spy Sheets, Drive, Slack, Mongo and UrlFetch. It runs in PR CI. `scripts/test_gas_dopost_risk_actions_auth.mjs` no longer expects the Mini App intake to work without a key.

### 2026-10-08 — v2.8.15 — Mask client name and phone in Mini App Slack alerts

**Google Apps Script (`backend-gas/`):**
- `telegram_payment_log` and `telegram_checkin_log` Slack messages now show a masked name (first name + last initial, e.g. `Jane D.`) and masked phone (last 4 digits, e.g. `…0001`). The full client-typed values stay in the PaymentLog / CheckInLog sheets for staff.
- Helpers: `slackMaskName_`, `slackMaskPhone_` in `Code.js`.
- Test: `scripts/test_telegram_slack_mask.mjs` (vm sandbox doPost with a spy Slack), in PR CI.

### 2026-10-08 — v2.8.14 — GAS `caller_context` requires the API key

**Google Apps Script (`backend-gas/`):**
- `doPost ?source=caller_context&phone=` returned the caller's name, defendant name and court date for any phone with no auth. It now requires `GAS_API_KEY` as `?apiKey=` (`requireGasApiKey_`, fails closed when the Script Property is unset). A missing or wrong key returns `{"success":false,"message":"Unauthorized"}`, logs `UNAUTHORIZED_API_ACCESS`, and reads no cache or sheet.
- Callers: none today. The only caller was the Netlify edge function `elevenlabs-init.js` in shamrock-telegram-app, which dropped this call on 2026-08-26 (`aff4d85`, "one Mem0 path at ring via Super CRM"). No repo, ElevenLabs agent config (Brendan Paperwork Assistant, Eric, Sofia) or Node-RED flow references it. If it is ever revived, the server caller must send `apiKey` = `GAS_API_KEY` (the edge functions already have that env name).
- Test: `scripts/test_gas_caller_context_auth.mjs` (vm sandbox doPost), in PR CI.

### 2026-10-08 — v2.8.12 — GAS doPost risk actions require the API key

**Google Apps Script (`backend-gas/`):**
- `doPost` now requires the GAS API key on every server-called action that sends messages or returns client PII. The key is `data.apiKey` or `?apiKey=`, checked with `requireGasApiKey_` before any handler runs. The list is `GAS_KEYED_DOPOST_ACTIONS_` in `Code.js`:
  - Risk mitigation: `send_court_reminders`, `escalate_to_cosigner`, `get_recent_client_messages`, `get_upcoming_court_dates`, `get_unacknowledged_reminders`, `get_forfeiture_cases`, `get_daily_stats`, `flag_high_stress_case`, `post_slack_message`.
  - Telegram sends and signing data: `schedule_court_date`, `send_signing_link`, `telegram_get_signing_url`, `telegram_document_status`, `get_packet_manifest`.
  - Check-in relay: `twilio_check_in`.
  - Before this change, anyone with the /exec URL could text any number, text co-signers, send Telegram messages, or read client messages, court dates and forfeiture cases. A missing or wrong key now returns `Unauthorized: Invalid API Key` and logs `UNAUTHORIZED_API_ACCESS`. Nothing is sent, read or written.
- Callers: the scheduled Netlify functions in `shamrock-telegram-app` (`court-reminder`, `engagement-watchdog`, `sentiment-watchdog`, `daily-briefing`) send `GAS_API_KEY` as of shamrock-telegram-app #15. That change must deploy **before** this ships with `clasp push`. The other listed actions have no caller in any Shamrock2245 repo. Time-based triggers call functions directly and are unaffected.
- Not gated yet: the browser mini-app actions (`telegram_mini_app_intake`, `telegram_mini_app_upload`, `telegram_payment_log`, `telegram_payment_lookup`, `telegram_checkin_log`, `telegram_client_update`, `telegram_status_lookup`, `telegram_document_lookup`), because a browser cannot hold the key. They need Telegram initData verification first.
- Test: `scripts/test_gas_dopost_risk_actions_auth.mjs` runs `doPost` in a vm with spy SMS, Slack, Telegram, Sheets and UrlFetch. For each action it checks that a missing, wrong or unconfigured key is rejected with zero side effects and that a valid key reaches the handler. It runs in PR CI.

### 2026-10-08 — v2.8.11 — GAS `post_slack_message` requires the API key

**Google Apps Script (`backend-gas/`):**
- `doPost` action `post_slack_message` now requires the GAS API key: `data.apiKey`, or `?apiKey=`, checked with `requireGasApiKey_` against the `GAS_API_KEY` script property. It used to run before any key check, so anyone with the /exec URL could post text into Shamrock's Slack. A missing or wrong key now returns `Unauthorized: Invalid API Key` and logs `UNAUTHORIZED_API_ACCESS`; nothing is posted.
- The only callers are four Netlify functions in `shamrock-telegram-app` (`checkin-geo-alert`, `sentiment-watchdog`, `daily-briefing`, `compliance-digest`). They send `GAS_API_KEY` as of shamrock-telegram-app #14. That change must deploy **before** this ships with `clasp push`.
- Test: `scripts/test_gas_post_slack_message_auth.mjs`, which runs `doPost` in a vm with stubbed Apps Script services. It runs in PR CI.

### 2026-10-08 — v2.8.10 — Shannon notify and repeat-save fixes

**Google Apps Script (`backend-gas/`):**
- `notify_bondsman` always schedules the callback and texts the staff desk. Slack runs only when the CRM submit misses. The CRM payload reuses the call's case reference instead of minting a second intake.
- `save_paperwork_answers` writes the ShannonPaperwork row first, then makes one CRM submit. `create_intake` no longer does the id-status lookup on the voice turn.
- Drafts that store `indemnitor` and `defendant` objects are read for name, phone, and email. A flat stated field still wins.
- The Telegram mini-app Slack post runs only when `saveTelegramIntakeToQueue` did not land the lead in the CRM.

### 2026-10-07 — v2.8.9 — CRM intake for Telegram and Shannon

**Google Apps Script (`backend-gas/`):**
- Telegram bot intakes (`saveTelegramIntakeToQueue`) and Shannon voice (`create_intake`, `save_paperwork_answers`, `notify_bondsman`) now open the lead with `POST /api/intake/submit`. Source tags are `telegram`, `telegram_miniapp`, and `shannon_voice`.
- An ID scan, when one is already on the case or uploaded in the bot, seeds the identity. The stated name, address, phone, and best email then fill it. Bond amounts and booking keys are sent only when the person gave a real one.
- The IntakeQueue sheet, Wix copy, Slack ping, and Shannon staff-desk text run only when that CRM call fails. The ShannonPaperwork sheet still stores the in-call draft later tools read. Failures are logged as `CRM INTAKE FAILED`.
- Auth uses the existing script properties `GAS_API_KEY` or `LEADS_INTERNAL_TOKEN`. The base URL is the existing `LEADS_API_URL` or `SHANNON_LEADS_URL`.

### 2026-09-30 — v2.8.8 — GAS deduplication audit, documentation synchronization, zero code gaps

**Google Apps Script (`backend-gas/`):**
- Resolved 25 duplicate global function and variable declarations across 162 backend files. Because Google Apps Script executes with a single flat global scope, top-level functions with matching names in separate files silently overwrite each other, and duplicate `const`/`let` statements cause runtime initialization errors.
- Consolidated `getConfig`: removed duplicate fallback stub in `Code.js:37` and centralized in `CONFIG.js:301` with script properties caching via `_CONFIG_CACHE`.
- Disambiguated duplicate handlers and helpers:
  - `handleSendForSignature`: API mock in `API.js:56` renamed to `handleSendForSignature_APIMock`, preserving strict security boundary in `Code.js`.
  - `mapIntakeDataToDefendantApplication`: basic mapping in `AdobePDFService.js:264` renamed to `mapIntakeDataToDefendantApplication_Basic` and delegated to `AdobeDataMapping.js`.
  - `getExistingBookingNumbers`: renamed to `getExistingQualifiedBookingKeys` in `QualifiedArrestsSync.js:238`.
  - `safeString_`: renamed to `safeCharlotteString_` in `ArrestScraper_CharlotteCounty.js:468`.
  - `runCollierArrestsNow`: removed redundant wrapper in `Code.js:1366`; canonical function preserved in `ArrestScraper_CollierCounty.js:22`.
  - `formatDate_`: renamed file-scoped helpers in `ArrestScraper_LeeCounty.js` (`formatLeeDate_`), `MCPHelpers.js` (`formatMCPDate_`), and `MenuHelpers.js` (`formatMenuDate_`), keeping canonical general-purpose helper in `Utilities.js:66`.
  - `sendSlackMessage`: renamed direct sender in `SlackIntegration.js:13` to `sendSlackDirect_`; canonical entry point remains in `Code.js:2689` delegating to `NotificationService`.
  - `saveBookingData`: renamed internal storage in `FormDataHandler.js:74` to `FDH_saveBookingData`; canonical `saveBookingData` for Dashboard.html remains in `Code.js:3268`.
  - `handleNewIntake`: renamed in `WixPortalIntegration.js:571` to `handleWixPortalNewIntake`; canonical routing remains in `Code.js:3373`.
  - `generateAndSendWithWixPortal_Safe`: scoped in `Code_Helpers.js` and `ComplianceControls.js`; canonical entry remains in `Code.js`.
  - `extractTextFromPDF`: renamed in `EmailParser.js:185` to `extractTextFromPDF_EmailParser`; canonical Drive v3 OCR remains in `CourtEmailProcessor.js:618`.
  - `postToSlack`: renamed in `SlackNotifier.js:17` to `postCourtSlackMessage` and in `MCPHelpers.js:297` to `postToSlackWebhook`; canonical remains in `CourtEmailProcessor.js:850`.
  - `_getVal`, `_formatMoney`, `_getConfigSafe`: scoped in `DailyOpsReport.js` (`_dor*`) and `TheCloser.js` (`_closer*`).
  - `extractDefendantName`: renamed in `DriveFilingService.js:157` to `extractDefendantName_DriveService`; canonical remains in `WebhookHandler.js:197`.
  - `calculatePremium`: renamed basic single-charge calculator in `FormController.js:86` to `calculateBasicChargePremium`; full statutory multi-charge calculator remains in `Telegram_InlineQuote.js:36`.
  - `getOrCreateSheet_`: scoped in `LeadScoringSystem.js`, `QualifiedTabRouter.js`, and `SheetsManager.js`; canonical array helper remains in `Utilities.js:126`.
  - `mapSheetDataToForm_` & `parseChargesFromSheet_`: scoped in `MCPHelpers.js` and `MenuHelpers.js`; canonical array mappers remain in `Utilities.js`.
  - `getExistingKeys_`: scoped in `QualifiedTabRouter.js` and `SheetsManager.js`.
  - `logProcessingEvent`: renamed in `SecurityLogger.js:28` to `logSecurityProcessingEvent`; canonical remains in `Utilities.js:420`.
  - `runSystemDiagnostics`: scoped in `SetupUtilities.js` and `SystemHealthCheck.js`; canonical remains in `Utilities.js:348`.
  - `getFileExtension`: renamed in `WebhookHandler.js:223` to `getWebhookFileExtension`; canonical dot-prefixed version remains in `Utilities.js:32`.
- Deduplicated object mapping keys in `PDF_Mappings.js`: eliminated duplicate `"shamrock-premium-finance-notice.pdf"` entry that was shadowing signatures (`Defendant Signature`, `Indemnitor Signature`) and payment schedule fields.
- Confirmed exactly 0 duplicate functions, 0 duplicate variables, and 0 duplicate object keys across all 162 backend files.

**Runtime Truth & Documentation Audit:**
- Updated `STATUS.md`, `TASKS.md`, `OPERATIONS.md`, `README.md`, and `COUNTY_STATUS.md` to reflect runtime truth:
  - Active GAS deployment version: `@508` (Dual OpenAI/Grok failover, trigger resilience, full 16-trigger registry per `.gas-config.json`).
  - Wix Editor UI version: `2775`, including statewide Florida Bail Bonds landing page (`/florida-bail-bonds`).
  - DocuSeal is sole active signing provider; staff-gated issuance strictly inside Super CRM (`shamrock-leads`).
  - BlueBubbles iMessage bridge (`239-955-0178`) is active messaging provider; Twilio retained for voice and SMS inbound fallback.

**Test & Verification Suite:**
- Node syntax / `vm.Script` check across all 162 GAS files: 0 errors.
- ESLint lint check across `src/`: 0 errors.
- 29 Python pytest test suites in `scripts/`: 29 passed.
- City hero H1 check: 33 cities, 4 jails passed.

---

### 2026-09-25 — v2.8.7 — County pages SEO: verified jail data, CMS-first copy, clean structured data

**Heads-up:** merging to `main` auto-publishes the live site via `.github/workflows/wix-deploy.yml`.

**Data (`src/backend/data`):**
- Collier: Naples Jail Center, 3347 Tamiami Trail E. (was 3301), plus Immokalee Jail Center, 302 Stockade Road, Immokalee, FL 34142 (`jails` / `jailSites`).
- Lee: two jail sites, Downtown Jail (2115 Dr Martin Luther King Jr Blvd) and Core (2501 Ortiz Ave). Fort Myers landing no longer names FMPD as the holding facility.
- Corrected addresses that conflicted with verified county data: Escambia (2935 North L Street), Orange (Booking and Release Center, 3855 South John Young Parkway), Volusia (1300 Red John Drive), Hendry (101 S Bridge St), plus verified facility names (Hillsborough, Leon, Manatee, Duval, Alachua and others). TBD/unverified values were left as-is.

**County page code:**
- Meta description uses CMS `seoDescription` (falls back to generated copy). City/jail landings prefer their own CMS item (`seoTitle`, `seoDescription`, `h1Headline`, `serviceAreaCopy`, `jailName`) unless it contains a known-wrong address.
- Fixed the doubled "held at X and then booked at X" sentence; multi-site counties list every jail.
- New optional facts block, set only when the element exists and the value is verified (never empty/TBD): `#factsBox`, `#factCountySeat`, `#factCircuit`, `#factJailName`, `#factJailAddress`, `#factCourthouse`, `#factFirstAppearance`, `#factMajorCities`, `#factsLastVerified`, `#factInmateSearchBtn` / `#findSomeoneInJailBtn` ("Find someone in jail"), `#countyHubBtn`, `#cityPagesText`, `#jailPageBtn`. Nearby counties use CMS `neighborCounties` first.
- Sheriff/Clerk rows show CMS names only; the "Sheriff's Office" / "Clerk of Court" placeholders are gone (rows collapse when empty).
- Structured data is now one BreadcrumbList, one LocalBusiness (Fort Myers office, The Colquitt Building, 1528 Broadway) and one FAQPage built from the visible FAQs. HowTo/Service/Organization/Place blocks removed; no rating markup.
- Removed release-time claims ("2-8 hours", "fast release" in jail meta descriptions). Transfer fee copy is $100 (was $125).

**Lists / sync:**
- Sitemap, county directory and tier lists skip `active=false` items.
- `syncCountiesToCms` / `seedCityAndJailLandings` now fill empty fields only and never re-activate items, so they cannot overwrite the verified CMS data.

**Still Editor-only:** single H1 bound to `h1Headline`, facts block layout (create the IDs above), qx7lv SEO title pattern, noindex for the r1yb8/becrn/bh0r4 pages.

### 2026-08-28 — v2.8.6 — Staff prompt lightbox

- Added `StaffPromptLightbox` Velo file, `<shamrock-staff-prompt>` custom element, and an in-iframe modal in `staff-portal.html`.
- `/portal-staff` finalize / power / case / custody prompts use the iframe modal first (works without a new Editor lightbox), then `StaffPromptLightbox`, then the custom element.
- Editor bind (optional): create lightbox named `StaffPromptLightbox` with `#promptTitle`, `#promptHint`, `#promptInput`, `#promptSelect`, `#promptConfirmBtn`, `#promptCancelBtn`. Keep `#staffPortal` on the staff page.

### 2026-08-28 — v2.8.5 — Staff launchpad boundary + production docs

**Wix clipboard:**
- Staff Defendant Details (page + lightbox) no longer calls retired `initiateSigningWorkflow` packet-create. Email/SMS/kiosk now look up a staff-issued DocuSeal URL, open `SigningLightbox`, or text that URL. Missing sessions tell staff to issue in Super CRM.
- Staff finalize no longer depends on a missing `#lightbox1`; unsigned cases confirm via the existing select prompt.
- Added `SUPER_CRM_URL` on `portal-config.js`.

**Docs (portal + Super CRM):**
- `USER.md` / `TASKS.md` / `STATUS.md`: Editor is the live production surface; Studio canvas is deferred. Next gates are B3/B5/D2 in `shamrock-leads`.
- Retired SignNow MCP help skills removed from `.agent/skills`.

**Not in this release:** Wix Studio canvas, human-gated B3/B5/D2 smokes, secret rotation (C3).

### 2026-08-25 — v2.8.4 — Clipboard factory harmony (Editor live, no Studio cutover)

**Doctrine:** Website is the clipboard. Super CRM is the brain. DocuSeal is staff-gated. OSI preferred.

**GAS (existing `/exec` IDs only):**
- Pushed factory and redeployed portal `…CvP-Z` and school `…Qa_DMg` as **@468**. Health identifier is `V468`.
- Added `ClipboardBridge.js` so Wix clipboard actions (`syncCanonicalIntake`, `lookupDefendant`, `processIdOcr`, walk-in/kiosk, signing completion) persist and notify without issuing packets.
- Remaining SignNow send wrappers (`sendForSignature`, portal signing sessions, MCP packet create, `generateAndSendWithWixPortal*`) fail closed.
- Shannon factory prompt Path B creates intake only; it does not promise a signing packet.

**Wix Editor (published local Velo):**
- `callGasAction` allowlist includes clipboard actions and drops retired `submitIndemnitorPhase1`.
- Staff dashboard opens the canonical factory URL, not the dead `R6fSFQ` 404.
- Signing launchpad accepts only `sign.shamrockbailbonds.biz` / DocuSeal hosts.
- Booking lookup no longer invents mock defendants.
- Staff portal magic-link / stealth-poke imports and county hero `tel:+12393322245` restored so publish validation passes.

**Not in this release:** Wix Studio canvas, Prompt 19 device QA, human-gated B3/B5/D2 smokes, BlueBubbles tunnel restore, ElevenLabs UI prompt resync.

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
