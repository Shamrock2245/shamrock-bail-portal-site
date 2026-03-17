# Scraping Playbook ("The Scout" & "The Clerk")

This playbook governs the automated extraction of arrest data from county Sheriff's Office websites. Because these sites are often protected by Cloudflare, reCAPTCHA, or IP blocking, strict adherence to these rules is required.

## 1. Target Environment Guidelines
- **Sarasota County**: Highly hostile. Uses strict Cloudflare Turnstile.
- **Lee County**: Moderate. Rate-limiting is the primary concern.
- **Charlotte County**: Accessible, but HTML structure changes occasionally.

## 2. Tooling Selection Hierarchy
Do not hammer a site with `axios` or `fetch` if it fails. Escalate gracefully:
1. **Tier 1 (Direct API)**: Always check the Chrome Network tab to see if the Sheriff's site uses a backend JSON API (e.g., an exposed ASP.NET or DataTables endpoint). This avoids HTML completely.
2. **Tier 2 (Headless Browsers)**: If HTML rendering or simple cookies are required, use `Puppeteer` or `Playwright`.
3. **Tier 3 (Stealth & Bypasses)**: If Cloudflare 403 blocks occur:
   - Use advanced stealth libraries in `swfl-arrest-scrapers/python_scrapers` (e.g., `DrissionPage`, `Scrapling`, `curl_cffi`).
   - Or route through a premium proxy/API like **ZenRows** or **ScraperAPI**.

## 3. Rate Limiting & Proxy Rotation
- **Never poll faster than every 15 minutes** for a single county. (Hourly is preferred).
- **Concurrency**: Process records sequentially with a `sleep(2000)` between detail-page requests.
- **Proxies**: Rotate IPs if accessing more than 100 records in a single run.

## 4. HTML Parsing Rules (Handling Brittle DOMs)
County IT departments change layouts without warning.
- **Do not rely on strict CSS classes** (e.g., `.table-row-new-2`).
- **Use Regex or Text-Node proximity**. Search for "Target Keywords" (e.g., `contains("Charge:")`) and extract the next sibling element.
- If the scraper breaks, the script MUST log a critical alert to the Slack `#intake-alerts` channel: `[Scraper Failure] Sarasota County HTML structure changed. Attempting auto-recovery.`

## 5. Zero-Data State
If a jail roster returns 0 arrests, do NOT assume success and overwrite the database. It is highly probable the IP was soft-blocked or the site is in maintenance mode. Retain the previous scrape's dataset until verified.
