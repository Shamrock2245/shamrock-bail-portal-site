# 🗺 Florida Counties Roadmap & Scraper Status

> **Last Updated:** April 16, 2026
> **Active Counties:** 19 | **Backlog:** 48

This document is the master ledger for "The Scout" and "The Clerk" agents. It tracks the development, health, and extraction idiosyncrasies of all 67 Florida county jail rosters.

## Scraper Tiers
1. **Tier 1 (Easy)**: Returns clean JSON via network API or uses simple HTML tables.
2. **Tier 2 (Moderate)**: Requires session cookies, pagination, or basic headless browsing (Puppeteer/DrissionPage).
3. **Tier 3 (Hostile)**: Cloudflare Turnstile, reCAPTCHA, IP blocking, or obfuscated DOM requiring stealth tools (DrissionPage/ZenRows).

---

## 🟢 Operational Counties (19 Active)

| # | County | Tier | Stack | Schedule | Status | Notes |
|---|--------|------|-------|----------|--------|-------|
| 1 | **Brevard** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Simple HTML bookings |
| 2 | **Charlotte** | 1 | Python/DrissionPage | `*/30 * * * *` | ✅ Stable | Revize CMS, clean JSON. Mugshots need session token. |
| 3 | **Collier** | 2 | Node.js/Puppeteer | `*/30 * * * *` | ✅ Stable | Custom site. ASP.NET WebForms. ViewState handling. |
| 4 | **DeSoto** | 2 | Node.js/Puppeteer | `0 */2 * * *` | ✅ Stable | SmartCOP, incremental mode. ASP.NET, `http://` prefixing for pagination. |
| 5 | **Hendry** | 3 | Python/Playwright | `0 */2 * * *` | ✅ Stable | Wix API interception. Stealth required. |
| 6 | **Highlands** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Interactive search |
| 7 | **Hillsborough** | 2 | Python/DrissionPage | `*/20 * * * *` | ✅ Stable | High volume (Tampa). Login required. |
| 8 | **Indian River** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Interactive search form |
| 9 | **Lake** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Interactive search |
| 10 | **Lee** | 2 | GAS Internal | `*/30 * * * *` | ✅ Stable | Home county. Rate limits if >10 req/min. |
| 11 | **Manatee** | 2 | Python/DrissionPage | `*/30 * * * *` | ✅ Stable | Revize CMS |
| 12 | **Martin** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Recent Bookings page |
| 13 | **Orange** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Orlando. High volume. |
| 14 | **Osceola** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Custom portal |
| 15 | **Palm Beach** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Detail pages via booking number links. |
| 16 | **Pinellas** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | PCSO |
| 17 | **Polk** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Central FL |
| 18 | **Sarasota** | 3 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Cloudflare; DP stealth required. |
| 19 | **Seminole** | 2 | Python/DrissionPage | `0 */3 * * *` | ✅ Stable | Sheriff's Office |

---

## 🟡 Priority Expansion Targets

### Wave 1: SmartCOP Blitz (13 counties, ~30 min each)
Clone DeSoto's SmartCOP scraper. Low effort, high ROI.

| County | Volume | Stack | Notes |
|--------|--------|-------|-------|
| Bradford | Low | SmartCOP clone | — |
| Dixie | Low | SmartCOP clone | — |
| Escambia | Medium | SmartCOP clone | Pensacola |
| Gadsden | Low | SmartCOP clone | — |
| Gilchrist | Low | SmartCOP clone | — |
| Glades | Low | SmartCOP clone | — |
| Hamilton | Low | SmartCOP clone | — |
| Levy | Low | SmartCOP clone | — |
| Putnam | Low | SmartCOP clone | — |
| Santa Rosa | Medium | SmartCOP clone | Panhandle |
| Sumter | Low | SmartCOP clone | The Villages |
| Suwannee | Low | SmartCOP clone | — |
| Taylor | Low | SmartCOP clone | — |

**Post-Wave 1 Target**: 32 counties (48% FL coverage)

### Wave 2: High-Value Metros

| County | Volume | Difficulty | Notes |
|--------|--------|-----------|-------|
| **Miami-Dade** | Very High | Tier 3 (expected) | Massive volume. Likely hostile. |
| **Broward** | Very High | TBD | Fort Lauderdale metro. |
| **Duval** | High | TBD | Jacksonville. |
| **Pasco** | Medium | TBD | Tampa metro adjacency. |

---

## 🔴 Full Backlog (31 Remaining after Wave 1)

Alachua, Baker, Bay, Calhoun, Citrus, Clay, Columbia, Flagler, Franklin, Gulf, Hardee, Hernando, Holmes, Jackson, Jefferson, Lafayette, Leon, Liberty, Madison, Marion, Monroe, Nassau, Okaloosa, Okeechobee, Saint Johns, Saint Lucie, Union, Volusia, Wakulla, Walton, Washington.

---

## Infrastructure

- **Docker Compose**: Dual-stack (Python + Node.js) containerized scraper fleet
- **Hetzner Cloud**: `cpx21` VPS (Ubuntu 24.04) for self-hosted GitHub Actions runners
- **GitHub Actions**: 15 workflows with staggered cron schedules
- **MongoDB Atlas**: Centralized arrest data via `mongo_writer.py` bulk upsert
- **Dedup Key**: `Booking_Number + County` — zero-data safety (never overwrite with 0 results)

## Logging & Escalation
- When a "🟢 Operational" county fails consecutive pulls, move it to "🟡 In Development" and alert Slack `#scraper-health`.
- Never scrape all counties simultaneously on a single IP. Use staggered GitHub Actions crons.
