// HTTP Functions for external API access
// Filename: backend/http-functions.js
// These endpoints can be called from Dashboard.html/GAS

import { ok, badRequest, serverError, forbidden, response } from 'wix-http-functions';
import { buildPortalUrl } from 'backend/portal-url';
import { createHmac } from 'crypto';
import {
    authenticateGasRequest,
    escapeXml,
    sanitizeRedirectUrl,
    candidateTwilioUrls,
    verifyTwilioSignature,
    isSecretAllowlisted,
    GAS_SECRETS_ALLOWLIST,
    safeEqual
} from 'backend/http-auth';
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

import { llmSitemapContent } from 'backend/llmSitemapData';
import { buildLlmsTxt, fetchLiveBlogPosts } from 'backend/llms-txt-builder';
import { getCityLandingSlugs } from 'backend/local-landings';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function requireAuth(request, extraProvided) {
    const auth = await authenticateGasRequest(request, extraProvided);
    if (auth.ok) return null;
    if (auth.status === 500) {
        console.error('CRITICAL: GAS_API_KEY secret is missing. Blocking request.');
        return serverError({ body: { success: false, message: 'Server misconfiguration' } });
    }
    return forbidden({ body: { success: false, message: 'Unauthorized' } });
}

function publicError(error) {
    console.error(error);
    return serverError({ body: { success: false, message: 'Internal server error' } });
}

/**
 * GET /_functions/triggerCountySync
 * Manually trigger the county data sync (Admin only)
 */
export async function get_triggerCountySync(request) {
    const denied = await requireAuth(request);
    if (denied) return denied;
    try {
        const result = await syncCountiesToCms();
        return ok({
            headers: JSON_HEADERS,
            body: result
        });
    } catch (error) {
        return publicError(error);
    }
}

/**
 * GET /_functions/llmSitemap
 * Serves the LLM Markdown Sitemap for AI crawlers
 */
export function get_llmSitemap(request) {
    return ok({
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        body: llmSitemapContent
    });
}

/**
 * GET /_functions/llmsTxt
 * Authority-optimized llms.txt with **live blog list from blog-feed.xml**.
 * Future posts appear automatically when Wix publishes to the blog RSS.
 * Paste a short pointer into Wix's native /llms.txt if the Editor overwrites body text:
 *   See https://www.shamrockbailbonds.biz/_functions/llmsTxt
 */
export async function get_llmsTxt(request) {
    const generatedAt = new Date().toISOString();
    try {
        // Soft-fail RSS so authority graph always returns (timeout inside builder)
        const posts = await fetchLiveBlogPosts();
        const body = buildLlmsTxt({ posts, generatedAt });
        return ok({
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=300',
                'X-Shamrock-Llms': 'v1'
            },
            body
        });
    } catch (error) {
        console.error('get_llmsTxt error:', error);
        // Still return static authority graph if builder throws
        const body = buildLlmsTxt({ posts: [], generatedAt });
        return ok({
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=60',
                'X-Shamrock-Llms': 'v1-fallback'
            },
            body
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
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

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
        return publicError(error);
    }
}

/**
 * GET /_functions/testAuth
 * Retired diagnostic — always fail closed.
 */
export async function get_testAuth(request) {
    return forbidden({ body: { success: false, message: 'Unauthorized' } });
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
 *     "signingLink": "https://sign.shamrockbailbonds.biz/...",
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
        return publicError(error);
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
        return publicError(error);
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
        return htmlOk(renderCloseScript({ success: false, message: "Login denied or failed." }));
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

        return htmlOk(renderCloseScript({
            success: true,
            message: "Login successful!"
        }, targetUrl));

    } catch (err) {
        console.error("Auth Callback Error:", err);
        const fallbackUrl = await buildPortalUrl('/portal-landing');
        return htmlOk(renderCloseScript({ success: false, message: "System error during login." }, fallbackUrl));
    }
}

/**
 * POST /_functions/metaDataDeletion
 * Meta (Facebook) Data Deletion Callback URL
 * 
 * Flow:
 * 1. User removes app from their Facebook settings.
 * 2. Meta sends POST request with signed_request.
 * 3. We parse and verify the request using FACEBOOK_APP_SECRET.
 * 4. We return the confirmation code and status URL.
 */
