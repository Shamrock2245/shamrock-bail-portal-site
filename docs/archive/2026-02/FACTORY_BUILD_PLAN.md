# Shamrock Bail Portal Factory Build Plan

Prepared for Antigravity review.

## 1) Scope & Goals
**Primary Objective:** Turn the current Wix Velo + GAS repo into a repeatable factory for multi-county / multi-brand deployments with minimal code changes, while preserving the legally binding intake and signing workflows.

**Non‑negotiables (from canonical spec):**
- Wix is the clipboard; GAS is the brain.
- CMS schemas are contracts (no drift, especially IntakeQueue).
- No secrets in frontend code; use Wix Secrets Manager + GAS Script Properties only.

## 2) Current Architecture Snapshot (1‑page summary)
**Frontend (Wix Velo):**
- Public site + portal UI
- Client-side event triggers

**Backend (Wix .jsw):**
- Intake submission → IntakeQueue
- Magic links + custom sessions
- SignNow handoff via GAS
- Document uploads → Wix Media → GAS Drive sync
- Payments via SwipeSimple (Dashboard-driven payment links)
- Routing + geocoding + notifications

**Backend (GAS):**
- PDF generation + SignNow workflows
- Google Sheets sync + Drive storage
- Webhooks (SOC2 handler)

## 3) Factory Plan (Phased)

### Phase 0 — Safety & Compliance (Immediate)
1) **Remove secrets from repo** and rotate exposed credentials.
2) **Harden webhook verification** (SignNow + Twilio). Require signature checks on all webhook ingress.
3) **Centralize PII redaction** for logs (email/phone masking in all logs).

**Deliverable:** “Secure Baseline” PR

---

### Phase 1 — Configuration System (Tenantized Factory Core)
**Goal:** One codebase, many brands/counties.

**Workstreams:**
1) **Tenant config model** (JSON or CMS collection)
   - `brand.domain`, `brand.name`, `brand.phone`
   - `signnow.templateId`, `drive.folderId`
   - `slack.channels`, `gas.webAppUrl`
   - `featureFlags` (payments, ai concierge, bail school)

2) **Config loader** (Wix backend)
   - `src/backend/config.jsw` reads tenant config + Secrets Manager
   - Replace hardcoded URLs, phone numbers, staff accounts, and webhook endpoints

3) **Routing rules** (county/brand aware)
   - Move `phone-registry.json` into tenant config
   - Per‑county overrides

**Deliverable:** “Tenant Config Framework” PR

---

### Phase 2 — Reliability & Observability
**Goal:** No silent failures; guaranteed visibility.

**Workstreams:**
1) **Correlation IDs** for cross-system requests
2) **Structured logs** (eventName, tenantId, caseId)
3) **Retry queue** for failed GAS/Drive syncs

**Deliverable:** “Ops Reliability” PR

---

### Phase 3 — Factory Operations Playbooks
**Goal:** Launch new county/brand in < 1 day.

**Workstreams:**
1) **Deployment checklist** (Wix Secrets, GAS props, SignNow config)
2) **Bootstrap scripts** (safe, no secrets)
3) **Smoke tests** (webhooks + intake + signing)

**Deliverable:** “Launch Toolkit” PR

---

## 4) P0 / P1 Risks to Address
**P0**
- Secrets currently committed in GAS config scripts.
- Webhook verification not enforced everywhere.

**P1**
- Hardcoded domains, staff accounts, and phone numbers.
- Fallback GAS URL risks cross‑tenant leakage.

## 5) Recommended Outcomes
**In 1 day:**
- Remove secrets from repo & rotate keys.
- Gate postinstall `wix sync-types` behind env flag.

**In 1 week:**
- Tenant config loader + hardcoded removal.
- Enforced webhook signatures.

**In 30 days:**
- Full factory-ready deployment (multi‑tenant) + smoke tests + retry queues.

## 6) Decision Requests for Antigravity
1) **Tenant config location**: JSON in repo vs Wix CMS collection?
2) **Auth policy**: keep hardcoded staff list or move to config?
3) **Environment strategy**: single repo + config or separate repos per brand?
4) **Webhook routing**: Wix‑native vs all via GAS SOC2 handler?

---

Prepared by ShamrockAI.