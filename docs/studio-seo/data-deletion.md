# SEO Specification: Data Deletion Page

> **Canonical URL:** `https://www.shamrockbailbonds.biz/data-deletion`  
> **Target Page Type:** `legal`  
> **Robots Directive:** `noindex, follow`  
> **Brand Policy:** Title ends with `| Shamrock Bail Bonds` (< 60 chars). Self-referencing canonical.

---

## 1. Metadata Blueprint

| Field | Value | Notes & Length |
|---|---|---|
| **Page Title** | `Data Deletion Request | Shamrock Bail Bonds` | 43 characters (target < 60) |
| **Meta Description** | `Request deletion or review of your personal information held by Shamrock Bail Bonds in compliance with applicable privacy regulations.` | 134 characters (target 140–160) |
| **H1 Headline** | `Data Deletion & Privacy Rights Request` | Exactly 1 per page |
| **Robots** | `noindex, follow` | Public pages index; portal/retire noindex |
| **Canonical URL** | `https://www.shamrockbailbonds.biz/data-deletion` | Self-referencing |
| **Open Graph Title** | `Data Deletion Request | Shamrock Bail Bonds` | Matches page title |
| **Open Graph Description** | `Request deletion or review of your personal information held by Shamrock Bail Bonds in compliance with applicable privacy regulations.` | Matches meta description |
| **Open Graph Image** | `https://www.shamrockbailbonds.biz/logo.png` | 1200 x 630 WebP/PNG brand banner |
| **Open Graph Type** | `website` | Standard open graph type |

---

## 2. Keywords & Search Intent

- **Primary Target Keyword:** `data deletion request Shamrock Bail Bonds`
- **Secondary Terms:** `privacy rights request Florida bail agency`
- **Search Intent:** Compliance and account rights. This is not a sales page.
- **Why This Beats Live:** Preserves exact historical rankings while upgrading E-E-A-T signals, replacing outdated phone numbers, ensuring 100% brand consistency, and adding rich structured data.

---

## 3. Heading Structure & Content Outline

- **H1:** `Data Deletion & Privacy Rights Request`
  - **H2:** `Your Privacy Rights`
  - **H2:** `Statutory Record Retention Requirements Under Florida Law`
  - **H2:** `Submitting a Data Deletion Request`
  - **H2:** `Verification and Timeline for Processing`

---

## 4. Internal Link Architecture

- **Inbound Links From:** Homepage Hero, Footer Directory, County Hub (`/florida-bail-bonds-1`), Navigation Menu.
- **Outbound Links To:**
  - Homepage (`/`)
  - How Bail Works (`/how-bail-works`)
  - Contact Us (`/contact`)
  - Client Portal (`/portal-landing`)
  - Tel Links: `tel:+12393322245`, `tel:+17272952245`
  - SMS Link: `sms:+12399550178`

---

## 5. Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "LocalBusiness", "LegalService"],
      "@id": "https://www.shamrockbailbonds.biz/#organization",
      "name": "Shamrock Bail Bonds",
      "legalName": "Shamrock Bail Bonds, LLC",
      "founder": {
        "@type": "Person",
        "name": "Brendan O'Neal"
      },
      "foundingDate": "2012",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1528 Broadway",
        "addressLocality": "Fort Myers",
        "addressRegion": "FL",
        "postalCode": "33901",
        "addressCountry": "US"
      },
      "telephone": "+1-239-332-2245",
      "email": "admin@shamrockbailbonds.biz",
      "url": "https://www.shamrockbailbonds.biz",
      "areaServed": {
        "@type": "State",
        "name": "Florida"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "17:00",
          "description": "Office walk-in hours"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59",
          "description": "24/7 emergency dispatch phone & text lines"
        }
      ]
    }
  ]
}
```
