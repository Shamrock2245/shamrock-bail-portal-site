/**
 * ============================================================================
 * SignNow_SendPaperwork.js — Shannon Mid-Call Paperwork Tool
 * ============================================================================
 * Called by ElevenLabs agent tool via Netlify proxy → GAS.
 * Also called by Dashboard.html "Send Paperwork" button.
 *
 * Uses the FULL 12-document pipeline:
 *   1. Copy each template directly from SignNow (no Drive fetch needed)
 *   2. Prefill text fields with known case data via PDF_Mappings.js
 *   3. Create a Document Group linking all docs together
 *   4. Send a group signing invite via email with consent language
 *
 * Shannon collects: caller_name, caller_email, caller_phone, defendant_name, county
 * Everything else stays blank for the signer to fill when they open the signing link.
 *
 * Reuses existing GAS functions:
 *   - SN_getConfig, SN_getDocumentRoles (SignNow_Integration_Complete.js)
 *   - fetchWithRetry, SN_log (SignNow_Integration_Complete.js)
 *   - prefillDocument_ (Telegram_Documents.js) — shared prefill pipeline
 *   - PDF_mapDataToTags (PDF_Mappings.js) — field name mapping
 *
 * TEMPLATE IDS live in SIGNNOW_TEMPLATE_MAP (Telegram_Documents.js).
 * Do NOT duplicate template IDs here.
 *
 * Architecture: ElevenLabs → Netlify (proxy) → GAS (factory) → SignNow API
 *              Dashboard.html → GAS doPost → SignNow API
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
// TWO-PHASE SIGNING — Document Split
// ============================================================================
// Phase 1: Indemnitor signs immediately (no POA needed)
// Phase 2: After bondsman approval + POA entry (court-filed docs)
// ============================================================================
const PHASE_1_DOCS = [
    'paperwork-header',      // Header with names, case number, date
    'faq-cosigners',         // FAQ for co-signers (initials)
    'indemnity-agreement',   // Indemnitor fills out and signs
    'promissory-note',       // Signatures by all parties
    'disclosure-form',       // Signatures by all parties
    'ssa-release'            // SSA release per person
];

const PHASE_2_DOCS = [
    'faq-defendants',        // FAQ for defendants (initials)
    'defendant-application', // App for Appearance Bond (needs POA)
    'surety-terms',          // Surety Terms & Conditions
    'master-waiver',         // Master waiver
    'collateral-receipt',    // Premium/collateral receipt (final amounts)
    'payment-plan'           // Payment plan (if applicable)
];

// NOTE: SHANNON_SIG_FIELDS removed (2026-03-13).
// Signature/initials fields are pre-tagged on templates in SignNow.
// Field definitions live in getSignatureFieldDefs() in Telegram_Documents.js.
// Adding them here via PUT would OVERWRITE the template-tagged fields.


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

        const defParts = _shannon_splitName(data.defendant_name);
        const config = SN_getConfig();

        // Build Dashboard-format formData so the shared prefill pipeline works
        const formData = _shannon_buildFormData(data);

        // -----------------------------------------------------------------
        // 1. COPY — Copy each SignNow template directly (no Drive fetch)
        // Templates are tagged and live in SignNow. No PDF upload needed.
        // Uses SIGNNOW_TEMPLATE_MAP from Telegram_Documents.js (single source of truth).
        // -----------------------------------------------------------------
        SN_log('Shannon_CopyTemplates', { count: SHANNON_TEMPLATE_ORDER.length });
        const uploadedDocs = [];
        const caseLabel = (data.case_number || defParts.last || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');

        for (const templateKey of SHANNON_TEMPLATE_ORDER) {
            const templateId = SIGNNOW_TEMPLATE_MAP[templateKey];
            if (!templateId) {
                SN_log('Shannon_NoTemplateID', templateKey);
                continue;
            }
            try {
                const copyUrl = `${config.API_BASE}/template/${templateId}/copy`;
                const copyRes = fetchWithRetry(copyUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
                        'Content-Type': 'application/json'
                    },
                    payload: JSON.stringify({
                        document_name: `Shamrock_${caseLabel}_${templateKey}`
                    }),
                    muteHttpExceptions: true
                });
                const copyJson = JSON.parse(copyRes.getContentText());
                if (!copyJson.id) {
                    SN_log('Shannon_CopyFail', { templateKey, response: JSON.stringify(copyJson).substring(0, 200) });
                    continue;
                }
                const documentId = copyJson.id;
                SN_log('Shannon_Copied', { templateKey, documentId });

                // Prefill using the SHARED pipeline (PDF_Mappings.js field names)
                // prefillDocument_ lives in Telegram_Documents.js — uses PDF_mapDataToTags
                // which maps through SHAMROCK_FIELD_MAPPINGS to Adobe Acrobat field names
                var prefillResult = prefillDocument_(documentId, formData, templateKey, -1);
                if (prefillResult.success) {
                    SN_log('Shannon_Prefilled', { templateKey, documentId, fieldCount: prefillResult.fieldCount });
                } else {
                    SN_log('Shannon_PrefillWarn', { templateKey, documentId, error: prefillResult.error });
                }

                uploadedDocs.push({ key: templateKey, documentId, fileName: `Shamrock_${caseLabel}_${templateKey}` });
            } catch (e) {
                SN_log('Shannon_CopyErr', { templateKey, err: e.toString() });
                // Continue — don't fail the entire packet for one template
            }
            Utilities.sleep(300); // rate-limit: 300ms between copies
        }

        if (uploadedDocs.length === 0) {
            return { success: false, message: "I'm having trouble preparing the documents right now. Our team will follow up with you." };
        }
        SN_log('Shannon_CopiedAll', { count: uploadedDocs.length });

        // -----------------------------------------------------------------
        // 2. FIELDS — (SKIPPED) Fields are already on templates.
        // Templates have all signature and text fields pre-tagged.
        // -----------------------------------------------------------------

        // -----------------------------------------------------------------
        // 3. GROUP — Create a SignNow Document Group
        // -----------------------------------------------------------------
        let groupId = null;
        if (uploadedDocs.length > 1) {
            groupId = _shannon_createDocGroup(config, uploadedDocs, data.defendant_name);
        }
        const entityId = groupId || uploadedDocs[0].documentId;
        const entityType = groupId ? 'group' : 'document';

        // -----------------------------------------------------------------
        // 4. INVITE — Send email invite with consent language
        // -----------------------------------------------------------------
        const inviteResult = _shannon_sendInvite(config, entityId, entityType, data, uploadedDocs);

        // -----------------------------------------------------------------
        // 5. LOG — Spreadsheet + Slack
        // -----------------------------------------------------------------
        _shannon_logToSheet(data, entityId, uploadedDocs.length, inviteResult.success);
        _shannon_notifySlack(
            `📱 *Shannon sent full bail bond packet* (${uploadedDocs.length} docs) to *${data.caller_name}* (${data.caller_email})\n` +
            `👤 Defendant: *${data.defendant_name}* | 📍 County: *${data.county || 'Unknown'}*`
        );

        // -----------------------------------------------------------------
        // 6. RETURN — Friendly message for Shannon to read back
        // -----------------------------------------------------------------
        if (inviteResult.success) {
            // --- Get a signing link for SMS delivery ---
            let signingLink = null;
            try {
                signingLink = _shannon_createSigningLink(config, entityId, entityType);
            } catch (linkErr) {
                SN_log('Shannon_SigningLinkErr', linkErr.toString());
            }

            return {
                success: true,
                message: `I've sent your complete bail bond paperwork — all ${uploadedDocs.length} documents — to ${data.caller_email} for electronic signature. ` +
                    `Please check your email, review each document, and sign where indicated. ` +
                    `Any fields we didn't fill in today can be completed directly in the signing interface.`,
                documentsCount: uploadedDocs.length,
                entityId: entityId,
                signing_link: signingLink
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
// PHASE 1 HANDLER — Indemnitor Wizard Submission
// ============================================================================
/**
 * Sends Phase 1 documents (indemnitor-facing) for immediate signing.
 * Called when indemnitor submits the wizard.
 *
 * @param {object} formData - Dashboard-format form data
 * @param {string} signerEmail - Email to send signing invite to
 * @param {string} signerName - Full name of the signer
 * @returns {object} { success, signingLink, entityId, documentsCount }
 */
