import wixWindow from 'wix-window';
import { saveUserLocation } from 'backend/location.jsw';
// REMOVED: import { authentication } from 'wix-members';
import { local } from 'wix-storage-frontend';
import { getSessionToken, hasSessionToken } from 'public/session-manager';

const PING_STORAGE_KEY = 'last_location_ping_dates';

/**
 * Attempt to ping the user's location silenty.
 * Enforces a frontend check to avoid excessive backend calls.
 */
export async function silentPingLocation() {
    try {
        // 1. Only ping if logged in (Custom Auth)
        if (!hasSessionToken()) return;
        const token = getSessionToken();

        // 2. Check if we've already pinged 3 times today (frontend check)
        const todayStr = new Date().toDateString();
        let pingDates = [];

        try {
            const raw = local.getItem(PING_STORAGE_KEY);
            pingDates = raw ? JSON.parse(raw) : [];
        } catch (e) {
            pingDates = [];
        }

        // Filter for today
        const todaysPings = pingDates.filter(d => d === todayStr);
        if (todaysPings.length >= 3) {
            console.log('Location tracker: Daily limit reached (frontend check)');
            return;
        }

        // 3. Get Geolocation
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const geolocation = await wixWindow.getCurrentGeolocation(geoOptions);
        if (geolocation && geolocation.coords) {
            const { latitude, longitude } = geolocation.coords;

            // 4. Save to Backend (PASSING TOKEN)
            const result = await saveUserLocation(latitude, longitude, "", "", token);

            if (result.success) {
                // Update local storage tracking
                pingDates.push(todayStr);
                local.setItem(PING_STORAGE_KEY, JSON.stringify(pingDates));
                console.log('Location tracker: Silent ping successful', { address: result.address });
            } else {
                console.warn('Location tracker: Backend rejected ping', result.message);
            }
        }
    } catch (error) {
        console.warn('Location tracker: Silent ping failed', error.message);
    }
}
