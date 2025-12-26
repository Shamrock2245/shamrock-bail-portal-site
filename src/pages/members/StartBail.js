// StartBail.js (Members Only)
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { authentication, currentMember } from 'wix-members';
import { initiateSignNowHandoff } from 'backend/signnow-integration';

$w.onReady(async function () {
    // 1. Verify Login
    if (!authentication.loggedIn()) {
        wixLocation.to('/login');
        return;
    }

    // 2. Load Member Data
    const member = await currentMember.getMember();
    $w('#memberName').text = `Welcome, ${member.contactDetails.firstName}`;

    // 3. Setup Consent Flow
    setupConsentForm();
});

function setupConsentForm() {
    const startBtn = $w('#startPaperworkBtn');
    startBtn.disable();

    // Monitor checkboxes
    const checkConsent = () => {
        const geo = $w('#geolocationConsent').checked;
        const terms = $w('#termsConsent').checked;
        
        if (geo && terms) {
            startBtn.enable();
        } else {
            startBtn.disable();
        }
    };

    $w('#geolocationConsent').onChange(checkConsent);
    $w('#termsConsent').onChange(checkConsent);

    // Handle Start Button
    startBtn.onClick(async () => {
        startBtn.disable();
        startBtn.label = "Preparing Paperwork...";

        try {
            // Get user location if possible (browser API)
            let location = null;
            try {
                location = await wixWindow.getCurrentGeolocation();
            } catch (e) {
                console.warn("Geolocation failed", e);
            }

            // Call backend to generate SignNow link
            const result = await initiateSignNowHandoff({
                location: location,
                timestamp: new Date()
            });

            if (result.success && result.redirectUrl) {
                // Redirect to SignNow
                wixLocation.to(result.redirectUrl);
            } else {
                throw new Error(result.error || "Unknown error");
            }

        } catch (error) {
            console.error("Handoff failed:", error);
            $w('#errorMsg').text = "Unable to start paperwork. Please call us directly.";
            $w('#errorMsg').expand();
            startBtn.enable();
            startBtn.label = "Try Again";
        }
    });
}
