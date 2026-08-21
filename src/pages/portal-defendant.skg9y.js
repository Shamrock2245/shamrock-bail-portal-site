/// <reference path="../types/wix-overrides.d.ts" />
/**
 * Page: portal-defendant.skg9y.js
 * Function: Defendant After-Care Dashboard (Post-Intake Lifecycle)
 * 
 * Capabilities:
 * 1. Court Dates & Appearances (Next hearing, courtroom, directions)
 * 2. Mandatory Check-In Module (GPS + Selfie verification)
 * 3. Case Documents (Download signed bonds, receipts, court notices)
 * 4. Payment Management (View balance, make payment)
 * 5. "Add Another Charge / Bond" (Fast add-on bond intake without duplicate paperwork)
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
import { validateCustomSession, getDefendantDetails } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { getSessionToken, clearSessionToken } from 'public/session-manager';
import { silentPingLocation } from 'public/location-tracker';
import { captureFullLocationSnapshot } from 'public/geolocation-client';

let currentSession = null;
let defendantData = null;

$w.onReady(async function () {
    // SEO: Prevent Indexing (Protected Member Area)
    wixSeo.setMetaTags([{ "name": "robots", "content": "noindex, nofollow" }]);
    console.log("🛡️ [Defendant Dashboard] Loading After-Care Portal...");

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
        if (!validation || !validation.valid || validation.role !== 'defendant') {
            console.warn("Invalid or non-defendant session:", validation);
            wixLocation.to('/portal-landing');
            return;
        }

        currentSession = validation;

        // Fetch Defendant Record
        defendantData = await getDefendantDetails(sessionToken);
        populateDashboardUI(defendantData);
        evaluatePaperworkCompletion(defendantData);

        // Background location verification for active bonded clients
        const pwStatus = (defendantData?.paperworkStatus || '').toLowerCase();
        if (['sent', 'signed', 'completed', 'active'].some(s => pwStatus.includes(s))) {
            silentPingLocation(defendantData?.caseStatus || 'Active');
        }

    } catch (err) {
        console.error("Critical error during defendant dashboard load:", err);
    }
});

/**
 * Populates all after-care widgets with real case data
 */
function populateDashboardUI(data) {
    if (!data) return;

    const name = data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : "Client";
    safeSetText('#textUserWelcome', `Welcome, ${name}`);
    safeSetText('#textCaseNumber', data.caseNumber || "Case Pending");
    safeSetText('#textBondAmount', data.bondAmount ? `$${Number(data.bondAmount).toLocaleString()}` : "$0.00");
    safeSetText('#textCaseStatus', data.caseStatus || "Active Bond");

    // Court Dates Widget
    const courtDate = data.nextCourtDate || "First Appearance (Next Morning)";
    const courtLocation = data.courtLocation || `${data.county || 'Lee'} County Courthouse`;
    safeSetText('#textNextCourtDate', courtDate);
    safeSetText('#textCourtLocation', courtLocation);
    safeSetText('#textCourtroom', data.courtroom || 'Courtroom 2A');

    // Check-in Status
    const lastCheckIn = data.lastCheckInDate ? new Date(data.lastCheckInDate).toLocaleDateString() : 'Pending This Week';
    safeSetText('#textLastCheckIn', `Last Check-in: ${lastCheckIn}`);

    // Balance Due
    const balance = Number(data.balanceDue || 0);
    safeSetText('#textBalanceDue', `$${balance.toLocaleString()}`);
    if (balance <= 0) {
        safeHide('#btnMakePayment');
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
        // Hide intake/wizard chrome entirely
        safeHide('#bannerIncompletePaperwork');
        safeHide('#boxIntakeWizardFallback');
        safeShow('#boxAfterCareModules');
    } else {
        // Show persistent "Continue Paperwork" banner
        safeShow('#bannerIncompletePaperwork');
        safeSetText('#textPaperworkBanner', '⚠️ Your bail paperwork is incomplete. Complete signature to prevent delays.');
        
        safeOnClick('#btnContinuePaperwork', () => {
            const caseId = data?.caseNumber || currentSession?.caseId || '';
            wixLocation.to(`/portal-start?caseId=${caseId}&role=defendant`);
        });
    }
}

/**
 * Configure buttons and after-care actions
 */
function setupActionHandlers() {
    // 1. Mandatory Weekly Check-In
    safeOnClick('#btnCheckIn', async () => {
        try {
            safeSetText('#btnCheckIn', 'Capturing Location...');
            const loc = await captureFullLocationSnapshot();
            wixWindow.openLightbox('ConsentLightbox', {
                type: 'check-in',
                location: loc,
                sessionToken: getSessionToken(),
                memberData: defendantData
            });
        } catch (e) {
            console.warn("Check-in error:", e);
        }
    });

    // 2. Add Another Charge / Bond
    safeOnClick('#btnAddAnotherBond', () => {
        const caseId = defendantData?.caseNumber || '';
        wixLocation.to(`/portal-start?caseId=${caseId}&role=defendant&mode=additional-bond`);
    });

    // 3. Make Payment
    safeOnClick('#btnMakePayment', () => {
        const payUrl = defendantData?.paymentUrl || 'https://shamrockbailbonds.biz/payment';
        wixWindow.openLightbox('PrivacyLightbox', { paymentUrl: payUrl });
    });

    // 4. View / Download Documents
    safeOnClick('#btnViewDocuments', async () => {
        const docs = await getMemberDocuments({
            memberEmail: defendantData?.email || currentSession?.memberEmail,
            sessionToken: getSessionToken()
        });
        wixWindow.openLightbox('DefendantDetails', {
            documents: docs?.documents || [],
            caseData: defendantData
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