export async function post_metaDataDeletion(request) {
    try {
        // Facebook sends signed_request as application/x-www-form-urlencoded
        const bodyText = await request.body.text();

        let signedRequest = null;
        try {
            // First try to parse as JSON in case it's sent that way
            const jsonBody = JSON.parse(bodyText);
            signedRequest = jsonBody.signed_request;
        } catch (e) {
            // Fallback to URLSearchParams if it's form-urlencoded
            const params = new URLSearchParams(bodyText);
            signedRequest = params.get('signed_request');
        }

        if (!signedRequest) {
            return badRequest({ body: { error: "Missing signed_request" } });
        }

        const secret = await getSecret('FACEBOOK_APP_SECRET').catch(() => null);
        if (!secret) {
            console.error("Missing FACEBOOK_APP_SECRET secret in Wix Secrets Manager.");
            return serverError({ body: { error: "Server configuration error" } });
        }

        // Parse signed_request (format: encoded_sig.payload)
        const parts = signedRequest.split('.');
        if (parts.length !== 2) {
            return badRequest({ body: { error: "Invalid signed_request format" } });
        }

        const [encodedSig, payload] = parts;

        // Base64Url decode using Buffer
        const sigHex = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('hex');
        const dataStr = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        const data = JSON.parse(dataStr);

        // Verify HMAC SHA-256 signature
        const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');

        if (!safeEqual(sigHex, expectedSig)) {
            logSafe('Invalid Meta Data Deletion Signature', { received: 'mismatch' }, 'warn');
            return forbidden({ body: { error: "Invalid signature" } });
        }

        // The data object contains `user_id` (Facebook app-scoped ID).
        const userId = data.user_id;
        console.log(`[Meta] Data deletion requested for Facebook user: ${userId}`);

        // Return exactly what Facebook expects
        const confirmationCode = `DELETION-${userId}-${Date.now()}`;

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: {
                url: "https://www.shamrockbailbonds.biz/data-deletion",
                confirmation_code: confirmationCode
            }
        });

    } catch (err) {
        console.error("Meta Data Deletion Callback Error:", err);
        return serverError({ body: { error: "Internal server error processing deletion" } });
    }
}

/**
 * Helper to return HTML response
 */
function htmlOk(body) {
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
    const finalUrl = sanitizeRedirectUrl(targetUrl, "https://www.shamrockbailbonds.biz/portal-landing");

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
          
          console.log(' Redirecting to:', targetUrl);
          
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
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

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
        return publicError(error);
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
 *   "signingLink": "https://sign.shamrockbailbonds.biz/...",
 *   "recipientType": "defendant" | "indemnitor",
 *   "defendantName": "John Doe" (optional)
 * }
 */
