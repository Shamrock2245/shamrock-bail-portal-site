/**
 * ============================================================================
 * SignNow_SendPaperwork.js — Shannon Mid-Call Paperwork Tool
 * ============================================================================
 * Called by ElevenLabs agent tool via Netlify proxy → GAS.
 *
 * Uses the FULL 12-document pipeline:
 *   1. Fetch all 12 PDFs from Google Drive (same TEMPLATE_DRIVE_IDS as Dashboard)
 *   2. Upload each individually to SignNow
 *   3. Add signature/initials fields to each document
 *   4. Create a Document Group linking all docs together
 *   5. Send a group signing invite via email with consent language
 *
 * Shannon collects: caller_name, caller_email, caller_phone, defendant_name, county
 * Everything else stays blank for the signer to fill when they open the signing link.
 *
 * Reuses existing GAS functions:
 *   - TEMPLATE_DRIVE_IDS (Code.js global)
 *   - SN_getConfig, SN_uploadDocument, SN_addFields (SignNow_Integration_Complete.js)
 *   - fetchWithRetry (SignNow_Integration_Complete.js)
 *   - SN_log (SignNow_Integration_Complete.js)
 *
 * Architecture: ElevenLabs → Netlify (proxy) → GAS (factory) → SignNow API
 * ============================================================================
 */

// ============================================================================
// TEMPLATE ORDER — ALL 12 SIGNING DOCUMENTS
// ============================================================================
// Same order as Dashboard. Excludes appearance-bond (print-only).
const SHANNON_TEMPLATE_ORDER = [
    'paperwork-header',      // 1. Header with names, case number, date
    'faq-cosigners',         // 2. FAQ for co-signers (initials)
    'faq-defendants',        // 3. FAQ for defendants (initials)
    'indemnity-agreement',   // 4. Indemnitor fills out and signs
    'defendant-application', // 5. Defendant fills out and signs
    'promissory-note',       // 6. Signatures by all parties
    'disclosure-form',       // 7. Signatures by all parties
    'surety-terms',          // 8. Signatures by all parties
    'master-waiver',         // 9. Signatures by all parties
    'ssa-release',           // 10. Duplicated per person (defendant + each indemnitor)
    'collateral-receipt',    // 11. Collateral and premium receipt
    'payment-plan'           // 12. Only if payment plan is used
];

