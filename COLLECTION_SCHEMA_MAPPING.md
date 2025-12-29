# Wix CMS Collection Schema Mapping

**Last Updated:** December 29, 2025

This document maps the Wix CMS collection IDs to their logical names and documents the field schemas for each collection.

---

## Collection ID Mapping

| Logical Name | Wix Collection ID | Display Name | Status |
|--------------|-------------------|--------------|--------|
| FLORIDA_COUNTIES | Import1 | FloridaCounties | ✅ Active (67 records) |
| COUNTIES | Import21 | Counties | ⚠️ Empty (new schema) |
| CASES | Cases | Cases | ✅ Active |
| MEMBER_DOCUMENTS | MemberDocuments | Memberdocuments | ✅ Active |
| MEMBER_PROFILES | MemberProfiles | Memberprofiles | ✅ Active |
| PORTAL_USERS | PortalUsers | Portal Users | ✅ Active |
| PERSONS | Persons | Persons | ✅ Active |
| BAIL_START_LOGS | BailStartLogs | Bailstartlogs | ✅ Active |
| SIGNNOW_HANDOFFS | SignNowHandoffs | Signnowhandoffs | ✅ Active |
| REQUIRED_DOCUMENTS | RequiredDocuments | Requireddocuments | ✅ Active |
| PENDING_DOCUMENTS | PendingDocuments | Pendingdocuments | ✅ Active |
| ANALYTICS_EVENTS | AnalyticsEvents | Analyticsevents | ✅ Active |
| CALL_LOGS | CallLogs | Calllogs | ✅ Active |
| USER_LOCATIONS | UserLocations | Userlocations | ✅ Active |
| GEOLOCATION_CACHE | GeolocationCache | Geolocationcache | ✅ Active |
| FAQ | FAQs | Faqs | ✅ Active |
| TESTIMONIALS | Testimonials | Testimonials | ✅ Active |
| CONTACT_SUBMISSIONS | ContactSubmissions | Contactsubmissions | ✅ Active |
| BAIL_SCHOOL_SIGNUPS | BailSchoolSignups | Bailschoolsignups | ✅ Active |
| MAGIC_LINKS | MagicLinks | Magiclinks | ✅ Active |

---

## FloridaCounties Collection Schema

**Collection ID:** `Import1`  
**Display Name:** FloridaCounties  
**Record Count:** 67 (all Florida counties)  
**Primary Use:** County landing pages, directory, homepage selector

### Fields

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `_id` | ID | TEXT | System | Unique record ID |
| `title` | Title | TEXT | Yes | Full page title (e.g., "Lee County Bail Bonds") |
| `countyName` | County Name | TEXT | Yes | County name only (e.g., "Lee") |
| `countySlug` | County Slug | TEXT | Yes | URL-friendly slug (e.g., "lee") |
| `primaryPhone` | Primary Phone | TEXT | Yes | Main contact phone |
| `bookingWebsiteLink` | Booking Website Link | URL | No | Sheriff's booking/inmate search URL |
| `bookingPhoneNumber` | Booking Phone Number | TEXT | No | Jail booking phone |
| `countyClerkWebsitelink` | County Clerk Website | URL | No | Clerk of Court website |
| `countyClerkPhoneNumber` | County Clerk Phone | TEXT | No | Clerk phone number |
| `recordsSearchLink` | Records Search Link | URL | No | Court records search URL |
| `seoTitle` | SEO Title | TEXT | Yes | Meta title for SEO |
| `seoDescription` | SEO Description | TEXT | Yes | Meta description for SEO |
| `serviceAreaCopy` | Service Area Copy | RICH_TEXT | No | About the county content |
| `h1Headline` | H1 Headline | TEXT | No | Main page headline |
| `ctaLink` | CTA Link | TEXT | No | Call-to-action link (usually tel:) |
| `isPrimaryCounty` | Is Primary County | BOOLEAN | No | Flag for primary service areas |
| `_createdDate` | Created Date | DATETIME | System | Record creation timestamp |
| `_updatedDate` | Updated Date | DATETIME | System | Last update timestamp |
| `_owner` | Owner | TEXT | System | Record owner ID |

### Field Mapping in Code

The `countyUtils.js` module normalizes field names for consistent use:

```javascript
{
  name: county.countyName,           // countyName -> name
  slug: county.countySlug,           // countySlug -> slug
  title: county.title,
  primaryPhone: county.primaryPhone,
  bookingWebsite: county.bookingWebsiteLink,
  bookingPhone: county.bookingPhoneNumber,
  clerkWebsite: county.countyClerkWebsitelink,
  clerkPhone: county.countyClerkPhoneNumber,
  recordsSearch: county.recordsSearchLink,
  seoTitle: county.seoTitle,
  seoDescription: county.seoDescription,
  serviceAreaCopy: county.serviceAreaCopy,
  h1Headline: county.h1Headline,
  ctaLink: county.ctaLink
}
```

