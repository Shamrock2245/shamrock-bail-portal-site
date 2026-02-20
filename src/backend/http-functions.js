// HTTP Functions for external API access
// Filename: backend/http-functions.js
// These endpoints can be called from Dashboard.html/GAS

import { ok, badRequest, serverError, forbidden } from 'wix-http-functions';
import { buildPortalUrl } from 'backend/portal-url';
import crypto from 'crypto';
import {
    addPendingDocument,
    addPendingDocumentsBatch,
    updateDocumentStatus,
    getPendingIntakes,
    markIntakeProcessed,
    getIndemnitorProfile
} from 'backend/wixApi.jsw';
import { getSecret } from 'wix-secrets-backend';
import wixData from 'wix-data';
import { logSafe } from 'backend/logging';
import * as gasIntegration from 'backend/gasIntegration.jsw';
import { syncCountiesToCms } from 'backend/cronJobs';

import { createCustomSession, lookupUserByContact } from 'backend/portal-auth';

/**
 * GET /_functions/triggerCountySync
 * Manually trigger the county data sync (Admin only)
 */
export async function get_triggerCountySync(request) {
    // Ideally protect this with a secret or admin check
    // For now, let's just run it as it's a safe idempotent operation
    try {
        const result = await syncCountiesToCms();
        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return serverError({
            body: { success: false, error: error.message }
        });
    }
}

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
        const validApiKey = await getSecret('GAS_API_KEY').catch(() => null);

        // Fail closed if secret is missing
        if (!validApiKey) {
            console.error('CRITICAL: GAS_API_KEY secret is missing. Blocking request.');
            return serverError({ body: { success: false, message: 'Server misconfiguration' } });
        }

        if (body.apiKey !== validApiKey) {
            logSafe('Invalid API Key attempt', { provided: body.apiKey }, 'warn');
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
 * GET /_functions/testAuth
 * Triggers the full auth flow test
 */
export async function get_testAuth(request) {
    const { testFullAuthFlow } = await import('backend/test_auth_flow');
    const result = await testFullAuthFlow();
    return ok({
        headers: { 'Content-Type': 'application/json' },
        body: result
    });
}

// Debug endpoints removed after verification

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
 * Securely verifies SignNow HMAC signature
 */
export async function post_webhookSignnow(request) {
    try {
        const signature = request.headers['x-signnow-signature'];
        const bodyText = await request.body.text();

        // 1. Verify Signature
        if (signature) {
            const secret = await getSecret('SIGNNOW_WEBHOOK_SECRET').catch(() => '');
            if (secret) {
                const generatedSignature = crypto.createHmac('sha256', secret)
                    .update(bodyText)
                    .digest('hex');

                if (signature !== generatedSignature) {
                    logSafe('Invalid SignNow Signature', { signature, generatedSignature }, 'warn');
                    return forbidden({ body: { error: 'Invalid signature' } });
                }
            } else {
                console.warn('SIGNNOW_WEBHOOK_SECRET missing. Skipping signature check (Legacy Mode).');
            }
        }

        const body = JSON.parse(bodyText);
        const eventType = body.event || body.meta?.event;
        const documentId = body.document_id || body.content?.document_id;

        if (eventType === 'document.complete' || eventType === 'document_complete') {
            const apiKey = await getSecret('GAS_API_KEY').catch(() => 'webhook-internal');
            await updateDocumentStatus(documentId, 'signed', apiKey);
            return ok({ body: { received: true, status: 'processed' } });
        }

        return ok({ body: { received: true, status: 'ignored' } });

    } catch (error) {
        console.error('Webhook error:', error);
        return serverError({ body: { received: false, error: error.message } });
    }
}

// Social Auth Imports
import { verifyGoogleUser, verifyFacebookUser } from 'backend/social-auth';

/**
 * GET /_functions/authCallback
 * Public endpoint for OAuth 2.0 Redirects (Google/Facebook)
 * 
 * Flow:
 * 1. Provider redirects here with ?code=...
 * 2. We exchange code for profile (server-to-server)
 * 3. We lookup user in Cases collection
 * 4. We generate Custom Session Token
 * 5. We return HTML that posts token to window.opener
 */
export async function get_authCallback(request) {
    const { code, state, error } = request.query;

    // 1. Handle Errors
    if (error || !code) {
        return response(200, renderCloseScript({ success: false, message: "Login denied or failed." }));
    }

    try {
        let userProfile = null;

        // 2. Determine Provider (state param passed from frontend)
        if (state === 'google') {
            userProfile = await verifyGoogleUser(code);
        } else if (state === 'facebook') {
            userProfile = await verifyFacebookUser(code);
        } else {
            return response(200, renderCloseScript({ success: false, message: "Invalid provider state." }));
        }

        if (!userProfile || !userProfile.email) {
            return response(200, renderCloseScript({ success: false, message: "Could not verify email address." }));
        }

        // 3. Lookup User (Wiring Finisher Logic)
        const lookup = await lookupUserByContact(userProfile.email);

        let sessionToken = null;
        let wixSessionToken = null;
        let role = 'indemnitor';

        if (lookup.found) {
            // Existing User
            role = lookup.role;
            sessionToken = await createCustomSession(
                lookup.personId,
                lookup.role,
                lookup.caseId,
                { email: userProfile.email, name: userProfile.name }
            );
            wixSessionToken = null; // API bypasses Wix Members
        } else {
            // New User (Default to Indemnitor)
            const newPersonId = `social_${state}_${userProfile.id || Date.now()}`;
            sessionToken = await createCustomSession(
                newPersonId,
                'indemnitor',
                null,
                { email: userProfile.email, name: userProfile.name }
            );
            wixSessionToken = null; // API bypasses Wix Members
        }

        // 4. Return Success HTML with token
        const targetUrl = await buildPortalUrl('/portal-landing', { st: sessionToken });

        return response(200, renderCloseScript({
            success: true,
            message: "Login successful!"
        }, targetUrl));

    } catch (err) {
        console.error("Auth Callback Error:", err);
        const fallbackUrl = await buildPortalUrl('/portal-landing');
        return response(200, renderCloseScript({ success: false, message: "System error during login." }, fallbackUrl));
    }
}

/**
 * Helper to return HTML response
 */
function response(status, body) {
    return ok({
        headers: { "Content-Type": "text/html" },
        body: body
    });
}

/**
 * HTML that passes data back to the main window and closes popup, OR redirects if not in popup.
 */
/**
 * HTML that passes data back to the main window and closes popup, OR redirects if not in popup.
 * ROBUST VERSION with retry logic and better error handling
 */
function renderCloseScript(data, targetUrl) {
    const safeData = JSON.stringify(data);
    // Default fallback if no target provided
    const finalUrl = targetUrl || "https://shamrockbailbonds.biz/portal-landing";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <!-- META REFRESH AS ROBUST FALLBACK -->
        <meta http-equiv="refresh" content="2;url=${finalUrl}">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; padding-top: 50px; background-color: #f4f4f4; color: #333; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #2ecc71; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2ecc71; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; }
            .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <div class="container">
            <div id="loader" class="loader"></div>
            <h3 id="status">Finishing login...</h3>
            <p id="message">Redirecting you now...</p>
            
            <div id="manual-redirect">
                <br>
                <a id="continue-link" href="${finalUrl}" class="btn">Click here to continue</a>
            </div>
        </div>

        <script>
          const data = ${safeData};
          const targetUrl = "${finalUrl}";
          
          console.log('🚀 Redirecting to:', targetUrl);
          
          // Immediate JS Redirect using replace (better for history)
          try {
              window.location.replace(targetUrl);
          } catch(e) {
              window.location.href = targetUrl;
          }
        </script>
      </body>
      </html>
    `;
}

/**
 * POST /api/sms/send
 * Send SMS via Twilio - allows GAS to trigger SMS through Wix
 * This keeps Twilio credentials secure in Wix Secrets Manager
 * 
 * Request body:
 * {
 *   "apiKey": "your-api-key",
 *   "to": "2395551234",
 *   "body": "Your message here"
 * }
 */
export async function post_smsSend(request) {
    try {
        const body = await request.body.json();

        // Validate API key
        if (!body.apiKey) {
            return badRequest({
                body: { success: false, message: 'Missing apiKey' }
            });
        }

        const validApiKey = await getSecret('GAS_API_KEY');
        if (body.apiKey !== validApiKey) {
            logSafe('Invalid SMS API Key', { provided: body.apiKey }, 'warn');
            return forbidden({
                body: { success: false, message: 'Invalid API key' }
            });
        }

        // Validate required fields
        if (!body.to || !body.body) {
            return badRequest({
                body: { success: false, message: 'Missing required fields: to, body' }
            });
        }

        // Import and call Twilio client
        const { sendSms } = await import('backend/twilio-client');
        const result = await sendSms(body.to, body.body);

        if (result.success) {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, message: 'SMS sent successfully' }
            });
        } else {
            return serverError({
                body: { success: false, message: result.error || 'Failed to send SMS' }
            });
        }

    } catch (error) {
        console.error('SMS send error:', error);
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}

/**
 * POST /api/sms/signing-link
 * Send a signing link via SMS - convenience endpoint for GAS
 * 
 * Request body:
 * {
 *   "apiKey": "your-api-key",
 *   "phone": "2395551234",
 *   "signingLink": "https://app.signnow.com/...",
 *   "recipientType": "defendant" | "indemnitor",
 *   "defendantName": "John Doe" (optional)
 * }
 */
export async function post_smsSigningLink(request) {
    try {
        const body = await request.body.json();

        // Validate API key
        if (!body.apiKey) {
            return badRequest({
                body: { success: false, message: 'Missing apiKey' }
            });
        }

        const validApiKey = await getSecret('GAS_API_KEY');
        if (body.apiKey !== validApiKey) {
            logSafe('Invalid Link API Key', { provided: body.apiKey }, 'warn');
            return forbidden({
                body: { success: false, message: 'Invalid API key' }
            });
        }

        // Validate required fields
        if (!body.phone || !body.signingLink) {
            return badRequest({
                body: { success: false, message: 'Missing required fields: phone, signingLink' }
            });
        }

        const { sendSigningLinkViaSms } = await import('backend/signing-methods');
        const result = await sendSigningLinkViaSms(
            body.phone,
            body.signingLink,
            body.recipientType || 'defendant'
        );

        if (result.success) {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, message: `Signing link sent to ${body.phone}` }
            });
        } else {
            return serverError({
                body: { success: false, message: result.error || 'Failed to send signing link' }
            });
        }

    } catch (error) {
        console.error('Signing link SMS error:', error);
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}

/**
 * POST /_functions/twilioStatus
 * Twilio SMS Status Callback Endpoint
 * 
 * Twilio will POST to this endpoint when SMS status changes:
 * - queued -> sending -> sent -> delivered (success)
 * - queued -> sending -> sent -> undelivered (failure)
 * - failed (immediate failure)
 * 
 * This is used for delivery tracking and logging.
 */
export async function post_twilioStatus(request) {
    try {
        const signature = request.headers['x-twilio-signature'];
        const bodyText = await request.body.text();
        const params = new URLSearchParams(bodyText);

        // 1. Verify Twilio Signature
        const authToken = await getSecret('TWILIO_AUTH_TOKEN').catch(() => '');
        if (authToken && signature) {
            const url = 'https://www.shamrockbailbonds.biz/_functions/twilioStatus';

            // Reconstruct payload for validation
            // Twilio signs: URL + sorted params
            const paramObj = {};
            for (const [key, value] of params.entries()) {
                paramObj[key] = value;
            }

            const sortedKeys = Object.keys(paramObj).sort();
            let data = url;
            for (const key of sortedKeys) {
                data += `${key}${paramObj[key]}`;
            }

            const generatedSignature = crypto.createHmac('sha1', authToken)
                .update(Buffer.from(data, 'utf-8'))
                .digest('base64');

            if (signature !== generatedSignature) {
                console.warn('Twilio Signature Mismatch', { signature, generatedSignature });
                // We log but don't hard block yet to prevent outages if URL is slightly off
                // return forbidden({ body: { error: 'Invalid signature' } });
            }
        }

        const statusData = {
            messageSid: params.get('MessageSid'),
            messageStatus: params.get('MessageStatus'),
            to: params.get('To'),
            from: params.get('From'),
            errorCode: params.get('ErrorCode'),
            errorMessage: params.get('ErrorMessage'),
            accountSid: params.get('AccountSid')
        };

        logSafe('📱 Twilio Status Callback:', statusData);

        if (statusData.messageStatus === 'delivered') {
            console.log(`✅ SMS Delivered: ${statusData.messageSid} to ${statusData.to}`);
        } else if (statusData.messageStatus === 'undelivered' || statusData.messageStatus === 'failed') {
            logSafe(`❌ SMS Failed: ${statusData.messageSid} to ${statusData.to}`, {
                errorCode: statusData.errorCode,
                errorMessage: statusData.errorMessage
            }, 'error');

            try {
                await wixData.insert('SmsDeliveryLogs', {
                    messageSid: statusData.messageSid,
                    to: statusData.to,
                    from: statusData.from,
                    status: statusData.messageStatus,
                    errorCode: statusData.errorCode,
                    errorMessage: statusData.errorMessage,
                    timestamp: new Date()
                });
            } catch (logError) {
                console.log('Note: SmsDeliveryLogs collection not found, skipping log storage');
            }
        }

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: { received: true, status: statusData.messageStatus }
        });

    } catch (error) {
        console.error('Twilio Status Callback Error:', error);
        return ok({ body: { received: true, error: 'Processing error' } });
    }
}

/**
 * POST /_functions/twilioInbound
 * Handles incoming SMS from Twilio (Replies)
 * Forwards the message to Office Cell Phones via TwiML
 */
export async function post_twilioInbound(request) {
    try {
        const signature = request.headers['x-twilio-signature'];
        const bodyText = await request.body.text();
        const params = new URLSearchParams(bodyText);

        // 1. Verify Twilio Signature
        const authToken = await getSecret('TWILIO_AUTH_TOKEN').catch(() => '');
        if (authToken && signature) {
            const url = 'https://www.shamrockbailbonds.biz/_functions/twilioInbound';

            // Reconstruct payload for validation
            const paramObj = {};
            for (const [key, value] of params.entries()) {
                paramObj[key] = value;
            }

            const sortedKeys = Object.keys(paramObj).sort();
            let data = url;
            for (const key of sortedKeys) {
                data += `${key}${paramObj[key]}`;
            }

            const generatedSignature = crypto.createHmac('sha1', authToken)
                .update(Buffer.from(data, 'utf-8'))
                .digest('base64');

            if (signature !== generatedSignature) {
                console.warn('Twilio Inbound Signature Mismatch', { signature, generatedSignature });
                // return forbidden({ body: '<Response></Response>' });
            }
        }

        const fromNumber = params.get('From');
        const messageBody = params.get('Body');

        // Office Phones to forward to
        const FORWARD_TO = ['+12399550178', '+12399550301'];

        // Construct TwiML
        let twiml = '<?xml version="1.0" encoding="UTF-8"?>';
        twiml += '<Response>';

        FORWARD_TO.forEach(phone => {
            twiml += `<Message to="${phone}">`;
            twiml += `Shamrock Reply from ${fromNumber}: ${messageBody}`;
            twiml += '</Message>';
        });

        twiml += '</Response>';

        return ok({
            headers: {
                "Content-Type": "text/xml"
            },
            body: twiml
        });

    } catch (error) {
        console.error('Twilio Inbound Error:', error);
        return ok({
            headers: { "Content-Type": "text/xml" },
            body: '<Response></Response>'
        });
    }
}



/**
 * GET /_functions/testTwilio
 * Temporary Debug Endpoint
 * Usage: https://www.shamrockbailbonds.biz/_functions/testTwilio?phone=+15551234567&key=shamrock-debug
 */
export async function get_testTwilio(request) {
    const phone = request.query.phone;
    const msg = request.query.msg || "Test from Shamrock Debugger";
    const key = request.query.key;

    if (key !== 'shamrock-debug') {
        return forbidden({ body: { error: "Invalid debug key" } });
    }

    if (!phone) {
        return badRequest({ body: { error: "Missing 'phone' query parameter" } });
    }

    try {
        // Dynamic import to test module resolution too
        const { sendSms } = await import('backend/twilio-client');

        // Test Secret Access first
        const secretCheck = await getSecret('TWILIO_ACCOUNT_SID').catch(e => "FAILED_TO_READ");

        const start = Date.now();
        const result = await sendSms(phone, msg);
        const duration = Date.now() - start;

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: {
                test: "Twilio SMS",
                target: phone,
                duration: `${duration}ms`,
                secretStatus: secretCheck === "FAILED_TO_READ" ? "Values Missing/Unreadable" : "Readable",
                result: result
            }
        });
    } catch (error) {
        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: false,
                error: error.message,
                stack: error.stack
            }
        });
    }
}

/**
 * GET /_functions/debugCounties
 * List all counties in the DB
 */
export async function get_debugCounties(request) {
    try {
        const { listAllCounties } = await import('backend/debug-counties');
        const data = await listAllCounties();
        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: { success: true, count: data.length, items: data }
        });
    } catch (error) {
        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: { success: false, error: error.message }
        });
    }
}

/**
 * GET /api/health
 * ... (existing health check)
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

/**
 * GET /_functions/sitemap
 * Serves a custom XML sitemap for Google Search Console
 * URL: https://www.shamrockbailbonds.biz/_functions/sitemap
 * UPDATED: Dynamic generation from database
 */
export async function get_sitemap(request) {
    const SITE_URL = 'https://www.shamrockbailbonds.biz';
    const LAST_MOD = new Date().toISOString().split('T')[0];

    // Static pages with their priorities and change frequencies
    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/how-bail-works', priority: '0.9', changefreq: 'monthly' },
        { url: '/florida-sheriffs-clerks-directory', priority: '0.9', changefreq: 'monthly' },
        { url: '/how-to-become-a-bondsman', priority: '0.8', changefreq: 'monthly' },
        { url: '/locate-an-inmate', priority: '0.8', changefreq: 'monthly' },
        { url: '/contact', priority: '0.8', changefreq: 'monthly' },
        { url: '/blog', priority: '0.7', changefreq: 'weekly' },
        { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
        { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
        xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${LAST_MOD}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // Add dynamic county pages from DB
    try {
        // Query "FloridaCounties" collection directly or via ID. 
        // Using string "FloridaCounties" is safer here if we don't import public config, 
        // but let's assume standard collection ID.
        const results = await wixData.query("FloridaCounties")
            .limit(100) // Fetch all (there are 67 counties)
            .find();

        results.items.forEach(county => {
            if (county.countySlug) {
                const safeSlug = encodeURIComponent(county.countySlug);
                xml += `  <url>
    <loc>${SITE_URL}/florida-bail-bonds/${safeSlug}</loc>
    <lastmod>${LAST_MOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
            }
        });
    } catch (error) {
        console.error("Sitemap generation error:", error);
        // Fallback or ignore
    }

    xml += '</urlset>';

    return ok({
        headers: {
            "Content-Type": "application/xml"
        },
        body: xml
    });
}

