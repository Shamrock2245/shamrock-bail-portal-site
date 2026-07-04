# Dynamic County Page SEO Template

**Date:** July 4, 2026  
**Author:** Manus AI  

## 1. Overview

To scale Shamrock Bail Bonds across all 67 Florida counties, we utilize a dynamic page template powered by Wix CMS. This ensures that every county page is highly relevant, locally optimized, and structurally sound for search engines without requiring manual creation of 67 individual pages.

This document outlines the required structure, meta tags, and schema for the dynamic county template.

## 2. URL Structure

The URL must follow a clean, predictable, and localized pattern:
`https://www.shamrockbailbonds.biz/florida-bail-bonds/[county-slug]`

*Example:* `https://www.shamrockbailbonds.biz/florida-bail-bonds/lee-county`

## 3. Dynamic Meta Tags

Meta tags must be generated dynamically based on the CMS data for each county. These are injected via the `seo-helper.jsw` module.

| Tag | Dynamic Pattern | Example Output |
|---|---|---|
| **Title** | `Bail Bonds in [County Name] \| Shamrock Bail Bonds` | `Bail Bonds in Lee County \| Shamrock Bail Bonds` |
| **Description** | `Fast, reliable bail bonds in [County Name], Florida. 24/7 service, no collateral needed for most cases. Call (239) 332-2245 now.` | `Fast, reliable bail bonds in Lee County, Florida. 24/7 service...` |
| **Canonical** | `https://www.shamrockbailbonds.biz/florida-bail-bonds/[county-slug]` | `https://www.shamrockbailbonds.biz/florida-bail-bonds/lee-county` |

## 4. On-Page Content Structure

The on-page content must mix static template text with dynamic CMS variables to create a localized experience.

### H1: Main Heading
`24/7 Bail Bonds in [County Name], Florida`

### Introduction
*When a loved one is arrested in [County Name], you need fast, reliable help. Shamrock Bail Bonds provides 24/7 service to secure quick release from the [County Name] Jail. Call our local agents now at (239) 332-2245.*

### H2: [County Name] Jail & Court Information
This section must pull data from the `Florida_SheriffsandClerksDirectory` dataset.
*   **Sheriff's Office:** [Link to Sheriff Website]
*   **Clerk of Court:** [Link to Clerk Website]
*   **Inmate Search:** [Link to local inmate search]

### H2: How Bail Works in [County Name]
Brief explanation of the local process, referencing the 10% Florida statutory premium.

## 5. Dynamic JSON-LD Schema

Every county page must inject a localized `LocalBusiness` schema. This is handled by the `generateCountySchemas` function in `seo-helper.jsw`.

Key dynamic fields in the schema:
*   **`name`**: `Shamrock Bail Bonds — [County Name]`
*   **`url`**: The specific county page URL.
*   **`areaServed`**: `[County Name], Florida`
*   **`geo`**: If specific coordinates for the county jail/courthouse are available in the CMS, use them; otherwise, fallback to the Fort Myers HQ coordinates.

## 6. Internal Linking Strategy

To ensure search engines discover and rank all 67 county pages:
1.  **Global Footer:** Include a "Service Areas" or "Counties Served" section linking to the main `/florida-bail-bonds` directory.
2.  **Directory Page:** The `/florida-bail-bonds` page must contain a clean, alphabetized HTML list of links to all 67 county pages.
3.  **Cross-Linking:** When a blog post or informational page mentions a specific county, it must link to that county's dynamic page.
