
async function loadNearbyCounties(region, currentSlug) {
    const nearbyRep = Select('#nearbyCountiesRepeater');
    if (!nearbyRep || nearbyRep.length === 0) return; // Don't fetch if no repeater

    // Default region if missing
    if (!region) region = "Southwest";

    try {
        const nearby = await getCountiesByRegion(region);

        if (Array.isArray(nearby) && nearby.length > 0) {
            // Filter out current county
            const neighbors = nearby.filter(n => n.slug !== currentSlug);

            // FIX: onItemReady MUST be defined before setting .data
            nearbyRep.onItemReady(($item, itemData) => {
                try { $item('#neighborName').text = itemData.county_name || itemData.name; } catch (e) { }
                try {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/bail-bonds/${itemData.slug}`));
                } catch (e) { }
            });

            // Ensure unique IDs
            nearbyRep.data = neighbors.map((n, i) => ({
                ...n,
                _id: n._id || `neighbor-${i}-${Date.now()}`
            }));
            nearbyRep.expand();
        }
    } catch (e) {
        console.warn("Error loading nearby counties", e);
    }
}
