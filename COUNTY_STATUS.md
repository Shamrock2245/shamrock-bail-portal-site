# 🗺 Florida Counties Roadmap & Scraper Status

> **Last Updated:** April 24, 2026
> **Active Counties:** 20 | **Backlog:** 47
> **Infrastructure:** `shamrock-leads` repo on Hetzner VPS (Docker)

This document is the master ledger for "The Scout" and "The Clerk" agents. It tracks the development, health, and extraction idiosyncrasies of all 67 Florida county jail rosters.

## Scraper Tiers
1. **Tier 1 (Easy)**: Returns clean JSON via network API or uses simple HTML tables.
2. **Tier 2 (Moderate)**: Requires session cookies, pagination, or basic headless browsing (Puppeteer/DrissionPage).
3. **Tier 3 (Hostile)**: Cloudflare Turnstile, reCAPTCHA, IP blocking, or obfuscated DOM requiring stealth tools (DrissionPage/ZenRows).

---

## 🟢 Operational Counties (20 Active)

All active scrapers are registered in `shamrock-leads/main.py` and run on the Hetzner VPS via Docker.

| # | County | Tier | Stack | Interval | Status | Notes |
|---|--------|------|-------|----------|--------|-------|
| 1 | **Brevard** | 2 | Python/DrissionPage | 120 min | ✅ Stable | Simple HTML bookings |
| 2 | **Broward** | 2 | Python/DrissionPage | 60 min | ✅ Stable | Fort Lauderdale metro. High volume. |
| 3 | **Charlotte** | 1 | Python/DrissionPage | 45 min | ✅ Stable | Revize CMS, clean JSON. Mugshots need session token. |
| 4 | **Collier** | 2 | Node.js/Puppeteer | 30 min | ✅ Stable | Custom site. ASP.NET WebForms. ViewState handling. |
| 5 | **DeSoto** | 2 | Node.js/Puppeteer | 60 min | ✅ Stable | SmartCOP, incremental mode. ASP.NET. |
| 6 | **Duval** | 2 | Python/DrissionPage | 90 min | ✅ Stable | Jacksonville. High volume. |
| 7 | **Escambia** | 2 | Python/DrissionPage | 120 min | ✅ Stable | Pensacola. SmartCOP variant. |
| 8 | **Hendry** | 3 | Python/Playwright | 120 min | ✅ Stable | Wix API interception. Stealth required. |
| 9 | **Hillsborough** | 2 | Python/DrissionPage | 90 min | ✅ Stable | High volume (Tampa). Login required. |
| 10 | **Lee** | 2 | GAS Internal + Python | 20 min | ✅ Stable | Home county. Rate limits if >10 req/min. |
| 11 | **Manatee** | 2 | Python/DrissionPage | 45 min | ✅ Stable | Revize CMS |
| 12 | **Orange** | 2 | Python/DrissionPage | 90 min | ✅ Stable | Orlando. High volume. |
| 13 | **Osceola** | 2 | Python/DrissionPage | 120 min | ✅ Stable | Custom portal |
| 14 | **Palm Beach** | 2 | Python/DrissionPage | 120 min | ✅ Stable | Detail pages via booking number links. |
| 15 | **Pasco** | 2 | Python/DrissionPage | 90 min | ✅ Stable | Tampa metro adjacency. |
| 16 | **Pinellas** | 2 | Python/DrissionPage | 90 min | ✅ Stable | PCSO |
| 17 | **Polk** | 2 | Python/DrissionPage | 120 min | ✅ Stable | Central FL |
| 18 | **Sarasota** | 3 | Python/DrissionPage | 60 min | ✅ Stable | Cloudflare; DP stealth required. |
| 19 | **Seminole** | 2 | Python/DrissionPage | 90 min | ✅ Stable | Sheriff's Office |
| 20 | **Volusia** | 2 | Python/DrissionPage | 90 min | ✅ Stable | Daytona Beach area. |

---

## 🟡 Priority Expansion Targets

### Wave 1: SmartCOP Blitz (~30 min each)
Clone DeSoto's SmartCOP scraper. Low effort, high ROI.

| County | Volume | Stack | Notes |
|--------|--------|-------|-------|
| Bradford | Low | SmartCOP clone | — |
| Dixie | Low | SmartCOP clone | — |
| Gadsden | Low | SmartCOP clone | — |
| Gilchrist | Low | SmartCOP clone | — |
| Glades | Low | SmartCOP clone | — |
| Hamilton | Low | SmartCOP clone | — |
| Highlands | Low | SmartCOP clone | The Heartland |
| Indian River | Medium | SmartCOP clone | Treasure Coast |
| Lake | Medium | SmartCOP clone | Central FL |
| Levy | Low | SmartCOP clone | — |
| Martin | Low | SmartCOP clone | Treasure Coast |
| Putnam | Low | SmartCOP clone | — |
| Santa Rosa | Medium | SmartCOP clone | Panhandle |
| Sumter | Low | SmartCOP clone | The Villages |
| Suwannee | Low | SmartCOP clone | — |
| Taylor | Low | SmartCOP clone | — |

**Post-Wave 1 Target**: 36 counties (54% FL coverage)

### Wave 2: High-Value Metros

| County | Volume | Difficulty | Notes |
|--------|--------|-----------|-------|
| **Miami-Dade** | Very High | Tier 3 (expected) | Massive volume. Likely hostile. |

---

## 🔴 Full Backlog (30 Remaining after Wave 1)

Alachua, Baker, Bay, Calhoun, Citrus, Clay, Columbia, Flagler, Franklin, Gulf, Hardee, Hernando, Holmes, Jackson, Jefferson, Lafayette, Leon, Liberty, Madison, Marion, Monroe, Nassau, Okaloosa, Okeechobee, Saint Johns, Saint Lucie, Union, Wakulla, Walton, Washington.

---

## Infrastructure

- **Repo**: `shamrock-leads` on Hetzner VPS (`178.156.179.237`)
- **Docker Compose**: Containerized Python scraper fleet with APScheduler
- **MongoDB Atlas**: Centralized arrest data via `mongo_writer.py` bulk upsert
- **Dedup Key**: `Booking_Number + County` — zero-data safety (never overwrite with 0 results)
- **Dashboard**: `shamrock-leads/dashboard/` — web-based lead management UI

## Logging & Escalation
- When a "🟢 Operational" county fails consecutive pulls, move it to "🟡 In Development" and alert Slack `#scraper-health`.
- Never scrape all counties simultaneously on a single IP. Use staggered intervals in `main.py`.
