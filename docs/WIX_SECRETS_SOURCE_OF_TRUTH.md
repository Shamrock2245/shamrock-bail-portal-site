# Wix Secrets Manager — Source of Truth

> **Doctrine:** The website is the clipboard. The backend is the brain.  
> **Rule:** API keys and webhooks live in **Wix Secrets Manager** (Developer Tools → Secrets Manager) and **GAS Script Properties** / **VPS `.env`**. Never hardcoded in frontend or tracked git files.

---

## 1. Critical Immediate Secret: `LEADS_WEBHOOK_SECRET`

> Wix Secrets Manager rejects names beginning with "wix" (any case), so the Wix-side name is `LEADS_WEBHOOK_SECRET`. The VPS `.env` keeps `WIX_WEBHOOK_SECRET`; the values must match.

### What is it?
The shared authentication secret between the Wix website application wizards (Defendant and Indemnitor portals) and the ShamrockLeads Super CRM on the Hetzner VPS (`https://leads.shamrockbailbonds.biz/api/webhooks/wix-intake`).

### Where to add it in Wix:
1. Open the [Wix Studio Dashboard](https://manage.wix.com) for Shamrock Bail Bonds.
2. Navigate to **Developer Tools** → **Secrets Manager**.
3. Click **Store Secret**.
4. Set **Name**: `LEADS_WEBHOOK_SECRET` (case-sensitive, exact).
5. Set **Value**: `48ac04b0aeae45346ebb7526a16ba04911ff3c0b1841af5de1f097d11da3859a`
6. Set **Description** (optional): `Shared secret for Wix website wizard to ShamrockLeads CRM intake webhook`
7. Click **Save**.

### Why was it failing?
In `src/backend/leadsIntake.jsw`:
```javascript
const SECRET_NAME = 'LEADS_WEBHOOK_SECRET';
...
secret = await getSecret(SECRET_NAME);
if (!secret) {
    console.error('[leadsIntake] Wix secret LEADS_WEBHOOK_SECRET is not set');
    return { success: false, error: 'Online applications are temporarily unavailable. Please call (239) 332-2245.' };
}
```
If `LEADS_WEBHOOK_SECRET` is not in Wix Secrets Manager, `getSecret()` returns empty and the online application immediately fails closed with the above error message *before* any HTTP request leaves Wix.

### Live Production Verification
- **Hetzner VPS (`leads.shamrockbailbonds.biz`):** Already configured in `/opt/shamrock-leads/.env`.
- Live HTTP probe to `https://leads.shamrockbailbonds.biz/api/webhooks/wix-intake`:
  - With bad secret: `401 {"success":false,"error":"Unauthorized"}`
  - With `48ac04b0aeae45346ebb7526a16ba04911ff3c0b1841af5de1f097d11da3859a`: `400 {"success":false,"error":"Empty or invalid JSON body"}` (successfully passed authentication).
- CRM Readiness probe at `https://leads.shamrockbailbonds.biz/api/crm/health`:
  - Reports `"wix_webhook_auth": true`.

---

## 2. Complete Wix Secrets Manager Inventory

| Secret Name | Consuming File(s) in `src/` | Authoritative Source / Value | Purpose |
|---|---|---|---|
| `WIX_WEBHOOK_SECRET` | `src/backend/leadsIntake.jsw` | `48ac04b0aeae45346ebb7526a16ba04911ff3c0b1841af5de1f097d11da3859a` (VPS `.env`) | Auth header `X-Wix-Webhook-Secret` for website intake forms to ShamrockLeads CRM |
| `GAS_API_KEY` | `src/backend/utils.js`, `healthCheck.jsw`, `bluebubbles.jsw`, `wixApi.jsw`, `location-tracker.jsw` | `shamrock_live_auth_v555` (VPS `.env` / GAS Properties) | Machine auth for Wix-to-GAS and fallback for CRM endpoints |
| `GAS_WEB_APP_URL` | `src/backend/utils.js`, `healthCheck.jsw` | `https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec` | Canonical GAS `/exec` URL from [`.gas-config.json`](../.gas-config.json) |
| `GOOGLE_MAPS_API_KEY` | `src/backend/location-enhanced.jsw`, `geocoding.jsw`, `googleMaps.jsw` | GCP Console (`shamrock-bail-bonds`) | Maps API for geocoding and frontend map components |
| `TELEGRAM_WEBHOOK_SECRET` | `src/backend/telegram-webhook.jsw` | GAS Script Properties | HMAC verification for incoming Telegram bot webhooks |
| `GAS_WEBHOOK_URL` | `src/backend/telegram-webhook.jsw` | `https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec` | GAS webhook target |
| `SLACK_WEBHOOK_URL` | `src/backend/integrations.web.js` | Slack Apps console | Outbound Slack notifications |

---

## 3. Cross-Repository Secret Map

```
┌─────────────────────────────────┐
│     Wix Studio Dashboard        │
│    Developer Tools → Secrets    │
│  • WIX_WEBHOOK_SECRET           │
│  • GAS_API_KEY                  │
│  • GAS_WEB_APP_URL              │
└──────────────┬──────────────────┘
               │
               │ POST /api/webhooks/wix-intake
               │ Header: X-Wix-Webhook-Secret
               ▼
┌─────────────────────────────────┐
│  Hetzner VPS (shamrock-leads)   │
│  /opt/shamrock-leads/.env       │
│  • WIX_WEBHOOK_SECRET (Matches) │
│  • GAS_API_KEY                  │
│  • MONGODB_URI                  │
│  • DOCUSEAL_API_KEY             │
└──────────────┬──────────────────┘
               │
               │ appendIntakeLedger (non-blocking)
               ▼
┌─────────────────────────────────┐
│  Google Apps Script (The Brain) │
│  Script Properties              │
│  • GAS_API_KEY (Matches)        │
│  • WIX_WEBHOOK_SECRET           │
└─────────────────────────────────┘
```

---

## 4. Troubleshooting Checklist for Future Agents

1. **Website intake displays "Online applications are temporarily unavailable":**
   - Check if `WIX_WEBHOOK_SECRET` is defined in Wix Secrets Manager.
   - Verify that the value matches `WIX_WEBHOOK_SECRET` in `/opt/shamrock-leads/.env`.
2. **CRM returns 401 Unauthorized:**
   - The value sent in header `X-Wix-Webhook-Secret` does not match the server's `WIX_WEBHOOK_SECRET` (or fallback `GAS_API_KEY`).
3. **CRM returns 503 Webhook auth not configured:**
   - Both `WIX_WEBHOOK_SECRET` and `GAS_API_KEY` are empty on the ShamrockLeads server.
4. **Testing after saving:**
   - Submit a test intake via the website portal with defendant name `"TEST — DELETE"`.
   - Confirm it appears in MongoDB `intake_queue` (`source: "wix_portal"` or `wix_defendant_wizard`).
   - Archive the test intake in ShamrockLeads.
