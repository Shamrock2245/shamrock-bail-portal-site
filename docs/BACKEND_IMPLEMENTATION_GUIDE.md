# Shamrock Bail Bonds: Backend Implementation & Integration Guide

**Version:** 1.0  
**Date:** December 21, 2025  
**Author:** Manus AI  

**Purpose:** This document provides a comprehensive guide for integrating the newly implemented backend services into the Shamrock Bail Bonds Wix Velo frontend. It includes data collection schemas, frontend code examples, and step-by-step instructions to enable geolocation, dynamic phone routing, call tracking, and scalable county pages.

---

## 1. Overview of New Backend Services

The backend has been architected to be modular, scalable, and aligned with your existing operational workflows. The following services are now available for frontend integration:

| Service | Backend Module(s) | Purpose |
| :--- | :--- | :--- |
| **Geolocation** | `geocoding.jsw`, `location-enhanced.jsw` | Detects user's county from browser location and logs it. |
| **Routing** | `routing.jsw` | Provides the optimal phone number based on county, language, and time. |
| **Call Tracking** | `call-tracking.jsw` | Logs every call initiation for analytics and conversion tracking. |
| **County Data** | `county-generator.jsw` | Generates rich, SEO-friendly data for all 67 Florida county pages. |
| **Analytics** | `analytics.jsw` | A general-purpose service for tracking user events and funnels. |

These services work together to achieve the project's primary goals: increasing call conversions, improving user experience, and creating a scalable foundation for statewide expansion.

---

## 2. Required Wix Data Collections

To support these new services, you must create the following Data Collections in your Wix site editor. Go to **Content Manager -> Collections -> Create Collection**. Use the specified collection names and set permissions as described.

### Collection Schemas

#### 1. `GeolocationCache`
- **Purpose:** Caches Google Geocoding API results to reduce costs and improve performance.
- **Permissions:** `Admin: Read & Write`, `Site Member: None`

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| `cacheKey` | Text | Unique key (e.g., "26.561,-81.811") |
| `latitude` | Number | GPS Latitude |
| `longitude`| Number | GPS Longitude |
| `county` | Text | Detected county slug (e.g., "lee") |
| `state` | Text | State code (e.g., "FL") |

#### 2. `UserLocations`
- **Purpose:** Logs every captured user location for analytics.
- **Permissions:** `Admin: Read & Write`, `Site Member: Create`

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| `sessionId` | Text | Unique session identifier |
| `memberId` | Text | ID of the logged-in member (optional) |
| `latitude` | Number | GPS Latitude |
| `longitude`| Number | GPS Longitude |
| `county` | Text | Detected county slug |
| `accuracy` | Number | Accuracy of the location in meters |
| `consentGiven`| Boolean | True if user granted permission |
| `timestamp` | Date and Time | When the location was captured |

#### 3. `CallLogs`
- **Purpose:** Tracks every initiated phone call from the website.
- **Permissions:** `Admin: Read & Write`, `Site Member: Create`

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| `trackingId` | Text | Unique ID for the call |
| `sessionId` | Text | Unique session identifier |
| `memberId` | Text | ID of the logged-in member (optional) |
| `county` | Text | User's detected county |
| `phoneNumber`| Text | The phone number that was called |
| `source` | Text | The element clicked (e.g., "sticky-mobile-cta") |
| `page` | URL | The page the user called from |
| `device` | Text | "Mobile", "Desktop", or "Tablet" |
| `highValue` | Boolean | True if the call meets high-value criteria |

#### 4. `AnalyticsEvents`
- **Purpose:** A general collection for all custom analytics events.
- **Permissions:** `Admin: Read & Write`, `Site Member: Create`

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| `eventType` | Text | Name of the event (e.g., "form_submitted") |
| `sessionId` | Text | Unique session identifier |
| `county` | Text | User's detected county |
| `page` | URL | The page the event occurred on |
| `properties` | Text | A JSON string of additional event data |

#### 5. `FloridaCounties` (Update Existing)
- **Purpose:** The master data source for all 67 counties.
- **Permissions:** `Admin: Read & Write`, `Anyone: Read`
- **Action:** Ensure your existing `FloridaCounties` collection matches this extended schema. You can add fields without losing data.

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

---

## 3. Frontend Integration Steps

Follow these steps to integrate the backend services into your Velo page code.

### Step 1: Global Initialization (`masterPage.js`)

This code should be placed in your `masterPage.js` file. It runs on every page, detects the user's location, and injects the correct phone numbers site-wide.

```javascript
// In masterPage.js

import { initializePhoneInjection } from 'public/phone-injector';
import { autoDetectLocation } from 'public/geolocation-client';
import wixWindow from 'wix-window';
import wixStorage from 'wix-storage';

$w.onReady(function () {
    // ... your existing onReady code (header, footer, etc.)
    
    // Initialize the new backend services on page load
    initShamrockServices();
});

async function initShamrockServices() {
    try {
        // Generate a session ID if one doesn't exist
        let sessionId = wixStorage.session.getItem('sessionId');
        if (!sessionId) {
            sessionId = generateSessionId();
            wixStorage.session.setItem('sessionId', sessionId);
        }

        // 1. Auto-detect user location silently
        const location = await autoDetectLocation();
        let userCounty = null;
        if (location.success) {
            userCounty = location.county;
            console.log(`Geolocation success: User is in ${userCounty} County.`);
        } else {
            console.warn(`Geolocation failed: ${location.error}`);
        }

        // 2. Initialize dynamic phone injection for the entire site
        await initializePhoneInjection({
            county: userCounty,
            sessionId: sessionId
        });

    } catch (error) {
        console.error("Error initializing Shamrock services:", error);
    }
}

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ... rest of your masterPage.js code
```

