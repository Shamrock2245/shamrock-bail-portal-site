# Shamrock Bail Bonds — Structured Data Specification

**Date:** July 4, 2026  
**Author:** Manus AI  

## 1. Overview

Structured data (JSON-LD) is the foundation of our Generative Engine Optimization (GEO) strategy. By explicitly defining entities, relationships, and services, we ensure that Google, Bing, and AI search engines accurately understand Shamrock Bail Bonds' offerings and service areas.

This specification outlines the schema types implemented across the site, managed centrally via `src/public/seoUtils.js` and `src/backend/seo-helper.jsw`.

## 2. Global Schema (Injected on All Public Pages)

The `initGlobalSEO()` function in `seoUtils.js` injects the following schemas on every public page (excluding `/portal-*` routes).

### 2.1 Organization & ProfessionalService
These schemas define the core business entity. We use `ProfessionalService` as it is more specific than `LocalBusiness` and often ranks higher for service-based queries.

*   **Key Properties:**
    *   `name`: Shamrock Bail Bonds, LLC
    *   `telephone`: +12393322245
    *   `areaServed`: Array of Florida regions (Southwest, Southeast, Central, etc.)
    *   `serviceArea`: GeoCircle with a 300-mile radius from Fort Myers, covering the entire state.
    *   `hasOfferCatalog`: Detailed list of services (Surety Bonds, Emergency Bonds, Immigration Bonds).
    *   `knowsAbout`: Extensive list of semantic keywords (e.g., "Bail Near Me", "Florida Statute Chapter 648").

### 2.2 WebSite
Enables the Google Sitelinks Search Box and defines the site structure.
*   **Key Properties:**
    *   `potentialAction`: SearchAction linking to `/search?q={search_term_string}`.

### 2.3 WebPage
Defines the current page context and links it back to the `Organization` and `WebSite` entities.

## 3. Page-Specific Schemas

Certain pages receive additional, specialized schema to enhance their specific search results.

### 3.1 Dynamic County Pages (`LocalBusiness` & `BreadcrumbList`)
Generated via `generateCountySchemas()` in `seo-helper.jsw`.
*   **Purpose:** Localizes the business entity for specific county searches.
*   **Key Properties:**
    *   `name`: Shamrock Bail Bonds — [County Name]
    *   `areaServed`: [County Name], Florida
    *   `url`: The specific county URL.

### 3.2 Informational Pages (`FAQPage`)
Injected on pages like `/how-bail-works` and the homepage.
*   **Purpose:** Captures "People Also Ask" snippets and provides direct answers for voice/AI search.
*   **Key Properties:**
    *   Array of `Question` and `Answer` objects based on Florida bail statutes and processes.

### 3.3 Blog Posts (`Article`)
Generated via `generateArticleSchema()` in `seoUtils.js`.
*   **Purpose:** Enhances visibility in Google Discover and article carousels.
*   **Key Properties:**
    *   `headline`, `image`, `datePublished`, `author` (Organization).

## 4. Maintenance and Updates

All schema generation relies on the constants defined in `src/backend/seoConfig.js`. 
*   **Do not hardcode NAP data** in schema generators.
*   If new services are added, update the `hasOfferCatalog` array in `seoUtils.js`.
*   If new FAQs are added to the site, ensure they are wrapped in the `generateFAQSchema()` utility.
