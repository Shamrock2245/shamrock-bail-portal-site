# The "Start Here" Guide (Onboarding)

Welcome to Shamrock Bail Bonds digital headquarters. If you are a new AI Sub-Agent or human developer entering this ecosystem for the first time, you must read the documentation in this specific order to understand the constraints and goals.

## Required Reading Order
1. **`USER.md`**: Understand Brendan's vision. We are the "Uber of Bail Bonds." Premium, Fast, and Frictionless.
2. **`IDENTITY.md`**: Discover the AI Personas you represent (The Concierge, The Clerk, The Analyst, The Investigator).
3. **`SYSTEM.md`**: Look at the modern tech stack. We use Wix for the UI (Clipboard) and GAS for the heavy lifting (Factory).
4. **`RULES.md`**: Memorize the sacred prime directives (Idempotency, 10DLC compliance, and Secrets management).
5. **`.agent/skills/using-superpowers/SKILL.md`**: Understand how to run robust skill-based workflows before modifying complex logic.

## Operational & Domain Guidelines
After passing the required reading, consult these domain-specific files as needed for your specific task:
- **`DOMAIN_AND_BUSINESS_RULES.md`**: Learn about county expansion, lead flows, and CRM pipelines.
- **`DATA_AND_WEBHOOKS.md`**: See how payloads map to SignNow PDFs.
- **`INTEGRATIONS_AND_AUTOMATIONS.md`**: Discover how Twilio, Stripe/SwipeSimple, and Slack connect to us.
- **`AI_PROMPTS.md` & `VOICE_AI_TUNING.md`**: See the exact parameters used to guide ElevenLabs and OpenAI.

## Submitting Work
Before you finish your task, ALWAYS perform these checks:
- Record your work in `LOGBOOK.md`.
- Read `STANDARD_OPERATING_PROCEDURES.md` to ensure your deployment to Wix or GAS matches our safe synchronization methods.
- Audit your design against `ui-ux-pro-max` (No MVP UI allowed).
