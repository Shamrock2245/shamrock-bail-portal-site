# 🛠 Tools & Resources

> **Last Updated:** 2026-08-21  
> **Status:** Current operational reference

This document outlines all tools, MCP servers, agent skills, and external services used by the Shamrock AI ecosystem.

---

## MCP Servers (Model Context Protocol)

| Server | Purpose | Key Actions |
|---|---|---|
| **ElevenLabs** | Voice AI management | Create/manage agents, TTS, voice cloning, call history, audio isolation |
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

---

## Agent Skills (`.agent/skills/`)

Always consult the relevant `SKILL.md` before modifying complex logic.

### Core Platform Skills

| Skill | Purpose |
|---|---|
| **DocuSeal Paperwork Manager** | DocuSeal signing boundary, canonical schema mapping (`canonical-paperwork-mapper.js`), and staff-gated issuance |
| **BlueBubbles Messaging** | High-conversion iMessage bridge on office iMac via Tailscale (frp backup). Super CRM `/api/imessage/*`. Never Twilio SMS for Shannon. |
| **ElevenLabs Voice Architecture** | Shannon 24/7 Voice AI employee, Netlify Edge proxy, 8 webhook tools, call transfers |
| **UI/UX Pro Max** | Premium design intelligence — 50+ styles, 95+ palettes, design system generation |
| **Wix-GAS Bridge Integrity** | Diagnose and repair 403 Forbidden errors between Wix and GAS |
| **Twilio Communications** | Secondary SMS/WhatsApp patterns, 10DLC compliance fallback |
| **Netlify Best Practices** | Edge Functions, Blobs, and AI Gateway patterns |

### Development & Quality Skills

| Skill | Purpose |
|---|---|
| **Systematic Debugging** | Rigorous step-by-step troubleshooting without guessing |
| **Error Handling Patterns** | Standardized JSON error responses (DocuSeal, Auth, DB) |
| **Production Code Audit** | Pre-release checklist and audit workflow |
| **Audit Security** | Pre-flight security checks for secrets and PII |
| **UI Visual Validator** | Automated check of Sticky Mobile CTA and responsive rules |
| **Self-Improving Agent** | Session retrospectives, knowledge base updates, pattern detection |

### Business & Growth Skills

| Skill | Purpose |
|---|---|
| **Bail School Manager** | Course bookings, reminders, certificate generation |
| **AI SEO Optimizer** | GEO techniques for AI search engines (Google AI Overviews, Perplexity) |
| **SEO Audit** | Comprehensive site audit — PageSpeed, structured data, meta tags |
| **Schema Markup** | JSON-LD structured data optimization |
| **Content Strategy** | Topic clusters, editorial calendar, content planning |
| **Copywriting** | Marketing copy for landing pages, CTAs, value propositions |
| **Page CRO** | Conversion rate optimization for marketing pages |
| **Form CRO** | Lead capture form optimization, friction reduction |
| **Analytics Tracking** | GA4, conversion tracking, event taxonomy |

---

## Workflows (`.agent/workflows/`)

| Workflow | Trigger | Purpose |
|---|---|---|
| `/deploy_gas_versioned` | Manual | Deploy GAS backend with version description via `clasp` |
| `/clasp_safe_push` | Manual | Safe `clasp push` with auth handling |
| `/git_smart_sync` | Manual | Stash → pull → rebase → push — handles conflicts gracefully |
| `/wix_safe_sync` | Manual | Sync Wix Editor changes with remote, handle rebase/naming |
| `/ui-ux-pro-max` | Manual | Generate premium design systems and apply styling |
| `/documentation_cleanup` | Manual | Audit, update, and archive documentation |
| `/self-improving-agent` | End of session | Log lessons, update KIs, create skills from patterns |

---

*Maintained by Shamrock Engineering & AI Agents*
