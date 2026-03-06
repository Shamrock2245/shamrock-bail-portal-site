# Heartbeat & Health Checks

This document outlines the vital signs, health checks, and monitoring protocols for the Shamrock Bail Portal and its interconnected AI agents ("The Digital Workforce").

## 1. Core Engine Health (Wix <-> GAS Bridge)
- **Webhook Latency**: The Wix to Google Apps Script (GAS) bridge must respond quickly. Long-polling operations (like complex PDF generation or risk assessment) must occur asynchronously. Returning a `200 OK` takes priority to prevent Wix frontend timeouts.
- **Payload Integrity**: Ensure JSON payloads sent from Wix to GAS (and vice-versa) maintain consistent data schemas. Track any parsing errors in GAS execution logs.
- **API Quota Monitoring**: Keep a close eye on Google Apps Script daily execution limits and `UrlFetchApp` call quotas to prevent throttling.

## 2. Communications ("The Concierge" & "The Closer")
- **Twilio SMS/WhatsApp Deliverability**: Monitor message delivery failure rates (Error 30008, etc.). Ensure strict adherence to A2P 10DLC compliance to prevent carrier filtering, spam flags, or sandbox limitations.
- **ElevenLabs Triage (Shannon)**: Monitor Voice AI latency (time-to-first-byte) to ensure conversational fluidity. Verify correct `agent_id` bindings in webhooks (e.g., `ElevenLabs_WebhookHandler.js`).
- **Memory Syncing**: Ensure Mem0 properties (`user_id`, `agent_id`, `metadata`) sync cleanly so Shannon retains cross-session memory of repeat callers. If Shannon drops context, investigate RAG knowledge limits and document parsing errors in her Knowledge Base.

## 3. Scraper Health ("The Clerk" & "The Scout")
- **Bot Detection & Bypasses**: Monitor scraping logs for IP blocks (403, 503), Cloudflare/hCaptcha challenge failures, or unexpected DOM changes. Maintain proxy rotation and headless browser (DrissionPage) stealth configurations.
- **Rate Limiting Discipline**: Avoid brute-force polling. Enforce reasonable delays (e.g., wait at least 15 minutes between polling heavy domains like Sarasota Sheriff). For targets like DeSoto (ASP.NET), respect enforced 2-second delays between fetches to avoid silent IP bans.
- **Job Execution Metrics**: Track the success/failure metrics of GitHub Actions running the scraper workflows. Ensure timely completion against cron schedule expectations.

## 4. Third-Party Integrations
- **SignNow**: Monitor the success rate of embedded document link generation (via `createEmbbededLink`) and webhook callbacks for signed documents. Routinely confirm that OAuth tokens in GAS are refreshing correctly.
- **SwipeSimple**: Verify payment links generate accurately and that any scraping or API calls to SwipeSimple are completing without authentication failures.
- **Telegram (Internal Ops)**: Ensure the `@ShamrockBail_bot` webhook remains active and responsive to staff commands. Monitor for rate-limiting or dropped messages from the Telegram API.

## 5. Frontend & UI Reliability
- **UI Visibility (Mobile Sticky Bar)**: Use the `ui-visual-validator` skill to ensure the primary CTA ("Call Bondsman") is permanently affixed to the bottom viewport on mobile interfaces. If the Heartbeat validator fails this, the build should fail.
- **Aesthetic & Performance Integrity**: Conduct routine checks on animations, loading states (using spinners, never raw 'Loading...' text), and glassmorphism elements to ensure a premium, lag-free user experience across devices ("One thumb, one eye" rule).

## 6. Security & Credentials
- **Secrets Management**: Continually verify that all API keys and secrets reside strictly within Wix Secrets Manager, Netlify Environment Variables, and GAS Script Properties. No secrets should ever be hardcoded or visible in frontend source code.
- **Automated Audits**: Leverage skills like `audit_security` to run pre-flight checks for exposed PII or leaked keys before deployments.
