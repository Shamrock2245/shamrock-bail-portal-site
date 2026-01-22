// Locate an Inmate (Directory Page)
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Locate Page Loaded (v2 Hardened)...");

    const rep = $w('#sectionList');

    // 1. Check Repeater Existence (Simple null check)
    if (!rep) {
        console.error("CRITICAL: Repeater #sectionList NOT FOUND on this page.");
        return;
    }

    try {
        // 2. Fetch Data
        console.log("DEBUG: Fetching counties...");
        let counties = await getCounties();

        if (!counties || counties.length === 0) {
            console.warn("DEBUG: No counties returned from backend. Using fallback data.");
            // Fallback data to prevent blank page - FIXED: Added _ids
            counties = [
                { _id: "fallback_alachua", name: "Alachua", slug: "alachua", countySeat: "Gainesville" },
                { _id: "fallback_charlotte", name: "Charlotte", slug: "charlotte", countySeat: "Punta Gorda" },
                { _id: "fallback_collier", name: "Collier", slug: "collier", countySeat: "Naples" },
                { _id: "fallback_hendry", name: "Hendry", slug: "hendry", countySeat: "LaBelle" },
                { _id: "fallback_lee", name: "Lee", slug: "lee", countySeat: "Fort Myers" },
                { _id: "fallback_sarasota", name: "Sarasota", slug: "sarasota", countySeat: "Sarasota" },
                { _id: "fallback_manatee", name: "Manatee", slug: "manatee", countySeat: "Bradenton" },
                { _id: "fallback_desoto", name: "Desoto", slug: "desoto", countySeat: "Arcadia" }
            ];
        }

        console.log(`DEBUG: Final County Data Count: ${counties.length}`);

        // Validation: Check if items have _id
        if (counties.length > 0 && !counties[0]._id) {
            console.warn("DEBUG: Data items missing _id. Auto-generating...");
            counties = counties.map((c, i) => ({ ...c, _id: c._id || `gen_id_${i}` }));
        }

        console.log("DEBUG: Populating repeater with data...");

        // 3. Populate Repeater - ORDER MATTERS: Handler first, then Data
        rep.onItemReady(($item, itemData) => {
            // A. Prepare Data
            const countyName = (itemData.name || itemData.countyName || "Unknown") + " County";
            const city = itemData.countySeat || "Southwest Florida";
            // User Request: Text should be the website link
            const externalSearchLink = itemData.bookingWebsite || itemData.recordsSearch || itemData.sheriffWebsite;
            const descText = externalSearchLink || `Serving ${city} & Surrounding Areas`;
            const internalLink = `/bail-bonds/${itemData.slug}`;

            // B. Map to Elements
            // We trust the IDs now as per user confirmation
            $item('#textTitle').text = countyName;

            // Handle Description
            const description = descText.length > 50 ? descText.substring(0, 47) + "..." : descText;
            $item('#textDesc').text = description;

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

        // Assign Data triggers the ItemReady event
        rep.data = counties;

        // 4. Update SEO
        updatePageSEO(counties);

    } catch (err) {
        console.error("CRITICAL ERROR in Locate Page:", err);
    }
});

// --- SEO Helper ---
function updatePageSEO(counties) {
    const pageTitle = "Locate an Inmate | Shamrock Bail Bonds";
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

    // 2. Structured Data
    const schemas = [];

    // A. BreadcrumbList
    schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.shamrockbailbonds.biz/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Locate Inmate",
                "item": pageUrl
            }
        ]
    });

    // B. CollectionPage (Directory schema)
    // We list the counties as parts of this collection
    if (counties && counties.length > 0) {
        schemas.push({
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
        });
    }

    wixSeo.setStructuredData(schemas)
        .then(() => console.log("✅ Locate Page SEO Set"))
        .catch(e => console.error("❌ Locate Page SEO Error", e));
}