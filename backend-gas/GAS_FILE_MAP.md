# GAS Backend — File Map

> **Last Updated:** April 17, 2026
> **Total Files:** 152 JS/GS + 8 MD + 4 HTML
> **Environment:** Google Apps Script (server-side V8 runtime)
> **Deployment:** `clasp push -f` → `clasp deploy -i <deploymentId>`

---

## Entry Points

| File | Purpose |
|------|---------|
| `Code.js` | **THE single entry point.** `doPost()` / `doGet()` — all HTTP traffic routes through here. |
| `UnifiedMenuSystem.js` | `onOpen()` — builds the ☘️ Shamrock Automation menu in Google Sheets. |
| `TriggerSetup.js` | `TRIGGER_REGISTRY` — defines and manages all 8 time-driven automation triggers. |

---

## Core Infrastructure

| File | Category | Purpose |
|------|----------|---------|
| `Code_Helpers.js` | Core | Shared utilities used by `Code.js` (response builders, error handling) |
| `CONFIG.js` | Core | Global constants, feature flags, and configuration |
| `Utilities.js` | Core | General-purpose helper functions |
| `IdempotencyGuard.js` | Core | Prevents duplicate processing of webhooks/events |
| `SecurityLogger.js` | Core | Audit trail for security-sensitive operations |

---

## Menu System (v3.0)

| File | Purpose |
|------|---------|
| `UnifiedMenuSystem.js` | Single `onOpen()` owner, 8 submenus, `menu_*` wrapper functions |
| `MenuDialogs.js` | HTML-based branded dialogs (System Status, Trigger Dashboard, Config Report, About) |
| `MenuHelpers.js` | Utility functions extracted from legacy menu files |
| `SheetStyler.js` | County sheet styling engine (branded headers, banding, conditional formatting) |
| ~~`MenuSystem.js.legacy`~~ | Archived — original menu (do not restore) |
| ~~`ComprehensiveMenuSystem.js.legacy`~~ | Archived — redundant menu (do not restore) |

---

## Arrest Scrapers (GAS-Side)

| File | County | Method |
|------|--------|--------|
| `ArrestScraper_LeeCounty.js` | Lee | JSON API (`sheriffleefl.org/public-api`) |
| `ArrestScraper_CollierCounty.js` | Collier | HTML scraping (ASP.NET WebForms + VIEWSTATE) |
| `ArrestScraper_CharlotteCounty.js` | Charlotte | HTML scraping |
| `ArrestScraper_HendryCounty.js` | Hendry | HTML scraping |
| `ArrestScraper_SarasotaCounty.js` | Sarasota | HTML scraping |
| `ArrestScraper.js` | — | Base scraper utilities / shared helpers |
| `ArrestScraperList.js` | — | Registry of all scraper functions |
| `ArrestLeadRouter.js` | Lee | Routes new arrests to Slack / destination sheets |
| `TheScout.js` | Multi | `runAllCountyScrapers()` — orchestrator for multi-county runs |

---

## Lead Management

| File | Purpose |
|------|---------|
| `LeadScoringSystem.js` | Score leads 0–100 based on bond amount, recency, charges |
| `LeadScoring.js` | Legacy scoring (may be deprecated) |
| `QualifiedArrestsSync.js` | Sync qualified leads (score ≥ 70) to master sheet |
| `QualifiedTabRouter.js` | Route qualified arrests to `Shamrock_Arrests_Master` or `Qualified_exceptions` |
| `SearchLinks.js` | Generate Google/FDLE/court search links for defendants |
| `TheCloser.js` | Abandoned intake drip campaign — SMS follow-ups |
| `RiskIntelligenceLoop.js` | Automated risk monitoring loop |

---

## AI Agents

| File | Agent | Model |
|------|-------|-------|
| `AIConcierge.js` | The Concierge | GPT-4o — client support & intake |
| `AI_BookingParser.js` | The Clerk | GPT-4o-mini — booking data extraction |
| `AI_FlightRisk.js` | The Analyst | GPT-4o-mini — risk scoring (0–100) |
| `AI_Investigator.js` | The Investigator | GPT-4o — deep background checks |
| `AI_Broadcaster.js` | — | AI-powered notification broadcasting |
| `AI_CheckInMonitor.js` | — | AI check-in compliance monitoring |
| `AI_HistoricalOCR.js` | — | Historical document OCR processing |
| `OpenAIClient.js` | — | OpenAI API wrapper (completions, embeddings) |
| `GrokClient.js` | — | xAI Grok API wrapper |
| `RAGService.js` | — | Retrieval-Augmented Generation service |
| `KnowledgeBase.js` | — | Shannon/Concierge knowledge base |
| `Manus_Brain.js` | Manus Brain | Telegram AI conversational handler |
| `ManusHelper.js` | — | Manus Brain utility functions |

