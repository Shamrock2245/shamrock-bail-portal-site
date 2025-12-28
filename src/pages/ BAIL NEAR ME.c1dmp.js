import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

$w.onReady(function () {
    // 1. Initialize County Dropdown
    initCountyDropdown();

    // 2. Setup Spanish Speaking Phone Button
    // Using onClick for better usability than onDblClick
    const spanishPhoneBtn = $w("#callNowSpanishBtn");
    if (spanishPhoneBtn) {
        spanishPhoneBtn.onClick(() => {
            wixLocation.to("tel:12399550301");
        });
        // Also keep double click if users are used to it, or just for safety
        spanishPhoneBtn.onDblClick(() => {
            wixLocation.to("tel:12399550301");
        });
    }

    // 3. Geolocation (Placeholder for future implementation)
    // Note: Navigator API is not available in Velo. Use wix-window.getCurrentGeolocation() in the future.
});

/**
 * Initialize the county selector dropdown
 */
async function initCountyDropdown() {
    try {
        const dropdown = $w('#countySelector');

        // 1. Check if dropdown exists
        if (!dropdown.valid) {
            console.warn('County selector dropdown (#countySelector) not found on page.');
            return;
        }

        // 2. Fetch counties
        const counties = await getCounties();

        // 3. Map to dropdown options format { label, value }
        const options = counties.map(county => ({
            label: county.name + ' County',
            value: `/county/${county.slug}`
        }));

        // 4. Set options
        dropdown.options = options;
        dropdown.placeholder = "Select a County";

        // 5. Add onChange handler
        dropdown.onChange((event) => {
            const selectedPath = event.target.value;
            if (selectedPath) {
                wixLocation.to(selectedPath);
            }
        });

        console.log('County dropdown initialized with ' + options.length + ' counties.');

    } catch (error) {
        console.error('Error initializing county dropdown:', error);
    }
}

// Export functions for Wix Editor wiring (optional, but good to keep if linked in UI)

export function beginProcessButton_click(event) {
    // Deprecated functionality
}

export function spanishSpeakingPhone_click(event) {
    wixLocation.to("tel:12399550301");
}

export function spanishSpeakingPhone_dblClick(event) {
    wixLocation.to("tel:12399550301");
}

