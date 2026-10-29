# 🚀 Wix Studio Cutover & Zero-Loss Launch Runbook

> **Site:** `shamrockbailbonds.biz` (`a00e3857-675a-493b-91d8-a1dbc5e7c499`)  
> **Target Branch:** "Wix studio version" (`12e252e4-45a8-4bcc-840b-64d4edbdcaa4`)  
> **Objective:** Execute seamless cutover from Editor to Wix Studio with ZERO search ranking loss, zero broken links, and zero redirect loops.  
> **Status:** PRE-CUTOVER. Redirects, specs, and page drafts are prepared. A county street address is ready for the facility card only when `docs/studio-content/county-official-sources.json` has a sourced street. An empty address is not a placeholder to publish.

---

## 🛑 Pre-Flight Non-Negotiables
1. **Never merge the Studio branch into live** until this checklist is executed in exact chronological order.
2. **Never delete or unpublish live blog posts or CMS collections** without written sign-off from Brendan O'Neal.
3. **Keep Google Apps Script Web App URL stable** (`AKfycbx...`). Do not create new deployments unless authorized.
4. **Ring group integrity**: Phone line `239-955-0301` remains in the internal transfer ring (`239-332-2245`, `239-955-0301`, `239-955-0178`, `239-955-0314`); it is retired ONLY from public customer-facing copy in favor of Spanish line `727-295-2245`.

---

## 📋 Chronological Cutover Checklist

### Stage 1: Pre-Publish (Wix Dashboard)
- [ ] **1.1 Import 301 Redirects in URL Redirect Manager**
  - Navigate to: **Wix Dashboard → Marketing & SEO → URL Redirect Manager**.
  - Click **Upload CSV** / **Group 301 Redirects**.
  - Upload `docs/studio-cutover-redirects.csv` (**194 redirect rows**). Columns stay `Old URL`, `New URL`.
  - The URL map `docs/studio-cutover-url-map.csv` has **434 URL map rows**. Per-row notes live in its `reason` column. The Wix import file has no notes column, so the notes below are the import instructions.
  - **67 county-suffix 301s:** `/bail-bonds/{slug}-county` → `/florida-bail-bonds/{slug}`. Slugs are `FLORIDA_COUNTY_SLUGS` from `DASHBOARD_URL_REDIRECTS` in `src/backend/seo-redirects.js`, matching the live `/florida-bail-bonds/{slug}` county pages.
  - `/how-to-become-a-bondsman` and `/become-a-bondsman` keep the anchor target `/bail-school#become-a-bondsman`. **FALLBACK: use /bail-school if Wix Redirect Manager rejects the fragment.**
  - `/home` and `/portal-staff`: remove page at publish time (Brendan publishes). The `/portal-staff` → `/portal-landing` 301 stays. The `/faq` → `/how-bail-works` 301 stays as is.
  - `/my-orders` → `/myorders` is an unmapped target to verify. Do not guess a new target.
  - `/espanol`, `/spanish`, `/make-a-payment`, and `/payment` stay `TODO-VERIFY` in the URL map and are not in the import file.
  - Before upload, run `node scripts/test_studio_cutover_redirects.mjs` (no duplicate sources, every import target starts with `/`, row count is 194).
  - Verify all redirects show active status with 0 errors.
  - Confirm: `/florida-bail-bonds` → `/florida-bail-bonds-1` is present.
  - Confirm: `/portal-staff` → `/portal-landing` is present.
- [ ] **1.2 Verify Studio URL Slugs & Settings**
  - Ensure all Studio pages match exact paths from `docs/studio-cutover-url-map.csv`.
  - Blog post prefix: verify `/single-post/{slug}` is configured in Studio Blog settings.
  - County dynamic collection: verify collection slug field is `County Slug` (`/florida-bail-bonds/{County Slug}`).
  - Verification tags: verify Google, Bing, Yandex meta tags match `docs/seo-baseline/verification-and-tracking.json`.
- [ ] **1.3 Audit Internal Links in Canvas**
  - Verify Grok Bot has resolved all canvas internal links per `docs/studio-internal-links-to-fix.md`.
  - Confirm no internal buttons or text links point to old redirects.

---

### Stage 2: The Cutover Event
- [ ] **2.1 Publish Wix Studio Branch**
  - In Wix Studio Editor: click **Publish** on the "Wix studio version" branch.
  - Confirm custom domain `www.shamrockbailbonds.biz` is mapped and active.
