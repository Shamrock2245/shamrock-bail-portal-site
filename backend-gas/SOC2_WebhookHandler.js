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

    // TODO: Add business logic to process the incoming SMS or call

    // Return TwiML
    // Note: 'Twilio' object might need a library or manual XML construction
    // Manual XML construction for minimal dependency:
    const xml = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks for your message!</Message></Response>';
    return ContentService.createTextOutput(xml).setMimeType(ContentService.MimeType.XML);
}
