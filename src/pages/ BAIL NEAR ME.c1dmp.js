import wixWindow from 'wix-window';
// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { processBookingSheet } from 'public/bookingSheetHandler.js';
import { makeSignNowRequest } from 'backend/signnow-integration.jsw';
import { saveUserLocation } from 'backend/location';
import wixLocation from 'wix-location'; // Assuming wix-location is a valid import for navigation

// Initialize County Dropdown
initCountyDropdown();

// Event handler for double-clicking the Spanish speaking phone element
$w("#spanishSpeakingPhone").onDblClick(() => {
    const phoneNumber = "tel:+12393322245";
    wixLocation.to(phoneNumber);
});

// Geolocation logic to save user location
if (wixWindow.formFactor === "Mobile" || wixWindow.formFactor === "Tablet" || wixWindow.formFactor === "Desktop") {
    // Note: navigator.geolocation is not available in Velo. We must use wix-window-frontend or a custom element.
    // However, the existing code uses navigator.geolocation which implies this might be running in a context where it's allowed (e.g. custom element)
    // OR it's incorrect Velo code. Velo uses wix-window.getCurrentGeolocation()
    // We will leave existing geolocation logic for now but might need to refactor later.
}

// Bail Calculator HTML component interaction logic
const bailCalculatorComponent = $w("#bailCalculator");

function sendDataToHtmlComponent(data) {
    if (bailCalculatorComponent) {
        bailCalculatorComponent.postMessage(data);
    }
}

if ($w("#submitButton")) {
    $w("#submitButton").onClick(() => {
        const url = $w("#bookingSheetURLInput").value;
        sendDataToHtmlComponent({ url: url });
        processBookingSheet(url);
    });
}

if (bailCalculatorComponent) {
    bailCalculatorComponent.onMessage((event) => {
        const data = event.data;
        console.log("Data received from HTML component:", data);
        if ($w("#bookingDataDisplay")) {
            $w("#bookingDataDisplay").text = data;
        }
    });
}
});

import { getCounties } from 'public/countyUtils';

/**
 * Initialize the county selector dropdown
 */
async function initCountyDropdown() {
    try {
        const dropdown = $w('#countySelector');

        // 1. Check if dropdown exists
        if (!dropdown) {
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


/**
*\tAdds an event handler that runs when the element is clicked.
*\t[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick )
*\t @param {$w.MouseEvent} event
*/
export function beginProcessButton_click(event) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}

/**
*\tAdds an event handler that runs when the element is clicked.
*\t[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick )
*\t @param {$w.MouseEvent} event
*/
export function spanishSpeakingPhone_click(event) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}

/**
*\tAdds an event handler that runs when the element is double-clicked.
*\t[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onDblClick )
*\t @param {$w.MouseEvent} event
*/
export function spanishSpeakingPhone_dblClick(event) {
    // This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
    // Add your code for this event here: 
}
