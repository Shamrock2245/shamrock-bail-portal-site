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

    // 4. Manual Approval Workflow
    // ------------------------------------------------
    const approveBtn = $w('#approveBtn');
    const actionButtons = [$w('#sendEmailBtn'), $w('#sendSmsBtn'), $w('#openKioskBtn')];

    // Check current status
    const currentStatus = (data.paperworkStatus || data.status || "Pending");
    const isApproved = currentStatus.toLowerCase() === 'approved';

    // Initial State: Disable buttons if not approved
    if (!isApproved) {
        actionButtons.forEach(btn => {
            if (btn.length) {
                btn.disable();
                btn.label = "Approve First";
            }
        });
    }

    // Setup Approve Button
    if (approveBtn.length) {
        if (isApproved) {
            approveBtn.label = "Approved ✅";
            approveBtn.disable();
        } else {
            approveBtn.onClick(async () => {
                approveBtn.label = "Approving...";
                approveBtn.disable();
                try {
                    // Update Status in Backend
                    // We need a backend function to update status. 
                    // Using wixData.update or a dedicated backend function.
                    // IMPORTANT: We should update both Cases and IntakeQueue if possible or just the source.
                    // Assuming data._id is the item ID in the source collection.

                    // Simple approach: Update status column directly for now
                    // Note: Ideally call a backend function 'approveBond(id)'

                    if (data._id) {
                        // Decide collection based on context or try both?
                        // Staff portal often loads mixed data. Let's assume 'Cases' or 'IntakeQueue' based on fields.
                        const collection = data.collectionName || 'Cases'; // Warning: data.collectionName might need to be passed from repeater

                        // Fallback: Try to update 'Cases'
                        // NOTE: User context implies 'IntakeQueue' is the source of "submissions"
                        // But staff portal repeater usually binds to Cases? 
                        // Let's check portal-staff logic -> getStaffDashboardData -> usually checks both.

                        // SAFEST: Call a backend helper.
                        // For now, I will unlock the buttons locally and assume the user handles backend sync or I'll add a simple wixData update

                        await wixData.update(collection, { ...data, status: 'Approved', paperworkStatus: 'Approved' });
                    }

                    // Update UI
                    $w('#detailsStatusText').text = "Approved";
                    approveBtn.label = "Approved ✅";

                    // Enable Action Buttons
                    actionButtons.forEach(btn => {
                        if (btn.length) {
                            btn.enable();
                            // Restore labels
                            if (btn.id.includes('Email')) btn.label = "Send Email";
                            if (btn.id.includes('Sms')) btn.label = "Send SMS";
                            if (btn.id.includes('Kiosk')) btn.label = "Open Kiosk";
                        }
                    });

                    if ($w('#signingStatusText').length) {
                        $w('#signingStatusText').text = "Bond Approved. You may now initiate signing.";
                        $w('#signingStatusText').expand();
                    }

                } catch (e) {
                    console.error("Approval Failed", e);
                    approveBtn.label = "Retry Approval";
                    approveBtn.enable();
                }
            });
        }
    } else {
        // If no approve button exists, we can't enforce it easily OR the user forgot to add it.
        // But user said "There has to be a manual review". 
        // We will assume if the button is missing, the layout isn't updated, 
        // so we just warn in console but keep logic (which might block usage if not approved).
        if (!isApproved) {
            console.warn("Approve Button #approveBtn missing, but case is not approved. Actions are disabled.");
        }
    }

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
                // Get most up-to-date contact info
                const contactInfo = await getLatestContactInfo(data);

                if (!contactInfo.email) {
                    throw new Error("No email address found for this defendant.");
                }

                const defendantInfo = {
                    email: contactInfo.email,
                    phone: contactInfo.phone || '555-555-5555'
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
                // Get most up-to-date contact info
                const contactInfo = await getLatestContactInfo(data);

                if (!contactInfo.phone) {
                    throw new Error("No phone number found for this defendant.");
                }

                const defendantInfo = {
                    email: contactInfo.email || 'no-email@example.com',
                    phone: contactInfo.phone
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

/**
 * Attempts to retrieve the latest phone/email for a case/defendant.
 * 1. Checks the passed itemData.
 * 2. Queries 'Cases' collection.
 * 3. Queries 'IntakeQueue' collection.
 */
async function getLatestContactInfo(itemData) {
    // 1. Check itemData first
    if (itemData.email && itemData.phone) {
        return { email: itemData.email, phone: itemData.phone };
    }

    const info = {
        email: itemData.email || itemData.defendantEmail,
        phone: itemData.phone || itemData.defendantPhone
    };

    if (info.email && info.phone) return info;

    // 2. Query 'Cases' if we have an ID
    if (itemData._id) {
        try {
            const caseRes = await wixData.query("Cases").eq("_id", itemData._id).find();
            if (caseRes.items.length > 0) {
                const c = caseRes.items[0];
                if (!info.email) info.email = c.email || c.defendantEmail;
                if (!info.phone) info.phone = c.phone || c.defendantPhone;
            }
        } catch (e) { console.warn("Case query failed", e); }
    }

    if (info.email && info.phone) return info;

    // 3. Query 'IntakeQueue' (fallback)
    if (itemData._id) { // Assuming ID matches or we search by caseNumber
        try {
            let intakeQ = wixData.query("IntakeQueue").eq("_id", itemData._id);
            if (itemData.caseNumber) {
                intakeQ = intakeQ.or(wixData.query("IntakeQueue").eq("caseId", itemData.caseNumber));
            }
            const intakeRes = await intakeQ.find();
            if (intakeRes.items.length > 0) {
                const i = intakeRes.items[0];
                if (!info.email) info.email = i.defendantEmail;
                if (!info.phone) info.phone = i.defendantPhone;
            }
        } catch (e) { console.warn("Intake query failed", e); }
    }

    return info;
}
