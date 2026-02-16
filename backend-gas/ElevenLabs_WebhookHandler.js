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
    // ElevenLabs sends 'elevenlabs-signature' header. 
    // We need to compute HMAC-SHA256 of the body using our webhook secret.
    const signature = e.postData.contents; // Raw body needed for verification
    const signatureHeader = e.parameter['elevenlabs-signature'] || (e.postData.headers ? e.postData.headers['elevenlabs-signature'] : null);

    // TODO: strictly enforce signature verification once Secret is available
    // For now, we log usage.

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

    // TODO: Ideally, we match this to a specific Intake/Lead via metadata.conversation_id or similar.
    // For now, we'll log to a "Conversations" sheet or Slack.

    if (typeof NotificationService !== 'undefined') {
        NotificationService.sendSlack('#ai-conversations', `🎙️ *New AI Conversation*\n\n${analysis ? analysis.call_summary : '(No summary)'}`);
    }

    // Save to Google Drive (Archive)
    const folderId = PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_FOLDER_ID');
    if (folderId) {
        const folder = DriveApp.getFolderById(folderId);
        folder.createFile(`AI_Call_${payload.call_id}.txt`, fullText);
    }

    return ContentService.createTextOutput("Transcription processed").setMimeType(ContentService.MimeType.TEXT);
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
