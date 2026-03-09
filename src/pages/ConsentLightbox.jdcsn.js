/**
 * ConsentLightbox.jdcsn.js
 * Premium consent lightbox for electronic signing and location tracking.
 * Uses an HTML embed for a glassmorphism UI.
 */

import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { getSessionToken, getSessionData } from 'public/session-manager';
import { validateCustomSession } from 'backend/portal-auth';

let sessionData = null;

$w.onReady(async function () {
    // Validate session quietly
    const sessionToken = getSessionToken();
    if (sessionToken) {
        try {
            sessionData = await validateCustomSession(sessionToken);
        } catch (e) {
            console.warn("Could not validate session quietly.");
        }
    }

    // Try to get cached synchronous data instead if backend validation fails
    if (!sessionData) {
        sessionData = getSessionData();
    }

    setupHtmlHandler();
});

function setupHtmlHandler() {
    const htmlElement = $w('#htmlConsent');

    if (htmlElement) {
        // Listen to messages from the HTML embed
        htmlElement.onMessage(async (event) => {
            const data = event.data;

            if (data.type === 'agree') {
                await processAgreement();
            } else if (data.type === 'decline') {
                wixWindow.lightbox.close({ success: false, declined: true });
            } else if (data.type === 'privacy') {
                wixWindow.openLightbox('PrivacyLightbox');
            }
        });
    } else {
        console.error("HTML Consent Element (#htmlConsent) not found on the page.");
    }
}

async function processAgreement() {
    try {
        // Capture GPS quietly as part of the consent record
        let gps = null;
        try {
            const loc = await wixWindow.getCurrentGeolocation();
            gps = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        } catch (e) {
            console.warn("GPS capture skipped during Consent Validation.");
        }

        const consentRecord = {
            consentedAt: new Date().toISOString(),
            consentType: 'electronic_signing_and_location',
            gps: gps,
            version: '2.0' // Upgraded to v2 for Location + SMS tracking
        };

        // Save to database if we have an active session
        if (sessionData && sessionData.personId) {
            try {
                const existing = await wixData.query('Portal Users')
                    .eq('personId', sessionData.personId)
                    .limit(1)
                    .find({ suppressAuth: true });

                if (existing.items.length > 0) {
                    const profile = existing.items[0];
                    profile.consent = true;
                    profile.consentRecord = JSON.stringify(consentRecord);
                    profile.updatedAt = new Date();
                    await wixData.update('Portal Users', profile, { suppressAuth: true });
                }
            } catch (dbError) {
                console.warn('Could not save consent to DB:', dbError);
            }
        }

        // Store locally as a backup & fast-check for the geolocation-client.js
        const key = sessionData?.personId ? `consent_${sessionData.personId}` : 'consent_user';
        wixWindow.browserStorage.local.setItem(key, JSON.stringify(consentRecord));

        // Close with success, allowing the location feature to proceed!
        wixWindow.lightbox.close({ success: true, consentRecord: consentRecord });

    } catch (error) {
        console.error('Consent processing error:', error);
        // Send a message back to the HTML iframe telling it to stop loading state
        if ($w('#htmlConsent')) {
            $w('#htmlConsent').postMessage({ type: 'error' });
        }
    }
}
