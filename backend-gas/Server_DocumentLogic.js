/**
 * Server_DocumentLogic.js
 * Handles server-side document operations for the Shamrock Dashboard.
 * 
 * KEY REGISTRIES:
 *   SIGNNOW_TEMPLATE_MAP  → in Telegram_Documents.js (template keys → SignNow template IDs)
 *   PDF_DRIVE_FILE_IDS    → below (template keys → Google Drive PDF file IDs, for preview/download)
 *   SHAMROCK_FIELD_MAPPINGS → in PDF_Mappings.js (template keys → field name → form data mappings)
 */

// ============================================================================
// TEMPLATE KEY → GOOGLE DRIVE PDF FILE ID MAPPING
// ============================================================================
// These are the original PDF templates stored in Google Drive.
// Used by the Dashboard "Preview" flow to render PDFs in-browser via pdf-lib.
// Source: Debug_ConvertPDFs.js (PDF_TEMPLATES_TO_CONVERT)
// ============================================================================
const PDF_DRIVE_FILE_IDS = {
    'paperwork-header': '15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1',
    'faq-cosigners': '1bjmH2w-XS5Hhe828y_Jmv9DqaS_gSZM7',
    'faq-defendants': '16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR',
    'indemnity-agreement': '1Raa2gzHOlO5kSJOeDE25eBh2H8LcjN5L',
    'defendant-application': '1JxBubXg0up1NeFBaWgi6qGNA133tSCxG',
    'promissory-note': '104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt',
    'disclosure-form': '1qIIDudp7r3J7-6MHlL2US34RcrU9KZKY',
    'surety-terms': '1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf',
    'master-waiver': '181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs',
    'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu',
    'collateral-receipt': '1IAYq4H2b0N0vPnJN7b2vZPaHg_RNKCmP',
    'payment-plan': '1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A',
    'appearance-bond': '15SDM1oBysTw76bIL7Xt0Uhti8uRZKABs'
};

/**
 * Fetches the base64 content of a PDF file from Google Drive.
 * @param {string} fileId - The Google Drive File ID.
 * @return {string} - The base64 encoded content of the file.
 */
function getPDFContent(fileId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        return Utilities.base64Encode(blob.getBytes());
    } catch (e) {
        console.error('Error fetching PDF content for ID ' + fileId + ':', e.message);
        throw new Error('Failed to fetch PDF content: ' + e.message);
    }
}

// ============================================================================
// CLIENT-CALLABLE FUNCTIONS (server_ prefix for google.script.run)
// ============================================================================

/**
 * Fetches PDF templates from Google Drive by template keys.
 * Called by Dashboard via: google.script.run.server_getPDFTemplatesBatch(templateKeys)
 *
 * @param {Array<string>} templateKeys - Array of template keys (e.g. ['indemnity-agreement', 'ssa-release'])
 * @return {Array<string|null>} - Array of base64 encoded PDF content (same order as input keys).
 *                                 null entries indicate a failed fetch.
 */
function server_getPDFTemplatesBatch(templateKeys) {
    const results = [];
    templateKeys.forEach(function (key) {
        try {
            // PRIMARY: Google Drive
            var driveId = PDF_DRIVE_FILE_IDS[key];
            if (driveId) {
                try {
                    results.push(getPDFContent(driveId));
                    return; // success — move to next key
                } catch (driveErr) {
                    console.warn('⚠️ Drive fetch failed for ' + key + ': ' + driveErr.message + ' — trying SignNow fallback');
                }
            }

            // FALLBACK: SignNow Teams Templates
            // Uses SIGNNOW_TEMPLATE_MAP from Telegram_Documents.js
            var snTemplateId = (typeof SIGNNOW_TEMPLATE_MAP !== 'undefined') ? SIGNNOW_TEMPLATE_MAP[key] : null;
            if (snTemplateId) {
                var config = SN_getConfig();
                var downloadUrl = config.API_BASE + '/document/' + snTemplateId + '/download?type=collapsed';
                var resp = UrlFetchApp.fetch(downloadUrl, {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
                    muteHttpExceptions: true
                });
                if (resp.getResponseCode() === 200) {
                    var base64 = Utilities.base64Encode(resp.getBlob().getBytes());
                    console.log('✅ Loaded ' + key + ' from SignNow fallback');
                    results.push(base64);
                    return;
                } else {
                    console.error('❌ SignNow fallback also failed for ' + key + ': HTTP ' + resp.getResponseCode());
                }
            }

            // Both failed
            console.error('❌ No source available for template: ' + key);
            results.push(null);
        } catch (e) {
            console.warn('Skipping template ' + key + ': ' + e.message);
            results.push(null);
        }
    });
    return results;
}

