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
        try {
            return handlePostCallTranscription(payload);
        } catch (postErr) {
            Logger.log('ElevenLabs post-call processing error (returning 200): ' + postErr.message);
            return ContentService.createTextOutput('Transcription received').setMimeType(ContentService.MimeType.TEXT);
        }
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

    // Slack notification with case link, evals, and extracted fields
    if (typeof NotificationService !== 'undefined') {
        const caseRef = matchedCaseId ? ' | Case: ' + matchedCaseId : '';
        const summary = (analysis && (analysis.call_summary || analysis.transcript_summary)) || '(No summary)';
        let evalLine = '';
        const evals = analysis && analysis.evaluation_criteria_results;
        if (evals && typeof evals === 'object') {
            const bits = [];
            Object.keys(evals).forEach(function (k) {
                const r = evals[k] && evals[k].result;
                if (r) bits.push(k + '=' + r);
            });
            if (bits.length) evalLine = '\nEvals: ' + bits.join(', ');
        }
        let collectedLine = '';
        const collected = analysis && analysis.data_collection_results;
        if (collected && typeof collected === 'object') {
            const bits = [];
            Object.keys(collected).forEach(function (k) {
                const v = collected[k] && collected[k].value;
                if (v !== undefined && v !== null && String(v) !== '') bits.push(k + '=' + v);
            });
            if (bits.length) collectedLine = '\nFields: ' + bits.join(', ');
        }
        NotificationService.sendSlack(
            '#ai-conversations',
            '\uD83C\uDFA4 *Shannon call*' + caseRef + '\n\n' + summary + evalLine + collectedLine
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
            var paperworkTools = {
                send_paperwork: true,
                email_paperwork_to_indemnitor: true
            };
            if (payload.tool_calls && Array.isArray(payload.tool_calls)) {
                paperworkSent = payload.tool_calls.some(function (t) {
                    var n = (t && (t.tool_name || t.name)) || '';
                    return !!paperworkTools[n];
                }) ? 'Yes' : 'No';
            }
            if (paperworkSent !== 'Yes' && analysis && analysis.data_collection_results) {
                var packetField = analysis.data_collection_results.packet_sent;
                if (packetField && (packetField.value === true || packetField.value === 'true' || packetField.value === 'Yes')) {
                    paperworkSent = 'Yes';
                }
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

    // ── Save conversation memory to Mem0 ──────────────────────────────────────
    // This powers Shannon's "I remember you called last week" recognition.
    // Non-fatal — a Mem0 failure never breaks call logging.
    if (callerPhone) {
        try {
            const memoryFacts = {
                call_date: new Date().toDateString(),
                outcome: outcome,
                call_summary: analysis ? (analysis.call_summary || '') : '',
                defendant_name: matchedCaseId ? 'Case #' + matchedCaseId : '',
                paperwork_sent: paperworkSent
            };
            saveMem0Memory_(callerPhone, memoryFacts);
        } catch (mem0Err) {
            Logger.log('⚠️ Mem0 save failed (non-fatal): ' + mem0Err.message);
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
// CALLER CONTEXT & MEM0 MEMORY
// Powers Shannon's "I remember you" recognition across all calls.
// =============================================================================

/**
 * GAS route handler for ?source=caller_context&phone=<digits>
 * Called by the Netlify edge function (elevenlabs-init.js) at call start.
 * Returns a flat JSON object with case context for this caller.
 */
function handleCallerContextLookup(e) {
    var phone = (e.parameter && e.parameter.phone) ? e.parameter.phone : '';
    var result = getCallerContext_(phone);
    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fast case context lookup by indemnitor phone number.
 * Uses CacheService (5-min TTL) so repeated calls within 5 minutes
 * never touch Sheets — eliminating the SpreadsheetApp cold-start problem.
 *
 * @param {string} phone - Raw phone string (will be normalized to 10 digits)
 * @returns {object} Flat context object
 */
function getCallerContext_(phone) {
    var normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    var emptyResult = {
        has_existing_case: 'no',
        caller_name: '',
        case_status: '',
        defendant_name: '',
        bond_amount: '',
        court_date: '',
        case_reference: ''
    };

    if (!normalizedPhone || normalizedPhone.length < 7) return emptyResult;

    // ── CacheService check (5-min TTL for hits, 1-min for misses) ────────────
    var cache = CacheService.getScriptCache();
    var cacheKey = 'CALLER_CTX_' + normalizedPhone;
    try {
        var cached = cache.get(cacheKey);
        if (cached) {
            Logger.log('⚡ CacheHit: caller_context for ' + normalizedPhone);
            return JSON.parse(cached);
        }
    } catch (cacheErr) {
        Logger.log('Cache read failed (non-fatal): ' + cacheErr.message);
    }

    // ── Sheets lookup ─────────────────────────────────────────────────────────
    try {
        var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
        if (!ssId) return emptyResult;

        var ss = SpreadsheetApp.openById(ssId);

        // Search IntakeQueue first (active cases)
        var sheet = ss.getSheetByName('IntakeQueue');
        if (sheet && sheet.getLastRow() > 1) {
            var data = sheet.getDataRange().getValues();
            var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
            var colIdx = {};
            headers.forEach(function (h, i) { colIdx[h] = i; });

            var getValue = function (row, keys) {
                for (var k = 0; k < keys.length; k++) {
                    var idx = colIdx[keys[k].toLowerCase()];
                    if (idx !== undefined && row[idx]) return String(row[idx]);
                }
                return '';
            };

            // Scan from bottom → most recent match wins
            for (var r = data.length - 1; r >= 1; r--) {
                var row = data[r];
                var rowPhone = getValue(row, ['indphone', 'ind phone', 'caller_phone', 'phone'])
                    .replace(/\D/g, '').slice(-10);

                if (rowPhone && rowPhone === normalizedPhone) {
                    var result = {
                        has_existing_case: 'yes',
                        caller_name: getValue(row, ['indname', 'ind name', 'caller_name', 'caller name']),
                        case_status: getValue(row, ['status']),
                        defendant_name: getValue(row, ['defname', 'def name', 'defendant name']),
                        bond_amount: getValue(row, ['bondamt', 'bond amount', 'bond_amt']),
                        court_date: getValue(row, ['courtdate', 'court date', 'court_date']),
                        case_reference: getValue(row, ['casenumber', 'case number', 'caseid', 'case_id', 'case id'])
                    };
                    try { cache.put(cacheKey, JSON.stringify(result), 300); } catch (_) { }
                    Logger.log('✅ getCallerContext_: found match in IntakeQueue for ' + normalizedPhone);
                    return result;
                }
            }
        }
    } catch (err) {
        Logger.log('⚠️ getCallerContext_ Sheets error (non-fatal): ' + err.message);
    }

    // No match — cache miss result for 1 min to avoid hammering Sheets
    try { cache.put(cacheKey, JSON.stringify(emptyResult), 60); } catch (_) { }
    return emptyResult;
}

/**
 * Saves a post-call memory to Mem0 for this caller's phone number.
 * Called after each Shannon call so future calls get recognized.
 *
 * @param {string} phone - Raw phone string
 * @param {object} facts - Key facts to remember: { call_summary, outcome, defendant_name, ... }
 */
function redactMem0Text_(text) {
    var out = String(text || '');
    out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    out = out.replace(/\b\d{3}\s\d{2}\s\d{4}\b/g, '[SSN]');
    out = out.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[CARD]');
    return out;
}

function saveMem0Memory_(phone, facts) {
    var apiKey = PropertiesService.getScriptProperties().getProperty('MEMO_API_KEY');
    if (!apiKey || !phone) return;

    var normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (!normalizedPhone || normalizedPhone.length < 7) return;

    // Build a natural-language memory string Mem0 can index
    var memoryText = 'Caller called Shamrock Bail Bonds on ' + facts.call_date + ' and spoke with AI Agent Shannon. ';
    if (facts.defendant_name) memoryText += 'Regarding: ' + facts.defendant_name + '. ';
    if (facts.outcome) memoryText += 'Outcome: ' + facts.outcome + '. ';
    if (facts.call_summary) memoryText += 'Summary: ' + facts.call_summary.slice(0, 400) + '. ';
    if (facts.paperwork_sent === 'Yes') memoryText += 'Paperwork was sent during this call.';
    memoryText = redactMem0Text_(memoryText);

    try {
        var response = UrlFetchApp.fetch('https://api.mem0.ai/v1/memories/', {
            method: 'post',
            headers: {
                'Authorization': 'Token ' + apiKey,
                'Content-Type': 'application/json'
            },
            payload: JSON.stringify({
                messages: [
                    { role: 'user', content: 'I need help with a bail bond.' },
                    { role: 'assistant', content: memoryText }
                ],
                user_id: normalizedPhone,
                metadata: {
                    category: 'call_history',
                    source: 'webhook',
                    agent_involved: 'shannon'
                },
                enable_graph: true
            }),
            muteHttpExceptions: true
        });
        Logger.log('✅ Mem0 memory saved | user_id=' + normalizedPhone + ' | status=' + response.getResponseCode());
    } catch (mem0Err) {
        Logger.log('⚠️ Mem0 saveMem0Memory_ failed (non-fatal): ' + mem0Err.message);
    }
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
    var toolName = (e && e.parameter && e.parameter.tool) || 'unknown';

    var payload;
    try {
        var rawBody = (e && e.postData && e.postData.contents) || '';
        if (!String(rawBody).trim()) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error', message: shannonSafeToolMessage_()
            })).setMimeType(ContentService.MimeType.JSON);
        }
        payload = shannonUnwrapToolPayload_(JSON.parse(rawBody));
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error', message: 'I did not catch that. Please say the name or number again.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    Logger.log('ElevenLabs Tool Call: ' + toolName);

    // Idempotency only for outbound contact tools. Paperwork saves and lookups
    // must be allowed repeatedly during a Shannon interview.
    var outboundTools = {
        send_sms: true,
        send_payment_link: true,
        send_directions: true,
        email_paperwork_to_indemnitor: true,
        send_paperwork: true,
        request_id_photo: true,
        schedule_office_visit: true
    };
    if (outboundTools[toolName] && typeof IdempotencyGuard !== 'undefined') {
        var toolPhone = payload.caller_phone || payload.phone_number || payload.phone || payload.indemnitor_email || '';
        var toolWindow = Math.floor(Date.now() / 300000);
        var toolIdempKey = IdempotencyGuard.compositeKey(toolName, toolPhone, toolWindow);
        if (toolPhone && IdempotencyGuard.isDuplicate('elevenlabs_tool', toolIdempKey, 600)) {
            Logger.log('⚡ Idempotency: Duplicate tool call skipped [' + toolName + ']');
            return ContentService.createTextOutput(JSON.stringify({
                status: 'skipped', message: 'That message was already sent a moment ago.'
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }

    try {
        switch (toolName) {
            case 'lookup_defendant':
                return toolLookupDefendant(payload);
            case 'create_intake':
                return toolCreateIntake(payload);
            case 'save_paperwork_answers':
                return toolSavePaperworkAnswers(payload);
            case 'email_paperwork_to_indemnitor':
            case 'send_paperwork':
                return toolEmailPaperworkToIndemnitor(payload);
            case 'request_id_photo':
                return toolRequestIdPhoto(payload);
            case 'check_id_upload':
                return toolCheckIdUpload(payload);
            case 'notify_bondsman':
                var notified = handleShannonNotifyBondsman(payload);
                return ContentService.createTextOutput(JSON.stringify(notified))
                    .setMimeType(ContentService.MimeType.JSON);
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
            case 'check_client_account':
            case 'pull_court_dates':
                return toolCheckClientAccount(payload);
            case 'schedule_office_visit':
                return toolScheduleOfficeVisit(payload);
            case 'send_sms':
                return toolSendSMS(payload);
            case 'check_caller_history':
                return toolCheckCallerHistory(payload);
            default:
                return ContentService.createTextOutput(JSON.stringify({
                    status: 'error', message: 'Unknown tool: ' + toolName
                })).setMimeType(ContentService.MimeType.JSON);
        }

    } catch (err) {
        Logger.log('Tool error [' + toolName + ']: ' + err.message);
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error', message: shannonSafeToolMessage_()
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
    params = params || {};
    var name = (params.defendant_name || '').trim().toLowerCase();
    var bookingNum = (params.booking_number || params.case_number || '').trim();
    var callerPhone = params.caller_phone || params.phone || '';

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

            var nameMatch = name && defName && shannonPersonNamesMatch_(name, defName);
            var bookingMatch = bookingNum && caseNum && shannonCaseNumbersMatch_(bookingNum, caseNum);

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
            defendant: shannonRedactDefendantForVoice_(match, callerPhone)
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

                    var histNameMatch = shannonPersonNamesMatch_(name, hFull);
                    if (!histNameMatch && nameParts.length >= 2 && hLast && hFirst) {
                        histNameMatch = shannonPersonNamesMatch_(name, hFirst + ' ' + hLast);
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
                    match.is_prior_client = true;
                    return ContentService.createTextOutput(JSON.stringify({
                        status: 'found',
                        source: 'historical_bond_reports',
                        is_prior_client: true,
                        defendant: shannonRedactDefendantForVoice_(match, callerPhone),
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
    params = params || {};
    var defName = (params.defendant_name || '').trim();
    var callerName = (params.caller_name || params.indemnitor_name || '').trim();
    var callerPhone = (params.caller_phone || params.indemnitor_phone || '').trim();

    if (!defName) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Defendant name is required to create an intake.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    // Same key as ID upload / paperwork. Do not mint AI- timestamps — those
    // never match the SH-{phone}-{defendant} packet, so OCR cannot keep the
    // spelled last name. Never open SpreadsheetApp here (3–7s cold start 504s ElevenLabs).
    var caseRef = (typeof shannonCaseKey_ === 'function')
        ? shannonCaseKey_(params)
        : ('SH-' + String(callerPhone || '').replace(/\D/g, '').slice(-10) + '-' +
            defName.toUpperCase().replace(/\s+/g, '-').slice(0, 24));

    var crmOk = false;
    try {
        if (typeof shannonSyncIntakeToCrm_ === 'function') {
            var crmCode = shannonSyncIntakeToCrm_({
                case_reference: caseRef,
                caller_role: params.caller_role || '',
                defendant_name: defName,
                county: params.county || '',
                charges: params.charges || '',
                bond_amount: params.bond_amount || '',
                facility: params.facility || '',
                caller_name: callerName,
                caller_phone: callerPhone,
                indemnitor_name: params.indemnitor_name || callerName,
                indemnitor_email: params.indemnitor_email || params.caller_email || '',
                indemnitor_phone: params.indemnitor_phone || callerPhone,
                notes: params.notes || '',
                skip_match: true
            });
            crmOk = crmCode >= 200 && crmCode < 300;
        }
    } catch (crmSyncErr) {
        Logger.log('⚠️ Super CRM intake sync error (non-fatal): ' + crmSyncErr.message);
    }

    try {
        var config = getConfig();
        var slackChannel = config.SLACK_WEBHOOK_INTAKE || config.SLACK_WEBHOOK_SHAMROCK;
        if (slackChannel && typeof sendSlackMessage === 'function') {
            sendSlackMessage(slackChannel,
                '🎙 *Shannon intake created*\n' +
                '• Defendant: ' + defName + '\n' +
                '• Charges: ' + (params.charges || 'TBD') + '\n' +
                '• Facility: ' + (params.facility || 'TBD') + '\n' +
                '• Caller: ' + (callerName || 'Unknown') + ' ' + (callerPhone || '') + '\n' +
                '• Ref: `' + caseRef + '`\n' +
                '• CRM: ' + (crmOk ? 'saved' : 'miss — staff check Super CRM'),
                null
            );
        }
    } catch (slackErr) {
        Logger.log('Slack alert failed (non-fatal): ' + slackErr.message);
    }

    if (!crmOk) {
        try {
            notifyShannonStaffDesk_(
                '⚠️ Shannon intake CRM miss. ' + defName +
                (callerPhone ? ' caller ' + callerPhone : '') +
                ' ref ' + caseRef + '. Check Super CRM.',
                callerPhone
            );
        } catch (deskErr) {
            Logger.log('Shannon CRM-miss desk text failed (non-fatal): ' + deskErr.message);
        }
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: crmOk ? 'created' : 'created_local',
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
    params = params || {};
    var bailAmount = shannonParseMoney_(params.bail_amount || params.bond_amount);
    var chargeCount = shannonParseChargeCount_(params.charge_count);
    var countyEntry = resolveCountyDirectoryEntry_(params.county);
    var county = countyEntry ? countyEntry.key : String(params.county || '').trim();

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

/**
 * toolCheckCallerHistory
 * Tool called by the agent to check if a specific phone number has a history.
 * Checks IntakeQueue first, then Mem0 API for deeper context.
 */
function toolCheckCallerHistory(payload) {
    Logger.log('CALLING TOOL: check_caller_history');
    var callerPhone = payload.callerPhone || payload.caller_phone || '';

    // Normalize phone (strip non-digits)
    var numOnly = String(callerPhone).replace(/\D/g, '');
    if (numOnly.length >= 10) {
        numOnly = numOnly.slice(-10);
    }

    if (!numOnly || numOnly.length < 10) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'A valid 10-digit phone number is required.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var historyResult = {
        found: false,
        name: null,
        defendant: null,
        notes: null,
        mem0_context: null
    };

    // 1. Check IntakeQueue
    try {
        var intakeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('IntakeQueue');
        if (intakeSheet) {
            var data = intakeSheet.getDataRange().getValues();
            var headers = data[0];
            var colIndemnitorPhone = headers.indexOf('IndemnitorPhone');
            var colIndemnitorName = headers.indexOf('IndemnitorName');
            var colDefendantName = headers.indexOf('DefendantName');
            var colStatus = headers.indexOf('Status');

            // Search backwards (most recent first)
            for (var i = data.length - 1; i > 0; i--) {
                var rowPhone = String(data[i][colIndemnitorPhone]).replace(/\D/g, '');
                if (rowPhone.length >= 10 && rowPhone.slice(-10) === numOnly) {
                    historyResult.found = true;
                    historyResult.name = data[i][colIndemnitorName] || null;
                    historyResult.defendant = data[i][colDefendantName] || null;
                    historyResult.notes = "Found existing case (" + (data[i][colStatus] || 'Active') + ")";
                    break;
                }
            }
        }
    } catch (e) {
        Logger.log('Error checking IntakeQueue for history: ' + e.toString());
    }

    // 2. Check Mem0 API (search first, list fallback — same user_id as iMessage)
    try {
        var mem0ApiKey = PropertiesService.getScriptProperties().getProperty('MEMO_API_KEY');
        if (mem0ApiKey) {
            var mem0Headers = {
                'Authorization': 'Token ' + mem0ApiKey,
                'Content-Type': 'application/json'
            };
            var mem0Facts = [];
            var searchUrls = ['https://api.mem0.ai/v2/memories/search/', 'https://api.mem0.ai/v1/memories/search/'];
            var searchBodies = [
                { query: 'prior bail bond conversation', filters: { user_id: numOnly }, limit: 6 },
                { query: 'prior bail bond conversation', user_id: numOnly, limit: 6 }
            ];
            var s = 0;
            while (s < searchUrls.length && mem0Facts.length === 0) {
                var b = 0;
                while (b < searchBodies.length && mem0Facts.length === 0) {
                    try {
                        var searchRes = UrlFetchApp.fetch(searchUrls[s], {
                            method: 'post',
                            headers: mem0Headers,
                            payload: JSON.stringify(searchBodies[b]),
                            muteHttpExceptions: true
                        });
                        if (searchRes.getResponseCode() === 200 || searchRes.getResponseCode() === 201) {
                            var parsed = JSON.parse(searchRes.getContentText() || '{}');
                            var items = Array.isArray(parsed) ? parsed : (parsed.results || parsed.memories || parsed.data || []);
                            mem0Facts = items.map(function (m) {
                                return (m && (m.memory || m.text)) || '';
                            }).filter(function (t) { return t; });
                        }
                    } catch (_) { }
                    b++;
                }
                s++;
            }
            if (mem0Facts.length === 0) {
                var listRes = UrlFetchApp.fetch('https://api.mem0.ai/v1/memories/?user_id=' + numOnly + '&limit=6', {
                    method: 'GET',
                    headers: mem0Headers,
                    muteHttpExceptions: true
                });
                if (listRes.getResponseCode() === 200) {
                    var listData = JSON.parse(listRes.getContentText() || '[]');
                    var listItems = Array.isArray(listData) ? listData : (listData.results || listData.memories || []);
                    mem0Facts = listItems.map(function (m) {
                        return (m && (m.memory || m.text)) || '';
                    }).filter(function (t) { return t; });
                }
            }
            if (mem0Facts.length > 0) {
                historyResult.found = true;
                historyResult.mem0_context = mem0Facts.join('. ');
            }
        }
    } catch (e) {
        Logger.log('Error checking Mem0 for history: ' + e.toString());
    }

    // Build the agent response string
    var agentResponse = "";
    if (!historyResult.found) {
        agentResponse = "No history found for this caller.";
    } else {
        agentResponse = "HISTORY FOUND. \n";
        if (historyResult.name) agentResponse += "Caller Name: " + historyResult.name + "\n";
        if (historyResult.defendant) agentResponse += "Defendant they were helping: " + historyResult.defendant + "\n";
        if (historyResult.notes) agentResponse += "Status: " + historyResult.notes + "\n";
        if (historyResult.mem0_context) agentResponse += "Previous Call Notes (Mem0): " + historyResult.mem0_context + "\n";

        agentResponse += "\nIMPORTANT: Acknowledge that they have called before. If they previously asked about a specific defendant, ask if they are calling about them again. Do not invent history beyond these notes.";
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        caller_history: agentResponse
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
                agent: { first_message: 'Shamrock Bail Bonds! This is Shannon. How can I help today?' }
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

    var firstTails = [
        'How can I help today?',
        'How can I help you today?',
        'What can I do for you?',
        'How can I help?',
        "I'm here, how can I help?",
        'What can I help you with?'
    ];
    var firstMessage = 'Shamrock Bail Bonds! This is Shannon. ' +
        firstTails[Math.floor(Math.random() * firstTails.length)];

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

    var smsResult = (typeof sendShannonText_ === 'function')
        ? sendShannonText_(callerPhone, smsBody)
        : { success: false, error: 'BlueBubbles text helper not loaded' };

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
            message: 'I just texted a secure payment link to your phone. You should get it in a few seconds.'
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
    params = params || {};
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

    if (!params.skip_staff_text) {
        try {
            notifyShannonStaffDesk_(
                '☘️ Shannon callback ' + callbackRef + '. ' +
                (callerName || 'Caller') + ' ' + callerPhone +
                (preferredTime ? ' at ' + preferredTime : '') +
                '. Call them back. Office 239-332-2245.',
                callerPhone
            );
        } catch (deskErr) {
            Logger.log('Shannon callback desk text failed (non-fatal): ' + deskErr.message);
        }
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'scheduled',
        callback_ref: callbackRef,
        message: 'I have scheduled a callback for you. A licensed bondsman will call you ' +
            (preferredTime ? 'at ' + preferredTime : 'as soon as possible') +
            '. Your reference number is ' + callbackRef + '.'
    })).setMimeType(ContentService.MimeType.JSON);
}

function redirectLiveCallToOffice_(callSid, callerPhone) {
    var secret = '';
    try {
        secret = PropertiesService.getScriptProperties().getProperty('ELEVENLABS_TOOL_SECRET') || '';
    } catch (_) {}
    if (!secret) return { ok: false, error: 'missing_tool_secret' };
    var url = 'https://shamrock-telegram.netlify.app/api/twilio-transfer-office';
    try {
        var resp = UrlFetchApp.fetch(url, {
            method: 'post',
            contentType: 'application/json',
            headers: { 'X-API-Key': secret, 'X-Internal-Token': secret },
            payload: JSON.stringify({
                call_sid: callSid || '',
                caller_phone: callerPhone || '',
                reason: 'shannon_transfer'
            }),
            muteHttpExceptions: true,
            followRedirects: true
        });
        var body = {};
        try { body = JSON.parse(resp.getContentText() || '{}'); } catch (_) {}
        return {
            ok: resp.getResponseCode() >= 200 && resp.getResponseCode() < 300 && body.success === true,
            status: resp.getResponseCode(),
            body: body
        };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

/**
 * Tool: transfer_to_bondsman
 * Redirects the live Twilio call to 239-332-2245 and 239-955-0301 at the
 * same time (first staff pickup wins), then Slack + BlueBubbles. Native
 * ElevenLabs transfer_to_number does not work on the register-call path.
 *
 * Expected params: { "caller_phone": "...", "reason": "...", "call_sid": "CA..." }
 */
function toolTransferToBondsman(params) {
    var callerPhone = (params.caller_phone || params.caller_id || '').trim();
    var reason = (params.reason || 'Caller requested live agent').trim();
    var callSid = (params.call_sid || params.CallSid || params.callSid || '').trim();

    var live = redirectLiveCallToOffice_(callSid, callerPhone);
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
                '• Source: Shannon voice paperwork assistant',
                null
            );
        }
    } catch (slackErr) {
        Logger.log('Slack transfer alert failed (non-fatal): ' + slackErr.message);
    }

    try {
        notifyShannonStaffDesk_(
            '🚨 Shannon LIVE TRANSFER. Caller ' + (callerPhone || 'unknown') +
            '. ' + reason + '. Ringing 239-332-2245 and 239-955-0301. Call them back if it misses.',
            callerPhone
        );
    } catch (deskErr) {
        Logger.log('Shannon transfer desk text failed (non-fatal): ' + deskErr.message);
    }

    if (live.ok) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'connecting',
            result: 'Connecting you to the office at 239-332-2245 now. Please stay on the line.',
            message: 'Connecting you to the office at 239-332-2245 now. Please stay on the line.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'transfer_requested',
        result: 'I could not connect this live call automatically. You can reach our office at 239-332-2245. I have notified a bondsman, and they can call you back. Keep your phone nearby.',
        message: 'I could not connect this live call automatically. You can reach our office at 239-332-2245. I have notified a bondsman, and they can call you back. Keep your phone nearby.'
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: check_inmate_status
 * Searches for a defendant in the system AND enriches with county-specific jail info.
 *
 * Expected params: { "defendant_name": "...", "county": "..." }
 */
function toolCheckInmateStatus(params) {
    params = params || {};
    var defName = (params.defendant_name || '').trim();
    var county = (params.county || '').trim();

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
            var lookupResponse = toolLookupDefendant({
                defendant_name: defName,
                caller_phone: params.caller_phone || params.phone || ''
            });
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
        countyInfo = resolveCountyDirectoryEntry_(county);
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
        if (countyInfo.first_appearance) responseData.message += countyInfo.first_appearance + ' ';
        if (countyInfo.tips && (!countyInfo.first_appearance || countyInfo.tips !== countyInfo.first_appearance)) {
            responseData.message += countyInfo.tips;
        }
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
    params = params || {};
    var county = (params.county || '').trim();
    var destType = (params.destination_type || 'jail').trim().toLowerCase();
    var callerPhone = shannonNormalizePhone10_(params.caller_phone || params.phone || '');

    if (!county) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Please tell me which county you need directions to.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!callerPhone) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'I need a ten-digit mobile number to text directions.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var countyInfo = resolveCountyDirectoryEntry_(county);

    if (!countyInfo) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'county_not_found',
            message: 'I don\'t have the exact address for that county on file right now, but we cover all 67 Florida counties. ' +
                'Call us at 239-332-2245 and an agent can provide directions.'
        })).setMimeType(ContentService.MimeType.JSON);
    }


    var address = '';
    var label = '';
    if (destType === 'courthouse') {
        if (countyInfo.courthouse) {
            address = countyInfo.courthouse;
            label = countyInfo.name + ' County Courthouse';
        } else {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'address_not_available',
                first_appearance: countyInfo.first_appearance || '',
                message: 'I do not have the courthouse street address for ' + countyInfo.name +
                    ' County on file. ' + (countyInfo.first_appearance || '') +
                    ' Call 239-332-2245 and a bondsman can give you the courtroom door.'
            })).setMimeType(ContentService.MimeType.JSON);
        }
    } else if (countyInfo.jail_address) {
        address = countyInfo.jail_address;
        label = countyInfo.name + ' County Jail';
    } else {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'address_not_available',
            message: 'I don\'t have the jail address for ' + countyInfo.name + ' County on file. ' +
                (countyInfo.jail_phone ? 'You can call the jail at ' + countyInfo.jail_phone + ' for directions.' : 'Call us at 239-332-2245 for help.')
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var mapsLink = 'https://maps.google.com/?q=' + encodeURIComponent(address);

    var smsBody = 'Shamrock Bail Bonds — Directions\n\n' +
        label + '\n' +
        address + '\n\n' +
        'Google Maps: ' + mapsLink + '\n' +
        (destType === 'courthouse' && countyInfo.first_appearance ? countyInfo.first_appearance + '\n' : '') +
        (countyInfo.jail_phone ? 'Jail Phone: ' + countyInfo.jail_phone + '\n' : '') +
        'Questions? Call (239) 332-2245';

    var smsResult = (typeof sendShannonText_ === 'function')
        ? sendShannonText_(shannonE164_(callerPhone) || callerPhone, smsBody)
        : { success: false, error: 'BlueBubbles text helper not loaded' };

    if (smsResult && smsResult.success) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'sent',
            address: address,
            google_maps_link: mapsLink,
            first_appearance: countyInfo.first_appearance || '',
            message: 'I just texted you the address and a Google Maps link for the ' + label + '. ' +
                'The address is ' + address + '.' +
                (destType === 'courthouse' && countyInfo.first_appearance ? ' ' + countyInfo.first_appearance : '')
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
 * Tool: check_client_account
 * Customer Service Tool: Looks up balance, payment plans, court dates, and discharge status.
 *
 * Expected params: { "defendant_name": "...", "case_number": "...", "phone": "...", "caller_phone": "...", "query_type": "..." }
 */
function toolCheckClientAccount(params) {
    params = params || {};
    var defName = (params.defendant_name || '').trim();
    var caseNum = (params.case_number || params.booking_number || '').trim();
    var phone = shannonNormalizePhone10_(params.phone || params.caller_phone || '');
    var queryType = String(params.query_type || 'all').toLowerCase();

    if (!defName && !caseNum && !phone) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'not_found',
            message: 'To look up the account, I need the defendant full name, a case number, or the phone number on the file.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    if (defName && shannonNameTokens_(defName).length < 2 && !caseNum && !phone) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'not_found',
            message: 'Please give me the defendant first and last name so I pull the right file.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!ssId) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'I cannot reach the file system right now. Please call us at 239-332-2245.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var paymentLink = SHANNON_DEFAULT_PAYMENT_LINK;
    try {
        paymentLink = shannonPaymentLinkFromConfig_(getConfig());
    } catch (_) {}

    var ss = SpreadsheetApp.openById(ssId);
    var accountData = {
        defendant_name: defName,
        case_number: caseNum,
        court_date: null,
        court_time: null,
        court_location: null,
        courtroom: null,
        judge: null,
        discharge_status: null,
        discharge_date: null,
        total_bond: null,
        premium: null,
        amount_paid: null,
        remaining_balance: null,
        payment_link: paymentLink
    };

    var found = false;

    function rowMatchesPerson_(rowName, rowCase, rowPhone) {
        if (defName && rowName && shannonPersonNamesMatch_(defName, rowName)) return true;
        if (caseNum && rowCase && shannonCaseNumbersMatch_(caseNum, rowCase)) return true;
        if (phone && rowPhone && shannonNormalizePhone10_(rowPhone) === phone) return true;
        return false;
    }

    // 1. Search Upcoming Court Dates
    try {
        var cdSheet = ss.getSheetByName('Upcoming Court Dates') || ss.getSheetByName('CourtDates');
        if (cdSheet && cdSheet.getLastRow() > 1) {
            var cdValues = cdSheet.getDataRange().getValues();
            var nameCol = shannonFindHeaderIndex_(cdValues[0], ['defendant name', 'defname', 'def name']);
            var dateCol = shannonFindHeaderIndex_(cdValues[0], ['court date', 'date']);
            var timeCol = shannonFindHeaderIndex_(cdValues[0], ['court time', 'time']);
            var locCol = shannonFindHeaderIndex_(cdValues[0], ['location', 'courthouse']);
            var roomCol = shannonFindHeaderIndex_(cdValues[0], ['courtroom', 'room']);
            var judgeCol = shannonFindHeaderIndex_(cdValues[0], ['judge']);
            var caseCol = shannonFindHeaderIndex_(cdValues[0], ['case number', 'casenumber', 'case']);

            for (var r = cdValues.length - 1; r >= shannonSheetScanStart_(cdValues.length); r--) {
                var row = cdValues[r];
                var rowName = nameCol > -1 ? String(row[nameCol] || '') : '';
                var rowCase = caseCol > -1 ? String(row[caseCol] || '') : '';
                if (rowMatchesPerson_(rowName, rowCase, '')) {
                    accountData.defendant_name = rowName || accountData.defendant_name;
                    accountData.court_date = dateCol > -1 ? String(row[dateCol] || '') : '';
                    accountData.court_time = timeCol > -1 ? String(row[timeCol] || '') : '';
                    accountData.court_location = locCol > -1 ? String(row[locCol] || '') : '';
                    accountData.courtroom = roomCol > -1 ? String(row[roomCol] || '') : '';
                    accountData.judge = judgeCol > -1 ? String(row[judgeCol] || '') : '';
                    accountData.case_number = rowCase || accountData.case_number;
                    found = true;
                    break;
                }
            }
        }
    } catch (e) {
        Logger.log('Court date lookup error: ' + e.message);
    }

    // 2. Search Discharges tab
    try {
        var disSheet = ss.getSheetByName('Discharges');
        if (disSheet && disSheet.getLastRow() > 1) {
            var disValues = disSheet.getDataRange().getValues();
            var dNameCol = shannonFindHeaderIndex_(disValues[0], ['defendant name', 'defname', 'def name']);
            var dDateCol = shannonFindHeaderIndex_(disValues[0], ['discharge date', 'discharged', 'date']);
            var dCaseCol = shannonFindHeaderIndex_(disValues[0], ['case number', 'casenumber', 'case']);

            if (dNameCol > -1) {
                for (var dr = disValues.length - 1; dr >= shannonSheetScanStart_(disValues.length); dr--) {
                    var dRow = disValues[dr];
                    var dRowName = String(dRow[dNameCol] || '');
                    var dRowCase = dCaseCol > -1 ? String(dRow[dCaseCol] || '') : '';
                    if (rowMatchesPerson_(dRowName, dRowCase, '')) {
                        accountData.discharge_status = 'Discharged';
                        accountData.discharge_date = dDateCol > -1 ? String(dRow[dDateCol] || '') : '';
                        accountData.defendant_name = dRowName || accountData.defendant_name;
                        found = true;
                        break;
                    }
                }
            }
        }
    } catch (e) {
        Logger.log('Discharge lookup error: ' + e.message);
    }

    // 3. Search Payment_Plans / PaymentLog / IntakeQueue for Balance
    try {
        var paySheet = ss.getSheetByName('Payment_Plans') || ss.getSheetByName('PaymentLog') || ss.getSheetByName('IntakeQueue');
        if (paySheet && paySheet.getLastRow() > 1) {
            var payValues = paySheet.getDataRange().getValues();
            var pNameCol = shannonFindHeaderIndex_(payValues[0], ['defendant name', 'defname', 'def name']);
            var pPhoneCol = shannonFindHeaderIndex_(payValues[0], ['indphone', 'indemnitor phone', 'phone']);
            var pBondCol = shannonFindHeaderIndex_(payValues[0], ['bond amount', 'bondamt', 'bond']);
            var pPremCol = shannonFindHeaderIndex_(payValues[0], ['premium']);
            var pPaidCol = shannonFindHeaderIndex_(payValues[0], ['amount paid', 'paid']);
            var pBalCol = shannonFindHeaderIndex_(payValues[0], ['remaining', 'balance']);
            var pCaseCol = shannonFindHeaderIndex_(payValues[0], ['case number', 'casenumber', 'case']);

            for (var pr = payValues.length - 1; pr >= shannonSheetScanStart_(payValues.length); pr--) {
                var pRow = payValues[pr];
                var pRowName = pNameCol > -1 ? String(pRow[pNameCol] || '') : '';
                var pRowPhone = pPhoneCol > -1 ? String(pRow[pPhoneCol] || '') : '';
                var pRowCase = pCaseCol > -1 ? String(pRow[pCaseCol] || '') : '';
                if (rowMatchesPerson_(pRowName, pRowCase, pRowPhone)) {
                    accountData.defendant_name = pRowName || accountData.defendant_name;
                    accountData.total_bond = pBondCol > -1 ? String(pRow[pBondCol] || '') : '';
                    accountData.premium = pPremCol > -1 ? String(pRow[pPremCol] || '') : '';
                    accountData.amount_paid = pPaidCol > -1 ? String(pRow[pPaidCol] || '') : '';
                    accountData.remaining_balance = pBalCol > -1 ? String(pRow[pBalCol] || '') : '';
                    found = true;
                    break;
                }
            }
        }
    } catch (e) {
        Logger.log('Payment plan lookup error: ' + e.message);
    }

    var spoken = shannonBuildAccountSpoken_(found, accountData, queryType, defName);

    return ContentService.createTextOutput(JSON.stringify({
        status: found ? 'found' : 'not_found',
        account: found ? accountData : { payment_link: paymentLink },
        message: spoken
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: schedule_office_visit
 * Logs an in-person visit request for 1528 Broadway. Confirms on the calendar
 * only when date and time parse; otherwise staff confirms.
 *
 * Expected params: { "caller_name": "...", "caller_phone": "...", "defendant_name": "...", "preferred_date": "...", "preferred_time": "...", "purpose": "..." }
 */
function toolScheduleOfficeVisit(params) {
    params = params || {};
    var callerName = shannonTruncate_(params.caller_name || '', 80);
    var callerPhoneRaw = params.phone || params.caller_phone || '';
    var callerPhone10 = shannonNormalizePhone10_(callerPhoneRaw);
    var defName = shannonTruncate_(params.defendant_name || '', 80);
    var preferredDate = shannonTruncate_(params.preferred_date || params.date || 'today', 40);
    var preferredTime = shannonTruncate_(params.preferred_time || params.time || 'as soon as possible', 40);
    var purpose = shannonTruncate_(params.purpose || 'in-person paperwork / consultation', 80);
    var notes = shannonTruncate_(params.notes || '', SHANNON_MAX_NOTE);

    if (!callerName) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'I need your name to put the office visit on the board.'
        })).setMimeType(ContentService.MimeType.JSON);
    }
    if (!callerPhone10) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'I need a ten-digit mobile number so I can text the Fort Myers address and our bondsman can confirm the time.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var when = shannonParseOfficeVisitWhen_(preferredDate, preferredTime, new Date());
    var statusLabel = when.parsed ? 'Scheduled' : 'Requested';
    var apptRef = 'APPT-' + new Date().getTime().toString(36).toUpperCase();
    var officeAddress = SHANNON_OFFICE_ADDRESS;
    var sheetOk = false;
    var calOk = false;
    var smsOk = false;

    try {
        var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
        if (ssId) {
            var ss = SpreadsheetApp.openById(ssId);
            var sheet = ss.getSheetByName('OfficeAppointments');
            if (!sheet) {
                sheet = ss.insertSheet('OfficeAppointments');
                sheet.appendRow(['Timestamp', 'Ref', 'Caller Name', 'Caller Phone', 'Defendant Name', 'Date', 'Time', 'Purpose', 'Notes', 'Status']);
                sheet.getRange(1, 1, 1, 10)
                    .setFontWeight('bold')
                    .setBackground('#1a472a')
                    .setFontColor('#ffffff');
                sheet.setFrozenRows(1);
            }
            sheet.appendRow([
                new Date(),
                apptRef,
                callerName,
                callerPhone10,
                defName || 'N/A',
                preferredDate,
                preferredTime,
                purpose,
                notes,
                statusLabel
            ]);
            sheetOk = true;
        }
    } catch (sheetErr) {
        Logger.log('OfficeAppointments sheet write failed (non-fatal): ' + sheetErr.message);
    }

    if (when.parsed) {
        try {
            var calId = PropertiesService.getScriptProperties().getProperty('COMPANY_CALENDAR_ID');
            if (calId) {
                var cal = CalendarApp.getCalendarById(calId);
                if (cal) {
                    var title = 'OFFICE VISIT: ' + callerName + (defName ? (' (re: ' + defName + ')') : '');
                    var desc = 'Office appointment via Shannon Voice AI.\n\n' +
                        'Client: ' + callerName + ' (' + callerPhone10 + ')\n' +
                        'Defendant: ' + (defName || 'N/A') + '\n' +
                        'Purpose: ' + purpose + '\n' +
                        'Preferred: ' + when.label + '\n' +
                        'Notes: ' + notes + '\n' +
                        'Ref: ' + apptRef;
                    cal.createEvent(title, when.start, when.end, {
                        location: officeAddress,
                        description: desc
                    });
                    calOk = true;
                }
            }
        } catch (calErr) {
            Logger.log('Calendar event creation failed (non-fatal): ' + calErr.message);
        }
    }

    try {
        var config = getConfig();
        var slackChannel = config.SLACK_WEBHOOK_SHAMROCK || config.SLACK_WEBHOOK_LEADS || config.SLACK_WEBHOOK_GENERAL;
        if (slackChannel && typeof sendSlackMessage === 'function') {
            sendSlackMessage(slackChannel,
                '*Office visit ' + statusLabel.toLowerCase() + ' via Shannon*\n' +
                '• Client: ' + callerName + ' (' + callerPhone10 + ')\n' +
                '• Defendant: ' + (defName || 'N/A') + '\n' +
                '• When: ' + when.label + '\n' +
                '• Purpose: ' + purpose + '\n' +
                '• Office: ' + officeAddress + '\n' +
                '• Ref: `' + apptRef + '`',
                null
            );
        }
    } catch (slackErr) {
        Logger.log('Slack appointment alert failed: ' + slackErr.message);
    }

    var smsHeadline = when.parsed
        ? 'Office visit set for ' + when.label + '.'
        : 'We have your office visit request for ' + when.label + '. A bondsman will confirm the time.';
    var smsBody = 'Shamrock Bail Bonds — ' + smsHeadline + '\n\n' +
        'Hi ' + callerName + ',\n' +
        'Fort Myers office: ' + officeAddress + '\n' +
        'Directions: https://maps.google.com/?q=1528+Broadway+Fort+Myers+FL+33901\n\n' +
        'Need to change times? Call (239) 332-2245.';

    if (typeof sendShannonText_ === 'function') {
        try {
            var smsResult = sendShannonText_(shannonE164_(callerPhone10), smsBody);
            smsOk = !!(smsResult && smsResult.success);
        } catch (smsErr) {
            Logger.log('Office visit text failed (non-fatal): ' + smsErr.message);
        }
    }

    var spokenMsg;
    if (when.parsed) {
        spokenMsg = 'I have you down for an in-person visit at 1528 Broadway in Fort Myers on ' + when.label + '.';
    } else {
        spokenMsg = 'I logged your office visit request for ' + when.label +
            ' at 1528 Broadway in Fort Myers. A bondsman will confirm the exact time.';
    }
    if (smsOk) {
        spokenMsg += ' I texted the address and directions to your phone.';
    } else {
        spokenMsg += ' The address is 1528 Broadway, Fort Myers. If the text does not come through, call 239-332-2245.';
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: when.parsed ? 'scheduled' : 'requested',
        reference: apptRef,
        office_address: officeAddress,
        date: preferredDate,
        time: preferredTime,
        calendar_written: calOk,
        sheet_written: sheetOk,
        text_sent: smsOk,
        message: spokenMsg
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tool: send_sms
 * Sends a custom text via BlueBubbles (iMessage/SMS relay). Never Twilio.
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

    var smsResult = (typeof sendShannonText_ === 'function')
        ? sendShannonText_(toPhone, message)
        : { success: false, error: 'BlueBubbles text helper not loaded' };

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


