/**
 * ============================================================================
 * MAIN WORKFLOW ORCHESTRATOR
 * ============================================================================
 * This function orchestrates the complete SignNow workflow:
 * 1. Upload merged PDF to SignNow
 * 2. Create embedded signing links for all parties
 * 3. Return signing links and document info
 */
function SN_processCompleteWorkflow(params) {
    try {
        SN_log('Workflow_Start', { caseId: params.caseId, defendantName: params.defendantName });

        // Validate required parameters
        if (!params.pdfBase64) {
            return { success: false, error: 'Missing pdfBase64' };
        }
        if (!params.fileName) {
            return { success: false, error: 'Missing fileName' };
        }

        // Step 1: Upload PDF to SignNow
        const fileName = params.fileName || `Bail_Packet_${new Date().toISOString().split('T')[0]}.pdf`;
        const uploadResult = SN_uploadDocument(params.pdfBase64, fileName);

        if (!uploadResult.success) {
            SN_log('Upload_Failed', uploadResult.error);
            return { success: false, error: 'Failed to upload document: ' + uploadResult.error };
        }

        const documentId = uploadResult.documentId;
        SN_log('Upload_Success', { documentId, fileName });

        // Step 2: Create signing links for all parties
        const formData = {
            defendantEmail: params.defendantEmail || params.formData?.defendantEmail,
            defendantPhone: params.defendantPhone || params.formData?.defendantPhone,
            indemnitorEmail: params.indemnitorEmail || params.formData?.indemnitorEmail,
            indemnitorPhone: params.indemnitorPhone || params.formData?.indemnitorPhone
        };

        const linkOptions = {
            redirect_uri: params.redirectUri || INTEGRATION_CONFIG.WIX_SIGNING_PAGE,
            decline_redirect_uri: params.declineRedirectUri || INTEGRATION_CONFIG.DECLINE_REDIRECT_URI,
            close_redirect_uri: params.closeRedirectUri || INTEGRATION_CONFIG.CLOSE_REDIRECT_URI,
            expiration: params.linkExpiration || INTEGRATION_CONFIG.LINK_EXPIRATION_MINUTES
        };

        const linksResult = SN_createAllSignerLinks(documentId, formData, linkOptions);

        if (!linksResult.success || linksResult.signingLinks.length === 0) {
            SN_log('Links_Failed', linksResult);
            return {
                success: false,
                error: 'Failed to create signing links',
                documentId: documentId
            };
        }

        SN_log('Workflow_Complete', {
            documentId,
            linksCount: linksResult.signingLinks.length
        });

        // Step 3: Return complete result
        return {
            success: true,
            documentId: documentId,
            fileName: fileName,
            signingLinks: linksResult.signingLinks,
            caseId: params.caseId,
            paymentLink: SN_getPaymentLink()
        };

    } catch (error) {
        SN_log('Workflow_Error', error.toString());
        return {
            success: false,
            error: error.toString()
        };
    }
}
