/**
 * ElevenLabs_AfterHoursAgent.js
 *
 * Shannon — 24/7 paperwork assistant (switch-controlled, not nights-only).
 *
 * Flow:
 *   1. Public inbound call → Netlify twilio-voice-inbound.js when SHANNON_LIVE=true
 *   2. Shannon greets, identifies role, walks packet fields, emails indemnitor
 *   3. Real-time tools write IntakeQueue / Super CRM / DocuSeal
 *   4. Post-call webhook saves transcript and alerts staff
 *
 * Requirements:
 *   - ELEVENLABS_API_KEY in Script Properties
 *   - ELEVENLABS_WEBHOOK_SECRET / ELEVENLABS_TOOL_SECRET in Script Properties
 *   - Twilio voice webhook → shamrock-telegram Netlify edge
 *   - SHANNON_LIVE Netlify env (default true; Brendan flips it)
 */

// =============================================================================
// 1. AGENT CONFIGURATION
// =============================================================================

var AFTER_HOURS_AGENT_CONFIG = {
    name: 'Shannon — Shamrock Paperwork Assistant',

    firstMessage: "Hey there, thank you for calling Shamrock Bail Bonds. My name is Shannon and I can walk you through the paperwork on this call. What is your first name?",

    // ==========================================================================
    // SYSTEM PROMPT — Structured per ElevenLabs best practices (2026-05-15)
    // Uses # headings: Identity, Guardrails, Goal, Tools, Tone
    // ElevenLabs LLMs pay extra attention to "# Guardrails" heading
    // ==========================================================================
    systemPrompt: [
        "# Personality",
        "You are Shannon, the paperwork assistant at Shamrock Bail Bonds in Fort Myers, Florida. You are calm, efficient, and trustworthy. You work the front desk.",
        "",
        "# Environment",
        "This is a live phone call on 727-295-2245. The human office is 239-332-2245. Hours are 24/7. Caller phone is {{caller_phone}}. returning_client is {{returning_client}}. prior_notes is {{prior_notes}}. known_defendant is {{known_defendant}}.",
        "",
        "# Tone",
        "Spoken sentences only. No markdown, bullets, or asterisks. Under two sentences then a question. If they are upset, empathize for ten seconds, then continue.",
        "",
        "# Spanish",
        "If the caller uses any Spanish word — hola, necesito, fianza, carcel, por favor — immediately call transfer_to_agent to Sofia. Do not greet in English first. This step is important.",
        "",
        "# Goal",
        "Identify the caller role. Collect packet fields. create_intake once you have defendant name, county, caller name, and role. Email the MAIN indemnitor the DocuSeal signing link and payment link. A bondsman still matches surety and power number.",
        "If {{returning_client}} is yes, briefly acknowledge prior_notes. Do not invent history if prior_notes is empty or if check_caller_history says no history.",
        "Ask one or two fields per turn. After each section call save_paperwork_answers with case_reference.",
        "Never invent jail hours or addresses. Use the knowledge base or send_directions.",
        "",
        "# Procedures",
        "Role: Ask if they are the person in jail, the main cosigner, or a second cosigner. Map to defendant, indemnitor, or coindemnitor.",
        "Indemnitor packet: Collect their legal name, email as name@domain.com, phone digits, then defendant name and county. create_intake. Collect remaining packet fields. When name, email, and defendant are ready, call email_paperwork_to_indemnitor.",
        "Defendant packet: Collect their identity and county, then the MAIN cosigner name, phone, and email. Never email the jail. Email the cosigner.",
        "Coindemnitor: Collect their identity plus the main indemnitor and defendant. Email only the main indemnitor unless staff says otherwise.",
        "Need a person: create_intake if you have a name, notify_bondsman or transfer_to_bondsman, say the office is 239-332-2245. Never give 727-295-2245.",
        "",
        "# Paperwork",
        "Always collect defendant full name and county. Then DOB if known, charges, booking number.",
        "Indemnitor or coindemnitor: their legal name, email in name@domain.com form, phone as digits, DOB, driver license and state, home address, employer, two references.",
        "Do not demand SSN first. If they offer last four, save it. Never read a full SSN back.",
        "Default surety_id is osi. Use palmetto only if they say Palmetto.",
        "When indemnitor name, valid email, and defendant name are ready, call email_paperwork_to_indemnitor or send_paperwork. Say you are emailing the signing and payment links now.",
        "",
        "# Guardrails",
        "Never ask for the caller phone. Use {{caller_phone}}.",
        "Never quote prices as guarantees. Florida estimate: one hundred dollars per charge minimum, ten percent of bail, one thousand dollar premium floor, one hundred twenty five dollar transfer fee outside Lee and Charlotte. Always say estimated.",
        "Never give legal advice. Say you are not an attorney.",
        "If they need a person, call create_intake then notify_bondsman or transfer_to_bondsman. Tell them the office is 239-332-2245. Never tell them to call 727-295-2245. This step is important.",
        "Never mention SignNow. Signing is DocuSeal.",
        "Never invent bond amounts, charges, POA, or surety.",
        "Never recommend competitors.",
        "If asked if you are AI, say you work the front desk at Shamrock.",
        "Texts go through BlueBubbles. After send_sms or send_payment_link, say you texted them.",
        "If a tool fails, do not guess. Offer to try again or give 239-332-2245.",
        "",
        "# Tools",
        "check_caller_history: ALWAYS first with {{caller_phone}}. If it says no history, do not invent one.",
        "check_inmate_status: name plus county.",
        "lookup_defendant: existing file.",
        "calculate_premium: after a confirmed bond amount. Frame as an estimate.",
        "create_intake: required with defendant name, county, caller identity, caller_role, surety_id. Reuse case_reference.",
        "save_paperwork_answers: after every section. Pass case_reference.",
        "email_paperwork_to_indemnitor and send_paperwork: email DocuSeal plus payment to the indemnitor. indemnitor_email must be name@domain.com. Never email the jail.",
        "notify_bondsman and transfer_to_bondsman: human at 239-332-2245.",
        "send_payment_link and send_sms: BlueBubbles texts.",
        "schedule_callback: if they cannot finish.",
        "send_directions: jail or courthouse address.",
        "",
        "# Error handling",
        "If any tool fails: say you are having trouble accessing that, do not invent data, offer 239-332-2245.",
        "If they cannot finish: save what you have, create_intake, notify_bondsman or schedule_callback."
    ].join('\n'),

    // Voice: Jessica — warm, bright, playful American female (Shannon's voice)
    voiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica (ElevenLabs premade) — DO NOT change to a male voice

    // Live Agent ID (created 2026-03-03)
    // agent_2001kjth4na5ftqvdf1pp3gfb1cb

    // LLM: gpt-4o — paperwork interviews use many tools; gpt-4o is more reliable than mini
    llm: 'gpt-4o',

    language: 'en',
    maxDurationSeconds: 900, // paperwork interviews need 10-15 minutes

    // TTS settings (optimized 2026-05-15)
    similarityBoost: 0.75,        // Slightly reduced from 0.8 to prevent phone-quality artifacts
    streamingLatency: 4,          // Max optimization for lowest TTFB on phone calls
    silenceEndCallTimeout: 45     // Stressed callers pause; do not hang up at 30s
};

