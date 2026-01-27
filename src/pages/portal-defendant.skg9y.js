/// <reference path="../types/wix-overrides.d.ts" />
// Page: portal-defendant.skg9y.js (CUSTOM AUTH VERSION)
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status
// Last Updated: 2026-01-08
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser storage (wix-storage-frontend) session tokens validated against PortalSessions collection

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { local } from 'wix-storage';
import { saveUserLocation } from 'backend/location';
import { validateCustomSession, getDefendantDetails, getUserConsentStatus } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';
import { initiateSigningWorkflow } from 'backend/signing-methods';
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
        // User Requirement: "only... when the defendant is out on bond and after the paperwork is signed"
        // effective immediately upon "Packet Sent" or "Signed" status?
        // Let's go with permissive: If 'Packet Sent', 'Sent', 'Signed', 'Complete', 'Active'.
        // Exclude: 'Pending', 'Incomplete', 'Not Started'

        const pwStatus = (data?.paperworkStatus || 'Pending').toLowerCase();
        const allowedStatuses = ['sent', 'packet sent', 'signed', 'completed', 'active', 'downloaded'];

        if (allowedStatuses.some(s => pwStatus.includes(s))) {
            console.log("📍 Initiating background location tracker (Paperwork Status Valid)...");
            silentPingLocation(data?.caseStatus);
        } else {
            console.log(`📍 Background tracker skipped. Paperwork status '${data?.paperworkStatus}' does not meet tracking criteria.`);
        }

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
        if (emailBtn) {
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
 * Check if user has uploaded their ID
 * @param {string} email - User's email
 * @param {string} token - Session token
 * @returns {Promise<boolean>} True if ID has been uploaded
 */
async function checkIdUploadStatus(email, token) {
    try {
        // Check local storage first for quick response
        const localIdStatus = local.getItem(`id_uploaded_${email}`);
        if (localIdStatus === 'true') {
            return true;
        }

        // Check backend for ID upload status
        const docs = await getMemberDocuments(email);
        if (docs && docs.length > 0) {
            // Look for ID document types
            const hasId = docs.some(doc => 
                doc.documentType === 'id' || 
                doc.documentType === 'drivers_license' ||
                doc.documentType === 'identification' ||
                doc.category === 'id'
            );
            if (hasId) {
                local.setItem(`id_uploaded_${email}`, 'true');
                return true;
            }
        }

        return false;
    } catch (e) {
        console.warn('Error checking ID upload status:', e);
        // Return true to not block the flow if check fails
        return true;
    }
}

/**
 * Check if user has provided consent
 * @param {string} personId - User's person ID
 * @returns {Promise<boolean>} True if consent has been given
 */
async function checkConsentStatus(personId) {
    try {
        // Check local storage first
        const localConsent = local.getItem(`consent_${personId}`);
        if (localConsent === 'true') {
            return true;
        }

        // Check backend for consent status
        const consentResult = await getUserConsentStatus(personId);
        if (consentResult && consentResult.hasConsent) {
            local.setItem(`consent_${personId}`, 'true');
            return true;
        }

        return false;
    } catch (e) {
        console.warn('Error checking consent status:', e);
        // Return false to ensure consent is captured
        return false;
    }
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
    const status = currentSession.paperworkStatus || "Pending";

    // Allow re-signing if status is 'Incomplete' or if user manually clicks retry
    // But warn if it looks like it's already done
    if (status === "Packet Sent" || status === "Signed") {
        console.warn("Portal: Paperwork status is", status);
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
        if (consentResult?.success) {
            local.setItem(`consent_${currentSession.personId}`, 'true');
            currentSession.hasConsented = true;
        } else {
            return;
        }
    }

    // 3. Missing Info Check (Email/Phone)
    // Critical for "Sign via Email" or "Sign via SMS"
    // We check this even for Kiosk to ensure we have contact info on file
    if (!currentSession.email || !currentSession.phone || currentSession.email.includes('shamrock.local')) {
        console.log("START FLOW: Contact Info Missing -> Opening Update Lightbox");
        try {
            // Attempt to open update lightbox. 
            // If it doesn't exist, this will throw or return null, so we must handle gracefully.
            const updateResult = await wixWindow.openLightbox('ContactInfoUpdate', {
                personId: currentSession.personId,
                currentEmail: currentSession.email,
                currentPhone: currentSession.phone
            });

            if (updateResult && updateResult.success) {
                // Update local session data with new info
                currentSession.email = updateResult.email || currentSession.email;
                currentSession.phone = updateResult.phone || currentSession.phone;
                console.log("START FLOW: Contact info updated.");
            } else {
                console.warn("START FLOW: Contact update cancelled or failed. Proceeding with caution.");
                // We proceed, but the backend might fail if it strictly needs email
            }
        } catch (e) {
            console.log("Note: ContactInfoUpdate lightbox not found or error. Proceeding.", e);
        }
    }

    // 4. Signing
    console.log("START FLOW: Ready for Signing");
    await proceedToSignNow();
}

// ... existing code ...

async function proceedToSignNow() {
    if (!currentSession) return;

    const caseId = currentSession.caseId || "Active_Case_Fallback";

    // Determine method based on available info or user choice (default to kiosk/embedded for portal)
    // However, if the user clicked "Sign via Email" (caller should flag this), we would use that.
    // For now, this function assumes Kiosk/Embedded flow as it opens the signing frame.

    const userEmail = currentSession.email || `defendant_${currentSession.personId}@shamrock.local`;

    // Generate Link using consolidated method
    // We use 'kiosk' method here to get an embedded link for the lightbox

    try {
        const result = await initiateSigningWorkflow({
            caseId: caseId,
            method: 'kiosk',
            defendantInfo: {
                email: userEmail,
                phone: currentSession.phone
            },
            indemnitorInfo: [],
            documentIds: [] // Empty = use default template
        });

        if (result.success && result.links && result.links.length > 0) {
            LightboxController.show('signing', {
                signingUrl: result.links[0], // Kiosk method returns array of links
                documentId: result.documentId
            });
        } else {
            throw new Error(result.error || "No link returned");
        }
    } catch (e) {
        console.error('Failed to create SignNow link:', e);
        try {
            if ($w('#textSigningStatus').type) {
                $w('#textSigningStatus').text = "Error preparing documents.";
            }
        } catch (err) { }
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
        console.log('Preparing your paperwork for download...');

        if (!currentSession) {
            console.warn('Session error. Please log in again.');
            return;
        }

        const caseId = currentSession.caseId || "Active_Case_Fallback";

        // TODO: Implement PDF generation and download
        // For now, show a placeholder message
        console.log('Download feature coming soon! Please use "Sign via Email" or "Sign Via Kiosk" for now.');
        // Consider opening a lightbox or showing a text message on screen instead of alert
        $w('#textUserWelcome').text = "Download feature coming soon!";
        $w('#textUserWelcome').show();

        // Future implementation:
        // 1. Call backend to generate PDF packet
        // 2. Get download URL
        // 3. Trigger download
        // const pdfUrl = await generatePDFPacket(caseId, userEmail);
        // wixLocation.to(pdfUrl);

    } catch (error) {
        console.error('Error handling download paperwork:', error);
        $w('#textUserWelcome').text = "Error preparing download.";
        $w('#textUserWelcome').show();
    }
}
