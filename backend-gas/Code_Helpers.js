/**
 * SOC II COMPLIANT WRAPPER for Wix Portal Generation
 * Logs access, checks consent, and verifies payload before execution.
 * @param {object} payload The data sent from the Wix portal.
 */
function generateAndSendWithWixPortal_Safe(payload) {
    const userId = payload.userId || (payload.formData ? payload.formData.email : 'unknown');
    const caseId = payload.caseId || payload.caseNumber || 'pending';

    // 1. Log the access event
    if (typeof logAccessEvent === 'function') {
        logAccessEvent(userId, 'generateAndSendWithWixPortal', 'execute', { caseId: caseId });
    }

    // 2. Validate the input payload
    const indemnitorEmail = payload.indemnitorEmail || (payload.formData && payload.formData.indemnitors && payload.formData.indemnitors[0] && payload.formData.indemnitors[0].email);

    if (!caseId || !indemnitorEmail) {
        if (typeof logSecurityEvent === 'function') {
            logSecurityEvent('INVALID_PAYLOAD', { function: 'generateAndSendWithWixPortal', reason: 'Missing caseId or indemnitorEmail' });
        }
        return { success: false, error: 'Invalid input data: Missing Case ID or Indemnitor Email' };
    }

    // 3. Check for consent (Non-blocking mode for now)
    if (typeof hasConsent === 'function' && !hasConsent(userId, 'document_generation')) {
        if (typeof logSecurityEvent === 'function') {
            logSecurityEvent('CONSENT_MISSING', { userId: userId, consentType: 'document_generation' });
        }
        // UNCOMMENT TO ENFORCE BLOCKING:
        // return { success: false, error: 'Consent not given for document generation' };
    }

    // 4. Proceed with document generation and sending
    try {
        if (typeof logProcessingEvent === 'function') {
            logProcessingEvent('DOCUMENT_GENERATION_STARTED', { caseId: caseId });
        }

        // CALL THE INTERNAL FUNCTION (from WixPortalIntegration.gs)
        let result;
        if (typeof generateAndSendWithWixPortal === 'function') {
            result = generateAndSendWithWixPortal(payload.formData || payload);
        } else if (typeof WixPortalIntegration !== 'undefined' && WixPortalIntegration.generateAndSendWithWixPortal) {
            result = WixPortalIntegration.generateAndSendWithWixPortal(payload.formData || payload);
        } else {
            throw new Error("Internal generation function not found.");
        }

        if (typeof logProcessingEvent === 'function') {
            logProcessingEvent('DOCUMENT_GENERATION_COMPLETED', { caseId: caseId, success: result.success });
        }
        return result;

    } catch (error) {
        if (typeof logSecurityEvent === 'function') {
            logSecurityEvent('DOCUMENT_GENERATION_FAILED', { caseId: caseId, error: error.toString() });
        }
        return { success: false, error: 'Failed to generate document: ' + error.message };
    }
}
