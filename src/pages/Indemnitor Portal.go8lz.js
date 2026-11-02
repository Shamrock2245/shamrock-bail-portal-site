/**
 * Page: portal-indemnitor.k53on.js
 * Function: Indemnitor After-Care Dashboard (Cosigner Lifecycle)
 *
 * Capabilities:
 * 1. Bond the cosigner is responsible for & defendant status (only what is on file)
 * 2. Payment Plan Manager (balance, schedule, 1-tap SwipeSimple pay)
 * 3. Case Documents (list of documents on file for the signed-in user)
 * 4. "Add Co-Indemnitor" (second cosigner via the paperwork launchpad)
 * 5. "Upload Extra ID / Collateral"
 * 6. Persistent "Continue Paperwork" Banner: Displayed ONLY if packet is incomplete.
 *
 * Dashboard embed (2026-10-27): if the page has an HTML embed pointing at
 * https://shamrock-embeds.netlify.app/indemnitor-dashboard.html, page code sends it display-only
 * fields and handles the allowlisted actions it emits. The session token never leaves page code.
 * Studio's element id is #IndemnitorDashEmbed (capital I). #indemnitorDashEmbed is the fallback.
 * Legacy $w elements are optional: a missing id is skipped, so the page runs before they are built.
 *
 * @version 3.1.0
 * @updated 2026-10-27
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { validateCustomSession, getIndemnitorDetails, invalidateSession } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { getSessionToken, clearSessionToken } from 'public/session-manager';
import { buildPaperworkLaunchpadUrl, BOND_PAYMENT_LINK } from 'public/portal-config';
import { submitWizardToLeads } from 'backend/leadsIntake';

const ROLE = 'indemnitor';
const ALLOWED_ROLES = ['indemnitor', 'coindemnitor'];
const NOT_ON_FILE = 'Not on file — call the office';
const OFFICE_TEL = 'tel:+12393322245';
const OFFICE_SMS = 'sms:+12399550178';
const SPANISH_TEL = 'tel:+17272952245';
// Studio Layers panel uses a capital I. Try that first, then the lowercase id.
const DASH_EMBED_IDS = ['#IndemnitorDashEmbed', '#indemnitorDashEmbed'];
const DASH_ACTIONS = ['login', 'continue-paperwork', 'pay', 'view-documents', 'upload-collateral', 'add-cosigner', 'start-new-bond', 'call', 'text', 'call-spanish', 'logout', 'retry'];

let currentSession = null;
let indemnitorData = null;
let sessionToken = '';
let dashEmbed = null;
let dashState = { state: 'loading', data: null };

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
    setupDashEmbed();
    setupActionHandlers();
    await loadDashboard();
});

async function loadDashboard() {
    setDashState('loading', null);
    try {
        const query = wixLocation.query || {};
        sessionToken = query.st || getSessionToken() || '';
        // Do not leave the session token in the address bar / history / referrers.
        if (query.st) stripTokenFromUrl();

        if (!sessionToken) {
            console.warn("No active session token. Redirecting to login.");
            setDashState('signed-out', null);
            wixLocation.to('/portal-landing');
            return;
        }

        // Validate Session + role
        const validation = await validateCustomSession(sessionToken);
        if (validation && validation.reason === 'error') {
            setDashState('error', null);
            return;
        }
        const role = String(validation?.role || '').toLowerCase();
        if (!validation || !validation.valid || !ALLOWED_ROLES.includes(role)) {
            console.warn("Invalid or non-indemnitor session:", validation && validation.reason);
            setDashState('signed-out', null);
            wixLocation.to('/portal-landing');
            return;
        }

        currentSession = validation;

        // Fetch Indemnitor Record (server derives identity from the session)
        indemnitorData = await getIndemnitorDetails(sessionToken);
        if (!indemnitorData) {
            setDashState('error', null);
            return;
        }
        populateDashboardUI(indemnitorData);
        evaluatePaperworkCompletion(indemnitorData);
        setDashState('ready', toDashData(indemnitorData));

    } catch (err) {
        console.error("Critical error during indemnitor dashboard load:", err);
        setDashState('error', null);
    }
}

function stripTokenFromUrl() {
    try {
        if (wixLocation.queryParams && typeof wixLocation.queryParams.remove === 'function') {
            wixLocation.queryParams.remove(['st']);
        }
    } catch (e) { }
}

function isPaperworkComplete(data) {
    const pwStatus = (data?.paperworkStatus || 'incomplete').toLowerCase();
    return pwStatus === 'complete' || pwStatus === 'signed' || pwStatus === 'active';
}

function fullName(data) {
    return [data?.firstName, data?.lastName].filter(Boolean).join(' ').trim();
}

function num(n) {
    if (typeof n === 'number' && isFinite(n)) return n;
    if (typeof n === 'string') {
        const cleaned = n.replace(/[^0-9.-]/g, '');
        if (!cleaned || cleaned === '-' || cleaned === '.') return null;
        const parsed = Number(cleaned);
        return isFinite(parsed) ? parsed : null;
    }
    return null;
}

function money(n) {
    const value = num(n);
    return value === null ? '' : '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function displayDate(value) {
    if (!value) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    if (!m) opts.timeZone = 'America/New_York';
    return d.toLocaleDateString('en-US', opts);
}

/**
 * Populates the legacy after-care widgets. Missing values say so; nothing is invented.
 */
