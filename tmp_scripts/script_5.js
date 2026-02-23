
        function onMapsApiLoaded() {
            // Signal global readiness
            window.isGoogleMapsLoaded = true;
            console.log("📍 Google Maps API Loaded via Callback");
            // If main app is already running, try to init maps
            if (window.ShamrockApp && window.ShamrockApp.Maps) {
                window.ShamrockApp.Maps.tryInit();
            }
        }
    