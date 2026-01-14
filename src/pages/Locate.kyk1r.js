// Locate an Inmate (Directory Page) - Mobile Optimized
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Locate Page Loaded (v3 Mobile Optimized)...");

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
                { name: "Alachua", slug: "alachua", countySeat: "Gainesville", bookingWebsite: "https://www.alachuasheriff.org/inmates" },
                { name: "Charlotte", slug: "charlotte", countySeat: "Punta Gorda", bookingWebsite: "https://ccso.org/correctional_facility/local_arrest_database.php" },
                { name: "Collier", slug: "collier", countySeat: "Naples", bookingWebsite: "https://www2.colliersheriff.org/arrestsearch/" },
                { name: "Hendry", slug: "hendry", countySeat: "LaBelle", bookingWebsite: "https://www.hendrysheriff.org/inmateSearch" },
                { name: "Lee", slug: "lee", countySeat: "Fort Myers", bookingWebsite: "https://www.sheriffleefl.org/booking-search/" },
                { name: "Sarasota", slug: "sarasota", countySeat: "Sarasota", bookingWebsite: "https://www.sarasotasheriff.org/arrest-inquiry.html" },
                { name: "Manatee", slug: "manatee", countySeat: "Bradenton", bookingWebsite: "https://www.manateesheriff.com/inmate-search.html" },
                { name: "Desoto", slug: "desoto", countySeat: "Arcadia", bookingWebsite: "https://www.desotosheriff.org/inmate-search" }
            ];
        }

        console.log(`DEBUG: Loaded ${counties.length} counties. Populating repeater...`);

        // 3. Populate Repeater
        rep.data = counties;

        rep.onItemReady(($item, itemData, index) => {
            console.log(`DEBUG: Processing item ${index}:`, itemData.name);

            // A. Prepare Data
            const countyName = (itemData.name || itemData.countyName || "Unknown") + " County";
            const city = itemData.countySeat || "Southwest Florida";
            const descText = `Serving ${city} & Surrounding Areas`;
            const internalLink = `/bail-bonds/${itemData.slug}`;
            const externalSearchLink = itemData.bookingWebsite || itemData.recordsSearch || itemData.sheriffWebsite;

            // B. Map to Elements - FIXED: Direct assignment without length check
            try {
                // Title
                const $title = $item('#textTitle');
                $title.text = countyName;
                console.log(`  ✅ Set title: ${countyName}`);

                // Description
                const $desc = $item('#textDesc');
                $desc.text = descText;
                console.log(`  ✅ Set description: ${descText}`);

                // C. Interaction Logic
                // 1. Make entire card clickable -> Internal Page
                $item.onClick(() => {
                    console.log(`Card clicked: ${countyName} -> ${internalLink}`);
                    wixLocation.to(internalLink);
                });

                // 2. If there's a button, set it up for Arrest Search
                try {
                    const $btn = $item('#actionButton');
                    if ($btn) {
                        $btn.label = "Arrest Search";
                        
                        if (externalSearchLink) {
                            $btn.onClick((event) => {
                                event.stopPropagation(); // Prevent card click
                                console.log(`Button clicked: ${countyName} -> ${externalSearchLink}`);
                                wixLocation.to(externalSearchLink);
                            });
                        } else {
                            $btn.onClick((event) => {
                                event.stopPropagation(); // Prevent card click
                                console.log(`Button clicked: ${countyName} -> ${internalLink}`);
                                wixLocation.to(internalLink);
                            });
                        }
                    }
                } catch (btnErr) {
                    // Button doesn't exist, that's okay
                    console.log(`  ℹ️  No action button found (optional)`);
                }

                // D. Mobile Optimization - Show/Hide elements
                $title.show();
                $desc.show();

            } catch (err) {
                console.error(`ERROR processing item ${index} (${itemData.name}):`, err);
            }
        });

        // 4. Show the repeater
        rep.show();
        console.log("✅ Repeater populated and visible");

    } catch (err) {
        console.error("CRITICAL ERROR in Locate Page:", err);
    }
});
