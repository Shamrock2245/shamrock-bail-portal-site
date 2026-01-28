// ============================================================================
// Shamrock Bail Bonds - Unified Production Backend (Code.gs)
// Version: 5.2 - Enterprise Portal Release (Updated 2026-01-27)
// ============================================================================
/**
 * SINGLE ENTRY POINT for all GAS Web App requests.
 * 
 * V5.0.0 SUMMARY:
 * This backend orchestrates the entire Shamrock Portal workflow:
 * 1. INTAKE & BOOKING: Receives form data from Wix, generates receipts, and stores in 'Bookings' Sheet.
 * 2. SIGNNOW INTEGRATION: Handles document generation (Templates), PDF uploads, and embedded signing links.
 * 3. TWILIO SMS: Sends signing links and notifications via text message.
 * 4. MAGIC LINKS: Manages secure access links for Defendants/Indemnitors.
 * 5. COMPLIANCE: Validates SOC2 webhooks and logs all access/processing events.
 * 
 * DEPLOYMENT:
 * Deploy as Web App -> Execute as Me -> Access: Anyone
 */
// ============================================================================
// CONFIGURATION & INIT
// ============================================================================
// ARCHITECTURE NOTE:
// This Web App implementation follows patterns for concurrency (LockService) and 
// request handling (doPost/JSON) recommended in:
// https://github.com/tanaikech/taking-advantage-of-Web-Apps-with-google-apps-script
// ============================================================================

// Load Compliance Modules
var Compliance = this.Compliance;
var SecurityLogger = this.SecurityLogger;
var ComplianceControls = this.ComplianceControls;
// SOC2_WebhookHandler is global

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
const ERROR_CODES = {
  INVALID_JSON: 'INVALID_JSON',
  MISSING_ACTION: 'MISSING_ACTION',
  UNKNOWN_ACTION: 'UNKNOWN_ACTION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED'
};

function doGet(e) {
  if (!e) e = { parameter: {} };

  // 1. Check for JSON mode explicitly
  if (e.parameter.format === 'json') {
    if (e.parameter.mode === 'scrape') {
      const result = runLeeScraper();
      return createResponse(result);
    }
    if (e.parameter.action) return handleGetAction(e);
    return createErrorResponse('No action specified', ERROR_CODES.MISSING_ACTION);
  }

  // 2. Default to HTML for Browser
  try {
    const page = e.parameter.page || 'Dashboard';

    // Check if we need to pre-fill data (e.g. from "Send to Form")
    if (e.parameter.prefill === 'true') {
      const template = HtmlService.createTemplateFromFile(page);

      // Attempt to get data from Script Properties (passed from ComprehensiveMenuSystem.js)
      // We rely on getPrefillData() being available in the context (from ComprehensiveMenuSystem.gs)
      let prefillData = null;
      try {
        if (typeof getPrefillData === 'function') {
          prefillData = getPrefillData();
        }
      } catch (err) {
        console.warn('Failed to retrieve prefill data:', err);
      }

      // Inject data into the template context
      // The HTML file uses <?!= JSON.stringify(data) ?> to read this
      template.data = prefillData;

      return template.evaluate()
        .setTitle('Shamrock Bail Bonds')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } else {
      // Standard load without data injection
      return HtmlService.createHtmlOutputFromFile(page)
        .setTitle('Shamrock Bail Bonds')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
  } catch (error) {
    // Return friendly HTML error
    return HtmlService.createHtmlOutput('<h1>Page Error</h1><p>' + error.message + '</p>');
  }
}

function doPost(e) {
  // 1. Log Incoming Request (Access Control)
  try {
    const user = Session.getActiveUser() ? Session.getActiveUser().getEmail() : 'anonymous';
    if (typeof logAccessEvent === 'function') {
      logAccessEvent(user, 'doPost', 'request_received', {
        parameter: e.parameter,
        pathInfo: e.pathInfo,
        contentLength: e.postData ? e.postData.length : 0
      });
    }
  } catch (logErr) {
    console.error("Failed to log access event: " + logErr);
  }

  try {
    if (!e || !e.postData) throw new Error("No POST data received");

    // 2. Route Webhooks (SOC II Verified)
    // Checks e.pathInfo (e.g. /signnow, /twilio) OR e.parameter.source
    if (e.pathInfo || (e.parameter && e.parameter.source)) {
      if (typeof handleSOC2Webhook === 'function') {
        return handleSOC2Webhook(e);
      }
    }

    // Fail Fast: Parse JSON
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      if (typeof logSecurityEvent === 'function') logSecurityEvent('JSON_PARSE_ERROR', { error: parseError.toString() });
      return createErrorResponse('Invalid JSON payload', ERROR_CODES.INVALID_JSON);
    }

    // --- WEBHOOK HANDLER (SOC II Aware) ---
    if (data.event && data.event.startsWith('document.')) {
      if (typeof handleSOC2Webhook === 'function') {
        if (typeof logProcessingEvent === 'function') logProcessingEvent('LEGACY_WEBHOOK_RECEIVED', { event: data.event });
        return createResponse({ received: true });
      }
    }

    // Delegate to shared handler
    const result = handleAction(data);
    return createResponse(result); // Result typically has success: true/false
  } catch (error) {
    if (typeof logSecurityEvent === 'function') logSecurityEvent('DOPOST_FAILURE', { error: error.toString() });
    return createErrorResponse(error.toString(), ERROR_CODES.INTERNAL_ERROR, error.stack);
  }
}