export async function post_smsSigningLink(request) {
    try {
        const body = await request.body.json();
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

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
        return publicError(error);
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

        const authToken = await getSecret('TWILIO_AUTH_TOKEN').catch(() => '');
        const paramObj = {};
        for (const [key, value] of params.entries()) {
            paramObj[key] = value;
        }
        if (!authToken || !signature || !verifyTwilioSignature(authToken, signature, paramObj, candidateTwilioUrls(request, 'twilioStatus'))) {
            logSafe('Twilio status signature rejected', { hasSignature: !!signature }, 'warn');
            return forbidden({ body: { error: 'Invalid signature' } });
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

        logSafe(' Twilio Status Callback:', statusData);

        if (statusData.messageStatus === 'delivered') {
            console.log(`[OK] SMS Delivered: ${statusData.messageSid} to ${statusData.to}`);
        } else if (statusData.messageStatus === 'undelivered' || statusData.messageStatus === 'failed') {
            logSafe(`[X] SMS Failed: ${statusData.messageSid} to ${statusData.to}`, {
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

        const authToken = await getSecret('TWILIO_AUTH_TOKEN').catch(() => '');
        const paramObj = {};
        for (const [key, value] of params.entries()) {
            paramObj[key] = value;
        }
        if (!authToken || !signature || !verifyTwilioSignature(authToken, signature, paramObj, candidateTwilioUrls(request, 'twilioInbound'))) {
            logSafe('Twilio inbound signature rejected', { hasSignature: !!signature }, 'warn');
            return forbidden({
                headers: { 'Content-Type': 'text/xml' },
                body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
            });
        }

        const fromNumber = escapeXml(params.get('From'));
        const messageBody = escapeXml(params.get('Body'));

        // Office Phones to forward to
        const FORWARD_TO = ['+12399550178', '+12399550301'];

        // Construct TwiML
        let twiml = '<?xml version="1.0" encoding="UTF-8"?>';
        twiml += '<Response>';

        FORWARD_TO.forEach(phone => {
            twiml += `<Message to="${escapeXml(phone)}">`;
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
 * Retired diagnostic — always fail closed.
 */
export async function get_testTwilio(request) {
    return forbidden({ body: { success: false, message: 'Unauthorized' } });
}

/**
 * GET /_functions/debugCounties
 * Retired diagnostic — always fail closed.
 */
export async function get_debugCounties(request) {
    return forbidden({ body: { success: false, message: 'Unauthorized' } });
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
 * Comprehensive public XML sitemap for Google Search Console.
 *
 * NOTE: Live robots.txt currently Disallows /_functions/ for User-agent: *.
 * Prefer submitting the Wix-native https://www.shamrockbailbonds.biz/sitemap.xml
 * AND this URL only after robots allows /_functions/sitemap (or use Allow for that path).
 *
 * Public pages only — never include portal/*, lightboxes, or utility pages.
 */
export async function get_sitemap(request) {
    const SITE_URL = 'https://www.shamrockbailbonds.biz';
    const LAST_MOD = new Date().toISOString().split('T')[0];

    // Keep in sync with public site structure (Wix pages that should be indexed)
    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/how-bail-works', priority: '0.9', changefreq: 'monthly' },
        { url: '/first-appearance', priority: '0.9', changefreq: 'weekly' },
        { url: '/first-appearance-hub', priority: '0.6', changefreq: 'weekly' },
        { url: '/bail-school', priority: '0.9', changefreq: 'weekly' },
        { url: '/how-to-become-a-bondsman', priority: '0.8', changefreq: 'monthly' },
        { url: '/contact', priority: '0.8', changefreq: 'monthly' },
        { url: '/about', priority: '0.7', changefreq: 'monthly' },
        { url: '/blog', priority: '0.8', changefreq: 'daily' },
        { url: '/testimonials', priority: '0.6', changefreq: 'monthly' },
        { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
        { url: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' }
    ];

    // Fallback if CMS query fails (67 counties)
    const FALLBACK_COUNTY_SLUGS = [
        'alachua', 'baker', 'bay', 'bradford', 'brevard', 'broward', 'calhoun', 'charlotte',
        'citrus', 'clay', 'collier', 'columbia', 'desoto', 'dixie', 'duval', 'escambia',
        'flagler', 'franklin', 'gadsden', 'gilchrist', 'glades', 'gulf', 'hamilton', 'hardee',
        'hendry', 'hernando', 'highlands', 'hillsborough', 'holmes', 'indian-river', 'jackson',
        'jefferson', 'lafayette', 'lake', 'lee', 'leon', 'levy', 'liberty', 'madison',
        'manatee', 'marion', 'martin', 'miami-dade', 'monroe', 'nassau', 'okaloosa',
        'okeechobee', 'orange', 'osceola', 'palm-beach', 'pasco', 'pinellas', 'polk',
        'putnam', 'santa-rosa', 'sarasota', 'seminole', 'st-johns', 'st-lucie', 'sumter',
        'suwannee', 'taylor', 'union', 'volusia', 'wakulla', 'walton', 'washington'
    ];

    /**
     * Resolve CMS variations such as "PalmBeach", "Santa Rosa County", and
     * "St. Johns" to the single canonical county path already used by the
     * public county pages. Unknown values are excluded rather than emitted as
     * crawlable variants.
     */
    function canonicalCountySlug(county) {
        const candidates = [
            county && county.countyName,
            county && county.name,
            county && county.county_name,
            county && county.display_name,
            county && county.countySlug,
            county && county.slug
        ];

        for (const raw of candidates) {
            if (!raw) continue;
            const slug = String(raw)
                .trim()
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .replace(/\bcounty\b/gi, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase();
            if (FALLBACK_COUNTY_SLUGS.includes(slug)) return slug;
        }
        return '';
    }

    const urls = [];
    const seen = new Set();

    function addUrl(path, priority, changefreq, lastmod) {
        const loc = path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : '/' + path}`;
        if (seen.has(loc)) return;
        seen.add(loc);
        urls.push({
            loc,
            lastmod: lastmod || LAST_MOD,
            changefreq: changefreq || 'monthly',
            priority: priority || '0.5'
        });
    }

    staticPages.forEach((p) => addUrl(p.url, p.priority, p.changefreq, LAST_MOD));

    getCityLandingSlugs().forEach((slug) => {
        addUrl(`/florida-bail-bonds/${slug}`, '0.9', 'weekly', LAST_MOD);
    });

    // County bail pages
    try {
        const results = await wixData.query('FloridaCounties').limit(100).find();
        if (results.items && results.items.length) {
            results.items.forEach((county) => {
                const slug = canonicalCountySlug(county);
                if (slug) {
                    addUrl(`/florida-bail-bonds/${encodeURIComponent(slug)}`, '0.85', 'weekly', LAST_MOD);
                    addUrl(`/first-appearance/${encodeURIComponent(slug)}`, '0.7', 'monthly', LAST_MOD);
                }
            });
        } else {
            FALLBACK_COUNTY_SLUGS.forEach((slug) => {
                addUrl(`/florida-bail-bonds/${slug}`, '0.85', 'weekly', LAST_MOD);
                addUrl(`/first-appearance/${slug}`, '0.7', 'monthly', LAST_MOD);
            });
        }
    } catch (error) {
        console.error('Sitemap county query error:', error);
        FALLBACK_COUNTY_SLUGS.forEach((slug) => {
            addUrl(`/florida-bail-bonds/${slug}`, '0.85', 'weekly', LAST_MOD);
            addUrl(`/first-appearance/${slug}`, '0.7', 'monthly', LAST_MOD);
        });
    }

    // Blog posts (public only)
    try {
        // Prefer native Wix Blog if collection exists; otherwise skip silently
        const blogResults = await wixData
            .query('Blog/Posts')
            .eq('status', 'PUBLISHED')
            .limit(200)
            .find()
            .catch(() => null);
        if (blogResults && blogResults.items) {
            blogResults.items.forEach((post) => {
                const slug = post.slug || post.postPageUrl || '';
                if (slug) {
                    const path = String(slug).startsWith('/')
                        ? slug
                        : `/single-post/${String(slug).replace(/^\/+/, '')}`;
                    addUrl(path, '0.65', 'weekly', LAST_MOD);
                }
            });
        }
    } catch (e) {
        console.warn('Sitemap blog query skipped:', e && e.message);
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    urls.forEach((u) => {
        xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
    });
    xml += '</urlset>';

    return ok({
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            // Ensure Google can index this response when robots allows the path
            'X-Robots-Tag': 'noindex'
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
        const denied = await requireAuth(request);
        if (denied) return denied;
        const email = request.query.email;
        const includeDocs = request.query.includeDocs === 'true';

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
        return publicError(error);
    }
}

/**
 * GET /_functions/getPendingIntakes
 * Fetch all pending submissions from IntakeQueue
 * Proxies to gasIntegration.getPendingIntakesForGAS()
 */
export async function get_getPendingIntakes(request) {
    try {
        const denied = await requireAuth(request);
        if (denied) return denied;

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
        return publicError(error);
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
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

        if (!body.caseId || !body.data) {
            return badRequest({ body: { success: false, message: 'Missing caseId or data' } });
        }

        const result = await gasIntegration.updateDefendantData(body.caseId, body.data);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return publicError(error);
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
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

        if (!body.caseId || !body.data) {
            return badRequest({ body: { success: false, message: 'Missing caseId or data' } });
        }

        const result = await gasIntegration.markIntakeAsSigned(body.caseId, body.data);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return publicError(error);
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
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;
        const intakeId = body.intakeId;

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
        return publicError(error);
    }
}

/**
 * Helper for simple action calls
 */
async function handleIntakeAction(request, actionFunction, idField = 'caseId') {
    try {
        const body = await request.body.json();
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;
        const id = body[idField];

        if (!id) return badRequest({ body: { success: false, message: `Missing ${idField}` } });

        const result = await actionFunction(id);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: result
        });
    } catch (error) {
        return publicError(error);
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
        const payload = await request.body.json();
        const denied = await requireAuth(request, payload && payload.apiKey);
        if (denied) return denied;

        // Extract intake data
        const intakeData = payload.data || payload;
        const intakeId = intakeData._id;

        if (!intakeId) {
            return badRequest({
                body: { success: false, error: 'Missing intake ID' }
            });
        }

        console.log(` Intake Webhook received for: ${intakeId}`);

        // Get GAS configuration
        const gasApiKey = await getSecret('GAS_API_KEY');
        const gasUrl = await getSecret('GAS_WEBHOOK_URL').catch(() => null);
        if (!gasUrl) {
            console.error('[intakeWebhook] GAS_WEBHOOK_URL not set in Wix Secrets Manager. Cannot notify GAS.');
            // Continue -- don't fail the intake just because GAS notification failed
        }

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
                console.log('[OK] GAS notified successfully');
            } else {
                console.error('[!] Failed to notify GAS:', response.statusText);
                // Polling backup will catch it
            }
        }).catch(error => {
            console.error('[!] Error notifying GAS:', error);
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
        return publicError(error);
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
        const denied = await requireAuth(request);
        if (denied) return denied;
        const { since } = request.query;

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
        return publicError(error);
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

        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

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
        return publicError(error);
    }
}

/**
 * GET /_functions/adminSyncCounties
 * Trigger CMS sync for counties (Secure Admin only)
 * Usage: /_functions/adminSyncCounties?apiKey=YOUR_GAS_KEY
 */
export async function get_adminSyncCounties(request) {
    try {
        const denied = await requireAuth(request);
        if (denied) return denied;

        const result = await syncCountiesToCms();
        return ok({
            headers: JSON_HEADERS,
            body: result
        });
    } catch (error) {
        return publicError(error);
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
        if (!webhookSecret) {
            return forbidden({ body: { error: 'Unauthorized' } });
        }
        if (!signature) {
            return forbidden({ body: { error: 'Unauthorized' } });
        }
        const generatedSignature = createHmac('sha256', webhookSecret)
            .update(bodyText)
            .digest('hex');
        if (!safeEqual(String(signature), generatedSignature)) {
            return forbidden({ body: { error: 'Unauthorized' } });
        }

        logSafe('OpenAI webhook received', { bytes: bodyText.length });

        return ok({
            headers: JSON_HEADERS,
            body: { received: true }
        });

    } catch (error) {
        return publicError(error);
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
        const denied = await requireAuth(request);
        if (denied) return denied;

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
        return publicError(error);
    }
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
    try {
        const expectedSecret = await getSecret('TELEGRAM_WEBHOOK_SECRET').catch(() => null);
        const providedSecret =
            (request.headers && (request.headers['x-telegram-bot-api-secret-token'] || request.headers['X-Telegram-Bot-Api-Secret-Token'])) || '';
        if (expectedSecret) {
            if (!providedSecret || !safeEqual(String(providedSecret), String(expectedSecret))) {
                return forbidden({ body: { ok: false, error: 'Unauthorized' } });
            }
        } else {
            console.warn('TELEGRAM_WEBHOOK_SECRET is not set; telegram webhook is running without secret-token verification');
        }

        const update = await request.body.json();
        const { handleTelegramWebhook } = await import('backend/telegram-webhook');
        const result = await handleTelegramWebhook(update);

        return ok({
            headers: JSON_HEADERS,
            body: { ok: true, result: result }
        });

    } catch (error) {
        console.error('Telegram webhook error:', error);
        return ok({
            headers: JSON_HEADERS,
            body: { ok: true }
        });
    }
}

/**
 * GET /_functions/telegram-webhook-info
 * Get Telegram webhook configuration info (for debugging)
 */
export async function get_telegramWebhookInfo(request) {
    const denied = await requireAuth(request);
    if (denied) return denied;
    try {
        const botToken = await getSecret('TELEGRAM_BOT_TOKEN');
        if (!botToken) {
            return serverError({ body: { success: false, error: 'Bot token not configured' } });
        }

        const { getTelegramWebhookInfo } = await import('backend/telegram-webhook');
        const info = await getTelegramWebhookInfo(botToken);

        return ok({
            headers: JSON_HEADERS,
            body: info
        });
    } catch (error) {
        return publicError(error);
    }
}

/**
 * GET /_functions/setupTelegramWebhook
 * Setup Telegram webhook securely
 * Requires ?auth=GAS_API_KEY
 */
export async function get_setupTelegramWebhook(request) {
    const denied = await requireAuth(request);
    if (denied) return denied;
    try {
        const botToken = await getSecret('TELEGRAM_BOT_TOKEN');
        if (!botToken) {
            return serverError({ body: { error: 'TELEGRAM_BOT_TOKEN not found in secrets' } });
        }

        const webhookSecret = await getSecret('TELEGRAM_WEBHOOK_SECRET').catch(() => null);
        const { setTelegramWebhook } = await import('backend/telegram-webhook');
        const webhookUrl = 'https://www.shamrockbailbonds.biz/_functions/telegramWebhook';
        const result = await setTelegramWebhook(botToken, webhookUrl, webhookSecret);

        return ok({
            headers: JSON_HEADERS,
            body: result
        });
    } catch (error) {
        return publicError(error);
    }
}

// =============================================================================
// TELEGRAM INTAKE SUBMIT ENDPOINT
// =============================================================================

/**
 * POST /_functions/post_intakeSubmit
 * Receive completed Telegram intake data from GAS and write to IntakeQueue CMS.
 *
 * Called by Telegram_IntakeFlow.js -> pushIntakeToWix() after the indemnitor
 * completes the conversational intake and uploads their ID photo.
 *
 * Request body:
 * {
 *   "apiKey": "GAS_API_KEY",
 *   "source": "telegram",
 *   "telegramUserId": "123456789",
 *   "telegramChatId": "123456789",
 *   "indemnitorName": "Jane Doe",
 *   "indemnitorPhone": "(239) 555-1234",
 *   "indemnitorEmail": "jane@example.com",
 *   "indemnitorAddress": "123 Main St, Fort Myers, FL 33901",
 *   "relationship": "Mother",
 *   "defendantName": "John Doe",
 *   "defendantDob": "03/15/1985",
 *   "county": "Lee County",
 *   "charges": "DUI",
 *   "bondAmount": "5,000",
 *   "idPhotoFileId": "AgACAgIAAxk...",
 *   "submittedAt": "2026-02-20T12:00:00.000Z"
 * }
 *
 * Response:
 * { "success": true, "intakeId": "wix-cms-record-id" }
 */
export async function post_intakeSubmit(request) {
    console.log(' Telegram intake submission received');

    try {
        const body = await request.body.json();
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

        // -- Validate required fields ------------------------------------------
        const required = ['indemnitorName', 'indemnitorPhone', 'defendantName', 'county'];
        for (const field of required) {
            if (!body[field]) {
                return badRequest({
                    body: { success: false, message: `Missing required field: ${field}` }
                });
            }
        }

        // -- Build IntakeQueue record ------------------------------------------
        // Matches the IntakeQueue CMS collection schema exactly
        const intakeRecord = {
            // Source metadata
            source: body.source || 'telegram',
            telegramUserId: body.telegramUserId || '',
            telegramChatId: body.telegramChatId || '',

            // Indemnitor (co-signer) fields
            indemnitorName: body.indemnitorName,
            indemnitorPhone: body.indemnitorPhone,
            indemnitorEmail: body.indemnitorEmail || '',
            indemnitorAddress: body.indemnitorAddress || '',
            relationship: body.relationship || '',

            // Defendant fields
            defendantName: body.defendantName,
            defendantDob: body.defendantDob || '',
            county: body.county,
            charges: body.charges || '',
            bondAmount: body.bondAmount || '',

            // ID verification
            idPhotoFileId: body.idPhotoFileId || '',
            idVerified: false,

            // Status
            status: 'pending',
            matchedCaseId: '',
            processedAt: null,
            submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
            createdAt: new Date()
        };

        // -- Insert into IntakeQueue -------------------------------------------
        const result = await wixData.insert('IntakeQueue', intakeRecord);

        console.log(`[OK] Intake record created: ${result._id} for ${body.indemnitorName}`);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                intakeId: result._id,
                message: 'Intake submitted successfully'
            }
        });

    } catch (error) {
        return publicError(error);
    }
}

/**
 * POST /_functions/post_sendSigningLink
 * Called by GAS after a packet is generated.
 * Sends the signing link + payment link to the client via Telegram.
 *
 * Request body:
 * {
 *   "apiKey": "GAS_API_KEY",
 *   "telegramChatId": "123456789",
 *   "defendantName": "John Doe",
 *   "signingLink": "https://sign.shamrockbailbonds.biz/...",
 *   "paymentLink": "https://swipesimple.com/..."
 * }
 */
export async function post_sendSigningLink(request) {
    console.log(' Send signing link via Telegram triggered');

    try {
        const body = await request.body.json();
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

        // -- Validate ----------------------------------------------------------
        if (!body.telegramChatId || !body.signingLink) {
            return badRequest({
                body: { success: false, message: 'Missing telegramChatId or signingLink' }
            });
        }

        // -- Send via Telegram Bot API -----------------------------------------
        const botToken = await getSecret('TELEGRAM_BOT_TOKEN').catch(() => null);
        if (!botToken) {
            return serverError({ body: { success: false, message: 'TELEGRAM_BOT_TOKEN not configured' } });
        }

        const signingLink = sanitizeRedirectUrl(body.signingLink, '', [
            'sign.shamrockbailbonds.biz',
            'www.shamrockbailbonds.biz',
            'shamrockbailbonds.biz'
        ]);
        if (!signingLink) {
            return badRequest({ body: { success: false, message: 'Invalid signing link host' } });
        }
        const paymentLink = sanitizeRedirectUrl(
            body.paymentLink || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd',
            'https://www.shamrockbailbonds.biz',
            ['swipesimple.com', 'www.swipesimple.com', 'www.shamrockbailbonds.biz', 'shamrockbailbonds.biz']
        );
        const defendantName = String(body.defendantName || 'your loved one').replace(/[\[\]\(\)*_`]/g, '');

        const messageText = ` *Your Bail Bond Paperwork is Ready!*

The documents for *${defendantName}* are ready to sign.

*Step 1 -- Sign the paperwork:*
 [Tap here to sign](${signingLink})

*Step 2 -- Pay the premium:*
 [Tap here to pay](${paymentLink})

Once both are complete, we post the bond immediately. 

Questions? Reply here or call *(239) 332-2245*`;

        const telegramPayload = {
            chat_id: body.telegramChatId,
            text: messageText,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: ' Sign Documents', url: signingLink }],
                    [{ text: ' Pay Premium', url: paymentLink }],
                    [{ text: ' Call Us Now', url: 'tel:+12393322245' }]
                ]
            }
        };

        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telegramPayload)
            }
        );

        const telegramResult = await telegramResponse.json();

        if (!telegramResult.ok) {
            console.error('Telegram send failed:', telegramResult);
            return serverError({
                body: { success: false, message: 'Telegram delivery failed', detail: telegramResult }
            });
        }

        console.log(`[OK] Signing link sent to chatId ${body.telegramChatId}`);

        return ok({
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                messageId: telegramResult.result.message_id,
                message: 'Signing link delivered via Telegram'
            }
        });

    } catch (error) {
        return publicError(error);
    }
}

