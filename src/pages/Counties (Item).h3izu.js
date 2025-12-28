// Force Sync: Spy Code for File h3izu
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCountyBySlug } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 SPY: File h3izu (Counties Item) is ACTIVE!");

    // 1. Extract Slug from URL
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log("📍 h3izu Slug:", countySlug);

    if (!countySlug) {
        console.error("❌ h3izu: No slug found");
        return;
    }

    try {
        const county = await getCountyBySlug(countySlug);

        if (!county) {
            console.error("❌ h3izu: County not found for:", countySlug);
            $w('#countyName').text = "Data Not Found (h3izu)";
            return;
        }

        console.log("✅ h3izu: Loaded Data for", county.name);

        // 3. Populate Page Elements
        // Note: ID names might need to be verified in Editor
        const nameText = $w('#countyName');
        if (nameText.valid) nameText.text = county.name + " County";

        // Dynamic Header
        const headerText = $w('#dynamicHeader');
        if (headerText.valid) headerText.text = `Bail Bonds in ${county.name} County`;

        // 4. Update SEO Tags
        wixSeo.setTitle(`Bail Bonds ${county.name} County | Shamrock Bail Bonds`);

    } catch (error) {
        console.error("❌ h3izu Error:", error);
    }
});
