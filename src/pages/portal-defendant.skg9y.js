/// <reference path="../types/wix-overrides.d.ts" />
// Page: portal-defendant.skg9y.js (CUSTOM AUTH VERSION)
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status
// Last Updated: 2026-01-08
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser localStorage session tokens validated against PortalSessions collection

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { saveUserLocation } from 'backend/location';
import { validateCustomSession, getDefendantDetails } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';
import { getSessionToken, clearSessionToken } from 'public/session-manager';

let currentSession = null; // Store validated session data

$w.onReady(async function () {
    LightboxController.init($w);
    initUI();

    try {
        // CUSTOM AUTH CHECK - Replace Wix Members
        const sessionToken = getSessionToken();
        if (!sessionToken) {
            console.warn("⛔ No session token found. Redirecting to Portal Landing.");
            wixLocation.to('/portal-landing');
            return;
        }

        // Validate session with backend
        const session = await validateCustomSession(sessionToken);
        if (!session || !session.role) {
            console.warn("⛔ Invalid or expired session. Redirecting to Portal Landing.");
            clearSessionToken();
            wixLocation.to('/portal-landing');
            return;
        }

        // Check role authorization
        if (session.role !== 'defendant') {
            console.warn(`⛔ Wrong role: ${session.role}. This is the defendant portal.`);
            wixLocation.to('/portal-landing');
            return;
        }

        console.log("✅ Defendant authenticated:", session.personId);
        currentSession = session;

        // Fetch Data using personId
        const data = await getDefendantDetails(session.personId);
        const name = data?.firstName || "Client";

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
        setupPaperworkButtons();
        setupLogoutButton();

    } catch (e) {
        console.error("Dashboard Load Error", e);
        try {
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Error loading dashboard";
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

function setupPaperworkButtons() {
    // Sign via Email Button (#comp-mjsigfv9)
    try {
        const emailBtn = $w('#comp-mjsigfv9');
        if (emailBtn && typeof emailBtn.onClick === 'function') {
            console.log('Defendant Portal: Sign via Email button found');
            emailBtn.onClick(() => {
                console.log('Defendant Portal: Sign via Email clicked');
                handlePaperworkStart();
            });
        } else {
            console.warn('Defendant Portal: Sign via Email button (#comp-mjsigfv9) not found');
        }
    } catch (e) {
        console.error('Error setting up Sign via Email button:', e);
    }

    // Sign Via Kiosk Button (#comp-mjsihbjl)
    try {
        const kioskBtn = $w('#comp-mjsihbjl');
        if (kioskBtn && typeof kioskBtn.onClick === 'function') {
            console.log('Defendant Portal: Sign Via Kiosk button found');
            kioskBtn.onClick(() => {
                console.log('Defendant Portal: Sign Via Kiosk clicked');
                handlePaperworkStart();
            });
        } else {
            console.warn('Defendant Portal: Sign Via Kiosk button (#comp-mjsihbjl) not found');
        }
    } catch (e) {
        console.error('Error setting up Sign Via Kiosk button:', e);
    }

    // Download and Print to Sign Button (#comp-mjsihg1a)
    try {
        const downloadBtn = $w('#comp-mjsihg1a');
        if (downloadBtn && typeof downloadBtn.onClick === 'function') {
            console.log('Defendant Portal: Download and Print button found');
            downloadBtn.onClick(() => {
                console.log('Defendant Portal: Download and Print clicked');
                handleDownloadPaperwork();
            });
        } else {
            console.warn('Defendant Portal: Download and Print button (#comp-mjsihg1a) not found');
        }
    } catch (e) {
        console.error('Error setting up Download and Print button:', e);
    }
}

function setupLogoutButton() {
    try {
        const logoutBtn = $w('#logoutBtn');
        if (logoutBtn && typeof logoutBtn.onClick === 'function') {
            console.log('Defendant Portal: Logout button found');
            logoutBtn.onClick(() => {
                console.log('Defendant Portal: Logout clicked');
                handleLogout();
            });
        } else {
            console.warn('Defendant Portal: Logout button (#logoutBtn) not found');
        }
    } catch (e) {
        console.warn('Defendant Portal: No logout button configured');
    }
}

async function handleLogout() {
    console.log('Defendant Portal: Logging out...');
    clearSessionToken();
    wixLocation.to('/portal-landing');
}

/**
 * Main Paperwork Orchestration Flow
 * Checks status sequentially and opens lightboxes if needed.
 */
async function handlePaperworkStart() {
    if (!currentSession) {
        console.error('No session available');
        return;
    }

    // For now, we'll use a mock email - in production, this should come from user profile
    const userEmail = `defendant_${currentSession.personId}@shamrock.local`;

    // 1. ID Upload Check
    const hasUploadedId = await checkIdUploadStatus(userEmail);
    if (!hasUploadedId) {
        console.log("START FLOW: ID Missing -> Opening Lightbox");
        const idResult = await LightboxController.show('idUpload', {
            memberData: { email: userEmail, name: "Client" }
        });

        if (!idResult?.success) return;
    }

    // 2. Consent Check
    const hasConsented = await checkConsentStatus(currentSession.personId);
    if (!hasConsented) {
        console.log("START FLOW: Consent Missing -> Opening Lightbox");
        const consentResult = await LightboxController.show('consent');

        if (!consentResult) {
            const doubleCheck = await checkConsentStatus(currentSession.personId);
            if (!doubleCheck) return;
        }
    }

    // 3. Signing
    console.log("START FLOW: Ready for Signing");
    await proceedToSignNow();
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

async function checkConsentStatus(personId) {
    try {
        // TODO: Check consent in PortalUsers or custom collection
        // For now, return false to trigger consent flow
        return false;
    } catch (e) {
        return false;
    }
}

async function proceedToSignNow() {
    if (!currentSession) {
        console.error('No session available');
        return;
    }

    const caseId = currentSession.caseId || "Active_Case_Fallback";
    const userEmail = `defendant_${currentSession.personId}@shamrock.local`;

    // Generate Link
    const result = await createEmbeddedLink(caseId, userEmail, 'defendant');

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


/**
 * Handle Download and Print option
 * Generates PDF packet and downloads it
 */
async function handleDownloadPaperwork() {
    console.log('Defendant Portal: Handling download paperwork');
    
    try {
        // Show loading message
        alert('Preparing your paperwork for download...');
        
        if (!currentSession) {
            alert('Session error. Please log in again.');
            return;
        }

        const caseId = currentSession.caseId || "Active_Case_Fallback";
        
        // TODO: Implement PDF generation and download
        // For now, show a placeholder message
        alert('Download feature coming soon! Please use "Sign via Email" or "Sign Via Kiosk" for now.');
        
        // Future implementation:
        // 1. Call backend to generate PDF packet
        // 2. Get download URL
        // 3. Trigger download
        // const pdfUrl = await generatePDFPacket(caseId, userEmail);
        // wixLocation.to(pdfUrl);
        
    } catch (error) {
        console.error('Error handling download paperwork:', error);
        alert('Unable to prepare paperwork for download. Please try again or contact support.');
    }
}
