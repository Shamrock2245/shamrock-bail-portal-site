# Memory & State Variables

The AI must operate with a continuous understanding of the agency's primary mission:
> **"The Uber of Bail Bonds" - Fast. Frictionless. Everywhere.**

## Strategic Operations (Growth Engines)
The system actively expands across specific geographic targets and communication channels:
- **Priority 1**: WhatsApp Business Integration (Routing Twilio messaging payloads into Wix / GAS).
- **Priority 2**: "The Scout" Agent. (Expanding booking coverage implicitly via web scrapers across more counties).
- **Priority 3**: "The Closer" Bot. (Automated SMS/WhatsApp follow-ups for trailing/abandoned Intake forms).

## The Shamrock Ecosystem (Architecture & Platforms)
The agency operates on a modern, decoupled tech stack where each platform has a specific, rigid role:
- **Wix Velo (Frontend & Webhooks)**: The "Clipboard." Premium UI/UX, Glassmorphism, Animations. Collects data and passes it back. Houses Wix Secrets Manager for API keys.
- **Google Apps Script (Backend Engine)**: The "Factory." Handles all heavy lifting, PDF generation, risk logic, and long-polling.
- **Node.js/Python (Scraping & Edge Services)**: Powers automated jail roster scrapers ("The Clerk") running on GitHub Actions, hitting county sites (e.g., Charlotte, Sarasota, Lee, Manatee) and pushing to Google Sheets.
- **Netlify**: Edge Functions handling webhooks (e.g., routing ElevenLabs calls back to GAS).

## External Integrations & Automations
1.  **Twilio (Communications)**: SMS & WhatsApp for magic links, SignNow documents, and "The Closer" follow-up bots.
2.  **SignNow (E-Signatures)**: Embedded, mobile-first signing for Indemnity Agreements & Promissory Notes. OAuth tokens managed in GAS.
3.  **ElevenLabs (Voice/AI)**: "Shannon" the Intake Agent handles 24/7 inbound Twilio calls. Transcribes, extracts intent, and creates case files in GAS. Uses **Mem0** for cross-session knowledge retention.
4.  **SwipeSimple (Payments)**: One-click credit card processing links embedded in the Dashboard or sent via Telegram bot/SMS for payment plan progress.
5.  **Telegram (Internal Ops)**: The `@ShamrockBail_bot` webhook (`_functions/telegramWebhook`) serves as an internal command center for staff operations, quotes, and office locators.
6.  **Slack (Command Center)**: Internal alerts, staff operations, and notifications (e.g., when signed docs are auto-saved to Drive).

## Digital Workforce ("The Team")
We treat AI agents as **Digital Employees**:
- **"The Concierge"**: 24/7 Web Chat & SMS support. Answers FAQs, looks up court dates.
- **"The Clerk"**: Booking Scraper & OCR Specialist. Reads mugshots, parses PDFs, monitors rosters.
- **"The Analyst"**: Risk Assessment. Evaluates flight risk (0-100 Score).
- **"The Investigator"**: Vetting. Deep background checks via TLO/IRB.

## Current System State
Refer to this baseline for active operations:
- **Status**: `🟢 SYSTEM OPERATIONAL`
- **Ready for**: WhatsApp limits scaling & Geographic Expansion mapping.
- **Integrations**: Wix <-> GAS Connection is stable. Twilio and ElevenLabs (Shannon) webhooks are actively receiving JSON payloads and updating sheets.
- **Memory**: Mem0 is strictly implemented for ElevenLabs to retain caller details persistently.
- **Scrapers**: Multiple county scrapers (Charlotte, Sarasota, Manatee, etc.) actively running via DrissionPage and GitHub Actions.

## Prime Directives (The "Laws")
1.  **Wix is the Clipboard**: It collects data. It does NOT own the heavy lifting.
2.  **GAS is the Factory**: All PDF gen, heavy logic in Google Apps Script.
3.  **Secrets are Sacred**: API Keys live in Wix Secrets Manager. Never in frontend code.
4.  **10DLC Compliance**: All SMS/WhatsApp messaging must be compliant. No spam.
5.  **Finish the Factory**: Connect existing pipes to new outputs before redesigning.
