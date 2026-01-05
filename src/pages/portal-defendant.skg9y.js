// Page: portal-defendant.skg9y.js
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';
import { getUserProfile, getDefendantDetails, saveUserProfile } from 'backend/portal-auth';
// New Imports
import { LightboxController } from 'public/lightbox-controller';
import { uploadIdDocument, getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';

$w.onReady(async function () {
    // Initialize Lightbox Controller
    LightboxController.init($w);

    initUI(); // Set loading states

    try {
        const member = await currentMember.getMember();
        if (!member) {
            console.warn("⛔ Unauthorized Access. Redirecting to Portal Landing.");
            wixLocation.to('/portal');
            return;
        }

        // Fetch Comprehensive Data
        const data = await getDefendantDetails(member._id);
        const name = (member.contactDetails?.firstName) || "Client";

        // --- I. TOP SECTION: Case Details ---
        $w('#welcomeText').text = `Welcome, ${name}`;
        if (data) {
            $w('#caseNumberText').text = data.caseNumber || "Pending";
            $w('#bondAmountText').text = data.bondAmount || "$0.00";
            $w('#nextCourtDateValueText').text = data.nextCourtDate || "TBD";
            $w('#caseStatusText').text = data.caseStatus || "Active";

            // --- II. MIDDLE SECTION: Paperwork ---
            $w('#paperworkStatusText').text = data.paperworkStatus || "Pending";
            $w('#signingStatusText').text = data.signingStatus || "Incomplete";
        }

        // Setup Lightbox workfows
        setupIdUploadLightbox();
        setupConsentLightbox();
        setupSigningLightbox();

        // Setup Existing Handlers (Check-In)
        setupCheckInHandlers();

        // Setup Button Aliases for Paperwork
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
    // 1. "Start Paperwork" (Primary)
    const startBtn = $w('#startPaperworkBtn');
    if (startBtn.length > 0) {
        startBtn.onClick(() => handlePaperworkStart(member));
    }

    // 2. "Sign Kiosk" (Legacy/Alias) -> Mapped to new flow
    const kioskBtn = $w('#signKioskBtn');
    if (kioskBtn.length > 0) {
        kioskBtn.onClick(() => handlePaperworkStart(member));
    }
}

async function handlePaperworkStart(member) {
    // Check if ID is already uploaded
    const hasUploadedId = await checkIdUploadStatus(member.loginEmail);

    if (!hasUploadedId) {
        LightboxController.show('idUpload');
    } else {
        // Check consent status
        const hasConsented = await checkConsentStatus(member.loginEmail);

        if (!hasConsented) {
            LightboxController.show('consent');
        } else {
            // Proceed directly to signing
            await proceedToSignNow();
        }
    }
}

function setupCheckInHandlers() {
    // --- III. Check-In Handler ---
    const checkInBtn = $w('#checkInBtn');
    if (checkInBtn.length === 0) return;

    checkInBtn.onClick(async () => {
        // Validation: Must have a file selected
        if ($w('#selfieUpload').value.length === 0) {
            updateCheckInStatus("Error: Please take a selfie first.", "error");
            return;
        }

        $w('#checkInBtn').disable();
        $w('#checkInBtn').label = "Uploading...";
        $w('#statusBox').style.backgroundColor = "#FFFFFF";

        try {
            // A. Upload Selfie
            const uploadFiles = await $w('#selfieUpload').startUpload();
            const selfieUrl = uploadFiles.url;

            $w('#checkInBtn').label = "Acquiring Location...";

            // B. Get GPS
            const locationObj = await wixWindow.getCurrentGeolocation();
            const lat = locationObj.coords.latitude;
            const lng = locationObj.coords.longitude;
            const notes = $w('#updateNotesInput').value;

            $w('#checkInBtn').label = "Verifying...";

            // C. Submit to Backend
            const result = await saveUserLocation(lat, lng, notes, selfieUrl);

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
            updateCheckInStatus("Error: " + (error.message || "Please enable Location Services."), "error");
        }
    });

    $w('#downloadPrintBtn').onClick(() => console.log("Download clicked"));
}

function updateCheckInStatus(msg, type) {
    const color = type === "success" ? "#E6FFFA" : "#FFE6E6";
    $w('#statusBox').style.backgroundColor = color;
    $w('#checkInStatusText').text = msg;
    $w('#checkInStatusText').expand();
}

/**
 * Setup ID Upload Lightbox
 */
function setupIdUploadLightbox() {
    setupIdUploadForm();
}

/**
 * Setup ID Upload Form
 */
function setupIdUploadForm() {
    // Front of ID upload
    if ($w('#idFrontUploadBtn').length > 0) {
        $w('#idFrontUploadBtn').onChange(async () => {
            await handleFileUpload($w('#idFrontUploadBtn'), 'front', '#idFrontStatus');
        });
    }

    // Back of ID upload
    if ($w('#idBackUploadBtn').length > 0) {
        $w('#idBackUploadBtn').onChange(async () => {
            await handleFileUpload($w('#idBackUploadBtn'), 'back', '#idBackStatus');
        });
    }

    // Submit button (after both sides uploaded)
    if ($w('#idUploadSubmitBtn').length > 0) {
        $w('#idUploadSubmitBtn').onClick(async () => {
            const member = await currentMember.getMember();
            const hasUploadedId = await checkIdUploadStatus(member.loginEmail);

            if (hasUploadedId) {
                LightboxController.hide('idUpload');
                LightboxController.show('consent');
            } else {
                $w('#idUploadError').text = 'Please upload both front and back of your ID';
                $w('#idUploadError').expand();
            }
        });
    }
}

async function handleFileUpload(uploadBtn, side, statusInfo) {
    const file = uploadBtn.value[0];
    if (file) {
        $w(statusInfo).text = 'Uploading...';
        $w(statusInfo).expand();

        try {
            const member = await currentMember.getMember();
            const metadata = await captureMetadata(); // Utilizing the one in file scope

            // Defendant Role
            const result = await uploadIdDocument({
                file: file,
                side: side,
                metadata: {
                    memberEmail: member.loginEmail,
                    memberName: member.contactDetails?.firstName + ' ' + member.contactDetails?.lastName,
                    memberRole: 'defendant',
                    ...metadata
                }
            });

            if (result.success) {
                $w(statusInfo).text = `✓ ${side.charAt(0).toUpperCase() + side.slice(1)} uploaded`;
            } else {
                $w(statusInfo).text = '✗ Upload failed';
            }
        } catch (e) {
            console.error(e);
            $w(statusInfo).text = '✗ Error';
        }
    }
}


/**
 * Setup Consent Lightbox
 */
function setupConsentLightbox() {
    // "I Agree" button
    if ($w('#consentAgreeBtn').length > 0) {
        $w('#consentAgreeBtn').onClick(async () => {
            const member = await currentMember.getMember();

            let profile = await getUserProfile(member._id);
            if (!profile) profile = { _id: member._id };

            profile.consentGiven = true;
            profile.consentTimestamp = new Date().toISOString();
            profile.consentRole = 'defendant';
            await saveUserProfile(profile);

            LightboxController.hide('consent');
            await proceedToSignNow();
        });
    }

    if ($w('#consentLearnMoreBtn').length > 0) {
        $w('#consentLearnMoreBtn').onClick(() => {
            LightboxController.show('privacy');
        });
    }
}

/**
 * Setup Signing Lightbox
 */
function setupSigningLightbox() {
    if ($w('#signingCloseBtn').length > 0) {
        $w('#signingCloseBtn').onClick(() => {
            LightboxController.hide('signing');
        });
    }

    if ($w('#signingResumeLaterBtn').length > 0) {
        $w('#signingResumeLaterBtn').onClick(() => {
            LightboxController.hide('signing');
            // Logic to update status text on main page if desired
        });
    }
}

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

async function checkConsentStatus(memberEmail) {
    try {
        const member = await currentMember.getMember();
        const profile = await getUserProfile(member._id);
        return profile?.consentGiven === true;
    } catch (e) {
        return false;
    }
}

async function captureMetadata() {
    return new Promise((resolve) => {
        wixWindow.getCurrentGeolocation()
            .then((result) => {
                resolve({
                    gps: {
                        latitude: result.coords.latitude,
                        longitude: result.coords.longitude,
                        accuracy: result.coords.accuracy
                    },
                    uploadedAt: new Date().toISOString(),
                    userAgent: "WixClient"
                });
            })
            .catch((err) => {
                resolve({
                    gps: null,
                    uploadedAt: new Date().toISOString()
                });
            });
    });
}

async function proceedToSignNow() {
    const member = await currentMember.getMember();
    const profile = await getUserProfile(member._id);

    // Get the first case ID
    const caseId = profile?.caseIds?.[0] || "Active_Case_Fallback";

    // Role: Defendant
    const result = await createEmbeddedLink(caseId, member.loginEmail, 'defendant');

    if (result.success) {
        LightboxController.show('signing', {
            signingUrl: result.embeddedLink
        });
    } else {
        console.error('Failed to create SignNow link:', result.error);
        // Display error if UI element exists
    }
}
