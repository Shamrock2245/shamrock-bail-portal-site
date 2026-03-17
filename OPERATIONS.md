# 📖 Operations Handbook

> **Last Updated:** March 17, 2026
> **Status:** 🟢 All Systems Operational

This document consolidates all operational runbooks: voice AI tuning, compliance, health monitoring, integrations, analytics, and scraping protocols.

---

## 1. Voice AI — Shannon Operations

### Configuration
- **Platform:** ElevenLabs Conversational AI
- **Agent ID:** `agent_2001kjth4na5ftqvdf1pp3gfb1cb`
- **Routing:** Twilio inbound → ElevenLabs WebSocket
- **Init Proxy:** Netlify Edge Function `elevenlabs-init.js` (avoids GAS 302 redirect)

### Voice Prompting Rules
Voice AI requires vastly different prompting than text AI:
1. **No Formatting**: Never output markdown, bullet points, or asterisks. Shannon reads them literally (e.g., "asterisk bold asterisk").
2. **Bite-Sized Output**: Keep responses under 2 sentences before asking a clarifying question.
3. **Fillers**: Use natural transitions ("Got it.", "Okay.", "Let me check that.") to mask tool-calling latency.

### Pronunciation Dictionary
Florida counties and legal terms that confuse TTS — add to ElevenLabs Custom Pronunciation Dictionary:
- "Charlotte" → `Shar-let`
- "Sarasota" → `Sara-so-ta`
- "Indemnitor" → `In-dem-ni-tor`
- "Capias" → `Cap-ee-us`

### Latency & Interruption Tuning
- **End of Turn Timeout**: 700ms–1000ms. Bail bond clients are often crying or stressed and may pause frequently.
- **Interruption Sensitivity**: High. Shannon must stop speaking immediately if the client starts talking.

### Webhook Latency Masking
When Shannon calls a webhook (e.g., `lookup_defendant`, `calculate_premium`):
1. She MUST acknowledge the action first: "Hold on one second while I look that up..."
2. The webhook MUST return within 5 seconds, or ElevenLabs will timeout.
3. For long-running operations, return `202 Accepted` and hand the resulting dispatch off to a background GAS trigger.

### Fallback & Handoff
If the user asks for a human, a lawyer, or gets excessively angry:
- Immediately trigger `transfer_to_bondsman` tool (3 numbers: primary, secondary, Spanish line).
- **Fallback Sentence**: "It sounds like you need to speak with our on-call bondsman right away. Please hold while I transfer you."

---

## 2. Compliance & Escalations

### 10DLC & Telephony
- **No spam or marketing blasts** on Twilio.
- **WhatsApp and SMS** MUST have a clear opt-out path (`Reply STOP`).
- "The Concierge" and "Shannon" must only initiate Path B (packet delivery) if explicit consent is obtained.
- Communication preferences are checked via `CommPrefsManager.js` before all outbound messages.

### KPI Tracking
| KPI | Target | Measurement |
|-----|--------|-------------|
| Time to Contact | < 5 seconds | AI response to web chat / inbound calls |
| Time to Sign | < 15 minutes | `Magic_Link_Sent` → `SignNow_Complete` |
| Abandoned Intake Rescue Rate | Track | Forms recovered by SMS follow-up via The Closer |
| Scraper Effectiveness | Track | New arrests processed without blocks |

### Escalation Protocol
When AI instances hit their knowledge threshold:
- **Trigger**: Caller asks a complex legal question, gets angry, or asks to speak to humans.
- **Action**: Agent states: "I am an automated assistant. Let me grab the on-call bondsman for you."
- **Execution**: Warm-transfer via ElevenLabs or alert Slack `#intake-alerts`. Do NOT attempt to provide legal advice.

---

## 3. Health Monitoring ("The Watchdog")

### Core Engine Health (Wix ↔ GAS Bridge)
- **Webhook Latency**: Must respond quickly. Long-polling operations (PDF gen, risk assessment) must occur asynchronously. Return `200 OK` to prevent Wix frontend timeouts.
- **Payload Integrity**: JSON payloads must maintain consistent schemas. Track parsing errors in GAS execution logs.
- **API Quota Monitoring**: Watch GAS daily execution limits and `UrlFetchApp` call quotas.

### Communication Health
- **Twilio SMS/WhatsApp**: Monitor delivery failure rates (Error 30008, etc.). Strict A2P 10DLC compliance.
- **ElevenLabs (Shannon)**: Monitor voice AI latency (time-to-first-byte). Verify correct `agent_id` bindings.
- **Telegram Bot**: Ensure `@ShamrockBail_bot` webhook remains active. Monitor for rate-limiting or dropped messages.

### Scraper Health
- **Bot Detection**: Monitor for IP blocks (403, 503), Cloudflare/hCaptcha failures, unexpected DOM changes.
- **Rate Limiting**: Enforce minimum 15-minute intervals between county polls. Sequential detail-page requests with `sleep(2000)` between.
- **Job Metrics**: Track GitHub Actions success/failure rates against cron schedule expectations.

### Third-Party Integration Health
- **SignNow**: Monitor embedded link generation success rates and webhook callbacks. Verify OAuth token refresh.
- **SwipeSimple**: Verify payment link generation accuracy.
- **Slack**: Monitor delivery to all 12+ channels.

### UI Reliability
- **Mobile Sticky CTA**: Use `ui-visual-validator` skill to ensure primary CTA is permanently affixed on mobile.
- **Performance**: Routine checks on animations, loading states (spinners only — never "Loading..." text), glassmorphism elements.

---

## 4. External Integrations

