# 📖 Operations Handbook

> **Last Updated:** August 27, 2026
> **Status:** 🟢 All Systems Operational

This document consolidates all operational runbooks: voice AI tuning, compliance, health monitoring, integrations, analytics, and scraping protocols.

Google indexing of county/blog pages: Wix-native `sitemap.xml` already lists them. GAS `runSitemapSubmission` (daily 06:00) submits that index plus child sitemaps to Search Console and pings IndexNow/Bing. Wix job `notifySearchEngines` does the same ping at 06:15. In Wix SEO → robots.txt, add `Allow: /_functions/sitemap` and `Allow: /_functions/indexnow` above `Disallow: /_functions/` so the IndexNow key and custom sitemap are crawlable. Do not noindex public county or blog pages.

---

## 1. Voice AI — Shannon Operations

### Configuration
- **Platform:** ElevenLabs Conversational AI
- **Agent ID:** `agent_2001kjth4na5ftqvdf1pp3gfb1cb`
- **Role:** 24/7 paperwork assistant (not nights-only). Walks defendant, indemnitor, or co-indemnitor through packet fields, then emails the indemnitor the DocuSeal signing link and SwipeSimple payment link.
- **Routing:** Twilio inbound → Netlify Edge `twilio-voice-inbound.js` → Shannon
- **Init Proxy:** Netlify Edge Function `elevenlabs-init.js` (avoids GAS 302 redirect)

### Shannon live switch
Set in Netlify site `shamrock-telegram` → Environment variables (production). No code change.

| Variable | Effect |
|----------|--------|
| `SHANNON_LIVE=true` (production) | Shannon answers **(727) 295-2245**. Anyone who needs a person is sent to **(239) 955-0301**, then **(239) 332-2245** if nobody answers. |
| `SHANNON_LIVE=false` | 727 rings 239-332-2245. Shannon picks up if the office misses. |
| `SHANNON_ROTATE_ERIC=true` | Optional. Mixes Eric in. Default is Shannon only. |

Do not call-forward 239-332-2245 back to 727-295-2245 (loop). Jail/sheriff callers to 727 still ring 332-2245.

Twilio Console for **(727) 295-2245** (set 2026-08-26):
- Primary voice URL: `https://shamrock-telegram.netlify.app/api/twilio-voice`
- Fallback URL: `https://shamrock-telegram.netlify.app/api/twilio-voice-fallback` — Dials 239-955-0301, then 239-332-2245, from +17272952245.

Shannon mid-call texts go through **BlueBubbles** on the office iMac (239-955-0178). Twilio is voice-only. Super CRM reaches BlueBubbles over **Tailscale** (`http://100.102.10.86:1234`); **frp** `:12434` is the backup. Warren is scraper residential egress only — not this path. Do not send Shannon texts through ngrok or `bb.shamrockbailbonds.biz`. Shannon tells callers the live desk is 239-955-0301 (backup 239-332-2245) and notifies a bondsman.

When Shannon needs a human (notify_bondsman, live transfer, callback, or intake CRM miss), BlueBubbles texts **239-784-9365**, **239-319-7008**, **239-955-0301**, and **239-955-0178**. Never 727. Never the caller’s own number.

Wix clipboard texts (`src/backend/bluebubbles.jsw`) also go through Super CRM: `POST /api/imessage/wix/send` with `GAS_API_KEY`. Fallback is `/api/imessage/shannon/send`. Off-mesh Wix cannot use Tailscale `100.x` and must not POST `bb.shamrockbailbonds.biz`.

Mem0 at ring: Netlify `twilio-voice-inbound.js` POSTs `/api/agent-brain/memory/lookup` before register-call. Requires Netlify `GAS_API_KEY` or `LEADS_INTERNAL_TOKEN` matching Super CRM. `user_id` is last 10 phone digits, shared with iMessage Shannon. Do not enable ElevenLabs built-in memory.

### Voice Prompting Rules
Voice AI requires vastly different prompting than text AI:
1. **Opening**: First line is always "Shamrock Bail Bonds. How may I help you today?" Then listen. Do not ask their name or pitch paperwork in the greeting.
2. **No Formatting**: Never output markdown, bullet points, or asterisks. Shannon reads them literally (e.g., "asterisk bold asterisk").
3. **Bite-Sized Output**: Keep responses under 2 sentences before asking a clarifying question.
4. **Fillers**: Use natural transitions ("Got it.", "Okay.", "Let me check that.") to mask tool-calling latency.
5. **Choices**: After she hears them, offer a path (look something up, get a bondsman, pick up paperwork, walk paperwork on the call). Identify defendant vs indemnitor from what they said.
6. **ID**: Offer a texted photo-upload link (`request_id_photo` method upload) or email of front/back photos (method email). Never email the jail. Then ask if it arrived.
7. **Signing**: Spell the indemnitor email back (`jane at gmail dot com`), wait for yes, then `email_paperwork_to_indemnitor` only (not `send_paperwork`). Staff still match surety and POA.
8. **Soft timeout**: “Okay.” only after the caller has spoken once (`disable_until_first_user_message`).

