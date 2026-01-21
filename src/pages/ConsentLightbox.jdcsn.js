/**
 * ConsentLightbox.jdcsn.js
 * Simple, non-intrusive consent lightbox for electronic signing
 * Clean design with clear options
 * 
 * Expected Elements:
 * - #consentText: Brief consent explanation
 * - #agreeBtn: Agree button
 * - #declineBtn: Decline button (optional)
 * - #privacyLink: Link to privacy policy (optional)
 */

import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { getSessionToken } from 'public/session-manager';
import { validateCustomSession } from 'backend/portal-auth';

let sessionData = null;

$w.onReady(async function () {
    // Validate session quietly
    const sessionToken = getSessionToken();
    if (sessionToken) {
        try {
            sessionData = await validateCustomSession(sessionToken);
        } catch (e) { /* Continue without session data */ }
    }

    setupUI();
    setupEventHandlers();
});

function setupUI() {
    // Set concise consent text
    if ($w('#consentText')) {
        $w('#consentText').text = `By continuing, you agree to:

• Sign documents electronically (legally binding)
• Allow location capture at signing time
• Receive communications about your case

This is required for electronic signing.`;
    }

    // Set button labels
    if ($w('#agreeBtn')) {
        $w('#agreeBtn').label = 'I Agree';
    }
    if ($w('#declineBtn')) {
        $w('#declineBtn').label = 'Not Now';
    }
}

function setupEventHandlers() {
    // Agree button
    try {
        if ($w('#agreeBtn')) {
            $w('#agreeBtn').onClick(handleAgree);
        }
    } catch (e) { console.warn('Agree button not found'); }

    // Decline button
    try {
        if ($w('#declineBtn')) {
            $w('#declineBtn').onClick(handleDecline);
        }
    } catch (e) { /* Decline button optional */ }

    // Privacy link
    try {
        if ($w('#privacyLink')) {
            $w('#privacyLink').onClick(() => {
                wixWindow.openLightbox('PrivacyLightbox');
            });
        }
    } catch (e) { /* Privacy link optional */ }

    // Close button
    try {
        if ($w('#closeBtn')) {
            $w('#closeBtn').onClick(() => {
                wixWindow.lightbox.close({ success: false, cancelled: true });
            });
        }
    } catch (e) { /* Close button optional */ }
}

async function handleAgree() {
    // Disable button
    if ($w('#agreeBtn')) {
        $w('#agreeBtn').disable();
        $w('#agreeBtn').label = 'Saving...';
    }

    try {
        // Capture GPS quietly
        let gps = null;
        try {
            const loc = await wixWindow.getCurrentGeolocation();
            gps = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        } catch (e) { /* GPS optional */ }

        const consentRecord = {
            consentedAt: new Date().toISOString(),
            consentType: 'electronic_signing',
            gps: gps,
            version: '1.0'
        };

        // Save to database if we have session
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

        // Store locally as backup
        const key = sessionData?.personId ? `consent_${sessionData.personId}` : 'consent_user';
        wixWindow.browserStorage.local.setItem(key, JSON.stringify(consentRecord));

        // Close with success
        wixWindow.lightbox.close({ success: true, consentRecord: consentRecord });

    } catch (error) {
        console.error('Consent error:', error);
        if ($w('#agreeBtn')) {
            $w('#agreeBtn').enable();
            $w('#agreeBtn').label = 'Try Again';
        }
    }
}

function handleDecline() {
    // Simple decline - no scary confirmation
    wixWindow.lightbox.close({ success: false, declined: true });
}
