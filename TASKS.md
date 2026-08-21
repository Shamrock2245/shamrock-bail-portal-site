# 📋 Project Tasks

> **Mission:** Build the "Uber of Bail Bonds" — Fast. Frictionless. Everywhere.  
> **Last Updated:** 2026-08-21  
> **Authoritative Runtime Status:** [`STATUS.md`](./STATUS.md)

---

## 🔴 Phase 8.5: Wix Studio Translation + Autopilot Paperwork Clipboard (CURRENT #1 PRIORITY)

- [ ] **Milestone A: Studio Visual System & Public IA**
  - [x] Establish SWFL regional dominance on Homepage & NAP (Fort Myers HQ primary)
  - [x] Multi-state routing module (`src/backend/multi-state-router.js` & `routers.js`)
  - [ ] Wix Studio breakpoint matrix styling (fluid typography, container queries, no stock templates)
  - [ ] Programmatic county pages verification on Studio surface

- [ ] **Milestone B: Port Portals & Launchpads**
  - [x] Enforce clipboard vs brain boundary (no DocuSeal packet creation in Wix)
  - [x] Update `SigningLightbox` and `portal-config.js` for Netlify paperwork launchpad
  - [ ] Port `portal-landing`, `portal-defendant`, `portal-indemnitor`, `portal-staff` to Studio layout

- [ ] **Milestone C: `/portal-start` Autopilot Wizard**
  - [x] Create Canonical Schema Mapper (`src/public/canonical-paperwork-mapper.js`)
  - [ ] Mobile/tablet intake flow: Role Selector (Defendant / Indemnitor / Co-Indemnitor)
  - [ ] Camera ID Scan + Cloud Vision OCR auto-hydration (role-scoped, never overwrite defendant)
  - [ ] Auto-hydrate known case facts (from Super CRM / booking match)
  - [ ] Collect missing delta fields only (employment, references, household)
  - [ ] 1-tap plain-language preview & finger/stylus signature pad

- [ ] **Milestone D: Staff Lobby-Tablet Handoff**
  - [ ] Rapid tablet launch QR code / PIN for in-person office or jail lobby clients
  - [ ] Staff-gated handoff to Super CRM bond reconciliation

- [ ] **Milestone E: `ServiceAreas` Multi-State CMS**
  - [x] Configure `EXPANSION_STATES` registry in `portal-config.js`
  - [ ] Multi-state CMS collection hookup for 11+ states when `status = live`

---

## 🔄 Phase 8: Growth, Messaging & Revenue (Active Pipeline)

- [ ] **WhatsApp Business Integration**
  - [ ] Enable Twilio WhatsApp Sandbox
  - [ ] Wire to Node-RED relay
  - [ ] Test WhatsApp campaigns tab (pending 10DLC approval)
- [ ] **"The Closer" Drip Campaigns**
  - [ ] Wire Node-RED "The Closer" tab → GAS `runTheCloser()` endpoint
  - [ ] Automated SMS/WhatsApp follow-ups for abandoned mobile intakes
- [ ] **Review Harvester**
  - [ ] GAS endpoint to send Google review requests post-bond
  - [ ] Wire to Node-RED scheduling
- [ ] **Wave 1 SmartCOP Blitz** (13 counties)
  - [ ] Clone DeSoto scraper → Bradford, Dixie, Escambia, Gadsden, Gilchrist, Glades, Hamilton, Levy, Putnam, Santa Rosa, Sumter, Suwannee, Taylor
- [ ] **Shannon Enhancements**
  - [ ] Multi-language support (Spanish priority — Collier/Lee demographics)
  - [ ] Paperwork launchpad link delivery via Twilio SMS during active calls (for staff-issued sessions)
  - [ ] Shannon call analytics dashboard

---

## ✅ Completed Milestones

### Phase 1: Foundation & Security
- [x] Monorepo migration — unified Wix Velo + GAS backend
- [x] Security audit — PII redaction, Secret Manager integration
- [x] Core 34-column intake schema defined (`IntakeQueue`)

### Phase 2: Core Portals & Signing Modernization
- [x] DocuSeal signing migration & permanent SignNow retirement (Live @464)
- [x] Indemnitor & Defendant Portals with Magic Link auth
- [x] Staff-gated document preparation boundary in Super CRM

### Phase 3: AI Workforce & Telegram Ecosystem
- [x] OpenAI GPT-4o integration — 9 specialized AI digital employees
- [x] Telegram Bot (`@ShamrockBail_bot`) + 7 Netlify Mini-Apps
- [x] Cloud Vision Driver License OCR parser

### Phase 4: Ops Dashboard & Scraping Expansion
- [x] Node-RED Ops Dashboard — 21 flow tabs, 836 nodes, 64 crons
- [x] 20 active Florida county jail scrapers (DrissionPage / Puppeteer / Docker)
- [x] MongoDB Atlas event logging via `MongoLogger.gs` + `mongo_writer.py`

### Phase 5: Voice AI & School Alignment
- [x] ElevenLabs Shannon 24/7 phone intake agent
- [x] Bail School public catalog aligned to live LMS ($199 20hr / $649 120hr)
- [x] Communication Preferences system (`CommPrefsManager.js`)

---

Maintained by Shamrock Engineering & AI Agents