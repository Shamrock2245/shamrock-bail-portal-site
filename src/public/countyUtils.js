// countyUtils.js
import wixData from 'wix-data';

// Cache for county data
let countyCache = null;

/**
 * Fetch all counties from the FloridaCounties collection
 * @returns {Promise<Array>} List of county objects
 */
export async function getCounties() {
    if (countyCache) {
        return countyCache;
    }

    try {
        const results = await wixData.query("Import1")
            .ascending("name")
            .limit(100)
            .find();
            
        countyCache = results.items;
        return countyCache;
    } catch (error) {
        console.error("Failed to fetch counties:", error);
        return [];
    }
}

/**
 * Get specific county details by slug
 * @param {string} slug - The URL slug for the county
 * @returns {Promise<Object|null>} County object or null
 */
export async function getCountyBySlug(slug) {
    try {
        const results = await wixData.query("Import1")
            .eq("slug", slug)
            .limit(1)
            .find();
            
        if (results.items.length > 0) {
            return results.items[0];
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
        const results = await wixData.query("Import1")
            .eq("region", region)
            .ne("_id", currentId)
            .limit(4)
            .find();
            
        return results.items;
    } catch (error) {
        console.error("Failed to fetch nearby counties:", error);
        return [];
    }
}
