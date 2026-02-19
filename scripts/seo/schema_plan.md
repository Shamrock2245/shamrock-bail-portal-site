# Rich Results Schema Implementation Plan

This document outlines the strategy for implementing structured data (JSON-LD) across the Shamrock Bail Bonds website to achieve rich results in Google Search.

## 1. URL List & Page Categories

We have identified 119 unique, indexable URLs from the live sitemap, categorized as follows:

| Page Category | URL Count | Schema Priority |
|---|---|---|
| **Static Pages** | 9 | High |
| **County Pages** | 67 | Critical |
| **Blog Posts** | 36 | Medium |
| **Blog Categories** | 5 | Low |

## 2. Schema Strategy by Page Type

We will use the existing templates in `/seo/schema-templates.json` as a foundation and expand upon them.

### 2.1 Homepage (`/`)

- **`Organization`**: Already well-defined in the template. This establishes the primary entity.
- **`LocalBusiness`**: Critical for local SEO. We will ensure this is fully populated on the homepage.
- **`WebSite`**: To enable the Sitelinks Search Box.

### 2.2 County Pages (`/florida-bail-bonds/{county}`)

These are the most critical pages for local conversions and SEO.

- **`LocalBusiness`**: A unique `LocalBusiness` schema will be generated for *each* county page.
    - The `name` will be modified to "Shamrock Bail Bonds in {County Name}".
    - The `description` will be tailored to mention services in that specific county.
    - `areaServed` will be set to the specific county, e.g., `{"@type": "AdministrativeArea", "name": "Collier County"}`.
- **`Service`**: The existing `Service` schema will be included, reinforcing the offerings.
- **`BreadcrumbList`**: Essential for showing page hierarchy in search results. The template will be used, e.g., `Home > Florida Bail Bonds > Collier County`.
- **`FAQPage`**: We will add an `FAQPage` schema to answer common questions related to getting bail in that specific county. This is a high-impact way to get rich results.

### 2.3 Blog Posts (`/single-post/{slug}`)

- **`BlogPosting` / `Article`**: Each blog post will have this schema.
    - `headline`, `datePublished`, `dateModified`, `author`, and `image` will be dynamically populated.
    - We will add `author` information to build authority.

### 2.4 Static Pages

- **`/how-bail-works` & `/how-to-become-a-bondsman`**: These will use the **`HowTo`** schema. This provides a step-by-step rich result that is highly engaging.
- **`/contact`**: Will use `ContactPage` schema in addition to the main `LocalBusiness` schema.
- **`/testimonials`**: Each testimonial will be marked up with individual **`Review`** schema, nested within the main page schema.

## 3. Next Steps

1.  **Generate JSON-LD**: Create a script to generate the specific JSON-LD for each of the 119 URLs based on this plan.
2.  **Inject Schema**: Use Wix Velo to dynamically inject the correct JSON-LD into the `<head>` of each page.
3.  **Bulk Indexing**: Submit all 119 URLs to the Google Indexing API.
