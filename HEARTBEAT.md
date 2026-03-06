# Heartbeat & Health Checks

This document outlines the vital signs of the Shamrock Bail Portal and its interconnected AI agents.

## 1. Webhook Latency
- The Wix `<->` Google Apps Script bridge must respond quickly.
- Long-polling PDF generation occurs asynchronously. Returning a `200 OK` takes priority.

## 2. ElevenLabs Triage (Shannon)
- Monitor Voice AI latency and correct `agent_id` bindings in `ElevenLabs_WebhookHandler.js`.
- Ensure Mem0 properties (`user_id`, `agent_id`, `metadata`) sync cleanly so Shannon retains memory of repeat callers.
- If Shannon is dropping context, check RAG knowledge limits and document parsing errors in her Knowledge Base.

## 3. Scraper Health ("The Clerk/Scout")
- Check IP rotation or Session cookies if county jail scraping returns blocks (403, 503).
- Avoid brute force. Wait at least 15 minutes between polling heavy domains like Sarasota Sheriff.
- For ASP.NET targets like DeSoto, respect the enforced 2-second delays between details fetches to avoid silent IP bans.

## 4. UI Visibility (Mobile Sticky Bar)
- Use the `ui-visual-validator` skill to ensure the primary CTA "Call Bondsman" is permanently affixed to the bottom viewport on mobile interfaces. If the Heartbeat validator fails this, the build fails.
