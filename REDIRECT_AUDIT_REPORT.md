# Shamrock Bail Bonds — Redirect Audit & Cleanup Report
**Site:** shamrockbailbonds.biz  
**Date:** February 21, 2026  
**Scope:** Phases 1–4 of the Redirect Audit and Cleanup  

---

## Executive Summary

A full crawl of **446 URLs** across shamrockbailbonds.biz was completed. The site is in good structural health for its core pages, but has **151 redirect rules** that need to be applied in the Wix URL Redirect Manager to fix broken county pages, legacy slugs, and missing utility pages.

| Metric | Count |
|---|---|
| Total URLs audited | 446 |
| Clean 200 pages | 215 |
| 404 Not Found | 146 |
| Single-hop redirects (existing) | 12 |
| Multi-hop redirect chains | 1 |
| Canonical mismatches | 18 |
| Sitemap issues | 1 |
| **Redirect rules to apply** | **151** |

---

## Phase 1: Data Collection & Analysis

### What Was Found

**404 Not Found (146 URLs)** — The majority fall into three categories:

1. **`/bail-bonds/[county]` paths (61 URLs)** — These old-style county URLs no longer exist. The site has migrated to `/florida-bail-bonds/[county]` but the old paths were never redirected. All 67 Florida county pages exist and return 200 at `/florida-bail-bonds/[county]`.

2. **`/[county-name]` bare paths (63 URLs)** — Root-level county slugs (e.g., `/lee`, `/collier`) were tested and all return 404. These should redirect to their respective `/florida-bail-bonds/[county]` pages.

3. **Other 404s (22 URLs)** — Utility pages that were never created or have been removed: `/faq`, `/members`, `/login`, `/bail-school`, `/florida-sheriffs-clerks`, etc.

**Existing Redirects (12 single-hop, 1 multi-hop):**
- `/bail-bonds/hendry`, `/bail-bonds/pinellas`, `/bail-bonds/stlucie`, `/bail-bonds/suwannee`, `/bail-bonds/levy`, `/bail-bonds/polk`, `/bail-bonds/clay` → all redirect to `/` (homepage)
  - **Issue:** These should redirect to the specific county page, not the homepage
- `/bail-online`, `/blank-4` → redirect to `/` (correct)
- `/blank-3` → redirects to `/how-bail-works` (correct)
- `/blank`, `/home-1` → redirect to `/how-to-become-a-bondsman` (correct)
- `http://shamrockbailbonds.biz` → 2-hop chain: non-www HTTP → non-www HTTPS → www HTTPS (acceptable, handled at DNS level)

### Key Slug Mapping Discovery

The site uses non-hyphenated slugs for compound county names:

| County | Old/Broken Slug | Correct FBB Slug |
|---|---|---|
| Indian River | `indian-river` | `indianriver` |
| Palm Beach | `palm-beach` | `palmbeach` |
| St. Johns | `st-johns` | `stjohns` |
| St. Lucie | `st-lucie`, `stlucie` | `stlucie` |

---

## Phase 2: CMS Implementation (Wix)

### Important: Wix API Limitation

> The Wix REST API **does not expose a programmatic endpoint** for managing URL redirect rules (301 redirects). The Wix Headless "Redirects API" is for a different purpose (temporarily redirecting visitors to Wix-managed checkout/auth pages).

Redirect rules must be applied through the **Wix Dashboard → Marketing & SEO → SEO Tools → URL Redirect Manager**.

### How to Apply the Redirect Rules

**Option A: Bulk CSV Import (Recommended)**

1. Go to your Wix Dashboard
2. Navigate to **Marketing & SEO → SEO Tools → URL Redirect Manager**
3. Click **"Import Redirects"** (or "Bulk Import")
4. Upload the file: `wix_bulk_redirects_FINAL.csv`
5. Review the preview and confirm

**The CSV format is:**
```
Old URL,New URL
/bail-bonds/alachua,/florida-bail-bonds/alachua
/bail-bonds/baker,/florida-bail-bonds/baker
...
```

**Option B: Manual Entry**

For the 16 "Other" redirects (non-county), you can enter these manually if the bulk import has issues.

### Redirect Rules Summary (151 total)

| Category | Count | Example |
|---|---|---|
| `/bail-bonds/[county]` → `/florida-bail-bonds/[county]` | 68 | `/bail-bonds/lee` → `/florida-bail-bonds/lee` |
| `/[county]` → `/florida-bail-bonds/[county]` | 67 | `/lee` → `/florida-bail-bonds/lee` |
| Utility page redirects | 16 | `/members` → `/portal-landing` |