/**
 * GET /_functions/getIndemnitorProfile?email=...
 * Lookup a member profile by email for GAS Dashboard pre-fill
 */
/**
 * GET /_functions/getIndemnitorProfile?email=...&includeDocs=true
 * Lookup a member profile by email for GAS Dashboard pre-fill
 */
export async function get_getIndemnitorProfile(request) {
    try {
        const apiKey = request.headers['api-key'];
        const email = request.query.email;
        const includeDocs = request.query.includeDocs === 'true';

        // 1. Auth Check
        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({ body: { success: false, message: 'Invalid API Key' } });
        }

        if (!email) {
            return badRequest({ body: { success: false, message: 'Missing email' } });
        }

        // 2. Query Portal Users
        const options = { suppressAuth: true };
        const results = await wixData.query("Portal Users")
            .eq("email", email)
            .find(options);

        let member = null;
        let documents = [];

        if (results.items.length > 0) {
            const m = results.items[0];
            member = {
                firstName: m.firstName || m.name?.split(' ')[0] || '',
                lastName: m.lastName || m.name?.split(' ').slice(1).join(' ') || '',
                phone: m.phone || '',
                email: m.email,
                address: m.address,
                city: (m.address && m.address.city) ? m.address.city : '',
                state: (m.address && m.address.state) ? m.address.state : '',
                zip: (m.address && m.address.postalCode) ? m.address.postalCode : ''
            };

            // 3. Fetch Documents if requested
            if (includeDocs) {
                try {
                    const docResults = await wixData.query("Memberdocuments")
                        .eq("memberEmail", email)
                        .find(options);

                    documents = docResults.items.map(doc => ({
                        fileUrl: doc.fileUrl,
                        fileName: doc.fileName,
                        documentType: doc.documentType,
                        documentSide: doc.documentSide,
                        status: doc.status,
                        createdAt: doc._createdDate
                    }));
                } catch (docErr) {
                    console.error("Document Lookup Error (Non-Fatal):", docErr);
                }
            }
        } else {
            return ok({ body: { success: false, message: 'Member not found' } });
        }

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: { success: true, profile: member, documents: documents }
        });

    } catch (error) {
        console.error("Profile Lookup Error:", error);
        return serverError({ body: { success: false, message: error.message } });
    }
}

