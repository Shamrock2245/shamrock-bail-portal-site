# Google Search Console — Full Indexability Playbook

**Updated:** 2026-08-06  
**Site:** https://www.shamrockbailbonds.biz  
**Goal:** Make every *public* URL crawlable and eligible for indexing; keep private portal pages out of the index.

---

## 1. What we found (live audit)

| Signal | Finding | Impact |
|--------|---------|--------|
| **Homepage** | `index,follow` + canonical ✅ | OK |
| **County pages** | 70 URLs in dynamic Wix sitemap; `index,follow` ✅ | Discoverable |
| **Blog** | 105 posts in blog sitemap ✅ | Discoverable |
| **Wix `pages-sitemap.xml`** | Only **13** static URLs | Incomplete for static set |
| **Private pages in sitemap** | `/portal-landing`, `/communication-preferences`, `/data-deletion` listed | Inflates “Excluded / noindex / crawled not indexed” |
| **`/first-appearance`** | Live title was **`500 \| Shamrock Bail Bonds`** | **Critical** — custom router page name mismatch; hub page code is **`first-appearance.h4fpl.js`** (full file). Wrong `ok('…')` name → 500 and h4fpl never runs |
| **Custom sitemap** | `/_functions/sitemap` works but was **Disallowed** by `robots.txt` | Google ignored supplemental sitemap |
| **Googlebot** | Not blocked by `User-agent: *` | OK |

### Why GSC says “most pages not indexed”

Google often reports large “Not indexed” totals that mix:

1. **Valid exclusions** — noindex portal pages (good).  
2. **Sitemap pollution** — private URLs submitted then excluded.  
3. **Quality deferrals** — “Crawled – currently not indexed” / “Discovered – currently not indexed” (common for thin/duplicate/new pages).  
4. **Broken/soft-error URLs** — e.g. first-appearance 500 title.  
5. **Duplicate / alternate canonical** — multiple near-identical blog posts.

This is **not** usually “Google can’t see the site.” The homepage + counties + blog are crawlable; many URLs are either intentionally private or deferred.

---

## 2. Code fixes shipped (this repo)

| Fix | File |
|-----|------|
| Repair first-appearance router page names (stop 500) | `src/backend/first-appearance-router.js` |
| Add `first_appearance_SiteMap` for hub + 67 counties | same + `routers.js` |
| Expand public XML sitemap (static + counties + FA + blog) | `src/backend/http-functions.js` → `get_sitemap` |
| robots.txt: explicit Googlebot Allow; Allow sitemap functions; block private pages | `seo/robots.txt` |
| noindex comm-prefs + data-deletion | page code |

---

## 3. Wix Editor actions (required — cannot do from git alone)

### 3.1 Publish site after code deploy
Publish **main** so Velo router + SEO meta go live.

### 3.2 Fix SEO → robots.txt in Wix
Wix serves robots from **SEO settings**, not always from repo `seo/robots.txt`.

1. **Settings → SEO (Google) → robots.txt Editor** (or SEO Tools).  
2. Paste contents of repo `seo/robots.txt`.  
3. Save + publish.

### 3.3 Hide private pages from search + sitemap
For each page below: **Page settings → SEO → Hide this page from search results** (and “don’t include in sitemap” if shown):

- `/portal-landing`  
- `/portal-defendant`  
- `/portal-indemnitor`  
- `/portal-staff`  
- `/communication-preferences`  
- `/data-deletion`  
- Any lightboxes / blank utility pages  

### 3.4 Ensure public pages are **not** hidden
- `/`, `/how-bail-works`, `/bail-school`, `/first-appearance`, `/contact`, `/about`, `/blog`, `/how-to-become-a-bondsman`, all `/florida-bail-bonds/*`

### 3.5 Refresh Wix dynamic sitemaps
After CMS/county edits: **SEO Tools → Sitemap** → regenerate if available. Confirm:

- `https://www.shamrockbailbonds.biz/sitemap.xml` lists county dynamic sitemap  
- County dynamic sitemap still has ~67–70 URLs  

### 3.6 First Appearance router pages
In **Site Structure → Routers → first-appearance → Pages**, confirm page **names** are exactly:

- Hub: `first-appearance`  
- County template: `first-appearance-page`  

(Code now matches these live titles.)

---

## 4. Google Search Console checklist

1. **Sitemaps → Add** (and keep):  
   - `https://www.shamrockbailbonds.biz/sitemap.xml` (**primary**)  
   - After robots allow: `https://www.shamrockbailbonds.biz/_functions/sitemap`  
   - Optional: `blog-posts-sitemap.xml`, `pages-sitemap.xml`  

2. **URL Inspection** (request indexing) for priority URLs:  
   - `/`  
   - `/how-bail-works`  
   - `/first-appearance` (must show real title, not 500)  
   - `/bail-school`  
   - `/florida-bail-bonds/lee`  
   - `/florida-bail-bonds/collier`  
   - 1–2 recent blog posts  

3. **Pages report** — filter by reason:  
   - “Excluded by ‘noindex’ tag” → should only be portal/private  
   - “Crawled – currently not indexed” → improve uniqueness, internal links, wait  
   - “Discovered – currently not indexed” → strengthen internal links from homepage + blog  
   - “Duplicate without user-selected canonical” → set unique titles/meta; avoid near-duplicate posts  

4. **Remove** from sitemap / noindex any leftover utility URLs still listed as “Submitted URL marked noindex”.

5. **Core Web Vitals / Mobile** — pass mobile usability (bail traffic is mobile-heavy).

---

## 5. Ongoing content / architecture habits

- **One clear canonical** per public URL (already set in Velo for key pages).  
- **Internal links**: homepage + footer → top counties, bail school, first appearance, blog.  
- **Avoid mass near-duplicate blog posts** (many “premium” variants hurt “crawled not indexed”).  
- **Unique H1 + meta** on every county page (generator already does this).  
- **Do not** noindex public marketing pages.  
- After big content drops, re-submit sitemap and inspect 5–10 sample URLs.

---

## 6. Quick verification commands

```bash
# robots + sitemaps
curl -sL https://www.shamrockbailbonds.biz/robots.txt | head -40
curl -sL https://www.shamrockbailbonds.biz/sitemap.xml
curl -sL https://www.shamrockbailbonds.biz/pages-sitemap.xml | grep -c '<loc>'

# first-appearance must NOT title "500"
curl -sL https://www.shamrockbailbonds.biz/first-appearance | grep -o '<title>[^<]*'

# county sample
curl -sL https://www.shamrockbailbonds.biz/florida-bail-bonds/lee | grep -i 'name="robots"'
```

---

## 7. Expected outcome timeline

| Window | Expectation |
|--------|-------------|
| 24–72h after publish + robots update | first-appearance recovers; new sitemap seen |
| 1–2 weeks | more counties/blog posts move to Indexed |
| Ongoing | “Crawled not indexed” shrinks as uniqueness + links improve |

Google never guarantees 100% indexation. Target: **all intentional public URLs eligible and the majority of counties + cornerstone pages indexed**, with private pages cleanly excluded.
