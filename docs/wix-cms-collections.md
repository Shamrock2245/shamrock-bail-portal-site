# Wix CMS Collections Analysis

This document provides a comprehensive audit of the Wix CMS collections used in the Shamrock Bail Suite, reconciling the documented schemas with the actual collections found in the production site.

## 1. Core Operational Collections
These collections are actively listed in the Wix CMS and are critical for the site's functionality.

### FloridaCounties (or Counties)
*   **Status:** ✅ Active (Shown as `FloridaCounties` in screenshot and `Counties` in guides)
*   **Purpose:** Master data source for all 67 Florida counties.
*   **Fields:**
    *   `title` (Text) - County name (e.g., "Lee")
    *   `slug` (Text) - Primary Key (e.g., "lee")
    *   `region` (Text) - Geographic region
    *   `isActive` (Boolean) - Is the county page live?
    *   `featured` (Boolean) - Show on homepage?
    *   `primaryPhone` (Text) - E.164 format
    *   `sheriffOfficeName` (Text)
    *   `sheriffWebsite` (URL)
    *   `clerkName` (Text)
    *   `clerkWebsite` (URL)
    *   `jailName` (Text)
    *   `inmateSearchUrl` (URL)
    *   `metaTitle` / `metaDescription` (Text) - SEO tags

### GeolocationCache
*   **Status:** ✅ Active (Screenshot: `GeolocationCache`)
*   **Purpose:** Reduced API costs by caching Google Geocoding results.
*   **Fields:**
    *   `cacheKey` (Text) - Unique key (e.g., "26.561,-81.811")
    *   `latitude` / `longitude` (Number)
    *   `county` (Text) - Detected slug
    *   `state` (Text) - "FL"

### UserLocations
*   **Status:** ✅ Active (Screenshot: `UserLocations`)
*   **Purpose:** Tracking user movement for analytics and routing verification.
*   **Fields:**
    *   `sessionId` (Text) - UUID
    *   `memberId` (Text, optional)
    *   `latitude` / `longitude` (Number)
    *   `county` (Text)
    *   `accuracy` (Number)
    *   `timestamp` (Date and Time)
    *   `consentGiven` (Boolean)

### MagicLinks
*   **Status:** ✅ Active (Screenshot: `MagicLinks`)
*   **Purpose:** Passwordless authentication tokens.
*   **Fields:**
    *   `token` (Text, unique)
    *   `personId` (Text) - Related Person ID
    *   `role` (Text) - defendant/indemnitor/staff
    *   `expiresAt` (Date and Time)
    *   `used` (Boolean)

## 2. Missing Collections (Required by Backend)

These collections are actively used in the codebase but do not appear in the current CMS. They must be created (or imported) to prevent runtime errors.

### Core Operational
*   **`ArrestLeads`**: Stores scraped leads for staff follow-up.
*   **`PortalUsers`**: Mapping of Wix User IDs to Person/Case records.
*   **`PortalSessions`**: Persistent server-side session data.
*   **`SigningSessions`**: Full audit of SignNow envelope lifecycle.
*   **`PendingDocuments`**: Queue for the Digital Sign-up portal.

### Infrastructure & Logs
*   **`CaseFolders`**: Mapping of cases to Google Drive IDs.
*   **`SignatureEvents`**: Granular tracking of signer interactions.
*   **`NotificationLogs`**: History of all system communications.
*   **`InAppNotifications`**: Real-time alerts for portal users.
*   **`GeolocationEvents`**: Accuracy logs for the geocoding service.
*   **`WebhookLogs`**: Raw logs of incoming SignNow/GAS signals.
*   **`DocumentSaves`**: History of Drive file creations.

---

## 3. Summary of Discrepancies & Actions

| ID | Collection Name | Status | Action Required |
| :--- | :--- | :--- | :--- |
| 1 | `FloridaCounties` | ✅ Active | None (Code matches CMS). |
| 2 | `Counties` | ❌ Deprecated | Remove from documentation; use `FloridaCounties`. |
| 3 | `ArrestLeads` | ❌ Missing | **Import** `cms_import_ArrestLeads.csv`. |
| 4 | `PortalUsers` | ❌ Missing | **Import** `cms_import_PortalUsers.csv`. |
| 5 | `PendingDocuments`| ❌ Missing | **Import** `cms_import_PendingDocuments.csv`. |
| 6 | `Cases` / `Persons` | ❌ Missing | **Import** `cms_import_Cases.csv` / `...Persons.csv`. |

## Technical Cleanup Notes

1.  **Naming Consistency**: The codebase uses `FloridaCounties`. All documentation is now updated to match.
2.  **Schema Enforcement**: All new collections follow the `CamelCase` naming convention established by `MagicLinks`.
3.  **Data Policy**: Logs (`WebhookLogs`, `AnalyticsEvents`) have a 90-day retention policy enforced via backend cleanup jobs.
