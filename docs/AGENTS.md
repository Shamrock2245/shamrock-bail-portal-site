# Shamrock Bail Suite - AI Agent Handbook

Welcome, Agent. This is your master source of truth for all operational guidelines, technical constraints, and mission-critical rules.

## 1. Core Mission
Automate the "Arrest to Bail" pipeline: **Arrest Scraped** -> **Lead Qualified** -> **Bail Agent Notified**.

## 🚨 ABSOLUTE AUTHORITY
Every action you take must align with the **[ANTIGRAVITY-FOUNDATION-SPEC.md](ANTIGRAVITY-FOUNDATION-SPEC.md)**.
That file overrides everything else in this repo. Read it first.

## 2. Technical Stack
- **Node.js (v18+)**: County scrapers and data processing.
- **Google Apps Script (GAS)**: Master database (Google Sheets) and document automation.
- **Wix Velo/CMS**: Frontend portal, customer-facing site, and operational database.
- **SignNow API**: Digital signature workflow.

## 3. The Sacred Guardrails
1.  **34-Column Schema**: Every lead MUST match the 34-column structure. No exceptions. (See [SCHEMAS.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/SCHEMAS.md)).
2.  **Idempotency**: Always verify `Booking_Number` + `County` before inserting unique records.
3.  **Resilience**: Scraper failures in one county should NOT stop the entire pipeline.
4.  **Security**: NEVER hardcode API keys. Use **Wix Secrets Manager** or Environment Variables.
5.  **Visual Excellence**: Use high-fidelity designs and real data. No placeholders.

## 4. The "Secret Sauce" (Lead Scoring)
Leads are qualified based on a score of **≥ 70** (Hot).
- **Bond Amount**: $500+ (+30), $1500+ (+50 total).
- **Recency**: Arrest < 1 day (+10), < 2 days (+20).
- **Charges**: Serious keywords (Battery, DUI, Theft, Domestic) (+20 points).
- **Disqualifiers**: Status = "Released" or Bond = $0 results in **Disqualified**.

## 5. Operational Handbooks
### Adding a New County Scraper
1.  **Research**: Check [COUNTY_STATUS.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/COUNTY_STATUS.md).
2.  **Code**: Follow the [COUNTY_ADAPTER_TEMPLATE.md](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/COUNTY_ADAPTER_TEMPLATE.md).
3.  **Validate**: Use the `data-validator.js` to ensure schema compliance.

### Updating Wix Backend
1.  Check `WIRING-ANALYSIS-REPORT.md` for dependencies.
2.  Use `.jsw` for backend modules and `.web.js` for exposed functions.
3.  Always import `wixData` for CMS operations.

## 6. Ground Truth References
- [Action Plan](file:///Users/brendan/Desktop/shamrock-bail-portal-site/ATLAS-ACTION-PLAN.md)
- [Schema Guide](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/SCHEMAS.md)
- [Frontend Reference](file:///Users/brendan/Desktop/shamrock-bail-portal-site/docs/FrontendCodeReferenceforChatGPTAtlas.md)
