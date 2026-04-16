# 🚫 Agent Rules — Non-Negotiable

These rules are **absolute**. No exceptions, no overrides.

---

## 1. Wix is the Clipboard
- Wix collects data and passes it back. It does NOT own the heavy lifting.
- Never put business logic in page code — only UI logic and event handlers.
- All heavy processing (PDF gen, AI, signing) belongs in GAS.

## 2. GAS is the Factory
- All PDF generation, risk assessment, signing orchestration, and communication routing happens in Google Apps Script.
- Single entry point: `Code.js doPost()` / `doGet()` with action routing.
- Never create parallel entry points.

## 3. Secrets are Sacred
- API Keys live in **Wix Secrets Manager** and **GAS Script Properties**. Never in frontend code.
- Never hardcode API keys, Sheet IDs, or webhook URLs in `.js` or `.jsw` files.
- Never commit `.env` files or service account JSON.
- Rotation procedures: see `SECRETS_ROTATION_GUIDE.md`.

## 4. Never Break Production
- Never modify `masterPage.js` without testing global side effects.
- Never rename Wix element IDs without updating `docs/ELEMENT-ID-CHEATSHEET.md`.
- Never rename IntakeQueue fields without a full migration plan.
- Never delete a file without verifying no imports depend on it.
- Never push code that imports a module you haven't verified exists.

## 5. Schema Governance
- `docs/SCHEMAS.md` defines the canonical data schemas. It is the source of truth.
- Dedup key for arrest records is always `Booking_Number + County`.
- Never add, remove, or rename schema columns without updating all consumers.
- All SignNow documents must track `caseId` — it is the session key across all systems.

## 6. Mobile First — Always
- 90% of clients are on phones in a crisis.
- Touch targets must be ≥44px.
- Input fields must be ≥16px font-size (prevents iOS auto-zoom).
- Never display "Loading..." text — always use spinners or skeleton loaders.
- Primary CTA must be sticky on mobile viewports.

## 7. Premium Aesthetics are Mandatory
- If it looks cheap, it is considered broken. Fix it immediately.
- Use glassmorphism, micro-animations, dark modes with vibrant accents.
- Use modern typography (Google Fonts: Inter, Roboto, Outfit) — never browser defaults.
- Every deployed surface must feel incredibly premium and untraditional for this industry.

## 8. 10DLC & Communication Compliance
- All SMS/WhatsApp messaging must be 10DLC compliant. No spam.
- Client communication preferences (`CommPrefsManager.js`) must be checked before all outbound messages.
- Every outbound message must include opt-out instructions (`Reply STOP`).
- AI agents must never provide legal advice.

## 9. Idempotent Writes
- All data writes (scraper, intake, webhooks) must check for duplicates before inserting.
- Re-running a process should never create duplicate records.
- SignNow webhooks must be idempotent — `document.complete` may fire multiple times.

## 10. Wix Velo Runtime Constraints
- Never import `public/*` or `backend/*` files into `masterPage.js` — it crashes the strict-mode runtime.
- Wix routers (e.g., `/florida-bail-bonds/{slug}`) return 404 on bare prefix URLs.
- Footer overrides must be inlined in `masterPage.js` via `setupFooterDynamic()`.
- ESM only: Use named imports for Node.js built-ins (`import { createHmac } from 'crypto'`).
- Never use CommonJS default imports in `.jsw` files.

## 11. Node-RED is Ops — Not Logic
- Node-RED handles scheduling, monitoring, and data relay.
- Business logic belongs in GAS, not in Node-RED function nodes.
- The reusable "POST to GAS" subflow is the standard pattern for GAS calls.

## 12. Security Before Push
- Run `audit_security` skill before any production deployment.
- All webhook endpoints must use HMAC verification.
- PII must be redacted in logs (phone numbers, emails, addresses).
- RBAC enforced: defendants cannot see other defendants' data.

## 13. Documentation is Living
- If code changes, update the affected docs in the same commit.
- Stale docs are worse than no docs — they cause wrong decisions.
- Run `/self-improving-agent` at end of significant sessions.
- Never reference archived files from active documentation.

## 14. Finish the Factory
- Don't redesign what works. Connect existing pipes to new outputs.
- Every new feature should leverage existing GAS endpoints, not create parallel systems.
- Before building something new, check if a GAS endpoint, Node-RED flow, or skill already exists.