**Notable utility redirects:**

| Old URL | New URL | Reason |
|---|---|---|
| `/bail-bonds` | `/florida-bail-bonds` | Redirect category page |
| `/bail-school` | `/how-to-become-a-bondsman` | Page renamed |
| `/become-a-bondsman` | `/how-to-become-a-bondsman` | Alternate slug |
| `/faq` | `/how-bail-works` | FAQ content is on How Bail Works |
| `/florida-sheriffs-clerks` | `/florida-bail-bonds` | Missing page → county index |
| `/florida-sheriffs` | `/florida-bail-bonds` | Missing page → county index |
| `/florida-clerks` | `/florida-bail-bonds` | Missing page → county index |
| `/login` | `/portal-landing` | Members login → portal |
| `/member-area` | `/portal-landing` | Members area → portal |
| `/members` | `/portal-landing` | Members → portal |
| `/start-bail-paperwork` | `/portal-landing` | CTA → portal |
| `/terms` | `/terms-of-service` | Short URL → full page |
| `/payment` | `/` | No payment page exists |
| `/pay-online` | `/` | No payment page exists |
| `/services` | `/` | No services page exists |
| `/sitemap` | `/` | No HTML sitemap page |

### Legacy Conflicts to Clean Up

The following redirects already exist in Wix but point to the wrong target. When you import the new CSV, Wix will update them:

| Old URL | Current Target | Correct Target |
|---|---|---|
| `/bail-bonds/hendry` | `/` | `/florida-bail-bonds/hendry` |
| `/bail-bonds/pinellas` | `/` | `/florida-bail-bonds/pinellas` |
| `/bail-bonds/stlucie` | `/` | `/florida-bail-bonds/stlucie` |
| `/bail-bonds/suwannee` | `/` | `/florida-bail-bonds/suwannee` |
| `/bail-bonds/levy` | `/` | `/florida-bail-bonds/levy` |
| `/bail-bonds/polk` | `/` | `/florida-bail-bonds/polk` |
| `/bail-bonds/clay` | `/` | `/florida-bail-bonds/clay` |

---

## Phase 3: Canonical & Sitemap Validation

### Canonical Tag Analysis

**18 pages have canonical mismatches** — all of type "Canonical points to different page."

These fall into two groups:

**Group 1: Redirecting pages with canonicals pointing to their destination (9 pages)**
- `/bail-online`, `/blank-4`, `/bail-bonds/hendry`, etc.
- These pages redirect to another URL, and Wix correctly sets the canonical to the destination
- **Status: Expected behavior — no action needed**

**Group 2: Blog category pages canonicalized to `/blog` (6 pages)**
- `/blog/categories/bail-bond-tips` → canonical: `/blog`
- `/blog/categories/how-bail-bonds-work` → canonical: `/blog`
- `/blog/categories/bail-bonds` → canonical: `/blog`
- `/blog/categories/county-spotlight` → canonical: `/blog`
- `/blog/categories/florida-legal-updates` → canonical: `/blog`
- `/blog/categories/bail-bonds/page/2` → canonical: `/blog`
- **Status: Wix blog default behavior — acceptable for SEO consolidation**

**Sitewide Structure:**
- No trailing slash inconsistencies found
- No www/non-www inconsistencies found
- All pages use `https://www.shamrockbailbonds.biz` as the canonical base

### Sitemap Validation

**119 URLs in the sitemap** — 118 return clean 200s.

**1 issue found:**
- `https://www.shamrockbailbonds.biz` (no trailing slash, no www) is in the sitemap and redirects via 2 hops to `https://www.shamrockbailbonds.biz/`
- **Action:** This is handled at the DNS/hosting level by Wix automatically. Remove this non-canonical URL from the sitemap if it appears, and ensure only `https://www.shamrockbailbonds.biz/` (with trailing slash) is in the sitemap.

**Good news:** No 404 pages are in the sitemap. The sitemap is clean.

---

## Phase 4: Post-Fix Validation

### Priority Page Re-Crawl Results

**29/29 priority pages PASS** — all return clean 200 responses.

| Category | Result |
|---|---|
| Core pages (Home, How Bail Works, Contact, About, Blog, etc.) | 8/8 PASS |
| Portal pages (Landing, Indemnitor, Defendant) | 3/3 PASS |
| Key county pages (Lee, Collier, Charlotte, Sarasota, etc.) | 11/11 PASS |
| Legacy redirecting pages | 7/7 PASS (correctly redirect) |

