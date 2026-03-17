# 🧠 Shamrock MCP & AI Capabilities Guide

This guide outlines your current AI/MCP architecture and recommends how to adapt new capabilities from specific external sources.

---

## 1. ✅ Current Capabilities Audit
*(What you already have installed in `backend-gas`)*

### **A. Core MCP Server (`MCPServer.js`)**
You are running a custom **Google Apps Script MCP Server**. This allows AI agents (like Manus or local LLMs) to "drive" your backend tools.
*   **Functions Exposed:**
    *   `get_pending_intakes`: Fetches the queue.
    *   `sync_case_data`: Pushes data back to Wix.
*   **Best Use:** Use this when an AI agent needs to *act* on data (e.g., "Check the queue and verify if John Doe is pending").

### **B. AI Concierge (`AIConcierge.js`)**
A specialized automated agent for handling new leads.
*   **Flow:** Scrapes Arrest -> Checks Lead Score -> if Hot -> AI Concierge SMS.
*   **Tech:** Uses **OpenAI** (via `OpenAIClient.js`) to generate personalized messages based on arrest context.
*   **Best Use:** Immediate, high-touch engagement with high-value potential clients.

### **C. RAG Service (`RAGService.js`)**
(Implied/Found references) A standard way to inject context (Retrieval-Augmented Generation) into prompts.
*   **Best Use:** Injecting "Knowledge Base" facts (Jail addresses, hours) into the AI Concierge texts.

---

## 2. 🚀 Recommended New Capabilities
*(Adapted from `signnow/sn-api-helper-mcp` & `korotovsky/slack-mcp-server`)*

### **A. Slack MCP Adaptation**
**Source:** `korotovsky/slack-mcp-server`
**Role:** "The Dispatcher"

Your current Slack integration (`SlackIntegration.js`) is "Fire and Forget" (you send alerts, but don't listen). The standard Slack MCP encourages **bi-directional** communication.

**Recommended Adaptations:**
1.  **Thread Reader (`conversations.replies`)**: Allow the AI to "read" the thread on a `#new-cases` alert.
    *   *Why?* Staff often discuss a case in the thread ("I called him, no answer"). The AI should know this so it doesn't double-call.
2.  **Context Search** (`conversations.history`): Before acting on an Indemnitor, search Slack for their name.
    *   *Why?* To see if they are a "Frequent Flier" or have a history of non-payment mentioned by staff.

**Implementation Strategy:**
Add a `getSlackThreadHistory(ts)` function to `MCPServer.js` so Manus can "read the room" before acting.

### **B. SignNow MCP Adaptation**
**Source:** `signnow/sn-api-helper-mcp`
**Role:** "The Paralegal"

The official SignNow MCP is focused on *developer help* (documentation/code gen). However, we can adapt its *intent* into operational tools.

**Recommended Adaptations:**
1.  **Template Inspector**: Instead of just generic filling, create a tool that inspects a template and returns *missing* fields.
    *   *Tool Name:* `audit_document_readiness`
    *   *Why?* Prevent sending blank documents.
2.  **Status Polling Agent**: An MCP tool `check_indemnitor_signature_status(email)` that returns "Signed", "Viewed", or "Ignored".
    *   *Why?* Allows an AI to run a "chase" workflow: "If status is 'Ignored' > 1 hour, send SMS reminder."

---

## 3. 🛠️ How to "Programmatically" Set Secrets
*(Because GAS UI limits you to 50 items)*

The GAS Project Settings UI has a hard limit of 50 properties, but the *API* allows more. We created a script to bypass this.

### **Quick Start Guide:**
1.  Open `backend-gas/Setup_SlackProperties.js` in the Apps Script Editor.
2.  Paste your Webhook URL into the `value` variable.
3.  Select `configureSlackWebhookNewCases` from the function dropdown.
4.  Click **Run**.

**Why this is better:**
*   **No UI Limits:** You can have 100+ webhooks if needed.
*   **Version Controlled:** You keep the *setting logic* in Git (but keep actual secrets out of Git!).

---

## 4. 🧭 Strategic "Best Ways to Use" Summary

| Tool | Role | Best Practice |
| :--- | :--- | :--- |
| **MCPServer** | The Bridge | Keep this "dumb". It should only expose atomic tools. Don't put business logic here; put logic in the Agent that calls it. |
| **AI Concierge** | The Salesman | Let it run on "Hot" leads only. Use `RAGService` to ensure it doesn't hallucinate jail info. |
| **Slack Integration** | The Team Brain | Move from "Notifications" to "Collaboration". Use threads so the AI can read staff notes. |
| **SignNow Helper** | The Compliance Officer | Don't just send. Use AI to *verify* the document is complete before notifying the human. |