// =============================================================================
// 2. AGENT CREATION / UPDATE
// =============================================================================

/**
 * Creates (or retrieves existing) ElevenLabs Conversational AI agent.
 * Stores the agent_id in Script Properties for future use.
 * 
 * @returns {Object} { success, agentId, message }
 */
function createAfterHoursAgent() {
    var props = PropertiesService.getScriptProperties();
    var apiKey = props.getProperty('ELEVENLABS_API_KEY');

    if (!apiKey) {
        return { success: false, error: 'ELEVENLABS_API_KEY not configured in Script Properties.' };
    }

    // Check if we already have an agent
    var existingId = props.getProperty('ELEVENLABS_AGENT_ID');
    if (existingId) {
        console.log('🤖 After-Hours Agent already exists: ' + existingId);
        return { success: true, agentId: existingId, message: 'Agent already exists. Use updateAfterHoursAgent() to modify.' };
    }

    var config = AFTER_HOURS_AGENT_CONFIG;

    var payload = {
        conversation_config: {
            agent: {
                prompt: {
                    prompt: config.systemPrompt
                },
                first_message: config.firstMessage,
                language: config.language
            },
            tts: {
                voice_id: config.voiceId
            }
        },
        name: config.name,
        platform_settings: {
            widget: {
                variant: 'full'
            }
        }
    };

    var options = {
        method: 'post',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    try {
        var response = UrlFetchApp.fetch('https://api.elevenlabs.io/v1/convai/agents/create', options);
        var code = response.getResponseCode();
        var body = JSON.parse(response.getContentText());

        if (code !== 200 && code !== 201) {
            console.error('ElevenLabs Agent Creation Failed:', body);
            return { success: false, error: body.detail || JSON.stringify(body) };
        }

        var agentId = body.agent_id;
        props.setProperty('ELEVENLABS_AGENT_ID', agentId);

        console.log('✅ After-Hours Agent Created: ' + agentId);

        // Notify Slack
        if (typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#ops', '🤖 *After-Hours AI Agent Created*\nAgent ID: ' + agentId + '\nReady for phone integration.');
        }

        return { success: true, agentId: agentId, message: 'Agent created and ID stored in Script Properties.' };

    } catch (e) {
        console.error('ElevenLabs Agent Creation Exception:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Retrieves the current agent configuration for debugging.
 * @returns {Object}
 */
function getAfterHoursAgentInfo() {
    var props = PropertiesService.getScriptProperties();
    var apiKey = props.getProperty('ELEVENLABS_API_KEY');
    var agentId = props.getProperty('ELEVENLABS_AGENT_ID');

    if (!apiKey || !agentId) {
        return { success: false, error: 'Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID.' };
    }

    try {
        var response = UrlFetchApp.fetch('https://api.elevenlabs.io/v1/convai/agents/' + agentId, {
            method: 'get',
            headers: { 'xi-api-key': apiKey },
            muteHttpExceptions: true
        });

        return { success: true, agent: JSON.parse(response.getContentText()) };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 3. WEBHOOK HANDLER (Post-Call Processing)
// =============================================================================

/**
 * Handles post-call webhooks from ElevenLabs Conversational AI.
 * Called from the main doPost router when event type is from ElevenLabs.
 * 
 * @param {Object} payload - The webhook payload from ElevenLabs
 * @returns {Object} { success, message }
 */
function handleAfterHoursCall(payload) {
    console.log('🎙️ After-Hours Call Received. Call ID: ' + payload.call_id);

    // 1. Extract conversation data
    var transcript = payload.transcription || [];
    var analysis = payload.analysis || {};
    var metadata = payload.call_metadata || {};

    // 2. Build full transcript text
    var fullTranscript = '';
    if (Array.isArray(transcript)) {
        transcript.forEach(function (turn) {
            fullTranscript += '[' + (turn.role || 'unknown').toUpperCase() + ']: ' + turn.message + '\n';
        });
    }

    // 3. Extract lead data from conversation analysis
    var leadData = extractLeadFromConversation_(analysis, transcript, metadata);

    // 4. Write to IntakeQueue
    var intakeResult = writeAfterHoursIntake_(leadData, payload.call_id, fullTranscript);

    // 5. Send SMS confirmation to caller
    if (leadData.callerPhone) {
        sendAfterHoursConfirmationSMS_(leadData.callerPhone, leadData.callerName);
    }

    // 6. Alert staff on Slack
    sendAfterHoursSlackAlert_(leadData, analysis, payload.call_id);

    // 7. Save transcript to Google Drive
    saveCallTranscript_(payload.call_id, fullTranscript, analysis);

    return { success: true, message: 'After-hours call processed.', intakeResult: intakeResult };
}

// =============================================================================
// 4. DATA EXTRACTION
// =============================================================================

/**
 * Uses AI to extract structured lead data from the conversation.
 * Falls back to regex extraction if AI is unavailable.
 * 
 * @param {Object} analysis - ElevenLabs conversation analysis
 * @param {Array} transcript - Conversation transcript
 * @param {Object} metadata - Call metadata
 * @returns {Object} { callerName, callerPhone, defendantName, county, charges, bondAmount, relationship }
 */
function extractLeadFromConversation_(analysis, transcript, metadata) {
    // Try AI extraction first
    if (typeof callOpenAI === 'function') {
        var fullText = '';
        if (Array.isArray(transcript)) {
            transcript.forEach(function (turn) {
                fullText += turn.role + ': ' + turn.message + '\n';
            });
        }

        var systemPrompt = [
            'Extract the following fields from this bail bond intake phone conversation.',
            'Return pure JSON with no markdown:',
            '{',
            '  "callerName": "string or null",',
            '  "callerPhone": "string or null",',
            '  "relationship": "string or null (e.g. mother, wife, friend)",',
            '  "defendantName": "string or null",',
            '  "county": "string or null (e.g. Lee, Charlotte, Collier)",',
            '  "charges": "string or null",',
            '  "bondAmount": "string or null"',
            '}'
        ].join('\n');

        try {
            var extracted = callOpenAI(systemPrompt, fullText, { jsonMode: true });
            if (extracted) {
                // Merge with any metadata we have
                extracted.callerPhone = extracted.callerPhone || (metadata && metadata.caller_number) || null;
                return extracted;
            }
        } catch (e) {
            console.warn('AI extraction failed, using fallback: ' + e.message);
        }
    }

    // Fallback: return what we can from metadata
    return {
        callerName: null,
        callerPhone: (metadata && metadata.caller_number) || null,
        relationship: null,
        defendantName: null,
        county: null,
        charges: null,
        bondAmount: null
    };
}

// =============================================================================
// 5. INTAKE QUEUE WRITER
// =============================================================================

/**
 * Writes the after-hours lead to the IntakeQueue sheet.
 * 
 * @param {Object} lead - Extracted lead data
 * @param {string} callId - ElevenLabs call ID
 * @param {string} transcript - Full conversation transcript
 * @returns {Object} { success, row }
 */
function writeAfterHoursIntake_(lead, callId, transcript) {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName('IntakeQueue') || ss.getSheetByName('Intake_Queue');

        if (!sheet) {
            console.error('IntakeQueue sheet not found. Creating one...');
            sheet = ss.insertSheet('IntakeQueue');
            sheet.appendRow([
                'Timestamp', 'Source', 'Caller Name', 'Caller Phone', 'Relationship',
                'Defendant Name', 'County', 'Charges', 'Bond Amount', 'Status',
                'Call ID', 'Transcript Preview', 'AI Extracted'
            ]);
        }

        var row = [
            new Date().toISOString(),
            'ai_voice_call',
            lead.callerName || 'Unknown',
            lead.callerPhone || 'Unknown',
            lead.relationship || 'Unknown',
            lead.defendantName || 'Unknown',
            lead.county || 'Unknown',
            lead.charges || 'Unknown',
            lead.bondAmount || 'Unknown',
            'NEW',
            callId,
            (transcript || '').substring(0, 500), // Preview only
            'Yes'
        ];

        sheet.appendRow(row);
        var lastRow = sheet.getLastRow();

        console.log('✅ After-Hours Lead written to IntakeQueue row ' + lastRow);
        return { success: true, row: lastRow };

    } catch (e) {
        console.error('IntakeQueue Write Error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 6. NOTIFICATIONS
// =============================================================================

/**
 * Send SMS confirmation to the caller that their info was received.
 */
function sendAfterHoursConfirmationSMS_(phone, name) {
    if (!phone) return;

    var greeting = name ? ('Hi ' + name.split(' ')[0] + ', ') : '';
    var message = greeting + 'This is Shamrock Bail Bonds. We received your call and a licensed bondsman will reach out within 15 minutes. ' +
        'If urgent, call our office at (239) 332-2245. — Shamrock Bail Bonds 🍀';

    try {
        if (typeof sendShannonText_ === 'function') {
            sendShannonText_(phone, message);
            console.log('📱 Confirmation text queued via BlueBubbles to ' + phone);
        } else {
            console.warn('BlueBubbles text helper not loaded. Confirmation not sent.');
        }
    } catch (e) {
        console.error('Confirmation text failed: ' + e.message);
    }
}

/**
 * Send Slack alert for after-hours lead.
 */
function sendAfterHoursSlackAlert_(lead, analysis, callId) {
    var fields = [];
    if (lead.callerName) fields.push('*Caller:* ' + lead.callerName);
    if (lead.callerPhone) fields.push('*Phone:* ' + lead.callerPhone);
    if (lead.defendantName) fields.push('*Defendant:* ' + lead.defendantName);
    if (lead.county) fields.push('*County:* ' + lead.county);
    if (lead.charges) fields.push('*Charges:* ' + lead.charges);
    if (lead.bondAmount) fields.push('*Bond:* ' + lead.bondAmount);

    var summary = (analysis && analysis.call_summary) ? analysis.call_summary : '(No AI summary available)';

    var slackMsg = '🌙 *After-Hours Lead Captured*\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        fields.join('\n') + '\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '*AI Summary:* ' + summary + '\n' +
        '*Call ID:* ' + callId + '\n' +
        '_A bondsman should follow up within 15 minutes._';

    try {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#after-hours', slackMsg);
            // Also send to general leads channel
            NotificationService.sendSlack('#leads', '🌙 New after-hours lead from ' + (lead.callerName || 'Unknown') + ' — check #after-hours for details.');
        }
    } catch (e) {
        console.error('Slack Alert Failed: ' + e.message);
    }
}

/**
 * Save full transcript to Google Drive for records.
 */
function saveCallTranscript_(callId, transcript, analysis) {
    try {
        var folderId = PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_FOLDER_ID');
        if (!folderId) {
            console.warn('GOOGLE_DRIVE_FOLDER_ID not set — transcript not saved to Drive.');
            return;
        }

        var folder = DriveApp.getFolderById(folderId);
        var timestamp = new Date().toISOString().split('T')[0];
        var filename = 'AfterHours_Call_' + callId + '_' + timestamp + '.txt';

        var content = '=== SHAMROCK BAIL BONDS — AFTER-HOURS CALL TRANSCRIPT ===\n\n';
        content += 'Call ID: ' + callId + '\n';
        content += 'Date: ' + new Date().toISOString() + '\n\n';

        if (analysis && analysis.call_summary) {
            content += '--- AI SUMMARY ---\n' + analysis.call_summary + '\n\n';
        }

        content += '--- TRANSCRIPT ---\n' + (transcript || '(Empty)') + '\n';

        folder.createFile(filename, content);
        console.log('📁 Transcript saved: ' + filename);
    } catch (e) {
        console.error('Transcript Save Error: ' + e.message);
    }
}

// =============================================================================
// 7. WEBHOOK ROUTER INTEGRATION
// =============================================================================

/**
 * Routes ElevenLabs webhook events. Called from the main doPost handler.
 * Enhanced version of handleElevenLabsWebhookSOC2 with after-hours support.
 * 
 * @param {Object} payload - Parsed webhook payload
 * @returns {ContentService.TextOutput}
 */
function routeElevenLabsWebhook(payload) {
    var agentId = PropertiesService.getScriptProperties().getProperty('ELEVENLABS_AGENT_ID');

    // Route after-hours agent calls
    if (payload.agent_id && payload.agent_id === agentId) {
        if (payload.type === 'post_call_transcription') {
            var result = handleAfterHoursCall(payload);
            return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
        }
    }

    // Existing routes (backward compatible)
    if (payload.type === 'post_call_transcription') {
        return handlePostCallTranscription(payload);
    }

    if (payload.type === 'call_initiation_failure') {
        return handleCallInitiationFailure(payload);
    }

    return ContentService.createTextOutput('Event type not handled: ' + payload.type).setMimeType(ContentService.MimeType.TEXT);
}
