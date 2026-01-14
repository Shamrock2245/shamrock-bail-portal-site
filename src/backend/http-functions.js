// HTTP Functions for external API access
// Filename: backend/http-functions.js
// These endpoints can be called from Dashboard.html/GAS

import { ok, badRequest, serverError, forbidden } from 'wix-http-functions';
import { addPendingDocument, addPendingDocumentsBatch, updateDocumentStatus } from 'backend/wixApi';
import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';

/**
 * POST /api/syncCaseData
 * Sync case data from Google Apps Script to Wix CMS
 * 
 * This endpoint is called by GAS when a case is saved/updated
 * 
 * Request body:
 * {
 *   "apiKey": "your-api-key",
 *   "caseData": {
 *     "caseNumber": "2024-CF-001234",
 *     "defendantName": "John Doe",
 *     "defendantEmail": "john@example.com",
 *     "defendantPhone": "2395551234",
 *     "indemnitorName": "Jane Doe",
 *     "indemnitorEmail": "jane@example.com",
 *     "indemnitorPhone": "2395555678",
 *     "bondAmount": "10000",
 *     "county": "Collier",
 *     "arrestDate": "2024-01-15",
 *     "charges": "DUI",
 *     "status": "pending",
 *     "receiptNumber": "201234",
 *     "gasSheetRow": 5
 *   }
 * }
 */
export async function post_apiSyncCaseData(request) {
    try {
        const body = await request.body.json();

        // Validate API key
        if (!body.apiKey) {
            return badRequest({
                body: { success: false, message: 'Missing apiKey' }
            });
        }

        // Verify API key against stored secret
        const validApiKey = await getSecret('GAS_API_KEY');
        if (body.apiKey !== validApiKey) {
            return forbidden({
                body: { success: false, message: 'Invalid API key' }
            });
        }

        // Validate case data
        if (!body.caseData || !body.caseData.caseNumber) {
            return badRequest({
                body: { success: false, message: 'Missing caseData or caseNumber' }
            });
        }

        const caseData = body.caseData;



        // Use Strict camelCase Schema (Matching 'Cases' Collection)
        const c = {
            caseNumber: caseData.caseNumber,
            defendantName: caseData.defendantName,
            defendantEmail: caseData.defendantEmail,
            defendantPhone: caseData.defendantPhone,
            indemnitorName: caseData.indemnitorName,
            indemnitorEmail: caseData.indemnitorEmail,
            indemnitorPhone: caseData.indemnitorPhone,
            bondAmount: caseData.bondAmount,
            county: caseData.county,
            arrestDate: caseData.arrestDate,
            charges: caseData.charges,
            status: caseData.status,
            receiptNumber: caseData.receiptNumber,
            gasSheetRow: caseData.gasSheetRow
        };

        if (!c.caseNumber) {
            return badRequest({
                body: { success: false, message: 'Missing caseNumber' }
            });
        }

        const recordToSave = {
            caseNumber: c.caseNumber,
            defendantName: c.defendantName,
            defendantEmail: c.defendantEmail,
            defendantPhone: c.defendantPhone,
            indemnitorName: c.indemnitorName,
            indemnitorEmail: c.indemnitorEmail,
            indemnitorPhone: c.indemnitorPhone,
            bondAmount: c.bondAmount,
            county: c.county,
            arrestDate: c.arrestDate,
            charges: c.charges,
            status: c.status,
            receiptNumber: c.receiptNumber,
            gasSheetRow: c.gasSheetRow,
            lastSyncedAt: new Date()
        };

        const existingCases = await wixData.query('Cases')
            .eq('caseNumber', c.caseNumber)
            .find();

        let result;

        if (existingCases.items.length > 0) {
            const existingCase = existingCases.items[0];
            // Merge existing ID
            recordToSave._id = existingCase._id;
            result = await wixData.update('Cases', recordToSave);
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, message: 'Case updated', caseId: result._id, action: 'updated' }
            });
        } else {
            result = await wixData.insert('Cases', recordToSave);
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, message: 'Case created', caseId: result._id, action: 'created' }
            });
        }

    } catch (error) {
        console.error('Error syncing case data:', error);
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}

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
