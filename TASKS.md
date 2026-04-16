# 📋 Project Tasks

> **Mission:** Build the "Uber of Bail Bonds" for Florida — Fast. Frictionless. Everywhere.  
> **Last Updated:** April 16, 2026

---

## ✅ Phase 1: Foundation & Security (Complete)

- [x] Monorepo migration — unified Wix Velo + GAS backend
- [x] Security audit — PII redaction, Secret Manager integration
- [x] SOC II logging patterns implemented
- [x] Core 34-column intake schema defined (`IntakeQueue`)

## ✅ Phase 2: Core Portals (Complete)

- [x] Indemnitor Portal — Financial Indemnity Form + SignNow Lightbox
- [x] Defendant Portal — Appearance Application + GPS Check-in
- [x] Magic Links — secure session-based auth (no passwords)
- [x] PDF Engine — automated layout mapping for court forms

## ✅ Phase 3: AI Concierge & Telegram Integration (Complete)

- [x] OpenAI GPT-4o integration — 6 specialized AI agents built
- [x] Telegram Bot (`@ShamrockBail_bot`) — full conversational intake
- [x] Inline Quote Bot — `@ShamrockBail_bot 5000 2 lee` → instant premium
- [x] Court Date Reminders — 4-touch SMS sequence (7d, 3d, 1d, morning-of)
- [x] ID OCR — Google Cloud Vision FL Driver License parser
- [x] Office Locator — GPS → nearest office with Call/Directions
- [x] Payment Progress Notifications — visual progress bars (████░░ 65%)
- [x] Telegram Mini-Apps (7) — Portal, Intake, Documents, Payments, Check-in, Status, Signing

## ✅ Phase 4: Core Automation (Complete)

- [x] "The Clerk" — booking data scraping and OCR
- [x] "The Analyst" — risk assessment with 0-100 flight risk scoring
- [x] "The Investigator" — deep background check analysis
- [x] "The Closer" — abandoned intake drip campaigns
- [x] Court Email Processor — auto-parse court date emails
- [x] Bond Reporting Engine — weekly liability, commissions, reconciliation
- [x] Client Check-In System — weekly SMS with text response tracking
- [x] Payment Plan Reconciliation — SwipeSimple delinquency tracking
- [x] Universal Payment Link — SwipeSimple in portals, SMS, email

## ✅ Phase 5: Shannon Voice AI (Complete)

- [x] ElevenLabs Conversational AI — "Shannon" 24/7 after-hours intake
- [x] Inbound Twilio → ElevenLabs routing
- [x] Init webhook as Netlify Edge Function (near-zero cold start)
- [x] Two-path flow: Path A (notify bondsman) / Path B (send paperwork)
- [x] SignNow link creation + SMS delivery during active calls
- [x] ShannonCallLog Google Sheet (full transcript recording)
- [x] Knowledge base — all 67 FL counties, statutes, bond schedules, FAQs
- [x] 8 webhook tools — calculate_premium, create_intake, lookup_defendant, send_payment_link, schedule_callback, transfer_to_bondsman, check_inmate_status, send_directions
- [x] Live call transfer — 3 phone numbers (primary, secondary, Spanish line)

## ✅ Phase 6: Infrastructure & Operations (Complete)

- [x] Node-RED Ops Dashboard — 21 flow tabs, 836 nodes, 64 crons
- [x] 10-page dashboard with premium glassmorphism UI, 26 widget groups
- [x] Global error handler → Slack alerts
- [x] Webhook authentication (HMAC) on all inbound endpoints
- [x] Bond Renewal Reminder Pipeline
- [x] Quick-Bond Calculator Widget
- [x] Error Aggregation Dashboard
- [x] Agent Activity Scoreboard (9 agents with status/KPIs)
- [x] Reusable "POST to GAS" subflow in Shamrock palette
- [x] SLACK_TOKEN fix — `env.get('SLACK_BOT_TOKEN')` in Configure Global Vars

## ✅ Phase 7: Geographic Expansion — 19 Counties (Complete)

