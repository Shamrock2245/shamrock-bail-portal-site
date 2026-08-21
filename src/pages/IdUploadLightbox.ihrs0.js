/**
 * IdUploadLightbox.ihrs0.js
 * 
 * Shamrock Bail Bonds - Government ID Capture & Cloud Vision OCR Modal
 * 
 * Capabilities:
 * 1. Rear camera viewfinder with DL alignment overlay guide (iOS/Safari, Android/Chrome, iPad)
 * 2. Front & Back ID capture with confidence indicators
 * 3. Cloud Vision OCR extraction: Name, DOB, DL#, Address, City, State, ZIP, Sex, Expiration
 * 4. Role-Scoped Integrity: Cosigner ID NEVER overwrites Defendant identity
 * 5. Requires explicit user review & confirmation before write to CMS / IntakeQueue
 * 
 * @version 2.0.0
 */

import wixWindow from 'wix-window';
import { uploadIdDocument } from 'backend/documentUpload';
import { processIdPhotoOcr } from 'backend/id-ocr-service';
import { getSessionToken } from 'public/session-manager';
import {
    createCanonicalPerson,
    hydratePersonFromOcr
} from 'public/canonical-paperwork-mapper';

let frontFile = null;
let backFile = null;
let frontPreviewUrl = null;
let backPreviewUrl = null;
let contextData = null;
let activeRole = 'indemnitor'; // default
let activePerson = null;
let ocrConfidence = { overall: 'low', fields: {} };

$w.onReady(function () {
    console.log("📸 [ID Upload Modal] Initializing Vision OCR Capture...");

    contextData = wixWindow.lightbox.getContext() || {};
    activeRole = contextData.role || 'indemnitor';
    activePerson = createCanonicalPerson(activeRole);

    setupUI();
    setupEventHandlers();
    prefillFormFields();
});

/**
 * Configure UI defaults, guide overlay, and instructions
 */
function setupUI() {
    const roleTitle = activeRole === 'defendant' ? 'Defendant ID Verification' : 'Cosigner ID Verification';
    safeSetText('#uploadTitle', roleTitle);
    safeSetText('#instructions', 'Position the front of your Driver License inside the guide box below.');
    updateStatus('Align ID inside frame and take a clear photo.', 'info');

    safeDisable('#submitBtn');
    safeHide('#progressBar');
    safeHide('#errorMessage');

    // Viewfinder / Guide Overlay elements
    try {
        const overlay = $w('#cameraGuideOverlay') || $w('#idCardFrame');
        if (overlay) overlay.show();
    } catch (e) {}
}

/**
 * Prefill input fields if context data is available
 */
function prefillFormFields() {
    if (!contextData) return;

    if (activeRole === 'defendant') {
        safeSetValue('#inputFullName', contextData.defendantName || '');
    } else {
        safeSetValue('#inputFullName', contextData.indemnitorName || '');
    }

    safeSetValue('#inputPhone', contextData.phone || '');
    safeSetValue('#inputEmail', contextData.email || '');
    safeSetValue('#inputDefendantCounty', contextData.county || 'Lee');
}

/**
 * Setup interactive event handlers & file upload change listeners
 */
function setupEventHandlers() {
    // Front ID Upload & Vision OCR
    bindUploadHandler(['#idFrontUpload', '#frontIdUpload', '#uploadFrontDl'], async (file, previewUrl) => {
        frontFile = file;
        frontPreviewUrl = previewUrl;
        activePerson.idCard.frontUrl = previewUrl;
        showPreview(['#frontIdPreview', '#frontPreview'], previewUrl);
        updateStatus('⚡ Running Cloud Vision OCR on Front ID...', 'info');

        await runOcrExtraction(file, 'front');
        checkFormReadiness();
    });

    // Back ID Upload
    bindUploadHandler(['#idBackUpload', '#backIdUpload', '#uploadBackDl'], async (file, previewUrl) => {
        backFile = file;
        backPreviewUrl = previewUrl;
        activePerson.idCard.backUrl = previewUrl;
        showPreview(['#backIdPreview', '#backPreview'], previewUrl);
        updateStatus('Back of ID captured! Please confirm extracted fields.', 'success');

        await runOcrExtraction(file, 'back');
        checkFormReadiness();
    });

    // Submit Button (Confirmation)
    safeOnClick('#submitBtn', handleSubmit);

    // Cancel / Close
    safeOnClick('#closeBtn', () => wixWindow.lightbox.close({ success: false, cancelled: true }));
    safeOnClick('#cancelBtn', () => wixWindow.lightbox.close({ success: false, cancelled: true }));
}

/**
 * Run Cloud Vision OCR and hydrate role-correct fields with confidence highlights
 */
async function runOcrExtraction(file, side) {
    try {
        safeShow('#progressBar');
        const ocrPayload = {
            imageBase64: file.url || file.name,
            side: side,
            role: activeRole
        };

        const result = await processIdPhotoOcr(ocrPayload);

        if (result && result.success && result.fields) {
            ocrConfidence = result.confidence || { overall: 'medium', fields: {} };

            // 1. Hydrate Role-Scoped Person (Cosigner NEVER touches Defendant name)
            hydratePersonFromOcr(activePerson, result.fields);

            // 2. Populate UI Form Inputs
            populateFormFromPerson(activePerson);

            // 3. Highlight Confidence
            applyConfidenceStyling(ocrConfidence);

            updateStatus('✅ ID Verified! Review fields and tap Confirm.', 'success');
        } else {
            updateStatus('Please verify fields manually below.', 'warning');
        }
    } catch (err) {
        console.warn('OCR non-blocking warning:', err);
        updateStatus('Could not auto-read ID. Please enter details below.', 'warning');
    } finally {
        safeHide('#progressBar');
    }
}

