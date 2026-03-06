# Analytics & Event Taxonomy

This document catalogs the critical telemetry points across the Shamrock Bail Portal. It ensures marketing and operational growth engines accurately measure conversion rates and system health.

## 1. Primary Funnel Conversions
The lead funnel is strictly monitored. Do not alter Wix Velo or GAS code that captures these events without verifying the down-funnel trigger logic.
- **`Event: Lead_Captured`**: An incoming web chat or phone call captures Name, County, and Phone.
- **`Event: Magic_Link_Sent`**: Twilio path B consent triggers the SMS Magic Link. 
- **`Event: Intake_Started`**: The indemnitor enters the unique OTP code on `/intake`. 
- **`Event: PDF_Generated`**: GAS webhook confirms physical contract generation.
- **`Event: SignNow_Complete`**: Webhook `document.update` status changes to `signed`. (This is the ultimate primary conversion event).

## 2. KPI Metrics ("The Closer" and "The Analyst")
To measure the effectiveness of the AI agents, the following metrics are tracked:
- **Time to Sign**: Measured from `Magic_Link_Sent` to `SignNow_Complete`. (Target < 15 minutes).
- **Abandoned Cart Rescue Rate**: Number of forms recovered by SMS follow-ups. Triggered if a user halts at `/intake` for > 30 minutes. 

## 3. UI/UX Tracking (Wix Window SDK)
- Using the `wix-window` tracking API, we monitor button clicks and UI engagement.
- Important Buttons: `#callNowCTA`, `#getBailCTA`, `#chatWidget`.
- Ensure changes to the "Sticky CTA" visual ID (currently `#sticky-mobile-cta`) do not break analytics.

## 4. Operational Health Signals
- **`Event: Scraper_Blocked`**: Thrown if the Sarasota or Lee county scraper encounters an HTTP 403 or HTML parsing failure.
- **`Event: Webhook_Timeout`**: Thrown if GAS is unreachable.

## 5. Performance Tracking (Lighthouse)
- User experience is critical for higher conversion rates.
- Maintain minimal unused JS and heavily compressed imagery. 
- Target Google Lighthouse Scores > 85 to qualify for the "Wow" factor.

By preserving these namespaces, we guarantee our growth engine can accurately measure ROI on WhatsApp and Geographic Expansion efforts.
