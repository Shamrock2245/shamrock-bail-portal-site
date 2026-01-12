// Page: portal-indemnitor.k53on.js (CUSTOM AUTH VERSION)
// Function: Indemnitor Dashboard with Lightbox Controller Integration
// Last Updated: 2026-01-08
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser storage (wix-storage-frontend) session tokens validated against PortalSessions collection

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { validateCustomSession, getIndemnitorDetails } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';
import { getSessionToken, clearSessionToken } from 'public/session-manager';

let currentSession = null; // Store validated session data

$w.onReady(async function () {
    LightboxController.init($w);

    try {
        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = "Loading Dashboard...";
        }
    } catch (e) { }

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

        // Check role authorization (indemnitor or coindemnitor)
        if (session.role !== 'indemnitor' && session.role !== 'coindemnitor') {
            console.warn(`⛔ Wrong role: ${session.role}. This is the indemnitor portal.`);
            wixLocation.to('/portal-landing');
            return;
        }

        console.log("✅ Indemnitor authenticated:", session.personId);
        currentSession = session;

        // Setup Actions
        setupPaperworkButtons();
        setupLogoutButton();

        try {
            if ($w('#contactBtn').type) {
                $w('#contactBtn').onClick(() => wixLocation.to("/contact"));
            }
        } catch (e) {
            console.error('Error setting up contact button:', e);
        }

        // Load Dashboard Data
        await loadDashboardData();

    } catch (error) {
        console.error("Dashboard Error", error);
        try {
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Error loading dashboard";
            }
        } catch (e) { }
    }
});

async function loadDashboardData() {
    if (!currentSession) {
        console.error('No session available');
        return;
    }

    try {
        const data = await getIndemnitorDetails(currentSession.token);
        const name = "Indemnitor"; // TODO: Get from user profile
        currentSession.email = data?.email || ""; // Store retrieved email

        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = `Welcome, ${name}`;
        }

        if (data) {
            try {
                if ($w('#liabilityText').type) {
                    $w('#liabilityText').text = data.totalLiability || "$0.00";
                }
                if ($w('#totalPremiumText').type) {
                    $w('#totalPremiumText').text = data.totalPremium || "$0.00";
                }
                if ($w('#downPaymentText').type) {
                    $w('#downPaymentText').text = data.downPayment || "$0.00";
                }
                if ($w('#balanceDueText').type) {
                    $w('#balanceDueText').text = data.balanceDue || "$0.00";
                }
                if ($w('#chargesCountText').type) {
                    $w('#chargesCountText').text = data.chargesCount || "0";
                }
                if ($w('#defendantNameText').type) {
                    $w('#defendantNameText').text = data.defendantName || "N/A";
                }
                if ($w('#defendantStatusText').type) {
                    $w('#defendantStatusText').text = data.defendantStatus || "Unknown";
                }
                if ($w('#lastCheckInText').type) {
                    $w('#lastCheckInText').text = data.lastCheckIn || "Never";
                }
                if ($w('#nextCourtDateText').type) {
                    $w('#nextCourtDateText').text = data.nextCourtDate || "TBD";
                }
            } catch (e) {
                console.error('Error populating dashboard fields:', e);
            }
        }
    } catch (e) {
        console.error('Error loading dashboard data:', e);
    }
}

function setupPaperworkButtons() {
    // Primary Button
    try {
        if ($w('#startFinancialPaperworkBtn').type) {
            $w('#startFinancialPaperworkBtn').onClick(() => handlePaperworkStart());
        }
    } catch (e) {
        console.error('Error setting up startFinancialPaperworkBtn:', e);
    }

    // Alias Button
    try {
        if ($w('#startPaperworkBtn').type) {
            $w('#startPaperworkBtn').onClick(() => handlePaperworkStart());
        }
    } catch (e) {
        console.error('Error setting up startPaperworkBtn:', e);
    }
}

function setupLogoutButton() {
    try {
        const logoutBtn = $w('#logoutBtn');
        if (logoutBtn && typeof logoutBtn.onClick === 'function') {
            console.log('Indemnitor Portal: Logout button found');
            logoutBtn.onClick(() => {
                console.log('Indemnitor Portal: Logout clicked');
                handleLogout();
            });
        } else {
            console.warn('Indemnitor Portal: Logout button (#logoutBtn) not found');
        }
    } catch (e) {
        console.warn('Indemnitor Portal: No logout button configured');
    }
}

async function handleLogout() {
    console.log('Indemnitor Portal: Logging out...');
    clearSessionToken();
    wixLocation.to('/portal-landing');
}

/**
 * Main Paperwork Orchestration Flow
 */
async function handlePaperworkStart() {
    if (!currentSession) {
        console.error('No session available');
        return;
    }

    // Use REAL email or fallback
    const userEmail = currentSession.email || `indemnitor_${currentSession.personId}@shamrock.local`;

    // 1. ID Upload Check
    const hasUploadedId = await checkIdUploadStatus(userEmail);
    if (!hasUploadedId) {
        const idResult = await LightboxController.show('idUpload', {
            memberData: { email: userEmail, name: "Indemnitor" }
        });
        if (!idResult?.success) return;
    }

    // 2. Consent Check
    const hasConsented = await checkConsentStatus(currentSession.personId);
    if (!hasConsented) {
        const consentResult = await LightboxController.show('consent');
        if (!consentResult) {
            const recheck = await checkConsentStatus(currentSession.personId);
            if (!recheck) return;
        }
    }

    // 3. Signing
    await proceedToSignNow();
}

// --- Helpers ---

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
    // Use REAL email or fallback
    const userEmail = currentSession.email || `indemnitor_${currentSession.personId}@shamrock.local`;

    // Role: Indemnitor
    const result = await createEmbeddedLink(caseId, userEmail, 'indemnitor');

    if (result.success) {
        LightboxController.show('signing', {
            signingUrl: result.embeddedLink,
            documentId: result.documentId
        });
    } else {
        console.error('Failed to create SignNow link:', result.error);

        try {
            if ($w('#statusMessage').type) {
                $w('#statusMessage').text = "Error preparing documents.";
                $w('#statusMessage').expand();
            }
        } catch (e) {
            console.error('Error displaying status message:', e);
        }
    }
}