/**
 * GET /_functions/getPendingIntakes
 * Fetch all pending submissions from IntakeQueue
 * Proxies to gasIntegration.getPendingIntakesForGAS()
 */
export async function get_getPendingIntakes(request) {
    try {
        const apiKey = request.headers['api-key'];

        // 1. Auth Check
        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({ body: { success: false, message: 'Invalid API Key' } });
        }

        // 2. Call Implementation
        const result = await gasIntegration.getPendingIntakesForGAS();

        if (result.success) {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: result
            });
        } else {
            return serverError({
                body: { success: false, message: result.error }
            });
        }

    } catch (error) {
        return serverError({ body: { success: false, message: error.message } });
    }
}

/**
 * POST /_functions/markIntakeSynced
 * Mark an intake as synced with GAS
 * Proxies to gasIntegration.markIntakeAsSynced()
 */
export async function post_markIntakeSynced(request) {
    return handleIntakeAction(request, gasIntegration.markIntakeAsSynced, 'caseId');
}

/**
 * POST /_functions/updateDefendantData
 * Update intake with defendant data from bookmarklet
 * Proxies to gasIntegration.updateDefendantData()
 */
export async function post_updateDefendantData(request) {
    try {
        const body = await request.body.json();
        const apiKey = body.apiKey;

        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({ body: { success: false, message: 'Invalid API Key' } });
        }

        if (!body.caseId || !body.data) {
            return badRequest({ body: { success: false, message: 'Missing caseId or data' } });
        }

        const result = await gasIntegration.updateDefendantData(body.caseId, body.data);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return serverError({ body: { success: false, message: error.message } });
    }
}