function populateDashboardUI(data) {
    if (!data) return;

    const name = fullName(data);
    safeSetText(['#textUserWelcome', '#welcomeText'], name ? `Welcome, ${name}` : 'Welcome');
    safeSetText(['#textDefendantName', '#defendantNameText'], data.defendantName || NOT_ON_FILE);
    safeSetText('#textCaseNumber', data.caseNumber || NOT_ON_FILE);

    // Liabilities & Bond Amounts
    safeSetText('#textTotalLiability', money(data.bondAmount) || NOT_ON_FILE);
    safeSetText(['#textDefendantStatus', '#defendantStatusText'], data.defendantStatus || NOT_ON_FILE);

    // Payment Plan (shown as recorded; no "Paid in Full" assumption)
    const nextDue = displayDate(data.nextPaymentDue);
    safeSetText(['#textBalanceDue', '#balanceDueText', '#ppRemainingBalanceText'], money(data.balanceDue) || NOT_ON_FILE);
    safeSetText(['#textMonthlyPayment', '#ppPaymentTermsText'], num(data.monthlyPayment) !== null ? `${money(data.monthlyPayment)}/mo` : NOT_ON_FILE);
    safeSetText(['#textNextDueDate', '#ppNextDueDateText'], nextDue ? `Due: ${nextDue}` : NOT_ON_FILE);
    safeSetText(['#lastCheckInText'], displayDate(data.lastCheckIn) || NOT_ON_FILE);
    safeSetText(['#nextCourtDateText'], displayDate(data.nextCourtDate) || NOT_ON_FILE);
    safeSetText(['#textTotalPremium'], num(data.totalPremium) !== null
        ? money(data.totalPremium) + (data.premiumEstimated ? ' (est. at 10%)' : '')
        : NOT_ON_FILE);
    safeSetText(['#textDownPayment'], money(data.downPayment) || NOT_ON_FILE);
    safeSetText(['#textChargesCount'], num(data.chargesCount) !== null ? String(data.chargesCount) : NOT_ON_FILE);
    safeSetText('#textPaymentStatus', '');
}

/** Display-only fields for the embed. Never includes the token, email, phone or ids. */
function toDashData(data) {
    return {
        name: fullName(data) || null,
        defendantName: data.defendantName || null,
        caseNumber: data.caseNumber || null,
        defendantStatus: data.defendantStatus || null,
        bondAmount: num(data.bondAmount),
        chargesCount: num(data.chargesCount),
        nextCourtDate: data.nextCourtDate || null,
        lastCheckIn: data.lastCheckIn || null,
        totalPremium: num(data.totalPremium),
        premiumEstimated: data.premiumEstimated === true,
        downPayment: num(data.downPayment),
        balanceDue: num(data.balanceDue),
        monthlyPayment: num(data.monthlyPayment),
        nextPaymentDue: data.nextPaymentDue || null,
        paperworkComplete: isPaperworkComplete(data)
    };
}

/**
 * Evaluates paperwork status and toggles the "Continue Paperwork" banner
 */
function evaluatePaperworkCompletion(data) {
    if (isPaperworkComplete(data)) {
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
    }
}