function handleSendPhase1Packet(formData, signerEmail, signerName) {
    try {
        SN_log('Phase1_Start', { signerEmail, signerName, docCount: PHASE_1_DOCS.length });
        
        if (!signerEmail || !signerName) {
            return { success: false, error: 'Signer email and name are required for Phase 1.' };
        }
        
        const config = SN_getConfig();
        const caseLabel = (formData['defendant-last-name'] || formData['case-number'] || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
        const uploadedDocs = [];
        
        for (const templateKey of PHASE_1_DOCS) {
            const templateId = SIGNNOW_TEMPLATE_MAP[templateKey];
            if (!templateId) { SN_log('Phase1_NoTemplate', templateKey); continue; }
            
            try {
                const copyUrl = `${config.API_BASE}/template/${templateId}/copy`;
                const copyRes = fetchWithRetry(copyUrl, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
                    payload: JSON.stringify({ document_name: `Shamrock_${caseLabel}_Phase1_${templateKey}` }),
                    muteHttpExceptions: true
                });
                const copyJson = JSON.parse(copyRes.getContentText());
                if (!copyJson.id) { SN_log('Phase1_CopyFail', { templateKey, res: JSON.stringify(copyJson).substring(0, 200) }); continue; }
                
                var prefillResult = prefillDocument_(copyJson.id, formData, templateKey, -1);
                SN_log('Phase1_Prefilled', { templateKey, documentId: copyJson.id, ok: prefillResult.success });
                
                uploadedDocs.push({ key: templateKey, documentId: copyJson.id, fileName: `Shamrock_${caseLabel}_Phase1_${templateKey}` });
            } catch (e) {
                SN_log('Phase1_CopyErr', { templateKey, err: e.toString() });
            }
            Utilities.sleep(300);
        }
        
        if (uploadedDocs.length === 0) {
            return { success: false, error: 'Failed to copy any Phase 1 templates.' };
        }
        SN_log('Phase1_CopiedAll', { count: uploadedDocs.length });
        
        // Group + Invite
        let groupId = null;
        if (uploadedDocs.length > 1) {
            groupId = _shannon_createDocGroup(config, uploadedDocs, formData['defendantFullName'] || 'Defendant');
        }
        const entityId = groupId || uploadedDocs[0].documentId;
        const entityType = groupId ? 'group' : 'document';
        
        const inviteData = {
            caller_name: signerName,
            caller_email: signerEmail,
            defendant_name: formData['defendantFullName'] || '',
            county: formData['defendant-county'] || formData['county'] || ''
        };
        const inviteResult = _shannon_sendInvite(config, entityId, entityType, inviteData, uploadedDocs);
        
        // Signing link
        let signingLink = null;
        try { signingLink = _shannon_createSigningLink(config, entityId, entityType); } catch (e) { SN_log('Phase1_LinkErr', e.toString()); }
        
        // Slack notification
        _shannon_notifySlack(
            `📋 *Phase 1 Signing Sent* (${uploadedDocs.length} docs) to *${signerName}* (${signerEmail})\n` +
            `👤 Defendant: *${formData['defendantFullName'] || 'Unknown'}* | 📍 County: *${inviteData.county || 'Unknown'}*\n` +
            `⏳ Awaiting bondsman review for Phase 2.`
        );
        
        SN_log('Phase1_Complete', { entityId, docCount: uploadedDocs.length, inviteOk: inviteResult.success });
        
        return {
            success: true,
            entityId: entityId,
            documentsCount: uploadedDocs.length,
            signingLink: signingLink,
            message: `Phase 1 paperwork (${uploadedDocs.length} documents) sent to ${signerEmail} for signing.`
        };
        
    } catch (error) {
        SN_log('Phase1_Error', error.toString());
        return { success: false, error: 'Phase 1 packet generation failed: ' + error.toString() };
    }
}


