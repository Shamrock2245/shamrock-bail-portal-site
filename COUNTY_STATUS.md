# 🗺 Florida Counties Roadmap & Scraper Status

> **Last Updated:** April 4, 2026
> **Active Counties:** 19 | **Backlog:** 48

This document is the master ledger for "The Scout" and "The Clerk" agents. It tracks the development, health, and extraction idiosyncrasies of all 67 Florida county jail rosters.

## Scraper Tiers
1. **Tier 1 (Easy)**: Returns clean JSON via network API or uses simple HTML tables.
2. **Tier 2 (Moderate)**: Requires session cookies, pagination, or basic headless browsing (Puppeteer).
3. **Tier 3 (Hostile)**: Cloudflare Turnstile, reCAPTCHA, IP blocking, or obfuscated DOM requiring stealth tools (DrissionPage/ZenRows).

---

## 🟢 Operational Counties (19 Active)

| # | County | Tier | Stack | Status | Notes |
|---|--------|------|-------|--------|-------|
| 1 | **Lee** | 2 | Puppeteer + GAS | ✅ Stable | Rate limits if >10 req/min. Expanding rows for charges. |
| 2 | **Charlotte** | 1 | Direct API / Axios | ✅ Stable | Clean JSON endpoint. Mugshots need session token. |
| 3 | **DeSoto** | 2 | GAS + Cheerio | ✅ Stable | ASP.NET. Needs `http://` prefixing for pagination. |
| 4 | **Collier** | 2 | GAS | ✅ Stable | ASP.NET WebForms. ViewState handling required. |
| 5 | **Hendry** | 3 | Python (DrissionPage) | ✅ Stable | Stealth required. |
| 6 | **Manatee** | 2 | Python (DrissionPage) | ✅ Stable | — |
| 7 | **Brevard** | 2 | Python / Node.js | ✅ Stable | — |
| 8 | **Highlands** | 2 | Python / Node.js | ✅ Stable | — |
| 9 | **Hillsborough** | 2 | Python (DrissionPage) | ✅ Stable | High volume (Tampa). Login required. |
| 10 | **Indian River** | 2 | Python / Node.js | ✅ Stable | — |
| 11 | **Lake** | 2 | Python / Node.js | ✅ Stable | — |
| 12 | **Martin** | 2 | Python / Node.js | ✅ Stable | — |
| 13 | **Orange** | 2 | Python / Node.js | ✅ Stable | Orlando. High volume. |
| 14 | **Osceola** | 2 | Python / Node.js | ✅ Stable | — |
| 15 | **Palm Beach** | 2 | Python / Node.js | ✅ Stable | Detail pages via booking number links. |
| 16 | **Pinellas** | 2 | Python / Node.js | ✅ Stable | — |
| 17 | **Polk** | 2 | Python / Node.js | ✅ Stable | — |
| 18 | **Sarasota** | 3 | Python (DrissionPage) | ⚠️ Intermittent | Cloudflare Turnstile. Requires stealth rotation. |
| 19 | **Seminole** | 2 | Python / Node.js | ✅ Stable | — |

---

## 🟡 Priority Expansion Targets

| County | Volume | Difficulty | Notes |
|--------|--------|-----------|-------|
| **Miami-Dade** | Very High | Tier 3 (expected) | Massive volume. Likely hostile. |
| **Broward** | Very High | TBD | Fort Lauderdale metro. |
| **Duval** | High | TBD | Jacksonville. |
| **Pasco** | Medium | TBD | Tampa metro adjacency. |

---

## 🔴 Full Backlog (44 Remaining)

Alachua, Baker, Bay, Bradford, Calhoun, Citrus, Clay, Columbia, Dixie, Escambia, Flagler, Franklin, Gadsden, Gilchrist, Glades, Gulf, Hamilton, Hardee, Hernando, Holmes, Jackson, Jefferson, Lafayette, Leon, Levy, Liberty, Madison, Marion, Monroe, Nassau, Okaloosa, Okeechobee, Putnam, Saint Johns, Saint Lucie, Santa Rosa, Sumter, Suwannee, Taylor, Union, Volusia, Wakulla, Walton, Washington.

---

## Infrastructure

- **Docker Compose**: Dual-stack (Python + Node.js) containerized scraper fleet
- **Hetzner Cloud**: `cpx21` VPS (Ubuntu 24.04) for self-hosted GitHub Actions runners
- **GitHub Actions**: 15 workflows with staggered cron schedules
- **MongoDB Atlas**: Centralized arrest data via `mongo_writer.py` bulk upsert
- **Dedup Key**: `Booking_Number + County` — zero-data safety (never overwrite with 0 results)

## Logging & Escalation
- When a "🟢 Operational" county fails consecutive pulls, move it to "🟡 In Development" and log in `LOGBOOK.md`.
- Never scrape all counties simultaneously on a single IP. Use staggered GitHub Actions crons.
