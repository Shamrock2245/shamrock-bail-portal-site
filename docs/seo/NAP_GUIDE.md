# Shamrock Bail Bonds — NAP & Consistency Guide

**Date:** July 4, 2026  
**Author:** Manus AI  

## 1. Introduction

Name, Address, and Phone number (NAP) consistency is one of the most critical ranking factors for local SEO. Search engines like Google use NAP data across the web to verify a business's legitimacy and location. Inconsistent data—such as varying phone numbers, different street abbreviations, or mismatched business names—dilutes local search authority and confuses potential clients. 

This guide establishes the canonical NAP profile for Shamrock Bail Bonds and outlines the strict implementation rules across the Wix/Velo ecosystem and external directories.

## 2. Canonical NAP Profile

The following data represents the single source of truth for Shamrock Bail Bonds. It must be used exactly as formatted below in all new content, code, and external profiles.

| Element | Canonical Value | Notes |
|---|---|---|
| **Business Name** | Shamrock Bail Bonds, LLC | Use for legal/footer contexts |
| **Short Name** | Shamrock Bail Bonds | Use for general content and headers |
| **Street Address** | 1528 Broadway | Do not use "Bwy" or other abbreviations |
| **City, State, Zip** | Fort Myers, FL 33901 | Always use the two-letter state abbreviation |
| **Primary Phone** | (239) 332-2245 | Use for all Southwest Florida and general inquiries |
| **Secondary Phone** | (727) 295-2245 | Use for Tampa Bay/St. Pete and After-Hours/AI Agent |
| **Primary Email** | admin@shamrockbailbonds.biz | General contact |
| **Website URL** | https://www.shamrockbailbonds.biz | Always include `https://www.` |

## 3. Implementation Rules

### 3.1 Single Source of Truth in Code
Within the Wix/Velo codebase, NAP data must never be hardcoded into individual `.js` or `.jsw` files. All structured data, meta tags, and dynamic injections must import their values from `src/backend/seoConfig.js`. If the business phone number or address changes, updating `seoConfig.js` will automatically propagate the change across the entire site's SEO schema.

### 3.2 Content Pages
When writing or updating Markdown content pages (`content/pages/*.md`), the canonical NAP data must be used explicitly. Placeholder data such as `(239) 555-BAIL` or `[Street Address]` is strictly prohibited in production content.

### 3.3 External Directories
When creating or updating profiles on external directories (Google Business Profile, Yelp, Facebook, Apple Maps), the canonical NAP profile must be matched exactly. Even minor variations (e.g., "Shamrock Bail" vs. "Shamrock Bail Bonds") can create duplicate listings and harm local SEO performance.
