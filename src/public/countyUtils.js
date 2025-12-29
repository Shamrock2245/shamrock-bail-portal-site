// countyUtils.js
import wixData from 'wix-data';
// import { COLLECTIONS } from 'backend/collectionIds';
const COLLECTIONS = {
    FLORIDA_COUNTIES: 'Import1'
};

// Cache for county data
let countyCache = null;

/**
 * Fetch all counties from the FloridaCounties collection
 * @returns {Promise<Array>} List of county objects with normalized field names
 */
export async function getCounties() {
    console.log("DEBUG: getCounties() started");
    console.log("DEBUG: Using Collection ID:", COLLECTIONS.FLORIDA_COUNTIES);

    // if (countyCache) {
    //     console.log("DEBUG: Returning cached counties:", countyCache.length);
    //     return countyCache;
    // }

    try {
        console.log("DEBUG: Executing wixData.query...");

        // Strategy: Try the config ID first ('Import1'), if empty, try 'FloridaCounties'
        let results = await wixData.query(COLLECTIONS.FLORIDA_COUNTIES)
            .ascending("countyName")
            .limit(100)
            .find();

        if (results.totalCount === 0) {
            console.warn(`DEBUG: Collection '${COLLECTIONS.FLORIDA_COUNTIES}' is empty or not found. Trying fallback ID 'FloridaCounties'...`);
            results = await wixData.query("FloridaCounties")
                .ascending("countyName")
                .limit(100)
                .find();
        }

        console.log("DEBUG: Query successful. Total items found:", results.totalCount);
        console.log("DEBUG: Raw items (first 3):", results.items.slice(0, 3));

        let itemsToMap = results.items;

        // --- MOCK DATA INJECTION REMOVED (DB Verified: 67 items found) ---
        // if (itemsToMap.length === 0) {
        //     console.warn("DEBUG: No items found in DB. injecting MOCK DATA.");
        //     itemsToMap = [
        //         {
        //             _id: "mock-1",
        //             countyName: "Mock Alachua",
        //             countySlug: "alachua", // Valid slug to test routing
        //             title: "Mock Alachua Bail Bonds",
        //             primaryPhone: "(555) 123-4567"
        //         },
        //         {
        //             _id: "mock-2",
        //             countyName: "Mock Lee",
        //             countySlug: "lee",
        //             title: "Mock Lee Bail Bonds",
        //             primaryPhone: "(555) 987-6543"
        //         }
        //     ];
        // }
        // ---------------------------

        // Normalize field names for consistent use across the site
        countyCache = itemsToMap.map(county => ({
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

        console.log("DEBUG: Normalized counties count:", countyCache.length);
        return countyCache;
    } catch (error) {
        console.error("DEBUG: Failed to fetch counties:", error);
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

        // if (results.items.length > 0) {
        //     const county = results.items[0];

        // let foundItem = results.items.length > 0 ? results.items[0] : null;

        // --- MOCK DATA INJECTION REMOVED ---
        // if (!foundItem) { ... }
        // ---------------------------

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