// ==== SECRETS SYNC ENDPOINT ====

/**
 * Endpoint for GAS backend to retrieve allowlisted secrets during setup.
 * Requires GAS_API_KEY. Does not return GAS_API_KEY itself.
 */
export async function get_gasSecrets(request) {
    const responseHeaders = {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    };

    try {
        const denied = await requireAuth(request);
        if (denied) return denied;

        const secretName = (request.query && request.query.secret) || '';
        if (!secretName) {
            return response({
                status: 400,
                headers: responseHeaders,
                body: { error: 'Missing secret parameter' }
            });
        }

        if (secretName === 'GAS_API_KEY' || !isSecretAllowlisted(secretName)) {
            return response({
                status: 403,
                headers: responseHeaders,
                body: { error: 'Forbidden' }
            });
        }

        let value = null;
        try {
            value = await getSecret(secretName);
        } catch (e) {
            console.error('[gasSecrets] Failed to fetch allowlisted secret');
        }

        return response({
            status: 200,
            headers: responseHeaders,
            body: { value: value }
        });

    } catch (error) {
        console.error("[gasSecrets] Fatal error fetching secret");
        return response({
            status: 500,
            headers: responseHeaders,
            body: { error: "Internal Server Error" }
        });
    }
}

// =============================================================================
// GAS SECRETS BUNDLE ENDPOINT (BULK)
// =============================================================================

