# ⚖️ Rules & Prime Directives

> **Last Updated:** April 7, 2026

These are the unalterable laws governing the digital operations of Shamrock Bail Bonds. Any code changes, system designs, or automation deployments MUST adhere to these directives.

---

## The Laws

1. **Wix is the Clipboard**: It collects data and passes it back. It does NOT own the heavy lifting.
2. **GAS is the Factory**: All PDF generation, webhook processing, heavy logic, and long-polling happens in Google Apps Script. Single entry point: `Code.js`.
3. **Secrets are Sacred**: API Keys live in **Wix Secrets Manager** or GAS **Script Properties**. Never in frontend code. Never printed in logs.
4. **10DLC Compliance**: All SMS/WhatsApp messaging must be compliant. No spam. Explicit opt-in required (Path B consent). Communication preferences checked via `CommPrefsManager.js`.
5. **Finish the Factory**: Don't redesign what works. Connect existing pipes to new outputs rather than inventing a new framework.
6. **Node-RED is Ops**: Scheduling, monitoring, and data relay — not business logic.
7. **Idempotent Writes**: All data writes (scraper, intake, webhooks) check for duplicates before inserting. `Booking_Number` + `County` is the dedup key.

---

## Defensive Coding & Security

1. **Idempotency is Required**: Every webhook or form submission must be safe to process twice. Case Files/Magic Links verify `Booking_Number` + `County` or `Case_ID` before insertion.
2. **Wrappers Only**: In Wix frontend, always use `safeGetValue()` and `safeOnClick()`. Avoid raw `$w()` manipulations to prevent UI crashes if an element ID changes.
3. **Ghost ID Check**: Verify Wix Element IDs against `docs/ELEMENT-ID-CHEATSHEET.md` before writing logic.
4. **Redact PII in Logs**: Emails and phone numbers must be redacted in operational logs.
5. **Never Hardcode API Keys**: Use `env.get()`, Wix Secrets Manager, or GAS Script Properties.
6. **Webhook Auth**: Verify the origin of Webhook calls matching expected headers or IPs. For Twilio or Telegram, validate signatures. HMAC verification on all Node-RED inbound endpoints.
7. **ESM Named Imports Only (Wix Backend)**: Wix Velo enforces strict ESM. **Never** use default imports from Node.js built-ins (`import crypto from 'crypto'` → ❌ ReferenceError at runtime). Always use named imports: `import { createHmac, createHash, randomBytes } from 'crypto'`. This applies to ALL backend `.js`/`.jsw` files. Violation causes a build-blocking `ReferenceError` even if the IDE shows no error.
8. **Rotate `WIX_CLI_API_KEY` When Expired**: The Wix CLI API key stored in GitHub Secrets (`WIX_CLI_API_KEY`) can expire silently. Symptom: `FailedToGetMyAccount: 404 entity not found` in GitHub Actions. Fix: regenerate at `manage.wix.com/account/api-keys` and update the secret. See `SECRETS_ROTATION_GUIDE.md`.

---

## Schema Governance

- The `IntakeQueue` schema and GAS payload schemas are **legally binding** and tied to PDF documents.
- Do not randomly rename JSON payload keys. Any schema changes must map correctly to the SignNow template coordinates.
- Element IDs are **API contracts**. Case-sensitive, never renamed after deployment, never auto-generated, never reused across contexts.

---

## Build Discipline

1. **If it looks cheap, it's broken**: Premium aesthetics at all times. Use animations, glassmorphism, loading spinners.
2. **No "Loading..." text**: Always use spinners or skeleton loaders. The word "Loading..." on screen is banned.
3. **Mobile First**: 90% of clients are on phones in a crisis. Touch targets >44px. Input fields ≥16px to prevent iOS auto-zoom.
4. **Dead Simple**: "One thumb, one eye." The user should never have to think.
5. **No MVPs**: Everything deployed must feel incredibly premium and untraditional for this industry.

---

## Protected Systems

The following systems are outside agent authority without explicit instruction:
- SignNow documents, flows, URLs, tokens (modify only through approved interfaces)
- Google Sheets used by ops (only via GAS API)
- External APIs not explicitly wrapped in backend modules

After SignNow handoff, **Wix is no longer authoritative**. No additional data capture, retries, previews, or interception is permitted.

---

## Frontend / Backend Separation

### Backend (.jsw) Responsibilities
- Geolocation resolution, county detection, phone routing
- Call logging, analytics logging, county page generation
- Business rules, API calls, PDF generation

### Frontend Responsibilities
- UI rendering, event triggering, form validation
- Invoking backend methods

**Frontend code MUST NOT:** infer county logic, decide routing, access secrets, or bypass backend validation.