/**
 * Maps form data to PDF field names for a specific template.
 * Called by Dashboard via: google.script.run.server_mapDataToTags(formData, templateKey)
 * 
 * Wraps PDF_mapDataToTags() from PDF_Mappings.js so the client can call it.
 *
 * @param {Object} formData - The form data from the Dashboard
 * @param {string} templateKey - The template key (e.g. 'indemnity-agreement')
 * @return {Array<{name: string, value: string}>} - Array of field name/value pairs
 */
function server_mapDataToTags(formData, templateKey) {
    try {
        return PDF_mapDataToTags(formData, templateKey);
    } catch (e) {
        console.error('Error mapping data to tags for ' + templateKey + ': ' + e.message);
        return [];
    }
}

/**
 * Maps form data to PDF field names for ALL selected templates in one batch call.
 * Reduces round-trips between client and server.
 * Called by Dashboard via: google.script.run.server_mapDataToTagsBatch(formData, templateKeys)
 *
 * @param {Object} formData - The form data from the Dashboard
 * @param {Array<string>} templateKeys - Array of template keys
 * @return {Object} - Map of templateKey → [{name, value}]
 */
function server_mapDataToTagsBatch(formData, templateKeys) {
    var results = {};
    templateKeys.forEach(function (key) {
        try {
            results[key] = PDF_mapDataToTags(formData, key);
        } catch (e) {
            console.warn('Error mapping fields for ' + key + ': ' + e.message);
            results[key] = [];
        }
    });
    return results;
}

/**
 * Saves a base64 encoded PDF to a specific Google Drive folder.
 * Called by Dashboard via: google.script.run.server_saveCompositePDF(base64, filename)
 *
 * @param {string} base64Content - The base64 encoded PDF content.
 * @param {string} fileName - The name for the new file.
 * @param {string} folderId - Optional folder ID (uses config default if not provided).
 * @return {string} - The web-viewable URL of the created file.
 */
function server_saveCompositePDF(base64Content, fileName, folderId) {
    try {
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), 'application/pdf', fileName);

        let folder;
        if (folderId) {
            folder = DriveApp.getFolderById(folderId);
        } else {
            const config = getConfig();
            const destId = config.GOOGLE_DRIVE_OUTPUT_FOLDER_ID;
            if (destId) {
                folder = DriveApp.getFolderById(destId);
            } else {
                folder = DriveApp.getRootFolder();
            }
        }

        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        // Return a direct download URL that SignNow can access
        return 'https://drive.google.com/uc?id=' + file.getId() + '&export=download';
    } catch (e) {
        console.error('Error saving composite PDF:', e.message);
        throw new Error('Failed to save composite PDF: ' + e.message);
    }
}

/**
 * Generate and send a full signing packet via SignNow.
 * This is the SERVER-SIDE orchestrator that reuses the Telegram signing flow.
 *
 * Called by Dashboard via: google.script.run.server_generateSigningPacket(params)
 *
 * @param {Object} params - {
 *   formData: Object,        // Dashboard form data (defendant, indemnitor, charges, etc.)
 *   selectedDocs: Array,     // [{key: 'indemnity-agreement', signerIndex: -1, ...}]
 *   signingMethod: string,   // 'email', 'sms', or 'kiosk'
 *   caseNumber: string       // Case/booking number
 * }
 * @return {Object} - { success, documents: [{docId, signNowDocId, label, signingUrl?}], mode }
 */
