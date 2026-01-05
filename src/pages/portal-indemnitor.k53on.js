// Page: portal-indemnitor.k53on.js
// Function: Indemnitor Dashboard with Lightbox Controller Integration

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { getUserProfile, getIndemnitorDetails } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink } from 'backend/signnow-integration';

$w.onReady(async function () {
    LightboxController.init($w);

    $w('#welcomeText').text = "Loading Dashboard...";

    try {
        const member = await currentMember.getMember();
        if (!member) {
            console.warn("⛔ Unauthorized Access. Redirecting to Portal Landing.");
            wixLocation.to('/portal');
            return;
        }

        // Setup Actions
        setupPaperworkButtons(member);
        $w('#contactBtn').onClick(() => wixLocation.to("/contact"));

        // Load Dashboard Data
        await loadDashboardData(member);

    } catch (error) {
        console.error("Dashboard Error", error);
        $w('#welcomeText').text = "Welcome";
    }
});

async function loadDashboardData(member) {
    const data = await getIndemnitorDetails(member._id);
    const name = (member.contactDetails?.firstName) || "Indemnitor";
    $w('#welcomeText').text = `Welcome, ${name}`;

    if (data) {
        $w('#liabilityText').text = data.totalLiability || "$0.00";
        $w('#totalPremiumText').text = data.totalPremium || "$0.00";
        $w('#downPaymentText').text = data.downPayment || "$0.00";
        $w('#balanceDueText').text = data.balanceDue || "$0.00";
        $w('#chargesCountText').text = data.chargesCount || "0";

        $w('#defendantNameText').text = data.defendantName || "N/A";
        $w('#defendantStatusText').text = data.defendantStatus || "Unknown";
        $w('#lastCheckInText').text = data.lastCheckIn || "Never";
        $w('#nextCourtDateText').text = data.nextCourtDate || "TBD";
    }
}

function setupPaperworkButtons(member) {
    const btn = $w('#startFinancialPaperworkBtn');
    if (btn.length > 0) {
        btn.onClick(() => handlePaperworkStart(member));
    }

    const btnAlias = $w('#startPaperworkBtn');
    if (btnAlias.length > 0) {
        btnAlias.onClick(() => handlePaperworkStart(member));
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
        const warning = $w('#statusMessage'); // If exists
        if (warning.length > 0) {
            warning.text = "Error preparing documents.";
            warning.expand();
        }
    }
}