- [x] 19 active county scrapers — Brevard, Charlotte, Collier, DeSoto, Hendry, Highlands, Hillsborough, Indian River, Lake, Lee, Manatee, Martin, Orange, Osceola, Palm Beach, Pinellas, Polk, Sarasota, Seminole
- [x] 15 GitHub Actions workflows for scheduled runs
- [x] Python/DrissionPage as primary engine
- [x] Docker Compose for containerized execution
- [x] MongoDB Atlas writer (`mongo_writer.py`) — bulk upsert with dedup
- [x] Lead scoring system (`LeadScoringSystem.js`) with auto-prioritization
- [x] Slack alerts per county (#new-arrests-{county})
- [x] Hetzner Cloud VPS for self-hosted GitHub Actions runners
- [x] SEO — all county pages indexed, JSON-LD, OG/Twitter meta, geo tags

## ✅ Phase 7.5: MongoDB & Communication Preferences (Complete)

- [x] MongoDB Atlas event logging via `MongoLogger.gs`
- [x] All critical business events logged — intakes, signing, payments, court dates, check-ins, comms, leads
- [x] Communication Preferences — `CommPrefsManager.js` in GAS
- [x] Wix portal comm prefs page — `Communication Preferences.f870g.js` → `comm-prefs-sync.jsw` → GAS
- [x] `pymongo[srv]` dependency added to scrapers
- [x] Scraper pipeline Step 5b — non-fatal MongoDB write after Sheets

## ✅ Phase 7.6: DevOps & Deploy Pipeline Hardening (Complete — Apr 7)

- [x] **ESM Crypto Imports** — Replaced all `import crypto from 'crypto'` (CommonJS default) with named imports across 5 backend files
- [x] **Multiline Call Collapse** — Resolved multiline `crypto.createHmac` chained patterns
- [x] **Naming Conflict** — Aliased imported `createHash` as `_cryptoCreateHash` in `auth-utils.jsw`
- [x] **WIX_CLI_API_KEY Renewal** — Expired GitHub Secret regenerated from `manage.wix.com/account/api-keys`
- [x] **Auto-Deploy Verified** — GitHub Actions Run #25 ✅ (32s). Auto-deploy on push to `main`

## ✅ Phase 7.7: Site Health & SEO Maintenance (Complete — Apr 16)

- [x] **Dynamic Copyright Year** — `setupFooterDynamic()` in `masterPage.js` uses `new Date().getFullYear()`
- [x] **Broken Footer Links** — All footer links fixed: Counties → `/#counties`, Directory → `/#counties`, Become a Bondsman → `/how-to-become-a-bondsman`
- [x] **SEO Schema Date** — Testimonials page schema fallback date now dynamic
- [x] **Wix Sync** — Removed deleted `Bail School.js`, synced `uiVersion` bump
- [x] **Site-wide Documentation Refresh** — All 14 root docs updated to current state

---

## 🔄 Phase 8: Growth & Scale (In Progress)

### 🔴 Immediate Priority

- [ ] **WhatsApp Business Integration**
  - [ ] Enable Twilio WhatsApp Sandbox
  - [ ] Wire to Node-RED relay
  - [ ] Test WhatsApp campaigns tab (currently disabled pending 10DLC)

### 🟡 This Quarter

- [ ] **"The Closer" Drip Campaigns**
  - [ ] Wire Node-RED "The Closer" tab → GAS `runTheCloser()` endpoint
  - [ ] Automated SMS/WhatsApp follow-up sequences for abandoned intakes
- [ ] **Review Harvester**
  - [ ] GAS endpoint to send Google review requests post-bond
  - [ ] Wire to Node-RED scheduling
- [ ] **Wave 1 SmartCOP Blitz** (13 counties)
  - [ ] Clone DeSoto scraper → Bradford, Dixie, Escambia, Gadsden, Gilchrist, Glades, Hamilton, Levy, Putnam, Santa Rosa, Sumter, Suwannee, Taylor
  - [ ] ~30 min per county. Post-wave target: 32 counties (48% FL coverage)
- [ ] **Shannon Enhancements**
  - [ ] Multi-language support (Spanish priority — Collier/Lee demographics)
  - [ ] Shannon → "The Closer" handoff for abandoned intakes
  - [ ] Shannon call analytics dashboard
  - [ ] Telegram signing link delivery during calls

### 🟢 Backlog

- [ ] **Bail School Landing Page**
  - [ ] High-converting `/bail-school` registration page
  - [ ] Video integration + auto-issue PDF certificate
- [ ] **Social Media Automation**
  - [ ] Pexels integration for post images
  - [ ] Scheduled social publishing via `SocialPublisher.js`
- [ ] **MongoDB Primary Migration**
  - [ ] Migrate primary data store from Sheets → MongoDB Atlas
  - [ ] Keep Sheets as backup/dashboard view
- [ ] **Wave 2–5 County Expansion**
  - [ ] Wave 2: 19 standard DrissionPage counties (Q3 2026)
  - [ ] Wave 3: 13 complex targets — CAPTCHAs, SPAs (Q4 2026)
  - [ ] Wave 4: 3 PDF-based counties (Q1 2027)
  - [ ] Wave 5: 5 manual investigation counties (Q2 2027)
  - [ ] Goal: 67/67 counties (100% FL coverage)

---

Maintained by Shamrock Engineering & AI Agents