function server_generateSigningPacket(params) {
    try {
        var formData = params.formData || {};
        var selectedDocs = params.selectedDocs || [];
        var signingMethod = params.signingMethod || 'email';
        var caseNumber = params.caseNumber || formData['case-number'] || formData['booking-number'] || '';

        Logger.log('📦 Dashboard packet generation: ' + selectedDocs.length + ' docs, method=' + signingMethod + ', case=' + caseNumber);

        var results = [];

        for (var i = 0; i < selectedDocs.length; i++) {
            var docEntry = selectedDocs[i];
            var docId = docEntry.key || docEntry.docId;
            var signerIndex = (docEntry.signerIndex !== undefined) ? Number(docEntry.signerIndex) : -1;

            // Use the Telegram signing flow handler
            // Email resolution: try direct keys, then signer section, then indemnitors array
            var signerEmail = docEntry.signerEmail
                || formData['indemnitor-email']
                || formData['signer-indemnitor-email']
                || (formData.indemnitors && formData.indemnitors[0] ? formData.indemnitors[0].email : '')
                || '';

            var signingResult = handleTelegramGetSigningUrl({
                documentId: docId,
                role: docEntry.signerRole || 'Indemnitor',
                email: signerEmail,
                caseNumber: caseNumber,
                signerIndex: signerIndex,
                formData: formData  // This triggers prefillDocument_ inside the handler
            });

            results.push({
                docId: docId,
                label: signingResult.docLabel || docId,
                signNowDocId: signingResult.documentId || null,
                signingUrl: signingResult.signingUrl || null,
                success: signingResult.success,
                error: signingResult.error || null,
                message: signingResult.message || null,
                role: signingResult.role || docEntry.signerRole || 'Indemnitor',
                signerIndex: signerIndex
            });

            if (signingResult.success) {
                Logger.log('  ✅ ' + docId + ' → ' + signingResult.documentId);
            } else {
                Logger.log('  ❌ ' + docId + ': ' + (signingResult.error || signingResult.message));
            }
        }

        var successCount = results.filter(function (r) { return r.success; }).length;
        Logger.log('📦 Packet complete: ' + successCount + '/' + results.length + ' docs processed');

        // Build detailed error summary for the client
        var errors = results.filter(function (r) { return !r.success; }).map(function (r) {
            var detail = r.error || 'unknown';
            if (r.message) detail += ' (' + r.message + ')';
            return r.docId + ': ' + detail;
        });

        return {
            success: successCount > 0,
            error: successCount === 0 ? ('All ' + results.length + ' docs failed: ' + errors.join('; ')) : null,
            mode: signingMethod,
            totalDocs: results.length,
            successCount: successCount,
            documents: results
        };

    } catch (e) {
        Logger.log('❌ Packet generation error: ' + e.toString());
        return { success: false, error: 'server_generateSigningPacket crashed: ' + e.message, documents: [] };
    }
}


// ============================================================================
// LEGACY FUNCTIONS (kept for backward compat)
// ============================================================================

/**
 * Proxies a request to the Wix backend for SignNow operations.
 */
function callWixBackend(endpoint, payload) {
    try {
        const config = getConfig();
        const url = `${config.WIX_SITE_URL}/_functions/${endpoint}`;

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            headers: {
                'Authorization': config.WIX_API_KEY
            },
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, options);
        const contextText = response.getContentText();

        if (response.getResponseCode() >= 400) {
            throw new Error(`Wix Backend Error (${response.getResponseCode()}): ${contextText}`);
        }

        return JSON.parse(contextText);
    } catch (e) {
        console.error(`Error calling Wix endpoint ${endpoint}:`, e.message);
        throw new Error(`Failed to call Wix backend: ${e.message}`);
    }
}

function server_uploadAndSendForSigning(pdfUrl, filename, fields, signers, options) {
    return callWixBackend('signNowUploadAndSend', { pdfUrl, filename, fields, signers, options });
}

function server_storePendingDocument(pendingDoc) {
    return callWixBackend('storePendingDocument', pendingDoc);
}

function server_sendSigningNotification(notification) {
    return callWixBackend('sendSigningNotification', notification);
}

/**
 * Get the full packet manifest for a case.
 * Called by Dashboard via google.script.run.server_getPacketManifest(data)
 */
function server_getPacketManifest(data) {
    return handleGetPacketManifest(data);
}

/**
 * Get a signing URL for a specific document in the packet.
 * Called by Dashboard via google.script.run.server_getSigningUrl(data)
 */
function server_getSigningUrl(data) {
    return handleTelegramGetSigningUrl(data);
}
