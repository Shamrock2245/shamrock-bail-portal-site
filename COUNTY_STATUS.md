# Florida Counties Roadmap & Scraper Status

This document is the master ledger for "The Scout" and "The Clerk" agents. It tracks the development, health, and extraction idiosyncrasies of all 67 Florida county jail rosters to achieve full geographic expansion.

## Overview & Scraper Strategy
Because every Sheriff's Office provisions IT differently, scrapers are broadly categorized into three tiers of difficulty:
1. **Tier 1 (Easy)**: Returns clean JSON via network API or uses simple, un-minified HTML tables.
2. **Tier 2 (Moderate)**: Requires session cookies, pagination handling, or basic headless browsing (Puppeteer).
3. **Tier 3 (Hostile)**: Strict Cloudflare Turnstile, reCAPTCHA, IP blocking, or highly obfuscated DOM structures requiring stealth tools (DrissionPage/ZenRows).

---

## 🟢 Operational Counties (Production)

### 1. Lee County
- **Status**: Live / Stable
- **Difficulty**: Tier 2 (Moderate)
- **URL**: `https://www.sheriffleefl.org/arrest-search/`
- **Tech Stack**: Puppeteer + Basic HTML Parsing
- **Idiosyncrasies**: 
  - Rate limits aggressively if polled > 10 requests per minute.
  - Structure relies on expanding rows to view charges.
  - "Booking Number" format: `YY-######`.
- **Last Refactored**: 2026-03-01

### 2. Charlotte County
- **Status**: Live / Stable
- **Difficulty**: Tier 1 (Easy)
- **URL**: `https://www.ccso.org/arrest-search/`
- **Tech Stack**: Direct API / Axios
- **Idiosyncrasies**: 
  - Data is cleanly mapped in a hidden JSON endpoint found in the Network tab.
  - Images (Mugshots) require a separate authorized fetch using a session token.
- **Last Refactored**: 2026-02-15

### 3. DeSoto County
- **Status**: Live / Operational
- **Difficulty**: Tier 2 (Moderate ASP.NET)
- **URL**: `http://jail.desotosheriff.org/DCN/inmates`
- **Tech Stack**: Google Apps Script (`clasp`) with URLFetchApp + Cheerio DOM parsing.
- **Idiosyncrasies**: 
  - Prone to relative URL bugs on pagination/postbacks. Requires `http://jail.desotosheriff.org` prefixing.
  - Implements mandatory 2-second rate-limiting delays between detail requests exactly as humans browse.
  - Bond formatting strips `$` and commas for clean database mapping.
- **Last Refactored**: 2026-03-06

---

## 🟡 In Development (Priority Targets)

### 4. Sarasota County
- **Status**: Blocking / Hostile
- **Difficulty**: Tier 3 (Hostile)
- **URL**: `https://www.sarasotasheriff.org/arrest-search/`
- **Tech Stack**: DrissionPage (Python) / curl_cffi / Scrapling in `swfl-arrest-scrapers/python_scrapers`
- **Idiosyncrasies**: 
  - Extremely aggressive Cloudflare Turnstile protection. Standard Axios or curl requests will fail with 403 Forbidden.
  - The DOM structure frequently injects randomized CSS class names to break standard query selectors.
- **Current Issue**: Multiple headless automated approaches (DrissionPage, curl_cffi) still struggling to bypass Cloudflare reliably without getting challenged.

### 5. Collier County
- **Status**: In Development
- **Difficulty**: Tier 2 (Moderate ASP.NET)
- **URL**: `https://www.colliersheriff.org/arrest-search/`
- **Tech Stack**: Google Apps Script (`ArrestScraper_CollierCounty.js`)
- **Idiosyncrasies**: Uses ASP.NET WebForms. Handling ViewState parameters is necessary.

### 5. Hillsborough County (Tampa)
- **Status**: Planning
- **Difficulty**: Pending Assessment
- **URL**: `https://www.hcso.tampa.fl.us/arrest-search/`
- **Idiosyncrasies**: High volume county. Will require robust pagination handling and distributed scraping to avoid timeouts.

---

## 🔴 The Backlog (To Be Scraped)

*As development scales, move counties from this list to "In Development".*

6. Alachua
7. Baker
8. Bay
9. Bradford
10. Brevard
11. Broward
12. Calhoun
13. Citrus
14. Clay
15. Columbia
16. Dixie
17. Duval
18. Escambia
19. Flagler
20. Franklin
21. Gadsden
23. Gilchrist
24. Glades
25. Gulf
26. Hamilton
27. Hardee
28. Hendry
29. Hernando
30. Highlands
31. Holmes
32. Indian River
33. Jackson
34. Jefferson
35. Lafayette
36. Lake
37. Leon
38. Levy
39. Liberty
40. Madison
41. Manatee
42. Marion
43. Martin
44. Miami-Dade (Massive volume expected)
45. Monroe
46. Nassau
47. Okaloosa
48. Okeechobee
49. Orange (Orlando - Hostile expected)
50. Osceola
51. Palm Beach
52. Pasco
53. Pinellas
54. Polk
55. Putnam
56. Saint Johns
57. Saint Lucie
58. Santa Rosa
59. Seminole
60. Sumter
61. Suwannee
62. Taylor
63. Union
64. Volusia
65. Wakulla
66. Walton
67. Washington

---

## Logging & Escalation
- When a "🟢 Operational" county fails consecutive pulls, move it to "🟡 In Development" and log the failure code in `LOGBOOK.md`.
- Never attempt to scrape all 67 counties simultaneously on a single IP or serverless function. Batch them using queue workers across Netlify Edge or GCP Cloud Run.