### Core Infrastructure
| Service | Purpose | Key Files | Credentials |
|---------|---------|-----------|-------------|
| **SignNow** | 14-doc bail bond packet, embedded signing | `SignNow_SendPaperwork.js`, `Server_DocumentLogic.js` | GAS Script Properties (`SIGNNOW_*`) |
| **Twilio** | SMS & WhatsApp (10DLC compliant) | `Twilio_*.js` | GAS Script Properties + Wix Secrets |
| **ElevenLabs** | Shannon voice agent, call transcripts | `ElevenLabs_WebhookHandler.js` | GAS Script Properties + Netlify env |
| **OpenAI** | GPT-4o-mini for 6 AI agents | `OpenAIClient.js` | GAS Script Properties (`OPENAI_API_KEY`) |
| **SwipeSimple** | Payment links, virtual terminal | `Dashboard.html`, Telegram bot | Dashboard UI |
| **Telegram** | Client messaging, mini-apps, intake | `Telegram_*.js` | GAS Script Properties (`TELEGRAM_BOT_TOKEN`) |
| **Slack** | Internal ops (12+ channels) | `SlackIntegration.js` | Bot Token in Node-RED `.env` |
| **MongoDB Atlas** | Arrest data, event logging | `MongoLogger.gs`, `mongo_writer.py` | GAS Script Properties (`MONGODB_URI`) |
| **Google Cloud Vision** | FL Driver License OCR | `Telegram_OCR.js` | GAS Script Properties |

### Telegram Bot Operations
- **BotFather Config:** Inline mode enabled, 6 commands registered, Mini App menu button set.
- **Webhook:** `https://www.shamrockbailbonds.biz/_functions/telegramWebhook`
- **Inline Test:** `@ShamrockBail_bot 5000 2 lee` → instant premium quote
- **Office Locator:** Share GPS location with bot → nearest office with Call/Directions

### Active Time-Driven Triggers
| Function | Schedule | Purpose |
|----------|----------|---------|
| `TG_processCourtDateReminders` | Every 30 min | Court date reminders |
| `TG_processWeeklyPaymentProgress` | Monday 10 AM | Payment plan progress updates |
| `runLeeArrestsNow` | Every 1 hour | Lee County arrest scraping |
| `processCourtEmails` | 7 AM, 10 AM, 2 PM, 5 PM | Court date email parsing |

---

## 5. Analytics & Event Taxonomy

### Primary Funnel Events
| Event | Trigger | Significance |
|-------|---------|-------------|
| `Lead_Captured` | Web chat or phone captures Name, County, Phone | Lead entry |
| `Magic_Link_Sent` | Path B consent triggers SMS | Engagement |
| `Intake_Started` | Indemnitor enters OTP on `/intake` | Conversion intent |
| `PDF_Generated` | GAS confirms contract generation | Near-conversion |
| `SignNow_Complete` | `document.update` → `signed` | **Primary conversion** |

### Operational Events
| Event | Trigger | Response |
|-------|---------|----------|
| `Scraper_Blocked` | HTTP 403 or parsing failure | Alert `#intake-alerts`, retry with backoff |
| `Webhook_Timeout` | GAS unreachable | Alert The Watchdog, check API quotas |

### UI Tracking
- Tracked buttons: `#callNowCTA`, `#getBailCTA`, `#chatWidget`
- Sticky CTA: `#sticky-mobile-cta` — do not rename without updating analytics
- Target: Lighthouse Scores > 85

---

## 6. Scraping Playbook ("The Scout" & "The Clerk")

### Tooling Selection Hierarchy
Do not hammer a site with `axios` or `fetch` if it fails. Escalate gracefully:
1. **Tier 1 (Direct API)**: Check Network tab for hidden JSON/DataTables endpoints. Avoids HTML entirely.
2. **Tier 2 (Headless Browsers)**: `Puppeteer` or `Playwright` for simple cookies and rendering.
3. **Tier 3 (Stealth & Bypasses)**: `DrissionPage`, `Scrapling`, `curl_cffi` in `swfl-arrest-scrapers/python_scrapers/`. Premium proxies (ZenRows, ScraperAPI) for hostile targets.

### Rate Limiting & Discipline
- **Never poll faster than every 15 minutes** for a single county. Hourly is preferred.
- **Concurrency**: Sequential detail-page requests with `sleep(2000)` between.
- **Proxies**: Rotate IPs when accessing >100 records in a single run.

### HTML Parsing Rules
County IT departments change layouts without warning:
- **Do not rely on strict CSS classes** (e.g., `.table-row-new-2`).
- **Use text proximity**: Search for keywords (`contains("Charge:")`) and extract the next sibling.
- **Failure alerts**: Script MUST log to Slack if parsing breaks.

### Zero-Data Safety
If a jail roster returns 0 arrests, do NOT assume success and overwrite the database. The IP was likely soft-blocked. Retain the previous scrape's dataset until verified.

### Data Pipeline
```
Scrape → Normalize (39-column schema) → Deduplicate (County + Booking_Number)
    → Score (0-100) → Sheets (row 2 insert) → MongoDB Atlas → Slack alert
```

### Infrastructure
- **Docker Compose**: Containerized dual-stack (Python + Node.js)
- **Hetzner Cloud**: VPS (`cpx21`, Ubuntu 24.04) for self-hosted GitHub Actions runners
- **GitHub Actions**: 15 workflows with staggered cron schedules
- **MongoDB Atlas**: Centralized arrest data storage via `mongo_writer.py` bulk upsert

---

*Consolidated from: VOICE_AI_TUNING.md, HEARTBEAT.md, COMPLIANCE.md, INTEGRATIONS_AND_AUTOMATIONS.md, ANALYTICS_AND_EVENTS.md, SCRAPING_PLAYBOOK.md — March 17, 2026*
