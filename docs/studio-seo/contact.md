# SEO Specification: Contact Page

> **Canonical URL:** `https://www.shamrockbailbonds.biz/contact`  
> **Target Page Type:** `static`  
> **Robots Directive:** `index, follow`  
> **Brand Policy:** Title ends with `| Shamrock Bail Bonds` (< 60 chars). Self-referencing canonical.

---

## 1. Metadata Blueprint

| Field | Value | Notes & Length |
|---|---|---|
| **Page Title** | `Contact Our Bail Agents | Shamrock Bail Bonds` | 45 characters (target < 60) |
| **Meta Description** | `Contact Shamrock Bail Bonds in Fort Myers, FL. 24/7 phone support, confidential office walk-ins, and text help. Call 239-332-2245 or text 239-955-0178.` | 151 characters (target 140–160) |
| **H1 Headline** | `Contact Shamrock Bail Bonds: 24/7 Direct Help` | Exactly 1 per page |
| **Robots** | `index, follow` | Public pages index; portal/retire noindex |
| **Canonical URL** | `https://www.shamrockbailbonds.biz/contact` | Self-referencing |
| **Open Graph Title** | `Contact Our Bail Agents | Shamrock Bail Bonds` | Matches page title |
| **Open Graph Description** | `Contact Shamrock Bail Bonds in Fort Myers, FL. 24/7 phone support, confidential office walk-ins, and text help. Call 239-332-2245 or text 239-955-0178.` | Matches meta description |
| **Open Graph Image** | `https://www.shamrockbailbonds.biz/logo.png` | 1200 x 630 WebP/PNG brand banner |
| **Open Graph Type** | `website` | Standard open graph type |

---

## 2. Keywords & Search Intent

- **Primary Target Keyword:** `contact bail bondsman Fort Myers`
- **Secondary Terms:** `Lee County bail bonds contact, Spanish bail bonds Florida, text a bail agent`
- **Search Intent:** Urgent crisis response, emergency jail release, and bail bond verification.
- **Why This Beats Live:** Preserves exact historical rankings while upgrading E-E-A-T signals, replacing outdated phone numbers, ensuring 100% brand consistency, and adding rich structured data.

---

## 3. Heading Structure & Content Outline

- **H1:** `Contact Shamrock Bail Bonds: 24/7 Direct Help`
  - **H2:** `24/7 Emergency Phone & Text Lines`
  - **H2:** `Our Office Location in Downtown Fort Myers`
  - **H2:** `Walk-In Hours & 24/7 Dispatch Availability`
  - **H2:** `Send an Urgent Message to Our Desk`
  - **H2:** `Service Areas: Southwest Florida & Statewide`

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