// ============================================================================
// SIGNATURE FIELD POSITIONS — from Dashboard.html CONFIG.signatureFields
// ============================================================================
// These are the calibrated coordinates for each document type.
// Each entry: { type, role, page_number, x, y, width, height }
const SHANNON_SIG_FIELDS = {
    'paperwork-header': [],
    'faq-cosigners': [
        { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 }
    ],
    'faq-defendants': [
        { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 }
    ],
    'indemnity-agreement': [
        { type: 'signature', role: 'Indemnitor', page_number: 0, x: 330, y: 95, width: 230, height: 34 }
    ],
    'defendant-application': [
        { type: 'signature', role: 'Bail Agent', page_number: 0, x: 85, y: 95, width: 210, height: 34 },
        { type: 'signature', role: 'Defendant', page_number: 0, x: 335, y: 95, width: 210, height: 34 },
        { type: 'signature', role: 'Defendant', page_number: 1, x: 155, y: 110, width: 300, height: 34 }
    ],
    'promissory-note': [
        { type: 'signature', role: 'Defendant', page_number: 0, x: 85, y: 95, width: 210, height: 34 },
        { type: 'signature', role: 'Indemnitor', page_number: 0, x: 325, y: 95, width: 210, height: 34 }
    ],
    'disclosure-form': [
        { type: 'signature', role: 'Defendant', page_number: 0, x: 85, y: 515, width: 180, height: 35 },
        { type: 'signature', role: 'Indemnitor', page_number: 0, x: 315, y: 515, width: 180, height: 35 },
        { type: 'signature', role: 'Bail Agent', page_number: 0, x: 315, y: 470, width: 180, height: 35 }
    ],
    'surety-terms': [
        { type: 'signature', role: 'Defendant', page_number: 0, x: 85, y: 140, width: 200, height: 34 },
        { type: 'signature', role: 'Indemnitor', page_number: 0, x: 325, y: 140, width: 200, height: 34 }
    ],
    'master-waiver': [
        { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 2, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 2, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 3, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 3, x: 502, y: 30, width: 50, height: 22 },
        { type: 'signature', role: 'Bail Agent', page_number: 3, x: 195, y: 465, width: 145, height: 26 },
        { type: 'signature', role: 'Defendant', page_number: 3, x: 155, y: 487, width: 185, height: 26 },
        { type: 'signature', role: 'Indemnitor', page_number: 3, x: 165, y: 509, width: 175, height: 26 }
    ],
    'ssa-release': [
        { type: 'signature', role: 'Defendant', page_number: 0, x: 140, y: 145, width: 330, height: 40 }
    ],
    'collateral-receipt': [
        { type: 'signature', role: 'Bail Agent', page_number: 0, x: 95, y: 355, width: 200, height: 32 },
        { type: 'signature', role: 'Indemnitor', page_number: 0, x: 350, y: 305, width: 210, height: 32 },
        { type: 'signature', role: 'Bail Agent', page_number: 0, x: 90, y: 165, width: 210, height: 32 }
    ],
    'payment-plan': [
        { type: 'initials', role: 'Defendant', page_number: 0, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 0, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 1, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 1, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 2, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 2, x: 502, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Defendant', page_number: 3, x: 60, y: 30, width: 50, height: 22 },
        { type: 'initials', role: 'Indemnitor', page_number: 3, x: 502, y: 30, width: 50, height: 22 },
        { type: 'signature', role: 'Defendant', page_number: 3, x: 180, y: 658, width: 185, height: 28 },
        { type: 'signature', role: 'Indemnitor', page_number: 3, x: 186, y: 630, width: 185, height: 28 }
    ]
};


// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Handles the Shannon "send paperwork" tool call.
 * Called from Code.js doGet when source === 'send_paperwork'
 *
 * @param {object} data - Parsed data from ElevenLabs tool call
 * @param {string} data.caller_name - Full name of the caller/indemnitor
 * @param {string} data.caller_email - Caller's email address
 * @param {string} data.caller_phone - Caller's phone number
 * @param {string} data.defendant_name - Full name of the defendant
 * @param {string} data.county - County where defendant is held
 * @returns {object} Result for ElevenLabs to read back to caller
 */
function handleShannonSendPaperwork(data) {
    try {
        SN_log('Shannon_Start', data);

        // --- Validate ---
        if (!data.caller_name || !data.caller_email) {
            return { success: false, message: "I need your full name and email address to send the paperwork." };
        }
        if (!data.defendant_name) {
            return { success: false, message: "I need the defendant's full name to prepare the paperwork." };
        }

        const callerParts = _shannon_splitName(data.caller_name);
        const defParts = _shannon_splitName(data.defendant_name);
        const todayStr = new Date().toLocaleDateString('en-US');
        const config = SN_getConfig();

        // -----------------------------------------------------------------
        // 1. FETCH — Pull all 12 PDFs from Google Drive
        // -----------------------------------------------------------------
        SN_log('Shannon_FetchPDFs', { count: SHANNON_TEMPLATE_ORDER.length });
        const pdfDocs = [];

        for (const templateKey of SHANNON_TEMPLATE_ORDER) {
            // Use global TEMPLATE_DRIVE_IDS from Code.js
            const driveId = TEMPLATE_DRIVE_IDS[templateKey];
            if (!driveId) {
                SN_log('Shannon_NoDriveID', templateKey);
                continue;
            }
            try {
                const file = DriveApp.getFileById(driveId);
                const blob = file.getBlob();
                pdfDocs.push({ key: templateKey, bytes: blob.getBytes() });
            } catch (e) {
                SN_log('Shannon_FetchErr', { templateKey, err: e.toString() });
                // Continue — don't fail the entire packet for one missing PDF
            }
        }

        if (pdfDocs.length === 0) {
            return { success: false, message: "I'm having trouble accessing the documents right now. Our team will follow up with you." };
        }
        SN_log('Shannon_Fetched', { count: pdfDocs.length });

        // -----------------------------------------------------------------
        // 2. UPLOAD — Upload each PDF individually to SignNow
        // -----------------------------------------------------------------
        const uploadedDocs = [];
        const dateStr = new Date().toISOString().split('T')[0];

        for (const doc of pdfDocs) {
            try {
                const fileName = `${doc.key}_${defParts.last || 'Unknown'}_${dateStr}.pdf`;
                const pdfBase64 = Utilities.base64Encode(doc.bytes);
                const result = SN_uploadDocument(pdfBase64, fileName);
                if (result.success) {
                    uploadedDocs.push({ key: doc.key, documentId: result.documentId, fileName });
                } else {
                    SN_log('Shannon_UploadFail', { key: doc.key, err: result.error });
                }
            } catch (e) {
                SN_log('Shannon_UploadErr', { key: doc.key, err: e.toString() });
            }
            // Rate-limit: 500ms between uploads to avoid SignNow 429 on 12 sequential requests
            Utilities.sleep(500);
        }

        if (uploadedDocs.length === 0) {
            return { success: false, message: "I couldn't upload the documents right now. Our team will send them to you manually." };
        }
        SN_log('Shannon_Uploaded', { count: uploadedDocs.length });

        // -----------------------------------------------------------------
        // 3. FIELDS — Add signature/initials fields to each uploaded doc
        // -----------------------------------------------------------------
        for (const doc of uploadedDocs) {
            const fieldDefs = SHANNON_SIG_FIELDS[doc.key] || [];
            if (fieldDefs.length === 0) continue;

            try {
                _shannon_addDocFields(config, doc.documentId, fieldDefs);
            } catch (e) {
                SN_log('Shannon_FieldErr', { key: doc.key, err: e.toString() });
            }
        }

        // -----------------------------------------------------------------
        // 4. GROUP — Create a SignNow Document Group
        // -----------------------------------------------------------------
        let groupId = null;
        if (uploadedDocs.length > 1) {
            groupId = _shannon_createDocGroup(config, uploadedDocs, data.defendant_name);
        }
        const entityId = groupId || uploadedDocs[0].documentId;
        const entityType = groupId ? 'group' : 'document';

        // -----------------------------------------------------------------
        // 5. INVITE — Send email invite with consent language
        // -----------------------------------------------------------------
        const inviteResult = _shannon_sendInvite(config, entityId, entityType, data, uploadedDocs);

        // -----------------------------------------------------------------
        // 6. LOG — Spreadsheet + Slack
        // -----------------------------------------------------------------
        _shannon_logToSheet(data, entityId, uploadedDocs.length, inviteResult.success);
        _shannon_notifySlack(
            `📱 *Shannon sent full bail bond packet* (${uploadedDocs.length} docs) to *${data.caller_name}* (${data.caller_email})\n` +
            `👤 Defendant: *${data.defendant_name}* | 📍 County: *${data.county || 'Unknown'}*`
        );

        // -----------------------------------------------------------------
        // 7. RETURN — Friendly message for Shannon to read back
        // -----------------------------------------------------------------
        if (inviteResult.success) {
            return {
                success: true,
                message: `I've sent your complete bail bond paperwork — all ${uploadedDocs.length} documents — to ${data.caller_email} for electronic signature. ` +
                    `This includes the FAQ sheets, indemnity agreement, defendant application, promissory note, disclosure form, ` +
                    `surety terms, master waiver, SSA release, collateral receipt, and payment plan. ` +
                    `Please check your email, review each document, and sign where indicated. ` +
                    `Any fields we didn't fill in today can be completed directly in the signing interface. ` +
                    `By signing, you consent to the collection of your personal information and location data for bail bond underwriting and compliance.`,
                documentsCount: uploadedDocs.length,
                entityId: entityId
            };
        } else {
            return {
                success: false,
                message: "The documents are prepared but I had trouble sending the signing invite. " +
                    "Our team will send the signing link to you shortly."
            };
        }

    } catch (error) {
        SN_log('Shannon_Error', error.toString());
        return {
            success: false,
            message: "I ran into a technical issue. Don't worry — I have all your information and our team will get the paperwork sent to you shortly."
        };
    }
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Split full name into { first, middle, last }
 */
function _shannon_splitName(fullName) {
    const parts = (fullName || '').trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
    if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
    return { first: parts[0], middle: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
}

/**
 * Add signature/initials fields to a single SignNow document.
 * Builds the roles array and fields array from our field definitions.
 */
function _shannon_addDocFields(config, documentId, fieldDefs) {
    // Collect unique roles
    const roleNames = [...new Set(fieldDefs.map(f => f.role))];
    const roles = roleNames.map((name, idx) => ({
        unique_id: `role_${idx}`,
        signing_order: name === 'Indemnitor' ? 1 : name === 'Defendant' ? 2 : 3,
        name: name
    }));
    const roleMap = {};
    roleNames.forEach((name, idx) => { roleMap[name] = `role_${idx}`; });

    // Build API fields
    const fields = fieldDefs.map(f => ({
        type: f.type,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        page_number: f.page_number,
        required: true,
        role_id: roleMap[f.role]
    }));

    const url = `${config.API_BASE}/document/${documentId}`;
    const response = fetchWithRetry(url, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
            'Content-Type': 'application/json'
        },
        payload: JSON.stringify({ roles, fields }),
        muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    SN_log('Shannon_DocFields', { documentId, fieldCount: fields.length, status: code });
    return code >= 200 && code < 300;
}

/**
 * Create a SignNow Document Group from multiple uploaded documents.
 * Returns the group ID or null on failure.
 * SignNow API: POST /documentgroup
 */
function _shannon_createDocGroup(config, uploadedDocs, defendantName) {
    try {
        const url = `${config.API_BASE}/documentgroup`;
        const payload = {
            document_ids: uploadedDocs.map(d => d.documentId),
            group_name: `Bail_Packet_${defendantName}_${new Date().toISOString().split('T')[0]}`
        };

        const response = fetchWithRetry(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        const json = JSON.parse(response.getContentText());
        if (json.id) {
            SN_log('Shannon_GroupCreated', { groupId: json.id, docCount: uploadedDocs.length });
            return json.id;
        } else {
            SN_log('Shannon_GroupFail', json);
            return null;
        }
    } catch (e) {
        SN_log('Shannon_GroupErr', e.toString());
        return null;
    }
}

/**
 * Send signing invite via email with full consent language.
 * If group: uses /documentgroup/{id}/groupinvite
 * If single doc: uses /document/{id}/invite
 */
function _shannon_sendInvite(config, entityId, entityType, data, uploadedDocs) {
    try {
        const consentMessage =
            `Hi ${data.caller_name},\n\n` +
            `Thank you for choosing Shamrock Bail Bonds. Please review and sign the attached bail bond ` +
            `paperwork for ${data.defendant_name}.\n\n` +
            `This packet includes all required documents: FAQ sheets, indemnity agreement, defendant application, ` +
            `promissory note, disclosure form, surety terms and conditions, master waiver, SSA release, ` +
            `collateral receipt, and payment plan.\n\n` +
            `By signing these documents, you consent to the collection and use of your personal information, ` +
            `location data, and financial details for the purpose of bail bond underwriting, compliance, ` +
            `risk assessment, and administration.\n\n` +
            `Any fields not pre-filled can be completed directly in the signing interface.\n\n` +
            `Questions? Call us at (941) 304-BAIL.\n\n` +
            `— Shamrock Bail Bonds`;

        if (entityType === 'group') {
            // ----- DOCUMENT GROUP INVITE -----
            // SignNow API: POST /documentgroup/{id}/groupinvite
            const url = `${config.API_BASE}/documentgroup/${entityId}/groupinvite`;

            // Build invite steps — one step per document in the group
            const invite_steps = uploadedDocs.map((doc, idx) => ({
                order: idx + 1,
                invite_emails: [{
                    email: data.caller_email,
                    subject: 'Shamrock Bail Bonds — Complete Your Bail Bond Paperwork',
                    message: idx === 0 ? consentMessage : `Please review and sign: ${doc.key.replace(/-/g, ' ')}`,
                    reminder: 4,
                    expiration_days: 7
                }],
                invite_actions: [{
                    email: data.caller_email,
                    role_name: 'Indemnitor',
                    action: 'sign'
                }]
            }));

            const payload = {
                invite_steps,
                completion_emails: [{
                    email: data.caller_email,
                    subject: 'All Documents Signed — Shamrock Bail Bonds',
                    message: 'Thank you! All your bail bond documents have been signed successfully.'
                }]
            };

            const response = fetchWithRetry(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                },
                payload: JSON.stringify(payload),
                muteHttpExceptions: true
            });

            const code = response.getResponseCode();
            const json = JSON.parse(response.getContentText());
            SN_log('Shannon_GroupInvite', { entityId, status: code, response: JSON.stringify(json).substring(0, 200) });

            if (code >= 200 && code < 300) {
                return { success: true };
            }

            // Group invite failed — fall back to individual invites on ALL docs
            SN_log('Shannon_GroupInviteFallback', `Group invite failed (HTTP ${code}). Sending ${uploadedDocs.length} individual invites.`);
            let anySuccess = false;
            for (let i = 0; i < uploadedDocs.length; i++) {
                const msg = i === 0 ? consentMessage : `Please review and sign: ${uploadedDocs[i].key.replace(/-/g, ' ')}`;
                const r = _shannon_sendSingleDocInvite(config, uploadedDocs[i].documentId, data, msg);
                if (r.success) anySuccess = true;
                Utilities.sleep(300); // brief pause between individual invites
            }
            return { success: anySuccess };

        } else {
            // ----- SINGLE DOCUMENT INVITE -----
            return _shannon_sendSingleDocInvite(config, entityId, data, consentMessage);
        }

    } catch (e) {
        SN_log('Shannon_InviteErr', e.toString());
        return { success: false, error: e.toString() };
    }
}

/**
 * Send invite for a single document via email.
 * SignNow API: POST /document/{id}/invite
 */
function _shannon_sendSingleDocInvite(config, documentId, data, message) {
    try {
        const url = `${config.API_BASE}/document/${documentId}/invite`;

        const payload = {
            to: [{
                email: data.caller_email,
                role: 'Indemnitor',
                role_id: '',
                order: 1,
                reassign: '0',
                decline_by_signature: '0',
                reminder: 4,
                expiration_days: 7,
                subject: 'Shamrock Bail Bonds — Complete Your Bail Bond Paperwork',
                message: message
            }],
            from: 'admin@shamrockbailbonds.biz'
        };

        const response = fetchWithRetry(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        const code = response.getResponseCode();
        const json = JSON.parse(response.getContentText());
        SN_log('Shannon_SingleInvite', { documentId, status: code });

        return { success: code >= 200 && code < 300 };

    } catch (e) {
        SN_log('Shannon_SingleInviteErr', e.toString());
        return { success: false, error: e.toString() };
    }
}

/**
 * Log the event to the ShannonPaperwork spreadsheet tab.
 * NOTE: getActiveSpreadsheet() returns null in a doGet/web-app context.
 * We use openById() with INTAKE_SHEET_ID (same sheet used by the rest of GAS).
 */
function _shannon_logToSheet(data, entityId, docCount, success) {
    try {
        const sheetId = PropertiesService.getScriptProperties().getProperty('INTAKE_SHEET_ID') || '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E';
        const ss = SpreadsheetApp.openById(sheetId);
        let sheet = ss.getSheetByName('ShannonPaperwork');
        if (!sheet) {
            sheet = ss.insertSheet('ShannonPaperwork');
            sheet.appendRow([
                'Timestamp', 'Caller Name', 'Caller Email', 'Caller Phone',
                'Defendant Name', 'County', 'Entity ID', 'Doc Count', 'Success', 'Source'
            ]);
            sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
        }
        sheet.appendRow([
            new Date(),
            data.caller_name || '',
            data.caller_email || '',
            data.caller_phone || '',
            data.defendant_name || '',
            data.county || '',
            entityId || '',
            docCount,
            success ? 'Yes' : 'No',
            'shannon_elevenlabs'
        ]);
    } catch (e) {
        SN_log('Shannon_SheetErr', e.toString());
    }
}

/**
 * Send Slack notification via whichever Slack helper is available.
 */
function _shannon_notifySlack(message) {
    try {
        if (typeof sendSlackNotification === 'function') {
            sendSlackNotification(message, '#intake-alerts');
        } else if (typeof SLACK_postMessage === 'function') {
            SLACK_postMessage('#intake-alerts', message);
        } else if (typeof sendSlackMessage === 'function') {
            const cfg = getConfig();
            const webhook = cfg.SLACK_WEBHOOK_INTAKE || cfg.SLACK_WEBHOOK_SHAMROCK;
            if (webhook) sendSlackMessage(webhook, message, null);
        } else {
            SN_log('Shannon_SlackNoHandler', message);
        }
    } catch (e) {
        SN_log('Shannon_SlackErr', e.toString());
    }
}
