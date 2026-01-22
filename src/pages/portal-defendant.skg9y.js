/// <reference path="../types/wix-overrides.d.ts" />
// Page: portal-defendant.skg9y.js (CUSTOM AUTH VERSION)
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status
// Last Updated: 2026-01-08
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser storage (wix-storage-frontend) session tokens validated against PortalSessions collection

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { saveUserLocation } from 'backend/location';
import { validateCustomSession, getDefendantDetails, getUserConsentStatus } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';
import { getSessionToken, setSessionToken, clearSessionToken } from 'public/session-manager';
import wixSeo from 'wix-seo';
// ROBUST TRACKING IMPORTS
import { silentPingLocation } from 'public/location-tracker';
import { captureFullLocationSnapshot } from 'public/geolocation-client';

let currentSession = null; // Store validated session data

$w.onReady(async function () {
    LightboxController.init($w);
    initUI();

    try {
        // Check for session token in URL (passed from magic link redirect)
        const query = wixLocation.query;
        if (query.st) {
            console.log("🔗 Session token in URL, storing...");
            setSessionToken(query.st);
        }

        // CUSTOM AUTH CHECK - Replace Wix Members
        const sessionToken = query.st || getSessionToken();
        // console.log("DEBUG: Checking Token:", sessionToken);

        if (!sessionToken) {
            console.warn("⛔ No session token found. Redirecting to Portal Landing.");
            $w('#textUserWelcome').text = "Authentication Error: No session token found locally.";
            $w('#textUserWelcome').show();
            // DEBUG MODE: Don't redirect immediately so we can see the error
            // wixLocation.to('/portal-landing'); 
            return;
        }

        // Validate session with backend
        const session = await validateCustomSession(sessionToken);

        if (!session) {
            console.warn("⛔ Session validation returned null.");
            $w('#textUserWelcome').text = "Authentication Failed: Session invalid or not found in DB.";
            $w('#textUserWelcome').show();
            // clearSessionToken(); // Keep token for debugging
            return;
        }

        if (!session.role) {
            console.warn("⛔ Session has no role.");
            $w('#textUserWelcome').text = "Authentication Error: Session missing role.";
            $w('#textUserWelcome').show();
            return;
        }

        // Check role authorization
        if (session.role !== 'defendant') {
            const msg = `⛔ Wrong role: ${session.role}. This is the defendant portal.`;
            console.warn(msg);
            $w('#textUserWelcome').text = msg;
            $w('#textUserWelcome').show();
            // wixLocation.to('/portal-landing');
            return;
        }

        console.log("✅ Defendant authenticated:", session.personId);
        currentSession = session;

        // Fetch Data using sessionToken (session.personId is extracted on backend)
        const data = await getDefendantDetails(sessionToken);
        const name = data?.firstName || "Client";
        currentSession.email = data?.email || ""; // Store retrieved email
        // Glue Fix: Ensure SignNow flow uses the Case Number we just found
        if (data?.caseNumber && data.caseNumber !== "Pending") {
            currentSession.caseId = data.caseNumber;
        }

        try {
            if ($w('#textUserWelcome').type) {
                $w('#textUserWelcome').text = `Welcome, ${name}`;
            }

            if (data) {
                if ($w('#textCaseNumber').type) {
                    $w('#textCaseNumber').text = data.caseNumber || "Pending";
                }
                if ($w('#textBondAmount').type) {
                    $w('#textBondAmount').text = data.bondAmount || "$0.00";
                }
                if ($w('#textNextCourtDate').type) {
                    $w('#textNextCourtDate').text = data.nextCourtDate || "TBD";
                }
                if ($w('#textCaseStatus').type) {
                    $w('#textCaseStatus').text = data.caseStatus || "Active";
                }
                if ($w('#textPaperworkStatus').type) {
                    $w('#textPaperworkStatus').text = data.paperworkStatus || "Pending";
                }
                if ($w('#textSigningStatus').type) {
                    $w('#textSigningStatus').text = data.signingStatus || "Incomplete";
                }
            }
        } catch (e) {
            console.error('Error populating dashboard data:', e);
        }

        setupCheckInHandlers();
        setupPaperworkButtons();
        setupLogoutButton();

        // INITIATE ROBUST TRACKING (Silent Ping)
        // This runs in background to capture device/location without user action
        console.log("📍 Initiating background location tracker...");
        silentPingLocation();

    } catch (e) {
        console.error("Dashboard Load Error", e);
        try {
            if ($w('#textUserWelcome').type) {
                $w('#textUserWelcome').text = "Error loading dashboard";
            }
        } catch (err) { }
    }


    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "Defendant Dashboard | Shamrock Bail Bonds";
    // No index for private dashboards
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "robots", "content": "noindex, nofollow" }
    ]);

    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": "Defendant Dashboard",
            "mainEntity": {
                "@type": "Person",
                "name": "Defendant"
            }
        }
    ]);
}