---

## Telegram Bot

| File | Purpose |
|------|---------|
| `Telegram_API.js` | Telegram Bot API wrapper (sendMessage, editMessage, etc.) |
| `Telegram_Auth.js` | Telegram user authentication & validation |
| `Telegram_Webhook.js` | Webhook handler for incoming bot messages |
| `Telegram_IntakeFlow.js` | Multi-step intake conversation flow |
| `Telegram_IntakeQueue.js` | Telegram intake queue management |
| `Telegram_InlineQuote.js` | Inline quote calculator (`calculatePremium()`) |
| `Telegram_Documents.js` | Document sharing & management via bot |
| `Telegram_OCR.js` | FL Driver License OCR (Cloud Vision) |
| `Telegram_Notifications.js` | Outbound notification system |
| `Telegram_Analytics.js` | Bot usage analytics |
| `Telegram_HomepageSectionEvents.js` | Homepage section event tracking |

---

## Voice AI (Shannon)

| File | Purpose |
|------|---------|
| `ElevenLabs_AfterHoursAgent.js` | Shannon agent configuration & tool definitions |
| `ElevenLabs_Client.js` | ElevenLabs API client wrapper |
| `ElevenLabs_WebhookHandler.js` | Processes Shannon's webhook tool calls |

---

## SignNow & Documents

| File | Purpose |
|------|---------|
| `SignNow_Integration_Complete.js` | Core SignNow API integration |
| `SignNow_SendPaperwork.js` | 14-doc packet generation & sending |
| `SignNow_Workflow.js` | Signing workflow orchestration |
| `SignNow_Dashboard.js` | Dashboard-facing SignNow operations |
| `SOC2_WebhookHandler.js` | `document.complete` webhook handler |
| `PDF_Mappings.js` | JSON field → PDF coordinate mappings |
| `PDF_Processor.js` | PDF generation & processing |
| `PDFService.gs` | Low-level PDF service utilities |
| `AdobeDataMapping.js` | Adobe PDF data field mapping |
| `AdobePDFService.gs` | Adobe PDF services integration |
| `DocFiller.js` | Document template field hydration |
| `DocumentLogic.js` | Document workflow business logic |
| `Server_DocumentLogic.js` | Server-side document processing |
| `DriveFilingService.gs` | Google Drive case folder filing |

---

## Court Automation

| File | Purpose |
|------|---------|
| `CourtDateAutomation.js` | Court date tracking & automation |
| `CourtDocumentGenerator.js` | Court filing document generation |
| `CourtEmailProcessor.js` | Gmail parser for court date notifications |
| `CourtReminderSystem.js` | 4-touch SMS reminder sequence (7d, 3d, 1d, morning-of) |

---

## Communication

| File | Purpose |
|------|---------|
| `SlackIntegration.js` | Core Slack API integration |
| `SlackNotifier.js` | Channel-specific Slack notifications |
| `SlackWebhook.js` | Slack webhook utilities |
| `SlackConfig.js` | Slack channel configuration |
| `SetupSlack.js` | Slack webhook setup wizard |
| `NotificationService.gs` | Multi-channel notification dispatcher |
| `ReminderManager.js` | Client reminder management |
| `TwilioCampaignMonitor.js` | Twilio campaign monitoring |
| `CommPrefsGate.js` | Communication preferences (opt-in/opt-out) |

---

## Payments & Compliance

| File | Purpose |
|------|---------|
| `PaymentPlanReconciliation.js` | SwipeSimple payment plan tracking (>30 day delinquency) |
| `PaymentService.js` | Payment processing utilities |
| `BondReportingEngine.js` | Liability reports, agent commissions |
| `BondsAutomation.js` | Bond lifecycle automation |
| `HistoricalBondMonitor.js` | Historical bond tracking |
| `HistoricalBondsInstaller.js` | Historical bond setup |
| `Compliance.js` | Regulatory compliance checks |
| `ComplianceControls.js` | Compliance control framework |

