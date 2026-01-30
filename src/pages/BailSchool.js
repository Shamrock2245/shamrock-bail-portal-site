import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    console.log("🏫 Bail School Catalog Loaded");

    // Initialize the repeater
    $w('#repeaterBailClasses').onItemReady(($item, itemData) => {
        setupClassItem($item, itemData);
    });

    // Load classes (can also be done via Dataset, but code gives more control)
    await loadClasses();
});

/**
 * Populates a repeater item with class data
 * @param {Object} $item - Scoped selector for the repeater item
 * @param {Object} itemData - Data object for the current item
 */
function setupClassItem($item, itemData) {
    // 1. Set text fields
    $item('#textClassTitle').text = itemData.title;

    // Truncate description if too long
    const desc = itemData.description || "";
    $item('#textClassDescription').text = desc.length > 100 ? desc.substring(0, 100) + "..." : desc;

    // 2. Button Action
    $item('#btnViewClass').onClick(() => {
        // Navigate to the dynamic page (assuming slug usage)
        wixLocation.to(`/bail-school/${itemData.slug}`);
    });
}

/**
 * Fetches classes from CMS and populates the repeater
 */
async function loadClasses() {
    try {
        const results = await wixData.query("BailClasses")
            .ascending("title") // Or custom sort order
            .find();

        if (results.totalCount > 0) {
            $w('#repeaterBailClasses').data = results.items;
            $w('#textNoClasses').collapse();
            $w('#repeaterBailClasses').expand();
        } else {
            $w('#repeaterBailClasses').collapse();
            $w('#textNoClasses').expand();
        }
    } catch (error) {
        console.error("Error loading classes:", error);
    }
}