function initUI() {
    try {
        if ($w('#textUserWelcome').type) {
            $w('#textUserWelcome').text = "Loading...";
        }
        if ($w('#textCheckInStatus').type) {
            $w('#textCheckInStatus').collapse();
        }
        // Hide Download Button (Per Implementation Plan)
        // Hide Download Button (Per Implementation Plan)
        if ($w('#btnDownloadPdf').type) {
            $w('#btnDownloadPdf').collapse();
        }
    } catch (e) {
        console.error('Error initializing UI:', e);
    }
}

function setupPaperworkButtons() {
    // Sign via Email Button (#btnStartPaperwork)
    try {
        const emailBtn = $w('#btnStartPaperwork');
        if (emailBtn.length > 0) {
            console.log('Defendant Portal: Sign via Email button found');
            emailBtn.onClick(() => {
                console.log('Defendant Portal: Sign via Email clicked');
                handlePaperworkStart();
            });
        } else {
            console.warn('Defendant Portal: #btnStartPaperwork not found');
        }
    } catch (e) {
        console.error('Error setting up Sign via Email button:', e);
    }

    // Sign Via Kiosk Button (#btnSignKiosk)
    try {
        const kioskBtn = $w('#btnSignKiosk');
        if (kioskBtn && typeof kioskBtn.onClick === 'function') {
            console.log('Defendant Portal: Sign Via Kiosk button found');
            kioskBtn.onClick(() => {
                console.log('Defendant Portal: Sign Via Kiosk clicked');
                handlePaperworkStart();
            });
        } else {
            console.warn('Defendant Portal: #btnSignKiosk not found');
        }
    } catch (e) {
        console.error('Error setting up Sign Via Kiosk button:', e);
    }

    // Download and Print to Sign Button (#btnDownloadPdf)
    try {
        const downloadBtn = $w('#btnDownloadPdf');
        if (downloadBtn && typeof downloadBtn.onClick === 'function') {
            console.log('Defendant Portal: Download and Print button found');
            downloadBtn.onClick(() => {
                console.log('Defendant Portal: Download and Print clicked');
                handleDownloadPaperwork();
            });
        } else {
            console.warn('Defendant Portal: #btnDownloadPdf not found');
        }
    } catch (e) {
        console.error('Error setting up Download and Print button:', e);
    }
}

