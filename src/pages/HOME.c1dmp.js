// HOME.c1dmp.js
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getCounties } from 'public/countyUtils';

$w.onReady(function () {
    console.log("🚀 HOME PAGE LOADED - PRODUCTION MODE");

    // 1. Initialize County Dropdown
    initCountyDropdown();

    // 2. Setup Testimonials
    setupTestimonials();

    // 3. Setup Spanish Speaking Phone Button (Defensive)
    const spanishBtn = $w("#callNowSpanishBtn");
    if (spanishBtn.length > 0) {
        spanishBtn.onClick(() => wixLocation.to("tel:12399550301"));
        spanishBtn.onDblClick(() => wixLocation.to("tel:12399550301"));
    }
});

function setupTestimonials() {
    const data = [
        { _id: "1", quote: "Process was fast and easy. Highly recommend.", name: "Sarah M." },
        { _id: "2", quote: "They helped me at 3am when no one else would.", name: "John D." },
        { _id: "3", quote: "Professional and explained everything clearly.", name: "Michael R." },
        { _id: "4", quote: "Got my brother out in hours. Thank you!", name: "Emily S." },
        { _id: "5", quote: "Very respectful and understanding during a tough time.", name: "David K." },
        { _id: "6", quote: "Best bail bondsman in Fort Myers.", name: "Jessica L." },
        { _id: "7", quote: "Honest and upfront about the costs.", name: "Robert P." },
        { _id: "8", quote: "Shamrock really cares about their clients.", name: "Jennifer B." },
        { _id: "9", quote: "Fastest release time I've ever seen.", name: "Christopher W." },
        { _id: "10", quote: "Walked me through the whole court process.", name: "Amanda H." },
        { _id: "11", quote: "Great communication from start to finish.", name: "James T." },
        { _id: "12", quote: "Lifesavers. I didn't know what to do until I called.", name: "Melissa G." }
    ];

    const rep = $w('#testimonialsRepeater');
    if (rep.valid) {
        rep.data = data;
        rep.onItemReady(($item, itemData) => {
            $item('#quoteText').text = `"${itemData.quote}"`;
            $item('#authorName').text = itemData.name;
        });
    }
}

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
        // Create a timeout promise that resolves to NULL to differentiate from empty array
        const timeoutPromise = new Promise(resolve => setTimeout(() => {
            console.warn("DEBUG: Fetch timed out. Using fallback.");
            resolve(null);
        }, 3000));

        // Race the fetch against the timeout
        let counties = await Promise.race([getCounties(), timeoutPromise]);

        console.log("DEBUG: Raw counties from fetch:", counties);

        // 2a. VALIDATION & FALLBACK
        // We check if it is falsy OR empty array OR not an array
        if (!Array.isArray(counties) || counties.length === 0) {
            console.warn("DEBUG: Fetch failed/empty/timeout. Using Hardcoded Fallback.");
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
        const options = counties.map(county => {
            const name = county.name || county.countyName || "Unknown";
            const slug = county.slug || county.countySlug || "";
            return {
                label: name + ' County',
                value: `/county/${slug}`
            };
        });

        // 4. Set options
        console.log("Loading Dropdown with " + options.length + " options.");
        console.log("Options Sample:", options.slice(0, 2));

        dropdown.options = options;
        dropdown.placeholder = "Select a County";

        // 5. Setup Change Handler
        dropdown.onChange((event) => {
            try {
                const dest = event.target.value;
                console.log("Navigation triggered to:", dest);
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
