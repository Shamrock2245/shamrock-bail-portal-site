# 🍀 Progress Report — March 10, 2026
> **Session: Node-RED Webhooks, Static Ngrok Domain, & External Service Wiring**
> **Prepared for: Manus | By: Brendan + Antigravity AI**

---

## Executive Summary

Today we made Node-RED fully operational as the **event hub** for the Shamrock ecosystem. All webhook endpoints are now live, permanently addressed, and connected to external services (Telegram, Twilio). The system auto-starts on login and auto-recovers from crashes.

---

## What Was Built

### 1. 🔌 Node-RED Webhook Wiring (13 Endpoints)
All webhook endpoints on the **Advanced** tab were wired and deployed:

| # | Endpoint | Path | Status |
|---|----------|------|--------|
| 1 | Wix Intake | `/wix-intake` | ✅ Live |
| 2 | Wix Intake Start | `/intake-start` | ✅ Live |
| 3 | Wix Intake Complete | `/intake-complete` | ✅ Live |
| 4 | Scraper Update | `/api/scraper/webhook` | ✅ Live |
| 5 | Scraper Results | `/webhook/scraper-results` | ✅ Live |
| 6 | WhatsApp (Twilio) | `/whatsapp` | ✅ Live |
| 7 | Telegram (legacy) | `/telegram` | ✅ Live |
| 8 | Telegram Bot | `/webhook/telegram-bot` | ✅ Live |
| 9 | Telegram Convo | `/webhook/telegram-conversation` | ✅ Live |
| 10 | Telegram MiniApp | `/webhook/telegram-miniapp` | ✅ Live |
| 11 | ElevenLabs Status | `/webhook/elevenlabs-status` | ✅ Live |
| 12 | SignNow Events | `/signnow-event` | ✅ Live |
| 13 | Scout/Arrest | `/webhook/scout` | ✅ Live |

**Fixes Applied:**
- Fixed broken GAS trigger URLs in Twilio and Telegram flows (were using undefined mustache variables)
- Added global config inject node with `NGROK_BASE_URL`, `GAS_URL`, `GAS_URL_ALT`, `GAS_URL_OPS`, and `WEBHOOK_ENDPOINTS` registry

### 2. 🔒 Permanent Static Ngrok Domain
**Claimed free static domain**: `pseudospherical-etta-untactually.ngrok-free.dev`
- **Domain ID**: `rd_3AlFcw7HiD5oxtN8NsUr0ENvvLd`
- **No more changing URLs** — this is permanent across restarts
- All Node-RED global variables updated to use this static base URL

### 3. 🤖 Auto-Start Automation
Created macOS LaunchAgent: `~/Library/LaunchAgents/com.shamrock.ngrok.plist`
- **Starts ngrok automatically** on Mac login
- **Auto-restarts** if ngrok crashes (`KeepAlive`)
- Logs to `/tmp/ngrok-shamrock.log`

### 4. 📡 External Services Pointed to Static Domain

#### Telegram Bot
- **Webhook registered** via `setWebhook` API
- **URL**: `https://pseudospherical-etta-untactually.ngrok-free.dev/webhook/telegram-bot`
- **Verified** via `getWebhookInfo`

#### Twilio SMS/WhatsApp (`+17272952245`)
- **SMS URL updated** from default Twilio demo to: `https://pseudospherical-etta-untactually.ngrok-free.dev/whatsapp`
- **Voice URL**: Left unchanged — points to ElevenLabs agent router (correct)
- **Status Callback**: Left unchanged — points to ElevenLabs (correct)

---

## Architecture Flow

```
[Telegram] ──webhook──→ ngrok static domain ──→ Node-RED (port 1880)
[Twilio SMS/WhatsApp] ──webhook──→ ngrok static domain ──→ Node-RED
[Wix Velo] ──HTTP──→ ngrok static domain ──→ Node-RED ──→ GAS Backend
[Scrapers] ──push──→ ngrok static domain ──→ Node-RED ──→ Bounty Board
[Voice Calls] ──→ ElevenLabs Agent Router (direct, not through ngrok)
```

---

## Key Credentials Reference
> ⚠️ These are stored in Wix Secrets Manager and GAS Script Properties. Listed here for Manus's awareness.

| Service | Credential Type | Stored In |
|---------|----------------|-----------|
| Telegram | Bot Token | GAS Script Properties / Wix Secrets |
| Twilio | Account SID + Auth Token | GAS Script Properties / Wix Secrets |
| ngrok | Auth Token | `~/Library/Application Support/ngrok/ngrok.yml` |
| SignNow | API Key | Wix Secrets Manager |
| ElevenLabs | API Key | Wix Secrets Manager |

---

## Next Steps / Recommendations

1. **[ ] Register Wix webhook URLs** — Update Wix Velo code to point form submissions to the static ngrok endpoints
2. **[ ] Configure SignNow event subscriptions** — Point document signing events to `/signnow-event`
3. **[ ] WhatsApp Business integration** — Enable Twilio WhatsApp Sandbox or go live with WhatsApp Business API
4. **[ ] Webhook signature verification** — ngrok supports `verify-webhook` traffic policy for Twilio, Slack, etc.
5. **[ ] "The Scout" geographic expansion** — Scraper webhook at `/webhook/scout` is ready to receive data from new counties
6. **[ ] Production hardening** — Consider upgrading ngrok for custom domains, IP policies, and TLS inspection

---

## Technical Notes

- **Node-RED runs on port 1880** — both the editor and the webhook endpoints
- **ngrok inspector** available at `http://localhost:4040` for debugging incoming webhook payloads
- **All 13 endpoints** were deployed via Node-RED's admin API (HTTP 204 success)
- **LaunchAgent** uses `/opt/homebrew/bin/ngrok` (Homebrew install path on Apple Silicon)

---

*Report generated: March 10, 2026 @ 1:12 PM EDT*
*Session ID: 039512fb-80a8-47fd-8076-179b241add7f*
