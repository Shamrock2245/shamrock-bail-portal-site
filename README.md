# 🍀 Shamrock Bail Bonds Portal

> **"The Uber of Bail Bonds" — Fast. Frictionless. Everywhere.**

This is the core platform for **Shamrock Bail Bonds**. It runs on **Wix Velo** (Frontend) and connects to a **Google Apps Script (GAS)** backend for AI-powered workflows — PDF generation, electronic signing, arrest monitoring, and omni-channel client communication.

**Current Status:** Production (Active) 🟢  
**GAS Deployment:** v415+ | **Last Updated:** April 16, 2026

---

## 📌 Core Features

*   **5 Ways to Get a Bond** — Web portal, Telegram bot, Telegram mini-app, Shannon (voice AI), or walk-in.
*   **Telegram-First Client Intake:** Conversational bot guides clients through the entire intake process.
*   **Automated Document Generation:** One-click 14-document SignNow packet from the staff dashboard.
*   **Mobile-First Electronic Signing:** Embedded SignNow sessions via SMS, Telegram, or web.
*   **Automated ID Verification:** Bot requests and processes ID photos (front, back, selfie) via Cloud Vision OCR.
*   **Closed-Loop Document Delivery:** Signed docs auto-processed (merged, watermarked) and delivered via Telegram.
*   **Communication Preferences:** Client opt-in/out respected across all outbound channels (`CommPrefsManager.js`).
*   **MongoDB Event Logging:** All business events logged to MongoDB Atlas via `MongoLogger.gs`.
*   **19-County Arrest Monitoring:** Real-time scraping pipeline with lead scoring and Slack alerts.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------| 
| **Frontend** | Wix Velo (JavaScript) | Premium UI/UX, magic link auth, member dashboards |
| **Backend** | Google Apps Script (GAS) | 190+ files — all business logic, single entry point (`Code.js`) |
| **AI/LLM** | OpenAI GPT-4o-mini | 6 specialized agents via GAS `UrlFetchApp` |
| **Voice AI** | ElevenLabs Conversational AI | "Shannon" — 24/7 phone intake, live call transfer |
| **Database** | Wix CMS + Google Sheets + MongoDB Atlas | Portal data, ops data, arrest analytics + event logging |
| **Signatures** | SignNow API | 14-document bail bond packet, embedded mobile signing |
| **Payments** | SwipeSimple | One-click links, virtual terminal, payment plans |
| **SMS/Voice** | Twilio | External comms — SMS & WhatsApp (10DLC compliant) |
| **Internal Ops** | Slack (12+ channels) | Staff alerts, intake notifications, arrest feeds |
| **Messaging** | Telegram Bot API | Conversational intake, inline quotes, mini-apps, OCR |
| **Mini Apps** | Netlify | 7 Telegram WebApps (Portal, Intake, Documents, Payments, etc.) |
| **Edge Functions** | Netlify Edge | Shannon webhook proxy, county geolocation |
| **OCR** | Google Cloud Vision | FL Driver License extraction |
| **Automation** | Node-RED | 21 flow tabs, 64 crons, 836 nodes, ops dashboard |
| **Scrapers** | Python (DrissionPage) + Node.js | 19 active Florida county jail scrapers |
| **Infrastructure** | Hetzner Cloud + Docker | VPS for scraper fleet + self-hosted GitHub Actions runners |
| **Deployment** | `clasp` + Wix CLI + GitHub | Versioned GAS deployments, 5 repos under `Shamrock2245` |

---

## 🤖 AI Digital Workforce (9 Agents)

| Agent | Role | Key File(s) |
|-------|------|-------------|
| **The Concierge** | 24/7 client support & intake chat | `ai-service.jsw`, `AIConcierge.js` |
| **Shannon** | After-hours voice intake agent | `ElevenLabs_AfterHoursAgent.js` |
| **The Clerk** | Booking data parsing & OCR | `AI_BookingParser.js` |
| **The Analyst** | Risk assessment & underwriting (0-100) | `AI_FlightRisk.js` |
| **The Investigator** | Deep background check analysis | `AI_Investigator.js` |
| **The Closer** | Lead recovery & drip campaigns | `TheCloser.js` |
| **Manus Brain** | Telegram AI conversational handler | `Manus_Brain.js` |
| **The Watchdog** | System health monitor (5-min checks) | Node-RED flow |
| **Bounty Hunter** | High-value lead surfacing (>$2.5K) | Node-RED flow |

---

## 📱 Telegram Ecosystem

The bot (`@ShamrockBail_bot`) is the primary client touchpoint, supporting full intake through delivery.

