// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { processBookingSheet } from 'public/bookingSheetHandler.js';
import { makeSignNowRequest } from 'backend/signnow-integration.jsw';
import { saveUserLocation } from 'backend/location';
import wixLocation from 'wix-location'; // Assuming wix-location is a valid import for navigation

$w.onReady(function ( ) {
    // Event handler for double-clicking the Spanish speaking phone element
    $w("#spanishSpeakingPhone").onDblClick(() => {
        const phoneNumber = "tel:+1299550301";
        wixLocation.to(phoneNumber);
    });

    // Geolocation logic to save user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            saveUserLocation(latitude, longitude)
                .then((result) => {
                    if (result.success) {
                        console.log(result.message);
                    } else {
                        console.error("Failed to save location:", result.message);
                    }
                })
                .catch((error) => {
                    console.error("Error calling backend function:", error);
                });
        }, (error) => {
            console.error(`Geolocation error (${error.code}): ${error.message}`);
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }

    // Bail Calculator HTML component interaction logic
    const bailCalculatorComponent = $w("#bailCalculator");

    function sendDataToHtmlComponent(data) {
        bailCalculatorComponent.postMessage(data);
    }

    $w("#submitButton").onClick(() => {
        const url = $w("#bookingSheetURLInput").value;
        sendDataToHtmlComponent({ url: url });
        processBookingSheet(url);
    });

    bailCalculatorComponent.onMessage((event) => {
        const data = event.data;
        console.log("Data received from HTML component:", data);
        $w("#bookingDataDisplay").text = data; 
    });
});

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
