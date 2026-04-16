# 📖 Glossary

> **Last Updated:** April 16, 2026

| Term | Definition |
|------|-----------|
| **10DLC** | 10-Digit Long Code — registered phone number for business SMS. Required for Twilio compliance. |
| **ArrestRecord** | The base data object with 34 columns for a single booking. See `SCHEMAS.md`. |
| **Billboard** | Our vision for the website: a living, breathing, dynamic ad visible statewide. |
| **Booking Number** | Unique arrest identifier. Primary dedup key (with County) across all systems. |
| **Case ID** | Cross-platform tracking key (e.g., `CASE-2026-001234`) linking Wix → GAS → SignNow. |
| **County Slug** | Lowercase hyphenated county name for URLs (e.g., `palm-beach`). |
| **GAS** | Google Apps Script — "The Factory." Central backend for all business logic. |
| **Hot Lead** | Prospect with Lead Score ≥ 70. Requires immediate follow-up. |
| **Idempotent** | An operation that produces the same result even if executed multiple times. All writes must be idempotent. |
| **Indemnitor** | The person co-signing (guaranteeing) the bond for the defendant. |
| **IntakeQueue** | Primary Wix CMS collection tracking cases from intake → completion. |
| **Lead Score** | 0-100 rating based on bond amount, recency, charges, and county. |
| **Lead Status** | Hot (≥70) / Warm (50-69) / Cold (30-49) / Disqualified (<30 or Released). |
| **Magic Link** | Passwordless auth link sent via SMS/email to access the client portal. |
| **Manus Brain** | Telegram AI engine handling conversational intake and routing. |
| **Master Sheet** | Central Google Sheets database with per-county arrest tabs. |
| **Node-RED** | Operations hub for scheduling, monitoring, and data relay. Not for business logic. |
| **Premium** | Fee paid to Shamrock for posting a bond (10% of face value in FL, $100/charge minimum). |
| **Qualified Arrest** | Arrest record that passes lead scoring (score ≥ 70, not released, bond > $0). |
| **Router** | Wix dynamic page system (e.g., `/florida-bail-bonds/{county-slug}`). |
| **Shannon** | ElevenLabs voice AI agent handling after-hours phone intake. |
| **SignNow Packet** | The 14-document signing package generated for each bail bond case. |
| **The Clerk** | AI agent that parses booking data into structured JSON. |
| **The Closer** | AI agent that runs abandoned intake SMS/WhatsApp drip campaigns. |
| **The Concierge** | AI agent for 24/7 client support across web, SMS, and Telegram. |
| **Velo** | Wix's JavaScript development platform for frontend and backend code. |
| **Watchdog** | Node-RED system health monitor running 5-minute checks across all endpoints. |
