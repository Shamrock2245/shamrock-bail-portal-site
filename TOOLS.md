# 🛠 Tools & Resources

> **Last Updated:** April 16, 2026

This document outlines all tools, MCP servers, agent skills, and external services used by the Shamrock AI ecosystem.

---

## MCP Servers (Model Context Protocol)

| Server | Purpose | Key Actions |
|--------|---------|-------------|
| **ElevenLabs** | Voice AI management | Create/manage agents, TTS, voice cloning, call history, audio isolation |
| **SignNow** | Contract signing | Create invites from templates, list/get documents, embedded signing sessions |
| **GitHub** | Source control | Push files, create branches/PRs, sync repos, manage issues |
| **Slack** | Internal comms | Post messages, list channels, get history, thread replies, reactions |
| **Google Maps** | Geolocation | Place search, routing, office locator integration |
| **Google Sheets** | Data operations | Read/write spreadsheet data, create sheets, batch updates |
| **Netlify** | Edge deployment | Deploy sites, manage edge functions, environment variables |
| **Wix** | Site management | CMS operations, site configuration, deployment triggers |
| **Fetch** | Web scraping | HTTP requests, HTML-to-markdown conversion for scraper research |
| **Filesystem** | File operations | Read/write/search files across allowed directories |
| **Python** | Script execution | Run Python scripts for data processing, automation helpers |
| **Sequential Thinking** | Complex reasoning | Multi-step problem decomposition and analysis |
| **SSH** | Remote access | Execute commands on Hetzner VPS, manage scraper fleet |

> [!TIP]
> **Potential future MCPs to consider:**
> - **Twilio MCP** — Direct SMS/WhatsApp sending, call management, number lookup (currently managed via GAS `UrlFetchApp`)
> - **Docker MCP** — Container management on Hetzner VPS for scraper fleet

---

## Agent Skills (`.agent/skills/`)

Always consult the relevant `SKILL.md` before modifying complex logic.

### Core Platform Skills

| Skill | Purpose |
|-------|---------|
| **UI/UX Pro Max** | Premium design intelligence — 50+ styles, 95+ palettes, design system generation |
| **Wix-GAS Bridge Integrity** | Diagnose and repair 403 Forbidden errors between Wix and GAS |
| **PDF Template Manager** | SignNow PDF coordinate mapping for 14-document bail bond packet |
| **SignNow API Helper** | Official SignNow API documentation access and code generation |
| **SignNow MCP Server** | Action-performing server for SignNow workflow execution |
| **ElevenLabs MCP Server** | Official ElevenLabs MCP for TTS and audio generation |
| **Twilio Communications** | Robust SMS/WhatsApp patterns, 10DLC compliance |
| **Netlify Best Practices** | Edge Functions, Blobs, and AI Gateway patterns |

### Development & Quality Skills

| Skill | Purpose |
|-------|---------|
| **Systematic Debugging** | Rigorous step-by-step troubleshooting without guessing |
| **Error Handling Patterns** | Standardized JSON error responses (replace generic 500s) |
| **Production Code Audit** | Pre-release checklist and audit workflow |
| **Audit Security** | Pre-flight security checks for secrets and PII |
| **UI Visual Validator** | Automated check of Sticky Mobile CTA and responsive rules |
| **Self-Improving Agent** | Session retrospectives, knowledge base updates, pattern detection |

### Business & Growth Skills

| Skill | Purpose |
|-------|---------|
| **Bail School Manager** | Course bookings, reminders, certificate generation |
| **AI SEO Optimizer** | GEO techniques for AI search engines (Google AI Overviews, Perplexity) |
| **SEO Audit** | Comprehensive site audit — PageSpeed, structured data, meta tags |
| **Schema Markup** | JSON-LD structured data optimization |
| **Content Strategy** | Topic clusters, editorial calendar, content planning |
| **Copywriting** | Marketing copy for landing pages, CTAs, value propositions |
| **Page CRO** | Conversion rate optimization for marketing pages |
| **Form CRO** | Lead capture form optimization, friction reduction |
| **Analytics Tracking** | GA4, conversion tracking, event taxonomy |

### Google Workspace Skills

| Skill | Purpose |
|-------|---------|
| **GWS Sheets** | Read/write Google Sheets data |
| **GWS Drive** | Manage files and folders in Google Drive |
| **GWS Gmail** | Send and manage email |
| **GWS Calendar** | Manage events and schedules |
| **GWS Script** | Manage Google Apps Script projects, push code via `clasp` |

---

## Workflows (`.agent/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------| 
| `/deploy_gas_versioned` | Manual | Deploy GAS backend with version description via `clasp` |
| `/clasp_safe_push` | Manual | Safe `clasp push` with auth handling |
| `/git_smart_sync` | Manual | Stash → pull → rebase → push — handles conflicts gracefully |
| `/wix_safe_sync` | Manual | Sync Wix Editor changes with remote, handle rebase/naming |
| `/ui-ux-pro-max` | Manual | Generate premium design systems and apply styling |
| `/documentation_cleanup` | Manual | Audit, update, and archive documentation |
| `/self-improving-agent` | End of session | Log lessons, update KIs, create skills from patterns |

---

## External Services & APIs

### Core Infrastructure

| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| **Google Apps Script** | Backend "Factory" — all business logic | GAS Script Properties |
| **Wix Velo** | Frontend "Clipboard" — portal UI | Wix Secrets Manager |
| **MongoDB Atlas** | Arrest data storage, event logging | GAS Script Properties (`MONGODB_URI`) |
| **Google Sheets** | Operational database (arrest records, intake queue, logs) | Service Account JSON |
| **Google Drive** | Case file folders, signed PDFs, templates | Service Account |

### Communication

| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| **Twilio** | SMS & WhatsApp (10DLC compliant) | GAS Script Properties + Wix Secrets |
| **Slack** | Internal ops (12+ webhook channels) | Bot Token in Node-RED `.env` |
| **Telegram Bot API** | Client messaging, mini-apps | GAS Script Properties (`TELEGRAM_BOT_TOKEN`) |

### AI & Processing

| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| **OpenAI** | GPT-4o-mini for AI agents | GAS Script Properties (`OPENAI_API_KEY`) |
| **ElevenLabs** | Shannon voice agent | GAS Script Properties + Netlify env |
| **Google Cloud Vision** | FL Driver License OCR | GAS Script Properties |

### Signing & Payments

| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| **SignNow** | 14-doc bail bond packet | GAS Script Properties (`SIGNNOW_*`) |
| **SwipeSimple** | Payment links, virtual terminal | Dashboard UI (secure injection) |

### Hosting & CI/CD

| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| **Netlify** | Telegram Mini-Apps + Edge Functions | Netlify dashboard env vars |
| **Hetzner Cloud** | VPS for scraper fleet + GH runners | SSH keys, Hetzner API token |
| **GitHub Actions** | CI/CD for scrapers + Wix deploy | GitHub Secrets |
| **Docker** | Containerized scraper execution | `.env` files |

---

## Key Rules

1. **Never hardcode API keys** — Use `env.get()`, Wix Secrets Manager, or GAS Script Properties.
2. **Always check skills first** — If modifying a component that has a skill, read the `SKILL.md`.
3. **Run workflows** — Use the defined workflows for deployment, syncing, and design tasks.
4. **Security before push** — Run `audit_security` skill before any production deployment.
