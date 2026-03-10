/**
 * ============================================================================
 * SignNow_Integration_Complete.gs
 * ============================================================================
 * Version: 4.3.2 - FULLY LOADED + SMART WEBHOOKS + DUPLICATE HANDLING
 * * FEATURES:
 * 1. Multi-signer Embedded Signing (Defendant + Indemnitors + Agent)
 * 2. V2 API Conflict Handling (Resolves "Invite Already Exists" errors)
 * 3. Wix Signing Portal Integration (Custom redirects & iFrame support)
 * 4. Automated Post-Signing Workflow (Auto-download to Google Drive)
 * 5. Webhook Registration Logic (Turn on the automation) - SELF CLEANING
 * ============================================================================
 */

// ============================================================================
// 1. GLOBAL CONFIGURATION
// ============================================================================

const INTEGRATION_CONFIG = {
  get REDIRECT_URI() { return this.getBaseUrl(); },
  get DECLINE_REDIRECT_URI() { return this.getBaseUrl(); },
  get CLOSE_REDIRECT_URI() { return this.getBaseUrl(); },
  get WIX_SIGNING_PAGE() { return this.getBaseUrl() + '/sign'; },
  LINK_EXPIRATION_MINUTES: 45,
  COMPLETED_BONDS_FOLDER_ID: '1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs',

  getBaseUrl: function () {
    try {
      // Try to get from Script Properties
      const props = PropertiesService.getScriptProperties();
      const url = props.getProperty('PORTAL_BASE_URL');
      if (url) return url.replace(/\/$/, ''); // Remove trailing slash if present
    } catch (e) {
      console.warn('Could not fetch PORTAL_BASE_URL from properties:', e);
    }
    // Fallback to default
    return 'https://www.shamrockbailbonds.biz';
  }
};

// ============================================================================
// 2. WEBHOOK ACTIVATION (TURN FEATURES ON)
// ============================================================================

/**
 * 2026 UPDATE: Self-Cleaning Webhook Registration
 * - Fetches User ID
 * - Lists existing webhooks
 * - Deletes old 'user.document.complete' hooks to prevent duplicates
 * - Registers new hook with correct Script URL
 * 
 * @param {string} [forceUrl] - Optional: Override URL (e.g. use the /exec URL explicitly)
 */
