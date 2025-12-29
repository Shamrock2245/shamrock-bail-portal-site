// countyUtils.js
import wixData from 'wix-data';
import { COLLECTIONS } from 'backend/collectionIds';

// Cache for county data
let countyCache = null;

/**
 * Fetch all counties from the FloridaCounties collection
 * @returns {Promise<Array>} List of county objects with normalized field names
 */
export async function getCounties() {
    if (countyCache) {
        return countyCache;
    }

    try {
        const results = await wixData.query(COLLECTIONS.FLORIDA_COUNTIES)
            .ascending("countyName")
            .limit(100)
            .find();
        
        // Normalize field names for consistent use across the site
        countyCache = results.items.map(county => ({
            _id: county._id,
            name: county.countyName,           // Map countyName -> name
            slug: county.countySlug,           // Map countySlug -> slug
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
            ctaLink: county.ctaLink,
            // Keep original fields for backward compatibility
            countyName: county.countyName,
            countySlug: county.countySlug
        }));
        
        return countyCache;
    } catch (error) {
        console.error("Failed to fetch counties:", error);
        return [];
    }
}

/**
 * Get specific county details by slug
 * @param {string} slug - The URL slug for the county (e.g., "lee")
 * @returns {Promise<Object|null>} County object or null
 */
export async function getCountyBySlug(slug) {
    try {
        const results = await wixData.query(COLLECTIONS.FLORIDA_COUNTIES)
            .eq("countySlug", slug)
            .limit(1)
            .find();
            
        if (results.items.length > 0) {
            const county = results.items[0];
            // Return normalized object
            return {
                _id: county._id,
                name: county.countyName,
                slug: county.countySlug,
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
                ctaLink: county.ctaLink,
                // Keep original for compatibility
                countyName: county.countyName,
                countySlug: county.countySlug
            };
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch county ${slug}:`, error);
        return null;
    }
}

/**
 * Get nearby counties based on region
 * @param {string} region - The region of the current county
 * @param {string} currentId - ID of current county to exclude
 * @returns {Promise<Array>} List of nearby county objects
 */
export async function getNearbyCounties(region, currentId) {
    try {
        // Note: region field doesn't exist in current schema
        // This will need to be added to the collection or logic changed
        const results = await wixData.query(COLLECTIONS.FLORIDA_COUNTIES)
            .ne("_id", currentId)
            .limit(4)
            .find();
        
        // Normalize results
        return results.items.map(county => ({
            _id: county._id,
            name: county.countyName,
            slug: county.countySlug,
            title: county.title
        }));
    } catch (error) {
        console.error("Failed to fetch nearby counties:", error);
        return [];
    }
}
