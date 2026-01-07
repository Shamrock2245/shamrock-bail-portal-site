// countyUtils.js
import { get_allCounties } from 'backend/counties-api.web';

// Cache for county data
let countyCache = null;

/**
 * Fetch all counties from the backend source via web module
 * @returns {Promise<Array>} List of county objects with normalized field names
 */
export async function getCounties() {
    console.log("DEBUG: getCounties() started (via Web Module)");

    if (countyCache) {
        console.log("DEBUG: Returning cached counties:", countyCache.length);
        return countyCache;
    }

    try {
        const result = await get_allCounties();

        if (!result.success || !result.counties || !Array.isArray(result.counties)) {
            console.warn("DEBUG: Web module returned invalid structure", result);
            return [];
        }

        const rawItems = result.counties;
        console.log("DEBUG: Web module returned count:", rawItems.length);

        // Normalize field names for consistent use across the site
        countyCache = rawItems.map((county, index) => {
            const name = county.county_name || county.name || "Unknown";
            const slug = (county.slug || name.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-'));

            return {
                _id: county._id || `generated-${index}`,
                name: name,
                slug: slug,
                title: `${name} County Bail Bonds`,
                primaryPhone: county.phone_sheriff || "(239) 332-2245", // Fallback to main number
                bookingWebsite: county.sheriff_url,
                bookingPhone: county.phone_sheriff,
                clerkWebsite: county.clerk_url,
                clerkPhone: county.phone_clerk,
                recordsSearch: county.jail_roster_url,

                // SEO Defaults
                seoTitle: `Bail Bonds in ${name} County, FL | Shamrock Bail Bonds`,
                seoDescription: `Fast, professional bail bond services in ${name} County, Florida. Available 24/7.`,
                h1Headline: `${name} County Bail Bonds`,
                ctaLink: `/county/${slug}`,

                // Compatibility fields
                countyName: name,
                countySlug: slug
            };
        });

        console.log("DEBUG: Normalized counties count:", countyCache.length);
        return countyCache;
    } catch (error) {
        console.error("DEBUG: Failed to fetch counties from web module:", error);
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
        const counties = await getCounties();
        const found = counties.find(c => c.slug === slug);
        return found || null;
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
        const counties = await getCounties();
        // Since we don't have region data yet, just return 4 random counties that aren't the current one
        return counties
            .filter(c => c._id !== currentId)
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
    } catch (error) {
        console.error("Failed to fetch nearby counties:", error);
        return [];
    }
}