// ---------------------------------------------------------------------------
// Actions (shared by the legacy buttons and the dashboard embed)
// ---------------------------------------------------------------------------
const ACTIONS = {
    'continue-paperwork': () => {
        const caseId = indemnitorData?.caseNumber || currentSession?.caseId || '';
        wixLocation.to(buildPaperworkLaunchpadUrl({ caseId, role: 'indemnitor', source: 'wix-indemnitor' }));
    },
    'pay': () => {
        // Case-specific SwipeSimple invoice link first, else the general SwipeSimple payment page.
        wixLocation.to(indemnitorData?.paymentUrl || BOND_PAYMENT_LINK);
    },
    'view-documents': () => showDocuments(),
    'upload-collateral': () => {
        wixWindow.openLightbox('IdUploadLightbox', {
            role: 'indemnitor',
            caseId: indemnitorData?.caseNumber,
            documentType: 'collateral',
            memberData: indemnitorData
        });
    },
    'add-cosigner': () => {
        const caseId = indemnitorData?.caseNumber || '';
        wixLocation.to(buildPaperworkLaunchpadUrl({ caseId, role: 'coindemnitor', mode: 'add-cosigner', source: 'wix-indemnitor' }));
    },
    'start-new-bond': () => {
        wixLocation.to(buildPaperworkLaunchpadUrl({ role: 'indemnitor', source: 'wix-indemnitor' }));
    },
    'call': () => wixLocation.to(OFFICE_TEL),
    'text': () => wixLocation.to(OFFICE_SMS),
    'call-spanish': () => wixLocation.to(SPANISH_TEL),
    'login': () => wixLocation.to('/portal-landing'),
    'logout': () => logout(),
    'retry': () => loadDashboard()
};

function setupActionHandlers() {
    safeOnClick('#btnAddCoIndemnitor', ACTIONS['add-cosigner']);
    safeOnClick('#btnUploadCollateral', ACTIONS['upload-collateral']);
    safeOnClick(['#btnPayInstallment', '#makePaymentBtn'], ACTIONS['pay']);
    safeOnClick(['#callBtn'], ACTIONS['call']);
    safeOnClick(['#btnStartNewBond'], ACTIONS['start-new-bond']);
    safeOnClick('#btnViewDocuments', ACTIONS['view-documents']);
    safeOnClick(['#btnContinuePaperwork', '#btnResumeBond'], ACTIONS['continue-paperwork']);
    safeOnClick(['#btnLogout', '#indemnitorLogoutBtn'], ACTIONS['logout']);
}

/** Documents on file for the signed-in user (server decides whose, from the session). */
async function showDocuments() {
    postDash({ type: 'shamrock-dash-docs', state: 'loading' });
    let res = null;
    try { res = await getMemberDocuments(sessionToken); } catch (e) { res = null; }
    if (!res || !res.success) {
        postDash({ type: 'shamrock-dash-docs', state: 'error' });
        safeSetText('#textDocumentsList', 'We could not load your documents. Call the office and we will help.');
        return;
    }
    const documents = (res.documents || []).map(d => ({ label: d.label, status: d.status, uploadedAt: d.uploadedAt }));
    postDash({ type: 'shamrock-dash-docs', state: 'ready', documents });
    safeSetText('#textDocumentsList', documents.length
        ? documents.map(d => `• ${d.label}${d.status ? ' — ' + d.status : ''}`).join('\n')
        : 'No documents on file yet.');
    safeShow('#textDocumentsList');
}

async function logout() {
    const token = sessionToken || getSessionToken();
    try { if (token) await invalidateSession(token); } catch (e) { }
    sessionToken = '';
    clearSessionToken();
    setDashState('signed-out', null);
    wixLocation.to('/portal-landing');
}

// ---------------------------------------------------------------------------
// Dashboard embed bridge. No-op when neither casing is on the page.
// ---------------------------------------------------------------------------
function setupDashEmbed() {
    let el = null;
    for (const id of DASH_EMBED_IDS) {
        try {
            const candidate = $w(id);
            if (candidate && typeof candidate.onMessage === 'function' && typeof candidate.postMessage === 'function') {
                el = candidate;
                break;
            }
        } catch (e) { /* this casing is not on the page */ }
    }
    if (!el) return;
    dashEmbed = el;
    dashEmbed.onMessage((event) => {
        const msg = event && event.data;
        if (!msg || typeof msg !== 'object' || msg.role !== ROLE) return;
        if (msg.type === 'shamrock-dash-ready') {
            postDashState();
            return;
        }
        if (msg.type === 'shamrock-dash-action' && DASH_ACTIONS.includes(msg.action)) {
            const fn = ACTIONS[msg.action];
            if (typeof fn === 'function') fn();
        }
    });
}

function setDashState(state, data) {
    dashState = { state, data };
    postDashState();
}

function postDashState() {
    if (dashState.state === 'signed-out') {
        // The block shows its "Sign in to see your case" state on this message.
        postDash({ type: 'signed-out' });
        return;
    }
    postDash({ type: 'shamrock-dash-state', state: dashState.state, data: dashState.data });
}

function postDash(msg) {
    if (!dashEmbed) return;
    try { dashEmbed.postMessage(Object.assign({ role: ROLE }, msg)); } catch (e) { }
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
