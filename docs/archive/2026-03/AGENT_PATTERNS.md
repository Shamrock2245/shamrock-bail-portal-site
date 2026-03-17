# Shamrock Agentic Patterns & Architecture

Based on industry-leading agentic frameworks (OpenAI Swarm, GitHub Agentic Workflows, DataRobot, and the `.ai` persona framework), this document outlines the architectural patterns and inspiration for Shamrock Bail Bonds' Digital Workforce.

## 1. Persona-Driven Behavior (Inspired by the `.ai` framework)
To keep agents focused and reliable, each digital employee (The Concierge, The Clerk, The Analyst, The Investigator) should be defined by a strict configuration (e.g., a YAML or JSON schema) that explicitly states:
- **Identity & Tone**: How the agent speaks (e.g., The Concierge is empathetic and urgent; The Analyst is cold and data-driven).
- **Core Principles**: Rules they cannot break (e.g., "The Concierge never guarantees a bond will be approved").
- **Available Tools**: A strict allowlist of functions the agent can execute (e.g., The Clerk can `scrape_jail_roster` and `parse_pdf`, but cannot `send_whatsapp_message`).

## 2. Agent Handoffs & Context Variables (Inspired by OpenAI Swarm)
Agents should not be monolithic. Instead of one giant prompt trying to do everything, use **Handoffs**:
- **Execution Flow**: A client texts the WhatsApp number. **The Concierge** answers. Once the client provides a name and county, The Concierge calls a function `transfer_to_clerk(defendant_name, county)`.
- **Context Variables**: During the handoff, the session's `context_variables` are updated with the newly created `Case ID`. 
- **The Clerk** wakes up, uses the `Case ID` to store scraped jail roster data, and then calls `transfer_to_analyst(case_id)`.
- **The Analyst** assesses the flight risk and generates a score (0-100).
This multi-agent routing ensures no single agent gets confused by too many instructions, and the `Case ID` maintains statefulness across the pipeline.

## 3. Human-in-the-Loop Safety & Guardrails (Inspired by `gh-aw`)
Operations that involve financial risk or legal compliance must be protected by "Approval Gates" and strict scopes.
- **Read-Only by Default**: The Clerk and Investigator operate in a read-only capacity. They extract data and write it to the internal `Case ID` record, but they do not execute physical world actions.
- **Safe Outputs**: Actions are passed as structured JSON rather than raw text to prevent prompt injection or hallucinated actions.
- **Human Approval Gates**: When The Analyst determines a bond is high-risk but potentially acceptable, it does not send the SignNow link. Instead, it sends an interactive Slack message to the human team: *"Case #1234 requires approval. Flight Risk: 82. [APPROVE] / [DENY]"*. Only human interaction can unlock the final step.

## 4. Environment & Secret Isolation
Following GitHub's agentic workflow security model:
- The AI agents running in Google Apps Script (GAS) or Wix Velo rely strictly on Secrets Managers.
- The webhooks that trigger these agents must require authentication (e.g., verifying Twilio signatures, checking `ELEVENLABS_TOOL_SECRET`) to ensure third parties cannot maliciously trigger The Analyst or The Clerk.

---
**Summary for Shamrock Implementation:**
1. Break down the giant backend into discrete "Agent" objects with strict toolsets.
2. Implement a `handoff` function that allows The Concierge to pass the Baton (and the `Case ID`) to The Clerk.
3. Enforce Human-in-the-Loop via Slack for any action that costs money, signs a legal document, or binds a contract.
