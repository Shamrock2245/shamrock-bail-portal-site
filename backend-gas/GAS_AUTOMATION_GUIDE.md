# GAS Backend — Automation & Routing Reference

> **Last Updated:** April 17, 2026
> **Runtime:** Google Apps Script V8
> **Entry Point:** `Code.js` → `doPost()` / `doGet()`

---

## 1. Code.js Action Routing

All HTTP traffic enters through `Code.js`. The routing works in two layers:

### doGet() Actions (GET requests)

Called via `?action=xxx` query parameter. Used primarily by Node-RED and health checks.

| Action | Handler | Auth | Source |
|--------|---------|------|--------|
| `test_pdf` | inline | `format=json` | Debug |
| `test_ai` | inline | `format=json` | Debug |
| `analyze_tags` | inline | `format=json` | Debug |
| `auto_tag` | inline | `format=json` | Debug |
| `sendSlackAlert` | inline | `format=json` | Debug |
| *(all others)* | `handleGetAction(e)` | `action` param | Node-RED |

> [!NOTE]
> `handleGetAction()` routes to `NodeRedHandlers.js` functions. See Section 3 below.

### doPost() Actions — Pre-Auth (No API Key Required)

These bypass API key verification for specific trusted sources:

| Action | Handler | Source | Notes |
|--------|---------|--------|-------|
| `telegram_inbound_message` | `Telegram_Webhook.js` | Telegram Bot API | Webhook signature verified separately |
| `telegram_mini_app_intake` | `Telegram_IntakeFlow.js` | Telegram Mini-App | initData validated |
| `telegram_mini_app_upload` | `Telegram_OCR.js` | Telegram Mini-App | Photo/doc uploads |
| `telegram_payment_log` | `PaymentService.js` | Telegram Mini-App | Payment logging |
| `telegram_payment_lookup` | `PaymentService.js` | Telegram Mini-App | Payment status |
| `telegram_checkin_log` | `ClientCheckInSystem.js` | Telegram Mini-App | GPS + selfie check-in |
| `get_bot_analytics` | `Telegram_Analytics.js` | Telegram Mini-App | Bot metrics |
| `twilio_check_in` | `ClientCheckInSystem.js` | Twilio webhook | SMS check-in response |
| `schedule_court_date` | `CourtDateAutomation.js` | Multi-source | Court date creation |
| `send_signing_link` | `SignNow_SendPaperwork.js` | Shannon / Portal | Send SignNow link |
| `calculate_premium` | `Telegram_InlineQuote.js` | Shannon / Telegram | Premium calculator |
| `telegram_status_lookup` | `Telegram_IntakeQueue.js` | Telegram | Case status |
| `telegram_document_lookup` | `Telegram_Documents.js` | Telegram | Document search |
| `telegram_get_signing_url` | `SignNow_Workflow.js` | Telegram | Signing URL |
| `get_packet_manifest` | `SignNow_SendPaperwork.js` | Internal | Packet doc list |
| `telegram_document_status` | `Telegram_Documents.js` | Telegram | Doc status |
| `telegram_client_update` | `Telegram_IntakeQueue.js` | Telegram | Client info update |
| `post_slack_message` | `SlackIntegration.js` | Netlify | Proxy Slack post |
| `get_upcoming_court_dates` | `CourtDateAutomation.js` | Netlify | Court date feed |
| `send_court_reminders` | `CourtReminderSystem.js` | Netlify | Trigger reminders |
| `get_daily_stats` | `StatsService.js` | Netlify | Daily metrics |
| `get_unacknowledged_reminders` | `CourtReminderSystem.js` | Netlify | Pending reminders |
| `escalate_to_cosigner` | `ClientCheckInSystem.js` | Netlify | Escalation |
| `get_forfeiture_cases` | `BondReportingEngine.js` | Netlify | Forfeiture list |
| `get_recent_client_messages` | `AI_CheckInMonitor.js` | Netlify | Message history |
| `flag_high_stress_case` | `AI_CheckInMonitor.js` | Netlify | Case flagging |
| `logTelegramSectionEvent` | `Telegram_HomepageSectionEvents.js` | Telegram | Section analytics |

### doPost() Actions — Authenticated (API Key Required)

These require `data.apiKey` to match `GAS_API_KEY` in Script Properties:

| Action | Handler | Source | Notes |
|--------|---------|--------|-------|
| `updateCommPrefs` | `CommPrefsGate.js` | Portal | Communication preferences |
| `intakeSubmission` | `Code.js` → `handleIntakeSubmission()` | Wix Portal | New intake from web form |
| `newIntake` | `Code.js` → `handleNewIntake()` | Wix Portal | Intake with caseId |
| `submitDefendantApplication` | `Code.js` | Wix Portal | Defendant application flow |
| `sendToWixPortal` | `WixPortalIntegration.js` | Internal | Push data to Wix CMS |
| `batchSaveToWixPortal` | `WixPortalIntegration.js` | Internal | Batch CMS push |
| *(50+ additional actions)* | Various handlers | Mixed | See `Code.js` lines 1287+ |