function handleGetAction(e) {
  // Limited GET actions for security
  const action = e.parameter.action;
  const callback = e.parameter.callback;

  if (action === 'health') return createResponse({ success: true, version: '5.2', timestamp: new Date().toISOString() }, callback);
  if (action === 'getNextReceiptNumber') return createResponse(getNextReceiptNumber(), callback);

  return createErrorResponse('Unknown action', ERROR_CODES.UNKNOWN_ACTION);
}

function createResponse(data, callback) {
  const json = JSON.stringify(data);
  const output = ContentService.createTextOutput(callback ? callback + '(' + json + ')' : json);
  output.setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  return output;
}

function createErrorResponse(message, code = 'INTERNAL_ERROR', details = null) {
  return createResponse({
    success: false,
    error: {
      code: code,
      message: message,
      details: details
    }
  });
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
    const defName = formData.defendantFullName || formData['defendant-first-name'] + ' ' + formData['defendant-last-name'] || 'Defendant';
    const emailSubject = data.subject || `Action Required: Bond Application for ${defName}`;
    const emailBody = data.message || `Please review and sign the attached bond application documents for ${defName}. \n\nThank you,\nShamrock Bail Bonds`;

    return createSigningRequest({
      documentId: documentId,
      signers: signers,
      subject: emailSubject,
      message: emailBody
    });
  } catch (err) {
    return { success: false, error: 'Template Flow Failed: ' + err.message };
  }
}
/**
 * Creates a signing session for the Wix Portal
 * Generates document from template, fills fields, and creates embedded signing link
 * @param {Object} data - Contains formData, signerEmail, signerRole, etc.
 * @returns {Object} - {success, embeddedLink, documentId, error}
 */
