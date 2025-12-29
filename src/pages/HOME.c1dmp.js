import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

$w.onReady(function () {
    console.log("🚀 HOME PAGE LOADED - SYNC CHECK: " + new Date().toISOString());
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
        // 2. Fetch counties
        let counties = await getCounties();

        // 2a. HARDCODED FALLBACK (If DB fails/empty)
        if (!counties || counties.length === 0) {
            console.warn("DEBUG: Fetch failed. Using Hardcoded Fallback.");
            counties = [
                { name: "Alachua", slug: "alachua" },
                { name: "Charlotte", slug: "charlotte" },
                { name: "Collier", slug: "collier" },
                { name: "Hendry", slug: "hendry" },
                { name: "Lee", slug: "lee" },
                { name: "Sarasota", slug: "sarasota" }
            ];
        }

        // 3. Map to dropdown options format { label, value }
        const options = counties.map(county => ({
            label: county.name + ' County',
            value: `/county/${county.slug}`
        }));

        // 4. Set options
        console.log("Loading Dropdown with " + options.length + " counties.");
        dropdown.options = options;
        dropdown.placeholder = "Select a County";

        // 5. Add onChange handler
        dropdown.onChange((event) => {
            const selectedPath = event.target.value;
            console.log("User Selected Value:", selectedPath);
            if (selectedPath) {
                wixLocation.to(selectedPath);
            }
        });

        // 6. Explicit Button Handler (Redundant backup)
        // If the user clicks the button, it obeys the dropdown. 
        // If dropdown is empty/invalid, it goes to the generic portal.
        $w('#beginProcessButton').onClick(() => {
            if (dropdown.valid && dropdown.value) {
                wixLocation.to(dropdown.value);
            } else {
                console.log("No county selected, going to generic portal.");
                wixLocation.to('/portal');
            }
        });

        console.log('County dropdown initialized with ' + options.length + ' counties.');

    } catch (error) {
        console.error('Error initializing county dropdown:', error);
    }
}

// Export functions for Wix Editor wiring (optional, but good to keep if linked in UI)

export function beginProcessButton_click(event) {
    const dropdown = $w('#countySelector');
    if (dropdown.valid && dropdown.value) {
        console.log("Button Clicked - Navigating to:", dropdown.value);
        wixLocation.to(dropdown.value);
    } else {
        console.warn("Button Clicked - No county selected");
        // Optional: Show error highlighting
        if (dropdown.valid) dropdown.style.borderColor = "red";
    }
}

export function spanishSpeakingPhone_click(event) {
    wixLocation.to("tel:12399550301");
}

export function spanishSpeakingPhone_dblClick(event) {
    wixLocation.to("tel:12399550301");
}

