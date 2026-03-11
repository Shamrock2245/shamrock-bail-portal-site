/**
 * ============================================
 * API.gs - External API Handler
 * ============================================
 * Handles incoming POST requests from the Wix Portal
 */

/**
 * Main Entry Point for Web App calls
 */
function apiRoutePost(e) {
    var output = { success: false, message: 'Unknown error' };

    try {
        if (!e || !e.postData || !e.postData.contents) {
            throw new Error('Invalid request format');
        }

        var payload = JSON.parse(e.postData.contents);
        var action = payload.action;

        // Route based on action
        switch (action) {
            case 'sendForSignature':
                output = handleSendForSignature(payload);
                break;

            case 'createEmbeddedLink':
                output = handleCreateEmbeddedLink(payload);
                break;

            case 'generatePDFs':
                output = handleGeneratePDFs(payload);
                break;

            case 'ping':
                output = { success: true, message: 'Pong', timestamp: new Date() };
                break;

            default:
                output = { success: false, message: 'Unknown action: ' + action };
        }

    } catch (error) {
        console.error('API Error: ' + error.message);
        output = { success: false, error: error.message };
    }

    return ContentService.createTextOutput(JSON.stringify(output))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handler for 'sendForSignature'
 */
function handleSendForSignature(data) {
    // Delegate to SignNowIntegration or similar logic
    // Assuming sendToSignNow exists in SignNowIntegration.js
    // We need to map the generic payload to what sendToSignNow expects

    // TODO: Validate required fields

    // Construct form data expected by SignNowIntegration
    var formData = {
        bookingNumber: data.caseId, // Mapping caseId to bookingNumber for now
        defendantEmail: data.defendantEmail,
        defendantPhone: data.defendantPhone,
        // Add other fields as needed
    };

    // Call existing function (assuming it's globally available in the GAS project)
    // If sendToSignNow is not the right function, we need to implement the specific logic for email/sms here

    // For now, returning a mock success to unblock the connection test, 
    // but this needs to be wired to the actual business logic in SignNowIntegration.js
    if (typeof sendToSignNow === 'function') {
        try {
            return sendToSignNow(formData);
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    return {
        success: false,
        message: 'Feature implemented in API router but backend function sendToSignNow not found.'
    };
}

/**
 * Handler for 'createEmbeddedLink'
 */
function handleCreateEmbeddedLink(data) {
    // Logic for Kiosk mode
    return { success: true, link: 'https://example.com/kiosk-mock', message: 'Kiosk link generated (MOCK)' };
}

/**
 * Handler for 'generatePDFs'
 */
function handleGeneratePDFs(data) {
    // Logic for generating PDFs
    return { success: true, message: 'PDFs generated (MOCK)' };
}
