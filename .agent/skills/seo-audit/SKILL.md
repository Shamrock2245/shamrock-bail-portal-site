---
name: seo-audit
description: Comprehensive SEO audit skill for Shamrock Bail Bonds site. Runs PageSpeed Insights, analyzes structured data, checks meta tags, validates schema markup, and produces actionable optimization reports.
---

# SEO Audit Skill

> Run comprehensive SEO audits on shamrockbailbonds.biz and produce actionable reports.

## When to Use
- Before deploying significant site changes
- After publishing new pages or content
- Monthly SEO health checks
- When investigating traffic drops
- After Google algorithm updates

## Audit Workflow

### Step 1: Run PageSpeed Insights
```
1. Navigate to https://pagespeed.web.dev/
2. Enter the target URL
3. Run both Mobile and Desktop audits
4. Record all 4 category scores: Performance, SEO, Accessibility, Best Practices
5. Record Core Web Vitals: FCP, LCP, TBT, CLS, SI
```

### Step 2: Validate Structured Data
```
1. Navigate to https://search.google.com/test/rich-results
2. Enter the target URL
3. Check for valid structured data types:
   - LocalBusiness
   - FAQPage
   - Service
   - BreadcrumbList
   - Organization
4. Record any errors or warnings
```

### Step 3: Check Meta Tags
Using browser DOM inspection or fetch:
- `<title>` — exists, ≤60 chars, includes primary keyword
- `<meta name="description">` — exists, ≤160 chars, compelling
- `<meta name="robots">` — not blocking indexing
- `<link rel="canonical">` — correct URL
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags

### Step 4: Check Sitemap & Crawlability
```
1. Fetch /sitemap.xml or /pages-sitemap.xml
2. Verify all critical pages are included
3. Check robots.txt for accidental blocks
4. Verify county pages appear in sitemap
```

### Step 5: Compile Report
Generate a report with:
- Score summary table (4 categories × pages audited)
- Critical Web Vitals table
- What's working well (green flags)
- Actionable fixes (prioritized by impact)
- AI/GEO SEO recommendations
- Score targets

## Shamrock-Specific Checks

### County Pages (67 total)
- [ ] Each county slug resolves correctly
- [ ] Title follows pattern: `{County} County Bail Bonds | 24/7 Jail Release – Shamrock`
- [ ] H1 is unique and includes county name
- [ ] FAQs render correctly with accordion
- [ ] Schema markup includes LocalBusiness + FAQPage + Service
- [ ] SpeakableSpecification targets first 2 content sections

### Homepage
- [ ] Primary CTA visible above fold
- [ ] Phone number is click-to-call
- [ ] LocalBusiness schema with correct NAP
- [ ] Service areas listed

### Blog
- [ ] Each post has `datePublished` and `author`
- [ ] Articles include `Article` schema
- [ ] Internal links to relevant county pages

## Score Thresholds

| Score | Grade | Action |
|---|---|---|
| 95+ | A | Maintain, monitor monthly |
| 85-94 | B | Polish, optimize images/fonts |
| 70-84 | C | Moderate fixes needed |
| 50-69 | D | Major intervention required |
| <50 | F | Emergency — fix immediately |

## Baseline Scores (April 2, 2026)

| Page | Perf (M) | Perf (D) | SEO | A11y | BP |
|---|---|---|---|---|---|
| Homepage | 49 | 56 | 92 | 100 | 96 |
| Lee County | 55 | 65 | 100 | 100 | 96 |
