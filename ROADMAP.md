# Technical Roadmap & Milestones

This document records the overarching trajectory of Shamrock's digital infrastructure. It is the tactical blueprint for our mission: **"The Uber of Bail Bonds" - Fast. Frictionless. Everywhere.**

## The "Everywhere" Omni-Channel Experience
We have engineered **FIVE distinct ways** to secure a bond, ensuring maximum coverage and zero friction for any demographic, 24/7.
Regardless of how the client interacts, the backend factory seamlessly processes the intake.

1. **The Traditional Route (In-Person)**: Clients can walk into our flagship office at **1528 Broadway, Ft. Myers, FL 33901** for traditional, high-touch, face-to-face service.
2. **The Default Web Portal**: Users navigate to `shamrockbailbonds.biz`, verify their identity via magic link, fill out a straightforward mobile-first application, and sign all documentation via SignNow from their phone.
3. **Telegram Conversational AI**: Clients message `@ShamrockBail_bot` on Telegram, have a natural text conversation to provide their details, and receive their finalized paperwork automatically via SignNow.
4. **Telegram Mini-App**: From within the Telegram bot, clients can tap "Portal" to launch a lightning-fast, 5-screen mini-app to blast through the intake forms without ever leaving the chat interface.
5. **Shannon (24/7 Voice AI)**: Clients calling in after-hours (or anytime) speak to our advanced AI agent over the phone. Shannon completes their paperwork dynamically *during the active conversation*, dispatching texts and emails with the required SignNow links before they even hang up.

**We have a frictionless path to bail for EVERYONE, everywhere.**

## Phase 1: Foundation (COMPLETED)
- Wix Velo to Google Apps Script integration.
- SignNow PDF generation mapping.
- Core 34-Column Schema defined (`IntakeQueue`).

## Phase 2: AI Workforce Deployment & Omni-Channel Scaling (IN PROGRESS)
- **"Shannon"**: Live. Handling inbound phone calls via ElevenLabs. Context persisted cross-session using Mem0.
- **Telegram Ecosystem**: `@ShamrockBail_bot` active. Expanding the Mini-App flow vs standard text conversational flows.
- **"The Concierge"**: Developing WhatsApp and Web Chat integration for immediate lead capture across standard messaging apps.
- **"The Closer"**: Drip campaigns via SMS/WhatsApp for abandoned intakes.

## Phase 3: Geographic Expansion ("The Scout")
- Implement heavy, localized county web scrapers to parse jail rosters automatically.
- Target Counties: Charlotte (Completed), Lee (Completed), DeSoto (Completed), Sarasota, Collier.
- Automate complete case-file creation dynamically upon parsing a new arrest matching our risk profile.

## Phase 4: Full Automation (The "Zero-Touch" Bond)
- Risk Assessment algorithms built into "The Analyst."
- Automated TLO/IRB background checks triggered via API for "The Investigator."

## The "Wow" Factor
- Refactoring the entire UI to feature Micro-animations, premium fonts, and Glassmorphism.
- The standard for design is the `ui-ux-pro-max` skill. Minimum Viable Products are banned. Everything we deploy must feel incredibly premium and untraditional for this industry.
