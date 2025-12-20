// Home.js
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    setupHeroActions();
    await setupCountySelector();
    setupTrustIndicators();
});

function setupHeroActions() {
    // Primary CTA - Call Now
    $w('#callNowBtn').onClick(() => {
        wixLocation.to('tel:239-332-2245');
    });

    // Secondary CTA - Start Bail
    $w('#startBailBtn').onClick(() => {
        wixLocation.to('/members/start-bail');
    });
}

async function setupCountySelector() {
    const counties = await getCounties();
    
    // Format for dropdown options
    const options = counties.map(county => {
        return {
            label: `${county.name} County`,
            value: county.slug
        };
    });

    $w('#countySelector').options = options;
    
    $w('#countySelector').onChange((event) => {
        const selectedSlug = event.target.value;
        if (selectedSlug) {
            wixLocation.to(`/bail-bonds/${selectedSlug}-county`);
        }
    });
}

function setupTrustIndicators() {
    // Animate trust indicators on viewport entry
    $w('#trustBar').onViewportEnter(() => {
        $w('#trustBar').show('fade', { duration: 1000 });
    });
}
