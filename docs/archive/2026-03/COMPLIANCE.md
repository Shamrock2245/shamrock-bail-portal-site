# Compliance, KPIs, & Escalations

This document handles the constraints surrounding legal compliance, internal business KPIs, and escalation protocols for Shamrock Bail Bonds.

## 1. Compliance (10DLC & Telephony)
- **10DLC Constraints**:
  - No spam or marketing blasts on Twilio. 
  - WhatsApp and SMS messaging MUST have a clear opt-out path (`Reply STOP`).
  - "The Concierge" and "Shannon" must only initiate Path B (packet delivery) if explicit consent is obtained.

## 2. Key Performance Indicators (KPIs)
- **Time to Contact**: AI must respond to Web Chat or Inbound Calls instantly (< 5 seconds).
- **Time to Sign**: Track the delta between Magic Link click and SignNow completion webhook.
- **Conversion Rate**: Measuring how many abandoned intakes "The Closer" rescues.
- **Scraper Effectiveness**: Number of new arrests successfully processed without Cloudflare blocks.

## 3. Escalations
When AI instances hit their knowledge threshold:
- **Trigger**: Caller asks a complex legal question, gets angry, or asks to speak to humans.
- **Action**: Agent must state, "I am an automated assistant. Let me grab the on-call bondsman for you."
- **Execution**: Warm-transfer the call via ElevenLabs or alert Slack `#intake-alerts`. Do NOT attempt to provide legal advice.