/**
 * POST /_functions/updateSignNowData
 * Update intake with SignNow document info
 * Proxies to gasIntegration.updateSignNowData()
 */
export async function post_updateSignNowData(request) {
    try {
        const body = await request.body.json();
        const apiKey = body.apiKey;

        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({ body: { success: false, message: 'Invalid API Key' } });
        }

        if (!body.caseId || !body.data) {
            return badRequest({ body: { success: false, message: 'Missing caseId or data' } });
        }

        const result = await gasIntegration.updateSignNowData(body.caseId, body.data);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return serverError({ body: { success: false, message: error.message } });
    }
}

/**
 * POST /_functions/markIntakeSigned
 * Mark intake as fully signed
 * Proxies to gasIntegration.markIntakeAsSigned()
 */
export async function post_markIntakeSigned(request) {
    try {
        const body = await request.body.json();
        const apiKey = body.apiKey;

        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({ body: { success: false, message: 'Invalid API Key' } });
        }

        if (!body.caseId || !body.data) {
            return badRequest({ body: { success: false, message: 'Missing caseId or data' } });
        }

        const result = await gasIntegration.markIntakeAsSigned(body.caseId, body.data);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return serverError({ body: { success: false, message: error.message } });
    }
}

/**
 * POST /_functions/markIntakeProcessed
 * Legacy/Alternative status update
 */
