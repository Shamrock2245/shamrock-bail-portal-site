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

// ... existing imports
import { verifyGoogleUser, verifyFacebookUser } from 'backend/social-auth';
import { sendMagicLinkSimplified } from 'backend/portal-auth'; // Reuse lookup logic
import { createCustomSession } from 'backend/portal-auth'; // Reuse session logic

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

        // 3. Reuse "Magic Link" Logic to Find User & Role
        // We use the internal logic of sendMagicLinkSimplified but stop short of sending email
        // We just need the "User Lookup" part. 
        // OPTIMIZATION: We can just use the lookup logic directly here or refactor.
        // For now, let's replicate the lookup logic for safety/speed without touching shared code heavily.

        // (A) Lookup User
        const { lookupUserByContact } = require('backend/portal-auth');
        const lookup = await lookupUserByContact(userProfile.email);

        let sessionToken = null;
        let role = null;

        if (lookup.found) {
            // Existing User
            role = lookup.role;
            sessionToken = await createCustomSession(lookup.personId, lookup.role, lookup.caseId);
        } else {
            // New User (Default to Defendant)
            // CREATE NEW USER RECORD HERE IF NEEDED? 
            // For now, follow "Magic Link" logic: treating new emails as "New Defendant"
            role = 'defendant';
            const newPersonId = `social_${userProfile.provider}_${userProfile.providerId}`;
            sessionToken = await createCustomSession(newPersonId, 'defendant');
        }

        // 4. Return Success HTML
        return response(200, renderCloseScript({
            success: true,
            token: sessionToken,
            role: role,
            message: "Login successful!"
        }));

    } catch (err) {
        console.error("Auth Callback Error:", err);
        return response(200, renderCloseScript({ success: false, message: "System error during login." }));
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
function renderCloseScript(data) {
    const safeData = JSON.stringify(data);
    const landingUrl = "https://www.shamrockbailbonds.biz/portal-landing";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; text-align: center; padding-top: 50px; }
          .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h3>Finishing secure login...</h3>
        <script>
          const data = ${safeData};
          
          if (window.opener) {
            // Popup Mode
            window.opener.postMessage(data, "*");
            window.close();
          } else {
            // Redirect Mode
            if (data.success && data.token) {
              // Redirect back with session token
              window.location.href = "${landingUrl}?sessionToken=" + encodeURIComponent(data.token) + "&role=" + encodeURIComponent(data.role || "");
            } else {
              // Error case
              document.body.innerHTML = "<h3>Login Failed: " + (data.message || "Unknown error") + "</h3><p><a href='${landingUrl}'>Return to Portal</a></p>";
            }
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
    <loc>${SITE_URL}/bail-bonds/${safeSlug}</loc>
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
