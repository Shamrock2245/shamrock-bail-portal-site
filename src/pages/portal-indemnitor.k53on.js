// Page: portal-indemnitor.k53on.js (FIXED)
// Function: Indemnitor Dashboard with Lightbox Controller Integration
//
// FIXES:
// - Replaced .length checks with proper .type checks
// - Added try-catch blocks around all element manipulations
// - Prevents "onClick is not a function" errors

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { getUserProfile, getIndemnitorDetails } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';

$w.onReady(async function () {
    LightboxController.init($w);

    try {
        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = "Loading Dashboard...";
        }
    } catch (e) { }

    try {
        const member = await currentMember.getMember();
        if (!member) {
            console.warn("⛔ Unauthorized Access. Redirecting to Portal Landing.");
            wixLocation.to('/portal');
            return;
        }

        // Setup Actions
        setupPaperworkButtons(member);

        try {
            if ($w('#contactBtn').type) {
                $w('#contactBtn').onClick(() => wixLocation.to("/contact"));
            }
        } catch (e) {
            console.error('Error setting up contact button:', e);
        }

        // Load Dashboard Data
        await loadDashboardData(member);

    } catch (error) {
        console.error("Dashboard Error", error);
        try {
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Welcome";
            }
        } catch (e) { }
    }
});

async function loadDashboardData(member) {
    try {
        const data = await getIndemnitorDetails(member._id);
        const name = (member.contactDetails?.firstName) || "Indemnitor";

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

function setupPaperworkButtons(member) {
    // Primary Button
    try {
        if ($w('#startFinancialPaperworkBtn').type) {
            $w('#startFinancialPaperworkBtn').onClick(() => handlePaperworkStart(member));
        }
    } catch (e) {
        console.error('Error setting up startFinancialPaperworkBtn:', e);
    }

    // Alias Button
    try {
        if ($w('#startPaperworkBtn').type) {
            $w('#startPaperworkBtn').onClick(() => handlePaperworkStart(member));
        }
    } catch (e) {
        console.error('Error setting up startPaperworkBtn:', e);
    }
}

/**
 * Main Paperwork Orchestration Flow
 */
async function handlePaperworkStart(member) {
    // 1. ID Upload Check
    const hasUploadedId = await checkIdUploadStatus(member.loginEmail);
    if (!hasUploadedId) {
        const idResult = await LightboxController.show('idUpload', {
            memberData: { email: member.loginEmail, name: member.contactDetails?.firstName }
        });
        if (!idResult?.success) return;
    }

    // 2. Consent Check
    const hasConsented = await checkConsentStatus(member._id);
    if (!hasConsented) {
        const consentResult = await LightboxController.show('consent');
        if (!consentResult) {
            const recheck = await checkConsentStatus(member._id);
            if (!recheck) return;
        }
    }

    // 3. Signing
    await proceedToSignNow(member);
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

    // Role: Indemnitor
    const result = await createEmbeddedLink(caseId, member.loginEmail, 'indemnitor');

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
