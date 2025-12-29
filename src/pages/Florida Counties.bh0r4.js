// Florida Counties Page - Updated with correct field names
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Florida Counties Page Loading...");

    try {
        // Get the repeater element
        const repeaterId = '#countiesRepeater';
        const repeater = $w(repeaterId);

        if (!repeater.valid) {
            console.error('Counties repeater not found on page');
            return;
        }

        // Setup repeater item handler
        repeater.onItemReady(($item, itemData) => {
            console.log('Repeater item data:', itemData);
            
            // Set county name (using normalized 'name' field)
            const countyNameEl = $item('#countyNameTitle');
            if (countyNameEl.valid) {
                countyNameEl.text = itemData.name + " County";
            }

            // Set up the view button
            const button = $item('#viewCountyButton');
            if (button.valid) {
                const targetUrl = `/county/${itemData.slug}`;
                
                // Set button properties
                button.label = "View Info";
                
                // Try to set link property (for link-enabled buttons)
                try {
                    button.link = targetUrl;
                    button.target = "_self";
                } catch (e) {
                    // If link property doesn't work, use onClick
                    button.onClick(() => {
                        wixLocation.to(targetUrl);
                    });
                }
            }
        });

        // Fetch counties data
        console.log('Fetching counties data...');
        const counties = await getCounties();
        console.log(`Loaded ${counties.length} counties`);

        if (counties.length > 0) {
            // Set repeater data
            repeater.data = counties;
            console.log('✅ Counties repeater populated successfully');
        } else {
            console.warn('⚠️ No counties data returned');
        }

    } catch (error) {
        console.error('❌ Error loading Florida Counties page:', error);
    }
});
