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

    // ── Save to Google Sheets: ShannonCallLog tab ───────────────────────────────────────────────
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

    // ── Save to Google Drive (full-text backup) ────────────────────────────────────────────────
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

    // ── Save conversation memory to Mem0 ────────────────────────────────────────────────
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

    // ── Sheets lookup ───────────────────────────────────────────────────────
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
    var memoryText = 'Caller called Shamrock Bail Bonds on ' + facts.call_date + ' and spoke with AI Agent Brendan. ';
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