---

## Counties Collection Schema (New/Alternate)

**Collection ID:** `Import21`  
**Display Name:** Counties  
**Record Count:** 0 (empty)  
**Status:** ⚠️ Not currently in use

### Fields

| Field Key | Display Name | Type | Description |
|-----------|--------------|------|-------------|
| `_id` | ID | TEXT | Unique record ID |
| `title` | Title | TEXT | County display name |
| `slug` | Slug | TEXT | URL slug |
| `region` | Region | TEXT | Florida region |
| `sheriffOfficeName` | Sheriff Office Name | TEXT | Sheriff's office name |
| `sheriffWebsite` | Sheriff Website | URL | Sheriff website |
| `sheriffPhone` | Sheriff Phone | TEXT | Sheriff phone |
| `sheriffAddress` | Sheriff Address | TEXT | Physical address |
| `jailName` | Jail Name | TEXT | Jail facility name |
| `jailPhone` | Jail Phone | TEXT | Jail phone |
| `inmateSearchUrl` | Inmate Search URL | URL | Inmate search link |
| `clerkName` | Clerk Name | TEXT | Clerk of Court name |
| `clerkWebsite` | Clerk Website | URL | Clerk website |
| `clerkPhone` | Clerk Phone | TEXT | Clerk phone |
| `countySeat` | County Seat | TEXT | County seat city |
| `majorCities` | Major Cities | TEXT | Comma-separated cities |
| `metaTitle` | Meta Title | TEXT | SEO title |
| `metaDescription` | Meta Description | TEXT | SEO description |
| `isActive` | Is Active | BOOLEAN | Active status |
| `featured` | Featured | BOOLEAN | Featured flag |
| `sortOrder` | Sort Order | NUMBER | Display order |

**Note:** This appears to be a newer schema design but is not populated. The codebase currently uses `Import1` (FloridaCounties) as the active collection.

---

## Usage in Code

### Backend

```javascript
import { COLLECTIONS } from 'backend/collectionIds';
import wixData from 'wix-data';

// Query counties
const results = await wixData.query(COLLECTIONS.FLORIDA_COUNTIES)
  .eq('countySlug', 'lee')
  .find();
```

### Frontend

```javascript
import { getCounties, getCountyBySlug } from 'public/countyUtils';

// Get all counties (normalized)
const counties = await getCounties();

// Get specific county
const county = await getCountyBySlug('lee');
```

---

## Migration Notes

If migrating from `Import1` to `Import21`:

1. Field name changes:
   - `countyName` → `title`
   - `countySlug` → `slug`
   - `bookingWebsiteLink` → `inmateSearchUrl`
   - `countyClerkWebsitelink` → `clerkWebsite`
   - `seoTitle` → `metaTitle`
   - `seoDescription` → `metaDescription`

2. New fields in Import21:
   - `region` (not in Import1)
   - `sheriffOfficeName` (separate from booking link)
   - `jailName` (explicit jail name)
   - `countySeat` (explicit county seat)
   - `majorCities` (structured list)
   - `isActive` (activation flag)
   - `featured` (homepage feature flag)
   - `sortOrder` (manual ordering)

3. Update references in:
   - `backend/collectionIds.js`
   - `public/countyUtils.js`
   - `backend/county-generator.jsw`
   - All page files referencing counties

---

## Related Files

- `/src/backend/collectionIds.js` - Collection ID constants
- `/src/public/countyUtils.js` - Frontend county data utilities
- `/src/backend/county-generator.jsw` - County page data generator
- `/src/pages/Florida Counties.bh0r4.js` - Counties directory page
- `/src/pages/FloridaCounties (Item).becrn.js` - Dynamic county page
- `/src/pages/HOME.c1dmp.js` - Homepage with county selector

---

## Troubleshooting

### Counties not showing on homepage selector

1. Check that `countyUtils.js` is querying the correct collection
2. Verify field name mapping (countyName vs name, countySlug vs slug)
3. Check browser console for errors

### Dynamic county pages showing blank

1. Verify `county-generator.jsw` is using correct collection
2. Check that countySlug in URL matches database records
3. Ensure all required fields are populated in collection

### Repeater not populating

1. Confirm repeater element ID matches code (`#countiesRepeater`)
2. Check that child elements exist (`#countyNameTitle`, `#viewCountyButton`)
3. Verify data structure matches repeater expectations
