// Page: portal-defendant.skg9y.js (FIXED)
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status
//
// FIXES:
// - Replaced .length checks with proper .type checks
// - Added try-catch blocks around all element manipulations
// - Prevents "onClick is not a function" errors

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';
import { getUserProfile, getDefendantDetails } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';

$w.onReady(async function () {
    LightboxController.init($w);
    initUI();

    try {
        const member = await currentMember.getMember();
        if (!member) {
            console.warn("⛔ Unauthorized Access. Redirecting to Portal Landing.");
            wixLocation.to('/portal');
            return;
        }

        // Fetch Data
        const data = await getDefendantDetails(member._id);
        const name = (member.contactDetails?.firstName) || "Client";

        try {
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = `Welcome, ${name}`;
            }

            if (data) {
                if ($w('#caseNumberText').type) {
                    $w('#caseNumberText').text = data.caseNumber || "Pending";
                }
                if ($w('#bondAmountText').type) {
                    $w('#bondAmountText').text = data.bondAmount || "$0.00";
                }
                if ($w('#nextCourtDateValueText').type) {
                    $w('#nextCourtDateValueText').text = data.nextCourtDate || "TBD";
                }
                if ($w('#caseStatusText').type) {
                    $w('#caseStatusText').text = data.caseStatus || "Active";
                }
                if ($w('#paperworkStatusText').type) {
                    $w('#paperworkStatusText').text = data.paperworkStatus || "Pending";
                }
                if ($w('#signingStatusText').type) {
                    $w('#signingStatusText').text = data.signingStatus || "Incomplete";
                }
            }
        } catch (e) {
            console.error('Error populating dashboard data:', e);
        }

        setupCheckInHandlers();
        setupPaperworkButtons(member);

    } catch (e) {
        console.error("Dashboard Load Error", e);
        try {
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Welcome";
            }
        } catch (err) { }
    }
});

function initUI() {
    try {
        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = "Loading...";
        }
        if ($w('#checkInStatusText').type) {
            $w('#checkInStatusText').collapse();
        }
    } catch (e) {
        console.error('Error initializing UI:', e);
    }
}

function setupPaperworkButtons(member) {
    // Start Paperwork Button
    try {
        if ($w('#startPaperworkBtn').type) {
            $w('#startPaperworkBtn').onClick(() => handlePaperworkStart(member));
        }
    } catch (e) {
        console.error('Error setting up startPaperworkBtn:', e);
    }

    // Kiosk Button
    try {
        if ($w('#signKioskBtn').type) {
            $w('#signKioskBtn').onClick(() => handlePaperworkStart(member));
        }
    } catch (e) {
        console.error('Error setting up signKioskBtn:', e);
    }
}

/**
 * Main Paperwork Orchestration Flow
 * Checks status sequentially and opens lightboxes if needed.
 */
async function handlePaperworkStart(member) {
    // 1. ID Upload Check
    const hasUploadedId = await checkIdUploadStatus(member.loginEmail);
    if (!hasUploadedId) {
        console.log("START FLOW: ID Missing -> Opening Lightbox");
        // Open Lightbox and WAIT for close
        const idResult = await LightboxController.show('idUpload', {
            memberData: { email: member.loginEmail, name: member.contactDetails?.firstName }
        });

        // If they closed it without success, stop here.
        if (!idResult?.success) return;
    }

    // 2. Consent Check
    const hasConsented = await checkConsentStatus(member._id);
    if (!hasConsented) {
        console.log("START FLOW: Consent Missing -> Opening Lightbox");
        const consentResult = await LightboxController.show('consent');

        // If they didn't agree (e.g. cancelled), stop.
        if (!consentResult) {
            // Optional: re-check status to be sure
            const doubleCheck = await checkConsentStatus(member._id);
            if (!doubleCheck) return;
        }
    }

    // 3. Signing
    console.log("START FLOW: Ready for Signing");
    await proceedToSignNow(member);
}

// --- Status Check Helpers ---

async function checkIdUploadStatus(memberEmail) {
    try {
        const result = await getMemberDocuments(memberEmail);
        if (!result.success) return false;
        const idDocs = result.documents.filter(doc => doc.documentType === 'government_id');
        const hasFront = idDocs.some(doc => doc.documentSide === 'front');
        const hasBack = idDocs.some(doc => doc.documentSide === 'back');
        return hasFront && hasBack;
    } catch (e) {
        return false;
    }
}

async function checkConsentStatus(memberId) {
    try {
        const profile = await getUserProfile(memberId);
        return profile?.consentGiven === true;
    } catch (e) {
        return false;
    }
}

async function proceedToSignNow(member) {
    const profile = await getUserProfile(member._id);
    const caseId = profile?.caseIds?.[0] || "Active_Case_Fallback";

    // Generate Link
    const result = await createEmbeddedLink(caseId, member.loginEmail, 'defendant');

    if (result.success) {
        LightboxController.show('signing', {
            signingUrl: result.embeddedLink,
            documentId: result.documentId
        });
    } else {
        console.error('Failed to create SignNow link:', result.error);
        try {
            if ($w('#signingStatusText').type) {
                $w('#signingStatusText').text = "Error preparing documents.";
            }
        } catch (e) { }
    }
}

// --- Check-In Logic (Preserved) ---

function setupCheckInHandlers() {
    try {
        if (!$w('#checkInBtn').type) return;

        $w('#checkInBtn').onClick(async () => {
            try {
                if (!$w('#selfieUpload').type || $w('#selfieUpload').value.length === 0) {
                    updateCheckInStatus("Error: Please take a selfie first.", "error");
                    return;
                }

                $w('#checkInBtn').disable();
                $w('#checkInBtn').label = "Uploading...";

                try {
                    if ($w('#statusBox').type) {
                        $w('#statusBox').style.backgroundColor = "#FFFFFF";
                    }
                } catch (e) { }

                const uploadFiles = await $w('#selfieUpload').startUpload();
                const selfieUrl = uploadFiles.url;

                $w('#checkInBtn').label = "Acquiring Location...";
                const locationObj = await wixWindow.getCurrentGeolocation();

                $w('#checkInBtn').label = "Verifying...";
                const result = await saveUserLocation(
                    locationObj.coords.latitude,
                    locationObj.coords.longitude,
                    $w('#updateNotesInput').type ? $w('#updateNotesInput').value : '',
                    selfieUrl
                );

                if (result.success) {
                    $w('#checkInBtn').label = "Check In Complete";
                    $w('#checkInBtn').enable();

                    try {
                        if ($w('#updateNotesInput').type) {
                            $w('#updateNotesInput').value = "";
                        }
                    } catch (e) { }

                    updateCheckInStatus(`Checked in at: ${result.address}`, "success");
                } else {
                    throw new Error(result.message);
                }

            } catch (error) {
                console.error("Check-in Error", error);
                $w('#checkInBtn').label = "Try Again";
                $w('#checkInBtn').enable();
                updateCheckInStatus("Error: " + (error.message || "Location required."), "error");
            }
        });
    } catch (e) {
        console.error('Error setting up check-in handlers:', e);
    }
}

function updateCheckInStatus(msg, type) {
    try {
        const color = type === "success" ? "#E6FFFA" : "#FFE6E6";
        if ($w('#statusBox').type) {
            $w('#statusBox').style.backgroundColor = color;
        }
        if ($w('#checkInStatusText').type) {
            $w('#checkInStatusText').text = msg;
            $w('#checkInStatusText').expand();
        }
    } catch (e) {
        console.error('Error updating check-in status:', e);
    }
}
