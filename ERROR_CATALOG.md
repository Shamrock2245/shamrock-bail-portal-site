# 🚨 Error Catalog

> **Last Updated:** April 16, 2026

Known error patterns and their fixes. Check here first before debugging.

---

## Wix Velo Runtime

### ERR-001: `public/*` Import Crash
**Symptoms:** Page goes blank, no console errors, Wix Velo strict-mode crash.
**Cause:** Importing a `public/*.js` file into `masterPage.js` or page code.
**Fix:** Never import public files. Inline the logic directly or use `backend/*.jsw`.
**Files:** `masterPage.js`

### ERR-002: iOS Auto-Zoom on Input
**Symptoms:** Page zooms in when tapping a text input on iPhone.
**Cause:** Input `font-size` is less than 16px.
**Fix:** Ensure all `<input>` and `<textarea>` elements use `font-size: 16px` minimum.

### ERR-003: Router 404 on Bare Prefix
**Symptoms:** `/florida-bail-bonds/` returns 404 even though the router exists.
**Cause:** Wix routers require at least one slug segment after the prefix.
**Fix:** Link to specific slugs (`/florida-bail-bonds/lee-county`) or use homepage anchors (`/#counties`).
**Files:** `bail-bonds-router.js`

### ERR-004: ESM Import Crash in .jsw
**Symptoms:** Backend function throws `Cannot use import statement outside a module`.
**Cause:** Using CommonJS `require()` or default import for Node built-ins in `.jsw` files.
**Fix:** Use named ESM imports: `import { createHmac } from 'crypto'`.

---

## GAS Backend

### ERR-010: 302 Redirect on doPost
**Symptoms:** External service (ElevenLabs, Node-RED) gets HTML response instead of JSON.
**Cause:** GAS Web App returns 302 redirect before the JSON payload.
**Fix:** Use Netlify Edge Function as proxy to follow the redirect chain. See `elevenlabs-init.js`.

### ERR-011: Script Properties Missing
**Symptoms:** `TypeError: Cannot read properties of null` in GAS.
**Cause:** A required Script Property (API key, Sheet ID) is not set.
**Fix:** Check `PropertiesService.getScriptProperties().getProperty('KEY_NAME')`. Re-set via GAS Script Editor → Project Settings → Script Properties.

### ERR-012: SignNow Webhook Duplicate Fire
**Symptoms:** Case status updated twice, double Slack notifications.
**Cause:** SignNow fires `document.complete` multiple times (retries on timeout).
**Fix:** All webhook handlers must be idempotent. Check `if (status === 'completed') return;` before processing.

### ERR-013: Sheets API Quota Exceeded
**Symptoms:** `Error: Service invoked too many times in a short time`
**Cause:** Too many rapid reads/writes to Google Sheets (100 requests/100 seconds per user).
**Fix:** Batch writes using `Range.setValues()` instead of cell-by-cell. Add `Utilities.sleep(1000)` between batch operations.

---

## SignNow Integration

### ERR-020: Template Copy Fails
**Symptoms:** `SignNow_SendPaperwork.js` returns error on template copy.
**Cause:** Template ID changed (SignNow periodically rotates IDs) or API token expired.
**Fix:** Re-authenticate via `SignNow_Auth.js`. Verify template IDs in Script Properties match the actual SignNow dashboard.

### ERR-021: Embedded Signing Link Expired
**Symptoms:** Client clicks signing link → "Document not found" error.
**Cause:** SignNow embedded invite links expire after 45 minutes.
**Fix:** Generate a new invite link. Consider using the `freeform_invite` endpoint for longer-lived links.

---

## Telegram Bot

### ERR-030: Webhook Not Receiving Updates
**Symptoms:** Bot stops responding to messages.
**Cause:** Telegram webhook URL changed or SSL cert expired.
**Fix:** Re-register webhook: `SetupUtilities.js → setupTelegramProperties()`. Verify with `getWebhookInfo`.

### ERR-031: Inline Query Timeout
**Symptoms:** Inline quote bot shows "No results" or spins forever.
**Cause:** GAS response exceeds Telegram's 5-second timeout for inline queries.
**Fix:** Pre-compute premium values. Cache county data. Ensure GAS responds in <3 seconds.

---

## Shannon (Voice AI)

### ERR-040: ElevenLabs Webhook Fails
**Symptoms:** Shannon can't create intakes or send paperwork during calls.
**Cause:** Netlify Edge Function → GAS proxy chain broken. Usually GAS deployment URL changed.
**Fix:** Update `GAS_WEBHOOK_URL` in Netlify environment variables. Redeploy Edge Functions.

### ERR-041: High Latency During Calls
**Symptoms:** Shannon has long pauses (>5 seconds) after client speaks.
**Cause:** GAS cold start + webhook round-trip exceeding ElevenLabs timeout.
**Fix:** Keep GAS warm with Node-RED 5-minute health pings. Use latency masking ("Let me check that for you...").

---

## Node-RED

### ERR-050: GAS Bridge Returns HTML
**Symptoms:** Node-RED dashboard shows "undefined" or raw HTML in data fields.
**Cause:** GAS URL is stale (post-deployment URL changed).
**Fix:** Update `GAS_DISPATCH_URL` in Node-RED global environment variables. Restart flows.

### ERR-051: Cron Not Firing
**Symptoms:** Scheduled task doesn't execute.
**Cause:** Node-RED restarted and inject nodes lost their cron state.
**Fix:** Deploy all flows (Ctrl+Shift+D in Node-RED). Verify inject nodes have correct cron expressions.

---

## Scrapers

### ERR-060: Cloudflare Block
**Symptoms:** Scraper returns 403 or empty HTML.
**Cause:** County jail website updated Cloudflare rules.
**Fix:** Switch to DrissionPage (Python) stealth stack. Rotate user agents. Add random delays.

### ERR-061: Schema Mismatch
**Symptoms:** Records written to Sheets have shifted columns.
**Cause:** Scraper output doesn't match the Master 34 schema.
**Fix:** Validate against `config/schema.json` before writing. Check for missing `null` fields.

---

## Quick Reference

| Error Range | System |
|-------------|--------|
| ERR-001 — ERR-009 | Wix Velo Runtime |
| ERR-010 — ERR-019 | GAS Backend |
| ERR-020 — ERR-029 | SignNow |
| ERR-030 — ERR-039 | Telegram Bot |
| ERR-040 — ERR-049 | Shannon (Voice AI) |
| ERR-050 — ERR-059 | Node-RED |
| ERR-060 — ERR-069 | Scrapers |
