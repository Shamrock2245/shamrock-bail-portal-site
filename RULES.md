# 🚫 Agent Rules — Non-Negotiable

> **Last Updated:** 2026-08-21  
> These rules are **absolute**. No exceptions, no overrides.

---

## 1. The Website is the Clipboard; The Backend is the Brain
- Wix collects data, validates roles, captures ID scans, presents review fields, and launches signing sessions. It does NOT own underwriting, case matching, or legal packet issuance.
- Never put business logic or document creation inside page code.
- All underwriting authority, case reconciliation, surety selection, and DocuSeal packet issuance remain staff-gated inside Super CRM (`shamrock-leads`) and GAS backend.

## 2. No DocuSeal Packet Issuance from Wix
- Wix pages, lightboxes, and client-side scripts are strictly forbidden from creating DocuSeal submissions or requesting signing links from the provider.
- Wix opens `SigningLightbox` as a secure launchpad. When a staff-issued session exists, it renders the signer form. Otherwise, it presents client intake and review.

## 3. No SignNow Revival
- SignNow is permanently retired (Live @464). Direct routes, factory senders, and legacy webhook handlers must remain disabled.
- Historical fields (`signNowDocumentId`, `signNowIndemnitorLink`) remain read-only historical compatibility data.

## 4. Role-Scoped ID Hydration & Canonical Schema
- ID scanning must hydrate strictly into the selected role’s field group (`Def*` or `Ind*`).
- Cosigner / Indemnitor ID scans must NEVER overwrite the defendant’s identity fields.
- Frontend forms must map to canonical Person and Case objects (`canonical-paperwork-mapper.js`) so UI is never hardcoded to one surety’s 14-page PDF boxes.

## 5. Growth Ladder IA Law (Local → State → Multi-State)
- **Local/Regional Dominance First**: Homepage, NAP, and hero are SWFL / Fort Myers / Cape Coral first (1528 Broadway, Fort Myers, FL 33901 · 239-332-2245). Primary counties: Lee, Collier, Charlotte, Hendry, Glades.
- **Never flatten the homepage** into a generic national brochure.
- **Statewide Florida**: All 67 counties supported via programmatic dynamic pages (`/florida-bail-bonds/:slug`).
- **11+ State Expansion**: Multi-state directories live under `/bail-bonds/:state/:county`. Add states to navigation only when `ServiceAreas.status = live`.

## 6. Ecosystem non-negotiable — Keep GAS `/exec` URL Stable
- Push code and re-deploy the **existing** deployment only (`clasp deploy -i <ID>` from `.gas-config.json`).
- **Never** create a new Web App deployment that changes the URL without an explicit human order.

## 7. Secrets are Sacred
- API Keys live in **Wix Secrets Manager** and **GAS Script Properties**. Never in frontend code.
- Never hardcode API keys, Sheet IDs, or webhook URLs in `.js` or `.jsw` files.
- Never commit `.env` files or service account JSON.

## 8. Mobile & Tablet First — Always
- 90% of clients are on phones in a crisis.
- Touch targets must be ≥44px.
- Input fields must be ≥16px font-size (prevents iOS auto-zoom).
- Never display "Loading..." text — always use spinners or skeleton loaders.
- Primary CTA must be sticky on mobile viewports.

## 9. Premium Aesthetics are Mandatory
- If it looks cheap, it is considered broken. Fix it immediately.
- Use glassmorphism, micro-animations, dark modes with vibrant accents, and modern typography (Outfit, Inter).

## 10. 10DLC & Communication Compliance
- All SMS/WhatsApp messaging must be 10DLC compliant. No spam.
- Client communication preferences (`CommPrefsManager.js`) must be checked before outbound messages.
- Outbound messages must include opt-out instructions (`Reply STOP`). AI agents must never provide legal advice.

## 11. Idempotent Writes
- All data writes (scraper, intake, webhooks) must check for duplicates before inserting.
- Dedup key for arrest records is always `Booking_Number + County`.

## 12. Wix Velo & Studio Runtime Constraints
- Never import `public/*` or `backend/*` files into `masterPage.js` — it crashes the strict-mode runtime.
- Wix routers return 404 on bare prefix URLs; ensure fallback redirection.
- ESM only: Use named imports for Node.js built-ins.

## 13. Documentation is Living
- If code changes, update affected documentation in the same commit.
- Authoritative runtime truth lives in `STATUS.md` and `docs/CURRENT_PAPERWORK_ARCHITECTURE.md`.
- User intent lives in `USER.md` and `RULES.md`.

## 14. Finish the Factory
- Don't redesign what works. Connect existing pipes to new outputs.
- Every new feature should leverage existing GAS endpoints and Super CRM services.
