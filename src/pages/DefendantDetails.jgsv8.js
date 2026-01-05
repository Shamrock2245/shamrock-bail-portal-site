import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { initiateSigningWorkflow } from 'backend/signing-methods';

$w.onReady(function () {
    const data = wixWindow.lightbox.getContext();
    if (!data) return;

    // 1. Map Status Fields
    $w('#detailsNameText').text = data.defendantName || "No Name";
    $w('#detailsCaseNumberText').text = data.caseNumber || "No Case";
    $w('#detailsBondText').text = data.bondAmount || "$0.00";
    $w('#detailsStatusText').text = data.status || "Unknown";

    // 2. Setup Close
    $w('#closeBtn').onClick(() => wixWindow.lightbox.close());

    // 3. SignNow Integration Handlers
    // ------------------------------------------------

    // A. Send via Email
    $w('#sendEmailBtn').onClick(async () => {
        $w('#sendEmailBtn').label = "Sending...";
        $w('#signingStatusText').text = "Sending email request...";
        $w('#signingStatusText').expand();

        try {
            // TODO: get real email/phone from contact if not in itemData
            const defendantInfo = {
                email: data.email || 'test@example.com', // Fallback for testing
                phone: data.phone || '555-555-5555'
            };

            const result = await initiateSigningWorkflow({
                caseId: data._id,
                method: 'email',
                defendantInfo,
                indemnitorInfo: [], // Add indemnitors if available
                documentIds: ['doc_123'] // Mock doc ID for testing
            });

            if (result.success) {
                $w('#sendEmailBtn').label = "Sent!";
                $w('#signingStatusText').text = "Email sent successfully.";
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            console.error(e);
            $w('#sendEmailBtn').label = "Retry";
            $w('#signingStatusText').text = "Error sending email: " + e.message;
        }
    });

    // B. Send via SMS
    $w('#sendSmsBtn').onClick(async () => {
        $w('#sendSmsBtn').label = "Sending...";
        $w('#signingStatusText').text = "Sending SMS request...";
        $w('#signingStatusText').expand();

        try {
            // Mock data
            const defendantInfo = {
                email: data.email || 'test@example.com',
                phone: data.phone || '555-555-5555'
            };

            const result = await initiateSigningWorkflow({
                caseId: data._id,
                method: 'sms',
                defendantInfo,
                indemnitorInfo: [],
                documentIds: ['doc_123']
            });

            if (result.success) {
                $w('#sendSmsBtn').label = "Sent!";
                $w('#signingStatusText').text = "SMS sent successfully.";
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            console.error(e);
            $w('#sendSmsBtn').label = "Retry";
            $w('#signingStatusText').text = "Error sending SMS: " + e.message;
        }
    });

    // C. Kiosk Mode (Open Signing Lightbox)
    $w('#openKioskBtn').onClick(async () => {
        $w('#openKioskBtn').label = "Opening...";
        $w('#signingStatusText').text = "Generating kiosk link...";
        $w('#signingStatusText').expand();

        try {
            const result = await initiateSigningWorkflow({
                caseId: data._id,
                method: 'kiosk',
                defendantInfo: { email: 'kiosk@test.com' }, // Kiosk dummy email
                indemnitorInfo: [],
                documentIds: ['doc_123']
            });

            if (result.success && result.links && result.links[0]) {
                // Open the *Signing* Lightbox with the link
                wixWindow.openLightbox("SigningLightbox", {
                    signingUrl: result.links[0],
                    documentId: 'doc_123'
                });
                $w('#openKioskBtn').label = "Open Kiosk";
                $w('#signingStatusText').text = "Kiosk session started.";
            } else {
                throw new Error("No link returned.");
            }
        } catch (e) {
            console.error(e);
            $w('#openKioskBtn').label = "Retry";
            $w('#signingStatusText').text = "Kiosk Error: " + e.message;
        }
    });
});
