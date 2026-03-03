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

    // Save to Google Drive (Archive)
    const folderId = PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_FOLDER_ID');
    if (folderId) {
        try {
            const folder = DriveApp.getFolderById(folderId);
            const fileName = 'AI_Call_' + payload.call_id + (matchedCaseId ? '_' + matchedCaseId : '') + '.txt';
            folder.createFile(fileName, fullText);
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

    try {
        switch (toolName) {
            case 'lookup_defendant':
                return toolLookupDefendant(payload);
            case 'create_intake':
                return toolCreateIntake(payload);
            case 'calculate_premium':
                return toolCalculatePremium(payload);
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
            defendant: match
        })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'not_found',
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
