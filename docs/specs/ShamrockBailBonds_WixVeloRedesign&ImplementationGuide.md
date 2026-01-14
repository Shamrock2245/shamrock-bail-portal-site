# Shamrock Bail Bonds: Wix Velo Redesign & Implementation Guide

**Version:** 1.0
**Date:** December 23, 2025
**Author:** Manus AI

## 1. Introduction

This document provides a comprehensive guide for the redesign and implementation of the Shamrock Bail Bonds Wix Velo website. It is intended for both the lead developer handling backend and visual implementation, and the AI coding partner, `chatgpt atlas`, responsible for frontend development. The primary objective is to deliver a modern, high-trust, and conversion-focused website while strictly adhering to existing workflow and data schema constraints.

This guide is structured to facilitate a clear separation of tasks:

*   **Backend & Configuration (Developer):** Setting up the Wix environment, data collections, and server-side logic.
*   **Visual Design & Theming (Developer):** Applying the brand's design system within the Wix Editor.
*   **Frontend Development (AI Partner):** Building the page structure, implementing user-facing logic, and connecting to backend services.

---

## 2. Core Principles & Non-Negotiables

Before proceeding, it is critical to internalize the following project rules:

*   **Workflow Protection:** Under no circumstances should the existing SignNow, Google Apps Script, or Google Sheets automations be altered or interrupted. The website acts as a secure launchpad to these systems, not a replacement.
*   **Schema is Sacred:** All data structures, forms, and member portal logic **must** align with the 34-column schema defined in the `swfl-arrest-scrapers` repository. Do not invent new schemas or rename fields.
*   **SignNow Handoff:** The website's role ends and SignNow's begins the moment a user clicks "Start Bail Paperwork" within the secure members' area. The site should only facilitate a secure handoff.

---

## 3. Phase 1: Backend Setup & Configuration (Developer Task)

This phase establishes the foundational backend infrastructure in the Wix environment.

### 3.1. Create Wix Data Collections

Based on the backend architecture analysis, create the following collections in the Wix Content Manager. Navigate to **Content Manager > Collections > Create Collection**. Set the permissions as specified.

| Collection Name | Purpose | Permissions |
| :--- | :--- | :--- |
| `PendingDocuments` | Stores signing links from SignNow. | Admin: R/W, Member: None |
| `MemberDocuments` | Stores uploaded user ID documents. | Admin: R/W, Member: Create |
| `RequiredDocuments` | Tracks required document uploads per member. | Admin: R/W, Member: R |
| `UserLocations` | Logs GPS check-in data for analytics. | Admin: R/W, Member: Create |
| `PortalUsers` | Manages user profiles and roles. | Admin: R/W, Member: R (Own) |
| `PortalSessions` | Stores active user session data. | Admin: R/W, Member: None |
| `MagicLinks` | Stores single-use magic link tokens for login. | Admin: R/W, Member: None |
| `FloridaCounties` | Master data source for all 67 counties. | Admin: R/W, Anyone: Read |
| `BookingCache` | Caches booking data from county systems. | Admin: R/W, Member: None |
| `CallLogs` | Tracks every initiated phone call. | Admin: R/W, Member: Create |
| `AnalyticsEvents` | General collection for custom analytics events. | Admin: R/W, Member: Create |

### 3.2. Align `FloridaCounties` Collection with Schema

Ensure the `FloridaCounties` collection includes fields that align with the arrest scraper schema and the backend architecture. This is crucial for the dynamic county page generation.

**Action:** Add the following fields to your `FloridaCounties` collection. The `countySlug` must be the **Primary Key** and should be a lowercase, URL-friendly version of the county name (e.g., "lee", "collier").

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| `countySlug` | Text | **Primary Key** (e.g., "lee") |
| `countyName` | Text | e.g., "Lee" |
| `active` | Boolean | Is the county page live? |
| `featured` | Boolean | Show on homepage? |
| `tier` | Number | Tier 1, 2, or 3 for business logic |
| `primaryPhone` | Text | E.164 format phone number for this county |
| `sheriffName` | Text | Sheriff's office name |
| `sheriffUrl` | URL | Sheriff's office website |
| `clerkName` | Text | Clerk of Court name |
| `clerkUrl` | URL | Clerk of Court website |
| `jailUrl` | URL | Jail/booking search URL |

