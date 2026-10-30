/// <reference path="../types/wix-overrides.d.ts" />
/**
 * Page: portal-defendant.skg9y.js
 * Function: Defendant After-Care Dashboard (Post-Intake Lifecycle)
 *
 * Capabilities:
 * 1. Court Dates & Appearances (next hearing, location, courtroom — only what is on file)
 * 2. Check-In (user taps Check in → one browser location read → backend/location saveUserLocation)
 * 3. Case Documents (list of documents on file for the signed-in user)
 * 4. Payment Management (view balance, make payment)
 * 5. "Add Another Charge / Bond"
 * 6. Persistent "Continue Paperwork" Banner: Displayed ONLY if packet is incomplete.
 *
 * Dashboard embed (2026-10-27): if the page has an HTML embed #defendantDashEmbed pointing at
 * https://shamrock-embeds.netlify.app/defendant-dashboard.html, page code sends it display-only
 * fields and handles the allowlisted actions it emits. The session token never leaves page code.
 * Without the embed, the legacy $w elements below keep working.
 *
 * @version 3.1.0
 * @updated 2026-10-27
 */

import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { validateCustomSession, getDefendantDetails, invalidateSession } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { saveUserLocation } from 'backend/location.jsw';
import { getSessionToken, clearSessionToken } from 'public/session-manager';
import { buildPaperworkLaunchpadUrl, BOND_PAYMENT_LINK } from 'public/portal-config';
import { submitWizardToLeads } from 'backend/leadsIntake';
import { silentPingLocation } from 'public/location-tracker';
import { captureFullLocationSnapshot } from 'public/geolocation-client';

const ROLE = 'defendant';
const NOT_ON_FILE = 'Not on file — call the office';
const OFFICE_TEL = 'tel:+12393322245';
const OFFICE_SMS = 'sms:+12399550178';
const SPANISH_TEL = 'tel:+17272952245';
const DASH_EMBED_ID = '#defendantDashEmbed';
const DASH_ACTIONS = ['login', 'continue-paperwork', 'pay', 'check-in', 'view-documents', 'add-bond', 'call', 'text', 'call-spanish', 'logout', 'retry'];

let currentSession = null;
let defendantData = null;
let sessionToken = '';
let dashEmbed = null;
let dashState = { state: 'loading', data: null };
let backgroundPingStarted = false; // keeps the existing once-per-page-load behavior when Retry re-runs the load

$w.onReady(async function () {
    // SEO: Prevent Indexing (Protected Member Area)
    wixSeo.setMetaTags([{ "name": "robots", "content": "noindex, nofollow" }]);
    console.log("🛡️ [Defendant Dashboard] Loading After-Care Portal...");

    LightboxController.init($w);
    setupWizardBridge('#defendantWizard', 'shamrock-defendant-submitted', 'defendant', (msg) => msg.payload || msg.data);
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

        // Validate Session
        const validation = await validateCustomSession(sessionToken);
        if (validation && validation.reason === 'error') {
            setDashState('error', null);
            return;
        }
        if (!validation || !validation.valid || validation.role !== 'defendant') {
            console.warn("Invalid or non-defendant session:", validation && validation.reason);
            setDashState('signed-out', null);
            wixLocation.to('/portal-landing');
            return;
        }

        currentSession = validation;

        // Fetch Defendant Record (server derives identity from the session)
        defendantData = await getDefendantDetails(sessionToken);
        if (!defendantData) {
            setDashState('error', null);
            return;
        }
        populateDashboardUI(defendantData);
        evaluatePaperworkCompletion(defendantData);
        setDashState('ready', toDashData(defendantData));

        // Background location verification for active bonded clients.
        // UNCHANGED — pending Brendan's consent review (see PR).
        const pwStatus = (defendantData?.paperworkStatus || '').toLowerCase();
        if (!backgroundPingStarted && ['sent', 'signed', 'completed', 'active'].some(s => pwStatus.includes(s))) {
            backgroundPingStarted = true;
            silentPingLocation(defendantData?.caseStatus || 'Active');
        }

    } catch (err) {
        console.error("Critical error during defendant dashboard load:", err);
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

function asNumber(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.-]/g, '');
        if (!cleaned || cleaned === '-' || cleaned === '.') return null;
        const n = Number(cleaned);
        return isFinite(n) ? n : null;
    }
    return null;
}

function money(n) {
    const num = asNumber(n);
    return num === null
        ? ''
        : '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function displayDate(value) {
    if (!value) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
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
    safeSetText('#textCaseNumber', data.caseNumber || NOT_ON_FILE);
    safeSetText('#textBondAmount', money(data.bondAmount) || NOT_ON_FILE);
    safeSetText('#textCaseStatus', data.caseStatus || NOT_ON_FILE);

    // Court Dates Widget
    safeSetText('#textNextCourtDate', displayDate(data.nextCourtDate) || NOT_ON_FILE);
    safeSetText('#textCourtLocation', data.courtLocation || NOT_ON_FILE);
    safeSetText('#textCourtroom', data.courtroom || NOT_ON_FILE);

    // Check-in Status
    safeSetText('#textLastCheckIn', `Last check-in: ${displayDate(data.lastCheckIn) || NOT_ON_FILE}`);

    // Balance Due (shown as recorded; no "Paid in Full" assumption)
    safeSetText('#textBalanceDue', money(data.balanceDue) || NOT_ON_FILE);
    safeSetText('#textPaymentStatus', '');
}

