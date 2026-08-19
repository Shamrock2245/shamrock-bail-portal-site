/**
 * IdUploadLightbox.ihrs0.js
 * 
 * Shamrock Bail Bonds - Indemnitor Paperwork & ID Verification Modal
 * 
 * High-priority, mobile-first lightbox that:
 * 1. Captures Government ID (Front and Back) with camera/file preview
 * 2. Verifies Indemnitor & Defendant details (auto-prefilled)
 * 3. Captures digital agreement & submits paperwork to IntakeQueue & GAS
 * 
 * Expected Wix Editor Elements (with graceful fallbacks):
 * - #uploadTitle: Title text
 * - #instructions / #statusText: Subtitle/status display
 * - #idFrontUpload / #frontIdUpload: Upload button for ID front
 * - #idBackUpload / #backIdUpload: Upload button for ID back
 * - #frontIdPreview / #frontPreview: Image preview for front ID
 * - #backIdPreview / #backPreview: Image preview for back ID
 * - #inputFullName / #inputPhone / #inputEmail / #inputDlNumber / #inputSsn: Detail fields
 * - #chkConsent / #consentCheck: Terms / financial responsibility checkbox
 * - #submitBtn: Submit button
 * - #skipBtn / #closeBtn / #cancelBtn: Dismiss button
 * - #progressBar / #loadingIndicator: Progress display
 */

import wixWindow from 'wix-window';
import { uploadIdDocument } from 'backend/documentUpload';
import { submitIntakeForm } from 'backend/intakeQueue';
import { callGasAction } from 'backend/gasIntegration';
import { getSessionToken } from 'public/session-manager';
import { local } from 'wix-storage';

let frontFile = null;
let backFile = null;
let frontPreviewUrl = null;
let backPreviewUrl = null;
let memberData = null;
let contextData = null;

$w.onReady(function () {
    console.log(" Indemnitor Paperwork & ID Modal Initialized");

    // Retrieve context passed by opener
    contextData = wixWindow.lightbox.getContext() || {};
    memberData = contextData.memberData || contextData.indemnitorData || {};

    setupUI();
    setupEventHandlers();
    prefillFormFields();
});

/**
 * Configure UI defaults and instructions
 */
function setupUI() {
    safeSetText('#uploadTitle', 'Indemnitor Paperwork & ID Verification');
    safeSetText('#instructions', 'Please upload clear photos of your government ID (Front & Back) and confirm your details to initiate bail paperwork.');
    updateStatus('Upload both sides of your ID to continue.', 'info');

    // Initial button states
    safeDisable('#submitBtn');
    safeHide('#progressBar');
    safeHide('#errorMessage');

    // Hide previews until files selected
    safeHide('#frontIdPreview');
    safeHide('#backIdPreview');
    safeHide('#frontPreview');
    safeHide('#backPreview');
}

/**
 * Prefill input fields if context data is available
 */
function prefillFormFields() {
    if (!memberData) return;

    const fullName = memberData.name || [memberData.firstName, memberData.lastName].filter(Boolean).join(' ');
    safeSetValue('#inputFullName', fullName || '');
    safeSetValue('#inputPhone', memberData.phone || '');
    safeSetValue('#inputEmail', memberData.email || '');
    safeSetValue('#inputDlNumber', memberData.dlNumber || memberData.dl || '');
    safeSetValue('#inputSsn', memberData.ssn || '');
    safeSetValue('#inputDefendantName', memberData.defendantName || contextData.defendantName || '');
    safeSetValue('#inputDefendantCounty', memberData.county || contextData.county || '');
}

/**
 * Setup interactive event handlers
 */
