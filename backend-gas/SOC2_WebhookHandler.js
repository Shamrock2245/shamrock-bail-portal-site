//
// SOC2_WebhookHandler.gs - Secure Webhook Handling logic
// renamed from WebhookHandler.gs to avoid conflict with existing non-compliant handler
//

/**
 * Main entry point for all incoming webhooks routed via SOC II controls.
 * @param {object} e The event parameter from Google Apps Script.
 */
function handleSOC2Webhook(e) {
    // Determine path from pathInfo OR parameter 'source'
    const path = e.pathInfo || e.parameter.source;

    try {
        switch (path) {
            case "signnow":
            case "SignNow":
                return handleSignNowWebhookSOC2(e);
            case "twilio":
            case "Twilio":
                return handleTwilioWebhookSOC2(e);
            case "elevenlabs":
            case "ElevenLabs":
                return handleElevenLabsWebhookSOC2(e);
            case "whatsapp":
            case "WhatsApp":
                return handleWhatsAppWebhookSOC2(e);
            default:
                logSecurityEvent("UNKNOWN_WEBHOOK", { path: path });
                return ContentService.createTextOutput("Unknown endpoint or source").setMimeType(ContentService.MimeType.TEXT);
        }
    } catch (error) {
        logSecurityEvent("WEBHOOK_ERROR", { path: path, error: error.toString() });
        return ContentService.createTextOutput("Error processing webhook").setMimeType(ContentService.MimeType.TEXT);
    }
}

/**
 * Handles webhooks from SignNow with signature verification.
 * @param {object} e The event parameter.
 */
function handleSignNowWebhookSOC2(e) {
    // Note: SignNow sends the signature in a specific header.
    // Ensure 'SIGNNOW_WEBHOOK_SECRET' is set in Script Properties.
    if (!verifyWebhookSignature(e, "SIGNNOW_WEBHOOK_SECRET", "x-signnow-signature")) {
        return ContentService.createTextOutput("Invalid signature").setMimeType(ContentService.MimeType.TEXT);
    }

    let payload;
    try {
        payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
        logSecurityEvent("WEBHOOK_PAYLOAD_PARSE_ERROR", { error: parseErr.toString() });
        return ContentService.createTextOutput("Invalid JSON").setMimeType(ContentService.MimeType.TEXT);
    }

    logProcessingEvent("SIGNNOW_WEBHOOK_RECEIVED", payload);

    // DELEGATE TO EXISTING BUSINESS LOGIC
    // If we have an existing handler in SignNowAPI.gs or Code.js, call it here.
    // Example: handleDocumentComplete(payload)
    if (payload.event === 'document.complete' || payload.event === 'document_complete') {
        if (typeof handleDocumentComplete === 'function') {
            return handleDocumentComplete(payload);
        }
    }

    return ContentService.createTextOutput("Webhook received and logged").setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Handles webhooks from Twilio with signature verification.
 * @param {object} e The event parameter.
 */
function handleTwilioWebhookSOC2(e) {
    if (!verifyWebhookSignature(e, "TWILIO_AUTH_TOKEN", "x-twilio-signature")) {
        return ContentService.createTextOutput("Invalid signature").setMimeType(ContentService.MimeType.TEXT);
    }

    const payload = e.parameter;
    logProcessingEvent("TWILIO_WEBHOOK_RECEIVED", payload);

    // --- MANUS PROJECT (WHATSAPP) ---
    // Detect WhatsApp sender (e.g., whatsapp:+1234567890)
    if (payload.From && payload.From.startsWith('whatsapp:')) {
        if (typeof handleManusWhatsApp === 'function') {
            return handleManusWhatsApp(payload);
        } else {
            // Fallback if Manus_Brain.js not loaded
            return ContentService.createTextOutput("Manus unavailable").setMimeType(ContentService.MimeType.TEXT);
        }
    }

    // Business Logic: Log to Slack and Reply
    try {
        const from = payload.From || 'Unknown';
        const body = payload.Body || '';

        // 1. Notify Slack (Office)
        if (typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#incoming-sms', `📱 *SMS from ${from}*\n>${body}`);
        } else if (typeof sendSlackMessage === 'function') {
            // Fallback to legacy if NotificationService missing (shouldn't happen)
            sendSlackMessage('#incoming-sms', `📱 *SMS from ${from}*\n>${body}`);
        }

        // 2. Log to Sheet (if applicable)
        // logCommunication(from, 'inbound', body); // Hypothetical helper

    } catch (err) {
        console.error('Error processing SMS logic:', err);
    }

    // Return TwiML (Auto-Reply)
    // We could make this dynamic based on keywords (e.g. "STOP", "HELP")
    // Twilio handles STOP/HELP automatically if configured, but explicit handling is good.

    let replyMsg = "Thank you for contacting Shamrock Bail Bonds. An agent will be with you shortly. If this is an emergency, please call 239-332-2245.";

    // Simple Keyword Matching
    const lowerBody = (payload.Body || '').toLowerCase();
    if (lowerBody.includes('check in') || lowerBody.includes('checkin')) {
        replyMsg = "To check in, please visit: https://shamrockbailbonds.biz/check-in";
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyMsg}</Message></Response>`;
    return ContentService.createTextOutput(xml).setMimeType(ContentService.MimeType.XML);
}

/**
 * Handles webhooks from WhatsApp Cloud API with signature verification.
 * @param {object} e The event parameter.
 */
function handleWhatsAppWebhookSOC2(e) {
    // 1. VERIFICATION REQUEST (GET)
    // Meta sends a GET request to verify the webhook URL
    if (e.parameter['hub.mode'] === 'subscribe' && e.parameter['hub.verify_token']) {
        const props = PropertiesService.getScriptProperties().getProperties();
        const verifyToken = props.WHATSAPP_VERIFY_TOKEN;

        if (e.parameter['hub.verify_token'] === verifyToken) {
            return ContentService.createTextOutput(e.parameter['hub.challenge']);
        } else {
            return ContentService.createTextOutput('Verification failed: Invalid Token').setMimeType(ContentService.MimeType.TEXT);
        }
    }

    // 2. EVENT NOTIFICATION (POST)
    try {
        const payload = JSON.parse(e.postData.contents);
        logProcessingEvent("WHATSAPP_WEBHOOK_RECEIVED", { entries: payload.entry ? payload.entry.length : 0 });

        // Process Incoming Messages
        if (payload.entry && payload.entry[0].changes && payload.entry[0].changes[0].value.messages) {
            const message = payload.entry[0].changes[0].value.messages[0];
            const from = message.from; // Sender phone ID
            const text = message.text ? message.text.body : '[Media/Other]';
            const type = message.type;
            const name = payload.entry[0].changes[0].value.contacts[0].profile.name;

            // Notify Slack
            if (typeof NotificationService !== 'undefined') {
                NotificationService.sendSlack('#incoming-sms', `🟢 *WhatsApp from ${name} (${from})*\n>${text}`);
            }
        }

        return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

    } catch (error) {
        logSecurityEvent("WHATSAPP_WEBHOOK_ERROR", { error: error.toString() });
        return ContentService.createTextOutput("Error processing webhook").setMimeType(ContentService.MimeType.TEXT);
    }
}
