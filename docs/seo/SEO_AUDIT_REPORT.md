# Shamrock Bail Bonds — SEO & NAP Audit Report

**Date:** July 4, 2026  
**Auditor:** Manus AI  
**Scope:** `content/pages/*.md` and `src/pages/*.js`

## 1. Executive Summary

The audit of the existing markdown content and Velo JS pages revealed two primary issues that require immediate correction. First, every major content page contains the placeholder phone number `(239) 555-BAIL`, and the contact page contains the placeholder `[Street Address]`. Second, several page titles exceed the recommended 60-character limit, risking truncation in Google Search results.

All placeholder NAP data will be replaced with the confirmed canonical data in the codebase and structured data blocks. The primary phone number is (239) 332-2245, the secondary phone number is (727) 295-2245, and the address is 1528 Broadway, Fort Myers, FL 33901.

## 2. Page-by-Page Audit & Correction Plan

The following table outlines the current state of the markdown content files and the required actions to bring them into compliance with SEO best practices and NAP consistency rules.

| Page | Current Title (Length) | Current Description (Length) | NAP Status | Required Actions |
|---|---|---|---|---|
| **Home** (`home.md`) | `Shamrock Bail Bonds \| 24/7 Bail Bonds in Florida \| Fast Release` (63) ❌ | `Need bail bonds in Florida? Shamrock Bail Bonds offers 24/7 service, fast jail release, and flexible payment plans. Call now for immediate assistance.` (150) ✅ | Contains placeholder phone ❌ | Change title to `Shamrock Bail Bonds \| 24/7 Florida Bail Bonds` (45). Replace `(239) 555-BAIL` with `(239) 332-2245`. Inject `FAQPage` JSON-LD schema. |
| **Contact** (`contact.md`) | `Contact Shamrock Bail Bonds \| 24/7 Bail Bond Service Florida` (60) ✅ | `Contact Shamrock Bail Bonds 24/7 for immediate bail assistance in Florida. Call, text, or submit a form. We respond within minutes.` (131) ✅ | Contains placeholder phone and address ❌ | Replace `(239) 555-BAIL` with `(239) 332-2245`. Replace `[Street Address]` with `1528 Broadway`. |
| **How Bail Works** (`how-bail-works.md`) | `How Bail Works in Florida \| Bail Bond Process Explained \| Shamrock` (66) ❌ | `Learn how bail bonds work in Florida. Understand the arrest process, bail amounts, and how to get your loved one released quickly. Free consultation available.` (159) ✅ | Contains placeholder phone ❌ | Change title to `How Bail Works in Florida \| Bail Bond Process \| Shamrock` (56). Replace `(239) 555-BAIL` with `(239) 332-2245`. Inject `FAQPage` JSON-LD schema. |
| **Become a Bondsman** (`become-bondsman.md`) | `How to Become a Bail Bondsman in Florida \| Shamrock Bail School` (63) ❌ | `Learn how to become a licensed bail bondsman in Florida. Complete guide to requirements, training, licensing, and career opportunities. Shamrock Bail School coming soon.` (169) ❌ | Contains placeholder phone ❌ | Change title to `Become a Bail Bondsman in FL \| Shamrock Bail School` (51). Change description to `Learn how to become a licensed bail bondsman in Florida. Complete guide to requirements, training, and career opportunities with Shamrock Bail School.` (152). Replace `(239) 555-BAIL` with `(239) 332-2245`. |
| **First Appearance** (`first-appearance.md`) | Missing ❌ | Missing ❌ | No phone found | Add title `Florida First Appearance Hearings \| Shamrock Bail Bonds`. Add description `Understand what happens at a first appearance hearing in Florida. Learn about bail setting, ROR, and how Shamrock Bail Bonds can help secure fast release.` |

## 3. Velo JS Files

Several Velo frontend files currently contain SEO injection code (`wixSeo` or `setStructuredData`). These files will be updated to pull NAP data dynamically from the `src/backend/seoConfig.js` module, ensuring a single source of truth.

The files identified for update include `About.xal5r.js`, `Bail School.sftg6.js`, `Blog.lttyy.js`, `Contact.ilgty.js`, `Florida Counties.qx7lv.js`, `HOME.c1dmp.js`, `How Bail Works.lrh65.js`, `How to Become a Bondsman.y8dfc.js`, `Post.nc3ia.js`, `Privacy Policy.kq1bu.js`, `Testimonials (List).bv3hz.js`, `first-appearance.h4fpl.js`, `portal-defendant.skg9y.js`, `portal-indemnitor.k53on.js`, `portal-landing.bagfn.js`, and `portal-staff.qs9dx.js`. All structured data within these files will be standardized to use the centralized configuration.