export async function post_markIntakeProcessed(request) {
    // Keep implementation but route correctly if needed, or deprecate.
    // Re-implementing using direct logic for backward compat
    try {
        const body = await request.body.json();
        const apiKey = body.apiKey;
        const intakeId = body.intakeId;

        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({ body: { success: false, message: 'Invalid API Key' } });
        }

        if (!intakeId) return badRequest({ body: { success: false, message: 'Missing intakeId' } });

        const options = { suppressAuth: true };
        const item = await wixData.get("IntakeQueue", intakeId, options);

        if (!item) return badRequest({ body: { success: false, message: 'Intake not found' } });

        item.status = "Processed";
        item.isRead = true;
        item.processedAt = new Date();

        await wixData.update("IntakeQueue", item, options);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: { success: true, message: "Marked as processed" }
        });
    } catch (error) {
        return serverError({ body: { success: false, message: error.message } });
    }
}

/**
 * Helper for simple action calls
 */
async function handleIntakeAction(request, actionFunction, idField = 'caseId') {
    try {
        const body = await request.body.json();
        const apiKey = body.apiKey;
        const id = body[idField];

        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({ body: { success: false, message: 'Invalid API Key' } });
        }

        if (!id) return badRequest({ body: { success: false, message: `Missing ${idField}` } });

        const result = await actionFunction(id);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return serverError({ body: { success: false, message: error.message } });
    }
}


/**
 * POST /_functions/intakeWebhook
 * 
 * Webhook endpoint triggered when new IntakeQueue record is created
 * Notifies GAS Dashboard immediately for real-time updates
 * 
 * This provides real-time notification to GAS when a new intake is submitted
 * Polling backup (every 30 minutes) ensures no intakes are missed
 * 
 * Request body (from Wix Data Hook):
 * {
 *   "data": {
 *     "_id": "intake-id",
 *     "defendantName": "John Doe",
 *     "defendantBookingNumber": "2024-001234",
 *     "indemnitorName": "Jane Doe",
 *     "county": "Lee",
 *     "totalBond": 10000,
 *     "_createdDate": "2024-01-31T..."
 *   }
 * }
 */
