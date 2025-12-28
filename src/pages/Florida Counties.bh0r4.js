// Force Sync Update: [Safe Link Mode]
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Florida Counties Debug Start");

    $w('#countiesRepeater').onItemReady(($item, itemData) => {
        // 1. Set the Name
        $item('#countyNameTitle').text = itemData.name + " County";

        /**
         * FIX FOR THE BUTTON ERROR:
         * We try to set the link directly first.
         * If the element is a Button, this works.
         */
        const button = $item('#viewCountyButton');
        const targetUrl = `/county/${itemData.slug}`;

        // Attempt 1: treat as standard button or link element
        button.label = "View Info";
        button.link = targetUrl;
        button.target = "_self";

        // Note: We removed the .onClick() because if it's a native 
        // linkable element, setting .link is safer and sufficient.
    });

    // Fetch Data
    const counties = await getCounties();
    if (counties.length > 0) {
        $w('#countiesRepeater').data = counties;
    }
});