function setupEventHandlers() {
    // Front ID Upload
    bindUploadHandler(['#idFrontUpload', '#frontIdUpload'], (file, previewUrl) => {
        frontFile = file;
        frontPreviewUrl = previewUrl;
        showPreview(['#frontIdPreview', '#frontPreview'], previewUrl);
        updateStatus('Front of ID captured! Now add the back.', 'info');
        checkFormReadiness();
    });

    // Back ID Upload
    bindUploadHandler(['#idBackUpload', '#backIdUpload'], (file, previewUrl) => {
        backFile = file;
        backPreviewUrl = previewUrl;
        showPreview(['#backIdPreview', '#backPreview'], previewUrl);
        updateStatus('Both ID sides ready! Please review and submit.', 'success');
        checkFormReadiness();
    });

    // Consent Checkbox
    const consentSelectors = ['#chkConsent', '#consentCheck', '#chkTerms'];
    consentSelectors.forEach(sel => {
        try {
            const el = $w(sel);
            if (el && typeof el.onChange === 'function') {
                el.onChange(() => checkFormReadiness());
            }
        } catch (e) { /* element not in layout */ }
    });

    // Submit Button
    safeOnClick('#submitBtn', handleSubmit);

    // Skip / Close Buttons
    safeOnClick('#skipBtn', () => wixWindow.lightbox.close({ success: false, skipped: true }));
    safeOnClick('#closeBtn', () => wixWindow.lightbox.close({ success: false, cancelled: true }));
    safeOnClick('#cancelBtn', () => wixWindow.lightbox.close({ success: false, cancelled: true }));
}

/**
 * Bind change handler for upload inputs
 */
function bindUploadHandler(selectors, onSuccess) {
    selectors.forEach(sel => {
        try {
            const el = $w(sel);
            if (el && typeof el.onChange === 'function') {
                el.onChange(async () => {
                    if (el.value && el.value.length > 0) {
                        const file = el.value[0];
                        let previewUrl = null;
                        if (file.url) {
                            previewUrl = file.url;
                        } else if (file.name) {
                            previewUrl = 'wix:image://' + file.name;
                        }
                        onSuccess(file, previewUrl);
                    }
                });
            }
        } catch (e) { /* selector not found */ }
    });
}

/**
 * Display image preview
 */
function showPreview(selectors, previewUrl) {
    if (!previewUrl) return;
    selectors.forEach(sel => {
        try {
            const el = $w(sel);
            if (el) {
                el.src = previewUrl;
                el.show();
            }
        } catch (e) { /* preview element optional */ }
    });
}

/**
 * Check if the user has completed ID upload and required fields
 */
function checkFormReadiness() {
    const hasFront = !!frontFile || !!frontPreviewUrl;
    const hasBack = !!backFile || !!backPreviewUrl;

    let hasConsent = true;
    try {
        const chk = $w('#chkConsent') || $w('#consentCheck');
        if (chk && chk.type === '$w.Checkbox') {
            hasConsent = chk.checked;
        }
    } catch (e) { /* consent check is optional in layout */ }

    if (hasFront && hasBack && hasConsent) {
        safeEnable('#submitBtn');
        safeSetText('#submitBtn', '☘️ Submit Paperwork & ID');
    } else {
        safeDisable('#submitBtn');
    }
}

/**
 * Handle submission of paperwork & ID photos
 */
