import wixWindow from 'wix-window';
import { saveUserLocation } from 'backend/location.jsw';
// REMOVED: import { authentication } from 'wix-members';
import { local } from 'wix-storage-frontend';
import { getSessionToken, hasSessionToken, clearSessionToken } from 'public/session-manager';
import { captureFullLocationSnapshot } from 'public/geolocation-client';

const PING_STORAGE_KEY = 'last_location_ping_dates';

/**
 * Attempt to ping the user's location silently.
 * Enforces a frontend check to avoid excessive backend calls.
 * Now improved with Robustness: captures IP and Device Info.
 * @param {string} [caseStatus] - Optional status to check against 'discharged' or 'closed' logic
 */
export async function silentPingLocation(caseStatus) {
    try {
        // 0. STOP PINGING IF DISCHARGED
        if (caseStatus) {
            const normalized = caseStatus.toLowerCase().trim();
            if (normalized === 'discharged' || normalized === 'closed' || normalized === 'completed' || normalized === 'exonerated') {
                console.log(`Location tracker: Case is ${caseStatus}. Tracking disabled.`);
                return;
            }
        }

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

        // 3. Get Robust Location Snapshot (Geo + IP + Device)
        console.log('Location tracker: Initiating robust silent ping...');
        const snapshot = await captureFullLocationSnapshot();

        if (snapshot.geo.success) {
            const { latitude, longitude } = snapshot.geo;
            const extraData = snapshot.extraData; // { ipAddress, deviceModel, ... }

            // 4. Save to Backend (PASSING TOKEN & EXTRA DATA)
            const result = await saveUserLocation(latitude, longitude, "Silent Ping", "", token, extraData);

            if (result.success) {
                // Update local storage tracking
                pingDates.push(todayStr);
                local.setItem(PING_STORAGE_KEY, JSON.stringify(pingDates));
                console.log('Location tracker: Silent ping successful', { address: result.address, ip: extraData.ipAddress });
            } else {
                console.warn('Location tracker: Backend rejected ping', result.message);
                // AUTO-HEAL: If session is invalid, clear it to prevent UI lying to user
                if (result.message && (result.message.includes('Unauthorized') || result.message.includes('Invalid session'))) {
                    console.log('Location tracker: Clearing invalid session.');
                    clearSessionToken();
                }
            }
        } else {
            console.warn('Location tracker: Geo capture failed', snapshot.geo.error);
        }
    } catch (error) {
        console.warn('Location tracker: Silent ping failed', error.message);
    }
}