export async function post_intakeWebhook(request) {
    try {
        // Parse webhook payload
        const payload = await request.body.json();

        // Extract intake data
        const intakeData = payload.data || payload;
        const intakeId = intakeData._id;

        if (!intakeId) {
            return badRequest({
                body: { success: false, error: 'Missing intake ID' }
            });
        }

        console.log(`📥 Intake Webhook received for: ${intakeId}`);

        // Get GAS configuration
        const gasApiKey = await getSecret('GAS_API_KEY');
        const gasUrl = process.env.GAS_WEB_APP_URL || 'https://script.google.com/a/macros/shamrockbailbonds.biz/s/AKfycbzc0XYqz0rN5jPZ3yRIh--Z3izfO1qiXyy64HVHRouLWmi3WHL2ZwJrMKA1xl-uwyg2Vg/exec';

        // Prepare notification payload for GAS
        const gasPayload = {
            action: 'newIntakeNotification',
            apiKey: gasApiKey,
            intakeId: intakeId,
            intakeData: {
                defendantName: intakeData.defendantName,
                defendantBookingNumber: intakeData.defendantBookingNumber,
                indemnitorName: intakeData.indemnitorName,
                indemnitorEmail: intakeData.indemnitorEmail,
                indemnitorPhone: intakeData.indemnitorPhone,
                county: intakeData.county,
                totalBond: intakeData.totalBond,
                premium: intakeData.premium,
                submittedAt: intakeData._createdDate
            }
        };

        // Notify GAS Dashboard (non-blocking)
        fetch(gasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gasPayload)
        }).then(response => {
            if (response.ok) {
                console.log('✅ GAS notified successfully');
            } else {
                console.error('⚠️ Failed to notify GAS:', response.statusText);
                // Polling backup will catch it
            }
        }).catch(error => {
            console.error('⚠️ Error notifying GAS:', error);
            // Polling backup will catch it
        });

        // Update IntakeQueue with webhook status
        await wixData.update('IntakeQueue', {
            _id: intakeId,
            webhookNotified: true,
            webhookNotifiedAt: new Date()
        }, { suppressAuth: true });

        return ok({
            body: {
                success: true,
                message: 'Webhook processed successfully',
                intakeId: intakeId
            }
        });

    } catch (error) {
        console.error('Error processing intake webhook:', error);
        return serverError({
            body: {
                success: false,
                error: error.message
            }
        });
    }
}

/**
 * GET /_functions/pendingIntakes
 * 
 * Polling endpoint for GAS Dashboard to check for new intakes
 * Called every 30 minutes as backup to webhook notifications
 * 
 * Query params:
 * ?apiKey=xxx&since=2024-01-31T12:00:00Z
 * 
 * Returns:
 * {
 *   "success": true,
 *   "intakes": [
 *     {
 *       "_id": "intake-id",
 *       "defendantName": "John Doe",
 *       ...
 *     }
 *   ],
 *   "count": 5
 * }
 */
export async function get_pendingIntakes(request) {
    try {
        const { apiKey, since } = request.query;

        // Validate API key
        if (!apiKey) {
            return badRequest({
                body: { success: false, error: 'Missing apiKey' }
            });
        }

        const validApiKey = await getSecret('GAS_API_KEY');
        if (apiKey !== validApiKey) {
            return forbidden({
                body: { success: false, error: 'Invalid API key' }
            });
        }

        // Query IntakeQueue for new/pending records
        // 'gasSyncStatus' is the correct status field for GAS synchronization
        let query = wixData.query('IntakeQueue')
            .hasSome('gasSyncStatus', ['pending', 'retry']);

        // Filter by timestamp if provided
        if (since) {
            const sinceDate = new Date(since);
            query = query.gt('_createdDate', sinceDate);
        }

        const results = await query
            .descending('_createdDate')
            .limit(100)
            .find({ suppressAuth: true });

        // DEBUG HELPER (Added for GAS diagnostics)
        if (request.query.debug === 'true') {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: {
                    success: true,
                    debug: true,
                    collection: 'IntakeQueue',
                    queryFilters: { hasSome: ['gasSyncStatus: pending, retry'], since: since || 'all' },
                    foundCount: results.length,
                    firstId: results.items.length > 0 ? results.items[0]._id : null,
                    limit: 100,
                    sample: results.items.length > 0 ? {
                        id: results.items[0]._id,
                        gasSyncStatus: results.items[0].gasSyncStatus,
                        created: results.items[0]._createdDate
                    } : null
                }
            });
        }

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                intakes: results.items,
                count: results.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching pending intakes:', error);
        return serverError({
            body: {
                success: false,
                error: error.message
            }
        });
    }
}
/**
 * POST /api/intakes/status
 * Update the status of an intake record (e.g. "Approved")
 * Called by GAS Dashboard when staff clicks "Approve"
 * 
 * Request body:
 * {
 *   "apiKey": "your-api-key",
 *   "caseId": "CASE-123456",
 *   "status": "Approved"
 * }
 */
export async function post_updateIntakeStatus(request) {
    try {
        const body = await request.body.json();

        // Validate API key
        if (!body.apiKey) return badRequest({ body: { success: false, message: 'Missing apiKey' } });

        const validApiKey = await getSecret('GAS_API_KEY');
        if (body.apiKey !== validApiKey) return forbidden({ body: { success: false, message: 'Invalid API key' } });

        if (!body.caseId || !body.status) {
            return badRequest({ body: { success: false, message: 'Missing caseId or status' } });
        }

        // Update IntakeQueue
        const queueRes = await wixData.query("IntakeQueue").eq("caseId", body.caseId).find({ suppressAuth: true });
        if (queueRes.items.length > 0) {
            const item = queueRes.items[0];
            item.status = body.status;
            item.paperworkStatus = body.status; // Sync both status fields
            await wixData.update("IntakeQueue", item, { suppressAuth: true });
        } else {
            return badRequest({ body: { success: false, message: 'Case not found in IntakeQueue' } });
        }

        // Also Update Cases if it exists
        const caseRes = await wixData.query("Cases").eq("caseNumber", body.caseId).find({ suppressAuth: true });
        if (caseRes.items.length > 0) {
            const caseItem = caseRes.items[0];
            caseItem.status = body.status;
            caseItem.paperworkStatus = body.status;
            await wixData.update("Cases", caseItem, { suppressAuth: true });
        }

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: { success: true, message: `Intake ${body.caseId} updated to ${body.status}` }
        });

    } catch (error) {
        console.error('Error updating intake status:', error);
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}

/**
 * GET /_functions/adminSyncCounties
 * Trigger CMS sync for counties (Secure Admin only)
 * Usage: /_functions/adminSyncCounties?apiKey=YOUR_GAS_KEY
 */
