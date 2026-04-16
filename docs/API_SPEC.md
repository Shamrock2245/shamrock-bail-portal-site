# 🔌 API Specification

> **Last Updated:** April 16, 2026

All internal and external API endpoints in the Shamrock ecosystem.

---

## 1. GAS Web App — Single Entry Point

**URL:** Deployed GAS Web App URL (stored in Wix Secrets as `GAS_WEB_APP_URL`)

### POST Endpoints (`doPost()`)
All POST requests route through `Code.js doPost()` with an `action` parameter.

| Action | Handler | Purpose | Caller |
|--------|---------|---------|--------|
| `submitIntake` | `IntakeHandler.js` | New intake submission | Wix Portal |
| `syncCase` | `WixPortalIntegration.js` | Sync case data to Wix CMS | Node-RED cron |
| `sendPaperwork` | `SignNow_SendPaperwork.js` | Generate & send SignNow packet | Shannon / Bot |
| `telegramWebhook` | `Telegram_WebhookHandler.js` | Process Telegram messages | Wix HTTP webhook |
| `signNowWebhook` | `SignNow_WebhookHandler.js` | `document.complete` events | SignNow |
| `elevenLabsWebhook` | `ElevenLabs_WebhookHandler.js` | Shannon voice call data | Netlify Edge Fn |
| `runTheCloser` | `TheCloser.js` | Execute drip campaign cycle | Node-RED cron |
| `runReviewHarvester` | `ReviewHarvester.js` | Send review request SMS | Node-RED cron |

### GET Endpoints (`doGet()`)
All GET requests route through `Code.js doGet()` / `handleGetAction()`.

| Action | Handler | Purpose | Caller |
|--------|---------|---------|--------|
| `getLeads` | `NodeRedHandlers.js` | Qualified leads by county | Node-RED |
| `getCourtDates` | `NodeRedHandlers.js` | Upcoming court dates | Node-RED |
| `getRevenue` | `NodeRedHandlers.js` | Revenue dashboard data | Node-RED |
| `getDailyOps` | `DailyOpsReport.js` | Daily operations summary | Node-RED |
| `getSystemHealth` | `NodeRedHandlers.js` | GAS health check | Node-RED / Watchdog |
| `lookupDefendant` | `NodeRedHandlers.js` | Search by name/booking# | Shannon |
| `calculatePremium` | `Telegram_InlineQuote.js` | Premium estimate | Shannon / Bot |

---

## 2. Wix Backend Modules (.jsw / .web.js)

### `http-functions.js` (HTTP Endpoints)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/_functions/gasProxy` | POST | Forward requests to GAS Web App |
| `/_functions/telegramWebhook` | POST | Receive Telegram bot updates |

### `portal-auth.jsw`
| Function | Input | Output |
|----------|-------|--------|
| `getUserRole()` | (none) | `{ role: 'DEFENDANT' \| 'INDEMNITOR' \| 'STAFF' \| 'ADMIN' }` |
| `validateMagicLink(token)` | `string` | `{ valid: boolean, email: string, caseId: string }` |

### `ai-service.jsw`
| Function | Input | Output |
|----------|-------|--------|
| `getAIResponse(message, context)` | `string, object` | `{ reply: string, intent: string }` |

### `geocoding.jsw`
| Function | Input | Output |
|----------|-------|--------|
| `detectCounty(lat, lng)` | `number, number` | `{ success: boolean, county: string, confidence: number, method: string }` |

### `routing.jsw`
| Function | Input | Output |
|----------|-------|--------|
| `getPhoneNumber(context)` | `{ county, language, device }` | `{ success: boolean, number: string, display: string }` |

---

## 3. Netlify Edge Functions

| Function | Path | Purpose |
|----------|------|---------|
| `elevenlabs-init.js` | `/api/elevenlabs-init` | ElevenLabs conversation webhook (avoids GAS 302) |
| `send-paperwork.mjs` | `/api/send-paperwork` | Proxy paperwork requests to GAS |
| `notify-bondsman.mjs` | `/api/notify-bondsman` | Slack alert from Shannon calls |

---

## 4. SignNow Webhooks

| Event | Fires When | GAS Handler |
|-------|-----------|-------------|
| `document.complete` | All signatures collected | Updates case status → Slack alert |
| `document.viewed` | Client opens signing link | Logs view event |
| `invite.declined` | Client declines to sign | Flags case for follow-up |

---

## 5. Standard Response Format

All GAS endpoints return:
```json
{
  "success": true,
  "action": "submitIntake",
  "data": { ... },
  "error": null,
  "timestamp": "2026-04-16T12:00:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "action": "submitIntake",
  "data": null,
  "error": "Missing required field: defendantName",
  "timestamp": "2026-04-16T12:00:00Z"
}
```
