# 🏗 Architecture & System

> **Last Updated:** 2026-07-08  
> **Status:** 🟢 Production bond stack · See [`STATUS.md`](./STATUS.md) for git vs live ops  
> **Ecosystem:** School LMS = `shamrock-bail-school` · Auto-CRM = `shamrock-leads`

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
| **Signing** | DocuSeal via Super CRM | Staff-issued packet workflow. Wix hosts only the secure Netlify launchpad and cannot create packets or signing links. |
| **Payments** | SwipeSimple | One-click payment links, virtual terminal, payment plan reconciliation. |
| **SMS / Voice** | Twilio | External client comms — SMS & WhatsApp (10DLC compliant). Court reminders, check-ins. |
| **Internal Ops** | Slack (12+ webhook channels) | Staff alerts, intake notifications, arrest feeds, error reporting. |
| **Messaging** | Telegram Bot API | Primary client channel — conversational intake, inline quotes, mini-apps, OCR. |
| **Mini Apps** | Netlify | 7 Telegram WebApps (Portal, Intake, Documents, Payments, Check-in, Status). |
| **Edge Functions** | Netlify Edge | Shannon init webhook proxy, county geolocation, Twilio voice routing. |
| **OCR** | Google Cloud Vision API | FL Driver License extraction (name, DOB, DL#, address). |
| **Automation** | Node-RED | 21 flow tabs, 836 nodes, 64 crons, 10 dashboard pages. Ops command center. |
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
                    Staff validates Match, BondCase, surety, POA, recipient, and approval in Super CRM
                         │
                    Staff issues DocuSeal packet; secure launchpad presents the existing session
                         │
                    Client signs on mobile → approved completion workflow records the result
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
| **DocuSeal via Super CRM** | Document signing | Staff-issued packet generation and tracking; Wix remains a non-issuing launchpad |

---

## Inter-Repo Architecture

```
shamrock-bail-portal-site    ←→    GAS Backend (Factory)
        │                               │
        │                    ┌───────────┼───────────┐
        │                    │           │           │
   shamrock-node-red    shamrock-leads    shamrock-telegram-app
   (Ops Dashboard)      (Arrest Intel)    (Telegram Mini Apps)
        │                    │                │
   shamrock-bond-tracker     │                │
   (GPS/Geo Tracking)       │                │
        └──────── All flow through GAS doPost()/doGet() ────────┘
```

### The Shamrock Repos

| Repo | Purpose | Status |
|------|---------|--------|
| `shamrock-bail-portal-site` | Wix Velo frontend + GAS backend (190+ files) | 🟢 Production |
| `shamrock-leads` | 20-county arrest intelligence platform (Python, Docker, Hetzner VPS) | 🟢 Production |
| `shamrock-bond-tracker` | Active bond GPS/geolocation tracker microservice (Hetzner VPS) | 🟢 Production |
| `shamrock-node-red` | Ops Dashboard — 21 flow tabs, 64 crons, 836 nodes | 🟢 Production |
| `shamrock-telegram-app` | Telegram Mini-Apps (Netlify PWA) | 🟢 Production |

---

## Security & Compliance

- **PII Encryption**: All sensitive data encrypted at rest in Wix Collections.
- **API Keys**: Never in frontend code. Managed via Wix Secrets Manager + GAS Script Properties.
- **Webhook Auth**: HMAC verification on all Node-RED inbound endpoints.
- **Audit Trails**: Historical provider records remain keyed by Case ID for compatibility. Active DocuSeal issuance and completion follow the Super CRM approval workflow; business events are logged to MongoDB via `MongoLogger.gs`.
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
| [docs/CURRENT_PAPERWORK_ARCHITECTURE.md](docs/CURRENT_PAPERWORK_ARCHITECTURE.md) | Canonical DocuSeal-only signing boundary |