---

## 2. Trigger Registry (8 Core Triggers)

Defined in `TriggerSetup.js` → `TRIGGER_REGISTRY`:

| # | Name | Function | Schedule | What It Does | If It Fails |
|---|------|----------|----------|-------------|-------------|
| 1 | Lee County Scraper | `runLeeArrestsNow` | Every 1 hour | Scrapes Lee County jail roster via JSON API | Arrests go stale; check API rate limits |
| 2 | The Scout (Multi) | `runAllCountyScrapers` | Every 6 hours | Runs Charlotte, Collier, Hendry, Sarasota scrapers | Individual county failures logged; others continue |
| 3 | The Closer | `runTheCloser` | Every 30 min | SMS drip campaign for abandoned intakes | Lost revenue from unconverted leads |
| 4 | Court Email Processor | `processCourtDateEmails` | Every 15 min | Parses Gmail for court date notifications | Court dates not logged; manual check needed |
| 5 | TG Court Reminders | `TG_processCourtDateReminders` | Every 30 min | Sends upcoming court date reminders via Telegram | Defendants miss court dates |
| 6 | TG Weekly Payments | `TG_processWeeklyPaymentProgress` | Mon 10 AM ET | Monday payment progress update via Telegram | No weekly payment status for clients |
| 7 | Social Auto-Posting | `runAutoPostingEngine` | Every 5 min | Posts scheduled content to social media | Social media goes dark |
| 8 | Daily Slack Summary | `sendDailySummaryToSlack` | Daily 5 PM ET | End-of-day operations summary to Slack | No daily ops visibility |

### Trigger Management Commands

From the ☘️ Shamrock Automation menu:
- **Install All**: `⚙️ System > Reinstall All Triggers`
- **View Status**: `⚙️ System > View Active Triggers`
- **Remove All**: `⚙️ System > Remove All Triggers`

From script editor:
- `installAllTriggers()` — remove all + install 8
- `removeAllTriggers()` — nuclear option
- `installSingleTrigger('Lee County Scraper')` — by name or function
- `removeSingleTrigger('runLeeArrestsNow')` — by function name
- `getTriggerStatus()` — returns structured array for dashboards
- `listAllTriggers()` — console log all triggers

---

## 3. Node-RED Handler Map

`NodeRedHandlers.js` exposes 25+ functions called via `handleGetAction()`:

| Handler Function | Node-RED Endpoint | Dashboard Page | Data Returned |
|-----------------|-------------------|----------------|---------------|
| `handleFetchLatestArrests` | `/fetch-latest-arrests` | Operations Radar | Recent arrest bookings |
| `handleScoreAndSync` | `/score-and-sync` | Operations Radar | Score + sync qualified leads |
| `handleProcessConciergeQueue` | `/process-concierge-queue` | Concierge Ops | Pending AI responses |
| `handlePollWixIntakeQueue` | `/poll-wix-intake` | Concierge Ops | New Wix intakes |
| `handleCheckForChanges` | `/check-changes` | Operations Radar | Status changes in arrests |
| `handleRunAutoPostingEngine` | `/auto-post` | Operations | Scheduled social posts |
| `handleRepeatOffenderScan` | `/repeat-offender` | Analyst Ops | Repeat arrest matches |
| `handleRiskIntelligenceLoop` | `/risk-intel` | Analyst Ops | Risk assessment updates |
| `handleCourtReminders` | `/court-reminders` | Operations | Pending court reminders |
| `handlePaymentProgress` | `/payment-progress` | Revenue Ops | Payment plan statuses |
| `handleAutomatedCheckIns` | `/check-ins` | Operations | Client check-in compliance |
| `handleCourtDateProximity` | `/court-proximity` | Operations | Upcoming court dates |
| `handleReconcilePayments` | `/reconcile` | Revenue Ops | Payment reconciliation |
| `handleRunTheCloser` | `/the-closer` | Revenue Ops | Drip campaign execution |
| `handleDailyOpsReport` | `/daily-ops` | Agency Mgmt | Daily operations report |
| `handleGetPendingSignatures` | `/pending-sigs` | Revenue Ops | Unsigned documents |
| `handleGetRecentlyPostedBonds` | `/recent-bonds` | Agency Mgmt | Recently posted bonds |
| `handleGetUpcomingPayments` | `/upcoming-payments` | Revenue Ops | Upcoming payment dates |
| `handleGetComplianceStatus` | `/compliance` | Agency Mgmt | Compliance dashboard data |
| `handleGetDailyRevenue` | `/daily-revenue` | Revenue Ops | Daily revenue metrics |
| `handleGetStaffPerformance` | `/staff-perf` | Agency Mgmt | Staff performance metrics |
| `handleGetReviewCandidates` | `/review-candidates` | Revenue Ops | Clients eligible for review requests |
| `handleLogReviewSent` | `/log-review` | Revenue Ops | Log review request sent |

