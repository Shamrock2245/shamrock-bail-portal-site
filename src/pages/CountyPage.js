// CountyPage.js (Dynamic Page)
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import { getNearbyCounties } from 'public/countyUtils';

$w.onReady(async function () {
    const currentItem = $w('#dynamicDataset').getCurrentItem();
    
    if (currentItem) {
        setupPageContent(currentItem);
        await loadNearbyCounties(currentItem);
    }
});

function setupPageContent(county) {
    // Set SEO metadata dynamically
    // Note: Wix handles basic SEO from dataset, this adds custom meta if needed
    
    // Update Sheriff & Clerk links
    if (county.sheriffUrl) {
        $w('#sheriffLink').link = county.sheriffUrl;
        $w('#sheriffLink').target = "_blank";
    } else {
        $w('#sheriffLink').collapse();
    }

    if (county.clerkUrl) {
        $w('#clerkLink').link = county.clerkUrl;
        $w('#clerkLink').target = "_blank";
    } else {
        $w('#clerkLink').collapse();
    }

    // Setup phone buttons
    $w('#sheriffPhone').onClick(() => wixLocation.to(`tel:${county.sheriffPhone}`));
    $w('#clerkPhone').onClick(() => wixLocation.to(`tel:${county.clerkPhone}`));
}

async function loadNearbyCounties(currentCounty) {
    const nearby = await getNearbyCounties(currentCounty.region, currentCounty._id);
    
    $w('#nearbyCountiesRepeater').data = nearby.map(item => ({
        _id: item._id,
        name: item.name,
        slug: item.slug,
        image: item.image
    }));

    $w('#nearbyCountiesRepeater').onItemReady(($item, itemData) => {
        $item('#nearbyName').text = `${itemData.name} County`;
        if (itemData.image) {
            $item('#nearbyImage').src = itemData.image;
        }
        $item('#nearbyContainer').onClick(() => {
            wixLocation.to(`/bail-bonds/${itemData.slug}-county`);
        });
    });
}
