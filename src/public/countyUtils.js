// countyUtils.js
import { getCounties as fetchCountiesBackend } from 'backend/counties.jsw';

let countyCache = null;

export async function getCounties() {
    if (countyCache) return countyCache;

    try {
        // Direct Backend Call
        const response = await fetchCountiesBackend();

        if (!response.success || !response.data) return [];

        const rawItems = response.data.counties || [];

        countyCache = rawItems.map((county, index) => {
            const name = county.county_name || county.name || "Unknown";
            const slug = (county.slug || name.toLowerCase().replace(/\s+/g, '-'));

            return {
                _id: county._id || `generated-${index}`,
                name: name,
                slug: slug,
                primaryPhone: county.phone_sheriff || "(239) 332-2245",
                bookingWebsite: county.sheriff_url,
                clerkWebsite: county.clerk_url,
                jailPhone: county.phone_sheriff,
                clerkPhone: county.phone_clerk,
                jailName: county.jailName || `${name} County Jail`,
                jailAddress: county.jailAddress,
                countySeat: county.countySeat,
                countyName: name,
                countySlug: slug
            };
        });

        return countyCache;
    } catch (error) {
        console.error("DEBUG: Failed to fetch counties", error);
        return [];
    }
}

export async function getCountyBySlug(slug) {
    const counties = await getCounties();
    return counties.find(c => c.slug === slug) || null;
}

export async function getNearbyCounties(region, currentId) {
    const counties = await getCounties();
    return counties.filter(c => c._id !== currentId).slice(0, 4);
}