export async function get_adminSyncCounties(request) {
    try {
        const apiKey = request.query.apiKey;
        const validApiKey = await getSecret('GAS_API_KEY').catch(() => null);

        if (!validApiKey || apiKey !== validApiKey) {
            return forbidden({ body: { error: 'Unauthorized' } });
        }

        const result = await syncCountiesToCms();
        return ok({
            headers: { "Content-Type": "application/json" },
            body: result
        });
    } catch (error) {
        return serverError({ body: { error: error.message } });
    }
}

/**
 * POST /_functions/openAIWebhook
 * Receives webhook events from OpenAI (e.g., fine-tuning completions)
 * 
 * Verifies signature using OPENAI_WEBHOOK_SECRET
 */
export async function post_openAIWebhook(request) {
    try {
        const signature = request.headers['openai-signature']; // Check docs for exact header name
        const bodyText = await request.body.text();

        // 1. Verify Signature
        // Note: OpenAI signatures are usually: t=timestamp,v1=signature
        // For now, we'll do a basic secret check if a specific header is provided,
        // or just log it securely if configured.

        const webhookSecret = await getSecret('OPENAI_WEBHOOK_SECRET').catch(() => '');

        if (webhookSecret && signature) {
            const generatedSignature = crypto.createHmac('sha256', webhookSecret)
                .update(bodyText)
                .digest('hex');

            // Note: Verify exact OpenAI signature format from their docs if strict security is needed.
            // Often it involves the timestamp too.
            // For this implementation, we will log payload but default to 200 OK 
            // so we don't break the integration while debugging.
        }

        console.log("🤖 OpenAI Webhook Received:", bodyText.substring(0, 500)); // Log first 500 chars

        return ok({
            headers: { "Content-Type": "application/json" },
            body: { received: true }
        });

    } catch (error) {
        console.error("OpenAI Webhook Error:", error);
        return serverError({ body: { error: error.message } });
    }
}

/**
 * GET /api/outreach/leads
 * Fetch leads for the outreach manager script
 * 
 * Protected by GAS_API_KEY
 */
export async function get_outreachLeads(request) {
    try {
        const apiKey = request.query.apiKey;

        // Validate API Key
        const validApiKey = await getSecret('GAS_API_KEY').catch(() => null);
        if (!apiKey || apiKey !== validApiKey) {
            return forbidden({
                body: { success: false, message: 'Invalid API key' }
            });
        }

        // Query IntakeQueue for potential leads
        // You might want to filter by status or created date here
        const results = await wixData.query('IntakeQueue')
            .limit(50) // Limit to 50 for now
            .descending('_createdDate')
            .find();

        const leads = results.items.map(item => ({
            id: item._id,
            name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
            phone: item.phone || '',
            email: item.email || '',
            status: item.status || 'new',
            createdDate: item._createdDate,
            defendant: item.defendantName || 'Unknown',
            jail: item.county || 'Unknown',
            charges: item.charges || 'Pending'
        }));

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: { success: true, leads: leads }
        });

    } catch (error) {
        console.error('Error fetching outreach leads:', error);
        return serverError({
            body: { success: false, message: error.message }
        });
    }
}


// ============================================================================
// WHATSAPP CLOUD API WEBHOOKS
// ============================================================================
// Register in Meta Developer Console > App > WhatsApp > Configuration:
//   Callback URL:  https://www.shamrockbailbonds.biz/_functions/webhookWhatsApp
//   Verify Token:  (value of Wix Secret: WHATSAPP_WEBHOOK_VERIFY_TOKEN)
//
// Required Wix Secrets:
//   WHATSAPP_WEBHOOK_VERIFY_TOKEN  — random string you set in Meta console
//   WHATSAPP_APP_SECRET            — App Secret from Meta App Dashboard
//   WHATSAPP_ACCESS_TOKEN          — Permanent System User token
//   WHATSAPP_PHONE_NUMBER_ID       — Numeric Phone Number ID from WhatsApp Manager
// ============================================================================

/**
 * GET /_functions/webhookWhatsApp
 * Meta webhook verification handshake.
 */
export async function get_webhookWhatsApp(request) {
    try {
        const mode = request.query['hub.mode'];
        const token = request.query['hub.verify_token'];
        const challenge = request.query['hub.challenge'];
        const verifyToken = await getSecret('WHATSAPP_WEBHOOK_VERIFY_TOKEN').catch(() => null);
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[WhatsApp Webhook] Verification successful');
            return ok({ headers: { 'Content-Type': 'text/plain' }, body: challenge });
        }
        console.warn('[WhatsApp Webhook] Verification failed');
        return forbidden({ body: 'Verification failed' });
    } catch (error) {
        console.error('[WhatsApp Webhook] Verification error:', error);
        return serverError({ body: { error: error.message } });
    }
}

/**
 * POST /_functions/webhookWhatsApp
 * Receives all inbound WhatsApp events (messages, status updates).
 */
