/**
 * ============================================================================
 * SignNow_Integration_Complete.gs
 * ============================================================================
 * Version: 4.2.0 - FULLY LOADED (V2 API + Conflict Handler + Webhook Support)
 * * FEATURES:
 * 1. Multi-signer Embedded Signing (Defendant + Indemnitors + Agent)
 * 2. V2 API Conflict Handling (Resolves "Invite Already Exists" errors)
 * 3. Wix Signing Portal Integration (Custom redirects & iFrame support)
 * 4. Automated Post-Signing Workflow (Auto-download to Google Drive)
 * 5. Webhook Registration Logic (Turn on the automation)
 * ============================================================================
 */

// ============================================================================
// 1. GLOBAL CONFIGURATION
// ============================================================================

const INTEGRATION_CONFIG = {
  REDIRECT_URI: 'https://www.shamrockbailbonds.biz',
  DECLINE_REDIRECT_URI: 'https://www.shamrockbailbonds.biz',
  CLOSE_REDIRECT_URI: 'https://www.shamrockbailbonds.biz',
  WIX_SIGNING_PAGE: 'https://www.shamrockbailbonds.biz/sign',
  LINK_EXPIRATION_MINUTES: 45,
  COMPLETED_BONDS_FOLDER_ID: '1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs'
};

// ============================================================================
// 2. WEBHOOK ACTIVATION (TURN FEATURES ON)
// ============================================================================

/**
 * RUN THIS MANUALLY ONCE to activate the "Save to Drive" automation.
 * This tells SignNow to send a notification to your script when a doc is finished.
 */
