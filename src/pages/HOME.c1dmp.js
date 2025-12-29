import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

$w.onReady(function () {
    console.log("🚀 HOME PAGE LOADED - SYNC CHECK: " + new Date().toISOString());

    // 1. Initialize County Dropdown
    initCountyDropdown();

    // 2. Setup Spanish Speaking Phone Button (Defensive)
    const spanishBtn = $w("#callNowSpanishBtn");
    if (spanishBtn.valid) { // Check .valid property!
        spanishBtn.onClick(() => wixLocation.to("tel:12399550301"));
        spanishBtn.onDblClick(() => wixLocation.to("tel:12399550301"));
    }
});

/**
 * Initialize the county selector dropdown
 */
async function initCountyDropdown() {
    try {
        // DEFENSIVE SELECTOR: Try common names/misspellings
        let dropdown = $w('#countySelector');
        if (!dropdown.valid) dropdown = $w('#countyselector'); // Lowercase
        if (!dropdown.valid) dropdown = $w('#CountySelector'); // Titlecase
        if (!dropdown.valid) dropdown = $w('#dropdown1'); // Default Wix

        // 1. Check if dropdown exists
        if (!dropdown.valid) {
            console.error('CRITICAL: Dropdown not found. Checked: #countySelector, #countyselector, #dropdown1');
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

