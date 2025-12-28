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

        // Sheriff Link (if data exists)
        if (itemData.sheriffUrl) {
            $item('#sheriffLink').link = itemData.sheriffUrl;
            $item('#sheriffLink').target = "_blank";
            $item('#sheriffLink').label = "Sheriff's Office"; // For buttons
            // If it's a text element: $item('#sheriffLink').text = "Sheriff's Office";
            $item('#sheriffLink').show();
        } else {
            $item('#sheriffLink').hide();
        }

        // Clerk Link (if data exists)
        if (itemData.clerkUrl) {
            $item('#clerkLink').link = itemData.clerkUrl;
            $item('#clerkLink').target = "_blank";
            $item('#clerkLink').label = "Clerk of Court"; // For buttons
            // If it's a text element: $item('#clerkLink').text = "Clerk of Court";
            $item('#clerkLink').show();
        } else {
            $item('#clerkLink').hide();
        }

        // Image (if available) - Assuming slug-based naming convention or image field
        if (itemData.image) {
            $item('#countyImage').src = itemData.image;
        }
    });

    // 2. Fetch and Bind Data
    try {
        const counties = await getCounties();

        if (counties.length > 0) {
            $w('#countiesRepeater').data = counties;
            $w('#loadingState').hide(); // If you have one
            $w('#countiesRepeater').show();
        } else {
            console.warn("No counties found.");
            // Optional: $w('#noDataMessage').show();
        }
    } catch (error) {
        console.error("Error loading counties:", error);
    }
});
