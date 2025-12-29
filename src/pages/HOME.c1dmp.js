// HOME.c1dmp.js - DEBUG MODE
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
// import { getCounties } from 'public/countyUtils'; // COMMENTED OUT TO ISOLATE CRASH

$w.onReady(function () {
    console.log("🚀 HOME PAGE ALIVE - DEBUG MODE: " + new Date().toISOString());

    // HARDCODED DIRECT TEST
    initDropdownSimple();

    // Setup Spanish Speaking Phone Button (Defensive)
    const spanishBtn = $w("#callNowSpanishBtn");
    if (spanishBtn.valid) { // Check .valid property!
        spanishBtn.onClick(() => wixLocation.to("tel:12399550301"));
        spanishBtn.onDblClick(() => wixLocation.to("tel:12399550301"));
    }
});

function initDropdownSimple() {
    try {
        console.log("DEBUG: Selecting Dropdown...");
        let dropdown = $w('#countySelector');
        if (!dropdown) dropdown = $w('#dropdown1');

        if (!dropdown) {
            console.error("CRITICAL: Dropdown element missing even in Debug Mode.");
            return;
        }

        const options = [
            { label: "✅ SYSTEM WORKING", value: "/portal" },
            { label: "Lee County", value: "/county/lee" },
            { label: "Collier County", value: "/county/collier" },
            { label: "Charlotte County", value: "/county/charlotte" },
            { label: "Sarasota County", value: "/county/sarasota" }
        ];

        console.log("DEBUG: Setting " + options.length + " options directly.");
        dropdown.options = options;
        dropdown.placeholder = "Select Your County";

        dropdown.onChange((event) => {
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

