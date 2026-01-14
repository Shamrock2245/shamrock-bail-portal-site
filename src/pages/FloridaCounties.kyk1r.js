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
            // Map Data to Elements
            // Using generic IDs based on the screenshot "Item Title"

            // Text
            const title = itemData.name + " County";
            const desc = "Bail Bonds & Inmate Search";

            if ($item('#textTitle').length) $item('#textTitle').text = title; // Try standard name
            else if ($item('#itemTitle').length) $item('#itemTitle').text = title; // Common default

            if ($item('#textDesc').length) $item('#textDesc').text = desc;

            // Link the Container AND Button (if any)
            const link = `/bail-bonds/${itemData.slug}`;

            if ($item('#container1').length) $item('#container1').onClick(() => wixLocation.to(link));
            // Or just the repeated item itself (often works in Velo)

            // If there's a button
            if ($item('#actionButton').length) {
                $item('#actionButton').label = "Locate Inmate";
                $item('#actionButton').onClick(() => wixLocation.to(link));
            }
        });

    } catch (err) {
        console.error("CRITICAL: Locate page failed", err);
    }
});