### 3.3. Configure Wix Secrets Manager

Sensitive API keys and URLs must be stored in the Wix Secrets Manager to be securely accessed by your backend code. Navigate to **Settings > Secrets Manager** in your site's dashboard.

| Secret Key | Purpose |
| :--- | :--- |
| `GAS_API_KEY` | API key for authenticating with your Google Apps Script backend. |
| `GAS_WEB_APP_URL` | The deployment URL of your Google Apps Script web app. |
| `GAS_BOOKING_ENDPOINT` | The specific endpoint for fetching booking data from GAS. |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for the `geocoding.jsw` service. |
| `SIGNNOW_API_TOKEN` | Your SignNow API token for backend integrations. |
| `SIGNNOW_TEMPLATE_ID` | The ID of the primary SignNow template to be used. |

### 3.4. Deploy Backend Velo Modules (.jsw)

Deploy the backend modules as outlined in the `ShamrockBailPortal-Frontend_BackendWiringAnalysisReport.md` and `BACKEND_IMPLEMENTATION_GUIDE.md`. Ensure the following files exist in your `/src/backend/` directory with the correct logic:

*   `wixApi.jsw` (Handles interactions with Wix CMS collections)
*   `bailCalculator.jsw` (Calculates bond fees and costs)
*   `location.jsw` (Manages user location capture and storage)
*   `routing.jsw` (Determines the correct phone number to display)
*   `call-tracking.jsw` (Logs phone call events)
*   `county-generator.jsw` (Generates data for dynamic county pages)
*   `signNowIntegration.jsw` (Handles the secure handoff to SignNow)
*   `http-functions.js` (Exposes API endpoints for external services like GAS)

---

## 4. Phase 2: Visual Design & Theming (Developer Task)

This phase involves applying the new brand identity to the Wix site using the editor's design tools. This will set the visual foundation for the frontend development work.

### 4.1. Implement the Design System

Reference the `DESIGN-SYSTEM.md` file to configure the site's visual theme. This is a critical step to ensure brand consistency.

1.  **Site Colors:** Go to **Site Design > Colors** and create a new color palette using the primary, secondary, and neutral colors defined in the design system. The key colors are:
    *   **Deep Navy:** `#1B3A5F`
    *   **Action Blue:** `#0066CC`
    *   **Shamrock Gold:** `#FDB913`
    *   **Near Black:** `#212529`
    *   **Dark Gray:** `#343A40`

2.  **Text Themes:** Go to **Site Design > Text** and create text themes for headings (H1, H2, H3) and paragraphs. Use the specified fonts (`Poppins` for headings, `Inter` for body), sizes, and colors.

3.  **Button Design:** Go to **Site Design > Buttons** and create themed button designs for Primary, Secondary, and Outline buttons, matching the styles in the design system (colors, border-radius, etc.).

### 4.2. Prepare Page Layouts

Create the basic page structure in the Wix Editor for the following pages. Do not add complex elements yet; focus on creating the blank pages and setting up their basic layout (e.g., header, footer, main content area).

*   Home
*   How Bail Works
*   Become a Bondsman
*   Contact
*   Blog (Main Page)
*   Blog Post (Template)
*   County Page (Dynamic Page)
*   Members Area (Login Page)
*   Member Portal (Dashboard Page)

---

## 5. Phase 3: Frontend Development (AI Partner Task)

This phase is to be executed by `chatgpt atlas`. The goal is to build out the functionality of each page using Velo code, connecting to the backend modules and data collections prepared in the previous phases.

### 5.1. Global Logic (`masterPage.js`)

Implement the site-wide logic in `masterPage.js`. This code will run on every page.

**Tasks:**
1.  **Session Management:** On page load, check for a `sessionId` in `wix-storage`. If it doesn't exist, generate a new UUID and store it.
2.  **Geolocation:** Import and call the `autoDetectLocation` function from `public/geolocation-client.js`. Store the resulting county in a session variable.
3.  **Dynamic Phone Injection:** Import and call the `initializePhoneInjection` function from `public/phone-injector.js`, passing the detected county and session ID. This function should query all `tel:` links and text elements marked for phone numbers and update them with the correct number from the `routing.jsw` backend module.
4.  **Event Listeners:** Attach `onClick` event listeners to all phone number elements. The handler should call the `logCall` function from the `call-tracking.jsw` backend module, passing the phone number, source element ID, and current page URL.