/**
 * GET /_functions/gasSecretsBundle
 * Bulk secrets bridge -- returns ALL GAS-required secrets in one authenticated call.
 *
 * This complements the per-secret get_gasSecrets endpoint. It is used by
 * Setup_Properties_Telegram.gs to fetch all secrets in a single HTTP call,
 * which is faster and more reliable than N individual calls.
 *
 * Authentication: Requires ?apiKey=GAS_API_KEY in query string.
 *
 * Called by: Setup_Properties_Telegram.gs -> setupAllProperties() (Phase 2 bulk fetch)
 */
export async function get_gasSecretsBundle(request) {
    const responseHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
    };

    try {
        const denied = await requireAuth(request);
        if (denied) return denied;

        const secretNames = GAS_SECRETS_ALLOWLIST;

        const secretResults = await Promise.allSettled(
            secretNames.map(name =>
                getSecret(name)
                    .then(val => ({ name, value: val || null }))
                    .catch(() => ({ name, value: null }))
            )
        );

        const secrets = {};
        let loaded = 0;
        secretResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value.value) {
                secrets[result.value.name] = result.value.value;
                loaded++;
            }
        });

        console.log(`[gasSecretsBundle] Returned ${loaded}/${secretNames.length} secrets`);

        return response({
            status: 200,
            headers: responseHeaders,
            body: {
                success: true,
                secrets: secrets,
                count: loaded,
                total: secretNames.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[gasSecretsBundle] Fatal error');
        return response({
            status: 500,
            headers: responseHeaders,
            body: { success: false, error: 'Internal Server Error' }
        });
    }
}

/**
 * POST /_functions/telegramIntake
 * Secure endpoint to inject completed Telegram Bot intakes directly into Wix IntakeQueue CMS
 */
export async function post_telegramIntake(request) {
    try {
        const body = await request.body.json();
        const denied = await requireAuth(request, body && body.apiKey);
        if (denied) return denied;

        // Validate required fields
        if (!body.intakeData || !body.intakeData.indemnitorName) {
            return badRequest({ body: { success: false, message: 'Missing required intake data (indemnitorName is required)' } });
        }

        const { submitIntakeForm } = await import('backend/intakeQueue.jsw');

        const intakeData = body.intakeData;
        intakeData.source = 'telegram_bot';

        const result = await submitIntakeForm(intakeData);

        if (result.success) {
            return ok({
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, caseId: result.caseId, message: 'Telegram intake saved to Wix CMS' }
            });
        } else {
            return serverError({
                body: { success: false, message: result.error || 'Failed to submit intake' }
            });
        }

    } catch (error) {
        return publicError(error);
    }
}

/**
 * GET /_functions/testGasConnection
 * Retired diagnostic — always fail closed.
 */
export async function get_testGasConnection(request) {
    return forbidden({ body: { success: false, message: 'Unauthorized' } });
}
