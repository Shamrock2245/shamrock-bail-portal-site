/**
 * Wix CMS Collection ID Mapping
 * 
 * This module provides a centralized mapping between human-readable
 * collection names and their actual Wix collection IDs.
 * 
 * Wix assigns collection IDs like "Import1", "Import2", etc., but we want
 * to reference them with meaningful names in our code for better readability
 * and maintainability.
 * 
 * Usage:
 * import { COLLECTIONS } from 'backend/collectionIds';
 * wixData.query(COLLECTIONS.FLORIDA_COUNTIES)...
 */

export const COLLECTIONS = {
  // Core Collections
  FLORIDA_COUNTIES: 'Import21',       // County data (Updated: was Import1)
  CASES: 'Import2',                   // Bail bond cases
  MEMBER_DOCUMENTS: 'Import3',        // Uploaded IDs and documents
  CHECK_IN_RECORDS: 'Import4',        // GPS check-in records
  FINANCIAL_OBLIGATIONS: 'Import5',   // Indemnitor financial tracking
  BAIL_START_LOGS: 'Import6',         // Audit logs for bail paperwork initiation
  FAQ: 'Import10',                    // Frequently asked questions

  // Supporting Collections
  TESTIMONIALS: 'Testimonials',       // Client testimonials
  CONTACT_SUBMISSIONS: 'ContactSubmissions', // Contact form submissions
  BAIL_SCHOOL_SIGNUPS: 'BailSchoolSignups',  // Bail school interest signups

  // System Collections (Wix-managed)
  BLOG_POSTS: 'Blog/Posts',
  BLOG_CATEGORIES: 'Blog/Categories',
  BLOG_TAGS: 'Blog/Tags'
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
  [COLLECTIONS.FLORIDA_COUNTIES]: 'Import21 (Counties)',
  [COLLECTIONS.CASES]: 'Import2',
  [COLLECTIONS.MEMBER_DOCUMENTS]: 'Import3',
  [COLLECTIONS.CHECK_IN_RECORDS]: 'Import4',
  [COLLECTIONS.FINANCIAL_OBLIGATIONS]: 'Import5',
  [COLLECTIONS.BAIL_START_LOGS]: 'Import6',
  [COLLECTIONS.FAQ]: 'FAQ',
  [COLLECTIONS.TESTIMONIALS]: 'Testimonials',
  [COLLECTIONS.CONTACT_SUBMISSIONS]: 'Contact Submissions',
  [COLLECTIONS.BAIL_SCHOOL_SIGNUPS]: 'Bail School Signups'
};
