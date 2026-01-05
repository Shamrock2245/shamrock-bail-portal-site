// Page: portal-defendant.skg9y.js
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status

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

        $w('#welcomeText').text = `Welcome, ${name}`;
        if (data) {
            $w('#caseNumberText').text = data.caseNumber || "Pending";
            $w('#bondAmountText').text = data.bondAmount || "$0.00";
            $w('#nextCourtDateValueText').text = data.nextCourtDate || "TBD";
            $w('#caseStatusText').text = data.caseStatus || "Active";
            $w('#paperworkStatusText').text = data.paperworkStatus || "Pending";
            $w('#signingStatusText').text = data.signingStatus || "Incomplete";
        }

        setupCheckInHandlers();
        setupPaperworkButtons(member);

    } catch (e) {
        console.error("Dashboard Load Error", e);
        $w('#welcomeText').text = "Welcome";
    }
});

function initUI() {
    $w('#welcomeText').text = "Loading...";
    $w('#checkInStatusText').collapse();
}

function setupPaperworkButtons(member) {
    const startBtn = $w('#startPaperworkBtn');
    if (startBtn.length > 0) {
        startBtn.onClick(() => handlePaperworkStart(member));
    }

    const kioskBtn = $w('#signKioskBtn');
    if (kioskBtn.length > 0) {
        kioskBtn.onClick(() => handlePaperworkStart(member));
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
        // Assuming consent lightbox returns an object with consent info or null
        // If your ConsentLightbox just saves to backend and closes, we might re-check status or trust the result.
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
        $w('#signingStatusText').text = "Error preparing documents.";
    }
}

// --- Check-In Logic (Preserved) ---

function setupCheckInHandlers() {
    const checkInBtn = $w('#checkInBtn');
    if (checkInBtn.length === 0) return;

    checkInBtn.onClick(async () => {
        if ($w('#selfieUpload').value.length === 0) {
            updateCheckInStatus("Error: Please take a selfie first.", "error");
            return;
        }

        $w('#checkInBtn').disable();
        $w('#checkInBtn').label = "Uploading...";
        $w('#statusBox').style.backgroundColor = "#FFFFFF";

        try {
            const uploadFiles = await $w('#selfieUpload').startUpload();
            const selfieUrl = uploadFiles.url;

            $w('#checkInBtn').label = "Acquiring Location...";
            const locationObj = await wixWindow.getCurrentGeolocation();

            $w('#checkInBtn').label = "Verifying...";
            const result = await saveUserLocation(
                locationObj.coords.latitude,
                locationObj.coords.longitude,
                $w('#updateNotesInput').value,
                selfieUrl
            );

            if (result.success) {
                $w('#checkInBtn').label = "Check In Complete";
                $w('#checkInBtn').enable();
                $w('#updateNotesInput').value = "";
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
}

function updateCheckInStatus(msg, type) {
    const color = type === "success" ? "#E6FFFA" : "#FFE6E6";
    const box = $w('#statusBox');
    if (box) box.style.backgroundColor = color;
    $w('#checkInStatusText').text = msg;
    $w('#checkInStatusText').expand();
}
