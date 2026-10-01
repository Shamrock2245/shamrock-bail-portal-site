/**
 * Page: portal-indemnitor.k53on.js
 * Function: Indemnitor After-Care Dashboard (Cosigner Lifecycle)
 * 
 * Capabilities:
 * 1. Contingent Liabilities & Bond Status (Active liability sum, release status)
 * 2. Payment Plan Manager (Installment schedule, balance, 1-tap SwipeSimple pay)
 * 3. Case Documents (Download signed Indemnity Agreement, Receipts, Receipts)
 * 4. "Add Co-Indemnitor" (Invite second cosigner via SMS magic link to the paperwork launchpad)
 * 5. "Upload Extra ID / Collateral" (Upload vehicle title, deed, collateral docs)
 * 6. Persistent "Continue Paperwork" Banner: Displayed ONLY if packet is incomplete.
 * 
 * Note: Initial ID scanning & intake occurs on the paperwork launchpad.
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
import { buildPaperworkLaunchpadUrl, BOND_PAYMENT_LINK } from 'public/portal-config';
import { submitWizardToLeads } from 'backend/leadsIntake';

let currentSession = null;
let indemnitorData = null;
const OFFICE_TEL = 'tel:+12393322245';

// Live Editor elements carry static demo text ("John Smith", "$50,000", 12/28/2025...).
// Clear it on load so a failed lookup never shows a fake case (audit 2026-09-27).
const DEMO_TEXT_IDS = ['#defendantNameText', '#defendantStatusText', '#lastCheckInText', '#nextCourtDateText',
    '#balanceDueText', '#ppRemainingBalanceText', '#ppPaymentTermsText', '#ppNextDueDateText',
    '#textTotalPremium', '#textDownPayment', '#textChargesCount', '#textTotalLiability'];

$w.onReady(async function () {
    // SEO: Prevent Indexing (Protected Member Area)
    wixSeo.setMetaTags([{ "name": "robots", "content": "noindex, nofollow" }]);
    console.log("🛡️ [Indemnitor Dashboard] Loading After-Care Portal...");

    LightboxController.init($w);
    setupWizardBridge('#indemnitorWizard', 'indemnitor-submit-phase1', 'indemnitor', (msg) => msg.wizardData || msg.formData);
    safeSetText(DEMO_TEXT_IDS, '—');
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
    safeSetText(['#textUserWelcome', '#welcomeText'], `Welcome, ${name}`);
    safeSetText(['#textDefendantName', '#defendantNameText'], data.defendantName || "Person you are helping");
    safeSetText('#textCaseNumber', data.caseNumber || "Case Pending");

    // Liabilities & Bond Amounts
    const bondAmount = Number(data.bondAmount || data.totalBond || 0);
    safeSetText('#textTotalLiability', `$${bondAmount.toLocaleString()}`);
    safeSetText(['#textDefendantStatus', '#defendantStatusText'], data.defendantStatus || 'Status pending');

    // Payment Plan
    const balance = Number(data.balanceDue || 0);
    const monthlyPayment = Number(data.monthlyPayment || data.installmentAmount || 0);
    const nextDue = data.nextPaymentDue ? new Date(data.nextPaymentDue).toLocaleDateString() : '—';

    safeSetText(['#textBalanceDue', '#balanceDueText', '#ppRemainingBalanceText'], `$${balance.toLocaleString()}`);
    safeSetText(['#textMonthlyPayment', '#ppPaymentTermsText'], monthlyPayment > 0 ? `$${monthlyPayment.toLocaleString()}/mo` : '—');
    safeSetText(['#textNextDueDate', '#ppNextDueDateText'], `Due: ${nextDue}`);
    if (data.lastCheckIn) safeSetText(['#lastCheckInText'], new Date(data.lastCheckIn).toLocaleDateString());
    if (data.nextCourtDate) safeSetText(['#nextCourtDateText'], new Date(data.nextCourtDate).toLocaleDateString());
    if (data.totalPremium != null) safeSetText(['#textTotalPremium'], `$${Number(data.totalPremium).toLocaleString()}`);
    if (data.downPayment != null) safeSetText(['#textDownPayment'], `$${Number(data.downPayment).toLocaleString()}`);
    if (Array.isArray(data.charges)) safeSetText(['#textChargesCount'], String(data.charges.length));

    if (balance <= 0) {
        safeHide(['#btnPayInstallment', '#makePaymentBtn']);
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
        safeSetText('#textPaperworkBanner', 'Almost done — tap Continue to finish cosigner paperwork.');
        
        try {
            const cont = $w('#btnContinuePaperwork');
            if (cont) { try { cont.label = 'Continue paperwork'; } catch (e) {} }
        } catch (e) {}
        safeOnClick(['#btnContinuePaperwork', '#btnResumeBond'], () => {
            const caseId = data?.caseNumber || currentSession?.caseId || '';
            wixLocation.to(buildPaperworkLaunchpadUrl({
                caseId,
                role: 'indemnitor',
                source: 'wix-indemnitor'
            }));
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
        wixLocation.to(buildPaperworkLaunchpadUrl({
            caseId,
            role: 'coindemnitor',
            mode: 'add-cosigner',
            source: 'wix-indemnitor'
        }));
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
    safeOnClick(['#btnPayInstallment', '#makePaymentBtn'], () => {
        // PrivacyLightbox is the privacy-policy lightbox, not a payment screen, and /payment 404s (audit 2026-09-27).
        // Open the case payment link when the backend provides one; otherwise call the office.
        // Case-specific SwipeSimple invoice link first, else the general SwipeSimple payment page.
        wixLocation.to(indemnitorData?.paymentUrl || BOND_PAYMENT_LINK);
    });

    // Call the office
    safeOnClick(['#callBtn'], () => wixLocation.to(OFFICE_TEL));

    // Start a new bond (indemnitor paperwork launchpad)
    safeOnClick(['#btnStartNewBond'], () => {
        wixLocation.to(buildPaperworkLaunchpadUrl({ role: 'indemnitor', source: 'wix-indemnitor' }));
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
    safeOnClick(['#btnLogout', '#indemnitorLogoutBtn'], () => {
        clearSessionToken();
        wixLocation.to('/portal-landing');
    });
}

// UI Utilities (accept one selector or an array of candidate selectors)
function forEachEl(ids, fn) {
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) {
        try {
            const el = $w(id);
            if (el) fn(el);
        } catch (e) {}
    }
}

function safeSetText(ids, text) {
    forEachEl(ids, (el) => { if ('text' in el) el.text = text; });
}

function safeShow(ids) {
    forEachEl(ids, (el) => { if (typeof el.show === 'function') el.show(); });
}

function safeHide(ids) {
    forEachEl(ids, (el) => { if (typeof el.hide === 'function') el.hide(); });
}

function safeOnClick(ids, handler) {
    forEachEl(ids, (el) => { if (typeof el.onClick === 'function') el.onClick(handler); });
}

/**
 * Wizard submit bridge (2026-09-27).
 * The embed posts its data here; page code calls backend/leadsIntake.jsw, which
 * posts server-side to the CRM (/api/webhooks/wix-intake, secret from Wix
 * Secrets Manager). MongoDB intake_queue is the source of truth; the CRM then
 * copies to Google Sheets + Slack itself. The embed shows success ONLY when the
 * CRM answered success:true (ack.ok), and gets the pay-by-card link back.
 */
function setupWizardBridge(elementId, messageType, formType, getPayload) {
    let el;
    try { el = $w(elementId); } catch (e) { return; }
    if (!el || typeof el.onMessage !== 'function') return;
    el.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || msg.type !== messageType) return;
        let ack = { type: 'shamrock-submit-ack', ok: false, error: '' };
        try {
            const result = await submitWizardToLeads(getPayload(msg), formType, {
                clientNonce: msg.clientNonce || '',
                pageUrl: (typeof wixLocation !== 'undefined' && wixLocation.url) || ''
            });
            if (result && result.success === true) {
                ack = { type: 'shamrock-submit-ack', ok: true, intakeId: result.intakeId || '', paymentLink: result.paymentLink || '' };
            } else {
                ack.error = (result && result.error) || 'Submission was not accepted';
            }
        } catch (err) {
            ack.error = 'We could not submit your application. Please call (239) 332-2245.';
        }
        try { el.postMessage(ack); } catch (e) { }
    });
}
