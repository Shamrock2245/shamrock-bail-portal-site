# 🗺 Technical Roadmap & Milestones

> **"The Uber of Bail Bonds" — Simple. Secure. Everywhere.**  
> **Last Updated:** 2026-11-23 · Authoritative runtime truth: [`STATUS.md`](./STATUS.md)

---

## 🚀 Growth Ladder (Information Architecture Law)

1. **Local/Regional Dominance First**: Lee, Collier, Charlotte, Hendry, Glades. Homepage, NAP, and hero are SWFL / Fort Myers / Cape Coral first.
2. **Statewide Florida**: All 67 counties via dynamic programmatic county pages (`/florida-bail-bonds/:slug`) + First Appearance calendars.
3. **11+ State Expansion**: Decoupled multi-state directory (`/bail-bonds/:state/:county`) integrated with `shamrock-leads` multi-state ops. Add states only when `ServiceAreas.status = live`.

---

## 📱 Paperwork North Star (Mobile & Tablet First)

1. **Login**: Passwordless phone OTP / Magic Link (`portal-auth.jsw`).
2. **Role Picker**: Defendant | Primary Indemnitor | Co-Indemnitor.
3. **ID Camera Scan**: Cloud Vision OCR extracts & hydrates role-correct fields (Name, DOB, Address, DL#). Cosigner ID never overwrites defendant fields.
4. **Case Facts Auto-Hydration**: Charges, bail, case #, court date, jail — prefilled from Super CRM / arrest scrape when known.
5. **Delta Fields Only**: Collect only missing items (employment, references, household).
6. **Canonical Schema**: Maps one person/case model onto any surety packet (OSI, Accredited, Bankers). UI never binds to one company’s PDF layout.
7. **Lowest-Friction Signing**: One-tap plain-language review and finger/stylus signature.
8. **Staff-Gated Security Gate**: Wix remains the launchpad; staff reconciles intake and issues final DocuSeal packets in Super CRM.

---

## ✅ Phase 8.5: Wix Studio Cutover & Clipboard Architecture (Live)

> **Production (2026-11-23):** Public site and clipboard portals are live on **Wix Studio (`uiVersion` 673)** with GAS **@515**. Auto-publish runs via `.github/workflows/wix-deploy.yml`.

| Milestone | Scope | Key Deliverables | Status |
|---|---|---|---|
| **A. Studio Visual System & Public IA** | Wix Studio responsive system & 67-county + city/jail IA | Fluid responsive layout, SWFL hero dominance, quick-facts SSR, WCAG AA contrast, Service/FAQ JSON-LD | ✅ Live on Studio |
| **B. Portal & Launchpad Translation** | Member dashboards & launchpads | `portal-landing`, `portal-defendant`, `portal-indemnitor`, `SigningLightbox` with DocuSeal boundary, session-bound reads, cosigner self-invite | ✅ Live on Studio |
| **C. `/portal-start` Autopilot Wizard** | Mobile intake wizard | Role → ID scan → OCR Hydrate → Delta fields → Plain preview → Signing shell | ✅ Live on Studio |
| **D. `ServiceAreas` Multi-State CMS** | Non-FL expansion directory | Multi-state routing (`/bail-bonds/:state/:county`) without altering FL homepage | 🗺️ Backend Wired / Rollout Gated |

*Success Metric for C:* A panicked indemnitor on an iPhone can scan a FL Driver's License and reach a correct signature pad without retyping identity fields. (Note: Staff kiosk/lobby tablet retired; all staff intake is managed in shamrock-leads CRM).

---

## 🔄 Active & Upcoming Phases

### Phase 8: Growth, Messaging & Revenue
| Item | Status | Key Files |
|------|--------|-----------|
| Communication Preferences signed-link & `callOptIn` sync | ⏸ Held PR #114 | `src/backend/commPrefs.js`, `backend-gas/CommPrefsGate.js` (awaiting Codex + manual GAS deploy) |
| First-appearance county canonicals & custom sitemap cleanup | ⏸ Held PR #122 | `src/public/first-appearance-seo.js`, `src/backend/sitemap-builder.js` |
| WhatsApp Business via Twilio | ⏳ Blocked (10DLC) | `twilio-client.jsw`, Node-RED WhatsApp relay |
| "The Closer" drip campaigns | ✅ Hardened @515 / Wiring | `TheCloser.js` (`dryRun` + `/portal-landing` links), Node-RED abandoned intake flows |
| Review Harvester (post-bond Google reviews) | ✅ Guarded @515 / Wiring | `NodeRedHandlers.js` (`getReviewCandidates` DNC/FTA/dedup), `shamrock-leads` harvester |
| Wave 1 SmartCOP Blitz (13 counties) | 📋 Planned | Clone DeSoto → ~30 min/county |
| Shannon Spanish support | 📋 Planned | ElevenLabs agent config |
| Shannon call analytics dashboard | 📋 Planned | GAS + Node-RED |

### Phase 9: Scale & Optimization (Q3-Q4 2026)
| Item | Status | Details |
|------|--------|---------|
| Wave 2 — 19 DrissionPage counties | 📋 Planned | Standard DP build, 1-3 hrs/county |
| Wave 3 — 13 complex targets | 📋 Planned | CAPTCHAs, SPAs, heavy JS |
| MongoDB primary migration | 📋 Planned | Sheets → MongoDB (Sheets as backup) |
| ML-based lead scoring | 📋 Planned | Upgrade from rules-based to ML |
| Per-county health dashboard | 📋 Planned | Monitoring + alerting |
| Bail School landing page | 📋 Planned | Video + auto-certificate |

### Phase 10: Statewide Domination & Multi-State Expansion (2027)
| Item | Status | Details |
|------|--------|---------|
| Wave 4 — PDF counties | 📋 Future | `pdfplumber` parsing |
| Wave 5 — Manual investigation | 📋 Future | App-only, feasibility TBD |
| Court date prediction (ML) | 📋 Future | Historical data → prediction model |
| 11+ State Expansion Launch | 📋 Future | Full multi-state scraper & surety sync |

---

## ✅ Completed Milestones (Historical)

- **Wix Studio Live Cutover (`uiVersion` 673)**: Studio site published with 67-county + city/jail IA, quick-facts SSR rendering, AA contrast sweep, dynamic county sitemap, and verbatim charge hydrator.
- **Automated PR CI & Behavioral VM Test Suite**: 170+ Node tests + Velo syntax, JSON, brand-contact, SEO/LLM authority, and GAS VM behavioral suites.
- **GAS Hardening (`@515`)**: API key gates on all risk/Mini App/`caller_context` endpoints, Slack PII masking, `TheCloser` dry-run & `/portal-landing` resume URLs, review candidate DNC/FTA/dedup guards.
- **DocuSeal Signing Migration & SignNow Retirement (Live @464+)**: Direct SignNow routes retired; DocuSeal staff-gated issuance established; historical fields remain read-only.
- **Bail School Pricing Alignment**: $199 20hr / $649 120hr (+ $49 simulator pass).
- **Foundation & Core Portals**: Monorepo migration, Magic Link auth, PII encryption, SOC II logging.
- **AI Digital Workforce (9 Agents)**: Concierge, Shannon (voice AI), Clerk, Analyst, Investigator, Closer, Manus Brain, Watchdog, Bounty Hunter.
- **Telegram Ecosystem**: `@ShamrockBail_bot`, 7 Netlify Mini-Apps, Cloud Vision DL OCR.
- **20-County Scraper Fleet**: Automated scraping across Florida, MongoDB Atlas event logging, Slack feeds.
- **Node-RED Ops Dashboard**: 21 flow tabs, 836 nodes, 64 crons, 10 dashboard pages.

---

*Maintained by Shamrock Engineering & AI Agents*
