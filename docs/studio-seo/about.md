# SEO Specification: About Page

> **Canonical URL:** `https://www.shamrockbailbonds.biz/about`  
> **Target Page Type:** `static`  
> **Robots Directive:** `index, follow`  
> **Brand Policy:** Title ends with `| Shamrock Bail Bonds` (< 60 chars). Self-referencing canonical.

---

## 1. Metadata Blueprint

| Field | Value | Notes & Length |
|---|---|---|
| **Page Title** | `About Shamrock Bail Bonds | Licensed Florida Agency` | 51 characters (target < 60) |
| **Meta Description** | `Owner-operated by Brendan O'Neal since 2012 at 1528 Broadway, Fort Myers. Professional, respectful 24/7 bail support. Call 239-332-2245.` | 136 characters (target 140–160) |
| **H1 Headline** | `About Shamrock Bail Bonds: Local, Trusted & Experienced` | Exactly 1 per page |
| **Robots** | `index, follow` | Public pages index; portal/retire noindex |
| **Canonical URL** | `https://www.shamrockbailbonds.biz/about` | Self-referencing |
| **Open Graph Title** | `About Shamrock Bail Bonds | Licensed Florida Agency` | Matches page title |
| **Open Graph Description** | `Owner-operated by Brendan O'Neal since 2012 at 1528 Broadway, Fort Myers. Professional, respectful 24/7 bail support. Call 239-332-2245.` | Matches meta description |
| **Open Graph Image** | `https://www.shamrockbailbonds.biz/logo.png` | 1200 x 630 WebP/PNG brand banner |
| **Open Graph Type** | `website` | Standard open graph type |

---

## 2. Keywords & Search Intent

- **Primary Target Keyword:** `about Shamrock Bail Bonds`
- **Secondary Terms:** `Lee County bail bond company history, professional bail agent Southwest Florida`
- **Search Intent:** Urgent crisis response, emergency jail release, and bail bond verification.
- **Why This Beats Live:** Preserves exact historical rankings while upgrading E-E-A-T signals, replacing outdated phone numbers, ensuring 100% brand consistency, and adding rich structured data.

---

## 3. Heading Structure & Content Outline

- **H1:** `About Shamrock Bail Bonds: Local, Trusted & Experienced`
  - **H2:** `Our Mission: Dignity, Clarity, and Care`
  - **H2:** `Local Roots in Downtown Fort Myers Since 2012`
  - **H2:** `Licensed & Regulated by the Florida Department of Financial Services`
  - **H2:** `Statewide Coverage & Nationwide Transfer Bonds`
  - **H2:** `Meet Our Founder: Brendan O'Neal`

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