// ============================================================================
// PHASE 2 HANDLER — Staff Portal Approval
// ============================================================================
/**
 * Sends Phase 2 documents (court-filed, agent docs) after bondsman approval.
 * Requires POA number and agent info.
 *
 * @param {object} formData - Dashboard-format form data (must include POA, agent info)
 * @param {string} signerEmail - Email to send signing invite to
 * @param {string} signerName - Full name of the signer
 * @param {string} poaNumber - Power of Attorney number (e.g. 'OSI3', 'OSI6')
 * @param {string} agentName - Approving agent's name
 * @param {string} agentLicense - Agent's license number
 * @returns {object} { success, signingLink, entityId, documentsCount }
 */
function handleSendPhase2Packet(formData, signerEmail, signerName, poaNumber, agentName, agentLicense) {
    try {
        SN_log('Phase2_Start', { signerEmail, poaNumber, agentName, docCount: PHASE_2_DOCS.length });
        
        if (!poaNumber) {
            return { success: false, error: 'POA number is required for Phase 2 approval.' };
        }
        if (!signerEmail || !signerName) {
            return { success: false, error: 'Signer email and name are required for Phase 2.' };
        }
        
        // Inject agent/POA fields into formData for prefill
        formData['poa-number'] = poaNumber;
        formData['agent-name'] = agentName || '';
        formData['agent-license'] = agentLicense || '';
        
        const config = SN_getConfig();
        const caseLabel = (formData['defendant-last-name'] || formData['case-number'] || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
        const uploadedDocs = [];
        
        for (const templateKey of PHASE_2_DOCS) {
            const templateId = SIGNNOW_TEMPLATE_MAP[templateKey];
            if (!templateId) { SN_log('Phase2_NoTemplate', templateKey); continue; }
            
            // Skip payment-plan if no payment plan indicated
            if (templateKey === 'payment-plan' && !formData['hasPaymentPlan'] && !formData['payment-plan-amount']) {
                SN_log('Phase2_SkipPaymentPlan', 'No payment plan data');
                continue;
            }
            
            try {
                const copyUrl = `${config.API_BASE}/template/${templateId}/copy`;
                const copyRes = fetchWithRetry(copyUrl, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
                    payload: JSON.stringify({ document_name: `Shamrock_${caseLabel}_Phase2_${templateKey}` }),
                    muteHttpExceptions: true
                });
                const copyJson = JSON.parse(copyRes.getContentText());
                if (!copyJson.id) { SN_log('Phase2_CopyFail', { templateKey, res: JSON.stringify(copyJson).substring(0, 200) }); continue; }
                
                var prefillResult = prefillDocument_(copyJson.id, formData, templateKey, -1);
                SN_log('Phase2_Prefilled', { templateKey, documentId: copyJson.id, ok: prefillResult.success });
                
                uploadedDocs.push({ key: templateKey, documentId: copyJson.id, fileName: `Shamrock_${caseLabel}_Phase2_${templateKey}` });
            } catch (e) {
                SN_log('Phase2_CopyErr', { templateKey, err: e.toString() });
            }
            Utilities.sleep(300);
        }
        
        if (uploadedDocs.length === 0) {
            return { success: false, error: 'Failed to copy any Phase 2 templates.' };
        }
        SN_log('Phase2_CopiedAll', { count: uploadedDocs.length });
        
        // Group + Invite
        let groupId = null;
        if (uploadedDocs.length > 1) {
            groupId = _shannon_createDocGroup(config, uploadedDocs, formData['defendantFullName'] || 'Defendant');
        }
        const entityId = groupId || uploadedDocs[0].documentId;
        const entityType = groupId ? 'group' : 'document';
        
        const inviteData = {
            caller_name: signerName,
            caller_email: signerEmail,
            defendant_name: formData['defendantFullName'] || '',
            county: formData['defendant-county'] || formData['county'] || ''
        };
        const inviteResult = _shannon_sendInvite(config, entityId, entityType, inviteData, uploadedDocs);
        
        // Signing link
        let signingLink = null;
        try { signingLink = _shannon_createSigningLink(config, entityId, entityType); } catch (e) { SN_log('Phase2_LinkErr', e.toString()); }
        
        // Slack notification
        _shannon_notifySlack(
            `✅ *Bond Approved — Phase 2 Sent* (${uploadedDocs.length} docs) to *${signerName}* (${signerEmail})\n` +
            `👤 Defendant: *${formData['defendantFullName'] || 'Unknown'}* | 📍 County: *${inviteData.county || 'Unknown'}*\n` +
            `🔑 POA: *${poaNumber}* | 👨‍💼 Agent: *${agentName}* (${agentLicense})`
        );
        
        SN_log('Phase2_Complete', { entityId, poaNumber, docCount: uploadedDocs.length, inviteOk: inviteResult.success });
        
        return {
            success: true,
            entityId: entityId,
            documentsCount: uploadedDocs.length,
            signingLink: signingLink,
            poaNumber: poaNumber,
            message: `Phase 2 approved! ${uploadedDocs.length} court documents sent to ${signerEmail} for signing. POA: ${poaNumber}.`
        };
        
    } catch (error) {
        SN_log('Phase2_Error', error.toString());
        return { success: false, error: 'Phase 2 packet generation failed: ' + error.toString() };
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
 * Translate Shannon's ElevenLabs tool-call keys into Dashboard-format formData.
 * This makes Shannon's data compatible with buildMasterDataObject() in PDF_Mappings.js,
 * which is called by prefillDocument_() → PDF_mapDataToTags().
 *
 * Shannon collects: caller_name, caller_email, caller_phone, defendant_name, county, etc.
 * Dashboard expects: defendant-first-name, indemnitor-1-first, defendant-county, etc.
 *
 * @param {object} data - Raw data from ElevenLabs tool call
 * @returns {object} formData in Dashboard format for PDF_mapDataToTags pipeline
 */
function _shannon_buildFormData(data) {
    const callerParts = _shannon_splitName(data.caller_name || '');
    const defParts = _shannon_splitName(data.defendant_name || '');
    const todayStr = new Date().toLocaleDateString('en-US');
    const now = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    return {
        // --- Defendant fields (Dashboard key format) ---
        'defendant-first-name':    defParts.first || '',
        'defendant-middle-name':   defParts.middle || '',
        'defendant-last-name':     defParts.last || '',
        'defendantFullName':       data.defendant_name || '',
        'defendant-dob':           data.defendant_dob || '',
        'defendant-ssn':           data.defendant_ssn || '',
        'defendant-street-address': data.defendant_address || '',
        'defendant-city':          data.defendant_city || '',
        'defendant-state':         data.defendant_state || 'FL',
        'defendant-zipcode':       data.defendant_zip || '',
        'defendant-phone':         data.defendant_phone || '',
        'defendant-email':         data.defendant_email || '',
        'defendant-dl-number':     data.defendant_dl || '',
        'defendant-booking-number': data.booking_number || '',
        'defendant-jail-facility': data.jail || data.facility || '',
        'defendant-county':        data.county || '',
        'defendant-charges':       data.charge || data.charges || '',
        'defendant-arrest-date':   data.arrest_date || '',
        'defendant-court-date':    data.court_date || '',
        'defendant-court-time':    data.court_time || '',
        'defendant-court-location': data.court_location || '',

        // --- Indemnitor fields (caller = indemnitor) ---
        'indemnitor-1-first':      callerParts.first || '',
        'indemnitor-1-last':       callerParts.last || '',
        'indemnitor-1-email':      data.caller_email || '',
        'indemnitor-1-phone':      data.caller_phone || '',
        'indemnitor-1-address':    data.caller_address || '',
        'indemnitor-1-city':       data.caller_city || '',
        'indemnitor-1-state':      data.caller_state || 'FL',
        'indemnitor-1-zip':        data.caller_zip || '',
        'indemnitor-1-dob':        data.caller_dob || '',
        'indemnitor-1-ssn':        data.caller_ssn || '',
        'indemnitor-1-dl':         data.caller_dl || '',
        'indemnitor-1-employer':   data.caller_employer || '',
        'indemnitor-1-employer-phone': data.caller_employer_phone || '',
        'indemnitor-1-relation':   data.caller_relation || '',
        'indemnitorFullName':      data.caller_name || '',
        'indemnitorName':          data.caller_name || '',

        // --- Bond / case fields ---
        'bondAmount':              data.bond_amount || '',
        'case-number':             data.case_number || '',
        'county':                  data.county || '',
        'totalPremium':            data.premium || data.premium_amount || '',
        'charges':                 data.charge || data.charges || '',

        // --- Date fields ---
        'date':                    todayStr,

        // --- Agency constants (always filled) ---
        'agent-name':              'Shamrock Bail Bonds',
        'agency-name':             'Shamrock Bail Bonds',
        'agency-address':          '1528 Broadway, Fort Myers, FL 33901',
        'agency-phone':            '(941) 304-2245'
    };
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
            // FIX (Manus handoff 2026-03-12): invite_actions must list EVERY
            // (document, role) pair or SignNow returns error 65582.
            const url = `${config.API_BASE}/documentgroup/${entityId}/groupinvite`;

            // Role → email map — Defendant uses admin placeholder until released
            const roleEmailMap = {
                'Indemnitor': data.caller_email,
                'Defendant':  'admin@shamrockbailbonds.biz',   // placeholder until defendant is released
                'Bail Agent': 'admin@shamrockbailbonds.biz'
            };

            // Build invite_actions: one entry per (document, role) pair
            const invite_actions = [];
            for (const doc of uploadedDocs) {
                const docDetail = SN_getDocumentRoles(doc.documentId);
                for (const roleName of docDetail.roles) {
                    invite_actions.push({
                        email:                roleEmailMap[roleName] || data.caller_email,
                        role_name:            roleName,
                        action:               'sign',
                        document_id:          doc.documentId,
                        allow_reassign:       '0',
                        decline_by_signature: '0'
                    });
                }
            }

            SN_log('Shannon_InviteActions', { count: invite_actions.length, docs: uploadedDocs.length });

            // Single invite step covering all documents
            const invite_steps = [{
                order: 1,
                invite_emails: [{
                    email:   data.caller_email,
                    role:    'Indemnitor',
                    order:   1,
                    subject: `Shamrock Bail Bonds — Please Sign: ${data.defendant_name}`,
                    message: consentMessage,
                    reminder: 4,
                    expiration_days: 7
                }],
                invite_actions: invite_actions
            }];

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
            SN_log('Shannon_GroupInvite', { entityId, status: code, actionCount: invite_actions.length, response: JSON.stringify(json).substring(0, 300) });

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
                Utilities.sleep(300);
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

/**
 * Create a one-click signing link for the caller.
 * Uses SignNow's document invite/link API.
 * Returns the signing URL string, or null on failure.
 */
function _shannon_createSigningLink(config, entityId, entityType) {
    try {
        if (entityType === 'group') {
            // For document groups, we use embedded signing link
            const url = `${config.API_BASE}/v2/document-groups/${entityId}/embedded-invites`;
            const payload = {
                invites: [{
                    order: 1,
                    signers: [{
                        email: '',
                        role_id: '',
                        auth_method: 'none',
                        redirect_uri: 'https://shamrockbailbonds.biz/thank-you'
                    }]
                }]
            };
            // Try create_signing_link endpoint instead
            const linkUrl = `${config.API_BASE}/link`;
            const linkPayload = { document_id: entityId };
            const response = fetchWithRetry(linkUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                },
                payload: JSON.stringify(linkPayload),
                muteHttpExceptions: true
            });
            const code = response.getResponseCode();
            if (code >= 200 && code < 300) {
                const json = JSON.parse(response.getContentText());
                SN_log('Shannon_SigningLink', { entityId, link: json.url || json.url_no_signup });
                return json.url || json.url_no_signup || null;
            }
            SN_log('Shannon_SigningLinkFail_Group', { status: code, body: response.getContentText().substring(0, 200) });
            // Fall back — try with first doc in the group
            return null;
        }

        // For single documents — use the simpler signing link API
        const url = `${config.API_BASE}/link`;
        const payload = { document_id: entityId };
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
        if (code >= 200 && code < 300) {
            const json = JSON.parse(response.getContentText());
            SN_log('Shannon_SigningLink', { entityId, link: json.url || json.url_no_signup });
            return json.url || json.url_no_signup || null;
        }
        SN_log('Shannon_SigningLinkFail', { status: code, body: response.getContentText().substring(0, 200) });
        return null;
    } catch (e) {
        SN_log('Shannon_SigningLinkErr', e.toString());
        return null;
    }
}

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


// ============================================================================
// PATH A: NOTIFY BONDSMAN — Caller wants a bondsman to call them back
// ============================================================================

/**
 * Handles the Shannon "notify bondsman" tool call (Path A).
 * Called from Code.js doGet when source === 'notify_bondsman'
 *
 * Shannon asks: "Would you like to get our paperwork started now, or would
 * you prefer to pass your info to a licensed bondsman who'll call you right back?"
 * If the caller picks "just have someone call me back" → this runs.
 *
 * @param {object} data - Parsed data from ElevenLabs tool call
 * @param {string} data.caller_name - Full name of the caller
 * @param {string} data.caller_phone - Caller's phone number
 * @param {string} data.defendant_name - Full name of the defendant
 * @param {string} data.county - County where defendant is held
 * @param {string} [data.notes] - Any extra notes Shannon captured
 * @returns {object} Result for ElevenLabs to read back to caller
 */
function handleShannonNotifyBondsman(data) {
    try {
        SN_log('Shannon_PathA_Start', data);

        if (!data.caller_name || !data.caller_phone) {
            return {
                success: false,
                message: "I need your name and phone number so our bondsman can call you back."
            };
        }

        // --- 1. Log to Spreadsheet ---
        try {
            const ss = SpreadsheetApp.getActiveSpreadsheet();
            let sheet = ss.getSheetByName('ShannonIntake');
            if (!sheet) {
                sheet = ss.insertSheet('ShannonIntake');
                sheet.appendRow([
                    'Timestamp', 'Caller Name', 'Caller Phone', 'Defendant Name',
                    'County', 'Notes', 'Path', 'Status'
                ]);
                sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
            }
            sheet.appendRow([
                new Date(),
                data.caller_name || '',
                data.caller_phone || '',
                data.defendant_name || '',
                data.county || '',
                data.notes || '',
                'A — Callback Requested',
                'Pending'
            ]);
        } catch (e) {
            SN_log('Shannon_PathA_SheetErr', e.toString());
        }

        // --- 2. Slack Alert ---
        const slackMsg =
            `🔔 *Shannon — Bondsman Callback Requested*\n` +
            `📞 *Caller:* ${data.caller_name} — ${data.caller_phone}\n` +
            `👤 *Defendant:* ${data.defendant_name || 'Not provided'}\n` +
            `📍 *County:* ${data.county || 'Not specified'}\n` +
            (data.notes ? `📝 *Notes:* ${data.notes}\n` : '') +
            `⏰ *Time:* ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`;

        _shannon_notifySlack(slackMsg);

        // --- 3. Return message for Shannon to read ---
        return {
            success: true,
            message: `I've passed your information to our bondsman team. ` +
                `Someone will be calling you back at ${data.caller_phone} very shortly — ` +
                `usually within a few minutes. They'll have all the details we discussed. ` +
                `Is there anything else I can help you with while you wait?`
        };

    } catch (error) {
        SN_log('Shannon_PathA_Error', error.toString());
        return {
            success: false,
            message: "I've noted your information. A bondsman will be calling you back very shortly."
        };
    }
}

