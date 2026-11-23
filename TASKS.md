# 📋 Project Tasks

> **Mission:** Build the "Uber of Bail Bonds" — Simple. Secure. Everywhere.  
> **Last Updated:** 2026-11-23  
> **Authoritative Runtime Status:** [`STATUS.md`](./STATUS.md)

---

## 🔴 Active Production & Release Queue

Wix Studio is the live production surface (`uiVersion` 673, auto-deployed from `main` via `.github/workflows/wix-deploy.yml`). GAS is live at `@515` on the stable `/exec` URLs.

- [x] Clipboard vs brain boundary (no DocuSeal packet creation in Wix)
- [x] Signing launchpad + BlueBubbles 1-tap recovery (`signing-session-service.jsw`)
- [x] Staff case lightbox opens or texts a **staff-issued** DocuSeal session only
- [x] Staff prompt lightbox (iframe modal + `StaffPromptLightbox.js` + `<shamrock-staff-prompt>`)
- [x] GAS global scope deduplication across 190+ backend files (0 symbol collisions)
- [x] Wix Studio cutover (`uiVersion` 673), 67 county pages + quick facts SSR (`#text67`) + `#smsBondsmanBtn` (`sms:+12399550178`) + WCAG AA contrast & mobile dark-canvas sweep
- [x] Portal session hardening: role-scoped session binding, cosigner self-invite, live case status & Pay now, `commPrefs` save-overlap lock (PRs #106–#119)
- [x] GAS `@515` hardening: `TheCloser` dryRun + `/portal-landing` resume links, review candidate DNC/FTA/dedup guards, VM test suite in CI
- [ ] **Held PR #114 (`fix/netlify-communication-preferences-embed`)**: complete Codex review on `callOptIn` / Yes-No embed + manual `clasp deploy -i` GAS redeploy by Brendan
- [ ] **Held PR #122 (`seo/indexing-sitemap-first-appearance-2026-11-19`)**: complete Codex review + Brendan sign-off on first-appearance county canonicals & `/_functions/sitemap` cleanup
- [ ] **Wix Studio Editor layout pass (`Communication Preferences` section `comp-mvqr11hv`)**: stack `#html1` (`comp-mvqrdvdj`) below `comp-mvqr11ju` and resize iframe height (~1120px desktop / ~1200px mobile)
- [ ] B3 write-bond → paperwork on a **real** BondCase
- [ ] B5 one staff-approved DocuSeal packet (OSI + Palmetto templates)
- [ ] C3 secret rotation (owner-deferred; not a formal blocker)

## ✅ Phase 8.5: Wix Studio Cutover & Autopilot Clipboard (Live)

- [x] **Milestone A: Studio Visual System & Public IA** — SWFL regional dominance on Homepage & NAP, multi-state routing, `ServiceAreas` registry, breakpoint & contrast fixes live on Studio (`uiVersion` 673).
- [x] **Milestone B: Port Portals & Launchpads** — `portal-landing`, `portal-defendant`, `portal-indemnitor`, `SigningLightbox` live on Studio (`portal-staff` retired).
- [x] **Milestone C: `/portal-start` Autopilot Wizard** — Canonical Schema Mapper, Vision ID OCR, verbatim Case Facts Hydrator, Wizard Draft persistence, DocuSeal launchpad bridge live.
- [x] **Milestone D: Staff Kiosk / Lobby-Tablet (RETIRED)** — Centralized in `shamrock-leads` Auto-CRM (`docs/STAFF-PORTAL-RETIREMENT.md`).
- [ ] **Milestone E: `ServiceAreas` Multi-State CMS** — `EXPANSION_STATES` registry and schema complete; live multi-state CMS rollout gated on state activation.

---

## 🔄 Phase 8: Growth, Messaging & Revenue (Active Pipeline)

- [x] **BlueBubbles iMessage Engine** — Cloudflare Tunnel (`bb.shamrockbailbonds.biz`), text line **`+12399550178`**, owner-only web method permissions enforced.
- [ ] **"The Closer" Drip Campaigns**
  - [x] `TheCloser.js` dryRun support & `/portal-landing` resume links live (`@515`)
  - [ ] Wire Node-RED "The Closer" tab → live scheduled follow-ups
- [ ] **Review Harvester**
  - [x] GAS `handleGetReviewCandidates` / `handleLogReviewSent` DNC/FTA/dedup guards live (`@515`)
  - [ ] Wire live Node-RED / CRM campaign schedule
- [ ] **Wave 1 SmartCOP Blitz** (13 counties)
  - [ ] Clone DeSoto scraper → Bradford, Dixie, Escambia, Gadsden, Gilchrist, Glades, Hamilton, Levy, Putnam, Santa Rosa, Sumter, Suwannee, Taylor
- [ ] **Shannon Enhancements**
  - [ ] Multi-language support (Spanish priority — Collier/Lee demographics)
  - [ ] Paperwork launchpad link delivery via SMS during active calls (for staff-issued sessions)
  - [ ] Shannon call analytics dashboard