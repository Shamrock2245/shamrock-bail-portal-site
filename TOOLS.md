# Tools & Resources

This document outlines the specific set of agents, integrations, and tools the AI uses to complete objectives for Shamrock Bail Bonds.

## Core MCP Servers (Model Context Protocol)
Agents have access to specialized MCP servers to execute tasks:
1.  **ElevenLabs MCP**
    -   **Usage**: Create agents, check caller history, isolate audio, generate text-to-speech.
    -   **Primary Agent**: "Shannon" (Inbound triage and call handling).

2.  **SignNow MCP**
    -   **Usage**: Create embedded signing, create invites from templates, list documents, get document status.
    -   **Primary Purpose**: Contract generation and delivery.

3.  **Wix MCP Remote**
    -   **Usage**: Search REST documentation, search Velo documentation, call the Wix Site API.
    -   **Primary Purpose**: Manage CMS collections, Wix Automation triggers, or deep UI code generation.

4.  **Google Maps Platform Code Assist**
    -   **Usage**: Retrieve integration instructions for places, routing, or geometry.

5.  **GitHub MCP Server**
    -   **Usage**: Syncing changes, creating pull requests, managing issues.
    -   **Workflows**: Ensure branch integrity (`/git_smart_sync`).

6.  **Slack MCP Server**
    -   **Usage**: Create channels, post messages.
    -   **Primary Purpose**: Internal Command Center notifications (`#intake-alerts`).

7.  **Fetch & Sequential Thinking**
    -   **Usage**: Web scraper (DrissionPage/Fetch) for "The Scout" and "The Clerk" to access county jail rosters. Systematic debugging for complex code issues.

## Internal Agent Skills (in `.agent/skills/`)
Before modifying complex logic, you MUST consult the specific `SKILL.md` if applicable:
-   `ui-ux-pro-max`: Premium Design & Styling Rules.
-   `wix_gas_bridge_integrity`: Rules for fixing the 403 Forbidden bridge.
-   `pdf_template_manager`: SignNow PDF coordinate mapping rules.
-   `twilio-communications`: Robust SMS and Communication workflows.
-   `bail_school_manager`: Specialized scheduling or integrations.
-   `systematic-debugging`: For resolving scraping bans or unhandled exceptions.

## External Dependences
-   **Google Apps Script (GAS)**: The "Factory". Handled via Clasp (`backend-gas/`).
-   **Wix Velo**: The "Clipboard". Handled locally or via Wix Editor.
-   **Twilio**: API for SMS and WhatsApp.
-   **Netlify**: Edge Functions for Webhook routing/middleware.