function setupLogoutButton() {
    try {
        const logoutBtn = $w('#btnLogout');
        if (logoutBtn && typeof logoutBtn.onClick === 'function') {
            console.log('Defendant Portal: Logout button found');
            logoutBtn.onClick(() => {
                console.log('Defendant Portal: Logout clicked');
                handleLogout();
            });
        } else {
            console.warn('Defendant Portal: Logout button (#btnLogout) not found');
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
    if (!currentSession) return;

    // Use REAL email or fallback
    const userEmail = currentSession.email || `defendant_${currentSession.personId}@shamrock.local`;
    // console.log("Portal: Using email for paperwork:", userEmail); // Redacted for privacy

    // 0. FORTRESS GATE: Check if paperwork is already active
    const status = currentSession.paperworkStatus || "Pending"; // Default to pending if unknown to be safe, or fetch fresh
    // Note: The data load at line 80 populates this.
    // If status is 'Pending' (meaning documents sent), blocking duplicate requests.
    // If status is 'Active' or 'Incomplete' (meaning user needs to sign), we allow.
    // We need to be careful with terminology. Let's assume 'Pending' means "Sent to user".

    // Better Logic: If PENDING_DOCUMENTS collection has an active envelope, don't create new.
    // For now, simple UI gate:
    if (status === "Packet Sent" || status === "Signed") {
        // Adjust these string values to match your actual backend status values
        // If you are unsure, we will simply log a warning for now but allow retry in case of lost email.
        console.warn("Portal: Paperwork status is", status, "- allowing retry but consider blocking in future.");
        // alert("Paperwork already sent! Please check your email.");
        // return; 
    }

    // 1. ID Upload Check
    const hasUploadedId = await checkIdUploadStatus(userEmail, currentSession.token);
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

        if (consentResult && consentResult.success) {
            // Store consent in localStorage for persistence
            const consentKey = `consent_${currentSession.personId}`;
            wixWindow.browserStorage.local.setItem(consentKey, 'true');
            currentSession.hasConsented = true;
            console.log("START FLOW: Consent granted and stored");
        } else {
            // Double-check in case consent was stored by lightbox directly
            const doubleCheck = await checkConsentStatus(currentSession.personId);
            if (!doubleCheck) {
                console.log("START FLOW: Consent not granted, aborting");
                return;
            }
        }
    }

    // 3. Signing
    console.log("START FLOW: Ready for Signing");
    await proceedToSignNow();
}

// --- Status Check Helpers ---

async function checkIdUploadStatus(memberEmail, sessionToken) {
    try {
        const result = await getMemberDocuments(memberEmail, sessionToken);
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
        // Call Backend to Check Real Consent
        return await getUserConsentStatus(personId);
    } catch (e) {
        console.error("Frontend checkConsentStatus failed:", e);
        // Fallback or rethrow depending on desired behavior, for now just return false
        return false;
    }
}

async function proceedToSignNow() {
    if (!currentSession) return;

    const caseId = currentSession.caseId || "Active_Case_Fallback";
    // Use REAL email or fallback
    const userEmail = currentSession.email || `defendant_${currentSession.personId}@shamrock.local`;

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
            if ($w('#textSigningStatus').type) {
                $w('#textSigningStatus').text = "Error preparing documents.";
            }
        } catch (e) { }
    }
}

// --- Check-In Logic (Robustified) ---

function setupCheckInHandlers() {
    try {
        if (!$w('#btnCheckIn').type) return;

        $w('#btnCheckIn').onClick(async () => {
            try {
                if (!$w('#btnUploadSelfie').type || $w('#btnUploadSelfie').value.length === 0) {
                    updateCheckInStatus("Error: Please take a selfie first.", "error");
                    return;
                }

                $w('#btnCheckIn').disable();
                $w('#btnCheckIn').label = "Uploading...";

                try {
                    if ($w('#boxStatus').type) {
                        $w('#boxStatus').style.backgroundColor = "#FFFFFF";
                    }
                } catch (e) { }

                const uploadFiles = await $w('#btnUploadSelfie').startUpload();
                const selfieUrl = uploadFiles.url;

                $w('#btnCheckIn').label = "Acquiring Location...";
                // ROBUST CAPTURE
                const snapshot = await captureFullLocationSnapshot();

                if (!snapshot.geo.success) {
                    throw new Error(snapshot.geo.error || "Could not detecting location.");
                }

                $w('#btnCheckIn').label = "Verifying...";
                const token = getSessionToken(); // Get auth token for backend

                const result = await saveUserLocation(
                    snapshot.geo.latitude,
                    snapshot.geo.longitude,
                    $w('#inputUpdateNotes').type ? $w('#inputUpdateNotes').value : 'Manual Check-In',
                    selfieUrl,
                    token,
                    snapshot.extraData // Passing IP and Device Info
                );

                if (result.success) {
                    $w('#btnCheckIn').label = "Check In Complete";
                    $w('#btnCheckIn').enable();

                    try {
                        if ($w('#inputUpdateNotes').type) {
                            $w('#inputUpdateNotes').value = "";
                        }
                    } catch (e) { }

                    updateCheckInStatus(`Checked in at: ${result.address}`, "success");
                } else {
                    throw new Error(result.message);
                }

            } catch (error) {
                console.error("Check-in Error", error);
                $w('#btnCheckIn').label = "Try Again";
                $w('#btnCheckIn').enable();
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
        if ($w('#boxStatus').type) {
            $w('#boxStatus').style.backgroundColor = color;
        }
        if ($w('#textCheckInStatus').type) {
            $w('#textCheckInStatus').text = msg;
            $w('#textCheckInStatus').expand();
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
