# Technical Roadmap & Milestones

This document records the overarching trajectory of Shamrock's digital infrastructure. It is the tactical blueprint for our mission: **"The Uber of Bail Bonds" - Fast. Frictionless. Everywhere.**

## The "Everywhere" Omni-Channel Experience
We have engineered **FIVE distinct ways** to secure a bond, ensuring maximum coverage and zero friction for any demographic, 24/7.
Regardless of how the client interacts, the backend factory seamlessly processes the intake.

1. **The Traditional Route (In-Person)**: Clients can walk into our flagship office at **1528 Broadway, Ft. Myers, FL 33901** for traditional, high-touch, face-to-face service.
2. **The Default Web Portal**: Users navigate to `shamrockbailbonds.biz`, verify their identity via magic link, fill out a straightforward mobile-first application, and sign all documentation via SignNow from their phone.
3. **Telegram Conversational AI**: Clients message `@ShamrockBail_bot` on Telegram, have a natural text conversation to provide their details, and receive their finalized paperwork automatically via SignNow.
4. **Telegram Mini-App**: From within the Telegram bot, clients can tap "Portal" to launch a lightning-fast, 7-screen mini-app to blast through the intake forms without ever leaving the chat interface.
5. **Shannon (24/7 Voice AI)**: Clients calling in after-hours (or anytime) speak to our advanced AI agent over the phone. Shannon completes their paperwork dynamically *during the active conversation*, dispatching texts and emails with the required SignNow links before they even hang up.

**We have a frictionless path to bail for EVERYONE, everywhere.**

## Phase 1: Foundation (COMPLETED)
- Wix Velo to Google Apps Script integration.
- SignNow PDF generation mapping.
- Core 34-Column Schema defined (`IntakeQueue`).

## Phase 2: AI Workforce Deployment & Omni-Channel Scaling (COMPLETED)
- **"Shannon"**: Live. Handling inbound phone calls via ElevenLabs. Live call transfer to 3 numbers.
- **Telegram Ecosystem**: `@ShamrockBail_bot` active. 7 Mini Apps live on Netlify. 17 serverless functions + 3 edge functions.
- **"The Concierge"**: AI chat across web, Telegram, and voice channels.
- **"The Closer"**: Drip campaigns via SMS/WhatsApp for abandoned intakes (`TheCloser.js`).
- **Communication Preferences**: `CommPrefsManager.js` — client opt-in/out respected across all channels.

## Phase 3: Geographic Expansion ("The Scout") (COMPLETED)
- **19 active county scrapers** across Florida — Brevard, Charlotte, Collier, DeSoto, Hendry, Highlands, Hillsborough, Indian River, Lake, Lee, Manatee, Martin, Orange, Osceola, Palm Beach, Pinellas, Polk, Sarasota, Seminole.
- 15 GitHub Actions workflows automating scheduled scraper runs.
- Data pipeline: Google Sheets + MongoDB Atlas + Slack alerts per county.
- Lead scoring system (`LeadScoringSystem.js`) with automated prioritization.
- **Goal**: 67 counties (Wave 1 SmartCOP expansion next — 13 easy clones).

## Phase 4: Full Automation (The "Zero-Touch" Bond) (IN PROGRESS)
- Risk Assessment algorithms built into "The Analyst" (`AI_FlightRisk.js`).
- Automated TLO/IRB background checks triggered via API for "The Investigator" (`AI_Investigator.js`).
- MongoDB logging for all business events via `MongoLogger.gs` (intakes, payments, signing, court dates).

## Phase 5: Infrastructure & Operations (COMPLETED)
- **Node-RED**: 8-page operations dashboard with premium glassmorphism UI. 51+ scheduled automations, 14 inbound webhook endpoints. Running at `localhost:1880` via Docker.
- **Hetzner Cloud**: VPS hosting for Dockerized scraper fleet (`cpx21` servers, Ubuntu 24.04).
- **MongoDB Atlas**: Centralized arrest data for analytics and cross-county deduplication.
- **GitHub Actions Self-Hosted Runners**: Hetzner-based runner for scraper CI/CD.
- **Netlify Edge Functions**: Shannon voice init webhook proxy, county geolocation, Twilio voice routing.

## The "Wow" Factor
- Refactoring the entire UI to feature Micro-animations, premium fonts, and Glassmorphism.
- The standard for design is the `ui-ux-pro-max` skill. Minimum Viable Products are banned. Everything we deploy must feel incredibly premium and untraditional for this industry.

---
*Last Updated: March 15, 2026*
