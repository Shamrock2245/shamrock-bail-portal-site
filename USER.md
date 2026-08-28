# 👤 User Context & Preferences

> **Last Updated:** 2026-08-21

---

## Who You're Working With

You are pair-programming with **Brendan**, the architect and sole operator behind Shamrock Bail Bonds' digital transformation. He has built an enterprise-grade tech ecosystem from the ground up, treating AI agents as digital employees with specific roles and KPIs.

**HQ / NAP:** Shamrock Bail Bonds, 1528 Broadway, Fort Myers, FL 33901 · (239) 332-2245 · admin@shamrockbailbonds.biz  
**Brand Line:** *“The Uber of Bail Bonds — Fast. Frictionless. Everywhere.”*  
**Doctrine:** *The website is the clipboard. The backend is the brain.*

---

## Objectives & Non-Negotiables

- Build the **most modern, tech-savvy bail bond agency in the country**.
- **Wix is the Clipboard**: Wix collects, hydrates, presents, and launches signing. All case matching, underwriting authority, and DocuSeal packet issuance remain staff-gated in Super CRM (`shamrock-leads`) and GAS backend. Never let an agent or Wix page issue DocuSeal packets directly.
- **Growth Ladder (IA Law)**:
  1. **Local/Regional Dominance First**: Lee, Collier, Charlotte, Hendry, Glades. Homepage, NAP, and hero are SWFL / Fort Myers / Cape Coral first. Never flatten the SWFL homepage into a generic national brochure.
  2. **Statewide Florida**: All 67 counties via dynamic programmatic county pages (`/florida-bail-bonds/:slug`) + First Appearance calendars.
  3. **11+ State Expansion**: Decoupled multi-state directory (`/bail-bonds/:state/:county`) integrated with `shamrock-leads` multi-state ops. Add states only when `ServiceAreas.status = live`.
- **Two logins — do not mix**:
  1. **Bond clipboard (day to day):** custom magic-link / OTP in `portal-auth.jsw`. Roles live on `PortalSessions` / `PortalUsers`. New users **default to indemnitor** unless they are staff/admin or match a defendant case. **Not** Wix Members Area. Do not put role, case ID, or DL on Wix Member profile fields.
  2. **Bail School (students):** `school.shamrockbailbonds.biz` — Netlify LMS, email magic link, cookie `shamrock_auth_session`. **Not** Wix Members profile fields. Factory is school GAS + Sheets.
  3. **Wix Members Area** on `shamrockbailbonds.biz` is leftover (header “My Account”, old `/portal` hub, `custom-embeds/members/*`). First Name / Last Name / Phone / Birthdate is enough. Do not add indemnitor fields there.
- **Client Paperwork North Star (Mobile/Tablet First)**:
  1. Login via passwordless phone OTP / Magic Link (`portal-auth.jsw`).
  2. Role selection: Defendant | Primary Indemnitor | Co-Indemnitor.
  3. ID Camera Scan: Cloud Vision OCR hydrates role-correct fields (Name, DOB, Address, DL#). Cosigner ID must never overwrite defendant identity.
  4. Auto-hydrate known case facts: Charges, bond amount, case #, court date, jail — populated from booking match / staff, never guessed by client.
  5. Collect only missing delta fields: Employment, household, references.
  6. Canonical Person+Case Object: Abstracts surety carrier formats (OSI, Accredited, Bankers). UI never binds to one company’s PDF boxes.
  7. Plain-language preview & 1-tap finger/stylus signing (no 14-PDF scavenger hunt).
  8. Staff-gated issuance: Wix remains the launchpad; staff issues final DocuSeal packets in Super CRM after verification.

---

## Current Priorities (August 2026)

### 🔴 Immediate (#1 Focus)
1. **Phase 8.5: Wix Studio Translation + Autopilot Paperwork Clipboard**:
   - Translate live Wix Editor site (`shamrockbailbonds.biz`) into clean, responsive Wix Studio implementation.
   - Deploy `/portal-start` mobile/tablet wizard: Role → ID scan → Hydrate → Delta fields → Preview → Launchpad.
   - Staff lobby-tablet handoff for instant in-person / remote intake.
   - Multi-state `ServiceAreas` CMS registry without diluting SWFL homepage dominance.

### 🟡 Growth & Revenue (Active Pipeline)
2. **WhatsApp Business Integration**: Wire Twilio WhatsApp Sandbox → Node-RED relay (blocked on 10DLC).
3. **"The Closer" Drip Campaigns**: Automated SMS/WhatsApp follow-ups for abandoned intakes.
4. **County Scraper Blitz**: Expand scraping coverage across Florida and target expansion states.

### 🟢 Completed Milestones
- ~~DocuSeal Signing Migration & SignNow Retirement~~ ✅ Live @464 (Historical records read-only)
- ~~Bail School Pricing Alignment~~ ✅ $199 20hr / $649 120hr (+ $49 simulator)
- ~~MongoDB Atlas Business Event Logging~~ ✅ `MongoLogger.gs` + `mongo_writer.py`
- ~~Communication Preferences~~ ✅ `CommPrefsManager.js` across all channels

---

## UI/UX Preferences

- Everything must look **Premium, High-Tech, and Trusted**. If it looks cheap, it is considered broken.
- **Mobile & Tablet First**: 90% of clients are on phones in a crisis. Touch targets ≥44px. Input fields ≥16px to prevent iOS auto-zoom.
- **Banned**: The word "Loading..." on screen. Always use spinners or skeleton loaders.
- **Design System**: Use modern CSS tokens, glassmorphism, subtle micro-animations, Outfit/Inter typography.

---

## Working Style

- **Direct, no fluff.** Solutions and clean code first.
- **Cross-Repo Awareness**: Wix (`shamrock-bail-portal-site`) is the clipboard; Super CRM (`shamrock-leads`) is the brain; GAS is the factory; Node-RED is ops.
- **No MVPs.** Everything deployed must feel state-of-the-art.
- **Living Documentation**: Update documentation in the same commit as code changes.
