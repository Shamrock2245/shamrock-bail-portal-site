/**
 * Page: portal-indemnitor.k53on.js
 * Function: Indemnitor After-Care Dashboard (Cosigner Lifecycle)
 * 
 * Capabilities:
 * 1. Contingent Liabilities & Bond Status (Active liability sum, release status)
 * 2. Payment Plan Manager (Installment schedule, balance, 1-tap SwipeSimple pay)
 * 3. Case Documents (Download signed Indemnity Agreement, Receipts, Receipts)
 * 4. "Add Co-Indemnitor" (Invite second cosigner via SMS magic link to /portal-start)
 * 5. "Upload Extra ID / Collateral" (Upload vehicle title, deed, collateral docs)
 * 6. Persistent "Continue Paperwork" Banner: Displayed ONLY if packet is incomplete.
 * 
 * Note: Initial ID scanning & intake occurs on /portal-start.
 * 
 * @version 3.0.0
 * @updated 2026-08-21
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { validateCustomSession, getIndemnitorDetails } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { getSessionToken, clearSessionToken } from 'public/session-manager';

let currentSession = null;
let indemnitorData = null;

$w.onReady(async function () {
    // SEO: Prevent Indexing (Protected Member Area)
    wixSeo.setMetaTags([{ "name": "robots", "content": "noindex, nofollow" }]);
    console.log("🛡️ [Indemnitor Dashboard] Loading After-Care Portal...");

    LightboxController.init($w);
    setupActionHandlers();

    try {
        const query = wixLocation.query;
        const sessionToken = query.st || getSessionToken();

        if (!sessionToken) {
            console.warn("No active session token. Redirecting to login.");
            wixLocation.to('/portal-landing');
            return;
        }

        // Validate Session
        const validation = await validateCustomSession(sessionToken);
        if (!validation || !validation.valid) {
            console.warn("Invalid session:", validation);
            wixLocation.to('/portal-landing');
            return;
        }

        currentSession = validation;

        // Fetch Indemnitor Record
        indemnitorData = await getIndemnitorDetails(sessionToken);
        populateDashboardUI(indemnitorData);
        evaluatePaperworkCompletion(indemnitorData);

    } catch (err) {
        console.error("Critical error during indemnitor dashboard load:", err);
    }
});

/**
 * Populates all after-care widgets with real case data
 */
function populateDashboardUI(data) {
    if (!data) return;

    const name = data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : "Cosigner";
    safeSetText('#textUserWelcome', `Welcome, ${name}`);
    safeSetText('#textDefendantName', data.defendantName || "Defendant in Custody");
    safeSetText('#textCaseNumber', data.caseNumber || "Case Pending");

    // Liabilities & Bond Amounts
    const bondAmount = Number(data.bondAmount || data.totalBond || 0);
    safeSetText('#textTotalLiability', `$${bondAmount.toLocaleString()}`);
    safeSetText('#textDefendantStatus', data.defendantStatus || "Released on Bond ✅");

    // Payment Plan
    const balance = Number(data.balanceDue || 0);
    const monthlyPayment = Number(data.monthlyPayment || data.installmentAmount || 150);
    const nextDue = data.nextPaymentDue ? new Date(data.nextPaymentDue).toLocaleDateString() : '1st of Next Month';

    safeSetText('#textBalanceDue', `$${balance.toLocaleString()}`);
    safeSetText('#textMonthlyPayment', `$${monthlyPayment.toLocaleString()}/mo`);
    safeSetText('#textNextDueDate', `Due: ${nextDue}`);

    if (balance <= 0) {
        safeHide('#btnPayInstallment');
        safeSetText('#textPaymentStatus', 'Paid in Full ✅');
    }
}

/**
 * Evaluates paperwork status and toggles the "Continue Paperwork" banner
 */
function evaluatePaperworkCompletion(data) {
    const pwStatus = (data?.paperworkStatus || 'incomplete').toLowerCase();
    const isComplete = pwStatus === 'complete' || pwStatus === 'signed' || pwStatus === 'active';

    if (isComplete) {
        // Hide intake wizard chrome entirely
        safeHide('#bannerIncompletePaperwork');
        safeHide('#boxIntakeWizardFallback');
        safeShow('#boxAfterCareModules');
    } else {
        // Show persistent "Continue Paperwork" banner
        safeShow('#bannerIncompletePaperwork');
        safeSetText('#textPaperworkBanner', '⚠️ Your cosigner paperwork is incomplete. Complete signature to secure release.');
        
        safeOnClick('#btnContinuePaperwork', () => {
            const caseId = data?.caseNumber || currentSession?.caseId || '';
            wixLocation.to(`/portal-start?caseId=${caseId}&role=indemnitor`);
        });
    }
}

/**
 * Configure buttons and after-care actions
 */
function setupActionHandlers() {
    // 1. Add Co-Indemnitor (Second Cosigner)
    safeOnClick('#btnAddCoIndemnitor', () => {
        const caseId = indemnitorData?.caseNumber || '';
        wixLocation.to(`/portal-start?caseId=${caseId}&role=coindemnitor&mode=add-cosigner`);
    });

    // 2. Upload Extra ID or Collateral
    safeOnClick('#btnUploadCollateral', () => {
        wixWindow.openLightbox('IdUploadLightbox', {
            role: 'indemnitor',
            caseId: indemnitorData?.caseNumber,
            documentType: 'collateral',
            memberData: indemnitorData
        });
    });

    // 3. Pay Installment / Balance
    safeOnClick('#btnPayInstallment', () => {
        const payUrl = indemnitorData?.paymentUrl || 'https://shamrockbailbonds.biz/payment';
        wixWindow.openLightbox('PrivacyLightbox', { paymentUrl: payUrl });
    });

    // 4. View / Download Documents
    safeOnClick('#btnViewDocuments', async () => {
        const docs = await getMemberDocuments({
            memberEmail: indemnitorData?.email || currentSession?.memberEmail,
            sessionToken: getSessionToken()
        });
        wixWindow.openLightbox('DefendantDetails', {
            documents: docs?.documents || [],
            caseData: indemnitorData
        });
    });

    // 5. Logout
    safeOnClick('#btnLogout', () => {
        clearSessionToken();
        wixLocation.to('/portal-landing');
    });
}

// UI Utilities
function safeSetText(id, text) {
    try {
        const el = $w(id);
        if (el) el.text = text;
    } catch (e) {}
}

function safeShow(id) {
    try {
        const el = $w(id);
        if (el) el.show();
    } catch (e) {}
}

function safeHide(id) {
    try {
        const el = $w(id);
        if (el) el.hide();
    } catch (e) {}
}

function safeOnClick(id, handler) {
    try {
        const el = $w(id);
        if (el && typeof el.onClick === 'function') el.onClick(handler);
    } catch (e) {}
}
