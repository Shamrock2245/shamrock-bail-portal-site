// HOME.c1dmp.js
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(function () {
    console.log("🚀 HOME PAGE LOADED - PRODUCTION MODE");

    // 1. Initialize County Dropdown
    initCountyDropdown();

    // 2. Setup Spanish Speaking Phone Button (Defensive)
    const spanishBtn = $w("#callNowSpanishBtn");
    if (spanishBtn.length > 0) {
        spanishBtn.onClick(() => wixLocation.to("tel:12399550301"));
        spanishBtn.onDblClick(() => wixLocation.to("tel:12399550301"));
    }
});

/**
 * Initialize the county selector dropdown
 * FETCHES from Database with Fallback
 */
async function initCountyDropdown() {
    try {
        console.log("DEBUG: Attempting to select dropdown...");

        // DIRECT SELECTOR
        let dropdown = $w('#countySelector');

        // Fallback attempts
        if (dropdown.length === 0) dropdown = $w('#dropdown1');

        if (dropdown.length === 0) {
            console.error('CRITICAL: Dropdown not found. Checked: #countySelector, #dropdown1');
            return;
        }

        // 2. Fetch counties (WITH TIMEOUT)
        // Create a timeout promise that resolves to empty array after 3 seconds
        const timeoutPromise = new Promise(resolve => setTimeout(() => {
            console.warn("DEBUG: Fetch timed out. Using fallback.");
            resolve([]);
        }, 3000));

        // Race the fetch against the timeout
        let counties = await Promise.race([getCounties(), timeoutPromise]);

        // 2a. HARDCODED FALLBACK (If DB fails/empty/timeout)
        if (!counties || counties.length === 0) {
            console.warn("DEBUG: Fetch failed/empty. Using Hardcoded Fallback.");
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

        // 5. Setup Change Handler
        dropdown.onChange((event) => {
            try {
                const dest = event.target.value;
                if (dest) wixLocation.to(dest);
            } catch (e) {
                console.error("Navigation error:", e);
            }
        });

    } catch (err) {
        console.error("CRITICAL ERROR in initCountyDropdown:", err);
    }
}

// Export functions for Wix Editor wiring
export function beginProcessButton_click(event) {
    const dropdown = $w('#countySelector');
    // Simple existence check
    if (dropdown && dropdown.value) {
        console.log("Button Clicked - Navigating to:", dropdown.value);
        wixLocation.to(dropdown.value);
    } else {
        console.warn("Button Clicked - No county selected");
        wixLocation.to('/portal');
    }
}

export function spanishSpeakingPhone_click(event) {
    wixLocation.to("tel:12399550301");
}

export function spanishSpeakingPhone_dblClick(event) {
    wixLocation.to("tel:12399550301");
}