### Step 2: Urgent UX Fix & Spanish Phone (`BAIL NEAR ME.c1dmp.js` or relevant page)

This is the **Tier-1 conversion fix** your partner mentioned. The code below replaces the old double-click logic with a single-click, tracked call.

First, remove the old `onDblClick` and `onClick` handlers for `#spanishSpeakingPhone`.

Then, add this to the `$w.onReady()` function on the page where the Spanish phone button exists. The `initializePhoneInjection` in `masterPage.js` will automatically handle this, but if you need to target it specifically, you can use this.

```javascript
// In the relevant page's onReady function (e.g., BAIL NEAR ME.c1dmp.js)

import { updateSpanishPhone } from 'public/phone-injector';

$w.onReady(function () {
    // ... other code

    // Specifically update and fix the Spanish-speaking phone button
    // This ensures the single-click and tracking is applied.
    updateSpanishPhone('#spanishSpeakingPhone');
});
```

### Step 3: Dynamic County Page (`CountyPage-Dynamic.js`)

To create dynamic, SEO-ready pages for all 67 counties, use the `county-generator.jsw` module. This code fetches the complete, merged data for a county based on its URL slug.

```javascript
// In your dynamic county page's code (e.g., CountyPage-Dynamic.js)

import { generateCountyPage } from 'backend/county-generator';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    try {
        // Get the county slug from the URL
        const path = wixLocation.path;
        const countySlug = path.length > 0 ? path[0] : 'lee'; // Default to 'lee' if no slug

        // Fetch the complete county data from the backend
        const result = await generateCountyPage(countySlug);

        if (result.success) {
            const countyData = result.data;
            
            // Populate the page with the dynamic data
            await populateCountyPage(countyData);

            // Set SEO tags for the page
            $w('head').title = countyData.seo.meta_title;
            $w('head').description = countyData.seo.meta_description;
            $w('head').keywords = countyData.seo.keywords.join(', ');
            
        } else {
            console.error("Failed to generate county page:", result.error);
            // Optionally, show an error message to the user
            $w('#errorMessage').text = 'Could not load county information. Please call us.';
            $w('#errorMessage').show();
        }
    } catch (error) {
        console.error("Error on dynamic county page:", error);
    }
});

async function populateCountyPage(data) {
    // Populate all elements on your dynamic page
    $w('#countyNameHeadline').text = `${data.county_name_full} Bail Bonds`;
    $w('#aboutCountyText').text = data.content.about_county;
    $w('#jailName').text = data.jail.name;
    $w('#jailAddress').text = data.jail.address;
    $w('#clerkName').text = data.clerk.name;

    // Link buttons
    $w('#jailWebsiteButton').link = data.jail.booking_url;
    $w('#clerkWebsiteButton').link = data.clerk.website;

    // Populate FAQ repeater
    $w('#faqRepeater').data = data.content.faq.map((item, index) => ({
        _id: String(index),
        question: item.question,
        answer: item.answer
    }));

    // The phone numbers will be populated automatically by masterPage.js
    // No need to set them here.
}
```

---

## 4. Deployment Checklist

Follow this sequence to deploy the new backend and integrate it safely.

1.  **Create Data Collections:** Create all the required Wix Data Collections with the correct names and permissions as specified in Section 2.
2.  **Add Backend Modules:** Copy the new backend modules (`.jsw` and `.json` files) into your site's backend code section using the Wix Editor.
    - `geocoding.jsw`
    - `location-enhanced.jsw` (you can rename your old `location.jsw` or replace its content)
    - `routing.jsw`
    - `call-tracking.jsw`
    - `county-generator.jsw`
    - `analytics.jsw`
    - `data/florida-county-boundaries.json`
    - `data/phone-registry.json`
    - `data/county-template.json`
3.  **Add Public Modules:** Copy the new public modules (`.js` files) into your site's public code section.
    - `geolocation-client.js`
    - `phone-injector.js`
4.  **Update `masterPage.js`:** Add the initialization code from Step 1 to your global `masterPage.js` file.
5.  **Update Page Code:** Apply the changes to your Spanish phone button page and your dynamic county page as described in Step 2 and 3.
6.  **Publish & Test:** Publish the site to a test environment (if possible) or directly to live, and then test thoroughly:
    -   **Mobile & Desktop:** Test on both platforms.
    -   **Geolocation:** Ensure the county is detected correctly.
    -   **Phone Numbers:** Verify that phone numbers are dynamically updated and that all call buttons are single-click.
    -   **Call Tracking:** Check the `CallLogs` collection to ensure calls are being logged with the correct county and source.
    -   **Dynamic Pages:** Navigate to a few county URLs (e.g., `/lee`, `/collier`) and ensure the content loads correctly.

---

## 5. Next Steps & Future Strategy

With this backend foundation in place, you are now positioned to dominate the SWFL search market and expand statewide.

-   **Activate More Counties:** To bring a new county online, simply add its data to the `FloridaCounties` collection and set the `active` flag to `true`. The dynamic page will work automatically.
-   **Analyze Call Data:** Use the `CallLogs` and `AnalyticsEvents` collections to build dashboards that show which counties and marketing channels are performing best.
-   **A/B Test Phone Numbers:** The `phone-registry.json` is designed to be easily updated. You can experiment with different phone numbers for different counties to optimize conversion rates.
-   **Integrate with Scrapers:** The `scraper_integration` fields in the county data model are ready for you to link the website directly to your arrest scraper notifications, creating a seamless lead management workflow.

This architecture provides the robust, data-driven engine your business needs to scale effectively. If you have any questions during integration, please refer to the code comments and this guide.
