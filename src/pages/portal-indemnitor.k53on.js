// Page: portal-indemnitor.k53on.js
// Function: Indemnitor Dashboard with Lightbox Controller Integration

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { getUserProfile, getIndemnitorDetails, saveUserProfile } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { uploadIdDocument, getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';

$w.onReady(async function () {
    // Initialize the lightbox controller
    LightboxController.init($w);

    $w('#welcomeText').text = "Loading Dashboard...";

    try {
        const member = await currentMember.getMember();
        if (!member) {
            console.warn("⛔ Unauthorized Access. Redirecting to Portal Landing.");
            wixLocation.to('/portal');
            return;
        }

        // Setup lightbox workflows
        // We pass the member to avoid re-fetching if possible, or just let them fetch
        setupIdUploadLightbox(member);
        setupConsentLightbox(member);
        setupSigningLightbox();

        // Load Dashboard Data (Preserved Logic)
        await loadDashboardData(member);

    } catch (error) {
        console.error("Dashboard Error", error);
        $w('#welcomeText').text = "Welcome";
    }

    // 4. Contact Button
    $w('#contactBtn').onClick(() => {
        wixLocation.to("/contact");
    });
});

async function loadDashboardData(member) {
    // Fetch Comprehensive Data
    const data = await getIndemnitorDetails(member._id);

    // 1. Welcome & Header
    const name = (member.contactDetails?.firstName) || "Indemnitor";
    $w('#welcomeText').text = `Welcome, ${name}`;

    if (data) {
        // 2. Financials (Top Blue & Cards)
        $w('#liabilityText').text = data.totalLiability || "$0.00";
        $w('#totalPremiumText').text = data.totalPremium || "$0.00";
        $w('#downPaymentText').text = data.downPayment || "$0.00";
        $w('#balanceDueText').text = data.balanceDue || "$0.00";
        $w('#chargesCountText').text = data.chargesCount || "0";

        // 3. Defendant Status (Bottom)
        $w('#defendantNameText').text = data.defendantName || "N/A";
        $w('#defendantStatusText').text = data.defendantStatus || "Unknown";
        $w('#lastCheckInText').text = data.lastCheckIn || "Never";
        $w('#nextCourtDateText').text = data.nextCourtDate || "TBD";
    }
}

/**
 * Setup ID Upload Lightbox
 */
function setupIdUploadLightbox(member) {
    // "Start Financial Paperwork" button triggers ID upload check
    const btn = $w('#startFinancialPaperworkBtn');
    if (btn.length > 0) {
        btn.onClick(async () => {
            handlePaperworkStart(member);
        });
    }

    // Also check for 'startPaperworkBtn' alias
    const btnAlias = $w('#startPaperworkBtn');
    if (btnAlias.length > 0) {
        btnAlias.onClick(async () => {
            handlePaperworkStart(member);
        });
    }

    // ID Upload form submission
    setupIdUploadForm();
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
                // Close ID upload lightbox
                LightboxController.hide('idUpload');
                // Show consent lightbox
                LightboxController.show('consent');
            } else {
                $w('#idUploadError').text = 'Please upload both front and back of your ID';
                $w('#idUploadError').expand(); // Changed from show() to expand() for safety
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
            const metadata = await captureMetadata();

            const result = await uploadIdDocument({
                file: file,
                side: side,
                metadata: {
                    memberEmail: member.loginEmail,
                    memberName: member.contactDetails?.firstName + ' ' + member.contactDetails?.lastName,
                    memberRole: 'indemnitor',
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
function setupConsentLightbox(memberContext) {
    // "I Agree" button
    if ($w('#consentAgreeBtn').length > 0) {
        $w('#consentAgreeBtn').onClick(async () => {
            const member = await currentMember.getMember();

            // Save consent to user profile
            // Note: getUserProfile might return null if not init, handle carefully
            let profile = await getUserProfile(member._id);
            if (!profile) profile = { _id: member._id }; // Fallback

            profile.consentGiven = true;
            profile.consentTimestamp = new Date().toISOString();
            profile.consentRole = 'indemnitor';
            await saveUserProfile(profile);

            // Close consent lightbox
            LightboxController.hide('consent');

            // Proceed to signing
            await proceedToSignNow();
        });
    }

    // "Learn More" button
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
    // Close button
    if ($w('#signingCloseBtn').length > 0) {
        $w('#signingCloseBtn').onClick(() => {
            LightboxController.hide('signing');
        });
    }

    // "Resume Later" button
    if ($w('#signingResumeLaterBtn').length > 0) {
        $w('#signingResumeLaterBtn').onClick(() => {
            LightboxController.hide('signing');

            // Show message
            const statusMsg = $w('#statusMessage');
            if (statusMsg.length > 0) {
                statusMsg.text = 'You can resume signing from your dashboard at any time.';
                statusMsg.expand();
            }
        });
    }
}

/**
 * Check if user has uploaded ID
 */
async function checkIdUploadStatus(memberEmail) {
    try {
        const result = await getMemberDocuments(memberEmail);
        if (!result.success) return false;

        const idDocs = result.documents.filter(doc => doc.documentType === 'government_id');
        const hasFront = idDocs.some(doc => doc.documentSide === 'front');
        const hasBack = idDocs.some(doc => doc.documentSide === 'back');

        return hasFront && hasBack;
    } catch (e) {
        console.error("Check ID Error", e);
        return false;
    }
}

/**
 * Check if user has given consent
 */
async function checkConsentStatus(memberEmail) {
    // Using profile from backend
    try {
        const member = await currentMember.getMember();
        const profile = await getUserProfile(member._id);
        return profile?.consentGiven === true;
    } catch (e) {
        return false;
    }
}

/**
 * Capture metadata
 */
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
                    userAgent: "WixClient" // navigator.userAgent not avail in Velo always?
                });
            })
            .catch((err) => {
                console.warn("GPS failed", err);
                resolve({
                    gps: null,
                    uploadedAt: new Date().toISOString()
                });
            });
    });
}

/**
 * Proceed to SignNow
 */
async function proceedToSignNow() {
    const member = await currentMember.getMember();
    const profile = await getUserProfile(member._id);

    // Get the first case ID
    // Simplification: logic from guide
    const caseId = profile?.caseIds?.[0] || "Active_Case_Fallback";

    // Get SignNow embedded link for indemnitor
    const result = await createEmbeddedLink(caseId, member.loginEmail, 'indemnitor');

    if (result.success) {
        // Set iframe src via Lightbox Context usually? 
        // Or if the Lightbox logic allows direct manipulation if open? 
        // Guide implies opening lightbox with link.

        LightboxController.show('signing', {
            signingUrl: result.embeddedLink
        });
    } else {
        console.error('Failed to create SignNow link:', result.error);
        const statusMsg = $w('#statusMessage');
        if (statusMsg.length > 0) {
            statusMsg.text = 'Unable to load signing documents. Please try again.';
            statusMsg.expand();
        }
    }
}
