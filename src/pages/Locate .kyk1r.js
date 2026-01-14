// Locate an Inmate (Directory Page)
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Locate Page Loaded...");

    // 1. Setup Repeater (Use the ID from your screenshot or a standard one)
    // Screenshot shows "#sectionList" selected.
    const rep = $w('#sectionList');

    // Fallback if user named it differently
    if (rep.length === 0) {
        console.error("DEBUG: Repeater #sectionList not found.");
        return;
    }

    try {
        // 2. Fetch All Counties
        const counties = await getCounties();

        if (!counties || counties.length === 0) {
            console.warn("DEBUG: No counties found.");
            rep.collapse();
            return;
        }

        console.log(`DEBUG: Loaded ${counties.length} counties for directory.`);

        // 3. Populate Repeater
        rep.data = counties;

        rep.onItemReady(($item, itemData) => {
            // --- MAP DATA TO ELEMENTS ---

            // 1. TEXT
            const title = itemData.name + " County";
            const desc = "Bail Bonds & Inmate Search";

            // User requested: Dynamic text mentioning the main city (County Seat)
            const city = itemData.countySeat || "Southwest Florida";
            const desc = `Serving ${city} & Surrounding Areas`;

            if ($item('#textDesc').length) $item('#textDesc').text = desc;

            // 2. LINKING (Click Action)
            const link = `/bail-bonds/${itemData.slug}`;

            // Bind click to Container and Button (if present)
            // Removed #vectorImage as requested
            const clickableElements = ['#container1', '#actionButton', '#group1'];

            clickableElements.forEach(id => {
                const el = $item(id);
                if (el.length > 0) {
                    el.onClick(() => wixLocation.to(link));
                    // If it's the button, ensure label is set
                    if (el.type === '$w.Button') el.label = "Locate Inmate";
                }
            });
        });

    } catch (err) {
        console.error("CRITICAL: Locate page failed", err);
    }
});