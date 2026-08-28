# 🗺 Technical Roadmap & Milestones

> **"The Uber of Bail Bonds" — Fast. Frictionless. Everywhere.**  
> **Last Updated:** 2026-08-21 · Authoritative runtime truth: [`STATUS.md`](./STATUS.md)

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

## ⏸ Phase 8.5: Wix Studio visual canvas (deferred — Editor is production)

> **Production (2026-08-25):** Clipboard is live on the **Wix Editor** site and GAS **@468**. Studio visual canvas is **deferred** — do not treat it as the current production path. Backend clipboard services, canonical mapper, ID OCR, case hydrator, draft engine, ClipboardBridge, and permissions allowlist are wired and published.

| Milestone | Scope | Key Deliverables | Status |
|---|---|---|---|
| **A. Studio Visual System & Public IA** | Translation of live Wix Editor to modern Wix Studio | Full visual system, fluid responsive breakpoints, SWFL hero dominance, 67-county directory, killing stock templates | 🎨 Backend Wired / Canvas Next |
| **B. Portal & Launchpad Translation** | Port member dashboards & launchpads | `portal-landing`, `portal-defendant`, `portal-indemnitor`, `portal-staff`, `SigningLightbox` with DocuSeal boundary | 🔒 Backend Wired / Canvas Next |
| **C. `/portal-start` Autopilot Wizard** | Mobile/tablet intake wizard | Role → ID scan → OCR Hydrate → Delta fields → Plain preview → Signing shell | ⚡ Backend Wired / Canvas Next |
| **D. Staff Lobby-Tablet Handoff** | In-person tablet intake workflow | Instant QR/PIN tablet handoff for clients in office or jail lobby | 📱 Backend Wired / Canvas Next |
| **E. `ServiceAreas` Multi-State CMS** | Non-FL expansion directory | Multi-state routing (`/bail-bonds/:state/:county`) without altering FL homepage | 🗺️ Backend Wired / Canvas Next |

*Success Metric for C:* A panicked indemnitor on an iPhone can scan a FL Driver's License and reach a correct signature pad without retyping identity fields.

---

## 🔄 Active & Upcoming Phases

### Phase 8: Growth, Messaging & Revenue
| Item | Status | Key Files |
|------|--------|-----------|
| WhatsApp Business via Twilio | ⏳ Blocked (10DLC) | `twilio-client.jsw`, Node-RED WhatsApp relay |
| "The Closer" drip campaigns | 🔧 Wiring | `TheCloser.js`, Node-RED abandoned intake flows |
| Review Harvester (post-bond Google reviews) | 📋 Queued | `ReviewHarvester.js` (GAS) |
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

- **DocuSeal Signing Migration & SignNow Retirement (Live @464)**: Direct SignNow routes retired; DocuSeal staff-gated issuance established; historical fields remain read-only.
- **Bail School Pricing Alignment**: $199 20hr / $649 120hr (+ $49 simulator pass).
- **Foundation & Core Portals**: Monorepo migration, Magic Link auth, PII encryption, SOC II logging.
- **AI Digital Workforce (9 Agents)**: Concierge, Shannon (voice AI), Clerk, Analyst, Investigator, Closer, Manus Brain, Watchdog, Bounty Hunter.
- **Telegram Ecosystem**: `@ShamrockBail_bot`, 7 Netlify Mini-Apps, Cloud Vision DL OCR.
- **20-County Scraper Fleet**: Automated scraping across Florida, MongoDB Atlas event logging, Slack feeds.
- **Node-RED Ops Dashboard**: 21 flow tabs, 836 nodes, 64 crons, 10 dashboard pages.

---

*Maintained by Shamrock Engineering & AI Agents*
