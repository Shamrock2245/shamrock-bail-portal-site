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
