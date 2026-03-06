# Integrations & Automations

This document tracks all external services hooked into the Shamrock ecosystem and their associated automated flows.

## 1. SignNow (E-Signatures)
- **Primary Use**: Automating bail bond contracts (Indemnity Agreements, Promissory Notes).
- **Integration Point**: 
  - `backend-gas/SignNow_*.js`
  - Auth via OAuth 2.0 (Tokens refreshed/stored in script properties).
- **Core Automation**: `createEmbbededLink` (Triggered via Wix Form submission or ElevenLabs SMS).

## 2. Twilio (Communications)
- **Primary Use**: Sending "Magic Links" and SignNow documents via SMS / WhatsApp.
- **Integration Point**: `backend-gas/Twilio_*.js`
- **Core Automation**: Auto-reply to abandoned carts with a follow-up link (The "Closer" Bot).

## 3. SwipeSimple (Payments)
- **Primary Use**: Credit Card processing.
- **Integration Point**: 
  - Link generation in `Dashboard.html` or sent via Telegram bot.
- **Core Automation**: 
  - Weekly payment plan progress nudges to indemnitors.
  - Ability to dispatch manual payment links to alternate contact methods directly from the GAS Dashboard.

## 4. ElevenLabs (Voice/AI)
- **Primary Use**: Conversational AI (Shannon the Intake Agent).
- **Integration Point**: 
  - Inbound Twilio calls routed to ElevenLabs agent (`agent_2001kjth4na5ftqvdf1pp3gfb1cb`).
  - Webhooks handled by Netlify Edge Functions mapping back to GAS (`ElevenLabs_WebhookHandler.js`).
- **Core Automation**: 
  - Transcribing calls, extracting intent, creating case files in GAS.
  - Context retention via **Mem0** integration within `ElevenLabs_WebhookHandler.js` to persist cross-session knowledge for repeat callers.

## 5. Telegram
- **Primary Use**: Internal staff operations (Quotes, Office Locators).
- **Integration Point**: `@ShamrockBail_bot` webhook pointing to `_functions/telegramWebhook`.

## 6. APIs Scrapers (Jail Rosters)
- **Primary Use**: The "Clerk" and "Scout" protocols.
- **Integration Point**: Node.js scripts (or Python) running on a schedule to hit county websites (e.g., Lee, Charlotte, Sarasota) and parse HTML/JSON.
- **Core Automation**: Write parsed booking data into `Arrests` sheet tabs via API/Sheets service.
