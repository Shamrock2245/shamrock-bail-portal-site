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
    const transcript = payload.transcription;
    const metadata = payload.call_metadata;
    const analysis = payload.analysis;

    let fullText = `Call ID: ${payload.call_id}\nDate: ${new Date(payload.call_timestamp * 1000).toISOString()}\n\n`;

    if (analysis) {
        fullText += `--- ANALYSIS ---\nSummary: ${analysis.call_summary}\nOutcome: ${analysis.call_successful}\n\n`;
    }

    if (transcript && Array.isArray(transcript)) {
        transcript.forEach(turn => {
            fullText += `[${turn.role.toUpperCase()}]: ${turn.message}\n`;
        });
    }

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
            Logger.log('⚠️ ElevenLabs phone match failed (non-fatal): ' + matchErr.message);
        }
    }

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
            '🎤 *Shannon call*' + caseRef + '\n\n' + summary + evalLine + collectedLine
        );
    }

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
                logSheet.setColumnWidth(9, 600);
            }
            const durationSecs = payload.call_duration_secs || payload.duration_seconds || '';
            const outcome = analysis
                ? (analysis.call_successful === true ? 'Success'
                    : analysis.call_successful === false ? 'Unsuccessful'
                        : String(analysis.call_successful || 'Unknown'))
                : 'Unknown';
            const summary = analysis ? (analysis.call_summary || '') : '';
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
            Logger.log('✅ Shannon call logged to ShannonCallLog | Call: ' + payload.call_id);
        }
    } catch (sheetErr) {
        Logger.log('⚠️ ShannonCallLog sheet write failed (non-fatal): ' + sheetErr.message);
    }

    const folderId = PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_FOLDER_ID');
    if (folderId) {
        try {
            const folder = DriveApp.getFolderById(folderId);
            const fileName = 'AI_Call_' + payload.call_id + (matchedCaseId ? '_' + matchedCaseId : '') + '.txt';
            folder.createFile(fileName, fullText);
            Logger.log('✅ Shannon call archived to Drive: ' + fileName);
        } catch (driveErr) {
            Logger.log('⚠️ Drive archive failed (non-fatal): ' + driveErr.message);
        }
    }

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

function handleCallInitiationFailure(payload) {
    const errorDetails = payload.failure_reason || "Unknown reason";
    if (typeof NotificationService !== 'undefined') {
        NotificationService.sendSlack('#alerts', `⚠️ *AI Call Failed to Initiate*\nReason: ${errorDetails}\nCall ID: ${payload.call_id}`);
    }
    return ContentService.createTextOutput("Failure logged").setMimeType(ContentService.MimeType.TEXT);
}

function handleCallerContextLookup(e) {
    var phone = (e.parameter && e.parameter.phone) ? e.parameter.phone : '';
    var result = getCallerContext_(phone);
    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

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
    var cache = CacheService.getScriptCache();
    var cacheKey = 'CALLER_CTX_' + normalizedPhone;
    try {
        var cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (cacheErr) {
        Logger.log('Cache read failed (non-fatal): ' + cacheErr.message);
    }
    try { cache.put(cacheKey, JSON.stringify(emptyResult), 60); } catch (_) { }
    return emptyResult;
}

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
    var memoryText = 'Caller called Shamrock Bail Bonds on ' + facts.call_date + '.';
    memoryText = redactMem0Text_(memoryText);
    try {
        UrlFetchApp.fetch('https://api.mem0.ai/v1/memories/', {
            method: 'post',
            headers: { 'Authorization': 'Token ' + apiKey, 'Content-Type': 'application/json' },
            payload: JSON.stringify({ messages: [{ role: 'assistant', content: memoryText }], user_id: normalizedPhone }),
            muteHttpExceptions: true
        });
    } catch (mem0Err) {
        Logger.log('⚠️ Mem0 saveMem0Memory_ failed (non-fatal): ' + mem0Err.message);
    }
}

function handleElevenLabsToolCall(e) {
    var toolName = (e && e.parameter && e.parameter.tool) || 'unknown';
    var payload = {};
    try {
        payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error' })).setMimeType(ContentService.MimeType.JSON);
    }
    if (toolName === 'notify_bondsman') {
        var notified = handleShannonNotifyBondsman(payload);
        return ContentService.createTextOutput(JSON.stringify(notified))
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'truncated restore' })).setMimeType(ContentService.MimeType.JSON);
}
