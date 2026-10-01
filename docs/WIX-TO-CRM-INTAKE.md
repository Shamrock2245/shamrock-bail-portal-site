# Website applications → CRM (MongoDB first) — 2026-09-27

**Owner decision:** Wix applications go to the CRM first. MongoDB
`intake_queue` (shamrock-leads) is the source of truth. After a successful
save the CRM copies each intake to Google Sheets (one "Intake Ledger" row, for
reporting and data visualisation) and posts a Slack notice. Those copies are a
non-blocking fan-out: a Sheets or Slack failure never fails the intake; it is
logged and retried.

```
Wizard embed (#defendantWizard / #indemnitorWizard)
   │ postMessage {type, payload, clientNonce}
   ▼
Page code portal-defendant / portal-indemnitor  (setupWizardBridge)
   │ submitWizardToLeads(payload, formType, {clientNonce})
   ▼
backend/leadsIntake.jsw  ── POST /api/webhooks/wix-intake
   │                        X-Wix-Webhook-Secret: <Secrets Manager WIX_WEBHOOK_SECRET>
   ▼
shamrock-leads  →  adapter (nested → flat, role, form_type)  →  Mongo intake_queue  ✅ source of truth
                   → auto-match → reply {success:true, intake_id, payment_link}
                   → (after save, fire-and-forget, retried by cron)
                        ├─ GAS action appendIntakeLedger → Sheets "Intake Ledger" tab
                        └─ Slack (SLACK_WEBHOOK_INTAKE / SLACK_WEBHOOK_LEADS)
   ▲
   └── ack {ok, intakeId, paymentLink} → embed shows success + "Pay by card"
```

- No surety, county or state is defaulted for website intakes (staff choose the
  surety at Write Bond; unknown/inactive sureties fail closed).
- The indemnitor wizard no longer calls the blocked `submitIndemnitorPhase1`.
- `backend-gas/IntakeLedger.js` adds the `appendIntakeLedger` action (GAS
  deploy needed). It is idempotent per `intake_id` and receives no SSN, DOB,
  DL number or street address.
- Pay-by-card: the CRM returns the link (case invoice link → website link
  `lnk_b6bf996f…`; Telegram uses `lnk_07a13eb…`). One place to change it:
  shamrock-leads `dashboard/services/payment_links.py` / env overrides.

## ⚠️ Publishing caution
A merge to `main` that touches `src/**` auto-publishes Wix and pins UI version
2623 via `wix.config.json`, which can undo recent Editor saves. This branch
does **not** touch `wix.config.json`. Before merging, have the owner confirm
the pinned UI version (or save/publish the Editor first) so Editor work is not
rolled back.

## Secrets / config
| Where | Name | Value |
|---|---|---|
| Wix Secrets Manager | `WIX_WEBHOOK_SECRET` | same value as the leads VPS env var |
| leads VPS `.env` | `WIX_WEBHOOK_SECRET` | shared secret (new, random, ≥32 chars) |
| leads VPS `.env` | `GAS_WEB_APP_URL`, `GAS_API_KEY` | already used by leads |
| leads VPS `.env` | `SLACK_WEBHOOK_INTAKE` (optional) | Slack incoming webhook for the intake channel; falls back to `SLACK_WEBHOOK_LEADS` |
| GAS Script Properties | `INTAKE_LEDGER_SHEET_ID` (optional) | spreadsheet for the ledger; defaults to `CONFIG.SHEET_ID` |
