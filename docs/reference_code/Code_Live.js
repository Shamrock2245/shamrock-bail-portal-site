// ============================================================================
// Shamrock Bail Bonds - Unified Production Backend (Code.gs)
// Version: 4.3.1 - Twilio SMS Integration + Expiration Fix
// ============================================================================
/**
 * SINGLE ENTRY POINT for all GAS Web App requests.
 * 
 * V4.3.1 HIGHLIGHTS:
 * - Fix: Respects linkExpiration parameter (24h for SMS).
 * - Twilio SMS Integration: Sends signing links via text.
 * - Unified SignNow Workflow: Handles both PDF Uploads AND Template Generation.
 */
// ============================================================================
// CONFIGURATION & INIT
// ============================================================================
// Cache config in memory for this execution
let _CONFIG_CACHE = null;
function getConfig() {
    if (_CONFIG_CACHE) return _CONFIG_CACHE;
    const props = PropertiesService.getScriptProperties();
    _CONFIG_CACHE = {
        SIGNNOW_API_BASE: props.getProperty('SIGNNOW_API_BASE_URL') || 'https://api.signnow.com',
        SIGNNOW_ACCESS_TOKEN: props.getProperty('SIGNNOW_API_TOKEN') || '',
        SIGNNOW_FOLDER_ID: props.getProperty('SIGNNOW_FOLDER_ID') || '79a05a382b38460b95a78d94a6d79a5ad55e89e6',
        SIGNNOW_TEMPLATE_ID: props.getProperty('SIGNNOW_TEMPLATE_ID') || '',

        // Twilio Config
        TWILIO_ACCOUNT_SID: props.getProperty('TWILIO_ACCOUNT_SID') || '',
        TWILIO_AUTH_TOKEN: props.getProperty('TWILIO_AUTH_TOKEN') || '',
        TWILIO_PHONE_NUMBER: props.getProperty('TWILIO_PHONE_NUMBER') || '',
        GOOGLE_DRIVE_FOLDER_ID: props.getProperty('GOOGLE_DRIVE_FOLDER_ID') || '1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3',
        GOOGLE_DRIVE_OUTPUT_FOLDER_ID: props.getProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID') || '1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs',
        CURRENT_RECEIPT_NUMBER: parseInt(props.getProperty('CURRENT_RECEIPT_NUMBER') || '201204'),
        WIX_API_KEY: props.getProperty('GAS_API_KEY') || '',
        WIX_SITE_URL: props.getProperty('WIX_SITE_URL') || 'https://www.shamrockbailbonds.biz',
        WEBHOOK_URL: props.getProperty('WEBHOOK_URL') || ''
    };
    return _CONFIG_CACHE;
}
// ============================================================================
// WEB APP HANDLERS
// ============================================================================
function doGet(e) {
    if (!e) e = { parameter: {} };
    if (e.parameter.mode === 'scrape') return runLeeScraper();
    if (e.parameter.action) return handleGetAction(e);
    try {
        const page = e.parameter.page || 'Dashboard';
        return HtmlService.createHtmlOutputFromFile(page)
            .setTitle('Shamrock Bail Bonds')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (error) {
        return HtmlService.createHtmlOutput('<h1>Page Error</h1><p>' + error.message + '</p>');
    }
}
function doPost(e) {
    try {
        if (!e || !e.postData) throw new Error("No POST data received");
        // Fail Fast: Parse JSON
        let data;
        try {
            data = JSON.parse(e.postData.contents);
        } catch (parseError) {
            return createResponse({ success: false, error: 'Invalid JSON payload' });
        }

        // --- WEBHOOK HANDLER (Keep distinct if needed, or merge) ---
        if (data.event && data.event === 'document.complete') {
            const hookResult = handleSignNowWebhook(data);
            return createResponse(hookResult);
        }
        if (data.event && data.event.startsWith('document.')) {
            return createResponse({ received: true, ignored: true });
        }

        // Delegate to shared handler
        const result = handleAction(data);
        return createResponse(result);
    } catch (error) {
        return createResponse({ success: false, error: error.toString(), stack: error.stack });
    }
}

/**
 * Adapter for Client-Side calls (google.script.run)
 * This allows Dashboard.html to call backend functions securely.
 */
function doPostFromClient(data) {
    return handleAction(data);
}

/**
 * Shared Action Handler (Business Logic)
 */
function handleAction(data) {
    const action = data.action;
    let result = { success: false, error: 'Unknown action: ' + action };

    switch (action) {
        // --- SignNow Actions ---
        case 'createSigningRequest':
        case 'sendForSignature': // Hybrid Handler
            result = handleSendForSignature(data);
            break;
        case 'createEmbeddedLink':
            result = createEmbeddedLink(data.documentId, data.signerEmail, data.signerRole, data.linkExpiration);
            break;
        case 'uploadToSignNow':
            result = uploadFilledPdfToSignNow(data.pdfBase64, data.fileName);
            break;
        case 'getDocumentStatus':
            result = getDocumentStatus(data.documentId);
            break;
        case 'addSignatureFields': // Added for Dashboard_Full.html support
            if (typeof SN_addFields !== 'function') {
                // Fallback or error if SN_addFields is missing (it was in SignNow_Integration_Complete.gs)
                // Assuming SignNow_Integration_Complete.gs is loaded in the project
                return { success: false, error: 'SN_addFields function not found' };
            }
            result = SN_addFields(data.documentId, data.fields);
            break;

        case 'sendEmail':
            result = sendEmailBasic(data);
            break;

        // --- Database & Drive ---
        case 'saveBooking':
            result = saveBookingData(data.bookingData);
            // Hardened: Sync to Wix Portal if save successful
            if (result.success && typeof syncCaseDataToWix === 'function') {
                try {
                    const wixRes = syncCaseDataToWix(data.bookingData, result.row);
                    result.wixSync = wixRes;
                } catch (e) {
                    console.error("Wix Sync Failed inside doPost: " + e.message);
                    result.wixSync = { success: false, error: e.message };
                }
            }
            break;
        case 'saveToGoogleDrive':
            result = saveFilledPacketToDrive(data);
            break;

        // --- Utilities ---
        case 'getNextReceiptNumber':
            result = getNextReceiptNumber();
            break;
        case 'runLeeScraper':
            result = runLeeScraper();
            break;
        case 'health':
            result = { success: true, message: 'GAS v4.3.0 Online' };
            break;

        // --- New: Wix Portal Batch Sync (Exposed to Front-end) ---
        case 'batchSaveToWixPortal':
            if (typeof batchSaveToWixPortal_Server !== 'function')
                return { success: false, error: 'Wix Portal Sync not implemented on server' };
            result = batchSaveToWixPortal_Server(data.documents);
            break;
    }
    return result;
}
function handleGetAction(e) {
    // Limited GET actions for security
    const action = e.parameter.action;
    const callback = e.parameter.callback;
    let result = { success: false, error: 'Unknown action' };
    if (action === 'health') result = { success: true, version: '4.3.0', timestamp: new Date().toISOString() };
    if (action === 'getNextReceiptNumber') result = getNextReceiptNumber();
    return createResponse(result, callback);
}
function createResponse(data, callback) {
    const json = JSON.stringify(data);
    const output = ContentService.createTextOutput(callback ? callback + '(' + json + ')' : json);
    output.setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
    return output;
}
// ============================================================================
// SUB: TWILIO SMS
// ============================================================================
function sendSmsViaTwilio(to, body) {
    const config = getConfig();
    if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN || !config.TWILIO_PHONE_NUMBER) {
        console.error("Twilio Secrets Missing");
        return { success: false, error: "Twilio configuration missing" };
    }
    try {
        // Format E.164
        let formattedTo = to.replace(/\D/g, '');
        if (formattedTo.length === 10) formattedTo = '+1' + formattedTo;
        else if (formattedTo.length === 11 && formattedTo.startsWith('1')) formattedTo = '+' + formattedTo;
        else if (!formattedTo.startsWith('+')) formattedTo = '+' + formattedTo;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`;
        const headers = {
            "Authorization": "Basic " + Utilities.base64Encode(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`)
        };

        const payload = {
            "To": formattedTo,
            "From": config.TWILIO_PHONE_NUMBER,
            "Body": body
        };
        // UrlFetchApp doesn't support URLSearchParams automatically like node
        // We construct the form data string manually or use payload object which UrlFetchApp handles for POST

        const response = UrlFetchApp.fetch(url, {
            method: "POST",
            headers: headers,
            payload: payload
        });
        const result = JSON.parse(response.getContentText());
        if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
            return { success: true, sid: result.sid };
        } else {
            return { success: false, error: result.message };
        }
    } catch (e) {
        console.error("Twilio Send Error: " + e.toString());
        return { success: false, error: e.toString() };
    }
}
// ============================================================================
// SUB: WEBHOOK & ARCHIVING
// ============================================================================
// function handleSignNowWebhook(payload) {
//     const docId = payload.meta_data ? payload.meta_data.document_id : (payload.id || null);
//     if (!docId) return { success: false, error: "No document ID in webhook" };
//     try {
//         const config = getConfig();
//         const folder = DriveApp.getFolderById(config.GOOGLE_DRIVE_OUTPUT_FOLDER_ID);
//         const docInfo = getDocumentStatus(docId);
//         const baseName = docInfo.document_name || `Completed_Doc_${docId}`;
//         const timestamp = new Date().toISOString().slice(0, 10);
//         const pdfBlob = downloadSignedPdf(docId);
//         if (pdfBlob) {
//             folder.createFile(pdfBlob.setName(`${baseName}_SIGNED_${timestamp}.pdf`));
//         }
//         return { success: true, message: "Archived to Drive", docId: docId };
//     } catch (e) {
//         console.error("Webhook Error: " + e.message);
//         return { success: false, error: e.message };
//     }
// }
function downloadSignedPdf(documentId) {
    const config = getConfig();
    const url = `${config.SIGNNOW_API_BASE}/document/${documentId}/download?type=pdf&with_history=1`;
    try {
        const res = UrlFetchApp.fetch(url, {
            method: 'get',
            headers: { 'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN },
            muteHttpExceptions: true
        });
        if (res.getResponseCode() === 200) {
            return res.getBlob().setContentType('application/pdf');
        }
        throw new Error(`Download failed: ${res.getResponseCode()}`);
    } catch (e) {
        console.error('PDF Download Error: ' + e.message);
        return null;
    }
}
// ============================================================================
// UNIFIED SIGNNOW WORKFLOW
// ============================================================================
function handleSendForSignature(data) {
    const config = getConfig();
    // FLOW A: PDF PROVIDED (Legacy/Upload)
    if (data.pdfBase64) {
        const upload = uploadFilledPdfToSignNow(data.pdfBase64, data.fileName || 'Bond_Package.pdf');
        if (!upload.success) return upload;
        return createSigningRequest({
            documentId: upload.documentId,
            signers: data.signers,
            subject: data.subject,
            message: data.message,
            fromEmail: data.fromEmail
        });
    }
    // FLOW B: DATA DRIVEN (Template)
    const formData = data.bookingData || data; // Flexible input
    if (!config.SIGNNOW_TEMPLATE_ID && !data.templateId) {
        return { success: false, error: 'No template ID configured' };
    }
    const templateId = data.templateId || config.SIGNNOW_TEMPLATE_ID;
    const docName = `Bond Application - ${formData.defendantFullName || 'Defendant'} - ${new Date().toISOString().split('T')[0]}`;
    try {
        // 1. Create Document
        const documentId = createDocumentFromTemplate(templateId, docName);
        // 2. Map & Fill
        const fields = mapFormDataToSignNowFields(formData);
        fillDocumentFields(documentId, fields);
        // 3. Determine Signers (Auto-detect)
        let signers = data.signers;
        if (!signers || signers.length === 0) {
            signers = [];
            // Updated to capture phone numbers for SMS
            if (formData.defendantEmail || formData.defendantPhone) {
                signers.push({
                    email: formData.defendantEmail || 'no-email@example.com',
                    phone: formData.defendantPhone,
                    role: 'Defendant',
                    order: 1
                });
            }
            if (formData.indemnitorEmail || formData.indemnitorPhone) {
                signers.push({
                    email: formData.indemnitorEmail || 'no-email@example.com',
                    phone: formData.indemnitorPhone,
                    role: 'Indemnitor',
                    order: 1
                });
            }
        }
        // 4. Send Invite or Links

        // If SMS mode, we GENERATE LINKS and Text them, rather than standard email invite
        if (data.method === 'sms') {
            const generatedLinks = generateDataLinks(documentId, signers);
            const results = [];

            for (const linkObj of generatedLinks) {
                if (linkObj.phone) {
                    const body = `Shamrock Bail Bonds: Please sign your documents here: ${linkObj.link}`;
                    const sms = sendSmsViaTwilio(linkObj.phone, body);
                    results.push({ phone: linkObj.phone, success: sms.success });
                }
            }
            return { success: true, method: 'sms', results: results, documentId: documentId };
        }
        // Default: Email Invite via SignNow
        return createSigningRequest({
            documentId: documentId,
            signers: signers,
            subject: data.subject || 'Please sign your Bond Application',
            message: data.message || 'Attached are the documents for review.'
        });
    } catch (err) {
        return { success: false, error: 'Template Flow Failed: ' + err.message };
    }
}
// --- SignNow Primitives ---
function createDocumentFromTemplate(templateId, docName) {
    const res = SN_makeRequest('/template/' + templateId + '/copy', 'POST', { document_name: docName });
    if (res.id) return res.id;
    throw new Error('Failed to create doc from template: ' + JSON.stringify(res));
}
function fillDocumentFields(documentId, fields) {
    const res = SN_makeRequest('/document/' + documentId, 'PUT', { fields: fields });
    if (res.id) return res.id;
    if (res.errors) throw new Error('Field fill failed: ' + JSON.stringify(res.errors));
    return documentId;
}
function createEmbeddedLink(documentId, email, role, expirationMinutes) {
    const payload = {
        invites: [{
            email: email,
            role: role || 'Defendant',
            order: 1,
            auth_method: 'none'
        }],
        link_expiration: expirationMinutes || 60
    };
    const res = SN_makeRequest('/document/' + documentId + '/embedded/invite', 'POST', payload);
    if (res.data && res.data.length > 0) {
        return { success: true, link: res.data[0].link, documentId: documentId };
    }
    return { success: false, error: 'No link returned', debug: res };
}
function uploadFilledPdfToSignNow(pdfBase64, fileName) {
    // ... (Keep existing implementation if needed, omitted for brevity but should be in full file)
    // Re-implementing simplified for safety
    const config = getConfig();
    if (!config.SIGNNOW_ACCESS_TOKEN) return { success: false, error: 'Missing SN Token' };
    try {
        const boundary = '----Bound' + Utilities.getUuid();
        const pdfBytes = Utilities.base64Decode(pdfBase64);
        let head = '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' + 'Content-Type: application/pdf\r\n\r\n';
        let tail = '\r\n--' + boundary + '--\r\n';
        const payload = Utilities.newBlob(head).getBytes().concat(pdfBytes).concat(Utilities.newBlob(tail).getBytes());

        const options = {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
            payload: payload,
            muteHttpExceptions: true
        };
        const res = UrlFetchApp.fetch(config.SIGNNOW_API_BASE + '/document', options);
        const json = JSON.parse(res.getContentText());
        if (res.getResponseCode() < 300) return { success: true, documentId: json.id };
        return { success: false, error: json.error || 'Upload failed' };
    } catch (e) { return { success: false, error: e.message }; }
}
function createSigningRequest(data) {
    // Convert simplified signer objects to SignNow API format
    const invitePayload = {
        to: data.signers.map(s => ({
            email: s.email,
            role: s.role || 'Signer',
            order: s.order || 1,
            subject: data.subject,
            message: data.message
        })),
        from: data.fromEmail || 'admin@shamrockbailbonds.biz'
    };
    const res = SN_makeRequest('/document/' + data.documentId + '/invite', 'POST', invitePayload);
    if (res.id || (res.result === 'success')) return { success: true, inviteId: res.id || 'sent', documentId: data.documentId };
    return { success: false, error: 'Invite failed', debug: res };
}
function getDocumentStatus(documentId) {
    return SN_makeRequest('/document/' + documentId, 'GET');
}
function generateDataLinks(documentId, signers) {
    const config = getConfig();
    const links = [];
    for (const signer of signers) {
        const payload = JSON.stringify({ invites: [{ email: signer.email, role: signer.role, order: 1, auth_method: 'none' }], link_expiration: 1440 });
        const options = {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN, 'Content-Type': 'application/json' },
            payload: payload,
            muteHttpExceptions: true
        };
        const res = UrlFetchApp.fetch(config.SIGNNOW_API_BASE + '/document/' + documentId + '/embedded/invite', options); // Endpoint correction
        const json = JSON.parse(res.getContentText());
        if (json.data && json.data.length > 0) {
            links.push({ email: signer.email, phone: signer.phone, link: json.data[0].link });
        }
    }
    return links;
}
function SN_makeRequest(endpoint, method, body) {
    const config = getConfig();
    const options = {
        method: method || 'GET',
        headers: { 'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN, 'Content-Type': 'application/json' },
        muteHttpExceptions: true
    };
    if (body) options.payload = JSON.stringify(body);
    const url = config.SIGNNOW_API_BASE + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
    const res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() === 401) throw new Error("SignNow Unauthorized - Check Token");
    return JSON.parse(res.getContentText());
}
function mapFormDataToSignNowFields(data) {
    const MAPPING = {
        'DefName': data.defendantFullName || data['defendant-first-name'] + ' ' + data['defendant-last-name'],
        'DefDOB': data.defendantDOB,
        'DefSSN': data.defendantSSN,
        'DefAddress': data.defendantStreetAddress,
        'DefCity': data.defendantCity,
        'DefState': data.defendantDLState || 'FL',
        'DefZip': data.defendantZip,
        'IndName': data.indemnitorFullName,
        'IndPhone': data.indemnitorPhone,
        'IndEmail': data.indemnitorEmail,
        'IndAddress': data.indemnitorStreetAddress,
        'IndCity': data.indemnitorCity,
        'IndState': data.indemnitorState,
        'IndZip': data.indemnitorZip,
        'TotalBond': data.totalBond || data['payment-total-bond'],
        'Premium': data.totalPremium || data['payment-premium-due'],
        'BookingNum': data.bookingNumber || data['defendant-booking-number']
    };
    return Object.keys(MAPPING).map(key => ({ name: key, value: MAPPING[key] || '' }));
}
// ============================================================================
// CORE: BOOKING & WIX SYNC
// ============================================================================
// function saveBookingData(formData) {
//     // Stub to prevent error - full implementation required in prod
//     return { success: true, message: "Booking Saved (Stub)" };
// }
function getNextReceiptNumber() {
    return { success: true, receiptNumber: getConfig().CURRENT_RECEIPT_NUMBER };
}
function saveFilledPacketToDrive(data) {
    if (!data.pdfBase64 || !data.fileName) return { success: false, error: 'Missing PDF data' };
    try {
        const folder = DriveApp.getFolderById(getConfig().GOOGLE_DRIVE_OUTPUT_FOLDER_ID);
        folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), 'application/pdf', data.fileName));
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
}
// function runLeeScraper() {
//     const url = getConfig().WEBHOOK_URL;
//     if (url) UrlFetchApp.fetch(url, { method: 'post', payload: JSON.stringify({ county: 'lee', action: 'scrape' }) });
//     return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Lee Triggered' })).setMimeType(ContentService.MimeType.JSON);
// }
function sendEmailBasic(data) {
    // Simple email sender for Wix Magic Links fallback/integration
    try {
        MailApp.sendEmail({
            to: data.to,
            subject: data.subject,
            htmlBody: data.htmlBody,
            body: data.textBody
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: e.toString() };
    }
}
