# Wix Editor re-paste — website wizards → CRM (2026-09-27, LOCAL branch `fix/wix-to-leads-intake`)

The two application wizards live in Wix Editor **HTML embed** elements. Their
HTML is NOT deployed by git/`wix publish`; it must be pasted by hand after the
page code (src/**) is live.

| File | Paste into | Page | Element ID the page code listens on |
|---|---|---|---|
| `defendant-wizard.embed.html` | HTML embed ("Embed code" → Code) | Defendant portal (`portal-defendant`) | `#defendantWizard` |
| `indemnitor-wizard.embed.html` | HTML embed | Indemnitor portal (`portal-indemnitor`) | `#indemnitorWizard` |

These files are byte-identical copies of `src/public/defendant-wizard.html` and
`src/public/indemnitor-wizard.html` on this branch.

## What changed in the embeds
- Submit no longer POSTs to GAS with `mode:'no-cors'` (that was rejected
  `UNAUTHORIZED` while the embed still showed success). The embed posts a
  message to the page, the page calls `backend/leadsIntake.jsw`, which posts
  server-side to the CRM `/api/webhooks/wix-intake`.
- Success is shown **only** when the page replies `{type:'shamrock-submit-ack', ok:true}`
  (i.e. the CRM returned `success:true`). Errors and a 30 s timeout show the
  retry/call message instead.
- Each submission carries a `clientNonce`, so a double tap or retry creates
  one intake, not two.
- The success screen shows a **Pay by card** button (link returned by the CRM:
  website link `lnk_b6bf996f…`, or the case's own invoice link) plus the intake
  reference number.
- Standalone mode (opening the HTML outside Wix) refuses to submit instead of
  faking success.

## Order of operations (owner approval needed for each)
1. Leads: deploy branch `fix/kiosk-and-wix-intake` to the Hetzner VPS; set
   `WIX_WEBHOOK_SECRET` in the VPS `.env`.
2. Wix Secrets Manager: create `WIX_WEBHOOK_SECRET` with the **same** value.
3. Merge this branch → Wix auto-publishes page code (see the wix.config.json
   warning in docs/WIX-TO-CRM-INTAKE.md).
4. In the Editor, paste the two embeds above into `#defendantWizard` /
   `#indemnitorWizard` and **Publish**.
5. Test once with a clearly-fake name ("TEST — DELETE"), confirm it appears in
   CRM → Intake Queue, the Sheets "Intake Ledger" tab and Slack; then archive it.
