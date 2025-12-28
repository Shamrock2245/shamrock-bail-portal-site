// Force Sync Update: [Current Timestamp]
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    // 1. Setup the Repeater
    $w('#countiesRepeater').onItemReady(($item, itemData) => {
        // Name & Navigation
        $item('#countyNameTitle').text = itemData.name + " County";

        $item('#viewCountyButton').onClick(() => {
            wixLocation.to(`/county/${itemData.slug}`);
        });

        // Sheriff Link (Smart Hide)
        if (itemData.sheriffUrl) {
            $item('#sheriffLink').link = itemData.sheriffUrl;
            $item('#sheriffLink').target = "_blank";
            $item('#sheriffLink').show();
        } else {
            $item('#sheriffLink').hide();
        }

        // Clerk Link (Smart Hide)
        if (itemData.clerkUrl) {
            $item('#clerkLink').link = itemData.clerkUrl;
            $item('#clerkLink').target = "_blank";
            $item('#clerkLink').show();
        } else {
            $item('#clerkLink').hide();
        }
    });

    // 2. Fetch and Bind Data
    try {
        const counties = await getCounties();

        if (counties && counties.length > 0) {
            $w('#countiesRepeater').data = counties;
        } else {
            console.warn("No counties found in collection.");
        }
    } catch (error) {
        console.error("Error loading counties:", error);
    }
});
