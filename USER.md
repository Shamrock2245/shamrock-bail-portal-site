# 👤 User Context & Preferences

> **Last Updated:** March 16, 2026

---

## Who You're Working With

You are pair-programming with **Brendan**, the architect and sole operator behind Shamrock Bail Bonds' digital transformation. He has built an enterprise-grade tech ecosystem from the ground up, treating AI agents as digital employees with specific roles and KPIs.

---

## Objectives

- Build the **most modern, tech-savvy bail bond agency in the country** — "The Uber of Bail Bonds."
- Eliminate **ALL friction** from the arrest-to-bail pipeline.
- Empower **"The Team"** (9 AI digital employees) to handle operations so the human team focuses on high-value closing.
- Achieve **statewide Florida coverage** (67 counties) through automated jail roster scraping.
- Maintain a **zero-touch bond pipeline** where a client can go from arrest to signed bond without human intervention.

---

## Current Priorities (March 2026)

### 🔴 Immediate
1. **MongoDB Atlas Integration**: All business events logging via `MongoLogger.gs`. Arrest data mirrored from Sheets to MongoDB via `mongo_writer.py`.
2. **Communication Preferences**: Client opt-in/out respected across all channels — `CommPrefsManager.js` checks before SMS, WhatsApp, and Telegram outreach.
3. **Hetzner Self-Hosted Runners**: GitHub Actions runners on Hetzner VPS for reliable scraper CI/CD.

### 🟡 Growth Engines
4. **WhatsApp Business Integration**: 98% open rates. Wire Twilio WhatsApp Sandbox → Node-RED relay.
5. **"The Closer" Drip Campaigns**: Automated SMS/WhatsApp follow-up sequences from `TheCloser.js` to convert abandoned intakes.
6. **Wave 1 SmartCOP Blitz**: Clone DeSoto scraper to 13 new counties (~30 min each) for 40% FL coverage.

### 🟢 Enhancements
7. **Shannon Enhancements**: Multi-language (Spanish), Telegram signing link delivery, call analytics dashboard.
8. **Bail School Landing Page**: High-converting `/bail-school` with video + auto-certificate generation.

---

## Communication Style

- **Direct, no fluff.** Brendan wants code and solutions, not lengthy explanations.
- **Proactive.** If you see a bug or gap while working, fix it. Don't just report — resolve.
- **Sync everything.** If code changes, push to GitHub. If docs are stale, update them.
- **No MVPs.** Everything deployed must feel incredibly premium and untraditional for this industry.

---

## UI/UX Preferences

- Everything must look **Premium, High-Tech, and Trusted**. If it looks cheap, it is considered broken.
- **Mobile First**: 90% of clients are on phones in a crisis. Touch targets >44px. Input fields ≥16px to prevent iOS auto-zoom.
- **Banned**: The word "Loading..." on screen. Always use spinners or skeleton loaders.
- **Glassmorphism, gradients, micro-animations** are encouraged. Dark modes with vibrant accents.
- **Performance matters**: High Lighthouse scores without sacrificing the "Wow" aesthetics.
- **Modern typography**: Google Fonts (Inter, Roboto, Outfit) — never browser defaults.

---

## Tooling Preferences

- **GAS deployment**: `clasp` via `/deploy_gas_versioned` workflow. Always include a version description.
- **Git sync**: `/git_smart_sync` workflow. Stash → pull → rebase → push.
- **Wix sync**: `/wix_safe_sync` workflow. Handle rebase errors and file naming issues.
- **Design system**: `/ui-ux-pro-max` skill. 50+ styles, 95+ color palettes, automated design generation.
- **Security audit**: Run `audit_security` skill before any production push.

---

## Working Style

- Brendan often works across **multiple repos simultaneously** (portal, Node-RED, scrapers) in a single session.
- He expects **cross-repo awareness** — if a change in GAS affects Node-RED, wire both sides.
- He prefers **comprehensive commits** over incremental ones — batch related changes together.
- **Documentation** should be living — update docs when the code changes, not as a separate task.