---

## Node-RED Bridge

| File | Purpose |
|------|---------|
| `NodeRedHandlers.js` | 25+ handler functions for Node-RED GET/POST calls |
| `NodeRedHandlers_RepeatOffender.js` | Repeat offender detection handlers |

---

## Wix Integration

| File | Purpose |
|------|---------|
| `WixPortalIntegration.js` | Push data back to Wix CMS collections |
| `IntakePolling.js` | Poll Wix for new intake submissions |
| `FormController.js` | Google Sheets form controller logic |
| `FormDataHandler.js` | Form data processing & validation |

---

## Social Media

| File | Purpose |
|------|---------|
| `SocialPublisher.js` | Multi-platform auto-posting engine |
| `AutoPostingEngine.js` | Scheduling & orchestration for social posts |
| `SocialCalendar.js` | Social media content calendar |
| `SocialMediaPicker.js` | Platform selection logic |
| `TikTokVideoUploader.js` | TikTok video upload integration |
| `BlogAudio_Workflow.js` | Blog-to-audio conversion workflow |

---

## System & DevOps

| File | Purpose |
|------|---------|
| `SystemHealthCheck.js` | Automated health checks across all integrations |
| `DailyOpsReport.js` | End-of-day ops summary to Slack |
| `StatsService.js` | System statistics collection |
| `Telemetry.gs` | Usage telemetry |
| `TokenRefreshService.js` | OAuth token auto-refresh |
| `PruneScriptProperties.js` | Clean up stale script properties |
| `ConfigBackend.js` | Config management backend |
| `LocationMetadataService.js` | County/location metadata |
| `GeofenceService.js` | Geofence-based routing |
| `GoogleSearchConsole.js` | Search Console API integration |

---

## MCP Server

| File | Purpose |
|------|---------|
| `MCPServer.js` | Model Context Protocol server entry point |
| `MCPHelpers.js` | MCP utility functions |
| `MCPToolImplementation.js` | MCP tool implementations |

---

## HTML Templates

| File | Purpose |
|------|---------|
| `Dashboard.html` | Main staff dashboard (data entry, case management) |
| `MobileDashboard.html` | Mobile-optimized dashboard |
| `TabletDashboard.html` | Tablet-optimized dashboard |
| `Form.html` | Data entry form |
| `Form_Old.html` | Legacy form (archived) |
| `ConfigModal.html` | Configuration settings modal |

---

## Setup & Debug (Run Once / Dev Only)

| File | Purpose |
|------|---------|
| `Manual_Setup.js` | One-time setup scripts |
| `Manual_Setup_MongoDB.js` | MongoDB integration setup |
| `SetupUtilities.js` | Setup helper functions |
| `Setup_OAuth_Props.js` | OAuth property configuration |
| `Setup_Properties_WhatsApp.js` | WhatsApp property setup |
| `ScriptProperties_Temp.js` | Temporary property scripts |
| `Get_New_IDs.js` | ID generation utilities |
| `Get_Token_Temp.js` | Temporary token retrieval |
| `Test_*.js` | Test suite files (8 total) |
| `Debug_*.js` | Debug utilities (2 total) |
| `DebugTemplates.js` | Template debugging |
| `fetch_token*.js` | Token fetch scripts (dev) |

---

## Tags & Auto-Tagging

| File | Purpose |
|------|---------|
| `AutoTaggingService.js` | Auto-tag arrest records |
| `TaggingAssistant.js` | AI-assisted tagging |
| `ImprovedParsing.js` | Enhanced data parsing |
| `QuickPDFTimeExtractor.js` | PDF timestamp extraction |

---

## Risk Management

| File | Purpose |
|------|---------|
| `RiskIntelligenceLoop.js` | Continuous risk monitoring |
| `RiskMitigationActions.js` | Automated risk response actions |
| `ClientCheckInSystem.js` | Weekly client check-in (SMS + GPS/selfie) |

---

> [!IMPORTANT]
> When adding a new file, update this map. When archiving a file, move the entry to the bottom.
> This file is the canonical inventory — if it's not listed here, it might as well not exist.
