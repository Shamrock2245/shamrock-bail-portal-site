// Locate an Inmate (Directory Page)
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Locate Page Loaded (v2 Hardened)...");

    const rep = $w('#sectionList');

    // 1. Check Repeater Existence
    if (rep.length === 0) {
        console.error("CRITICAL: Repeater #sectionList NOT FOUND on this page.");
        return;
    }

    try {
        // 2. Fetch Data
        console.log("DEBUG: Fetching counties...");
        let counties = await getCounties();

        if (!counties || counties.length === 0) {
            console.warn("DEBUG: No counties returned from backend. Using fallback data.");
            // Fallback data to prevent blank page
            counties = [
                { name: "Alachua", slug: "alachua", countySeat: "Gainesville" },
                { name: "Charlotte", slug: "charlotte", countySeat: "Punta Gorda" },
                { name: "Collier", slug: "collier", countySeat: "Naples" },
                { name: "Hendry", slug: "hendry", countySeat: "LaBelle" },
                { name: "Lee", slug: "lee", countySeat: "Fort Myers" },
                { name: "Sarasota", slug: "sarasota", countySeat: "Sarasota" },
                { name: "Manatee", slug: "manatee", countySeat: "Bradenton" },
                { name: "Desoto", slug: "desoto", countySeat: "Arcadia" }
            ];
        }

        console.log(`DEBUG: Loaded ${counties.length} counties. Populating repeater...`);

        // 3. Populate Repeater - ORDER MATTERS: Handler first, then Data
        rep.onItemReady(($item, itemData) => {
            // A. Prepare Data
            const countyName = (itemData.name || itemData.countyName || "Unknown") + " County";
            const city = itemData.countySeat || "Southwest Florida";
            const descText = `Serving ${city} & Surrounding Areas`;
            const internalLink = `/bail-bonds/${itemData.slug}`;
            const externalSearchLink = itemData.bookingWebsite || itemData.recordsSearch || itemData.sheriffWebsite;

            // B. Map to Elements (Safely)
            const $title = $item('#textTitle').length ? $item('#textTitle') : $item('#itemTitle');
            if ($title.length) $title.text = countyName;

            const $desc = $item('#textDesc');
            if ($desc.length) $desc.text = descText;

            // C. Interaction Logic
            // 1. Container Click -> Internal Page
            if ($item('#container1').length) {
                $item('#container1').onClick(() => wixLocation.to(internalLink));
            }

            // 2. Action Button Click -> Arrest Search (External) or Internal
            const $btn = $item('#actionButton');
            if ($btn.length) {
                if ($btn.label) $btn.label = "Arrest Search"; // Reset label if possible

                if (externalSearchLink) {
                    // Go to external search
                    $btn.onClick(() => wixLocation.to(externalSearchLink));
                } else {
                    // Fallback to internal page
                    $btn.onClick(() => wixLocation.to(internalLink));
                }
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