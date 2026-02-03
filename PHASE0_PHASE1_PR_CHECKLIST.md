# Phase 0 + Phase 1 PR Checklist

Use this checklist when preparing the first two execution PRs for the factory plan.

---

## Phase 0 — Safety & Compliance (Immediate)

### ✅ Scope Confirmation
- [ ] IntakeQueue schema **unchanged** (no field renames, no schema drift).
- [ ] Wix remains clipboard; GAS remains brain.
- [ ] No secrets in repo or frontend code.

### ✅ Security & Secrets
- [ ] Remove committed secrets from repo (`backend-gas/SetProperties.js` + any other files).
- [ ] Rotate leaked secrets (SignNow, Twilio, GAS keys, Slack webhooks).
- [ ] Replace secrets with placeholders or safe bootstrap instructions only.
- [ ] Confirm Secrets Manager + GAS Script Properties are the only secret sources.

### ✅ Webhook Verification
- [ ] Enforce signature verification for **SignNow** webhooks.
- [ ] Enforce signature verification for **Twilio** webhooks.
- [ ] Block/deny webhooks when signature is missing or invalid.
- [ ] Document how to set webhook secrets in Wix + GAS.

### ✅ PII Handling
- [ ] Redact emails/phones in logs (masking helper or consistent pattern).
- [ ] Confirm no raw PII is logged in webhook payloads.

### ✅ Delivery
- [ ] Update docs to reflect new security posture.
- [ ] Provide a short “rotate secrets” runbook.

---

## Phase 1 — Tenantized Configuration System

### ✅ Scope Confirmation
- [ ] No schema changes to IntakeQueue or other canonical collections.
- [ ] Config system introduced without breaking existing production behavior.

### ✅ Tenant Config Model
- [ ] Define tenant config structure (JSON or CMS collection).
- [ ] Include: brand domain/name/phone, SignNow template IDs, Drive folder IDs,
      Slack channels, GAS URL, feature flags.

### ✅ Config Loader (Backend)
- [ ] Implement `config.jsw` (or equivalent) to load tenant config + secrets.
- [ ] Cache config safely (no secrets in frontend).

### ✅ Hardcoded Removal
- [ ] Replace hardcoded domain in portal auth.
- [ ] Replace hardcoded staff accounts with config-driven list.
- [ ] Replace hardcoded phone routing data with config-driven data.
- [ ] Replace hardcoded webhook callbacks and redirect URLs.

### ✅ Routing & County Logic
- [ ] County routing reads from tenant config.
- [ ] Default fallback behavior preserved.

### ✅ Docs + Ops
- [ ] Update documentation with tenant config instructions.
- [ ] Provide sample tenant config template.

---

## Review & Validation

### ✅ Manual Checks
- [ ] Confirm no secrets appear in git diff.
- [ ] Confirm webhook verification is actually enforced.
- [ ] Confirm tenant config loads without errors in production environment.
- [ ] Confirm logs remain PII-safe.

### ✅ Final PR Notes
- [ ] Include checklist results in PR description.
- [ ] State any known follow-ups explicitly.

---

Prepared for Antigravity execution.