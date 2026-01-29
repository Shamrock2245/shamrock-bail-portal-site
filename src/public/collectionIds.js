/**
 * Wix CMS Collection ID Mapping
 * 
 * This module provides a centralized mapping between human-readable
 * collection names and their actual Wix collection IDs.
 * 
 * Updated: 2026-01-21
 * Verified against live CMS - 27 collections total
 * Collection names match exactly what appears in Wix CMS dashboard
 * 
 * Usage:
 * import { COLLECTIONS } from 'public/collectionIds';
 * wixData.query(COLLECTIONS.CASES)...
 */

export const COLLECTIONS = {
  // Core Business Collections
  CASES: 'Cases',                              // Bail bond cases - main data
  INTAKE_QUEUE: 'IntakeQueue',                 // Indemnitor intake submissions
  DEFENDANTS: 'Defendants',                    // Defendant records

  INDEMNITORS: 'Indemnitors',                  // Indemnitor/co-signer records
  PERSONS: 'Persons',                          // Person records (general)

  // Portal & Authentication
  PORTAL_USERS: 'Portal Users',                // Portal user accounts (space in name!)
  PORTAL_SESSIONS: 'Portal Sessions',          // Active portal sessions (space in name!)
  MAGIC_LINKS: 'Magiclinks',                   // Magic link authentication tokens

  // Documents & Signing
  MEMBER_DOCUMENTS: 'Memberdocuments',         // Uploaded IDs and documents
  PENDING_DOCUMENTS: 'Pendingdocuments',       // Documents pending signature
  REQUIRED_DOCUMENTS: 'Requireddocuments',     // Required document types
  SIGNING_SESSIONS: 'Signing Sessions',        // SignNow signing sessions (space in name!)
  SIGNNOW_HANDOFFS: 'Signnowhandoffs',         // SignNow integration handoff records

  // Financial
  FINANCIAL_OBLIGATIONS: 'Financial Obligations', // Financial tracking (space in name!)
  PAYMENT_PLANS: 'Payment Plans',              // Payment plan records (space in name!)
  COMMON_CHARGES: 'Common Charges',            // Common charges and bond amounts (space in name!)

  // Location & County Data
  FLORIDA_COUNTIES: 'FloridaCounties',         // Florida county data (Verified: No space in ID)
  COUNTIES: 'Counties',                        // General county data
  GEOLOCATION_CACHE: 'Geolocationcache',       // Cached geolocation lookups
  USER_LOCATIONS: 'Userlocations',             // User location check-ins

  // Analytics & Logging
  ANALYTICS_EVENTS: 'Analyticsevents',         // Site analytics events
  BAIL_START_LOGS: 'Bailstartlogs',            // Audit logs for bail paperwork initiation
  CALL_LOGS: 'Calllogs',                       // Call tracking logs

  // User Profiles
  MEMBER_PROFILES: 'Memberprofiles',           // Member profile information

  // Supporting Collections
  FAQS: 'Faqs',                                // Frequently asked questions
  TESTIMONIALS: 'Testimonials',                // Client testimonials
  CONTACT_SUBMISSIONS: 'Contactsubmissions',   // Contact form submissions
  BAIL_SCHOOL_SIGNUPS: 'Bailschoolsignups',    // Bail school interest signups

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
 * Maps collection IDs back to display-friendly names
 */
export const COLLECTION_DISPLAY_NAMES = {
  [COLLECTIONS.CASES]: 'Cases',
  [COLLECTIONS.DEFENDANTS]: 'Defendants',
  [COLLECTIONS.INDEMNITORS]: 'Indemnitors',
  [COLLECTIONS.PERSONS]: 'Persons',
  [COLLECTIONS.PORTAL_USERS]: 'Portal Users',
  [COLLECTIONS.PORTAL_SESSIONS]: 'Portal Sessions',
  [COLLECTIONS.MAGIC_LINKS]: 'Magic Links',
  [COLLECTIONS.MEMBER_DOCUMENTS]: 'Member Documents',
  [COLLECTIONS.PENDING_DOCUMENTS]: 'Pending Documents',
  [COLLECTIONS.REQUIRED_DOCUMENTS]: 'Required Documents',
  [COLLECTIONS.SIGNING_SESSIONS]: 'Signing Sessions',
  [COLLECTIONS.SIGNNOW_HANDOFFS]: 'SignNow Handoffs',
  [COLLECTIONS.FINANCIAL_OBLIGATIONS]: 'Financial Obligations',
  [COLLECTIONS.PAYMENT_PLANS]: 'Payment Plans',
  [COLLECTIONS.COMMON_CHARGES]: 'Common Charges',
  [COLLECTIONS.FLORIDA_COUNTIES]: 'Florida Counties',
  [COLLECTIONS.COUNTIES]: 'Counties',
  [COLLECTIONS.GEOLOCATION_CACHE]: 'Geolocation Cache',
  [COLLECTIONS.USER_LOCATIONS]: 'User Locations',
  [COLLECTIONS.ANALYTICS_EVENTS]: 'Analytics Events',
  [COLLECTIONS.BAIL_START_LOGS]: 'Bail Start Logs',
  [COLLECTIONS.CALL_LOGS]: 'Call Logs',
  [COLLECTIONS.MEMBER_PROFILES]: 'Member Profiles',
  [COLLECTIONS.FAQS]: 'FAQs',
  [COLLECTIONS.TESTIMONIALS]: 'Testimonials',
  [COLLECTIONS.CONTACT_SUBMISSIONS]: 'Contact Submissions',
  [COLLECTIONS.BAIL_SCHOOL_SIGNUPS]: 'Bail School Signups'
};

/**
 * Field name mappings for Florida Counties collection
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
  JAIL_NAME: 'jailName',
  JAIL_PHONE: 'jailPhone',
  JAIL_BOOKING_URL: 'jailBookingUrl',
  SHERIFF_NAME: 'sheriffName',
  SHERIFF_WEBSITE: 'sheriffWebsite',

  // Clerk info
  CLERK_NAME: 'clerkName',
  CLERK_PHONE: 'clerkPhone',
  CLERK_WEBSITE: 'clerkWebsite',
  RECORDS_SEARCH: 'recordsSearchLink',

  // SEO
  SEO_TITLE: 'seoTitle',
  SEO_DESCRIPTION: 'seoDescription',

  // Content
  SERVICE_AREA_COPY: 'serviceAreaCopy',
  H1_HEADLINE: 'h1Headline',
  CTA_LINK: 'ctaLink'
};
