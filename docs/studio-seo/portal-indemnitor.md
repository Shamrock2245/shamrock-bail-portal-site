# SEO Specification: Portal Indemnitor Page

> **Canonical URL:** `https://www.shamrockbailbonds.biz/portal-indemnitor`  
> **Target Page Type:** `portal`  
> **Robots Directive:** `noindex, nofollow`  
> **Brand Policy:** Title ends with `| Shamrock Bail Bonds` (< 60 chars). Self-referencing canonical.

---

## 1. Metadata Blueprint

| Field | Value | Notes & Length |
|---|---|---|
| **Page Title** | `Indemnitor Dashboard | Shamrock Bail Bonds Portal` | 49 characters (target < 60) |
| **Meta Description** | `Indemnitor and cosigner dashboard for Shamrock Bail Bonds clients. Manage payment schedules, review receipts & track defendant court compliance.` | 144 characters (target 140–160) |
| **H1 Headline** | `Indemnitor & Cosigner Dashboard` | Exactly 1 per page |
| **Robots** | `noindex, nofollow` | Public pages index; portal/retire noindex |
| **Canonical URL** | `https://www.shamrockbailbonds.biz/portal-indemnitor` | Self-referencing |
| **Open Graph Title** | `Indemnitor Dashboard | Shamrock Bail Bonds Portal` | Matches page title |
| **Open Graph Description** | `Indemnitor and cosigner dashboard for Shamrock Bail Bonds clients. Manage payment schedules, review receipts & track defendant court compliance.` | Matches meta description |
| **Open Graph Image** | `https://www.shamrockbailbonds.biz/logo.png` | 1200 x 630 WebP/PNG brand banner |
| **Open Graph Type** | `website` | Standard open graph type |

---

## 2. Keywords & Search Intent

- **Primary Target Keyword:** `indemnitor dashboard Shamrock Bail Bonds`
- **Secondary Terms:** `payment plan management bail bonds, collateral receipts portal`
- **Search Intent:** Urgent crisis response, emergency jail release, and bail bond verification.
- **Why This Beats Live:** Preserves exact historical rankings while upgrading E-E-A-T signals, replacing outdated phone numbers, ensuring 100% brand consistency, and adding rich structured data.

---

## 3. Heading Structure & Content Outline

- **H1:** `Indemnitor & Cosigner Dashboard`
  - **H2:** `Defendant Case & Compliance Status`
  - **H2:** `Premium Payment Schedule & Online Payments`
  - **H2:** `Signed Documents & Collateral Receipts`
  - **H2:** `Important Indemnitor Legal Reminders`
  - **H2:** `Need Assistance with Your Account?`

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
