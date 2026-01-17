import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { initiateSigningWorkflow } from 'backend/signing-methods';

$w.onReady(function () {
    const data = wixWindow.lightbox.getContext();
    if (!data) return;

    // 1. Map Status Fields
    if ($w('#detailsNameText').length) $w('#detailsNameText').text = data.defendantName || "No Name";
    if ($w('#detailsCaseNumberText').length) $w('#detailsCaseNumberText').text = data.caseNumber || "No Case";
    if ($w('#detailsBondText').length) $w('#detailsBondText').text = data.bondAmount || "$0.00";
    if ($w('#detailsStatusText').length) $w('#detailsStatusText').text = data.status || "Unknown";

    // 2. Setup Close
    const closeBtn = $w('#closeBtn');
    if (closeBtn.length) closeBtn.onClick(() => wixWindow.lightbox.close());

    // 3. SignNow Integration Handlers
    // ------------------------------------------------

    // A. Send via Email
    const sendEmailBtn = $w('#sendEmailBtn');
    if (sendEmailBtn.length) {
        sendEmailBtn.onClick(async () => {
            $w('#sendEmailBtn').label = "Sending...";
            const statusText = $w('#signingStatusText');
            if (statusText.length) {
                statusText.text = "Sending email request...";
                statusText.expand();
            }

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
                    documentIds: [] // Empty = Use Default Template
                });

                if (result.success) {
                    $w('#sendEmailBtn').label = "Sent!";
                    if (statusText.length) statusText.text = "Email sent successfully.";
                } else {
                    throw new Error(result.error);
                }
            } catch (e) {
                console.error(e);
                $w('#sendEmailBtn').label = "Retry";
                if (statusText.length) statusText.text = "Error sending email: " + e.message;
            }
        });
    }

    // B. Send via SMS
    const sendSmsBtn = $w('#sendSmsBtn');
    if (sendSmsBtn.length) {
        sendSmsBtn.onClick(async () => {
            $w('#sendSmsBtn').label = "Sending...";
            const statusText = $w('#signingStatusText');
            if (statusText.length) {
                statusText.text = "Sending SMS request...";
                statusText.expand();
            }

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
                    documentIds: [] // Empty = Use Default Template
                });

                if (result.success) {
                    $w('#sendSmsBtn').label = "Sent!";
                    if (statusText.length) statusText.text = "SMS sent successfully.";
                } else {
                    throw new Error(result.error);
                }
            } catch (e) {
                console.error(e);
                $w('#sendSmsBtn').label = "Retry";
                if (statusText.length) statusText.text = "Error sending SMS: " + e.message;
            }
        });
    }

    // C. Kiosk Mode (Open Signing Lightbox)
    const openKioskBtn = $w('#openKioskBtn');
    if (openKioskBtn.length) {
        openKioskBtn.onClick(async () => {
            $w('#openKioskBtn').label = "Opening...";
            const statusText = $w('#signingStatusText');
            if (statusText.length) {
                statusText.text = "Generating kiosk link...";
                statusText.expand();
            }

            try {
                const result = await initiateSigningWorkflow({
                    caseId: data._id,
                    method: 'kiosk',
                    defendantInfo: { email: 'kiosk@test.com' }, // Kiosk dummy email
                    indemnitorInfo: [],
                    documentIds: [] // Empty = Use Default Template
                });

                if (result.success && result.links && result.links[0]) {
                    // Open the *Signing* Lightbox with the link
                    wixWindow.openLightbox("SigningLightbox", {
                        signingUrl: result.links[0],
                        documentId: null
                    });
                    $w('#openKioskBtn').label = "Open Kiosk";
                    if (statusText.length) statusText.text = "Kiosk session started.";
                } else {
                    throw new Error("No link returned.");
                }
            } catch (e) {
                console.error(e);
                $w('#openKioskBtn').label = "Retry";
                if (statusText.length) statusText.text = "Kiosk Error: " + e.message;
            }
        });
    }
});