function createPortalSigningSession(data) {
  const config = getConfig();

  // Validate required data
  if (!data.signerEmail) {
    return { success: false, error: 'Missing signer email' };
  }

  // Get template ID
  const templateId = data.templateId || config.SIGNNOW_TEMPLATE_ID;
  if (!templateId) {
    return { success: false, error: 'No template ID configured' };
  }

  try {
    // 1. Create document from template
    const defendantName = data.defendantName || data.formData?.defendantName || 'Unknown';
    const docName = `Bail Application - ${defendantName} - ${new Date().toISOString().split('T')[0]}`;
    const documentId = createDocumentFromTemplate(templateId, docName);

    Logger.log('📄 Document created from template: ' + documentId);

    // 2. Map and fill form data
    const formData = data.formData || {};
    const mappedFields = mapPortalFormDataToSignNowFields({
      // Defendant info
      defendantName: data.defendantName || formData.defendantName,
      defendantPhone: data.defendantPhone || formData.defendantPhone,

      // Indemnitor info
      indemnitorName: data.indemnitorName || formData.indemnitorName,
      indemnitorEmail: data.indemnitorEmail || data.signerEmail,
      indemnitorPhone: data.indemnitorPhone || formData.indemnitorPhone,
      indemnitorAddress: data.indemnitorAddress || formData.indemnitorAddress,

      // References
      reference1: data.reference1 || formData.reference1,
      reference2: data.reference2 || formData.reference2
    });

    if (mappedFields.length > 0) {
      fillDocumentFields(documentId, mappedFields);
      Logger.log('✅ Fields filled: ' + mappedFields.length);
    }

    // 3. Create embedded signing link
    const signerRole = data.signerRole || 'Indemnitor';
    const linkExpiration = data.linkExpiration || 60; // 1 hour default

    const embeddedResult = createEmbeddedLink(documentId, data.signerEmail, signerRole, linkExpiration);

    if (!embeddedResult.success) {
      return { success: false, error: embeddedResult.error || 'Failed to create signing link', documentId: documentId };
    }

    Logger.log('🔗 Embedded link created for ' + data.signerEmail);

    // 4. Store in Wix Portal (optional sync)
    try {
      if (typeof saveSigningLinkToWix === 'function') {
        saveSigningLinkToWix({
          memberEmail: data.signerEmail,
          defendantName: defendantName,
          signingLink: embeddedResult.link,
          signNowDocumentId: documentId,
          signerRole: signerRole
        });
      }
    } catch (syncErr) {
      Logger.log('⚠️ Wix sync failed (non-blocking): ' + syncErr.message);
    }

    return {
      success: true,
      embeddedLink: embeddedResult.link,
      link: embeddedResult.link,
      documentId: documentId
    };

  } catch (err) {
    Logger.log('❌ Portal signing session failed: ' + err.message);
    return { success: false, error: 'Portal signing session failed: ' + err.message };
  }
}

/**
 * Maps portal form data to SignNow field format
 * @param {Object} data - Form data from portal
 * @returns {Array} - Array of {name, value} objects for SignNow
 */