### Pronunciation Dictionary
Attached on Shannon as **Shannon Florida legal** (`WPpspEPWYXgSi99P7PhY`):
- "Charlotte" → `Shar-let`
- "Sarasota" → `Sara-so-ta`
- "Indemnitor" → `In-dem-ni-tor`
- "Capias" → `Cap-ee-us`
- "DocuSeal" → `Doc-you-seal`

ASR keywords match the same list plus Shamrock / Lee County.

### Simulated tests
Four attached ElevenLabs tests (create/run via `scripts/shannon_simulated_tests.py --run`):
- Indemnitor happy path (simulation)
- Spanish → Sofia
- Want a person → 239-955-0301, then 239-332-2245, never 727
- Missing email does not send paperwork

### Watchdog
Public path: `GET https://leads.shamrockbailbonds.biz/api/ops/shannon-health`
Checks BlueBubbles Tailscale, Mem0 `/api/agent-brain/memory/status`, unsigned Netlify voice **403**, fallback Dial **+12399550301** then **+12393322245** from **+17272952245**, and GAS health. Super CRM Watchdog cron consumes the same checks.

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
| Time to Sign | Track by approved workflow | `Magic_Link_Sent` → staff-issued DocuSeal completion; do not use a direct-provider SLA as a case-approval promise |
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

### Node-RED Health
- **21 flow tabs** active (1 disabled: WhatsApp Campaigns, pending 10DLC)
- **64 cron inject timers** — all on schedule
- **836 nodes** — 0 stubs, 5 reusable subflows
- **10 dashboard pages**, 26 widget groups
- **.env gaps**: `SLACK_WEBHOOK_ALERTS` and `SLACK_WEBHOOK_LEADS` empty (use Bot Token path instead)

### Scraper Health
- **Bot Detection**: Monitor for IP blocks (403, 503), Cloudflare/hCaptcha failures, unexpected DOM changes.
- **Rate Limiting**: Enforce minimum 15-minute intervals between county polls. Sequential detail-page requests with `sleep(2000)` between.
- **Job Metrics**: Track GitHub Actions success/failure rates against cron schedule expectations.

### Third-Party Integration Health
- **DocuSeal via Super CRM**: Monitor only the staff-approved packet workflow, verified signer-session availability, completion processing, and delivery health. Wix/GAS direct issuers must remain disabled.
- **SwipeSimple**: Verify payment link generation accuracy.
- **Slack**: Monitor delivery to all 12+ channels.

### UI Reliability
- **Mobile Sticky CTA**: Use `ui-visual-validator` skill to ensure primary CTA is permanently affixed on mobile.
- **Performance**: Routine checks on animations, loading states (spinners only — never "Loading..." text), glassmorphism elements.
- **Footer**: Dynamic copyright year via `setupFooterDynamic()` in `masterPage.js`. All footer links verified.

---

## 4. External Integrations

### Core Infrastructure
| Service | Purpose | Key Files | Credentials |
|---------|---------|-----------|-------------|
| **DocuSeal via Super CRM** | Staff-issued packet workflow and signing-session delivery | `CURRENT_PAPERWORK_ARCHITECTURE.md`, Netlify paperwork launchpad, Super CRM | Managed outside Wix/GAS; do not add DocuSeal credentials to these systems |
| **Twilio** | SMS & WhatsApp (10DLC compliant) | `Twilio_*.js` | GAS Script Properties + Wix Secrets |
| **ElevenLabs** | Shannon voice agent, call transcripts | `ElevenLabs_WebhookHandler.js` | GAS Script Properties + Netlify env |
| **OpenAI** | GPT-4o-mini for AI agents | `OpenAIClient.js` | GAS Script Properties (`OPENAI_API_KEY`) |
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
| `DocuSeal_Complete` | Verified completion from the approved Super CRM/DocuSeal workflow | **Primary conversion** |

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
3. **Tier 3 (Stealth & Bypasses)**: `DrissionPage`, `Scrapling`, `curl_cffi` in `shamrock-leads/scrapers/`. Premium proxies (ZenRows, ScraperAPI) for hostile targets.

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
- **Docker Compose**: Containerized Python scraper fleet (`shamrock-leads`)
- **Hetzner Cloud**: VPS (`178.156.179.237`) hosting `shamrock-leads` + `shamrock-bond-tracker`
- **GitHub Actions**: 15 workflows with staggered cron schedules
- **MongoDB Atlas**: Centralized arrest data storage via `mongo_writer.py` bulk upsert

---

*Consolidated from: VOICE_AI_TUNING.md, HEARTBEAT.md, COMPLIANCE.md, INTEGRATIONS_AND_AUTOMATIONS.md, ANALYTICS_AND_EVENTS.md, SCRAPING_PLAYBOOK.md — March 17, 2026*
*Updated: August 19, 2026 — Current-state signing operations realigned to the DocuSeal-only Super CRM workflow.*
