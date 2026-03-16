# 🛠 Tools & Resources

> **Last Updated:** March 16, 2026

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
| **MongoDB** | Database operations | Query/insert/update arrest data, event logs, analytics aggregation |
| **Netlify** | Edge deployment | Deploy sites, manage edge functions, environment variables |
| **Fetch** | Web scraping | HTTP requests, HTML-to-markdown conversion for scraper research |
| **Filesystem** | File operations | Read/write/search files across allowed directories |
| **Python** | Script execution | Run Python scripts for data processing, automation helpers |
| **Sequential Thinking** | Complex reasoning | Multi-step problem decomposition and analysis |

> [!TIP]
> **Potential future MCPs to consider:**
> - **Twilio MCP** — Direct SMS/WhatsApp sending, call management, number lookup (currently managed via GAS `UrlFetchApp`)
> - **Docker MCP** — Container management on Hetzner VPS for scraper fleet
> - **Cloudflare MCP** — DNS management, Workers KV for edge caching if needed

---

## Agent Skills (`.agent/skills/`)

Always consult the relevant `SKILL.md` before modifying complex logic.

| Skill | File | Purpose |
|-------|------|---------|
| **UI/UX Pro Max** | `ui-ux-pro-max/` | Premium design intelligence — 50+ styles, 95+ palettes, design system generation |
| **Wix-GAS Bridge Integrity** | `wix_gas_bridge_integrity/` | Diagnose and repair 403 Forbidden errors between Wix and GAS |
| **PDF Template Manager** | `pdf_template_manager/` | SignNow PDF coordinate mapping for 14-document bail bond packet |
| **Twilio Communications** | `twilio-communications/` | Robust SMS/WhatsApp patterns, 10DLC compliance |
| **SignNow API Helper** | `signnow_api_helper/` | Official SignNow API documentation access and code generation |
| **SignNow MCP Server** | `signnow_mcp_server/` | Action-performing server for SignNow workflow execution |
| **ElevenLabs MCP Server** | `elevenlabs_mcp_server/` | Official ElevenLabs MCP for TTS and audio generation |
| **Bail School Manager** | `bail_school_manager/` | Course bookings, reminders, certificate generation |
| **Systematic Debugging** | `systematic-debugging/` | Rigorous step-by-step troubleshooting without guessing |
| **Error Handling Patterns** | `error_handling_patterns/` | Standardized JSON error responses (replace generic 500s) |
| **Production Code Audit** | `production-code-audit/` | Pre-release checklist and audit workflow |
| **Audit Security** | `audit_security/` | Pre-flight security checks for secrets and PII |
| **UI Visual Validator** | `ui-visual-validator/` | Automated check of Sticky Mobile CTA and responsive rules |
| **Netlify Best Practices** | `netlify_best_practices/` | Edge Functions, Blobs, and AI Gateway patterns |

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
| **OpenAI** | GPT-4o-mini for 6 AI agents | GAS Script Properties (`OPENAI_API_KEY`) |
| **ElevenLabs** | Shannon voice agent | GAS Script Properties + Netlify env |
| **Google Cloud Vision** | FL Driver License OCR | GAS Script Properties |
| **Mem0** | AI memory & persistence — long-term context for agents across sessions | API key / local config |

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
| **GitHub Actions** | CI/CD for scrapers (10+ workflows) | GitHub Secrets |
| **Docker** | Containerized scraper execution | `.env` files |

---

## Key Rules

1. **Never hardcode API keys** — Use `env.get()`, Wix Secrets Manager, or GAS Script Properties.
2. **Always check skills first** — If modifying a component that has a skill, read the `SKILL.md`.
3. **Run workflows** — Use the defined workflows for deployment, syncing, and design tasks.
4. **Security before push** — Run `audit_security` skill before any production deployment.