### Core Capabilities
| Feature | File(s) | Description |
|---------|---------|-------------|
| **Conversational Intake** | `Telegram_IntakeFlow.js` | Guided multi-step bail bond intake |
| **Inline Quote Bot** | `Telegram_InlineQuote.js` | `@ShamrockBail_bot 5000 2 lee` → instant premium card |
| **Court Date Reminders** | `Telegram_Notifications.js` | 4-touch sequence (7d, 3d, 1d, morning-of) |
| **One-Tap Signing** | `Telegram_Notifications.js` | Deep link to Documents mini app |
| **Bot Analytics** | `Telegram_Analytics.js` | Event logging + funnel conversion queries |
| **ID OCR** | `Telegram_OCR.js` | Cloud Vision FL DL parser (name, DOB, DL#, address) |
| **Office Locator** | `LocationMetadataService.js` | GPS → nearest office with Call/Directions |
| **Payment Progress** | `Telegram_Notifications.js` | Visual progress bar + weekly notifications |

### Telegram Mini Apps (Netlify)
| App | URL | Purpose |
|-----|-----|---------|
| Portal | `shamrock-telegram.netlify.app/` | Main menu |
| Intake | `shamrock-telegram.netlify.app/intake` | New bond intake |
| Documents | `shamrock-telegram.netlify.app/documents` | View + sign docs |
| Payments | `shamrock-telegram.netlify.app/payments` | Make payments |
| Check-in | `shamrock-telegram.netlify.app/checkin` | GPS + selfie check-in |
| Status | `shamrock-telegram.netlify.app/status` | Case lookup |

---

## 🚀 System Architecture

```
         ┌───────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐
         │ Wix Portal│  │ Telegram │  │  Shannon   │  │  County  │
         │  (Web)    │  │   Bot    │  │  (Voice)   │  │  Jails   │
         └─────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘
               │              │              │               │
               └──────────────┴──────┬───────┴───────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │   Google Apps Script     │
                        │   "The Factory"          │
                        │   190+ files, v415+      │
                        └──┬────────┬────────┬─────┘
                           │        │        │
                    ┌──────▼──┐ ┌───▼────┐ ┌─▼──────────┐
                    │ Node-RED│ │ Slack  │ │ MongoDB    │
                    │ 21 tabs │ │ 12+ch  │ │ Atlas      │
                    │ 64 crons│ │        │ │ Event Logs │
                    └─────────┘ └────────┘ └────────────┘
```

For detailed architecture, see [SYSTEM.md](./SYSTEM.md).

---

## 🔄 Key Workflows

### 1. Telegram Intake & Signing
Client → `@ShamrockBail_bot` → Guided intake → SignNow packet → Sign on mobile → ID upload → Documents delivered

### 2. Lead Scoring & Arrest Monitoring
19 county scrapers → Google Sheets + MongoDB → Lead scored (0-100) → Slack alerts → Staff action

### 3. Voice Intake (Shannon)
Client calls → Twilio → ElevenLabs → Shannon AI → Paperwork sent via SMS during call → Live transfer if needed

### 4. Portal Intake
Magic link auth → Form → Staff dashboard → SignNow signing → Slack notification → Case filed

---

## 📦 Setup & Configuration

### Prerequisites
*   Google Workspace account with GAS, Drive, and Sheets access
*   Wix account with Velo enabled
*   API keys for: Telegram, SignNow, ElevenLabs, OpenAI, Twilio, Slack

### Deployment
1.  **Clone:** `git clone https://github.com/Shamrock2245/shamrock-bail-portal-site.git`
2.  **Secrets:** Add all API keys to Wix Secrets Manager
3.  **Deploy GAS:** Use `clasp` to push `backend-gas/`. Run `setupTelegramProperties`. Deploy as Web App.
4.  **Deploy Wix:** Use Wix CLI or editor. Ensure `http-functions.js` has correct GAS URL.
5.  **Webhooks:** Register Telegram + SignNow webhooks via `SetupUtilities.js`

See [DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) for the full checklist.

---

## 📂 Documentation Index

| Document | Purpose |
|----------|---------|
| [SYSTEM.md](./SYSTEM.md) | Architecture, tech stack, inter-repo data flows |
| [RULES.md](./RULES.md) | Prime Directives, security, build discipline |
| [AGENTS.md](./AGENTS.md) | All 9 AI agent personas, prompts, handoff patterns |
| [OPERATIONS.md](./OPERATIONS.md) | Voice AI, compliance, health, integrations, scraping |
| [TOOLS.md](./TOOLS.md) | MCP servers, skills, workflows, external services |
| [USER.md](./USER.md) | User context, priorities & preferences |
| [TASKS.md](./TASKS.md) | Current project tasks & phase tracking |
| [ROADMAP.md](./ROADMAP.md) | Strategic milestones & expansion plan |
| [COUNTY_STATUS.md](./COUNTY_STATUS.md) | 19-county scraper status ledger |
| [CHANGELOG.md](./CHANGELOG.md) | Change log |
| [ONBOARDING.md](./ONBOARDING.md) | Start-here guide for new agents/developers |
| [SECRETS_ROTATION_GUIDE.md](./SECRETS_ROTATION_GUIDE.md) | Emergency key rotation procedures |

---

## 🔒 Security & Compliance
*   **API Keys:** Wix Secrets Manager + GAS Script Properties. Never in frontend code.
*   **Audit Trails:** All business events logged to MongoDB Atlas via `MongoLogger.gs`.
*   **10DLC Compliance:** Twilio SMS follows carrier regulations.
*   **Communication Preferences:** Client opt-in/out enforced across all outbound channels.
*   **Webhook Auth:** HMAC verification on all Node-RED endpoints.

---

## 🔗 Related Repos

| Repo | Purpose |
|------|---------|
| [shamrock-bail-portal-site](https://github.com/Shamrock2245/shamrock-bail-portal-site) | **This repo** — Wix + GAS core platform |
| [swfl-arrest-scrapers](https://github.com/Shamrock2245/swfl-arrest-scrapers) | 19-county scraper fleet (Python + Node.js) |
| [shamrock-node-red](https://github.com/Shamrock2245/shamrock-node-red) | Ops dashboard & automation engine |
| [shamrock-telegram-app](https://github.com/Shamrock2245/shamrock-telegram-app) | Telegram Mini-Apps (Netlify PWA) |

---

*Maintained by Shamrock Engineering & AI Agents · April 2026*