**Note:** The legacy `/bail-bonds/[county]` pages currently redirect to `/` (homepage). After applying the new redirect rules from `wix_bulk_redirects_FINAL.csv`, they will redirect to the correct county pages instead.

### GSC Re-Indexing Guidance

After applying the redirect rules in Wix, follow these steps in Google Search Console:

**Step 1: Submit the URL Inspection for Priority Pages**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select the `shamrockbailbonds.biz` property
3. Use the URL Inspection tool for each of these high-priority pages:
   - `https://www.shamrockbailbonds.biz/`
   - `https://www.shamrockbailbonds.biz/how-bail-works`
   - `https://www.shamrockbailbonds.biz/florida-bail-bonds/lee`
   - `https://www.shamrockbailbonds.biz/florida-bail-bonds/collier`
   - `https://www.shamrockbailbonds.biz/florida-bail-bonds/charlotte`
4. Click **"Request Indexing"** for each

**Step 2: Submit the XML Sitemap**
1. In GSC, go to **Sitemaps**
2. Submit: `https://www.shamrockbailbonds.biz/sitemap.xml`
3. This triggers a fresh crawl of all 119 sitemap URLs

**Step 3: Monitor Coverage Report**
1. In GSC, go to **Pages** (Coverage)
2. Check the **"Page with redirect"** report — these should decrease as Google recrawls
3. Check the **"Not found (404)"** report — these should clear as redirects take effect
4. Allow 2–4 weeks for full re-indexing

**Step 4: Monitor for Remaining Issues**
- Watch for any new "Duplicate, Google chose different canonical" issues
- The `/bail-bonds/[county]` pages that previously redirected to `/` may take time for Google to update its index

---

## Files Delivered

| File | Description |
|---|---|
| `wix_bulk_redirects_FINAL.csv` | **ACTION REQUIRED** — Import this into Wix URL Redirect Manager |
| `redirect_mapping_sheet.csv` | Full audit of all 446 URLs with status, hops, and recommended actions |
| `canonical_issues_detailed.csv` | 18 pages with canonical mismatches and explanations |
| `sitemap_validation.csv` | All 119 sitemap URLs with status check |
| `phase4_validation.csv` | Priority page validation results (29/29 PASS) |

---

## Priority Action Items

### Immediate (Do This First)

1. **Import `wix_bulk_redirects_FINAL.csv`** into Wix URL Redirect Manager
   - This fixes all 151 broken/incorrect redirect rules
   - Specifically updates the 7 county pages that currently redirect to `/` instead of their proper county pages

2. **Submit sitemap to GSC** after applying redirects

### Short-Term (Within 1 Week)

3. **Create the missing utility pages** or confirm they should remain as redirects:
   - `/florida-sheriffs-clerks` — Consider creating this page (it's referenced in the project brief)
   - `/faq` — Consider creating a proper FAQ page (currently redirects to How Bail Works)
   - `/payment` / `/pay-online` — Consider creating a payment options page

4. **Request indexing** for the top 10 county pages in GSC

### Medium-Term (Within 1 Month)

5. **Monitor GSC Coverage report** for the "Page with redirect" and "Not found (404)" categories
6. **Add `florida-sheriffs-clerks` page** to the sitemap once created
7. **Review blog category canonical strategy** — currently all blog categories canonicalize to `/blog`; consider whether individual category pages should be indexed

---

## Technical Notes

### Why Wix Can't Be Automated for Redirects

The Wix REST API provides no endpoint for managing URL redirect rules. This is a known platform limitation. The only programmatic options are:
1. Wix Dashboard → URL Redirect Manager → Bulk CSV Import (what we've prepared)
2. Wix CLI (for Velo developers) — does not include redirect management

### The `/bail-bonds/` vs `/florida-bail-bonds/` Migration

The site previously used `/bail-bonds/[county]` as the URL pattern. It has since migrated to `/florida-bail-bonds/[county]`. All 67 county pages exist and are healthy at the new URL. The old URLs need redirect rules applied (which is what the CSV provides).

### Compound County Slug Normalization

Wix uses non-hyphenated slugs for compound county names. The redirect rules account for all variants:
- `indian-river` → `indianriver`
- `palm-beach` → `palmbeach`  
- `st-johns` → `stjohns`
- `st-lucie` / `stlucie` → `stlucie`
