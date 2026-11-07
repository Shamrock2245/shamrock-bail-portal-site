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
 * Studio Layers id is #indemnitorDashEmbed (lowercase). Make a payment asks the
 * server for a session-backed pay link and opens it.
 * Legacy $w elements are optional: a missing id is skipped, so the page runs before they are built.
 *
 * @version 3.1.0
 * @updated 2026-10-27
 */

import wixLocation from 'wix-location';
import { validateCustomSession, getIndemnitorDetails, invalidateSession } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { getSessionToken, clearSessionToken } from 'public/session-manager';
import { buildPaperworkLaunchpadUrl, launchPaperworkWithHandoff, handoffUrlRole, COLLATERAL_DOCUMENT_TYPE } from 'public/portal-config';
import { mintPaperworkHandoff } from 'backend/portal-handoff';
import { submitWizardToLeads } from 'backend/leadsIntake';
import { createCosignerInvite } from 'backend/portal-cosigner-invite';
import { invitePresentation } from 'public/cosigner-invite-ui';
import { decidePayClick, getPaymentLinkForSession } from 'backend/portal-payment';

const ROLE = 'indemnitor';
const ALLOWED_ROLES = ['indemnitor', 'coindemnitor'];
const PREMIUM_DUE_LABEL = 'Premium due';
const CALL_NOTE = 'Please call (239) 332-2245.';
const PREPARED_NOTE = 'Your link is being prepared, please try again in a moment';
const EXPIRED_NOTE = 'Your payment link expired. Please call (239) 332-2245.';
const PAID_NOTE = 'Paid';
const NOT_ON_FILE = 'Not on file — call the office';
const OFFICE_TEL = 'tel:+12393322245';
const OFFICE_SMS = 'sms:+12399550178';
const SPANISH_TEL = 'tel:+17272952245';
// Studio Layers: lowercase embed id. The capital-I id is not on this page.
const DASH_EMBED_IDS = ['#indemnitorDashEmbed'];
const DASH_ACTIONS = ['login', 'continue-paperwork', 'pay', 'view-documents', 'upload-collateral', 'add-cosigner', 'start-new-bond', 'call', 'text', 'call-spanish', 'logout', 'retry'];

let currentSession = null;
let indemnitorData = null;
let sessionToken = '';
let dashEmbed = null;
let dashState = { state: 'loading', data: null };
let cosignerInviteUrl = '';
let inviteBusy = false;

// Live Editor elements carry static demo text ("John Smith", "$50,000", 12/28/2025...).
// Clear it on load so a failed lookup never shows a fake case (audit 2026-09-27).
const DEMO_TEXT_IDS = ['#textDefendantName', '#textDefendantStatus', '#lastCheckInText', '#nextCourtDateText',
    '#textBalanceDue', '#textTotalPremium', '#textDownPayment', '#textChargesCount', '#textTotalLiability'];

