# 🏗 Architecture & System

> **Last Updated:** April 4, 2026  
> **Status:** 🟢 Production — All Systems Operational

---

## Prime Directive

**"The Website is a Clipboard; The Backend is the Brain."**

We enforce a distributed, service-oriented architecture. The frontend (Wix) exists to collect and display. All heavy lifting — PDF generation, AI processing, signing orchestration, communication routing — runs in Google Apps Script (GAS), the central "Factory."

---

## The Modern Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend / UI** | Wix Velo | Premium UI — Glassmorphism, animations, magic link auth. Collects data, passes it to GAS. |
| **Backend / Factory** | Google Apps Script (GAS) | Single entry point (`Code.js doPost()/doGet()`). 190+ files. All business logic. v415+. |
| **AI / LLM** | OpenAI GPT-4o-mini (via GAS) | 9 digital employees: Clerk, Analyst, Investigator, Concierge, Closer, Manus Brain, Shannon, Watchdog, Bounty Hunter. |
| **Voice AI** | ElevenLabs Conversational AI | "Shannon" — 24/7 after-hours phone intake agent with live call transfer. |
| **Database** | Wix CMS + Google Sheets + MongoDB Atlas | Wix CMS for portal data. Sheets for ops. MongoDB for arrest analytics & event logging. |
| **Signing** | SignNow API | 14-document packet generation. Embedded mobile-first signing. Webhook-driven completion. |
| **Payments** | SwipeSimple | One-click payment links, virtual terminal, payment plan reconciliation. |
| **SMS / Voice** | Twilio | External client comms — SMS & WhatsApp (10DLC compliant). Court reminders, check-ins. |
| **Internal Ops** | Slack (12+ webhook channels) | Staff alerts, intake notifications, arrest feeds, error reporting. |
| **Messaging** | Telegram Bot API | Primary client channel — conversational intake, inline quotes, mini-apps, OCR. |
| **Mini Apps** | Netlify | 7 Telegram WebApps (Portal, Intake, Documents, Payments, Check-in, Status). |
| **Edge Functions** | Netlify Edge | Shannon init webhook proxy, county geolocation, Twilio voice routing. |
| **OCR** | Google Cloud Vision API | FL Driver License extraction (name, DOB, DL#, address). |
| **Automation** | Node-RED | 19 flow tabs, 643+ nodes, 51 scheduled tasks, 14 webhooks. Ops dashboard. |
| **Scrapers** | Python (DrissionPage) + Node.js (Puppeteer) | 19 active county jail scrapers across Florida. Dockerized. |
| **Infrastructure** | Hetzner Cloud + Docker | VPS hosting for scraper fleet. GitHub Actions self-hosted runners. |
| **Deployment** | `clasp` (GAS) + Wix CLI + GitHub | Versioned GAS deployments. 5 repos under `Shamrock2245`. |

---

## Operating Logic & Pipeline

```
Collect → Normalize → Store → Trigger → AI Process → Handoff
```

### The Intake-to-Bond Pipeline

```
Arrest Detected ──→ Scraper writes to Sheets + MongoDB + Slack
                         │
                    Lead Scored (0-100)
                         │
Client starts via ──→ Magic Link (Web) / Telegram Bot / Shannon (Phone)
                         │
                    Validation: Phone/Email verified, location consent captured
                         │
                    "The Clerk" hydrates data → 14-doc SignNow packet generated
                         │
                    SignNow link sent via SMS / WhatsApp / Telegram
                         │
                    Client signs on mobile → document.complete webhook fires
                         │
                    Bot requests ID upload (front, back, selfie) → OCR extracts data
                         │
                    Signed docs auto-saved to Drive → Staff alerted on Slack
                         │
                    Case file complete ── ✅ Bond Posted
```

---

## Cloud & Hosting

| Service | Hosts | Purpose |
|---------|-------|---------|
| **Wix** | Portal frontend, CMS | Client-facing UI, member dashboards, magic link auth |
| **Google Cloud** | GAS, Sheets, Drive, Vision API, Cloud Functions | Backend logic, data, storage, OCR, MongoDB proxy |
| **Netlify** | Edge Functions, Mini Apps | ElevenLabs webhook proxy, Telegram WebApps |
| **Hetzner** | VPS (cpx21, Ubuntu 24.04) | Dockerized scraper fleet, self-hosted GitHub runners |
| **MongoDB Atlas** | Arrest data, event logging | Analytics, cross-county dedup, business event audit trail |
| **Twilio** | SMS, WhatsApp, Voice routing | External client communications |
| **ElevenLabs** | Voice AI | Shannon — phone-based intake agent |
| **SignNow** | Document signing | 14-doc bail bond packet generation and tracking |

---

## Inter-Repo Architecture

```
shamrock-bail-portal-site    ←→    GAS Backend (Factory)
        │                               │
        │                    ┌───────────┼───────────┐
        │                    │           │           │
   shamrock-node-red    swfl-arrest-scrapers    shamrock-telegram-app
   (Ops Dashboard)      (County Scrapers)       (Telegram Mini Apps)
        │                    │
        └──────── All flow through GAS doPost()/doGet() ────────┘
```

### The 5 Repos

| Repo | Purpose | Status |
|------|---------|--------|
| `shamrock-bail-portal-site` | Wix Velo frontend + GAS backend (190+ files) | 🟢 Production |
| `swfl-arrest-scrapers` | 19-county Dockerized scraper fleet (Python + Node.js) | 🟢 Production |
| `shamrock-node-red` | Ops Dashboard — 19 flow tabs, 51 crons, 14 webhooks | 🟢 Production |
| `shamrock-telegram-app` | Telegram Mini-Apps (Netlify PWA) | 🟢 Production |
| `telegram-mini-app-demos` | Experimental Telegram WebApp prototypes | 🔵 Dev |

---

## Security & Compliance

- **PII Encryption**: All sensitive data encrypted at rest in Wix Collections.
- **API Keys**: Never in frontend code. Managed via Wix Secrets Manager + GAS Script Properties.
- **Webhook Auth**: HMAC verification on all Node-RED inbound endpoints.
- **Audit Trails**: All SignNow documents tracked with Case IDs. All business events logged to MongoDB via `MongoLogger.gs`.
- **10DLC Compliance**: Twilio SMS follows carrier regulations. Communication preferences respected (`CommPrefsManager.js`).
- **Idempotent Writes**: All data writes check for duplicates. `Booking_Number + County` is the dedup key.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [RULES.md](RULES.md) | Prime Directives, security rules, schema governance |
| [AGENTS.md](AGENTS.md) | All 9 AI agent personas, prompts, and handoff patterns |
| [OPERATIONS.md](OPERATIONS.md) | Voice AI, compliance, health monitoring, scraping, analytics |
| [TOOLS.md](TOOLS.md) | MCP servers, agent skills, workflows, external services |
| [USER.md](USER.md) | Brendan's preferences, priorities, working style |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Deep-dive system architecture with Mermaid diagrams |