---

## 4. Script Properties Reference

All secrets and configuration values are stored in `PropertiesService.getScriptProperties()`.

### API Keys & Auth

| Property Key | Service | Example Format |
|-------------|---------|----------------|
| `GAS_API_KEY` | Wix ↔ GAS authentication | UUID string |
| `OPENAI_API_KEY` | OpenAI GPT-4o / GPT-4o-mini | `sk-...` |
| `GROK_API_KEY` | xAI Grok | `xai-...` |
| `SIGNNOW_CLIENT_ID` | SignNow OAuth | UUID string |
| `SIGNNOW_CLIENT_SECRET` | SignNow OAuth | UUID string |
| `SIGNNOW_ACCESS_TOKEN` | SignNow API (auto-refreshed) | Bearer token |
| `SIGNNOW_REFRESH_TOKEN` | SignNow token refresh | Refresh token |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API | `123456:ABC-DEF...` |
| `TWILIO_ACCOUNT_SID` | Twilio SMS/WhatsApp | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio auth | Token string |
| `TWILIO_PHONE_NUMBER` | Twilio sending number | `+1...` |
| `ELEVENLABS_API_KEY` | ElevenLabs voice AI | `xi-...` |
| `GOOGLE_VISION_API_KEY` | Cloud Vision OCR | API key string |

### Sheet & Drive IDs

| Property Key | Purpose |
|-------------|---------|
| `MASTER_SHEET_ID` | Main Google Sheets workbook |
| `CASE_FOLDER_ID` | Google Drive case files root |
| `TEMPLATE_FOLDER_ID` | SignNow template folder |

### Slack Webhooks

| Property Key | Channel |
|-------------|---------|
| `SLACK_WEBHOOK_CASES` | `#new-cases` |
| `SLACK_WEBHOOK_COURT` | `#court-dates` |
| `SLACK_WEBHOOK_INTAKE` | `#intake` |
| `SLACK_WEBHOOK_LEADS` | `#leads` |
| `SLACK_WEBHOOK_ARRESTS` | `#new-arrests-lee-county` |
| `SLACK_WEBHOOK_AFTER_HOURS` | `#after-hours` |
| `SLACK_WEBHOOK_SHAMROCK` | `#shamrock` |
| `SLACK_WEBHOOK_DRIVE` | `#drive` |

### Feature Flags

| Property Key | Values | Purpose |
|-------------|--------|---------|
| `ENABLE_AI_SCORING` | `true`/`false` | Toggle AI-powered lead scoring |
| `ENABLE_AUTO_POSTING` | `true`/`false` | Toggle social media auto-posting |
| `ENABLE_THE_CLOSER` | `true`/`false` | Toggle drip campaign |

---

## 5. Google Sheets Tab Map

| Tab Name | Source Script | Auto/Manual |
|----------|-------------|-------------|
| `Posted Bonds` | Manual entry | Manual |
| `Shamrock_Arrests_Master` | `QualifiedTabRouter.js` | Auto |
| `Qualified_exceptions` | `QualifiedTabRouter.js` | Auto |
| `IntakeQueue` | `Code.js` → `handleIntakeSubmission` | Auto |
| `Bookings` | `Code.js` → `saveBookingData` | Auto |
| `Discharges` | `CourtEmailProcessor.js` | Auto |
| `Forfeitures` | `CourtEmailProcessor.js` | Auto |
| `Upcoming Court Dates` | `CourtEmailProcessor.js` | Auto |
| `Lee` | `ArrestScraper_LeeCounty.js` | Auto (hourly) |
| `Collier` | `ArrestScraper_CollierCounty.js` | Auto (6h) |
| `Charlotte` | `ArrestScraper_CharlotteCounty.js` | Auto (6h) |
| `Hendry` | `ArrestScraper_HendryCounty.js` | Auto (6h) |
| `Sarasota` | `ArrestScraper_SarasotaCounty.js` | Auto (6h) |
| `Logs` | `SecurityLogger.js` | Auto |

---

> [!IMPORTANT]
> **When adding a new action to Code.js:**
> 1. Add the `if (data.action === '...')` block in the correct auth section
> 2. Update this document's routing table
> 3. If it's a Node-RED handler, also update Section 3