function SN_registerCompletionWebhook(forceUrl) {
  const config = SN_getConfig();
  // CRITICAL FIX: Ignore 'WEBHOOK_URL' property if it points to Slack, as that breaks the "Save to Drive" feature.
  // We MUST use the ScriptApp service URL to receive the callback ourselves.
  /* const savedUrl = PropertiesService.getScriptProperties().getProperty('WEBHOOK_URL'); */
  let webhookUrl = forceUrl || ScriptApp.getService().getUrl();

  // If in Editor (dev mode), warn the user they might want the /exec URL
  if (webhookUrl.endsWith('/dev')) {
    console.warn("⚠️ WARNING: Registering 'dev' URL. For production, deploy as Web App and pass the '/exec' URL to this function.");
  }

  console.log('--- STARTING WEBHOOK REGISTRATION ---');
  console.log('Target Callback URL:', webhookUrl);

  if (!webhookUrl) throw new Error("Could not determine Webhook URL.");

  // 1. Get User ID
  console.log('Step 1: Fetching User ID...');
  const userRes = UrlFetchApp.fetch(config.API_BASE + '/user', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
    muteHttpExceptions: true
  });
  const userId = JSON.parse(userRes.getContentText()).id;
  console.log('User ID:', userId);

  // 2. List & Cleanup Existing Webhooks (Best Effort)
  console.log('Step 2: Checking existing subscriptions (Best Effort)...');
  try {
    const listRes = UrlFetchApp.fetch(config.API_BASE + `/api/v2/events`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
      muteHttpExceptions: true
    });

    // Check Status first
    if (listRes.getResponseCode() === 200) {
      const listContent = listRes.getContentText();
      let existingHooks = [];
      const json = JSON.parse(listContent);
      if (json.data) existingHooks = json.data;
      else if (Array.isArray(json)) existingHooks = json;

      console.log(`Found ${existingHooks.length} existing subscriptions.`);

      existingHooks.forEach(hook => {
        if (hook.event === 'user.document.complete') {
          console.log(`Deleting old hook [ID: ${hook.id}] pointing to: ${hook.attributes.callback}`);
          try {
            UrlFetchApp.fetch(config.API_BASE + `/api/v2/events/${hook.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
              muteHttpExceptions: true
            });
            console.log('Deleted.');
          } catch (e) {
            console.warn('Failed to delete hook:', e.message);
          }
        }
      });
    } else {
      console.warn('Skipping cleanup: List endpoint returned ' + listRes.getResponseCode());
    }
  } catch (e) {
    console.warn('Skipping cleanup due to error:', e.message);
  }

  // 3. Register New
  console.log('Step 3: Registering new webhook...');
  const payload = {
    event: 'user.document.complete',
    entity_id: userId,
    action: 'callback',
    attributes: {
      callback: webhookUrl,
      headers: {}
    }
  };

  const createRes = UrlFetchApp.fetch(config.API_BASE + '/api/v2/events', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const content = createRes.getContentText();
  const result = JSON.parse(content);

  // HANDLE DUPLICATE SUCCESS CASE
  if (result.errors && result.errors[0] && result.errors[0].message && result.errors[0].message.includes('Active subscriptions must have different combinations')) {
    console.log('✅ SUCCESS: Webhook is ALREADY registered for this URL.');
    SN_log('Webhook_Registration', { status: 'success', message: 'Already Registered', details: result });
    return { status: 'success', message: 'Already Registered' };
  }

  console.log('Registration Result:', content);
  SN_log('Webhook_Registration', result);
  return result;
}

// ============================================================================
// 3. MAIN WORKFLOW: MULTI-SIGNER EMBEDDED LINKS
// ============================================================================

/**
 * Creates embedded signing links for all parties based on FormData
 * @param {string} documentId - The SignNow document ID
 * @param {object} formData - The intake form data
 * @param {object} options - Options (redirect_uri, etc.)
 */
function SN_createAllSignerLinks(documentId, formData, options = {}) {
  const signers = buildSignersFromFormData(formData);
  const result = {
    documentId: documentId,
    signingLinks: [],
    success: true
  };

  // We need to generate links sequentially or in parallel?
  // SignNow V2 usually requires sequential calls if using invite_link steps?
  // Actually, embedded invites are per role. We can iterate.

  for (const signer of signers) {
    try {
      const linkRes = SN_createEmbeddedLink(documentId, signer.role, signer.email, options);
      if (linkRes.success) {
        result.signingLinks.push({
          role: signer.role,
          email: signer.email,
          link: linkRes.link,
          phone: signer.phone // pass phone through for UI usage
        });
      } else {
        SN_log('Link_Error', 'Failed for ' + signer.role + ': ' + linkRes.error);
        // Continue for other signers? Or fail hard?
        // Let's continue but mark partial?
      }
    } catch (e) {
      SN_log('Link_Exception', 'Exception for ' + signer.role + ': ' + e.message);
    }
  }

  return result;
}

/**
 * 2026 UPDATE: CONFLICT HANDLER & ROBUST LINK GEN
 * Tries to create an embedded invite.
 * If it fails with "invite already exists", it cancels the old one and retries.
 */
function SN_createEmbeddedLink(documentId, role, email, options) {
  const config = SN_getConfig();

  try {
    // Step 1: GET the document to find ALL role unique_ids
    // SignNow v2 embedded-invites REQUIRES all roles to be included in the request
    SN_log('EmbeddedLink_Start', { documentId, role, email });

    const docResponse = UrlFetchApp.fetch(config.API_BASE + '/document/' + documentId, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
      muteHttpExceptions: true
    });

    if (docResponse.getResponseCode() !== 200) {
      return { success: false, error: 'Failed to get document: HTTP ' + docResponse.getResponseCode() + ' - ' + docResponse.getContentText() };
    }

    const docJson = JSON.parse(docResponse.getContentText());

    // Get ALL roles on the document
    if (!docJson.roles || docJson.roles.length === 0) {
      return { success: false, error: 'Document has no roles defined. Fields may not have been added correctly.' };
    }

    SN_log('EmbeddedLink_AllRoles', { roles: docJson.roles.map(function (r) { return r.name + ':' + r.unique_id; }) });

    // Find the target role - try exact match, then case-insensitive
    var targetRoleObj = null;
    for (var i = 0; i < docJson.roles.length; i++) {
      if (docJson.roles[i].name === role) {
        targetRoleObj = docJson.roles[i];
        break;
      }
    }
    if (!targetRoleObj) {
      // Try case-insensitive match
      for (var i = 0; i < docJson.roles.length; i++) {
        if (docJson.roles[i].name.toLowerCase() === role.toLowerCase()) {
          targetRoleObj = docJson.roles[i];
          break;
        }
      }
    }
    if (!targetRoleObj) {
      // If target role not found, use the first available role
      SN_log('EmbeddedLink_RoleFallback', { requested: role, using: docJson.roles[0].name });
      targetRoleObj = docJson.roles[0];
    }

    SN_log('EmbeddedLink_TargetRole', { name: targetRoleObj.name, id: targetRoleObj.unique_id });

    // Step 2: Build invites array with ALL roles (SignNow requires this)
    // Use the actual signer email for the target role, placeholder emails for others
    // IMPORTANT: email must NOT match the document owner (causes error 19004006)
    var signerEmail = email || 'signer@shamrockbailbonds.biz';
    var invites = [];
    var orderCounter = 1;

    for (var i = 0; i < docJson.roles.length; i++) {
      var r = docJson.roles[i];
      var inviteEmail;

      if (r.unique_id === targetRoleObj.unique_id) {
        // Target role - use the actual signer email
        inviteEmail = signerEmail;
      } else {
        // Non-target roles - use unique placeholder emails
        // Must be different from each other AND from the doc owner
        inviteEmail = r.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.placeholder@shamrockbailbonds.biz';
      }

      invites.push({
        email: inviteEmail,
        role_id: r.unique_id,
        order: orderCounter,
        auth_method: 'none',
        force_new_signature: 0,
        redirect_uri: (r.unique_id === targetRoleObj.unique_id) ? (options.redirect_uri || '') : '',
        decline_redirect_uri: (r.unique_id === targetRoleObj.unique_id) ? (options.decline_redirect_uri || '') : '',
        close_redirect_uri: (r.unique_id === targetRoleObj.unique_id) ? (options.close_redirect_uri || '') : '',
        redirect_target: 'self'
      });
      orderCounter++;
    }

    var endpoint = config.API_BASE + '/v2/documents/' + documentId + '/embedded-invites';
    var payload = { invites: invites };

    SN_log('EmbeddedLink_Request', { endpoint, inviteCount: invites.length, roles: invites.map(function (inv) { return inv.email; }) });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      var response = UrlFetchApp.fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      var responseText = response.getContentText();
      var json = JSON.parse(responseText);
      SN_log('EmbeddedLink_Response', { code: response.getResponseCode(), body: responseText.substring(0, 500) });

      // Check for conflict (invite already exists) and retry
      if (response.getResponseCode() === 409 || (json.errors && json.errors[0] && json.errors[0].message && json.errors[0].message.includes('already exists'))) {
        SN_log('Conflict_Handler', 'Invite exists. Cancelling and retrying...');
        SN_cancelInvites(documentId);

        response = UrlFetchApp.fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        responseText = response.getContentText();
        json = JSON.parse(responseText);
      }

      // Extract the embedded invite ID for our TARGET role
      // Response format: { "data": [{ "id": "...", "email": "...", "role_id": "...", ... }, ...] }
      var targetInviteId = null;

      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300 && json.data) {
        var dataArr = Array.isArray(json.data) ? json.data : [json.data];
        for (var i = 0; i < dataArr.length; i++) {
          if (dataArr[i].role_id === targetRoleObj.unique_id || dataArr[i].email === signerEmail) {
            targetInviteId = dataArr[i].id;
            break;
          }
        }
        // Fallback: use first invite if we can't match
        if (!targetInviteId && dataArr.length > 0) {
          targetInviteId = dataArr[0].id;
        }
      }

      if (!targetInviteId) {
        return { success: false, error: 'Failed to create embedded invite (HTTP ' + response.getResponseCode() + '): ' + responseText.substring(0, 500) };
      }

      SN_log('EmbeddedLink_InviteCreated', { targetInviteId: targetInviteId, targetRole: targetRoleObj.name });

      // Step 3: Generate the actual signing link for the target role's invite
      var linkEndpoint = config.API_BASE + '/v2/documents/' + documentId + '/embedded-invites/' + targetInviteId + '/link';

      var linkPayload = {
        auth_method: 'none',
        link_expiration: options.expiration || 45
      };

      var linkResponse = UrlFetchApp.fetch(linkEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(linkPayload),
        muteHttpExceptions: true
      });

      var linkResponseText = linkResponse.getContentText();
      var linkJson = JSON.parse(linkResponseText);
      SN_log('EmbeddedLink_LinkResponse', { code: linkResponse.getResponseCode(), body: linkResponseText.substring(0, 500) });

      // Extract signing link from response: { "data": { "link": "https://..." } }
      var signingLink = linkJson.link || (linkJson.data && linkJson.data.link) || null;

      if (signingLink) {
        return { success: true, link: signingLink };
      }

      return { success: false, error: 'No signing link in link response (HTTP ' + linkResponse.getResponseCode() + '): ' + linkResponseText.substring(0, 500) };

    } finally {
      lock.releaseLock();
    }

  } catch (e) {
    SN_log('EmbeddedLink_Error', e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Helper to cancel all pending invites for a doc (nuclear option for conflicts)
 */
function SN_cancelInvites(documentId) {
  const config = SN_getConfig();
  // V2: GET /document/{id} -> See 'field_invites' -> DELETE /document/{id}/invite
  // Simplified: Just return true if we assume we want to retry.
  // Real implementation:
  try {
    UrlFetchApp.fetch(config.API_BASE + `/document/${documentId}/fieldinvite`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN },
      muteHttpExceptions: true
    });
    return true;
  } catch (e) {
    SN_log('Cancel_Error', e.message);
    return false;
  }
}


// ============================================================================
// 4. POST-SIGNING AUTOMATION (WEBHOOK HANDLER)
// ============================================================================

/**
 * HANDLES THE "document.complete" WEBHOOK
 * 1. Validates the event
 * 2. Downloads the signed PDF
 * 3. Saves to Google Drive
 * 4. Logs the completion
 */
// The handleDocumentComplete logic was refactored and centralized in WebhookHandler.js and DriveFilingService.gs to avoid Global Namespace conflicts.


// ============================================================================
// 5. HELPER FUNCTIONS & CONFIG
// ============================================================================

var _SN_CACHE = null;

function SN_getConfig() {
  if (_SN_CACHE) return _SN_CACHE;

  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('SIGNNOW_API_TOKEN'); // Bearer Token
  const basicToken = props.getProperty('SIGNNOW_BASIC_TOKEN'); // For auth exchange if needed

  // Auto-Validation?
  if (!token) throw new Error("Missing SIGNNOW_API_TOKEN in Script Properties");

  _SN_CACHE = {
    API_BASE: 'https://api.signnow.com', // or https://api-eval.signnow.com for sandbox
    ACCESS_TOKEN: token,
    BASIC_TOKEN: basicToken
  };
  return _SN_CACHE;
}

function SN_log(action, message) {
  const timestamp = new Date().toISOString();
  console.log(`[SignNow] ${action}: ${JSON.stringify(message)}`);
  // Optional: Write to a Sheet?
}

/**
 * Helper to upload a PDF to SignNow
 */
function SN_uploadDocument(pdfBase64, fileName) {
  const config = SN_getConfig();
  const blob = Utilities.newBlob(Utilities.base64Decode(pdfBase64), 'application/pdf', fileName);

  const url = config.API_BASE + '/document';
  // Upload requires multipart/form-data
  const payload = {
    file: blob
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN }, // Content-Type auto-set by UrlFetch for blobs
    payload: payload,
    muteHttpExceptions: true
  });

  const json = JSON.parse(response.getContentText());
  if (json.id) {
    return { success: true, documentId: json.id };
  } else {
    return { success: false, error: JSON.stringify(json) };
  }
}

/**
 * Build signature fields for a merged bail packet
 * Creates SignNow-compatible field definitions for each signer role.
 * Fields are placed on the first page of the document.
 * 
 * @param {object} params - The workflow params (formData, selectedDocs, etc.)
 * @returns {Array} Array of SignNow field objects
 */
function SN_buildSignatureFields(params) {
  const fields = [];
  const formData = params.formData || params;

  // Check which signers we need
  const defendantEmail = formData.defendantEmail || formData['signer-defendant-email'] || '';
  const indemnitorEmail = formData.indemnitorEmail || formData['signer-indemnitor-email'] || '';

  // Defendant signature field (bottom-left area of page 1)
  if (defendantEmail) {
    fields.push({
      x: 30,
      y: 700,
      width: 200,
      height: 30,
      page_number: 0, // 0-indexed in SignNow API
      role: 'Defendant',
      required: true,
      type: 'signature'
    });
  }

  // Indemnitor signature field (bottom-right area of page 1)
  if (indemnitorEmail) {
    fields.push({
      x: 350,
      y: 700,
      width: 200,
      height: 30,
      page_number: 0,
      role: 'Indemnitor',
      required: true,
      type: 'signature'
    });
  }

  SN_log('BuildFields', { fieldCount: fields.length, roles: fields.map(f => f.role) });
  return fields;
}

/**
 * Add fields to a document (Optional - mostly we use templates)
 */
function SN_addFields(documentId, fields) {
  const config = SN_getConfig();
  const url = config.API_BASE + `/document/${documentId}`;

  SN_log('AddFields_Start', { documentId, fieldCount: fields ? fields.length : 0 });

  if (!fields || fields.length === 0) {
    return { success: true, message: 'No fields to add' };
  }

  const payload = {
    fields: fields
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const json = JSON.parse(response.getContentText());

    if (json.id) {
      SN_log('AddFields_Success', { id: json.id });
      return {
        success: true,
        id: json.id,
        roles: json.roles || []
      };
    } else {
      SN_log('AddFields_Error', json);
      return {
        success: false,
        error: JSON.stringify(json)
      };
    }
  } catch (e) {
    SN_log('AddFields_Exception', e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Maps FormData to SignNow Signer Objects
 */
function buildSignersFromFormData(formData) {
  const signers = [];

  // 1. Defendant (Invitee 1?)
  if (formData.defendantEmail) {
    signers.push({
      role: 'Defendant',
      email: formData.defendantEmail,
      phone: formData.defendantPhone,
      order: 1
    });
  }

  // 2. Indemnitor (Invitee 2?)
  if (formData.indemnitorEmail) {
    signers.push({
      role: 'Indemnitor',
      email: formData.indemnitorEmail,
      phone: formData.indemnitorPhone, // Optional
      order: 1
    });
  }

  // 3. Agent?
  // ...

  return signers;
}

/**
 * Creates a template from a document (making it a reusable template)
 */
function SN_createTemplateFromDoc(documentId, templateName) {
  const config = SN_getConfig();
  const url = config.API_BASE + `/document/${documentId}/template`;

  const payload = { document_name: templateName };

  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + config.ACCESS_TOKEN, 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload)
  });

  return JSON.parse(response.getContentText());
}

/**
 * Send an email invite to signers
 */
function SN_sendEmailInvite(documentId, signers, options) {
  const config = SN_getConfig();
  const url = config.API_BASE + `/document/${documentId}/invite`;

  const payload = {
    to: signers.map(s => ({
      email: s.email,
      role: s.role,
      order: s.order,
      subject: s.subject || options.subject || 'Document to Sign',
      message: s.message || options.message || 'Please sign the attached document.'
    })),
    from: options.senderEmail || 'admin@shamrockbailbonds.biz',
    subject: options.subject || 'Document to Sign',
    message: options.message || 'Please sign the attached document.'
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

function SN_getPaymentLink() {
  // Use global config if available, otherwise fallback
  if (typeof getConfig === 'function') return getConfig().PAYMENT_LINK;

  // Direct fallback
  return 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';
}