- [ ] **2.2 Run Automated Post-Cutover Smoke Test**
  - Run from repo root:
    ```bash
    ./scripts/studio_cutover_smoke.sh
    ```
  - The script restores `docs/seo-baseline/live-2026-10-23.json` and `.csv` when they are not in the working tree. That restore reads the preserved 2026-10-23 crawl from `origin/cursor/studio-cutover-crawl-snapshot-4fc0` (PR #76) or from commit `a15f039` on this branch. It does not crawl the live site again. Do not commit the restored files onto this SEO branch.
  - Verify 0 HTTP 4xx errors, 0 5xx errors, 0 redirect chains, and 0 catch-all redirects to `/`.
  - Inspect generated diff: `docs/seo-baseline/post-cutover-diff.csv`.
  - Confirm no accidental `noindex` flags on public pages.
- [ ] **2.3 Google Business Profile & Key Surface Verification**
  - Test live URL on Google Business Profile link: ensure `https://www.shamrockbailbonds.biz/` loads 200 OK.
  - Test primary contact buttons:
    - Call English `239-332-2245`
    - Call Spanish `727-295-2245`
    - Text `239-955-0178`
    - Start Online portal link

---

### Stage 3: Immediate Post-Launch SEO Actions (Day 1)
- [ ] **3.1 Google Search Console Resubmission**
  - Log into GSC for `https://www.shamrockbailbonds.biz/`.
  - Submit sitemap index: `https://www.shamrockbailbonds.biz/sitemap.xml`.
  - Request priority indexing for Top 20 Protected Pages:
    1. `https://www.shamrockbailbonds.biz/` (Home)
    2. `https://www.shamrockbailbonds.biz/about`
    3. `https://www.shamrockbailbonds.biz/how-bail-works`
    4. `https://www.shamrockbailbonds.biz/contact`
    5. `https://www.shamrockbailbonds.biz/first-appearance`
    6. `https://www.shamrockbailbonds.biz/bail-school`
    7. `https://www.shamrockbailbonds.biz/florida-bail-bonds-1` (County Hub)
    8. `https://www.shamrockbailbonds.biz/florida-bail-bonds/lee` (Core SWFL)
    9. `https://www.shamrockbailbonds.biz/florida-bail-bonds/collier`
    10. `https://www.shamrockbailbonds.biz/florida-bail-bonds/charlotte`
    11. `https://www.shamrockbailbonds.biz/florida-bail-bonds/sarasota`
    12. `https://www.shamrockbailbonds.biz/florida-bail-bonds/manatee`
    13. `https://www.shamrockbailbonds.biz/florida-bail-bonds/hendry`
    14. `https://www.shamrockbailbonds.biz/florida-bail-bonds/desoto`
    15. `https://www.shamrockbailbonds.biz/florida-bail-bonds/fort-myers`
    16. `https://www.shamrockbailbonds.biz/florida-bail-bonds/cape-coral-pd`
    17. `https://www.shamrockbailbonds.biz/florida-bail-bonds/lee-county-jail`
    18. `https://www.shamrockbailbonds.biz/testimonials`
    19. `https://www.shamrockbailbonds.biz/terms-and-conditions`
    20. `https://www.shamrockbailbonds.biz/privacy-policy`
- [ ] **3.2 Bing Webmaster Tools Resubmission**
  - Run Bing submission script or manual URL submission in Bing Webmaster Tools.

---

### Stage 4: Ongoing Monitoring Cadence
- **Days 1–14 (Daily):**
  - Check GSC **Page indexing** report for any sudden 404 spikes or "Crawled - currently not indexed".
  - Monitor live server logs / Wix analytics for error spikes.
  - Review incoming lead forms in `shamrock-leads` Super CRM to verify CRM intake pipeline is 100% healthy.
- **Weeks 3–8 (Weekly):**
  - Check keyword ranking positions for target SWFL bail terms.
  - Verify impressions and clicks curve remains stable or grows.
  - Unpublish duplicate blog posts in batches AFTER 301 redirects show indexation in GSC.

---

## 🔄 Emergency Rollback Plan
If critical platform breakage occurs upon publishing:
1. Open Wix Site History in Dashboard: **Settings → Site History**.
2. Locate the previous production version (the live Editor branch).
3. Click **Restore & Publish**.
4. The site immediately reverts to the pre-cutover state.
