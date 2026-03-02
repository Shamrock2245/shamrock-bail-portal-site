---
name: Netlify Best Practices
description: AI Agent guide on using Netlify Edge Functions, Blobs, and AI Gateway functions in the Shamrock ecosystem.
---

# Netlify Best Practices for AI Agents

This document defines the rules, best practices, and integration patterns for building on Netlify within the **Shamrock Bail Bonds** ecosystem.

## 🏛 The Shamrock Architecture Philosophy
*   **Wix is the Clipboard**: UI, Client Session generation.
*   **Google Apps Script (GAS) is the Factory**: Heavy PDF processing, core DB mutations, long-polling, Twilio integrations.
*   **Netlify is the Edge & Middleware**: Ultra-low latency routing, caching, short-lived states, and API credential proxying.

---

## 🚀 1. Netlify Edge Functions (`@netlify/edge-functions`)
**When to use:** Use Edge Functions when you need *immediate* execution before a page loads or when routing traffic based on Geo-IP.

*   **Geo-Routing**: Automatically routing a Florida client to the FL Intake flow vs. an out-of-state visitor.
*   **Bot Protection**: Examining incoming requests before they hit Wix/GAS to filter out spam.
*   **Latency**: Edge functions run at the CDN level. They have *zero* cold starts.

**Agent Rule**: Do not use Edge Functions for heavy PDF parsing or integrations that take > 10 seconds. Use GAS for that.

---

## 📦 2. Netlify Blobs (`@netlify/blobs`)
**When to use:** Use Blobs for unstructured, temporary data caching.

*   **Scraper Caching**: "The Clerk" scrapes county jails. Instead of writing every scrape to a Google Sheet (which rate limits easily), cache the HTML/JSON payload to a Netlify Blob. Have GAS process the Blob asynchronously via a webhook/trigger.
*   **Conversation State**: If "The Concierge" AI needs to remember mid-conversation state for a Telegram user, store it in a Blob keyed by the `chat_id`.

**Agent Rule**: Treat Blobs as ephemeral storage. Permanent records (like signed PDFs or finalized bonds) belong in Google Drive/Sheets.

---

## 🤖 3. Netlify AI Gateway & Serverless Functions
**When to use:** Use Netlify Serverless Functions to proxy API calls to OpenAI, Grok, or ElevenLabs.

*   **Secrets are Sacred**: Never expose an OpenAI key in the Wix frontend or a Telegram Mini App.
*   **Speed**: Calling OpenAI from a Netlify Serverless Function is significantly faster than calling OpenAI from Google Apps Script. 
*   **Implementation**: Create a function at `/netlify/functions/chat.js` that receives the prompt from the frontend, injects the server-side API key (from Netlify Environment Variables), queries the LLM, and returns the response.

**Agent Rule**: When adding a new AI integration (e.g., translation, summary), build the proxy as a Netlify Serverless Function first, then let Wix/Telegram call that function.

---

## 🛠 Local Development & Testing
When working locally with Netlify in this ecosystem:
1. Ensure the `netlify-cli` is installed.
2. Run `netlify dev` to test Edge Functions and Serverless Functions locally.
3. Use the `netlify.toml` file to manage redirects, headers, and function locations. Do NOT hardcode these configurations in JS files.