### 5.2. Home Page (`home.js`)

**Tasks:**
1.  **Content Population:** Populate the hero section, service descriptions, and testimonials from the `home.md` content file.
2.  **Featured Counties:** Query the `FloridaCounties` collection for all items where `featured` is `true`. Display these counties in a dedicated section, linking each one to its dynamic county page URL (e.g., `/county/{countySlug}`).
3.  **Call to Action:** Ensure the primary "Call Now" and "Start Bail Now" buttons are prominent and correctly linked. The "Start Bail Now" button should navigate to the Members Area login page.

### 5.3. Dynamic County Page (`county-dynamic.js`)

This page will serve content for all 67 counties based on the URL.

**Tasks:**
1.  **Get County Slug:** On page load, use `wix-location.path` to get the county slug from the URL.
2.  **Fetch County Data:** Call the `generateCountyPage` function from the `county-generator.jsw` backend module, passing the slug.
3.  **Populate Page Content:** Use the returned data object to populate all elements on the page:
    *   Set the page title, meta description, and keywords using `$w('head')`.
    *   Display the county name, jail information, and clerk of court details.
    *   Link the "Jail Website" and "Clerk Website" buttons to the `jailUrl` and `clerkUrl` from the data.
    *   Populate the FAQ repeater with the county-specific FAQ content.

### 5.4. Members Area & Portal

This section requires careful handling of authentication and data security.

**Login Page (`login.js`):**
1.  Implement a login form that accepts an email address.
2.  On submit, call a backend function in `portal-auth.jsw` that generates a magic link and sends it to the user's email.

**Member Portal (`dashboard.js`):**
1.  **Authentication Check:** On page load, verify the user is logged in using `wix-members-frontend.currentUser.loggedIn`.
2.  **Fetch Member Data:** Get the current member's email and query the `PendingDocuments` and `RequiredDocuments` collections for their records.
3.  **Display Documents:** Display the lists of pending and required documents to the user.
4.  **SignNow Handoff:** The "Start Bail Paperwork" button is the critical handoff point. Its `onClick` handler must:
    *   Call the `initiateSignNowHandoff` function from the `signNowIntegration.jsw` backend module.
    *   This backend function will communicate with your GAS backend to generate the unique SignNow URL.
    *   On success, redirect the user to the received SignNow URL using `wix-location.to()`.

---

## 6. Phase 4: Link & Content Integrity (Developer Task)

### 6.1. Link Verification

**Action:** Process the provided CSV file of Florida sheriff and clerk links. For each county:
1.  Manually verify that the `sheriffUrl` and `clerkUrl` are correct and not outdated.
2.  Update the corresponding entries in the `FloridaCounties` Wix Collection with the corrected links.
3.  This is a **mandatory step** to ensure the statewide expansion is built on accurate data.

### 6.2. Content Implementation

**Action:** Populate the static pages (`How Bail Works`, `Become a Bondsman`, `Contact`) with the content from their respective Markdown files (`how-bail-works.md`, `become-bondsman.md`, `contact.md`). Ensure the formatting is clean and professional, and that all CTAs are correctly linked.

---

## 7. SEO Preservation Plan

*   **URL Structure:** Maintain the existing URL structure where possible. For the new county pages, use the format `/county/{countySlug}` (e.g., `/county/lee`).
*   **Dynamic SEO Tags:** The `county-dynamic.js` page code is responsible for setting the `title`, `description`, and `keywords` for each county page dynamically. This is critical for county-level SEO.
*   **301 Redirects:** If any old URLs must be changed, implement 301 redirects in the Wix Site Manager to preserve SEO equity.
*   **Internal Linking:** Ensure the new county pages are linked from the homepage (Featured Counties) and a main directory page to improve crawlability.

This guide provides a clear path forward. By dividing tasks and adhering to the core principles, you can achieve a successful and impactful redesign.