function mapPortalFormDataToSignNowFields(data) {
  const fields = [];

  // Helper to add field if value exists
  const addField = (name, value) => {
    if (value) fields.push({ name, value: String(value) });
  };

  // Normalization Helpers (using FormDataHandler.gs if available, else simple fallback)
  const normName = (typeof FDH_title_ === 'function') ? FDH_title_ : (s => String(s || "").trim());
  const normPhone = (typeof FDH_cleanPhone_ === 'function') ? FDH_cleanPhone_ : (s => String(s || "").trim());
  const normDate = (s) => (typeof FDH_normalizeDate_ === 'function') ? FDH_normalizeDate_(s) : new Date(s).toLocaleDateString();

  // Defendant fields
  addField('DefName', normName(data.defendantName));
  addField('DefendantName', normName(data.defendantName));
  addField('DefPhone', normPhone(data.defendantPhone));

  // Indemnitor fields
  addField('IndName', normName(data.indemnitorName));
  addField('IndemnitorName', normName(data.indemnitorName));
  addField('IndEmail', data.indemnitorEmail); // Email usually doesn't need title case
  addField('IndemnitorEmail', data.indemnitorEmail);
  addField('IndPhone', normPhone(data.indemnitorPhone));
  addField('IndemnitorPhone', normPhone(data.indemnitorPhone));
  addField('IndAddress', data.indemnitorAddress);
  addField('IndemnitorAddress', data.indemnitorAddress);

  // Employer & Supervisor (V5.1 Added)
  addField('IndEmployer', normName(data.indemnitorEmployerName));
  addField('IndEmpPhone', normPhone(data.indemnitorEmployerPhone));
  // Composite address for Employer if available
  const empAddr = (data.indemnitorEmployerCity && data.indemnitorEmployerState)
    ? `${normName(data.indemnitorEmployerCity)}, ${data.indemnitorEmployerState} ${data.indemnitorEmployerZip || ''}`
    : '';
  addField('IndEmpAddress', empAddr);

  addField('IndSupervisor', normName(data.indemnitorSupervisorName));
  addField('IndSupervisorPhone', normPhone(data.indemnitorSupervisorPhone));

  // Reference 1
  if (data.reference1) {
    addField('Ref1Name', normName(data.reference1.name));
    addField('Reference1Name', normName(data.reference1.name));
    addField('Ref1Phone', normPhone(data.reference1.phone));
    addField('Reference1Phone', normPhone(data.reference1.phone));
    addField('Ref1Address', data.reference1.address);
    addField('Reference1Address', data.reference1.address);
  }

  // Reference 2
  if (data.reference2) {
    addField('Ref2Name', normName(data.reference2.name));
    addField('Reference2Name', normName(data.reference2.name));
    addField('Ref2Phone', normPhone(data.reference2.phone));
    addField('Reference2Phone', normPhone(data.reference2.phone));
    addField('Ref2Address', data.reference2.address);
    addField('Reference2Address', data.reference2.address);
  }

  // Date fields
  const today = new Date().toLocaleDateString();
  addField('Date', today);
  addField('SignDate', today);

  return fields;
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
  const responseCode = res.getResponseCode();
  const content = res.getContentText();

  if (responseCode === 401) throw new Error("SignNow Unauthorized - Check Token");
  if (responseCode >= 400) throw new Error(`SignNow API Error (${responseCode}): ${content}`);

  try {
    return JSON.parse(content);
  } catch (e) {
    if (content.includes('<!DOCTYPE html>')) throw new Error('SignNow Gateway Error (HTML received)');
    return { success: true, raw: content }; // Fallback for non-JSON success
  }
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
    // --- Employer & Supervisor Mappings (New V5.1.0) ---
    'IndEmployer': data.indemnitorEmployerName,
    'IndEmpPhone': data.indemnitorEmployerPhone,
    'IndEmpAddress': (data.indemnitorEmployerCity && data.indemnitorEmployerState)
      ? `${data.indemnitorEmployerCity}, ${data.indemnitorEmployerState}`
      : '',
    'IndSupervisor': data.indemnitorSupervisorName,

    'TotalBond': data.totalBond || data['payment-total-bond'],
    'Premium': data.totalPremium || data['payment-premium-due'],
    'BookingNum': data.bookingNumber || data['defendant-booking-number']
  };
  return Object.keys(MAPPING).map(key => ({ name: key, value: MAPPING[key] || '' }));
}
// ============================================================================
// CORE: BOOKING & WIX SYNC
// ============================================================================
// ============================================================================
// CORE: BOOKING & WIX SYNC
// ============================================================================

/**
 * Saves booking data to the 'Bookings' sheet.
 * Uses LockService to prevent concurrent write issues.
 */