/** Display-only fields for the embed. Never includes the token, email, phone or ids. */
function toDashData(data) {
    return {
        name: fullName(data) || null,
        caseNumber: data.caseNumber || null,
        caseStatus: data.caseStatus || null,
        bondAmount: asNumber(data.bondAmount),
        nextCourtDate: data.nextCourtDate || null,
        courtLocation: data.courtLocation || null,
        courtroom: data.courtroom || null,
        county: data.county || null,
        lastCheckIn: data.lastCheckIn || null,
        balanceDue: asNumber(data.balanceDue),
        paperworkComplete: isPaperworkComplete(data),
        canCheckIn: true
    };
}

/**
 * Evaluates paperwork status and toggles the "Continue Paperwork" banner
 */
function evaluatePaperworkCompletion(data) {
    if (isPaperworkComplete(data)) {
        // Hide intake/wizard chrome entirely
        safeHide('#bannerIncompletePaperwork');
        safeHide('#boxIntakeWizardFallback');
        safeShow('#boxAfterCareModules');
    } else {
        // Show persistent "Continue Paperwork" banner
        safeShow('#bannerIncompletePaperwork');
        safeSetText('#textPaperworkBanner', 'Almost done — tap Continue to finish your signature.');

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
        const caseId = defendantData?.caseNumber || currentSession?.caseId || '';
        wixLocation.to(buildPaperworkLaunchpadUrl({ caseId, role: 'defendant', source: 'wix-defendant' }));
    },
    'pay': () => {
        // Case-specific SwipeSimple invoice link first, else the general SwipeSimple payment page.
        wixLocation.to(defendantData?.paymentUrl || BOND_PAYMENT_LINK);
    },
    'check-in': () => doCheckIn(),
    'view-documents': () => showDocuments(),
    'add-bond': () => {
        const caseId = defendantData?.caseNumber || '';
        wixLocation.to(buildPaperworkLaunchpadUrl({ caseId, role: 'defendant', mode: 'additional-bond', source: 'wix-defendant' }));
    },
    'call': () => wixLocation.to(OFFICE_TEL),
    'text': () => wixLocation.to(OFFICE_SMS),
    'call-spanish': () => wixLocation.to(SPANISH_TEL),
    'login': () => wixLocation.to('/portal-landing'),
    'logout': () => logout(),
    'retry': () => loadDashboard()
};

function setupActionHandlers() {
    safeOnClick('#btnCheckIn', ACTIONS['check-in']);
    safeOnClick('#btnAddAnotherBond', ACTIONS['add-bond']);
    safeOnClick('#btnMakePayment', ACTIONS['pay']);
    safeOnClick('#btnViewDocuments', ACTIONS['view-documents']);
    safeOnClick('#btnContinuePaperwork', ACTIONS['continue-paperwork']);
    safeOnClick('#btnLogout', ACTIONS['logout']);
}

/**
 * Check-in: runs only when the user taps Check in. The browser asks for location
 * permission; the backend validates the session and records the check-in.
 */
let checkInBusy = false;
async function doCheckIn() {
    if (checkInBusy) return;
    checkInBusy = true;
    postDash({ type: 'shamrock-dash-checkin', state: 'working' });
    safeSetLabel('#btnCheckIn', 'Checking in…');
    try {
        if (!sessionToken) throw new Error('no-session');
        const snapshot = await captureFullLocationSnapshot();
        if (!snapshot || !snapshot.geo || !snapshot.geo.success) throw new Error('no-location');
        const { latitude, longitude } = snapshot.geo;
        const result = await saveUserLocation(latitude, longitude, 'Portal check-in', '', sessionToken, snapshot.extraData || {});
        if (!result || !result.success) throw new Error('rejected');
        const at = new Date().toISOString();
        if (defendantData) defendantData.lastCheckIn = at;
        safeSetText('#textLastCheckIn', `Last check-in: ${displayDate(at)}`);
        postDash({ type: 'shamrock-dash-checkin', state: 'done', lastCheckIn: at });
    } catch (e) {
        console.warn('Check-in error:', e && e.message);
        const message = (e && e.message === 'no-location')
            ? 'We could not read your location. Allow location for this site and try again, or call the office.'
            : 'Check-in did not go through. Try again or call the office.';
        safeSetText('#textLastCheckIn', message);
        postDash({ type: 'shamrock-dash-checkin', state: 'error', message });
    } finally {
        safeSetLabel('#btnCheckIn', 'Check in');
        checkInBusy = false;
    }
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
// Dashboard embed bridge (#defendantDashEmbed). No-op when the embed is absent.
// ---------------------------------------------------------------------------
function setupDashEmbed() {
    let el = null;
    try { el = $w(DASH_EMBED_ID); } catch (e) { el = null; }
    if (!el || typeof el.onMessage !== 'function' || typeof el.postMessage !== 'function') return;
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

// UI Utilities
function safeSetText(id, text) {
    try {
        const el = $w(id);
        if (el && 'text' in el) el.text = text;
    } catch (e) {}
}

function safeSetLabel(id, label) {
    try {
        const el = $w(id);
        if (el && 'label' in el) el.label = label;
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
