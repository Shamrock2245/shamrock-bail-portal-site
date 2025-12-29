/**
 * Wix CMS Collection ID Mapping
 * 
 * This module provides a centralized mapping between human-readable
 * collection names and their actual Wix collection IDs.
 * 
 * Updated: 2025-12-29
 * All collections now use their proper readable names instead of Import prefixes.
 * 
 * Usage:
 * import { COLLECTIONS } from 'backend/collectionIds';
 * wixData.query(COLLECTIONS.FLORIDA_COUNTIES)...
 */

export const COLLECTIONS = {
  // Core Collections
  FLORIDA_COUNTIES: 'Import1',           // FloridaCounties - County data with full schema
  COUNTIES: 'Import21',                  // Counties - Alternate/new county schema (currently empty)
  CASES: 'Cases',                        // Bail bond cases
  MEMBER_DOCUMENTS: 'MemberDocuments',   // Uploaded IDs and documents
  MEMBER_PROFILES: 'MemberProfiles',     // Member profile information
  PORTAL_USERS: 'PortalUsers',           // Portal user accounts
  PERSONS: 'Persons',                    // Person records
  
  // Bail Process Collections
  BAIL_START_LOGS: 'BailStartLogs',      // Audit logs for bail paperwork initiation
  SIGNNOW_HANDOFFS: 'SignNowHandoffs',   // SignNow integration handoff records
  REQUIRED_DOCUMENTS: 'RequiredDocuments', // Required document types
  PENDING_DOCUMENTS: 'PendingDocuments', // Documents pending review
  
  // Analytics & Tracking
  ANALYTICS_EVENTS: 'AnalyticsEvents',   // Site analytics events
  CALL_LOGS: 'CallLogs',                 // Call tracking logs
  USER_LOCATIONS: 'UserLocations',       // User location data
  GEOLOCATION_CACHE: 'GeolocationCache', // Cached geolocation lookups
  
  // Supporting Collections
  FAQ: 'FAQs',                           // Frequently asked questions
  TESTIMONIALS: 'Testimonials',          // Client testimonials
  CONTACT_SUBMISSIONS: 'ContactSubmissions', // Contact form submissions
  BAIL_SCHOOL_SIGNUPS: 'BailSchoolSignups',  // Bail school interest signups
  MAGIC_LINKS: 'MagicLinks',             // Magic link authentication tokens

  // System Collections (Wix-managed)
  BLOG_POSTS: 'Blog/Posts',
  BLOG_CATEGORIES: 'Blog/Categories',
  BLOG_TAGS: 'Blog/Tags',
  MEMBERS_BADGES: 'Members/Badges',
  MEMBERS_FULL_DATA: 'Members/FullData',
  MEMBERS_PRIVATE_DATA: 'Members/PrivateMembersData',
  MEMBERS_PUBLIC_DATA: 'Members/PublicData',
  STORES_COLLECTIONS: 'Stores/Collections',
  STORES_INVENTORY: 'Stores/InventoryItems',
  STORES_ORDERS: 'Stores/Orders',
  STORES_PRODUCTS: 'Stores/Products',
  STORES_VARIANTS: 'Stores/Variants',
  MARKETING_COUPONS: 'Marketing/Coupons'
};

/**
 * Get collection ID by name
 * @param {string} collectionName - Human-readable collection name
 * @returns {string} - Wix collection ID
 */
export function getCollectionId(collectionName) {
  return COLLECTIONS[collectionName] || collectionName;
}

/**
 * Collection display names for reference
 */
export const COLLECTION_DISPLAY_NAMES = {
  [COLLECTIONS.FLORIDA_COUNTIES]: 'FloridaCounties',
  [COLLECTIONS.COUNTIES]: 'Counties (New Schema)',
  [COLLECTIONS.CASES]: 'Cases',
  [COLLECTIONS.MEMBER_DOCUMENTS]: 'Member Documents',
  [COLLECTIONS.MEMBER_PROFILES]: 'Member Profiles',
  [COLLECTIONS.PORTAL_USERS]: 'Portal Users',
  [COLLECTIONS.PERSONS]: 'Persons',
  [COLLECTIONS.BAIL_START_LOGS]: 'Bail Start Logs',
  [COLLECTIONS.SIGNNOW_HANDOFFS]: 'SignNow Handoffs',
  [COLLECTIONS.REQUIRED_DOCUMENTS]: 'Required Documents',
  [COLLECTIONS.PENDING_DOCUMENTS]: 'Pending Documents',
  [COLLECTIONS.ANALYTICS_EVENTS]: 'Analytics Events',
  [COLLECTIONS.CALL_LOGS]: 'Call Logs',
  [COLLECTIONS.USER_LOCATIONS]: 'User Locations',
  [COLLECTIONS.GEOLOCATION_CACHE]: 'Geolocation Cache',
  [COLLECTIONS.FAQ]: 'FAQs',
  [COLLECTIONS.TESTIMONIALS]: 'Testimonials',
  [COLLECTIONS.CONTACT_SUBMISSIONS]: 'Contact Submissions',
  [COLLECTIONS.BAIL_SCHOOL_SIGNUPS]: 'Bail School Signups',
  [COLLECTIONS.MAGIC_LINKS]: 'Magic Links'
};

/**
 * Field name mappings for FloridaCounties collection
 * Maps between code expectations and actual Wix field names
 */
export const FLORIDA_COUNTIES_FIELDS = {
  // Display fields
  NAME: 'countyName',              // County name (e.g., "Lee")
  TITLE: 'title',                  // Full title (e.g., "Lee County Bail Bonds")
  SLUG: 'countySlug',              // URL slug (e.g., "lee")
  
  // Contact info
  PRIMARY_PHONE: 'primaryPhone',
  
  // Sheriff/Jail info
  BOOKING_WEBSITE: 'bookingWebsiteLink',
  BOOKING_PHONE: 'bookingPhoneNumber',
  
  // Clerk info
  CLERK_WEBSITE: 'countyClerkWebsitelink',
  CLERK_PHONE: 'countyClerkPhoneNumber',
  RECORDS_SEARCH: 'recordsSearchLink',
  
  // SEO
  SEO_TITLE: 'seoTitle',
  SEO_DESCRIPTION: 'seoDescription',
  
  // Content
  SERVICE_AREA_COPY: 'serviceAreaCopy',
  H1_HEADLINE: 'h1Headline',
  CTA_LINK: 'ctaLink'
};