function saveBookingData(formData) {
  const lock = LockService.getScriptLock();
  try {
    // Wait for up to 5 seconds for other processes to finish
    lock.waitLock(5000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Bookings');

    // Auto-create if missing (Robustness)
    if (!sheet) {
      sheet = ss.insertSheet('Bookings');
      sheet.appendRow(['Timestamp', 'Receipt #', 'Defendant', 'Bond Amount', 'Charges', 'Status', 'Indemnitor', 'Email', 'Phone']);
      sheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    // Get receipt number safely if not provided
    const receiptNum = formData.receiptNumber || getNextReceiptNumber().receiptNumber;

    // Prepare row data (sanitize inputs)
    const row = [
      timestamp,
      receiptNum,
      formData.defendantFullName || (formData['defendant-first-name'] + ' ' + formData['defendant-last-name']),
      formData.totalBond || formData['bond-amount'],
      JSON.stringify(formData.charges), // Store complex object as string
      'Pending',
      formData.indemnitorFullName || (formData.indemnitors && formData.indemnitors[0] ? formData.indemnitors[0].firstName : ''),
      formData.defendantEmail,
      formData.defendantPhone
    ];

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();

    return { success: true, message: "Booking Saved", row: lastRow, receiptNumber: receiptNum };

  } catch (e) {
    console.error(`Save Booking Failed: ${e.message}`);
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generates the next unique receipt number atomically.
 * Updates Script Properties to persist the counter.
 */
function getNextReceiptNumber() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(3000); // Prevent race conditions

    const props = PropertiesService.getScriptProperties();
    // Get current or default
    let current = parseInt(props.getProperty('CURRENT_RECEIPT_NUMBER')) || 202500;

    // Increment
    const next = current + 1;

    // Save immediately
    props.setProperty('CURRENT_RECEIPT_NUMBER', next.toString());

    return { success: true, receiptNumber: next };

  } catch (e) {
    console.error(`Receipt Gen Failed: ${e.message}`);
    // Fallback to random if lock fails to avoid blocking user (Robustness vs Correctness trade-off)
    return { success: false, receiptNumber: Math.floor(Math.random() * 1000000), error: "Lock failed" };
  } finally {
    lock.releaseLock();
  }
}
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


// ============================================================================
// NEW IN V5.1.0: WIX PORTAL INTAKE HANDLERS
// ============================================================================

/**
 * Handles intake submission from Wix Portal (Indemnitor/Defendant forms)
 * This receives data from the portal-indemnitor page and queues it for processing
 */
function handleIntakeSubmission(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('IntakeQueue');

    // Auto-create if missing
    if (!sheet) {
      sheet = ss.insertSheet('IntakeQueue');
      sheet.appendRow([
        'Timestamp', 'IntakeID', 'Role', 'Email', 'Phone', 'FullName',
        'DefendantName', 'DefendantPhone', 'CaseNumber', 'Status',
        'References', 'EmployerInfo', 'ResidenceType', 'ProcessedAt'
      ]);
      sheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    const intakeId = 'INT-' + timestamp.getTime();

    // Extract data from the intake payload
    const row = [
      timestamp,
      intakeId,
      data.role || 'indemnitor',
      data.indemnitorEmail || data.email || '',
      data.indemnitorPhone || data.phone || '',
      data.indemnitorFullName || data.fullName || '',
      data.defendantFullName || data.defendantName || '',
      data.defendantPhone || '',
      data.caseNumber || '',
      'pending',
      JSON.stringify(data.references || []),
      JSON.stringify({
        employer: data.indemnitorEmployerName,
        employerCity: data.indemnitorEmployerCity,
        employerState: data.indemnitorEmployerState,
        employerZip: data.indemnitorEmployerZip,
        employerPhone: data.indemnitorEmployerPhone,
        supervisor: data.indemnitorSupervisorName,
        supervisorPhone: data.indemnitorSupervisorPhone
      }),
      data.residenceType || '',
      '' // ProcessedAt - empty until processed
    ];

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();

    Logger.log('✅ Intake saved: ' + intakeId);

    return {
      success: true,
      message: 'Intake received',
      intakeId: intakeId,
      row: lastRow
    };

  } catch (e) {
    console.error('Intake submission failed: ' + e.message);
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles the "Start Paperwork" action from Wix Portal
 * This triggers document generation and returns a signing link
 */
function handleStartPaperwork(data) {
  try {
    Logger.log('🚀 Starting paperwork for case: ' + (data.caseNumber || 'NEW'));

    // 1. Check if we have a pending document already
    if (data.documentId) {
      // Return existing signing link
      const link = createEmbeddedLink(
        data.documentId,
        data.signerEmail || data.indemnitorEmail,
        data.signerRole || 'Indemnitor',
        60 // 60 minute expiration
      );
      return link;
    }

    // 2. If no document exists, we need to generate one
    // This would typically be triggered from the Dashboard after staff review
    // For now, return a message indicating the intake is queued

    // Check if generateAndSendWithWixPortal is available
    if (typeof generateAndSendWithWixPortal === 'function') {
      // Prepare the form data for document generation
      const formData = {
        'defendant-first-name': data.defendantFirstName || '',
        'defendant-last-name': data.defendantLastName || '',
        defendantName: data.defendantName || '',
        defendantEmail: data.defendantEmail || '',
        defendantPhone: data.defendantPhone || '',
        indemnitorFullName: data.indemnitorFullName || '',
        indemnitorEmail: data.indemnitorEmail || '',
        indemnitorPhone: data.indemnitorPhone || '',
        caseNumber: data.caseNumber || '',
        signingMethod: data.signingMethod || 'embedded',
        selectedDocs: data.selectedDocs || ['bail_application', 'indemnitor_agreement']
      };

      return generateAndSendWithWixPortal(formData);
    }

    return {
      success: false,
      error: 'Document generation not available. Please use Dashboard to process this intake.',
      intakeQueued: true
    };

  } catch (e) {
    console.error('Start paperwork failed: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Fetches pending intakes from the queue
 */
function fetchPendingIntakes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('IntakeQueue');

    if (!sheet) {
      return { success: true, intakes: [], message: 'No intake queue found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const intakes = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[9]; // Status column

      if (status === 'pending') {
        const intake = {};
        headers.forEach((header, idx) => {
          intake[header] = row[idx];
        });
        intake.rowNumber = i + 1;
        intakes.push(intake);
      }
    }

    return { success: true, intakes: intakes, count: intakes.length };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Marks an intake as processed
 */
function markIntakeAsProcessed(intakeId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('IntakeQueue');

    if (!sheet) {
      return { success: false, error: 'IntakeQueue sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === intakeId) { // IntakeID column
        sheet.getRange(i + 1, 10).setValue('processed'); // Status column
        sheet.getRange(i + 1, 14).setValue(new Date()); // ProcessedAt column
        return { success: true, message: 'Intake marked as processed' };
      }
    }

    return { success: false, error: 'Intake not found: ' + intakeId };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Safe wrapper for generateAndSendWithWixPortal (SOC II compliant)
 */
function generateAndSendWithWixPortal_Safe(data) {
  // Log the request for audit
  if (typeof logProcessingEvent === 'function') {
    logProcessingEvent('GENERATE_AND_SEND_REQUEST', {
      caseNumber: data.caseNumber,
      defendantName: data.defendantName || data['defendant-first-name'],
      timestamp: new Date().toISOString()
    });
  }

  // Delegate to the main function if available
  if (typeof generateAndSendWithWixPortal === 'function') {
    return generateAndSendWithWixPortal(data);
  }

  // Fallback: Use the basic signing flow
  return handleSendForSignature(data);
}

/**
 * Saves filled packet to Google Drive
 */
function saveFilledPacketToDrive(data) {
  try {
    const config = getConfig();
    const folderId = data.folderId || config.GOOGLE_DRIVE_OUTPUT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);

    if (!data.pdfBase64) {
      return { success: false, error: 'No PDF data provided' };
    }

    const fileName = data.fileName || `Bond_Packet_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfBytes = Utilities.base64Decode(data.pdfBase64);
    const blob = Utilities.newBlob(pdfBytes, 'application/pdf', fileName);

    const file = folder.createFile(blob);

    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: fileName
    };

  } catch (e) {
    return { success: false, error: e.message };
  }
}
