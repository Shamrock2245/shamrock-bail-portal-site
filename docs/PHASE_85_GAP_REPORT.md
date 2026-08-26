# 📋 Phase 18.5 Omni-Repo Gap Audit & Wiring Report

> **Last Updated:** 2026-08-21  
> **Role:** `@gas-integrator` + Documentation Owner  
> **Repo:** `Shamrock2245/shamrock-bail-portal-site`  
> **Doctrine:** *The website is the clipboard. Super CRM / GAS is the brain.*

---

## 1. Executive Summary

Phase 18.5 establishes complete internal consistency across backend web methods, canonical schemas, permissions allowlists, and living documentation without modifying existing visual Editor pages or deploying a new GAS `/exec` URL.

All backend clipboard services are now wired, tested, and registered. Direct paperwork issuance in Wix is permanently disabled; DocuSeal is code-enforced as the sole signing provider under staff authority in Super CRM (`shamrock-leads`).

---

## 2. Core Surface Inventory & Gap Matrix

| Surface | Exists | Wired | Docs Mention | Status / Gap Closure Summary |
|---|---|---|---|---|
| **Canonical Mapper** | ✅ Yes (`canonical-paperwork-mapper.js`) | ✅ Yes | ✅ [`docs/SCHEMAS.md`](./SCHEMAS.md) | Maps single Person/Case model onto OSI & Palmetto packet dialects. UI never binds to raw PDF coordinates. |
| **Vision ID OCR** | ✅ Yes (`id-ocr-service.jsw`) | ✅ Yes | ✅ [`docs/API_SPEC.md`](./API_SPEC.md) | Role-scoped ID hydration. Strictly refuses to write to `defendant.*` when signer role is `indemnitor` or `coindemnitor`. |
| **Case Facts Hydrator** | ✅ Yes (`case-facts-hydrator.jsw`) | ✅ Yes | ✅ [`docs/API_SPEC.md`](./API_SPEC.md) | Auto-hydrates charges, bond amounts, and court dates from live scraper roster. Calculates statutory 10% or $100 min/charge. |
| **Wizard Draft Save** | ✅ Yes (`wizard-draft-service.jsw`) | ✅ Yes | ✅ [`docs/API_SPEC.md`](./API_SPEC.md) | Idempotent cross-device draft persistence extending `IntakeQueue` CMS without duplicating sources of truth. |
| **Sync to GAS Factory** | ✅ Yes (`canonical-sync-service.jsw`) | ✅ Yes | ✅ [`src/backend/README.md`](../src/backend/README.md) | Pushes completed canonical case to GAS Factory via Netlify Edge proxy. Defers packet issuance to Super CRM. |
| **Signing Session READ** | ✅ Yes (`signing-session-service.jsw`) | ✅ Yes | ✅ [`docs/CURRENT_PAPERWORK_ARCHITECTURE.md`](./CURRENT_PAPERWORK_ARCHITECTURE.md) | READ-only launchpad. Returns staff-issued DocuSeal session URL if present; otherwise `pending_review`. Zero DocuSeal creation in Wix. |
| **Lobby Tablet PIN/QR** | ✅ Yes (`lobby-tablet-service.jsw`) | ✅ Yes | ✅ [`docs/API_SPEC.md`](./API_SPEC.md) | 15-second walk-in intake, open scraper lead attachment, and staff kiosk handoff. Alerts Super CRM queue. |
| **ServiceAreas Expansion** | ✅ Yes (`service-areas.jsw`) | ✅ Yes | ✅ [`docs/SCHEMAS.md`](./SCHEMAS.md) | Multi-state registry. Strictly returns states where `status === 'live'`. Planned states return clean 404s. |
| **`/portal-start` Route** | ✅ Yes (`portal-start.js`) | ✅ Yes | ✅ [`docs/WIX_STUDIO_SITEMAP_AND_IA.md`](./WIX_STUDIO_SITEMAP_AND_IA.md) | Built in Velo code; visual Studio canvas elements to be assembled in Studio Editor. |
| **Permissions Allowlist** | ✅ Yes (`permissions.json`) | ✅ Yes | ✅ [`src/backend/README.md`](../src/backend/README.md) | Default-deny configured. Staff-only methods require `siteMember`/`siteOwner`. Retired modules locked to `false`. |
| **CMS Collections Schema** | ✅ Yes (`collectionIds.js` & schema) | ✅ Yes | ✅ [`docs/SCHEMAS.md`](./SCHEMAS.md) | `ServiceAreas` added; `IntakeQueue` updated with draft and DocuSeal session keys; SignNow keys replaced. |
| **BlueBubbles iMessage Line** | ✅ Yes (`bluebubbles.jsw`) | ✅ Yes | ✅ [`src/backend/README.md`](../src/backend/README.md) | iMessage via Super CRM `/api/imessage/wix/send` → Tailscale to office iMac on **`+12399550178`**. Never `bb.shamrockbailbonds.biz`. |

---

## 3. Retired & Hard-Locked Modules

| Legacy Module | Action Taken | Enforcement Mechanism |
|---|---|---|
| `packet-generator.jsw` | **RETIRED & HARD-LOCKED** | Returns fail-closed `DIRECT_PAPERWORK_DISABLED` error. All permissions set to `false`. |
| `signing-methods.jsw` | **RETIRED & HARD-LOCKED** | Returns `LEGACY_DIRECT_PAPERWORK_DISABLED`. Blocks legacy email, SMS, and kiosk direct creation. |
| `signnow_api_helper` skill | **RETIRED** | Marked as retired in frontmatter and header; redirects to `docuseal_paperwork_manager`. |
| `signnow_mcp_server` skill | **RETIRED** | Marked as retired in frontmatter and header; preserved for audit reference only. |

---

## 4. Studio Canvas Handoff

```text
========================================================================================
                          STUDIO CANVAS HANDOFF SPECIFICATION
========================================================================================
1. Pages to Build: /portal-start (Intake Wizard), /portal-defendant, /portal-indemnitor, /portal-staff.
2. Velo Modules to Bind: portal-start.js, portal-defendant.skg9y.js, portal-indemnitor.k53on.js, portal-staff.qs9dx.js.
3. IDs to Create: #step0RoleBox, #roleSelectDefendant, #roleSelectIndemnitor, #roleSelectCoIndemnitor.
4. IDs to Create: #step1CameraBox, #btnStartCamera, #uploadIdInput, #ocrConfidenceBadge.
5. IDs to Create: #step2ReviewBox, #step3CaseFactsBox, #step4DeltaBox, #step5PreviewBox.
6. IDs to Create: #btnNextStep, #btnPrevStep, #btnSaveDraft, #btnLaunchDocuSeal, #wizardStatusMessage.
7. Breakpoint Rules: Mobile (1-question screen, sticky call bar); Tablet (2-col layout, numeric pads).
8. Boundary: MUST NOT build packet generation or direct DocuSeal creation buttons in Wix.
9. Boundary: MUST NOT dump 11 expansion states onto the FL homepage or header navigation.
10. Boundary: MUST NOT revive SignNow in markup, links, or client code.
11. Phone Enforcement: Text/SMS CTA strictly routes to sms:+12399550178; Voice to tel:+12393322245.
12. Handoff Ready: Prompt 19 Device QA is queued once visual canvas elements are placed in Studio.
========================================================================================
```
