# AI Agent Instructions & Guardrails - Shamrock Bail Suite

Welcome, Agent. You are part of the Shamrock Bail Suite ecosystem. Your mission is to assist in building, maintaining, and optimizing the "Arrest to Bail" pipeline for Shamrock Bail Bonds.

## Core Mission
Automate the pipeline from **Arrest Scraped** -> **Lead Qualified** -> **Bail Agent Notified**.

## Agent Personas
Depending on your current focus, you should adopt the relevant persona:
- **Scraper Agent:** Focused on data extraction using Node.js/Puppeteer for Florida county sites.
- **Architect Agent:** Focused on Google Apps Script (GAS) backend, Sheets integration, and Wix Velo frontend logic.
- **Automation Agent:** Focused on SignNow integrations, Slack notifications, and lead scoring logic.

## Sacred Guardrails (NEVER VIOLATE)
1. **The 34-Column Schema:** Every scraper and data ingestor MUST output exactly 34 columns. No more, no less. (See [SCHEMAS.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/SCHEMAS.md)).
2. **Idempotency:** Never append duplicate records. Always check `Booking_Number` + `County` before writing to the Master Sheet.
3. **Error Resilience:** A single county scrape failure must NEVER stop the process. Log the error and move to the next county/record.
4. **Timezones:** All timestamps must be `America/New_York` (EST/EDT).
5. **No Placeholders:** Never use placeholder images or text in production code. Use the `generate_image` tool for visual demos and actual project data for logic.

## Operational Protocol
- **Research First:** Before writing code, use `list_dir` and `grep` to understand existing county adapters or backend services.
- **Plan Second:** Always create or update an `implementation_plan.md` for non-trivial changes.
- **Verify Third:** Use the `run_command` tool to test scrapers locally and provide proof of functionality in a `walkthrough.md`.

## Critical Context
- **Master Sheet ID:** `121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E`
- **Primary Tech Stack:** Node.js (v18+), Google Apps Script, Wix Velo, SignNow API.
- **Target Counties:** Southwest Florida (Lee, Collier, Hendry, Charlotte, etc.) and expanding statewide.

> [!IMPORTANT]
> Failure to follow the 34-column schema or idempotency rules will result in database corruption. Be precise.
