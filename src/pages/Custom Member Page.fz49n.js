// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { saveUserLocation } from 'backend/location';

$w.onReady(function ( ) {
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

    // If you intend to use the React-based bail bond application dashboard,
    // it should be embedded within an HTML component on your Wix page.
    // You would then use Velo's postMessage to communicate between this page code
    // and the embedded React application.
    // Example of how you might interact with an embedded HTML component:
    // const bailBondDashboardComponent = $w('#htmlComponentId');
    // bailBondDashboardComponent.postMessage({ type: 'LOAD_DATA', payload: { userId: '123' } });
    // bailBondDashboardComponent.onMessage((event) => {
    //     console.log('Message from React app:', event.data);
    // });
});
