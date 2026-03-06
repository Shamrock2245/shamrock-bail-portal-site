# Memory & State Variables

The AI must operate with a continuous understanding of the agency's primary mission:
> **"The Uber of Bail Bonds" - Fast. Frictionless. Everywhere.**

## Strategic Operations
The system actively expands across specific geographic targets.
- **Priority 1**: WhatsApp Business Integration (Routing TWILIO messaging payloads into Wix / GAS).
- **Priority 2**: "The Scout" Agent. (Expanding booking coverage implicitly via web scrapers).
- **Priority 3**: "The Closer" Bot. (Automated SMS follow-ups for trailing Intake forms).

## Current System State
Refer to this baseline for active operations:
- **Status**: `🟢 SYSTEM OPERATIONAL`
- **Ready for**: WhatsApp & Geographic Expansion.
- **Integrations**: Wix <-> GAS Connection is stable. Twilio and ElevenLabs (Shannon) webhooks are actively receiving JSON payloads and updating `ShannonCallLog` sheets.
- **Memory**: Mem0 is strictly implemented for ElevenLabs to retain caller details persistently.
- **Scrapers**: DeSoto County deployed parsing ASP.NET seamlessly via clasp.

## Active Sub-Systems Monitoring
1.  **Shannon (ElevenLabs)**: Phone calls ring into the AI triage. Logs directly to Spreadsheet and Slack. Path B consent required for SMS. Memory actively hydrated via Mem0.
2.  **The Clerk (Scrapers)**: Active county scrapers write to specific local tabs (e.g., "Sarasota", "Lee", "DeSoto").
3.  **Wix Handlers**: Wix forms sync perfectly via Webhook `_functions/` and lightboxes via `Wix Window SDK`.
