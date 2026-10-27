# SEO Specification: Terms And Conditions Page

> **Canonical URL:** `https://www.shamrockbailbonds.biz/terms-and-conditions`  
> **Target Page Type:** `legal`  
> **Robots Directive:** `index, follow`  
> **Brand Policy:** Title ends with `| Shamrock Bail Bonds` (< 60 chars). Self-referencing canonical.

---

## 1. Metadata Blueprint

| Field | Value | Notes & Length |
|---|---|---|
| **Page Title** | `Terms and Conditions | Shamrock Bail Bonds` | 42 characters (target < 60) |
| **Meta Description** | `Terms and conditions governing Shamrock Bail Bonds website use, digital client portal, and bail bond underwriting in Florida.` | 125 characters (target 140–160) |
| **H1 Headline** | `Terms and Conditions of Service` | Exactly 1 per page |
| **Robots** | `index, follow` | Public pages index; portal/retire noindex |
| **Canonical URL** | `https://www.shamrockbailbonds.biz/terms-and-conditions` | Self-referencing |
| **Open Graph Title** | `Terms and Conditions | Shamrock Bail Bonds` | Matches page title |
| **Open Graph Description** | `Terms and conditions governing Shamrock Bail Bonds website use, digital client portal, and bail bond underwriting in Florida.` | Matches meta description |
| **Open Graph Image** | `https://www.shamrockbailbonds.biz/logo.png` | 1200 x 630 WebP/PNG brand banner |
| **Open Graph Type** | `website` | Standard open graph type |

---

## 2. Keywords & Search Intent

- **Primary Target Keyword:** `Shamrock Bail Bonds terms and conditions`
- **Secondary Terms:** `Florida surety bond contractual terms, digital portal usage terms`
- **Search Intent:** Compliance and account rights. This is not a sales page.
- **Why This Beats Live:** Preserves exact historical rankings while upgrading E-E-A-T signals, replacing outdated phone numbers, ensuring 100% brand consistency, and adding rich structured data.

---

## 3. Heading Structure & Content Outline

- **H1:** `Terms and Conditions of Service`
  - **H2:** `Acceptance of Terms`
  - **H2:** `Florida Statutory Underwriting & Premium Requirements`
  - **H2:** `Indemnitor Responsibilities & Contractual Obligations`
  - **H2:** `Digital Portal Access & Electronic Signatures`
  - **H2:** `Limitation of Liability & Disclaimers`
  - **H2:** `Governing Law & Jurisdiction`

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
