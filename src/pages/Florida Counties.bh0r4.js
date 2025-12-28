// Force Sync Update: [Debug Mode Active]
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Florida Counties Page Code Running!");

    const $repeater = $w('#countiesRepeater');

    // Debug: Check if repeater exists
    if ($repeater.valid) {
        console.log("✅ Repeater found: #countiesRepeater");
    } else {
        console.error("❌ Repeater NOT found! Check ID in Editor. looking for -> #countiesRepeater");
    }

    $repeater.onItemReady(($item, itemData) => {
        // console.log("Binding item:", itemData.name);

        // Name & Navigation
        $item('#countyNameTitle').text = itemData.name + " County";

        $item('#viewCountyButton').onClick(() => {
            console.log("Buttons clicked for:", itemData.slug);
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
        console.log("Fetching counties from Backend...");
        const counties = await getCounties();
        console.log("Counties fetched count:", counties.length);

        if (counties && counties.length > 0) {
            console.log("First county sample:", counties[0].name);
            $repeater.data = counties;
            console.log("✅ Data assigned to repeater property.");
        } else {
            console.warn("⚠️ No counties found. Query returned empty array.");
            console.warn("Check 'Import1' collection permissions and content.");
        }
    } catch (error) {
        console.error("❌ Error loading counties:", error);
    }
});