async function handleSubmit() {
    const sessionToken = getSessionToken() || contextData.sessionToken;
    if (!sessionToken) {
        updateStatus('Session expired. Please log in again.', 'error');
        setTimeout(() => wixWindow.lightbox.close({ success: false, error: 'NO_SESSION' }), 1500);
        return;
    }

    // Indicate loading state
    safeDisable('#submitBtn');
    safeSetText('#submitBtn', 'Submitting Paperwork...');
    updateStatus('Uploading government ID and securing your case...', 'info');
    safeShow('#progressBar');

    try {
        // 1. Capture optional GPS location quietly
        let gps = null;
        try {
            const loc = await wixWindow.getCurrentGeolocation();
            gps = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        } catch (e) { /* GPS optional */ }

        const userEmail = memberData?.email || safeGetValue('#inputEmail') || 'client@shamrockbailbonds.biz';
        const userName = memberData?.name || safeGetValue('#inputFullName') || 'Indemnitor';
        const userPhone = memberData?.phone || safeGetValue('#inputPhone') || '';
        const dlNumber = safeGetValue('#inputDlNumber') || memberData?.dlNumber || '';
        const ssn = safeGetValue('#inputSsn') || memberData?.ssn || '';
        const defName = safeGetValue('#inputDefendantName') || memberData?.defendantName || contextData?.defendantName || '';
        const defCounty = safeGetValue('#inputDefendantCounty') || memberData?.county || contextData?.county || 'Lee';

        const metadata = {
            memberEmail: userEmail,
            memberName: userName,
            memberPhone: userPhone,
            gps: gps,
            uploadedAt: new Date().toISOString()
        };

        // 2. Upload Front & Back ID documents
        let frontDocId = null;
        let backDocId = null;

        if (frontFile) {
            const frontResult = await uploadIdDocument({
                file: frontFile,
                side: 'front',
                metadata: metadata,
                sessionToken: sessionToken
            });
            if (frontResult && frontResult.success) frontDocId = frontResult.documentId;
        }

        if (backFile) {
            const backResult = await uploadIdDocument({
                file: backFile,
                side: 'back',
                metadata: metadata,
                sessionToken: sessionToken
            });
            if (backResult && backResult.success) backDocId = backResult.documentId;
        }

        // 3. Submit or Update IntakeQueue record
        const intakePayload = {
            indemnitorName: userName,
            indemnitorEmail: userEmail,
            indemnitorPhone: userPhone,
            indemnitorDl: dlNumber,
            indemnitorSsn: ssn,
            defendantName: defName,
            county: defCounty,
            idUploaded: true,
            frontIdDocId: frontDocId,
            backIdDocId: backDocId,
            documentStatus: 'submitted',
            source: 'paperwork_modal',
            timestamp: new Date().toISOString()
        };

        let caseId = contextData.caseId || null;
        try {
            const intakeResult = await submitIntakeForm(intakePayload);
            if (intakeResult && intakeResult.caseId) {
                caseId = intakeResult.caseId;
            }
        } catch (intakeErr) {
            console.warn('[Modal] IntakeQueue submission fallback:', intakeErr);
        }

        // 4. Direct provider initiation is intentionally unavailable here.
        // This legacy fallback may capture intake and ID data only. The active
        // paperwork experience is the staff-gated DocuSeal launchpad hosted by
        // SigningLightbox/Netlify, where a validated packet must already exist.

        // Record in local storage
        if (userEmail) {
            local.setItem(`id_uploaded_${userEmail}`, 'true');
            local.setItem(`paperwork_submitted_${userEmail}`, 'true');
        }

        // 5. Show Success
        updateStatus('ID information submitted. Staff will review your case before sending secure DocuSeal paperwork.', 'success');
        safeSetText('#submitBtn', ' Done!');

        setTimeout(() => {
            wixWindow.lightbox.close({
                success: true,
                caseId: caseId,
                frontDocumentId: frontDocId,
                backDocumentId: backDocId
            });
        }, 1200);

    } catch (error) {
        console.error('[Modal] Paperwork submission error:', error);
        updateStatus('Submission error. Please try again or call (239) 332-2245.', 'error');
        safeEnable('#submitBtn');
        safeSetText('#submitBtn', 'Try Again');
        safeHide('#progressBar');
    }
}

/**
 * Status and error messaging helper
 */
function updateStatus(message, type) {
    try {
        const el = $w('#statusText') || $w('#errorMessage');
        if (el) {
            el.text = message;
            try {
                if (type === 'error') el.style.color = '#EF4444';
                else if (type === 'success') el.style.color = '#10B981';
                else el.style.color = '#D4AF37';
            } catch (e) { }
            el.show();
        }
    } catch (e) { /* status element optional */ }
}

// UI Utilities with safe null-checks
function safeGetValue(selector) {
    try {
        const el = $w(selector);
        return el ? (el.value || '').trim() : '';
    } catch (e) { return ''; }
}

function safeSetValue(selector, val) {
    try {
        const el = $w(selector);
        if (el && val) el.value = val;
    } catch (e) { }
}

function safeSetText(selector, text) {
    try {
        const el = $w(selector);
        if (el) el.text = text || '';
    } catch (e) { }
}

function safeShow(selector) {
    try {
        const el = $w(selector);
        if (el) el.show();
    } catch (e) { }
}

function safeHide(selector) {
    try {
        const el = $w(selector);
        if (el) el.hide();
    } catch (e) { }
}

function safeEnable(selector) {
    try {
        const el = $w(selector);
        if (el) el.enable();
    } catch (e) { }
}

function safeDisable(selector) {
    try {
        const el = $w(selector);
        if (el) el.disable();
    } catch (e) { }
}

function safeOnClick(selector, handler) {
    try {
        const el = $w(selector);
        if (el && typeof el.onClick === 'function') el.onClick(handler);
    } catch (e) { }
}