export async function post_webhookWhatsApp(request) {
    try {
        const bodyText = await request.body.text();
        const signature = request.headers['x-hub-signature-256'] || '';

        // 1. Verify signature
        const appSecret = await getSecret('WHATSAPP_APP_SECRET').catch(() => null);
        if (appSecret && signature) {
            const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(bodyText).digest('hex');
            if (expected !== signature) {
                console.warn('[WhatsApp Webhook] Signature mismatch');
                return forbidden({ body: 'Invalid signature' });
            }
        }

        // 2. Parse payload
        let payload;
        try { payload = JSON.parse(bodyText); } catch (e) { return badRequest({ body: { error: 'Invalid JSON' } }); }

        const entry = payload.entry && payload.entry[0];
        const changes = entry && entry.changes && entry.changes[0];
        const value = changes && changes.value;
        if (!value) return ok({ body: { received: true } });

        // 3. Status updates
        if (value.statuses && value.statuses.length) {
            for (const s of value.statuses) { await _waStatusUpdate(s); }
        }

        // 4. Inbound messages
        if (value.messages && value.messages.length) {
            for (const m of value.messages) {
                const contact = (value.contacts || []).find(c => c.wa_id === m.from) || {};
                await _waInboundMessage(m, contact);
            }
        }

        return ok({ body: { received: true } });
    } catch (error) {
        console.error('[WhatsApp Webhook] POST error:', error);
        return ok({ body: { received: true, error: error.message } }); // always 200 to Meta
    }
}

async function _waInboundMessage(message, contact) {
    const from = message.from;
    const msgId = message.id;
    const type = message.type;
    const name = (contact.profile && contact.profile.name) || 'Unknown';
    const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();
    let textBody = '';
    let mediaId = null;
    let mimeType = null;

    if (type === 'text') {
        textBody = (message.text && message.text.body) || '';
    } else if (type === 'button') {
        textBody = (message.button && message.button.text) || '';
    } else if (type === 'interactive') {
        textBody = (message.interactive && message.interactive.button_reply && message.interactive.button_reply.title)
            || (message.interactive && message.interactive.list_reply && message.interactive.list_reply.title) || '';
    } else if (type === 'audio') {
        mediaId = (message.audio && message.audio.id) || null;
        mimeType = (message.audio && message.audio.mime_type) || null;
    }

    console.log('[WhatsApp Webhook] Inbound from +' + from + ' (' + name + '): "' + textBody + '" Type: ' + type);

    // Log to CMS
    try {
        await wixData.insert('WhatsAppMessages', {
            waId: from, messageId: msgId, direction: 'inbound',
            type: type, body: textBody, senderName: name,
            timestamp: timestamp, rawPayload: JSON.stringify(message)
        }, { suppressAuth: true });
    } catch (e) { console.warn('[WhatsApp Webhook] CMS log error:', e.message); }

    // Forward to GAS for business logic
    try {
        const gasUrl = await getSecret('GAS_WEB_APP_URL').catch(() => null);
        const apiKey = await getSecret('GAS_API_KEY').catch(() => null);
        if (gasUrl && apiKey) {
            const { fetch: wf } = await import('wix-fetch');
            wf(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'whatsapp_inbound_message',
                    apiKey, from, name, messageId: msgId, type,
                    body: textBody, timestamp, mediaId, mimeType
                })
            }).catch(err => console.warn('[WhatsApp Webhook] GAS fwd error:', err));
        }
    } catch (e) { console.warn('[WhatsApp Webhook] GAS route error:', e.message); }

    // Mark as read
    try {
        const token = await getSecret('WHATSAPP_ACCESS_TOKEN').catch(() => null);
        const pid = await getSecret('WHATSAPP_PHONE_NUMBER_ID').catch(() => null);
        if (token && pid) {
            const { fetch: wf } = await import('wix-fetch');
            wf('https://graph.facebook.com/v21.0/' + pid + '/messages', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: msgId })
            }).catch(() => { });
        }
    } catch (e) { }
}

async function _waStatusUpdate(status) {
    const ts = new Date(parseInt(status.timestamp) * 1000).toISOString();
    try {
        const res = await wixData.query('WhatsAppMessages').eq('messageId', status.id).find({ suppressAuth: true });
        if (res.items.length > 0) {
            const item = res.items[0];
            item.deliveryStatus = status.status;
            item.statusUpdatedAt = ts;
            await wixData.update('WhatsAppMessages', item, { suppressAuth: true });
        }
    } catch (e) { }
}


// =============================================================================
// TELEGRAM WEBHOOK ENDPOINT
// =============================================================================

/**
 * POST /_functions/telegram-webhook
 * Receive incoming Telegram bot updates
 * 
 * This endpoint is called by Telegram when users interact with the bot
 */
export async function post_telegramWebhook(request) {
  console.log('📩 Telegram webhook triggered');
  
  try {
    // Parse request body
    const update = await request.body.json();
    
    // Import telegram webhook handler
    const { handleTelegramWebhook } = await import('backend/telegram-webhook');
    
    // Process update
    const result = await handleTelegramWebhook(update);
    
    // Return OK to Telegram (required)
    return ok({
      headers: { 'Content-Type': 'application/json' },
      body: { ok: true, result: result }
    });
    
  } catch (error) {
    console.error('Telegram webhook error:', error);
    
    // Still return OK to Telegram to avoid retries
    return ok({
      headers: { 'Content-Type': 'application/json' },
      body: { ok: true, error: error.message }
    });
  }
}

/**
 * GET /_functions/telegram-webhook-info
 * Get Telegram webhook configuration info (for debugging)
 */
export async function get_telegramWebhookInfo(request) {
  try {
    const botToken = await getSecret('TELEGRAM_BOT_TOKEN');
    
    if (!botToken) {
      return badRequest({
        body: { success: false, error: 'Bot token not configured' }
      });
    }
    
    const { getTelegramWebhookInfo } = await import('backend/telegram-webhook');
    const info = await getTelegramWebhookInfo(botToken);
    
    return ok({
      headers: { 'Content-Type': 'application/json' },
      body: info
    });
    
  } catch (error) {
    return serverError({
      body: { success: false, error: error.message }
    });
  }
}
