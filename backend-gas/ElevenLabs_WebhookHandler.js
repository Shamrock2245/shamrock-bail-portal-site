/**
 * ElevenLabs_WebhookHandler.js
 * Handles incoming webhooks from ElevenLabs Conversational AI.
 */

/**
 * Validates and routes ElevenLabs webhooks.
 * @param {object} e - The event parameter from doPost
 * @returns {ContentService.TextOutput}
 */
function handleElevenLabsWebhookSOC2(e) {
    // 1. Validate Signature (HMAC)
    // verifyWebhookSignature() is defined in Compliance.js and is already used by
    // SignNow and Twilio handlers. Reuse it here with ELEVENLABS_WEBHOOK_SECRET.
    // If the secret is not yet set in Script Properties, the check is skipped with
    // a warning so the handler stays live during the activation window.
    const webhookSecret = (function () {
        try { return PropertiesService.getScriptProperties().getProperty('ELEVENLABS_WEBHOOK_SECRET'); }
        catch (_) { return null; }
    })();

    if (webhookSecret) {
        if (!verifyWebhookSignature(e, 'ELEVENLABS_WEBHOOK_SECRET', 'elevenlabs-signature')) {
            logSecurityEvent('ELEVENLABS_SIGNATURE_INVALID', { source: 'ElevenLabs' });
            return ContentService.createTextOutput('Invalid signature').setMimeType(ContentService.MimeType.TEXT);
        }
    } else {
        // Secret not yet configured — log a warning but continue (activation mode)
        Logger.log('⚠️ ELEVENLABS_WEBHOOK_SECRET not set. Signature check skipped.');
        logProcessingEvent('ELEVENLABS_WEBHOOK_NO_SECRET', { note: 'Set ELEVENLABS_WEBHOOK_SECRET in Script Properties to enforce HMAC.' });
    }

    let payload;
    try {
        payload = JSON.parse(e.postData.contents);
    } catch (err) {
        console.error("ElevenLabs Webhook JSON Error", err);
        return ContentService.createTextOutput("Invalid JSON").setMimeType(ContentService.MimeType.TEXT);
    }

    logProcessingEvent("ELEVENLABS_WEBHOOK_RECEIVED", { type: payload.type, agent_id: payload.agent_id });

    // 2. Route by Event Type
    if (payload.type === 'post_call_transcription') {
        // Idempotency: Skip duplicate post-call events
        if (payload.call_id && typeof IdempotencyGuard !== 'undefined' &&
            IdempotencyGuard.isDuplicate('elevenlabs_postcall', payload.call_id)) {
            return ContentService.createTextOutput('Duplicate post-call skipped').setMimeType(ContentService.MimeType.TEXT);
        }
        return handlePostCallTranscription(payload);
    }

    if (payload.type === 'call_initiation_failure') {
        return handleCallInitiationFailure(payload);
    }

    return ContentService.createTextOutput("Event ignored").setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Processor for Post-Call Transcriptions
 * Saves the conversation to the Lead/Defendant record.
 */
function handlePostCallTranscription(payload) {
    const transcript = payload.transcription; // Array of { role: 'user'|'agent', message, time_in_call_secs }
    const metadata = payload.call_metadata;
    const analysis = payload.analysis; // summary, success_evaluation, etc.

    // Convert transcript to readable string
    let fullText = `Call ID: ${payload.call_id}\nDate: ${new Date(payload.call_timestamp * 1000).toISOString()}\n\n`;

    if (analysis) {
        fullText += `--- ANALYSIS ---\nSummary: ${analysis.call_summary}\nOutcome: ${analysis.call_successful}\n\n`;
    }

    if (transcript && Array.isArray(transcript)) {
        transcript.forEach(turn => {
            fullText += `[${turn.role.toUpperCase()}]: ${turn.message}\n`;
        });
    }

    // Match transcript to an existing Intake record via phone number in call_metadata
    // ElevenLabs populates call_metadata.caller_id or custom_parameters.phone
    const callerPhone = (metadata && (metadata.caller_id || (metadata.custom_parameters && metadata.custom_parameters.phone))) || null;
    let matchedCaseId = null;

    if (callerPhone) {
        try {
            const normalizedPhone = callerPhone.replace(/\D/g, '').slice(-10);
            const ss = SpreadsheetApp.openById(
                PropertiesService.getScriptProperties().getProperty('INTAKE_SHEET_ID')
            );
            const sheet = ss.getSheetByName('IntakeQueue');
            if (sheet) {
                const data = sheet.getDataRange().getValues();
                const headers = data[0].map(h => String(h).toLowerCase());
                const phoneCol = headers.findIndex(h => h.includes('phone'));
                const caseCol = headers.findIndex(h => h.includes('caseid') || h.includes('case_id'));
                if (phoneCol > -1 && caseCol > -1) {
                    for (let r = 1; r < data.length; r++) {
                        const rowPhone = String(data[r][phoneCol]).replace(/\D/g, '').slice(-10);
                        if (rowPhone === normalizedPhone) {
                            matchedCaseId = data[r][caseCol];
                            break;
                        }
                    }
                }
            }
        } catch (matchErr) {
            Logger.log('\u26a0\ufe0f ElevenLabs phone match failed (non-fatal): ' + matchErr.message);
        }
    }

    // Slack notification with case link if matched
    if (typeof NotificationService !== 'undefined') {
        const caseRef = matchedCaseId ? ' | Case: ' + matchedCaseId : '';
        NotificationService.sendSlack(
            '#ai-conversations',
            '\uD83C\uDFA4 *New AI Conversation*' + caseRef + '\n\n' + (analysis ? analysis.call_summary : '(No summary)')
        );
    }

    // ── Save to Google Sheets: ShannonCallLog tab ─────────────────────────────
    // PRIMARY human-readable log. Find it at:
    //   Google Sheets → (SPREADSHEET_ID) → tab "ShannonCallLog"
    // Columns: Timestamp | Call ID | Caller Phone | Matched Case ID | Duration (s)
    //          | Outcome | AI Summary | Paperwork Sent | Full Transcript
    try {
        const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') ||
            PropertiesService.getScriptProperties().getProperty('INTAKE_SHEET_ID');
        if (ssId) {
            const ss = SpreadsheetApp.openById(ssId);
            let logSheet = ss.getSheetByName('ShannonCallLog');
            if (!logSheet) {
                logSheet = ss.insertSheet('ShannonCallLog');
                logSheet.appendRow([
                    'Timestamp', 'Call ID', 'Caller Phone', 'Matched Case ID',
                    'Duration (s)', 'Outcome', 'AI Summary', 'Paperwork Sent', 'Full Transcript'
                ]);
                logSheet.getRange(1, 1, 1, 9)
                    .setFontWeight('bold')
                    .setBackground('#1a472a')
                    .setFontColor('#ffffff');
                logSheet.setFrozenRows(1);
                logSheet.setColumnWidth(9, 600); // wide column for transcript text
            }
            const durationSecs = payload.call_duration_secs || payload.duration_seconds || '';
            const outcome = analysis
                ? (analysis.call_successful === true ? 'Success'
                    : analysis.call_successful === false ? 'Unsuccessful'
                        : String(analysis.call_successful || 'Unknown'))
                : 'Unknown';
            const summary = analysis ? (analysis.call_summary || '') : '';
            // Detect if paperwork was dispatched during this call
            let paperworkSent = 'No';
            if (payload.tool_calls && Array.isArray(payload.tool_calls)) {
                paperworkSent = payload.tool_calls.some(function (t) {
                    return t.tool_name === 'send_paperwork';
                }) ? 'Yes' : 'No';
            }
            logSheet.appendRow([
                new Date(),
                payload.call_id || '',
                callerPhone || '',
                matchedCaseId || '',
                durationSecs,
                outcome,
                summary,
                paperworkSent,
                fullText
            ]);
            Logger.log('\u2705 Shannon call logged to ShannonCallLog | Call: ' + payload.call_id);
        }
    } catch (sheetErr) {
        Logger.log('\u26a0\ufe0f ShannonCallLog sheet write failed (non-fatal): ' + sheetErr.message);
    }

    // ── Save to Google Drive (full-text backup) ────────────────────────────────
    const folderId = PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_FOLDER_ID');
    if (folderId) {
        try {
            const folder = DriveApp.getFolderById(folderId);
            const fileName = 'AI_Call_' + payload.call_id + (matchedCaseId ? '_' + matchedCaseId : '') + '.txt';
            folder.createFile(fileName, fullText);
            Logger.log('\u2705 Shannon call archived to Drive: ' + fileName);
        } catch (driveErr) {
            Logger.log('\u26a0\ufe0f Drive archive failed (non-fatal): ' + driveErr.message);
        }
    }

    return ContentService.createTextOutput('Transcription processed').setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Processor for Call Initiation Failures
 * Logs failures to Slack for monitoring.
 */
function handleCallInitiationFailure(payload) {
    const errorDetails = payload.failure_reason || "Unknown reason";
    const metadata = payload.call_metadata;

    if (typeof NotificationService !== 'undefined') {
        NotificationService.sendSlack('#alerts', `⚠️ *AI Call Failed to Initiate*\nReason: ${errorDetails}\nCall ID: ${payload.call_id}`);
    }

    return ContentService.createTextOutput("Failure logged").setMimeType(ContentService.MimeType.TEXT);
}

// =============================================================================
// MID-CALL WEBHOOK TOOLS
// Called by ElevenLabs agent during a live conversation.
// Route: ?source=elevenlabs_tool&tool=<tool_name>
// =============================================================================

/**
 * Routes mid-call tool requests from the ElevenLabs agent.
 * Each tool has its own URL: exec?source=elevenlabs_tool&tool=lookup_defendant
 * ElevenLabs POSTs { "defendant_name": "...", ... } as the body.
 * Must return JSON — the agent reads the response to continue the conversation.
 */
function handleElevenLabsToolCall(e) {
    var toolName = e.parameter.tool || 'unknown';

    var payload;
    try {
        payload = JSON.parse(e.postData.contents);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error', message: 'Invalid JSON'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    Logger.log('🔧 ElevenLabs Tool Call: ' + toolName + ' | Params: ' + JSON.stringify(payload));

    // Idempotency: Prevent duplicate tool actions (e.g. double-SMS)
    // Uses a composite key of tool name + phone + 5-minute window
    if (typeof IdempotencyGuard !== 'undefined') {
        var toolPhone = payload.caller_phone || payload.phone_number || payload.phone || '';
        var toolWindow = Math.floor(Date.now() / 300000); // 5-minute buckets
        var toolIdempKey = IdempotencyGuard.compositeKey(toolName, toolPhone, toolWindow);
        if (toolPhone && IdempotencyGuard.isDuplicate('elevenlabs_tool', toolIdempKey, 600)) {
            Logger.log('⚡ Idempotency: Duplicate tool call skipped [' + toolName + '] phone=' + toolPhone);
            return ContentService.createTextOutput(JSON.stringify({
                status: 'skipped', message: 'Duplicate tool call detected'
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }

    try {
        switch (toolName) {
            case 'lookup_defendant':
                return toolLookupDefendant(payload);
            case 'create_intake':
                return toolCreateIntake(payload);
            case 'calculate_premium':
                return toolCalculatePremium(payload);
            case 'send_payment_link':
                return toolSendPaymentLink(payload);
            case 'schedule_callback':
                return toolScheduleCallback(payload);
            case 'transfer_to_bondsman':
                return toolTransferToBondsman(payload);
            case 'check_inmate_status':
                return toolCheckInmateStatus(payload);
            case 'send_directions':
                return toolSendDirections(payload);
            case 'send_sms':
                return toolSendSMS(payload);
            default:
                return ContentService.createTextOutput(JSON.stringify({
                    status: 'error', message: 'Unknown tool: ' + toolName
                })).setMimeType(ContentService.MimeType.JSON);
        }
    } catch (err) {
        Logger.log('❌ Tool error: ' + err.message);
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error', message: err.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Tool: lookup_defendant
 * Searches IntakeQueue and Bookings sheets for a defendant by name or booking number.
 * Returns case details the agent can relay to the caller.
 *
 * Expected params: { "defendant_name": "John Smith" } or { "booking_number": "25001234" }
 */
function toolLookupDefendant(params) {
    var name = (params.defendant_name || '').trim().toLowerCase();
    var bookingNum = (params.booking_number || '').trim();

    if (!name && !bookingNum) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'not_found',
            message: 'No defendant name or booking number provided.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.openById(
        PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
    );

    // 1. Search IntakeQueue
    var match = null;
    var sheet = ss.getSheetByName('IntakeQueue');
    if (sheet && sheet.getLastRow() > 1) {
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        for (var r = data.length - 1; r >= 1; r--) {
            var row = data[r];
            var getValue = function (keys) {
                for (var k = 0; k < keys.length; k++) {
                    var idx = colIdx[keys[k].toLowerCase()];
                    if (idx !== undefined && row[idx]) return String(row[idx]);
                }
                return '';
            };

            var defName = getValue(['DefName', 'Def Name', 'defname', 'Defendant Name']).toLowerCase();
            var caseNum = getValue(['CaseNumber', 'Case Number', 'casenumber']);

            // Match by name (fuzzy) or booking number (exact)
            var nameMatch = name && defName && (defName.indexOf(name) > -1 || name.indexOf(defName) > -1);
            var bookingMatch = bookingNum && caseNum && caseNum.indexOf(bookingNum) > -1;

            if (nameMatch || bookingMatch) {
                match = {
                    defendant_name: getValue(['DefName', 'Def Name', 'defname', 'Defendant Name']),
                    charges: getValue(['Charges', 'charges', 'DefCharges']),
                    bond_amount: getValue(['BondAmt', 'Bond Amount', 'bondamt']),
                    facility: getValue(['DefFacility', 'Facility', 'Jail', 'facility']),
                    status: getValue(['Status', 'status']) || 'Active',
                    case_number: caseNum,
                    court_date: getValue(['CourtDate', 'Court Date', 'courtdate']),
                    indemnitor_name: getValue(['IndName', 'Ind Name', 'indname']),
                    indemnitor_phone: getValue(['IndPhone', 'Ind Phone', 'indphone'])
                };
                break;
            }
        }
    }

    if (match) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'found',
            source: 'intake_queue',
            is_prior_client: false,
            defendant: match
        })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Search Historical Bond Reports (prior clients)
    if (name) {
        try {
            var histSheet = ss.getSheetByName('Historical Bond Reports');
            if (histSheet && histSheet.getLastRow() > 1) {
                var histData = histSheet.getDataRange().getValues();
                var histHeaders = histData[0];
                var hIdx = {};
                histHeaders.forEach(function (h, i) { hIdx[String(h).toLowerCase().trim()] = i; });

                // Build search terms — split name into parts for matching
                var nameParts = name.split(/\s+/);

                for (var hr = histData.length - 1; hr >= 1; hr--) {
                    var hRow = histData[hr];
                    var hGetVal = function (keys) {
                        for (var k = 0; k < keys.length; k++) {
                            var idx = hIdx[keys[k].toLowerCase()];
                            if (idx !== undefined && hRow[idx]) return String(hRow[idx]);
                        }
                        return '';
                    };

                    var hFirst = hGetVal(['first name', 'first_name', 'firstname']).toLowerCase();
                    var hLast = hGetVal(['last name', 'last_name', 'lastname']).toLowerCase();
                    var hFull = (hFirst + ' ' + hLast).trim();

                    // Match: full name contains search OR search contains full name
                    var histNameMatch = false;
                    if (hFull && name) {
                        histNameMatch = (hFull.indexOf(name) > -1 || name.indexOf(hFull) > -1);
                    }
                    // Also try last name + first name partial
                    if (!histNameMatch && nameParts.length >= 2 && hLast && hFirst) {
                        histNameMatch = nameParts.some(function (p) { return p === hLast; }) &&
                            nameParts.some(function (p) { return p === hFirst || hFirst.indexOf(p) === 0; });
                    }

                    if (histNameMatch) {
                        match = {
                            defendant_name: hGetVal(['first name', 'first_name', 'firstname']) + ' ' + hGetVal(['last name', 'last_name', 'lastname']),
                            bond_amount: hGetVal(['bond amount', 'bond_amount', 'bondamt', 'bond']),
                            charges: hGetVal(['charges', 'charge', 'offense']),
                            facility: hGetVal(['facility', 'jail', 'county']),
                            county: hGetVal(['county']),
                            bond_date: hGetVal(['date', 'bond date', 'bond_date', 'created']),
                            status: 'Prior Client',
                            indemnitor_name: hGetVal(['indemnitor', 'indemnitor name', 'cosigner']),
                            indemnitor_phone: hGetVal(['indemnitor phone', 'cosigner phone', 'phone'])
                        };
                        break;
                    }
                }

                if (match) {
                    return ContentService.createTextOutput(JSON.stringify({
                        status: 'found',
                        source: 'historical_bond_reports',
                        is_prior_client: true,
                        defendant: match,
                        message: 'This person is a prior client. We have handled a bond for them previously.'
                    })).setMimeType(ContentService.MimeType.JSON);
                }
            }
        } catch (histErr) {
            Logger.log('Historical bond lookup failed (non-fatal): ' + histErr.message);
        }
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'not_found',
        is_prior_client: false,
        message: 'No records found for ' + (name || bookingNum) + '. This may be a new case.'
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: create_intake
 * Creates a new row in IntakeQueue from info gathered during the AI call.
 * Called mid-call so the agent can confirm "I've started your case file."
 *
 * Expected params: {
 *   "defendant_name": "...",
 *   "caller_name": "...",
 *   "caller_phone": "...",
 *   "charges": "...",
 *   "facility": "...",
 *   "bond_amount": "...",
 *   "notes": "..."
 * }
 */
function toolCreateIntake(params) {
    var defName = (params.defendant_name || '').trim();
    var callerName = (params.caller_name || '').trim();
    var callerPhone = (params.caller_phone || '').trim();

    if (!defName) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Defendant name is required to create an intake.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.openById(
        PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
    );
    var sheet = ss.getSheetByName('IntakeQueue');
    if (!sheet) {
        sheet = ss.insertSheet('IntakeQueue');
        sheet.appendRow(['Timestamp', 'Source', 'DefName', 'Charges', 'DefFacility', 'BondAmt',
            'IndName', 'IndPhone', 'Status', 'Notes']);
        sheet.setFrozenRows(1);
    }

    var caseRef = 'AI-' + new Date().getTime().toString(36).toUpperCase();

    sheet.appendRow([
        new Date(),
        'ElevenLabs After-Hours',
        defName,
        params.charges || '',
        params.facility || '',
        params.bond_amount || '',
        callerName,
        callerPhone,
        'New - AI Intake',
        (params.notes || '') + ' | Ref: ' + caseRef
    ]);

    // Slack alert
    try {
        var config = getConfig();
        var slackChannel = config.SLACK_WEBHOOK_INTAKE || config.SLACK_WEBHOOK_SHAMROCK;
        if (slackChannel && typeof sendSlackMessage === 'function') {
            sendSlackMessage(slackChannel,
                '🤖 *AI After-Hours Intake Created*\n' +
                '• Defendant: ' + defName + '\n' +
                '• Charges: ' + (params.charges || 'TBD') + '\n' +
                '• Facility: ' + (params.facility || 'TBD') + '\n' +
                '• Caller: ' + (callerName || 'Unknown') + ' ' + (callerPhone || '') + '\n' +
                '• Ref: ' + caseRef,
                null
            );
        }
    } catch (slackErr) {
        Logger.log('Slack alert failed (non-fatal): ' + slackErr.message);
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'created',
        case_reference: caseRef,
        message: 'Intake record created for ' + defName + '. Reference: ' + caseRef
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: calculate_premium
 * Gives the caller an instant bail bond premium estimate.
 * Wraps the existing calculatePremium() from Telegram_InlineQuote.js.
 *
 * Expected params: { "bail_amount": "5000", "charge_count": "2", "county": "lee" }
 */
function toolCalculatePremium(params) {
    var bailAmount = parseFloat(params.bail_amount) || 0;
    var chargeCount = parseInt(params.charge_count) || 1;
    var county = (params.county || '').trim();

    if (bailAmount <= 0) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'A valid bail amount is required to calculate the premium.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    // Reuse the existing premium calculator
    var result = calculatePremium(bailAmount, chargeCount, county);

    return ContentService.createTextOutput(JSON.stringify({
        status: 'calculated',
        bail_amount: bailAmount,
        charge_count: chargeCount,
        county: county || 'not specified',
        premium: result.premium,
        transfer_fee: result.transferFee,
        total_due: result.totalDue,
        breakdown: result.breakdown.join('; '),
        message: 'The estimated premium is $' + result.totalDue + '. ' + result.breakdown.join('. ') + '. This is an estimate and the final amount may vary based on case details.'
    })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// CONVERSATION INITIATION CLIENT DATA WEBHOOK
// ============================================================================

/**
 * handleElevenLabsConversationInit
 * Fires at the START of every inbound call. ElevenLabs sends:
 *   { caller_id, agent_id, called_number, call_sid }
 *
 * We look up the caller's phone in IntakeQueue and return dynamic variables
 * so the agent can personalize the greeting.
 *
 * Response format:
 * {
 *   "type": "conversation_initiation_client_data",
 *   "dynamic_variables": { ... },
 *   "conversation_config_override": { ... }
 * }
 */
function handleElevenLabsConversationInit(e) {
    // Top-level safety net — ALWAYS return a valid response
    try {
        return _doConversationInit(e);
    } catch (fatalErr) {
        Logger.log('🚨 ConvInit FATAL: ' + fatalErr.message);
        // Return default greeting so the call still works
        return ContentService.createTextOutput(JSON.stringify({
            type: 'conversation_initiation_client_data',
            dynamic_variables: { caller_name: '', has_existing_case: 'no' },
            conversation_config_override: {
                agent: { first_message: 'Thank you for calling Shamrock Bail Bonds. My name is Shannon. How can I help you today?' }
            }
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/** Internal handler — separated so the outer wrapper can catch any throw */
function _doConversationInit(e) {
    // 1. Parse payload — try JSON body first, then fall back to query params
    var payload = {};
    if (e && e.postData && e.postData.contents) {
        try {
            payload = JSON.parse(e.postData.contents);
        } catch (err) {
            Logger.log('⚠️ ConvInit: JSON parse failed, trying query params. Error: ' + err.message);
        }
    }

    // Fall back to query parameters (ElevenLabs may send caller_id etc. as URL params)
    if (!payload.caller_id && e && e.parameter) {
        payload.caller_id = e.parameter.caller_id || '';
        payload.call_sid = e.parameter.call_sid || '';
        payload.called_number = e.parameter.called_number || '';
        payload.agent_id = e.parameter.agent_id || '';
    }

    var callerId = (payload.caller_id || '').replace(/\D/g, ''); // strip to digits
    var callSid = payload.call_sid || '';
    var calledNumber = payload.called_number || '';

    Logger.log('📞 ConvInit webhook fired | Caller: ' + callerId + ' | SID: ' + callSid);

    // Default dynamic variables for unknown callers
    var dynamicVars = {
        caller_name: '',
        caller_phone: callerId,
        has_existing_case: 'no',
        case_status: '',
        defendant_name: '',
        case_reference: '',
        last_contact: '',
        call_sid: callSid
    };

    var firstMessage = "Thank you for calling Shamrock Bail Bonds. My name is Shannon. How can I help you today?";

    // TODO: Re-enable personalized lookup once we add CacheService or a warm-keep trigger.
    // SpreadsheetApp.openById() takes 3-7s cold start, which exceeds ElevenLabs timeout.
    // For now, return default greeting instantly.
    // The caller info is still available in dynamic_variables for the agent's context.
    /*
    if (callerId.length >= 10) {
        try {
            var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
            var ss = SpreadsheetApp.openById(ssId);
            ... (lookup logic preserved in git)
        } catch (err) { }
    }
    */

    var response = {
        type: 'conversation_initiation_client_data',
        dynamic_variables: dynamicVars,
        conversation_config_override: {
            agent: {
                first_message: firstMessage
            }
        }
    };

    Logger.log('📤 ConvInit response: ' + JSON.stringify(response));

    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================================
// NEW MID-CALL TOOLS (Phase 7.5)
// Added: March 2026
// =============================================================================

/**
 * Tool: send_payment_link
 * Sends the SwipeSimple payment link to the caller via SMS.
 *
 * Expected params: { "caller_phone": "...", "defendant_name": "...", "bond_amount": "..." }
 */
function toolSendPaymentLink(params) {
    var callerPhone = (params.caller_phone || '').trim();
    var defName = (params.defendant_name || '').trim();
    var bondAmount = (params.bond_amount || '').trim();

    if (!callerPhone) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'A phone number is required to send the payment link.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var config = getConfig();
    var paymentLink = config.PAYMENT_LINK || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';

    var smsBody = '💳 Shamrock Bail Bonds — Payment Link\n\n' +
        (defName ? 'Re: ' + defName + '\n' : '') +
        (bondAmount ? 'Bond Amount: $' + bondAmount + '\n' : '') +
        '\nPay securely here:\n' + paymentLink +
        '\n\nQuestions? Call (239) 332-2245';

    var smsResult = sendSmsViaTwilio(callerPhone, smsBody);

    // Slack notification
    try {
        if (typeof sendSlackMessage === 'function') {
            var slackChannel = config.SLACK_WEBHOOK_SHAMROCK || config.SLACK_WEBHOOK_GENERAL;
            if (slackChannel) {
                sendSlackMessage(slackChannel,
                    '💳 *Payment Link Sent via Shannon*\n' +
                    '• To: ' + callerPhone + '\n' +
                    '• Defendant: ' + (defName || 'N/A') + '\n' +
                    '• Bond: $' + (bondAmount || 'TBD'),
                    null
                );
            }
        }
    } catch (slackErr) {
        Logger.log('Slack alert failed (non-fatal): ' + slackErr.message);
    }

    if (smsResult && smsResult.success) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'sent',
            payment_link: paymentLink,
            message: 'I just sent a secure payment link to your phone. You should receive a text message in the next few seconds with a link to make your payment online.'
        })).setMimeType(ContentService.MimeType.JSON);
    } else {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'I was unable to send the text message right now. You can make a payment directly at swipesimple.com or call us at 239-332-2245 and we can process it over the phone.'
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Tool: schedule_callback
 * Logs a callback request to the CallbackQueue sheet and alerts staff.
 *
 * Expected params: { "caller_name": "...", "caller_phone": "...", "preferred_time": "...", "notes": "..." }
 */
function toolScheduleCallback(params) {
    var callerName = (params.caller_name || '').trim();
    var callerPhone = (params.caller_phone || '').trim();
    var preferredTime = (params.preferred_time || '').trim();
    var notes = (params.notes || '').trim();

    if (!callerPhone) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'A phone number is required to schedule a callback.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var callbackRef = 'CB-' + new Date().getTime().toString(36).toUpperCase();

    // Write to CallbackQueue sheet
    try {
        var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
        if (ssId) {
            var ss = SpreadsheetApp.openById(ssId);
            var sheet = ss.getSheetByName('CallbackQueue');
            if (!sheet) {
                sheet = ss.insertSheet('CallbackQueue');
                sheet.appendRow(['Timestamp', 'Ref', 'Caller Name', 'Caller Phone', 'Preferred Time', 'Notes', 'Status']);
                sheet.getRange(1, 1, 1, 7)
                    .setFontWeight('bold')
                    .setBackground('#1a472a')
                    .setFontColor('#ffffff');
                sheet.setFrozenRows(1);
            }
            sheet.appendRow([
                new Date(),
                callbackRef,
                callerName || 'Unknown',
                callerPhone,
                preferredTime || 'ASAP',
                notes,
                'Pending'
            ]);
        }
    } catch (sheetErr) {
        Logger.log('CallbackQueue sheet write failed (non-fatal): ' + sheetErr.message);
    }

    // Slack alert
    try {
        var config = getConfig();
        var slackChannel = config.SLACK_WEBHOOK_INTAKE || config.SLACK_WEBHOOK_SHAMROCK;
        if (slackChannel && typeof sendSlackMessage === 'function') {
            sendSlackMessage(slackChannel,
                '📞 *Callback Requested via Shannon*\n' +
                '• Caller: ' + (callerName || 'Unknown') + '\n' +
                '• Phone: ' + callerPhone + '\n' +
                '• Preferred Time: ' + (preferredTime || 'ASAP') + '\n' +
                '• Notes: ' + (notes || 'None') + '\n' +
                '• Ref: ' + callbackRef,
                null
            );
        }
    } catch (slackErr) {
        Logger.log('Slack callback alert failed (non-fatal): ' + slackErr.message);
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'scheduled',
        callback_ref: callbackRef,
        message: 'I have scheduled a callback for you. A licensed bondsman will call you ' +
            (preferredTime ? 'at ' + preferredTime : 'as soon as possible') +
            '. Your reference number is ' + callbackRef + '.'
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: transfer_to_bondsman
 * Alerts the on-call bondsman via Slack + SMS. Shannon provides a hold message.
 * NOTE: Does NOT perform a live SIP transfer — that requires ElevenLabs Twilio config.
 *
 * Expected params: { "caller_phone": "...", "reason": "..." }
 */
function toolTransferToBondsman(params) {
    var callerPhone = (params.caller_phone || '').trim();
    var reason = (params.reason || 'Caller requested live agent').trim();

    var config = getConfig();

    // Send Slack alert to staff
    try {
        var slackChannel = config.SLACK_WEBHOOK_SHAMROCK || config.SLACK_WEBHOOK_GENERAL;
        if (slackChannel && typeof sendSlackMessage === 'function') {
            sendSlackMessage(slackChannel,
                '🚨 *URGENT — Live Transfer Request*\n' +
                '• Caller: ' + (callerPhone || 'Unknown') + '\n' +
                '• Reason: ' + reason + '\n' +
                '• Action: Call this person back IMMEDIATELY.\n' +
                '• Source: Shannon (AI After-Hours Agent)',
                null
            );
        }
    } catch (slackErr) {
        Logger.log('Slack transfer alert failed (non-fatal): ' + slackErr.message);
    }

    // SMS the on-call agent
    var onCallPhone = '';
    try {
        onCallPhone = PropertiesService.getScriptProperties().getProperty('ON_CALL_AGENT_PHONE') || '';
    } catch (_) { }

    if (onCallPhone) {
        try {
            sendSmsViaTwilio(onCallPhone,
                '🚨 URGENT: Caller ' + (callerPhone || 'unknown') + ' needs a bondsman NOW.\n' +
                'Reason: ' + reason + '\n' +
                'Please call them back immediately. — Shannon AI'
            );
        } catch (smsErr) {
            Logger.log('On-call SMS failed (non-fatal): ' + smsErr.message);
        }
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'transfer_requested',
        message: 'I have notified our on-call bondsman and they will be calling you right back at this number. ' +
            'Please keep your phone nearby. If you do not receive a call within 5 minutes, ' +
            'please call us directly at 239-332-2245.'
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: check_inmate_status
 * Searches for a defendant in the system AND enriches with county-specific jail info.
 *
 * Expected params: { "defendant_name": "...", "county": "..." }
 */
function toolCheckInmateStatus(params) {
    var defName = (params.defendant_name || '').trim();
    var county = (params.county || '').trim().toLowerCase().replace(' county', '');

    if (!defName && !county) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Please provide a defendant name or county to check inmate status.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Try to find in our system first (reuses toolLookupDefendant logic)
    var systemResult = null;
    if (defName) {
        try {
            var lookupResponse = toolLookupDefendant({ defendant_name: defName });
            var lookupData = JSON.parse(lookupResponse.getContent());
            if (lookupData.status === 'found') {
                systemResult = lookupData.defendant;
            }
        } catch (lookupErr) {
            Logger.log('System lookup failed (non-fatal): ' + lookupErr.message);
        }
    }

    // 2. Get county-specific info from directory
    var countyInfo = null;
    if (county) {
        countyInfo = getCountyDirectory_()[county] || null;
    }

    // Build response
    var responseData = {
        status: systemResult ? 'found_in_system' : 'not_in_system',
        defendant: systemResult || null,
        county_info: countyInfo || null,
        message: ''
    };

    if (systemResult) {
        responseData.message = 'I found ' + systemResult.defendant_name + ' in our system. ' +
            'Status: ' + (systemResult.status || 'Active') + '. ' +
            (systemResult.facility ? 'Facility: ' + systemResult.facility + '. ' : '') +
            (systemResult.charges ? 'Charges: ' + systemResult.charges + '. ' : '') +
            (systemResult.bond_amount ? 'Bond amount: $' + systemResult.bond_amount + '.' : '');
    } else {
        responseData.message = defName
            ? 'I don\'t have ' + defName + ' in our system yet, which means we may not have started their case. '
            : '';
    }

    if (countyInfo) {
        responseData.message += ' For ' + countyInfo.name + ' County: ';
        if (countyInfo.jail_phone) responseData.message += 'The jail phone number is ' + countyInfo.jail_phone + '. ';
        if (countyInfo.booking_search) responseData.message += 'You can also search their online booking portal. ';
        if (countyInfo.tips) responseData.message += countyInfo.tips;
    } else if (county) {
        responseData.message += 'We cover all 67 Florida counties. You can call the jail directly or check their online booking portal for current inmate information. Our main number is 239-332-2245.';
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: send_directions
 * Texts the jail or courthouse address for a Florida county.
 *
 * Expected params: { "county": "...", "destination_type": "jail"|"courthouse", "caller_phone": "..." }
 */
function toolSendDirections(params) {
    var county = (params.county || '').trim().toLowerCase().replace(' county', '');
    var destType = (params.destination_type || 'jail').trim().toLowerCase();
    var callerPhone = (params.caller_phone || '').trim();

    if (!county) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Please tell me which county you need directions to.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!callerPhone) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'A phone number is required to send directions.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var countyInfo = getCountyDirectory_()[county];

    if (!countyInfo) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'county_not_found',
            message: 'I don\'t have the exact address for that county on file right now, but we cover all 67 Florida counties. ' +
                'Call us at 239-332-2245 and an agent can provide directions.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var address = '';
    var label = '';
    if (destType === 'courthouse' && countyInfo.courthouse) {
        address = countyInfo.courthouse;
        label = countyInfo.name + ' County Courthouse';
    } else if (countyInfo.jail_address) {
        address = countyInfo.jail_address;
        label = countyInfo.name + ' County Jail';
    } else {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'address_not_available',
            message: 'I don\'t have the ' + destType + ' address for ' + countyInfo.name + ' County on file. ' +
                (countyInfo.jail_phone ? 'You can call the jail at ' + countyInfo.jail_phone + ' for directions.' : 'Call us at 239-332-2245 for help.')
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var mapsLink = 'https://maps.google.com/?q=' + encodeURIComponent(address);

    var smsBody = '📍 Shamrock Bail Bonds — Directions\n\n' +
        label + '\n' +
        address + '\n\n' +
        'Google Maps: ' + mapsLink + '\n\n' +
        (countyInfo.jail_phone ? 'Jail Phone: ' + countyInfo.jail_phone + '\n' : '') +
        'Questions? Call (239) 332-2245';

    var smsResult = sendSmsViaTwilio(callerPhone, smsBody);

    if (smsResult && smsResult.success) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'sent',
            address: address,
            google_maps_link: mapsLink,
            message: 'I just texted you the address and a Google Maps link for the ' + label + '. ' +
                'The address is ' + address + '.'
        })).setMimeType(ContentService.MimeType.JSON);
    } else {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'sms_failed',
            address: address,
            google_maps_link: mapsLink,
            message: 'I wasn\'t able to send the text right now, but let me give you the address verbally. ' +
                'The ' + label + ' is at ' + address + '.'
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Tool: send_sms
 * Sends a custom text message to a phone number via Twilio.
 * Used by the agent to text court dates, directions, confirmations, etc.
 *
 * Expected params: { "to_phone": "...", "message": "..." }
 */
function toolSendSMS(params) {
    var toPhone = (params.to_phone || params.caller_phone || '').trim();
    var message = (params.message || '').trim();

    if (!toPhone) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'A phone number is required to send a text message.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!message) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'A message body is required.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    // Safety: cap message length and add branding
    if (message.length > 1500) {
        message = message.substring(0, 1500) + '...';
    }

    // Prepend branding if not already present
    if (message.indexOf('Shamrock') === -1) {
        message = '🍀 Shamrock Bail Bonds\n\n' + message;
    }

    // Append footer
    message += '\n\nQuestions? Call (239) 332-2245';

    // Daily rate limit check (prevent runaway usage)
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var cache = CacheService.getScriptCache();
    var cacheKey = 'sms_count_' + today;
    var dailyCount = parseInt(cache.get(cacheKey) || '0');

    if (dailyCount >= 75) {
        Logger.log('⚠️ SMS daily rate limit reached: ' + dailyCount);
        return ContentService.createTextOutput(JSON.stringify({
            status: 'rate_limited',
            message: 'I\'m unable to send additional text messages right now. Please try again later or call us at 239-332-2245.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var smsResult = sendSmsViaTwilio(toPhone, message);

    if (smsResult && smsResult.success) {
        // Increment daily counter (expires in 24h)
        cache.put(cacheKey, String(dailyCount + 1), 86400);

        // Log to sheet
        try {
            var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
            if (ssId) {
                var ss = SpreadsheetApp.openById(ssId);
                var logSheet = ss.getSheetByName('ShannonCallLog');
                if (logSheet) {
                    // Append a lightweight log entry
                    logSheet.appendRow([
                        new Date(),
                        'SMS-TOOL',
                        toPhone,
                        '',
                        '',
                        'SMS Sent',
                        message.substring(0, 200),
                        'N/A',
                        'Agent sent SMS to ' + toPhone
                    ]);
                }
            }
        } catch (logErr) {
            Logger.log('SMS log write failed (non-fatal): ' + logErr.message);
        }

        return ContentService.createTextOutput(JSON.stringify({
            status: 'sent',
            message: 'I just sent that information to your phone via text message. You should receive it in the next few seconds.'
        })).setMimeType(ContentService.MimeType.JSON);
    } else {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'I wasn\'t able to send the text right now. Let me give you the information verbally instead.'
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// =============================================================================
// COUNTY DIRECTORY (hardcoded from Shannon Knowledge Base for sub-second response)
// =============================================================================

/**
 * Returns a lookup map of Florida county info.
 * Keys are lowercase county names (without " county").
 * @private
 */
function getCountyDirectory_() {
    return {
        'alachua': {
            name: 'Alachua', facility: 'Alachua County Jail', jail_phone: '352.491.4444',
            jail_address: '3333 NE 39th Avenue, Gainesville, Florida 32609',
            courthouse: null, booking_search: 'https://acso.us', tips: null
        },
        'baker': {
            name: 'Baker', facility: 'Baker County Jail', jail_phone: '904.259.2231',
            jail_address: '1 Sheriff\'s Office Drive, Macclenny, Florida 32063',
            courthouse: null, booking_search: 'https://www.bakercountysheriffsoffice.com', tips: null
        },
        'bay': {
            name: 'Bay', facility: 'Bay County Jail', jail_phone: '850.785.5245',
            jail_address: '5700 Star Lane, Panama City, Florida 32404',
            courthouse: null, booking_search: 'https://www.baysomobile.org', tips: null
        },
        'bradford': {
            name: 'Bradford', facility: 'Bradford County Jail', jail_phone: '904.966.6178',
            jail_address: '945 A North Temple Avenue, Starke, Florida 32091',
            courthouse: null, booking_search: 'https://smartweb.bradfordsheriff.org', tips: null
        },
        'brevard': {
            name: 'Brevard', facility: 'Brevard County Jail', jail_phone: '321.690.1500',
            jail_address: '860 Camp Road, Cocoa, Florida 32927',
            courthouse: null, booking_search: 'https://www.brevardsheriff.com', tips: null
        },
        'broward': {
            name: 'Broward', facility: 'Broward Main Jail', jail_phone: '954.831.5900',
            jail_address: '555 SE 1st Avenue, Ft. Lauderdale, Florida 33301',
            courthouse: '201 SE 6th St, Fort Lauderdale, FL 33301',
            booking_search: 'https://www.sheriff.org',
            tips: 'Accepts e-affidavits. First Appearance held twice daily.'
        },
        'calhoun': {
            name: 'Calhoun', facility: 'Calhoun County Jail', jail_phone: '850.674.5049',
            jail_address: '20776 Central Avenue East, Blountstown, Florida 32424',
            courthouse: null, booking_search: null, tips: null
        },
        'charlotte': {
            name: 'Charlotte', facility: 'Charlotte County Jail', jail_phone: '941.833.6300',
            jail_address: '26601 Airport Road, Punta Gorda, Florida 33982',
            courthouse: '350 E Marion Ave, Punta Gorda, FL 33950',
            booking_search: 'https://www.ccso.org',
            tips: 'Charlotte requires original wet signatures. First Appearance at 1:30 PM.'
        },
        'citrus': {
            name: 'Citrus', facility: 'Citrus County Detention Facility', jail_phone: '352.527.3332',
            jail_address: '2604 W. Woodland Ridge Drive, Lecanto, Florida 34461',
            courthouse: null, booking_search: 'https://www.sheriffcitrus.org', tips: null
        },
        'clay': {
            name: 'Clay', facility: 'Clay County Jail', jail_phone: '904.529.5952',
            jail_address: '901 Orange Avenue, Green Cove Springs, Florida 32043',
            courthouse: null, booking_search: 'https://claysheriff.policetocitizen.com', tips: null
        },
        'collier': {
            name: 'Collier', facility: 'Naples Jail (Collier County Sheriff)', jail_phone: '239.252.9500',
            jail_address: '3347 Tamiami Trail East, Naples, Florida 34112',
            courthouse: '3315 Tamiami Trail E, Naples, FL 34112',
            booking_search: 'https://www2.colliersheriff.org',
            tips: 'Collier accepts Remote Posting (E-Bond). Releases usually 1-2 hours.'
        },
        'columbia': {
            name: 'Columbia', facility: 'Columbia County Jail', jail_phone: '386.755.7000',
            jail_address: '389 NW Quinten Street, Lake City, Florida 32055',
            courthouse: null, booking_search: null, tips: null
        },
        'desoto': {
            name: 'DeSoto', facility: 'DeSoto County Jail', jail_phone: '863.993.4710',
            jail_address: '208 East Cypress Street, Arcadia, Florida 34266',
            courthouse: null, booking_search: 'https://jail.desotosheriff.org', tips: null
        },
        'dixie': {
            name: 'Dixie', facility: 'Dixie County Jail', jail_phone: '352.498.1231',
            jail_address: '386 NE 255 Street, Cross City, Florida 32628',
            courthouse: null, booking_search: null, tips: null
        },
        'duval': {
            name: 'Duval', facility: 'Duval County Jail', jail_phone: '904.630.5787',
            jail_address: 'Multiple Locations, Jacksonville, Florida 32218',
            courthouse: null, booking_search: 'https://inmatesearch.jaxsheriff.org', tips: null
        },
        'escambia': {
            name: 'Escambia', facility: 'Escambia Main Jail', jail_phone: '850.436.9863',
            jail_address: '2935 North L Street, Pensacola, Florida 32501',
            courthouse: null, booking_search: 'https://inmatelookup.myescambia.com', tips: null
        },
        'flagler': {
            name: 'Flagler', facility: 'Flagler County Jail', jail_phone: '386.437.4116',
            jail_address: '1002 Justice Lane, Bunnell, Florida 32110',
            courthouse: null, booking_search: 'https://www.flaglersheriff.com', tips: null
        },
        'franklin': {
            name: 'Franklin', facility: 'Franklin County Jail', jail_phone: '850.670.8500',
            jail_address: '270 State Road 65, Eastpoint, Florida 32328',
            courthouse: null, booking_search: 'https://www.franklinsheriff.com', tips: null
        },
        'gadsden': {
            name: 'Gadsden', facility: 'Gadsden County Jail', jail_phone: '850.875.8844',
            jail_address: '339 East Jefferson Street, Quincy, Florida 32351',
            courthouse: null, booking_search: null, tips: null
        },
        'gilchrist': {
            name: 'Gilchrist', facility: 'Gilchrist County Jail', jail_phone: '352.463.3490',
            jail_address: '9239 South US Highway 129, Trenton, Florida 32693',
            courthouse: null, booking_search: null, tips: null
        },
        'glades': {
            name: 'Glades', facility: 'Glades County Jail', jail_phone: '863.946.1600',
            jail_address: '1297 East State Road 78, Moore Haven, Florida 33471',
            courthouse: '500 Ave J, Moore Haven, FL 33471',
            booking_search: 'https://smartweb.gladessheriff.org',
            tips: 'Detainees often housed in neighboring counties (Hendry/Okeechobee).'
        },
        'gulf': {
            name: 'Gulf', facility: 'Gulf County Jail', jail_phone: '850.227.1124',
            jail_address: '1000 Cecil G. Costin Sr. Boulevard, Port St. Joe, Florida 32456',
            courthouse: null, booking_search: 'https://www.gulfcounty-fl.gov', tips: null
        },
        'hamilton': {
            name: 'Hamilton', facility: 'Hamilton County Jail', jail_phone: '386.792.7131',
            jail_address: '3995 County Road 51 North, Jasper, Florida 32052',
            courthouse: null, booking_search: 'https://inmate.hamiltonsheriff.com', tips: null
        },
        'hardee': {
            name: 'Hardee', facility: 'Hardee County Jail', jail_phone: '863.773.0304',
            jail_address: '900 East Summit Street, Wauchula, Florida 33873',
            courthouse: null, booking_search: 'https://www.hardeeso.com', tips: null
        },
        'hendry': {
            name: 'Hendry', facility: 'Hendry County Jail', jail_phone: '863.674.5600',
            jail_address: '101 South Bridge Street, Labelle, Florida 33935',
            courthouse: '25 E Hickpochee Ave, LaBelle, FL 33935',
            booking_search: 'https://www.hendrysheriff.org',
            tips: 'Physical processing only. Paper bonds. Allow extra travel time.'
        },
        'hernando': {
            name: 'Hernando', facility: 'Hernando County Jail', jail_phone: '352.544.2334',
            jail_address: '16425 Spring Hill Drive, Brooksville, Florida 34604',
            courthouse: null, booking_search: 'https://www.hernandosheriff.org', tips: null
        },
        'highlands': {
            name: 'Highlands', facility: 'Highlands County Jail', jail_phone: '863.402.7201',
            jail_address: '434 Fernleaf Avenue, Sebring, Florida 33870',
            courthouse: null, booking_search: 'https://www.highlandsheriff.org', tips: null
        },
        'hillsborough': {
            name: 'Hillsborough', facility: 'Hillsborough County Jail', jail_phone: '813.247.8300',
            jail_address: '1201 Orient Road, Tampa, Florida 33619',
            courthouse: '800 E Twiggs St, Tampa, FL 33602',
            booking_search: 'https://www.hcso.tampa.fl.us',
            tips: 'Uses the Fast Release digital portal.'
        },
        'holmes': {
            name: 'Holmes', facility: 'Holmes County Jail', jail_phone: '850.547.3681',
            jail_address: '3207 Lonny Lindsey Drive, Bonifay, Florida 32425',
            courthouse: null, booking_search: 'https://www.holmescoso.org', tips: null
        },
        'indian river': {
            name: 'Indian River', facility: 'Indian River County Jail', jail_phone: '772.569.6700',
            jail_address: '4055 41st Avenue, Vero Beach, Florida 32960',
            courthouse: null, booking_search: 'https://www.ircsheriff.org', tips: null
        },
        'jackson': {
            name: 'Jackson', facility: 'Jackson County Jail', jail_phone: '850.482.9651',
            jail_address: '2737 Penn Avenue, Marianna, Florida 32448',
            courthouse: null, booking_search: 'https://www.jacksoncountysheriffsoffice.com', tips: null
        },
        'jefferson': {
            name: 'Jefferson', facility: 'Jefferson County Jail', jail_phone: '850.997.5094',
            jail_address: '171 Industrial Park Road, Monticello, Florida 32344',
            courthouse: null, booking_search: 'https://www.jeffersoncountysheriffsoffice.com', tips: null
        },
        'lafayette': {
            name: 'Lafayette', facility: 'Lafayette County Jail', jail_phone: '386.294.1301',
            jail_address: '231 NW Monroe Avenue, Mayo, Florida 32066',
            courthouse: null, booking_search: 'https://lafayettesheriff.com', tips: null
        },
        'lake': {
            name: 'Lake', facility: 'Lake County Jail', jail_phone: '352.343.9501',
            jail_address: '551 West Main Street, Tavares, Florida 32778',
            courthouse: null, booking_search: 'https://www.lcso.org', tips: null
        },
        'lee': {
            name: 'Lee', facility: 'Lee County Jail', jail_phone: '239.477.1500',
            jail_address: '14750 Six Mile Cypress Parkway, Fort Myers, Florida 33912',
            courthouse: '1700 Monroe St, Fort Myers, FL 33901',
            booking_search: 'https://www.sheriffleefl.org',
            tips: 'Wait times can be 2-4 hours after bond is posted. First Appearance daily at 9 AM.'
        },
        'leon': {
            name: 'Leon', facility: 'Leon County Jail', jail_phone: '850.606.3500',
            jail_address: '535 Appleyard Drive, Tallahassee, Florida 32304',
            courthouse: null, booking_search: 'https://www.leoncountyso.com', tips: null
        },
        'levy': {
            name: 'Levy', facility: 'Levy County Jail', jail_phone: '352.486.5121',
            jail_address: '9150 NE 80th Avenue, Bronson, Florida 32621',
            courthouse: null, booking_search: 'https://www.levyso.com', tips: null
        },
        'liberty': {
            name: 'Liberty', facility: 'Liberty County Jail', jail_phone: '850.643.2235',
            jail_address: '12832 NW Central Avenue, Bristol, Florida 32321',
            courthouse: null, booking_search: 'https://www.libertysheriff.org', tips: null
        },
        'madison': {
            name: 'Madison', facility: 'Madison County Jail', jail_phone: '850.973.4151',
            jail_address: '823 Pinckney Street, Madison, Florida 32340',
            courthouse: null, booking_search: 'https://www.madisonso.com', tips: null
        },
        'manatee': {
            name: 'Manatee', facility: 'Manatee County Jail', jail_phone: '941.747.3011',
            jail_address: '14470 Harlee Road, Palmetto, Florida 34221',
            courthouse: null, booking_search: 'https://www.manateesheriff.com', tips: null
        },
        'marion': {
            name: 'Marion', facility: 'Marion County Jail', jail_phone: '352.351.8077',
            jail_address: '700 NW 30th Avenue, Ocala, Florida 34475',
            courthouse: null, booking_search: 'https://www.marionso.com', tips: null
        },
        'martin': {
            name: 'Martin', facility: 'Martin County Jail', jail_phone: '772.220.7000',
            jail_address: '800 SE Monterey Road, Stuart, Florida 34994',
            courthouse: null, booking_search: 'https://www.sheriff.martin.fl.us', tips: null
        },
        'miami-dade': {
            name: 'Miami-Dade', facility: 'Miami-Dade County Jail', jail_phone: '786.263.7000',
            jail_address: '1321 NW 13th Street, Miami, Florida 33125',
            courthouse: null, booking_search: 'https://www.miamidade.gov', tips: null
        },
        'monroe': {
            name: 'Monroe', facility: 'Monroe County Jail', jail_phone: '305.292.7000',
            jail_address: '5525 College Road, Key West, Florida 33040',
            courthouse: null, booking_search: 'https://www.keysso.net', tips: null
        },
        'nassau': {
            name: 'Nassau', facility: 'Nassau County Jail', jail_phone: '904.548.4002',
            jail_address: '76212 Nicholas Cutinha Road, Yulee, Florida 32097',
            courthouse: null, booking_search: 'https://www.nassauso.com', tips: null
        },
        'okaloosa': {
            name: 'Okaloosa', facility: 'Okaloosa County Jail', jail_phone: '850.689.5690',
            jail_address: '1200 East James Lee Boulevard, Crestview, Florida 32539',
            courthouse: null, booking_search: 'https://www.okaloosasheriff.com', tips: null
        },
        'okeechobee': {
            name: 'Okeechobee', facility: 'Okeechobee County Jail', jail_phone: '863.763.3117',
            jail_address: '504 NW 4th Street, Okeechobee, Florida 34972',
            courthouse: null, booking_search: 'https://www.okeechobeecountysheriff.com', tips: null
        },
        'orange': {
            name: 'Orange', facility: 'Orange County Jail', jail_phone: '407.836.3400',
            jail_address: '3723 Vision Boulevard, Orlando, Florida 32839',
            courthouse: '425 N Orange Ave, Orlando, FL 32801',
            booking_search: 'https://netapps.ocfl.net',
            tips: 'Must present Power of Attorney physically. Release is slow (6-10 hours).'
        },
        'osceola': {
            name: 'Osceola', facility: 'Osceola County Jail', jail_phone: '407.742.4444',
            jail_address: '402 Simpson Road, Kissimmee, Florida 34744',
            courthouse: null, booking_search: 'https://www.osceolasheriff.org', tips: null
        },
        'palm beach': {
            name: 'Palm Beach', facility: 'Palm Beach County Jail', jail_phone: '561.688.4400',
            jail_address: '3228 Gun Club Road, West Palm Beach, Florida 33406',
            courthouse: '205 N Dixie Hwy, West Palm Beach, FL 33401',
            booking_search: 'https://www.pbso.org',
            tips: 'Indemnitors must be approved via PBSO visual verification (Zoom or In-Person).'
        },
        'pasco': {
            name: 'Pasco', facility: 'Pasco County Jail', jail_phone: '800.854.2862',
            jail_address: '20101 Central Boulevard, Land O\'Lakes, Florida 34637',
            courthouse: null, booking_search: 'https://www.pascosheriff.com', tips: null
        },
        'pinellas': {
            name: 'Pinellas', facility: 'Pinellas County Jail', jail_phone: '727.582.6200',
            jail_address: '14400 49th Street North, Clearwater, Florida 33762',
            courthouse: null, booking_search: 'https://www.pcsoweb.com',
            tips: 'Strictly digital for agents. No physical signature required at jail.'
        },
        'polk': {
            name: 'Polk', facility: 'Polk County Jail', jail_phone: '863.534.6123',
            jail_address: '2390 Bob Phillips Road, Bartow, Florida 33830',
            courthouse: null, booking_search: 'https://www.polksheriff.org',
            tips: 'Paper bonds standard. ID must match perfectly.'
        },
        'putnam': {
            name: 'Putnam', facility: 'Putnam County Jail', jail_phone: '386.329.0854',
            jail_address: '130 Orie Griffin Boulevard, Palatka, Florida 32177',
            courthouse: null, booking_search: 'https://www.putnamsheriff.org', tips: null
        },
        'st. johns': {
            name: 'St. Johns', facility: 'St. Johns County Jail', jail_phone: '904.824.8304',
            jail_address: '3955 Lewis Speedway, St. Augustine, Florida 32084',
            courthouse: null, booking_search: 'https://www.sjso.org', tips: null
        },
        'st. lucie': {
            name: 'St. Lucie', facility: 'St. Lucie County Jail', jail_phone: '772.462.3450',
            jail_address: '900 North Rock Road, Fort Pierce, Florida 34945',
            courthouse: null, booking_search: 'https://www.stluciesheriff.com', tips: null
        },
        'santa rosa': {
            name: 'Santa Rosa', facility: 'Santa Rosa County Jail', jail_phone: '850.983.1100',
            jail_address: '5755 East Milton Road, Milton, Florida 32583',
            courthouse: null, booking_search: 'https://www.santarosasheriff.org', tips: null
        },
        'sarasota': {
            name: 'Sarasota', facility: 'Sarasota County Jail', jail_phone: '941.861.4165',
            jail_address: '2020 Main Street, Sarasota, Florida 34237',
            courthouse: null, booking_search: 'https://www.sarasotasheriff.org',
            tips: 'E-Bonds accepted for low-level offenses. Releases take 4-6 hours.'
        },
        'seminole': {
            name: 'Seminole', facility: 'Seminole County Jail', jail_phone: '407.665.1200',
            jail_address: '211 Bush Boulevard, Sanford, Florida 32773',
            courthouse: null, booking_search: 'https://www.seminolesheriff.org', tips: null
        },
        'sumter': {
            name: 'Sumter', facility: 'Sumter County Jail', jail_phone: '352.793.0225',
            jail_address: '219 East Anderson Avenue, Bushnell, Florida 33513',
            courthouse: null, booking_search: 'https://www.sumtercountysheriff.org', tips: null
        },
        'suwannee': {
            name: 'Suwannee', facility: 'Suwannee County Jail', jail_phone: '386.364.3776',
            jail_address: '200 South Ohio Avenue, Live Oak, Florida 32064',
            courthouse: null, booking_search: 'https://www.suwanneesheriff.com', tips: null
        },
        'taylor': {
            name: 'Taylor', facility: 'Taylor County Jail', jail_phone: '850.584.4333',
            jail_address: '589 East US Highway 27, Perry, Florida 32347',
            courthouse: null, booking_search: 'https://www.taylorsheriff.org', tips: null
        },
        'union': {
            name: 'Union', facility: 'Union County Jail', jail_phone: '386.496.2501',
            jail_address: '50 NW 1st Street, Lake Butler, Florida 32054',
            courthouse: null, booking_search: 'https://www.unionsheriff.us', tips: null
        },
        'volusia': {
            name: 'Volusia', facility: 'Volusia County Jail', jail_phone: '386.254.1555',
            jail_address: '1354 Indian Lake Road, Daytona Beach, Florida 32124',
            courthouse: null, booking_search: 'https://www.volusiasheriff.org', tips: null
        },
        'wakulla': {
            name: 'Wakulla', facility: 'Wakulla County Jail', jail_phone: '850.745.7100',
            jail_address: '15 Oak Street, Crawfordville, Florida 32327',
            courthouse: null, booking_search: 'https://www.wakullasheriff.com', tips: null
        },
        'walton': {
            name: 'Walton', facility: 'Walton County Jail', jail_phone: '850.892.8111',
            jail_address: '796 Triple G Road, DeFuniak Springs, Florida 32433',
            courthouse: null, booking_search: 'https://www.waltonso.org', tips: null
        },
        'washington': {
            name: 'Washington', facility: 'Washington County Jail', jail_phone: '850.638.6110',
            jail_address: '1293 Jackson Avenue, Chipley, Florida 32428',
            courthouse: null, booking_search: 'https://www.wcso.us', tips: null
        }
    };
}
