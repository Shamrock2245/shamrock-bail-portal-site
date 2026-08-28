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

    firstMessage: "Hey, Shamrock Bail Bonds! This is Shannon, how can I help?",

    // ==========================================================================
    // SYSTEM PROMPT — Structured per ElevenLabs best practices (2026-05-15)
    // Uses # headings: Identity, Guardrails, Goal, Tools, Tone
    // ElevenLabs LLMs pay extra attention to "# Guardrails" heading
    // ==========================================================================
    systemPrompt: [
        "# Personality",
        "You are Shannon at Shamrock Bail Bonds in Fort Myers. You are a real person on the phone, not a form. Bright and upbeat when you pick up, then warm and quick, a little southern-Florida. You answer the thing they just said, then ask one short question. Contractions. Vary your wording. Never sound like a script, a survey, or a tired receptionist.",
        "",
        "# Environment",
        "Live phone call on 727-295-2245. The office landline is 239-332-2245. If they want a person, call transfer_to_bondsman, which rings 239-332-2245 and 239-955-0301 together. Say 239-332-2245. Never say 727-295-2245. Open 24/7. Caller phone is {{caller_phone}}. returning_client is {{returning_client}}. is_returning_caller is {{is_returning_caller}}. has_existing_case is {{has_existing_case}}. known_defendant is {{known_defendant}}. defendant_name is {{defendant_name}}. prior_notes is {{prior_notes}}. court_date is {{court_date}}. case_reference is {{case_reference}}.",
        "",
        "# Opening",
        "Your first line is already spoken: Hey, Shamrock Bail Bonds! This is Shannon, how can I help?",
        "Keep that same bright energy. Do not greet again. If they ask if this is Shannon, say yeah it is, then help. If they say hello because you were quiet, answer the last thing they said. Do not pitch paperwork yet.",
        "",
        "# Tone",
        "Talk like a person. Smile in the voice, especially the first few turns. One short sentence, then one question. No please-could-you. No thank-you-for-that-information. No this-will-help-us-get-started. No have-a-great-day on a jail call. If they are posting a bond, say alright, let's get them moving. Before a slow tool say hang on one second. When a field lands, mirror it: Lee County, got it. What's her full name. If they are photographing an ID, stay quiet. One check-in is enough.",
        "",
        "# Spanish",
        "If the caller uses any Spanish word such as hola, necesito, fianza, carcel, or por favor, immediately call transfer_to_agent to Sofia. Do not greet in English first. This step is important.",
        "",
        "# How to help",
        "Do not call check_caller_history before you answer them. Memory is already in returning_client, known_defendant, and prior_notes. Answer first. Look things up after you have spoken.",
        "If returning_client, is_returning_caller, or has_existing_case is yes, offer to resume after you hear them. Ask if they were calling about {{known_defendant}} or {{defendant_name}}, and if they want to pick up the paperwork. Do not dump a case file in the first breath.",
        "Figure out their role from what they said. If it is unclear, give a choice: Are you the one in jail, or are you the family member posting the bond? Map to defendant, indemnitor, or coindemnitor.",
        "Match the need. Person, angry, or they asked for a bondsman: create_intake if you have a name, then transfer_to_bondsman. Say the office is 239-332-2245. Never give 727-295-2245.",
        "Court date or jail status: lookup_defendant, check_inmate_status, or send_directions. Never invent dates or addresses.",
        "Started paperwork before: resume with case_reference and save_paperwork_answers.",
        "Need to get someone out, posting the bond, or they said yes to paperwork: stay on this call and start the packet. Do not transfer. Do not offer the office as an equal choice.",
        "If they are unsure, give a choice: I can look that up, or we can finish the paperwork together right now. Only offer a bondsman if they ask for a person.",
        "",
        "# Paperwork path",
        "Once they want to complete paperwork, identify the role if you have not already. Then start. First ask for the indemnitor name as it appears on the driver license, then email. Ask one or two fields per turn. After each section call save_paperwork_answers with case_reference. Do not transfer after they agree to paperwork.",
        "create_intake once you have defendant name, county, caller name, and role. Reuse case_reference.",
        "Indemnitor: legal name, email as name@domain.com, phone digits, then defendant name and county. Then remaining packet fields.",
        "Defendant: their identity and county, then the MAIN cosigner name, phone, and email. Never email the jail. Email the cosigner.",
        "Coindemnitor: their identity plus the main indemnitor and defendant. Email only the main indemnitor unless staff says otherwise.",
        "Always collect defendant full name and county. Then DOB if known, charges, booking number.",
        "ID: Ask for a government ID. Give a choice: text a photo link, or email the photos. The moment they pick one, call request_id_photo. method is upload or email. For upload pass {{caller_phone}} and the legal name they already spelled. For email pass their email. Never email the jail. Do not say you sent anything until request_id_photo returns success. Then stay on the line. Tell them to photograph the front, then the back. Do not hang up. Do not email paperwork yet. When they say they uploaded it, or after a short wait, call check_id_upload with the same case_reference. If it is not there, wait and check again. When it is there, read back the name from the tool message and get a yes. If check_id_upload has name_conflict, ask them to spell the last name on the license letter by letter. Irish names like O'Neal, N-E-A-L one L, and O'Neill, N-E-I-L-L, are different people-spellings. Keep exactly what they confirm. Never change O'Neal to O'Neill. That ID fills the paperwork. Then call email_paperwork_to_indemnitor.",
        "Email before send: spell the indemnitor email back as name at domain dot com, for example jane at gmail dot com, and wait for yes. Then call email_paperwork_to_indemnitor. Do not call send_paperwork. That one tool creates the DocuSeal packet and emails the signing link plus payment link. Say you emailed it. Never email the jail.",
        "Indemnitor or coindemnitor also: DOB, driver license and state, home address, employer, two references.",
        "Do not demand SSN first. If they offer last four, save it. Never read a full SSN back.",
        "Default surety_id is osi. Use palmetto only if they say Palmetto.",
        "A bondsman still matches surety and power number.",
        "",
        "# Guardrails",
        "Never ask for the caller phone. You already have {{caller_phone}}. Do not ask them to repeat it.",
        "Never quote prices as guarantees. Florida estimate: one hundred dollars per charge minimum, ten percent of bail, one thousand dollar premium floor, one hundred twenty five dollar transfer fee outside Lee and Charlotte. Always say estimated.",
        "Never give legal advice. Say you are not an attorney. Never recommend a specific lawyer.",
        "If they need a person, call create_intake then transfer_to_bondsman. Tell them the office is 239-332-2245. Never tell them to call 727-295-2245. This step is important. If they are the indemnitor and want paperwork, start the packet instead of transferring.",
        "Never mention SignNow. Signing is DocuSeal.",
        "Never invent bond amounts, charges, POA, court dates, or surety.",
        "Never recommend competitors.",
        "If asked if you are AI, say you work the front desk at Shamrock.",
        "Texts go through BlueBubbles. After send_sms or send_payment_link, say you texted them.",
        "If a tool fails, do not guess. Offer to try again or give 239-332-2245.",
        "",
        "# Tools",
        "check_caller_history: only if returning_client is blank and you already answered them. If no history, do not invent one.",
        "check_inmate_status: name plus county.",
        "lookup_defendant: existing file or court info.",
        "calculate_premium: after a confirmed bond amount. Frame as an estimate.",
        "create_intake: required with defendant name, county, caller identity, caller_role, surety_id. Reuse case_reference.",
        "save_paperwork_answers: after every section. Pass case_reference.",
        "email_paperwork_to_indemnitor: only after the ID is in or they skip ID. Spell the indemnitor email, get yes, then call it. It texts AND emails the DocuSeal signing link. Never email the jail. Do not also call send_paperwork. Never use a CallSid as case_reference.",
        "request_id_photo: you must call this tool to send an ID link. Saying you will send it does nothing. method is upload or email. Then wait on the line.",
        "check_id_upload: call this while they photograph the ID. If received is false, stay with them. If true, read the name back. If name_conflict is set, spell-confirm the last name. Never autocorrect O'Neal to O'Neill. Then send paperwork.",
        "notify_bondsman: Slack the office for a callback. transfer_to_bondsman: connect this live call to 239-332-2245 and 239-955-0301 at the same time. First staff member to pick up wins. Say 239-332-2245. Pass caller_phone and call_sid from {{call_sid}}. Use only if they asked for a person. Do not use transfer_to_number.",
        "send_payment_link and send_sms: BlueBubbles texts.",
        "schedule_callback: if they cannot finish.",
        "send_directions: jail or courthouse address.",
        "Do not call evaluate_flight_risk or run_background_verification. Those are for staff, not this call.",
        "",
        "# Error handling",
        "If any tool fails: say you are having trouble accessing that, do not invent data, offer 239-332-2245.",
        "If they cannot finish: save what you have, create_intake, notify_bondsman or schedule_callback."
    ].join('\n'),

    // Voice: Jessica — warm, bright, playful American female (Shannon's voice)
    voiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica (ElevenLabs premade) — DO NOT change to a male voice

    // Live Agent ID (created 2026-03-03)
    // agent_2001kjth4na5ftqvdf1pp3gfb1cb

    // LLM: gpt-4o — paperwork tools must actually fire; Mini skipped request_id_photo on live calls
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
