// Florida Counties Page - Updated with correct field names
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Florida Counties directory page LOADED (bh0r4)");
    console.log("🚀 Florida Counties Debug Start");
    try {
        // Get the repeater element
        const repeaterId = '#countiesRepeater';
        const repeater = $w(repeaterId);

        if (!repeater.valid) {
            console.error('Counties repeater not found on page');
            return;
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