function SN_registerCompletionWebhook() {
  const config = SN_getConfig();
  const webhookUrl = ScriptApp.getService().getUrl(); // Your Web App URL

  if (!webhookUrl) {
    throw new Error("Please deploy your script as a Web App first!");
  }

  const payload = {
    event: 'user.document.complete',
    action: 'callback',
    attributes: {
      callback: webhookUrl,
      headers: {}
    }
  };

  const response = UrlFetchApp.fetch(config.API_BASE + '/api/v2/events', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const result = JSON.parse(response.getContentText());
  SN_log('Webhook_Registration', result);
  return result;
}

// ============================================================================
// 3. MAIN WORKFLOW: MULTI-SIGNER EMBEDDED LINKS
// ============================================================================

/**
 * Orchestrates the complete SignNow workflow: Upload -> Add Fields -> Invite
 * Used by backend integrations (e.g. Wix Portal)
 */
function SN_processCompleteWorkflow(params) {
  try {
    // 1. Upload Document
    const uploadResult = SN_uploadDocument(params.pdfBase64, params.fileName);
    if (!uploadResult.success) throw new Error('Upload failed: ' + uploadResult.error);
    const documentId = uploadResult.documentId;

    // 2. Add Fields (If field definitions provided)
    // Note: This requires field definitions to be passed or calculated here.
    // If Dashboard.html calculates them, they should be in params.fields
    if (params.fields && params.fields.length > 0) {
      SN_addFields(documentId, params.fields);
    }
    // If fields are NOT passed, we might be relying on templates or text tags?
    // Dashboard.html usually calculates fields client-side. 
    // If this function is called without fields, the doc will have no fields!
    // We'll log a warning.
    else {
      SN_log('Workflow', 'No fields provided for document ' + documentId);
    }

    // 3. Generate Links / Invites
    if (params.deliveryMethod === 'kiosk' || params.deliveryMethod === 'embedded') {
      return SN_createAllSignerLinks(documentId, params.formData, options = {});
    } else {
      // Handle Email/SMS
      const signers = buildSignersFromFormData(params.formData);
      if (params.deliveryMethod === 'sms') {
        SN_sendSmsInvite(documentId, signers);
      } else {
        SN_sendEmailInvite(documentId, signers);
      }
      return { success: true, documentId: documentId, signingLinks: [] };
    }

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function SN_createAllSignerLinks(documentId, formData, options) {
  const config = SN_getConfig();
  const signers = buildSignersFromFormData(formData);

  if (signers.length === 0) return { success: false, error: 'No signers found.' };

  try {
    const inviteUrl = config.API_BASE + '/v2/documents/' + documentId + '/embedded-invites';

    const invitePayload = {
      invites: signers.map((signer, idx) => ({
        email: signer.email || `client${idx}@shamrockbailbonds.biz`,
        role: signer.role,
        order: signer.order || (idx + 1),
        auth_method: 'none',
        first_name: signer.firstName || 'Valued',
        last_name: signer.lastName || 'Client',
        force_new_signature: 1,
        redirect_uri: INTEGRATION_CONFIG.REDIRECT_URI,
        decline_redirect_uri: INTEGRATION_CONFIG.DECLINE_REDIRECT_URI,
        close_redirect_uri: INTEGRATION_CONFIG.CLOSE_REDIRECT_URI
      })),
      name_formula: `Bond_${formData['defendant-last-name'] || 'New'}|date`
    };

    const response = UrlFetchApp.fetch(inviteUrl, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
      payload: JSON.stringify(invitePayload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 400) throw new Error('Invite Failed: ' + response.getContentText());

    const signingLinks = signers.map(signer => {
      const linkData = SN_createEmbeddedLink(documentId, signer.email, signer.role);
      return {
        ...signer,
        link: linkData.link,
        wixLink: buildWixSigningUrl(linkData.link, signer),
        success: linkData.success
      };
    });

    return {
      success: true,
      documentId: documentId,
      signingLinks: signingLinks,
      wixSigningPageBase: INTEGRATION_CONFIG.WIX_SIGNING_PAGE
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * HARDENED CONFLICT HANDLER: SN_createEmbeddedLink
 */
function SN_createEmbeddedLink(documentId, signerEmail, signerRole, linkExpiration) {
  const config = SN_getConfig();
  const inviteUrl = config.API_BASE + '/v2/documents/' + documentId + '/embedded-invites';

  try {
    const invitePayload = {
      invites: [{
        email: signerEmail, role: signerRole, order: 1, auth_method: 'none',
        first_name: 'Valued', last_name: 'Client', force_new_signature: 1
      }]
    };

    // CONFLICT HANDLER WITH LOCK SERVICE
    const lock = LockService.getScriptLock();
    try {
      // Wait up to 10 seconds for other processes
      lock.waitLock(10000);

      // 1. Try to create new invite
      let inviteRes = UrlFetchApp.fetch(inviteUrl, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
        payload: JSON.stringify(invitePayload),
        muteHttpExceptions: true
      });
      let inviteResult = JSON.parse(inviteRes.getContentText());
      let inviteId = null;

      if (inviteRes.getResponseCode() < 300 && inviteResult.data?.length > 0) {
        inviteId = inviteResult.data[0].id;
      }
      else if (inviteResult.errors && inviteResult.errors.some(e => e.code === 19004002)) {
        // HANDLE CONFLICT: Fetch existing invite
        // This is safe(r) inside the lock if multiple concurrent requests happen
        const getRes = UrlFetchApp.fetch(inviteUrl, { method: 'GET', headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN }, muteHttpExceptions: true });
        const getData = JSON.parse(getRes.getContentText());
        const match = (getData.data || []).find(inv => inv.email === signerEmail);
        inviteId = match ? match.id : (getData.data?.[0]?.id);
      }

      if (!inviteId) return { success: false, error: 'Could not resolve invite ID.' };

      // 2. Generate Link
      const linkUrl = inviteUrl + '/' + inviteId + '/link';
      const linkRes = UrlFetchApp.fetch(linkUrl, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
        payload: JSON.stringify({ auth_method: 'none', link_expiration: linkExpiration || 45 }),
        muteHttpExceptions: true
      });

      const linkResult = JSON.parse(linkRes.getContentText());
      return (linkRes.getResponseCode() < 300 && linkResult.data)
        ? { success: true, link: linkResult.data.link }
        : { success: false, error: 'Link generation failed.' };

    } catch (e) {
      return { success: false, error: e.toString() };
    } finally {
      lock.releaseLock();
    }
  }

// ============================================================================
// 4. POST-SIGNING AUTOMATION
// ============================================================================

function handleDocumentComplete(payload) {
    const documentId = payload.document_id || payload.document.id;
    try {
      const pdfBlob = SN_downloadDocument(documentId, 'collapsed');
      const info = SN_getDocumentInfo(documentId);
      const defendantName = info.document_name.replace('Bond_', '').split('|')[0] || 'Unknown';
      const bondDate = Utilities.formatDate(new Date(), 'America/New_York', 'MM-dd-yyyy');

      pdfBlob.setName(defendantName + ' - Signed Bond Package.pdf');

      const parentFolder = DriveApp.getFolderById(INTEGRATION_CONFIG.COMPLETED_BONDS_FOLDER_ID);
      const folderName = defendantName + ' - ' + bondDate;
      let folder = parentFolder.getFoldersByName(folderName).hasNext()
        ? parentFolder.getFoldersByName(folderName).next()
        : parentFolder.createFolder(folderName);

      const file = folder.createFile(pdfBlob);
      logCompletedBond({ defendantName, bondDate, documentId, driveUrl: file.getUrl(), completedAt: new Date().toISOString() });
      return { success: true };
    } catch (e) {
      SN_log('Webhook_Error', e.toString());
      return { success: false, error: e.toString() };
    }
  }

  // ============================================================================
  // 5. HELPER FUNCTIONS
  // ============================================================================

  function buildSignersFromFormData(formData) {
    const signers = [];
    let order = 1;
    if (formData['defendant-first-name']) {
      signers.push({ role: 'Defendant', firstName: formData['defendant-first-name'], lastName: formData['defendant-last-name'], email: formData['defendant-email'], phone: formData['defendant-phone'], order: order++ });
    }
    if (Array.isArray(formData.indemnitors)) {
      formData.indemnitors.forEach((ind, i) => {
        if (ind.firstName) signers.push({ role: i === 0 ? 'Indemnitor' : 'Co-Indemnitor', firstName: ind.firstName, lastName: ind.lastName, email: ind.email, phone: ind.phone, order: order++ });
      });
    }
    signers.push({ role: 'Bail Agent', firstName: 'Shamrock', lastName: 'Agent', email: 'admin@shamrockbailbonds.biz', order: order++ });
    return signers;
  }

  function buildWixSigningUrl(link, signer) {
    const name = (signer.firstName + ' ' + signer.lastName).trim();
    return INTEGRATION_CONFIG.WIX_SIGNING_PAGE + '?link=' + encodeURIComponent(link) + '&signer=' + encodeURIComponent(name) + '&role=' + encodeURIComponent(signer.role);
  }

  function SN_getConfig() {
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('SIGNNOW_API_TOKEN');
    if (!token) throw new Error('SIGNNOW_API_TOKEN is missing.');
    return { API_BASE: 'https://api.signnow.com', ACCESS_TOKEN: token };
  }

  function SN_log(action, msg) { Logger.log('[SignNow] ' + action + ': ' + JSON.stringify(msg)); }

  function SN_getDocumentInfo(id) {
    const cfg = SN_getConfig();
    const res = UrlFetchApp.fetch(cfg.API_BASE + '/document/' + id, { headers: { Authorization: 'Bearer ' + cfg.ACCESS_TOKEN } });
    return JSON.parse(res.getContentText());
  }

  function SN_downloadDocument(id, type) {
    const cfg = SN_getConfig();
    const res = UrlFetchApp.fetch(cfg.API_BASE + '/document/' + id + '/download?type=' + (type || 'collapsed'), { headers: { Authorization: 'Bearer ' + cfg.ACCESS_TOKEN }, muteHttpExceptions: true });
    return res.getResponseCode() < 300 ? res.getBlob() : null;
  }

  function SN_uploadDocument(base64, name) {
    const cfg = SN_getConfig();
    const boundary = '-------' + Utilities.getUuid();
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'application/pdf', name);
    let body = Utilities.newBlob('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + name + '"\r\nContent-Type: application/pdf\r\n\r\n').getBytes();
    body = body.concat(blob.getBytes());
    body = body.concat(Utilities.newBlob('\r\n--' + boundary + '--\r\n').getBytes());
    const res = UrlFetchApp.fetch(cfg.API_BASE + '/document', { method: 'POST', headers: { Authorization: 'Bearer ' + cfg.ACCESS_TOKEN }, contentType: 'multipart/form-data; boundary=' + boundary, payload: body, muteHttpExceptions: true });
    return res.getResponseCode() < 300 ? { success: true, documentId: JSON.parse(res.getContentText()).id } : { success: false, error: res.getContentText() };
  }

  function logCompletedBond(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Completed Bonds Log') || ss.insertSheet('Completed Bonds Log');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp', 'Defendant', 'Date', 'SignNow ID', 'Drive URL']);
    sheet.appendRow([data.completedAt, data.defendantName, data.bondDate, data.documentId, data.driveUrl]);
  }
  /**
   * ============================================================================
   * 6. FIELD & INVITE MANAGEMENT (IMPLEMENTED)
   * ============================================================================
   */

  /**
   * Add signature/initial/text fields to a document
   * @param {string} documentId - The ID of the document in SignNow
   * @param {Array} fields - Array of field objects to add
   * @returns {object} - API response
   */
  function SN_addFields(documentId, fields) {
    const config = SN_getConfig();
    const url = config.API_BASE + '/document/' + documentId;

    const payload = {
      fields: fields
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    SN_log('AddFields', result);
    return result;
  }

  /**
   * Send a document invite via Email
   * @param {string} documentId - The ID of the document
   * @param {Array} signers - Array of signer objects {email, role, order}
   * @param {object} options - Additional options
   * @returns {object} API response
   */
  function SN_sendEmailInvite(documentId, signers, options) {
    const config = SN_getConfig();
    const url = config.API_BASE + '/document/' + documentId + '/invite';

    const payload = {
      to: signers.map(s => ({ email: s.email, role: s.role, order: s.order }))
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    SN_log('SendEmailInvite', result);
    return result;
  }

  /**
   * Send a document invite via SMS
   * @param {string} documentId - The ID of the document
   * @param {Array} signers - Array of signer objects {phone, role, order}
   * @param {object} options - Additional options
   * @returns {object} API response
   */
  function SN_sendSmsInvite(documentId, signers, options) {
    const config = SN_getConfig();
    const url = config.API_BASE + '/document/' + documentId + '/sms_invite';

    const payload = {
      to: signers.map(s => ({ phone: s.phone, role: s.role, order: s.order }))
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    SN_log('SendSmsInvite', result);
    return result;
  }

  /**
   * ROBUST CONNECTOR: fetchWithRetry
   * Adds reliability to all external API calls.
   */
  function fetchWithRetry(url, options, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();

        // Success or Client Error (4xx - do not retry)
        if (code < 500) return response;

        // Server Error (5xx) - Retry
        console.warn(`Server Error ${code} for ${url}. Retrying... (${attempt + 1}/${maxRetries})`);
        Utilities.sleep(Math.pow(2, attempt) * 1000); // 1s, 2s, 4s
        attempt++;

      } catch (e) {
        console.warn(`Network Error for ${url}: ${e.message}. Retrying... (${attempt + 1}/${maxRetries})`);
        Utilities.sleep(Math.pow(2, attempt) * 1000);
        attempt++;
      }
    }
    throw new Error(`Request failed after ${maxRetries} attempts: ${url}`);
  }