// HTTP Functions for external API access
// Filename: backend/http-functions.js
// These endpoints can be called from Dashboard.html/GAS

import { ok, badRequest, serverError, forbidden } from 'wix-http-functions';
import { addPendingDocument, addPendingDocumentsBatch, updateDocumentStatus } from 'backend/wixApi';

/**
 * POST /api/documents/add
 * Add a single pending document
 * 
 * Request body:
 * {
 *   "apiKey": "your-api-key",
 *   "document": {
 *     "memberEmail": "signer@email.com",
 *     "memberPhone": "2395551234",
 *     "defendantName": "John Doe",
 *     "caseNumber": "2024-CF-001234",
 *     "documentName": "Bail Bond Packet - John Doe",
 *     "signingLink": "https://app.signnow.com/...",
 *     "signerRole": "defendant",
 *     "signNowDocumentId": "abc123",
 *     "expiresAt": "2024-12-31T23:59:59Z"
 *   }
 * }
 */
export async function post_documentsAdd(request) {
    try {
        const body = await request.body.json();
        
        if (!body.apiKey || !body.document) {
            return badRequest({
                body: { success: false, message: 'Missing apiKey or document' }
            });
        }
        
        const result = await addPendingDocument(body.document, body.apiKey);
        
        if (result.success) {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: result
            });
        } else {
            return forbidden({
                body: result
            });
        }
        
    } catch (error) {
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}

/**
 * POST /api/documents/batch
 * Add multiple pending documents at once
 * 
 * Request body:
 * {
 *   "apiKey": "your-api-key",
 *   "documents": [
 *     { "memberEmail": "...", "signingLink": "...", ... },
 *     { "memberEmail": "...", "signingLink": "...", ... }
 *   ]
 * }
 */
export async function post_documentsBatch(request) {
    try {
        const body = await request.body.json();
        
        if (!body.apiKey || !body.documents || !Array.isArray(body.documents)) {
            return badRequest({
                body: { success: false, message: 'Missing apiKey or documents array' }
            });
        }
        
        const result = await addPendingDocumentsBatch(body.documents, body.apiKey);
        
        if (result.success) {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: result
            });
        } else {
            return forbidden({
                body: result
            });
        }
        
    } catch (error) {
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}

/**
 * POST /api/documents/status
 * Update document status (called by SignNow webhook)
 * 
 * Request body:
 * {
 *   "apiKey": "your-api-key",
 *   "signNowDocumentId": "abc123",
 *   "status": "signed"
 * }
 */
export async function post_documentsStatus(request) {
    try {
        const body = await request.body.json();
        
        if (!body.apiKey || !body.signNowDocumentId || !body.status) {
            return badRequest({
                body: { success: false, message: 'Missing required fields' }
            });
        }
        
        const result = await updateDocumentStatus(body.signNowDocumentId, body.status, body.apiKey);
        
        if (result.success) {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: result
            });
        } else {
            return forbidden({
                body: result
            });
        }
        
    } catch (error) {
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}

/**
 * POST /api/webhook/signnow
 * SignNow webhook endpoint for document completion
 * 
 * SignNow will POST to this endpoint when a document is signed
 */
export async function post_webhookSignnow(request) {
    try {
        const body = await request.body.json();
        
        // SignNow webhook payload structure
        // https://docs.signnow.com/docs/signnow/webhooks
        
        const eventType = body.event || body.meta?.event;
        const documentId = body.document_id || body.content?.document_id;
        
        if (eventType === 'document.complete' || eventType === 'document_complete') {
            // Document has been fully signed
            // Use a stored API key for webhook authentication
            const apiKey = process.env.GAS_API_KEY || 'webhook-internal';
            
            await updateDocumentStatus(documentId, 'signed', apiKey);
            
            return ok({
                body: { received: true, status: 'processed' }
            });
        }
        
        // Acknowledge other events
        return ok({
            body: { received: true, status: 'ignored' }
        });
        
    } catch (error) {
        console.error('Webhook error:', error);
        return serverError({
            body: { received: false, error: error.message }
        });
    }
}

/**
 * GET /api/health
 * Health check endpoint
 */
export function get_health(request) {
    return ok({
        headers: { 'Content-Type': 'application/json' },
        body: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Shamrock Bail Bonds Portal API'
        }
    });
}
