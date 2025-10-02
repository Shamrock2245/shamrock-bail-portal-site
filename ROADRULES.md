---

### ROADRULES.md
```markdown
# ROADRULES.md

## Purpose
This file translates repo rules into **plain English** for staff and non-technical users.  
Think of it as the "house rules" for the Shamrock Bail Bonds Portal.

---

## The Golden Rules
1. **Nothing leaves Wix or the API without being secure.**
   - Every form, payment, and signature must be protected.

2. **Everyone has a role.**
   - Defendants fill out applications, waivers, and check-ins.
   - Indemnitors fill out financials, collateral, and payments.
   - Staff monitor, resend links, and export packets.

3. **Audit trail = safety net.**
   - Every signature, payment, and check-in is logged with timestamp, IP, and device.

---

## Staff Rules
- Always use the Staff Console to start a case.
- Never email or text sensitive info manually.
- Export packets daily for backup.
- Resend magic links if clients get stuck.
- Call defendants immediately on missed check-ins.

---

## Developer Rules
- All code changes go through GitHub → PR → review.
- Follow STYLEGUIDE.md for naming, formatting, and API use.
- Always test locally and staging before production.

---

## AI Rules
- Manus and other AI agents must follow:
  - `API_SPEC.md` for endpoints
  - `SCHEMAS.md` for validation
  - `PDF_TEMPLATES.md` for placement
  - `SECURITY.md` for compliance
- All AI-generated code must be human-reviewed.

---

## Compliance Rules
- SSNs, card data, and PII are encrypted.
- No shortcuts: GPS check-ins require consent.
- Signed documents must always include audit metadata.
- Follow SECURITY.md checklist quarterly.

---

## How to Stay Out of Trouble
- When in doubt → check OPS.md or ask Brendan.
- If portal breaks → log an issue in GitHub.
- If it’s a legal issue → escalate immediately to the agent.

---

## Quick Reminders
- **Defendant Portal** = apply + waive + check-in.  
- **Indemnitor Portal** = finance + collateral + sign + pay.  
- **Staff Console** = create + track + resend + export.  
