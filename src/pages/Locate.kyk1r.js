// Locate an Inmate (Directory Page)
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getNearestCounties, getCounties } from 'backend/counties';
import { autoDetectLocation } from 'public/geolocation-client';

$w.onReady(async function () {
    console.log("🚀 Locate Page Loaded (v3.1 Geo+ShortURL)...");

    const rep = $w('#sectionList');

    // 1. Check Repeater Existence
    if (!rep) {
        console.error("CRITICAL: Repeater #sectionList NOT FOUND on this page.");
        return;
    }

    try {
        // 2. Determine Location & Fetch Data
        console.log("DEBUG: Detecting location...");
        let counties = [];
        let isGeoBased = false;

        try {
            // Attempt silent auto-detection
            const loc = await autoDetectLocation();

            if (loc.success && loc.latitude && loc.longitude) {
                console.log(`DEBUG: Location found (${loc.county} County). Fetching nearest...`);
                // Get 9 nearest counties
                counties = await getNearestCounties(loc.latitude, loc.longitude, 9);
                isGeoBased = true;
            } else {
                console.log("DEBUG: Location not detected. Fetching default list...");
                counties = await getCounties();
            }
        } catch (err) {
            console.warn("DEBUG: Geolocation failed, using default fallback.", err);
            counties = await getCounties();
        }

        // 3. Fallback if backend returns nothing
        if (!counties || counties.length === 0) {
            console.warn("DEBUG: No data from backend. Using static fallback.");
            counties = getFallbackData();
        }

        console.log(`DEBUG: Final County Data Count: ${counties.length}`);

        // 4. Populate Repeater
        rep.onItemReady(($item, itemData) => {
            // A. Prepare Data
            const countyName = (itemData.name || "Unknown") + " County";
            const city = itemData.countySeat || "Southwest Florida";

            // Map JSON keys to expected variables
            const externalSearchLink = itemData.bookingUrl || itemData.bookingWebsite || itemData.recordsUrl || itemData.sheriffWebsite || itemData.booking_url;
            const internalLink = `/bail-bonds/${itemData.slug}`;

            // Create display text logic
            let descText = `Serving ${city} & Surrounding Areas`;
            if (externalSearchLink) {
                // SHORTENED URL LOGIC per user request
                try {
                    // Extract hostname (e.g., www.sheriffleefl.org -> sheriffleefl.org)
                    let hostname = new URL(externalSearchLink).hostname;
                    hostname = hostname.replace('www.', '');

                    // Truncate hostname if excessively long to maintain uniform box size
                    if (hostname.length > 28) {
                        descText = hostname.substring(0, 25) + '...';
                    } else {
                        descText = hostname;
                    }
                } catch (e) {
                    descText = "Inmate Search";
                }
            }

            // B. Map to Elements
            $item('#textTitle').text = countyName;
            $item('#textDesc').text = descText; // Guaranteed to be short now

            // C. Interaction Logic
            // 1. Container Click -> Internal Page
            $item('#container1').onClick(() => wixLocation.to(internalLink));

            // 2. Action Button Click -> Arrest Search (External) or Internal
            const $btn = $item('#btnAction');
            $btn.label = "GO";

            if (externalSearchLink) {
                $btn.onClick(() => wixLocation.to(externalSearchLink));
            } else {
                $btn.onClick(() => wixLocation.to(internalLink));
            }
        });

        // Set Data
        // Ensure _id exists
        rep.data = counties.map((c, i) => ({ ...c, _id: c._id || c.slug || `gen_id_${i}` }));

        // 5. Update SEO
        updatePageSEO(counties, isGeoBased);

    } catch (err) {
        console.error("CRITICAL ERROR in Locate Page:", err);
    }
});

// --- Fallback Data ---
function getFallbackData() {
    return [
        { _id: "fb_alachua", name: "Alachua", slug: "alachua-county", countySeat: "Gainesville" },
        { _id: "fb_charlotte", name: "Charlotte", slug: "charlotte-county", countySeat: "Punta Gorda" },
        { _id: "fb_collier", name: "Collier", slug: "collier-county", countySeat: "Naples" },
        { _id: "fb_hendry", name: "Hendry", slug: "hendry-county", countySeat: "LaBelle" },
        { _id: "fb_lee", name: "Lee", slug: "lee-county", countySeat: "Fort Myers" },
        { _id: "fb_sarasota", name: "Sarasota", slug: "sarasota-county", countySeat: "Sarasota" }
    ];
}

// --- SEO Helper ---
function updatePageSEO(counties, isGeo) {
    const pageTitle = isGeo ? "Inmate Search Near You | Shamrock Bail Bonds" : "Locate an Inmate | Shamrock Bail Bonds";
    const pageDesc = "Find inmate arrest records and mugshots in Florida. Quick search for Lee, Collier, Charlotte, Hendry, and surrounding counties.";
    const pageUrl = "https://www.shamrockbailbonds.biz/locate";

    // 1. Meta Tags
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "website" }
    ]);

    // 2. Structured Data (Directory Schema)
    if (counties && counties.length > 0) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Florida Inmate Search Directory",
            "description": pageDesc,
            "url": pageUrl,
            "hasPart": counties.map(c => ({
                "@type": "CreativeWork",
                "name": `${c.name} County Bail Bonds`,
                "url": `https://www.shamrockbailbonds.biz/bail-bonds/${c.slug}`
            }))
        };

        wixSeo.setStructuredData([schema])
            .then(() => console.log("✅ Locate Page SEO Set"))
            .catch(e => console.error("❌ Locate Page SEO Error", e));
    }
}