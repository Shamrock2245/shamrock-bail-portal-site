# Sub-Agent Reflection & Audit Log

When bots deploy code to production, solve sticky bugs, or perform extensive refactoring, they MUST summarize what was done. This ensures that the next AI instance reading the repository has complete context.

## How to use this file
If you spend more than 5 tool calls attempting to solve a bug or perform a feature upgrade, append a short summary here. 
Format: `[Date] (Tags) - Impact Note`

## Escalation Path
- If 3 attempts to solve a problem fail (e.g., Cloudflare blocks Sarasota scrapers, Wix 403 Forbidden bridge), stop guessing.
- Record the exact HTTP Response Code or CLI Error here. 
- Trigger `notify_user` or the `#intake-alerts` Slack hook.

## Audit Log
- **[2026-03-05] (Frontend: Velo)** - Successfully stripped dynamic imports from Wix HOME and masterPage to fix zero-import UI freezing and improve Lighthouse scores.
- **[2026-03-05] (Agent: Shannon)** - Implemented Mem0 persistent knowledge graph mapping `user_id` to past conversations to allow Shannon to recall previous calls.
- **[2026-03-05] (Scraper: Sarasota)** - Failed to bypass Sarasota Cloudflare with DrissionPage, curl_cffi, Scrapling. Received 403 Forbidden and CAPTCHA challenges consistently. Parked active development for Sarasota until alternative proxies acquired.
- **[2026-03-06] (Scraper: DeSoto)** - Successfully built and deployed DeSoto County Scraper using standard DOM parsing for ASP.NET tables via Google Apps Script (clasp). Implemented 2-second request delays and robust URL normalization for postback relative links.
