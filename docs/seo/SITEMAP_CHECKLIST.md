# Shamrock Bail Bonds — Sitemap & Indexing Checklist

**Date:** July 4, 2026  
**Author:** Manus AI  

## 1. Overview

Proper sitemap configuration and indexing control are crucial for ensuring that search engines crawl the correct pages while ignoring internal portal routes. This checklist outlines the requirements for the `sitemap.xml`, `robots.txt`, and Google Search Console configuration.

## 2. Robots.txt Configuration

The `robots.txt` file must explicitly allow crawling of public pages while blocking all portal, admin, and dynamic search routes.

**Required Directives:**
```text
User-agent: *
Allow: /
Disallow: /portal-*
Disallow: /admin*
Disallow: /search*
Disallow: /*?*

Sitemap: https://www.shamrockbailbonds.biz/sitemap.xml
```

## 3. Sitemap Inclusion Rules

The `sitemap.xml` (or Wix's dynamic sitemap equivalent) must adhere to the following inclusion/exclusion rules.

### 3.1 Pages to INCLUDE (Index)
*   `/` (Homepage)
*   `/contact`
*   `/how-bail-works`
*   `/become-bondsman`
*   `/first-appearance`
*   `/florida-bail-bonds` (Main directory)
*   `/florida-bail-bonds/*` (All 67 dynamic county pages)
*   `/blog`
*   `/blog/*` (All published posts)
*   `/privacy-policy`
*   `/terms-and-conditions`

### 3.2 Pages to EXCLUDE (Noindex)
These pages must **not** appear in the sitemap and must contain a `<meta name="robots" content="noindex, nofollow">` tag.
*   `/portal-landing`
*   `/portal-defendant`
*   `/portal-indemnitor`
*   `/portal-staff`
*   Any lightbox or hidden utility page (e.g., `ConsentLightbox`, `IdUploadLightbox`)
*   `/search-results`

## 4. Google Search Console Checklist

Upon deployment, the following actions must be taken in Google Search Console (GSC):

- [ ] **Submit Sitemap:** Submit the primary `sitemap.xml` URL.
- [ ] **Verify Indexing:** Check the "Pages" report to ensure the 67 dynamic county pages are being discovered and indexed.
- [ ] **Check Exclusions:** Verify that `/portal-*` pages are listed as "Excluded by 'noindex' tag".
- [ ] **Rich Results Test:** Run the URL Inspection tool on a county page and the homepage to verify that the `ProfessionalService`, `LocalBusiness`, and `FAQPage` schemas are detected without errors.
- [ ] **Monitor Core Web Vitals:** Ensure mobile usability passes, as mobile traffic is the primary driver for emergency bail queries.
