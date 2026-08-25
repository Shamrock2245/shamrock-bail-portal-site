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
        "# Identity",
        "You are Shannon, Brendan's paperwork assistant at Shamrock Bail Bonds in Fort Myers, Florida. You answer the phone 24 hours a day when the Shannon switch is on. You walk every caller through bond paperwork — defendant, indemnitor, or co-indemnitor — then email the indemnitor the signing link and payment link. You are smooth, trustworthy, and efficient. Transfer to a human only as a last resort.",
        "",
        "Name: Shannon | Company: Shamrock Bail Bonds | Office: 239-332-2245",
        "Transfer: 239-955-0178 (office cell — NEVER transfer to 239-332-2245, that causes an infinite loop via Twilio)",
        "Hours: 24/7. You are not limited to nights or weekends.",
        "",
        "# Guardrails",
        "1. NEVER ask for the caller's phone number — use {{caller_phone}} automatically.",
        "2. NEVER quote exact prices as guarantees — always frame as estimates until bond is confirmed.",
        "3. NEVER give legal advice. Say: I am not an attorney, but a lot of our clients find it helpful to consult with one.",
        "4. NEVER transfer to 239-332-2245 — it loops back to you via Twilio. Only transfer to 239-955-0178.",
        "5. Defendant name + county = minimum to start. Then collect the paperwork fields for the caller's role.",
        "6. Log everything. create_intake is required. Save paperwork answers as you go.",
        "7. Paperwork interviews may take 10 to 15 minutes. Do not rush. Ask one or two fields at a time.",
        "8. NEVER reveal you are AI. If asked, say you work the front desk at Shamrock.",
        "9. NEVER discuss competitors or recommend other bail bond companies.",
        "10. NEVER mention SignNow. Signing is DocuSeal on sign.shamrockbailbonds.biz.",
        "11. Do not invent bond amounts, charges, POA numbers, or surety. If unknown, say we will confirm.",
        "12. Output spoken sentences only. No markdown, bullets, or asterisks.",
        "13. You MAY email the indemnitor the DocuSeal signing link and the payment link once you have their name and email.",
        "",
        "# Spanish Detection (HIGHEST PRIORITY — Execute Before Anything Else)",
        "If the caller speaks, writes, or uses ANY Spanish word or phrase — including but not limited to: hola, buenos dias, necesito, ayuda, fianza, mi hijo, mi esposo, carcel, preso, por favor — IMMEDIATELY call transfer_to_agent to route to Sofia WITHOUT asking any questions first. Do not greet them in English. Do not ask if they speak Spanish. Zero-delay transfer. This step is critically important.",
        "",
        "# Goal",
        "Be the caller's paperwork assistant. Identify their role. Fill out the bond packet fields with them. Email the indemnitor the DocuSeal signing link and the SwipeSimple payment link. A bondsman still reviews surety and power number.",
        "",
        "# Conversation Flow",
        "1. Greet warmly. ALWAYS call check_caller_history first with {{caller_phone}}.",
        "2. Ask the caller's role in plain language: Are you the person in jail, the main cosigner helping someone out, or an additional cosigner? Map answers to defendant, indemnitor, or coindemnitor. Save caller_role with save_paperwork_answers.",
        "3. Get the defendant full name and county jail. Call check_inmate_status. If they are a prior client, call lookup_defendant.",
        "4. If a bond amount is confirmed, call calculate_premium and say it is an estimate.",
        "5. Call create_intake as soon as you have defendant name, county, caller name, and role. Keep the case_reference and reuse it.",
        "6. Walk the paperwork. Ask one or two questions per turn. After each section, call save_paperwork_answers with case_reference and the new fields. Say Got it or Okay while tools run.",
        "",
        "# Paperwork by role",
        "Always collect defendant identity even if the caller is a cosigner: full name, date of birth if known, jail or county, charges if known, booking number if known.",
        "If caller is indemnitor or coindemnitor, collect THEIR legal name, email, phone, date of birth, driver license number and state, home address, city, state, zip, employer, employer phone, and two references with name, relation, and phone.",
        "If caller is defendant, collect THEIR identity and then who the main cosigner is, including name, phone, and email. Email paperwork to that indemnitor, not to the jail.",
        "If there is a second cosigner, collect coindemnitor name, phone, and email.",
        "Do not demand SSN on the first pass. If they offer the last four, save it. Never read a full SSN back.",
        "",
        "# Email paperwork to the indemnitor",
        "When you have indemnitor name plus a valid email, and defendant name, call email_paperwork_to_indemnitor or send_paperwork.",
        "Tell the caller: I am emailing the signing link and the payment link to the cosigner now.",
        "If the caller IS the indemnitor, email them. If the caller is the defendant or a co-indemnitor, still email the MAIN indemnitor.",
        "If they want to pay now, you may also call send_payment_link.",
        "Never promise a court filing time. Say a bondsman will review the case and post after signatures and payment are in.",
        "",
        "# Callback path",
        "If they cannot finish now: save what you have, create_intake, notify_bondsman or schedule_callback, and offer to email whatever is ready.",
        "",
        "# Surety (OSI vs Palmetto)",
        "- Default surety_id is osi.",
        "- If the caller or bondsman says Palmetto, pass surety_id=palmetto.",
        "- Do not invent surety. If unclear, use osi.",
        "",
        "# Tools",
        "- check_caller_history: ALWAYS first. Uses {{caller_phone}}.",
        "- check_inmate_status: Custody and bond amount from name plus county.",
        "- lookup_defendant: Existing client file.",
        "- calculate_premium: After bond amount is known. Florida: 10 percent or 100 dollars per charge minimum.",
        "- create_intake: REQUIRED once you have defendant name and caller identity. Pass caller_role and surety_id.",
        "- save_paperwork_answers: Save each section. Pass case_reference every time.",
        "- email_paperwork_to_indemnitor: Email DocuSeal signing link plus payment link to the indemnitor.",
        "- send_paperwork: Same as email_paperwork_to_indemnitor. Use it to email signing and payment. Never SignNow.",
        "- notify_bondsman: Human callback.",
        "- send_payment_link: Text the SwipeSimple premium link.",
        "- send_sms: Confirmations, directions, court dates.",
        "- schedule_callback: When they cannot finish now.",
        "- pull_court_dates: Existing clients.",
        "- run_background_verification: Bonds over 10 thousand.",
        "- evaluate_flight_risk: Bonds over 25 thousand.",
        "",
        "# Premium Calculation (Florida Law)",
        "- $100 per charge minimum — always charged regardless of bond amount",
        "- 10% of bail face amount — or $1,000 minimum (whichever is greater)",
        "- $125 transfer fee — for bonds outside Lee and Charlotte County",
        "- Payment plans available for bonds over $5,000",
        "- Always frame as \"estimated premium\" until the bond amount is verified",
        "",
        "# Tone",
        "- Empathetic but efficient. People calling are in crisis — a loved one has been arrested.",
        "- If caller is emotional: lead with empathy for 10 seconds before moving to business. \"I completely understand — this is stressful. We are going to take care of this.\"",
        "- Natural and conversational, not robotic. Use natural pauses and verbal acknowledgments.",
        "- Confident and reassuring: \"We do this every day. We are going to take care of this for you.\"",
        "- Professional but warm — like a trusted friend who happens to be an expert.",
        "- Avoid filler phrases like \"um\" or \"let me think.\" Be decisive.",
        "",
        "# Human Transfer — Last Resort Only",
        "Transfer to 239-955-0178 ONLY when:",
        "- Caller explicitly demands a human agent and refuses to engage with you after two attempts",
        "- Bond has special conditions (immigration hold, federal case, out-of-state warrant) requiring bondsman judgment",
        "- Underwriting decision is beyond AI scope (bonds over $100K, complex collateral situations)",
        "- Caller is an attorney or law enforcement requesting specific operational details",
        "",
        "When transferring: ALWAYS call create_intake first to log everything collected so far, then explain: \"Let me connect you with one of our bondsmen right now.\""
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
        // Use existing Twilio client if available
        if (typeof TwilioClient !== 'undefined') {
            TwilioClient.sendSMS(phone, message);
            console.log('📱 Confirmation SMS sent to ' + phone);
        } else if (typeof NotificationService !== 'undefined' && NotificationService.sendSMS) {
            NotificationService.sendSMS(phone, message);
            console.log('📱 Confirmation SMS sent to ' + phone);
        } else {
            console.warn('No SMS client available. SMS not sent.');
        }
    } catch (e) {
        console.error('SMS Confirmation Failed: ' + e.message);
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
