# Architecture & System

The website acts as a Clipboard; the backend serves as the Brain. We enforce a robust, distributed service-oriented architecture designed for heavy lifting away from the frontend.

## The Modern Stack
1. **Frontend / UI**: Wix Velo 
   * Provides Premium UI/UX, Glassmorphism, Animations.
   * "The Clipboard": Collects data and passes it back. It does NOT own the heavy lifting.
2. **Backend Intelligence / Factory**: Google Apps Script (GAS) + OpenAI (GPT-4o / GPT-4o-mini).
   * All PDF generation, heavy logic, and long-poling happens here.
3. **Communication**:
   * **Slack**: Internal Command Center (Staff Alerts, Ops).
   * **Twilio**: SMS & WhatsApp (External Client Comms). 
     * WhatsApp is a key growth engine. Integration via Twilio Sandbox routed to `twilio-client.jsw`.
4. **Signing**: SignNow (Embedded Lightbox, Mobile-First).
5. **Payments**: SwipeSimple (One-Click Links).
6. **Voice AI**: ElevenLabs (e.g., Shannon the Intake Agent).

## Operating Logic & Pipeline
`Collect → Normalize → Store → Trigger → AI Process → Handoff`

*   **Intake**: Users (Indemnitors) start via Magic Link.
*   **Validation**: Phone/Email verified immediately.
*   **Processing**: "The Clerk" fills the paperwork (scrapes booking data/jail rosters).
*   **Signing**: SignNow link sent via SMS/WhatsApp or displayed in embedded Wix Lightbox.
*   **Closing**: Signed docs auto-saved to Drive. Staff alerted on Slack.

## Cloud & Hosting
- Wix operates the edge and user-facing frontend.
- Netlify runs Edge Functions / AI Gateway / Relays when GAS is insufficient or webhooks need middleware.
- Google Sheets acts as operational database/dashboard fallback and tracking center.