$w.onReady(async function () {
    // SEO: Prevent Indexing (Protected Member Area)
    
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
    safeSetText('#textUserWelcome', name ? `Welcome, ${name}` : 'Welcome');
    safeSetText('#textDefendantName', data.defendantName || NOT_ON_FILE);
    safeSetText('#textCaseNumber', data.caseNumber || NOT_ON_FILE);

    // Liabilities & Bond Amounts
    safeSetText('#textTotalLiability', money(data.bondAmount) || NOT_ON_FILE);
    safeSetText('#textDefendantStatus', data.defendantStatus || NOT_ON_FILE);

    // Payment Plan (shown as recorded; no "Paid in Full" assumption).
    // pp* text ids are not on the Studio page. Do not write them.
    const nextDue = displayDate(data.nextPaymentDue);
    safeSetText('#textBalanceDue', money(data.balanceDue) || NOT_ON_FILE);
    safeSetText('#textMonthlyPayment', num(data.monthlyPayment) !== null ? `${money(data.monthlyPayment)}/mo` : NOT_ON_FILE);
    safeSetText('#textNextDueDate', nextDue ? `Due: ${nextDue}` : NOT_ON_FILE);
    safeSetText(['#lastCheckInText'], displayDate(data.lastCheckIn) || NOT_ON_FILE);
    safeSetText(['#nextCourtDateText'], displayDate(data.nextCourtDate) || NOT_ON_FILE);
    // Premium due comes only from a leads amount_cents. Case data is not a premium.
    safeSetText(['#textTotalPremium'], '');
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

function readCosignerFields(msg) {
    const fromMsg = msg && typeof msg === 'object' ? msg : {};
    return {
        cosigner_name: typeof fromMsg.cosigner_name === 'string' ? fromMsg.cosigner_name : '',
        cosigner_phone: typeof fromMsg.cosigner_phone === 'string' ? fromMsg.cosigner_phone : '',
        cosigner_email: typeof fromMsg.cosigner_email === 'string' ? fromMsg.cosigner_email : ''
    };
}

function showInviteOnStudio(text) {
    safeSetText('#textDocumentsList', text);
    safeShow('#textDocumentsList');
    safeSetText('#textPaymentStatus', text);
}

/**
 * Ask the server for a co-signer invite link. This page does not send a text.
 * The URL is written to existing Studio text elements and, when present, the embed.
 */
async function inviteCosigner(msg) {
    if (inviteBusy) return;
    inviteBusy = true;
    cosignerInviteUrl = '';
    showInviteOnStudio('Creating a co-signer link…');
    postDash({ type: 'shamrock-dash-invite', state: 'working' });
    let result = null;
    try {
        result = await createCosignerInvite(sessionToken, readCosignerFields(msg));
    } catch (e) {
        result = null;
    }
    if (result && result.reason === 'not_found') {
        const caseId = indemnitorData?.caseNumber || '';
        wixLocation.to(buildPaperworkLaunchpadUrl({
            caseId: caseId,
            role: 'coindemnitor',
            mode: 'add-cosigner',
            source: 'wix-indemnitor'
        }));
        inviteBusy = false;
        return;
    }
    const view = invitePresentation(result);
    if (!view.ok) {
        showInviteOnStudio(view.message);
        postDash({ type: 'shamrock-dash-invite', state: 'error', message: view.message });
        inviteBusy = false;
        return;
    }
    cosignerInviteUrl = view.inviteUrl;
    showInviteOnStudio(view.message + ' ' + view.inviteUrl);
    postDash({ type: 'shamrock-dash-invite', state: 'ready', inviteUrl: view.inviteUrl, message: view.message });
    inviteBusy = false;
}

/**
 * Continue paperwork. Mints a one-time ht on the server. The Wix session
 * token is not a URL parameter. role and case on that URL are the session
 * claims returned with the token. If minting fails, open the launchpad
 * without ht so the paperwork app can use its PIN sign-in.
 */
async function continuePaperwork() {
    let handoff = null;
    try {
        handoff = await mintPaperworkHandoff(sessionToken);
    } catch (e) {
        handoff = null;
    }
    const url = launchPaperworkWithHandoff({
        source: 'wix-indemnitor',
        role: handoffUrlRole(currentSession && currentSession.role),
        caseId: currentSession && currentSession.caseId,
        handoff: handoff,
        sessionToken: sessionToken
    });
    wixLocation.to(url);
}

/** Second check before navigation. The server already allowlists the url. */
function acceptedPaymentUrl(result) {
    if (!result || result.ok !== true || typeof result.url !== 'string') return '';
    let parsed;
    try { parsed = new URL(result.url); } catch (e) { return ''; }
    if (parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    if (parsed.port && parsed.port !== '443') return '';
    const host = String(parsed.hostname || '').toLowerCase().replace(/\.$/, '');
    const allowed = host === 'swipesimple.com' || host.endsWith('.swipesimple.com')
        || host === 'shamrockbailbonds.biz' || host.endsWith('.shamrockbailbonds.biz');
    if (!allowed) return '';
    if (parsed.hostname !== host) {
        try { parsed.hostname = host; } catch (e) { return ''; }
    }
    if (parsed.hostname !== host) return '';
    const href = parsed.href;
    if (href.toLowerCase().indexOf('lnk_') !== -1) return '';
    if (parsed.pathname.toLowerCase().indexOf('/links/') !== -1) return '';
    return href;
}

function premiumDueText(cents) {
    if (typeof cents !== 'number' || !Number.isSafeInteger(cents) || cents <= 0) return '';
    const amount = (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return PREMIUM_DUE_LABEL + ' ' + amount;
}

function setPayLabels(label) {
    forEachEl(['#btnPayInstallment', '#makePaymentBtn'], function (el) {
        if (el && 'label' in el) el.label = label;
    });
}

function showPayState(state, amountCents) {
    if (state === 'ok') {
        const due = premiumDueText(amountCents);
        if (due) {
            safeSetText('#textPaymentStatus', due);
            safeSetText(['#textTotalPremium'], due);
        }
        setPayLabels('Pay now');
        postDash({ type: 'shamrock-dash-pay', state: 'ok', amount_cents: amountCents });
        return;
    }
    if (state === 'role_not_indemnitor') {
        safeHide(['#btnPayInstallment', '#makePaymentBtn']);
        safeSetText('#textPaymentStatus', '');
        postDash({ type: 'shamrock-dash-pay', state: 'role_not_indemnitor' });
        return;
    }
    if (state === 'already_paid') {
        safeSetText('#textPaymentStatus', PAID_NOTE);
        safeSetText(['#textTotalPremium'], PAID_NOTE);
        postDash({ type: 'shamrock-dash-pay', state: 'already_paid' });
        return;
    }
    if (state === 'preparing') {
        safeSetText('#textPaymentStatus', PREPARED_NOTE);
        postDash({ type: 'shamrock-dash-pay', state: 'preparing' });
        return;
    }
    if (state === 'expired') {
        safeSetText('#textPaymentStatus', EXPIRED_NOTE);
        postDash({ type: 'shamrock-dash-pay', state: 'expired' });
        return;
    }
    safeSetText('#textPaymentStatus', CALL_NOTE);
    postDash({ type: 'shamrock-dash-pay', state: state === 'rate_limited' ? 'rate_limited' : 'call_only' });
}

let payBusy = false;
let readyPayUrl = '';
async function startPayment() {
    if (payBusy) return;
    if (readyPayUrl) {
        const open = decidePayClick({ state: 'ok', payment_url: readyPayUrl, acknowledged: true });
        if (open.navigate && open.url) wixLocation.to(open.url);
        return;
    }
    payBusy = true;
    safeSetText('#textPaymentStatus', '');
    try {
        const result = await getPaymentLinkForSession(sessionToken);
        const state = (result && result.state) || 'call_only';
        const url = state === 'ok' ? acceptedPaymentUrl({ ok: true, url: result.payment_url }) : '';
        const due = premiumDueText(result && result.amount_cents);
        const decision = decidePayClick({
            state: url && due ? 'ok' : (state === 'ok' ? 'call_only' : state),
            payment_url: url,
            acknowledged: false
        });
        if (decision.navigate) return;
        if (decision.label === 'Pay now' && url && due) {
            readyPayUrl = url;
            showPayState('ok', result.amount_cents);
            return;
        }
        readyPayUrl = '';
        showPayState(state === 'ok' ? 'call_only' : state);
    } catch (e) {
        readyPayUrl = '';
        showPayState('call_only');
    } finally {
        payBusy = false;
    }
}

const ACTIONS = {
    'continue-paperwork': () => {
        continuePaperwork();
    },
    'pay': () => startPayment(),
    'view-documents': () => showDocuments(),
    'upload-collateral': () => {
        // IdUploadLightbox is gone. shamrock-leads #314 (mode=id-upload) is not
        // merged, so this uses the live paperwork launch and keeps documentType.
        wixLocation.to(buildPaperworkLaunchpadUrl({
            caseId: indemnitorData?.caseNumber,
            role: 'indemnitor',
            documentType: COLLATERAL_DOCUMENT_TYPE,
            source: 'wix-indemnitor'
        }));
    },
    'add-cosigner': (msg) => {
        inviteCosigner(msg);
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
    // #btnPayInstallment, #makePaymentBtn, and #btnResumeBond are not on this page.
    safeOnClick('#btnPayInstallment', ACTIONS['pay']);
    safeOnClick('#makePaymentBtn', ACTIONS['pay']);
    safeOnClick('#btnResumeBond', function () {});
    safeOnClick(['#callBtn'], ACTIONS['call']);
    safeOnClick(['#btnStartNewBond'], ACTIONS['start-new-bond']);
    safeOnClick('#btnViewDocuments', ACTIONS['view-documents']);
    safeOnClick('#btnContinuePaperwork', ACTIONS['continue-paperwork']);
    safeOnClick('#btnLogout', ACTIONS['logout']);
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
            if (typeof fn === 'function') fn(msg);
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