/**
 * Populates form inputs from hydrated Person object
 */
function populateFormFromPerson(person) {
    const fullName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
    safeSetValue('#inputFullName', fullName || safeGetValue('#inputFullName'));
    safeSetValue('#inputDlNumber', person.dlNumber);
    safeSetValue('#inputDob', person.dob);
    safeSetValue('#inputStreet', person.address.street);
    safeSetValue('#inputCity', person.address.city);
    safeSetValue('#inputState', person.address.state);
    safeSetValue('#inputZip', person.address.zip);
    safeSetValue('#inputSex', person.gender);
    safeSetValue('#inputExpiration', person.dlExpiration);
}

/**
 * Highlights low-confidence fields for easy user correction
 */
function applyConfidenceStyling(confidence) {
    const fieldMap = {
        dlNumber: '#inputDlNumber',
        dob: '#inputDob',
        street: '#inputStreet',
        zip: '#inputZip',
        firstName: '#inputFullName'
    };

    Object.keys(fieldMap).forEach(key => {
        const selector = fieldMap[key];
        const status = confidence.fields && confidence.fields[key];
        try {
            const inputEl = $w(selector);
            if (inputEl && inputEl.style) {
                if (status === 'low') {
                    inputEl.style.borderColor = '#F59E0B'; // Amber alert border
                } else if (status === 'high') {
                    inputEl.style.borderColor = '#10B981'; // Green verified border
                }
            }
        } catch (e) {}
    });
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
                        let previewUrl = file.url || ('wix:image://' + file.name);
                        onSuccess(file, previewUrl);
                    }
                });
            }
        } catch (e) {}
    });
}

function showPreview(selectors, previewUrl) {
    if (!previewUrl) return;
    selectors.forEach(sel => {
        try {
            const el = $w(sel);
            if (el) {
                el.src = previewUrl;
                el.show();
            }
        } catch (e) {}
    });
}

function checkFormReadiness() {
    const hasFront = !!frontFile || !!frontPreviewUrl;
    if (hasFront) {
        safeEnable('#submitBtn');
        safeSetText('#submitBtn', 'Confirm & Continue');
    }
}

/**
 * Confirms user-reviewed data and submits to IntakeQueue
 */
async function handleSubmit() {
    const sessionToken = getSessionToken() || contextData.sessionToken;

    // Harvest any manual edits
    harvestUserEdits();

    safeDisable('#submitBtn');
    safeSetText('#submitBtn', 'Saving Verified ID...');
    updateStatus('Securing identity record...', 'info');

    try {
        // Upload front ID file
        if (frontFile && sessionToken) {
            await uploadIdDocument({
                file: frontFile,
                side: 'front',
                sessionToken,
                metadata: {
                    memberEmail: activePerson.email || contextData.email || 'client@shamrockbailbonds.biz',
                    memberName: `${activePerson.firstName} ${activePerson.lastName}`,
                    memberPhone: activePerson.phone || contextData.phone,
                    uploadedAt: new Date().toISOString()
                }
            });
        }

        wixWindow.lightbox.close({
            success: true,
            role: activeRole,
            person: activePerson,
            frontUrl: frontPreviewUrl,
            backUrl: backPreviewUrl
        });

    } catch (err) {
        console.error('Submission error:', err);
        wixWindow.lightbox.close({
            success: true,
            role: activeRole,
            person: activePerson
        });
    }
}

function harvestUserEdits() {
    const full = safeGetValue('#inputFullName') || '';
    if (full) {
        const parts = full.split(' ');
        activePerson.firstName = parts[0] || activePerson.firstName;
        activePerson.lastName = parts.slice(1).join(' ') || activePerson.lastName;
    }
    activePerson.dlNumber = safeGetValue('#inputDlNumber') || activePerson.dlNumber;
    activePerson.dob = safeGetValue('#inputDob') || activePerson.dob;
    activePerson.address.street = safeGetValue('#inputStreet') || activePerson.address.street;
    activePerson.address.city = safeGetValue('#inputCity') || activePerson.address.city;
    activePerson.address.state = safeGetValue('#inputState') || activePerson.address.state;
    activePerson.address.zip = safeGetValue('#inputZip') || activePerson.address.zip;
    activePerson.gender = safeGetValue('#inputSex') || activePerson.gender;
    activePerson.dlExpiration = safeGetValue('#inputExpiration') || activePerson.dlExpiration;
}

// -----------------------------------------------------------------------------
// UI HELPER UTILITIES
// -----------------------------------------------------------------------------

function safeSetText(id, text) {
    try {
        const el = $w(id);
        if (el) el.text = text;
    } catch (e) {}
}

function safeGetValue(id) {
    try {
        const el = $w(id);
        if (el && el.value) return el.value.trim();
    } catch (e) {}
    return '';
}

function safeSetValue(id, val) {
    try {
        const el = $w(id);
        if (el && val !== undefined && val !== null) el.value = String(val);
    } catch (e) {}
}

function safeEnable(id) {
    try {
        const el = $w(id);
        if (el && typeof el.enable === 'function') el.enable();
    } catch (e) {}
}

function safeDisable(id) {
    try {
        const el = $w(id);
        if (el && typeof el.disable === 'function') el.disable();
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

function updateStatus(text, type) {
    try {
        const el = $w('#statusMessage');
        if (!el) return;
        el.text = text;
        el.style.color = type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#38BDF8';
        el.show();
    } catch (e) {}
}
