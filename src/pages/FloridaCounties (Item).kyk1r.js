// Force Sync: Restoring Dynamic Page Code
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCountyBySlug } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Dynamic County Page Loading...");

    // 1. Extract Slug from URL
    const path = wixLocation.path;
    // Handle both /county/lee and /floridacounties-1/lee formats
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log("📍 Extracted Slug:", countySlug);

    if (!countySlug) {
        console.error("❌ No slug found in URL");
        $w('#countyName').text = "County Not Found";
        return;
    }

    try {
        // 2. Fetch County Data
        const county = await getCountyBySlug(countySlug);

        if (!county) {
            console.error("❌ County data not found for slug:", countySlug);
            $w('#countyName').text = "County Data Not Found";
            return;
        }

        console.log("✅ County Data Loaded:", county.name);

        // 3. Populate Page Elements
        $w('#countyName').text = county.name + " County";

        // Dynamic Header (if exists)
        const headerText = $w('#dynamicHeader'); // Check if this ID matches user's new page
        if (headerText.valid) headerText.text = `Bail Bonds in ${county.name} County`;

        // 4. Update SEO Tags
        wixSeo.setTitle(`Bail Bonds ${county.name} County | Shamrock Bail Bonds`);
        wixSeo.setMetaTags([{
            "name": "description",
            "content": `24/7 Bail Bonds in ${county.name} County. Call 1239-955-0301 for immediate release. Fast, confidential service.`
        }]);

    } catch (error) {
        console.error("❌ Error initializing page:", error);
    }
});
