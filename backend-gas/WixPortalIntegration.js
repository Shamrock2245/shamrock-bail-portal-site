/**
 * WixPortalIntegration.gs (HARDENED & ROBUST)
 * Version: 3.4.0
 * 
 * This module integrates the Dashboard.html/GAS workflow with the Wix portal.
 * Use this to sync case data and document signing links to the Wix Client Portal.
 * 
 * FEATURES:
 * - Robust Error Handling & Retry Logic
 * - Input Validation & Sanitization
 * - Detailed Logging
 * - Case Data Sync
 * - Document Link Sync
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

function getWixPortalConfig() {
  const scriptProps = PropertiesService.getScriptProperties();
  const apiKey = scriptProps.getProperty('WIX_API_KEY');

  if (!apiKey) {
    Logger.log('⚠️ CRITICAL: WIX_API_KEY is missing in Script Properties.');
  }

  return {
    // Wix site API endpoints
    baseUrl: 'https://www.shamrockbailbonds.biz/_functions',

    // API key for authentication
    apiKey: apiKey || '',

    // Endpoints
    endpoints: {
      addDocument: '/documentsAdd',
      addDocumentsBatch: '/documentsBatch',
      updateStatus: '/documentsStatus',
      syncCaseData: '/api/syncCaseData'
    },

    // Retry settings
    maxRetries: 3,
    retryDelayMs: 1000
  };
}

/**
 * Set the Wix API key in Script Properties
 * Run this once to configure the API key
 */
function setWixApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid API Key provided');
  }
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.setProperty('WIX_API_KEY', apiKey.trim());
  Logger.log('✅ Wix API key set successfully');
}

// =============================================================================
// CORE SYNC FUNCTIONS
// =============================================================================

/**
 * Sync case data to Wix portal with robustness
 * Called from FormDataHandler.gs
 */
function syncCaseDataToWix(caseData, sheetRow) {
  const config = getWixPortalConfig();

  if (!config.apiKey) return { success: false, message: 'Wix API key missing' };
  if (!caseData) return { success: false, message: 'No case data provided' };

  // Sanitize and Format Payload directly
  const payload = {
    apiKey: config.apiKey,
    caseData: {
      caseNumber: String(caseData.Case_Number || caseData.Booking_Number || '').trim(),
      defendantName: String(caseData.Full_Name || caseData.defendantName || '').trim(),
      defendantEmail: String(caseData.Email || caseData.defendantEmail || '').trim(),
      defendantPhone: String(caseData.Phone || caseData.defendantPhone || '').trim(),
      indemnitorName: String(caseData.Indemnitor_Name || '').trim(),
      indemnitorEmail: String(caseData.Indemnitor_Email || '').trim(),
      indemnitorPhone: String(caseData.Indemnitor_Phone || '').trim(),
      bondAmount: parseNumeric(caseData.Bond_Amount),
      county: String(caseData.County || '').trim(),
      arrestDate: formatDateForWix(caseData.Arrest_Date || caseData.Booking_Date),
      charges: String(caseData.Charges || '').trim(),
      status: String(caseData.Status || 'pending').toLowerCase(),
      receiptNumber: String(caseData.Receipt_Number || '').trim(),
      gasSheetRow: sheetRow ? Number(sheetRow) : null
    }
  };

  Logger.log(`🔄 Syncing Case to Wix: ${payload.caseData.caseNumber} (${payload.caseData.defendantName})`);

  return sendToWixWithRetry(config.endpoints.syncCaseData, payload);
}

/**
 * Save multiple signing links to the Wix portal (Batch)
 */
function saveSigningLinksToWixBatch(signers, caseData) {
  const config = getWixPortalConfig();

  if (!config.apiKey) return { success: false, message: 'Wix API key missing' };
  if (!Array.isArray(signers) || signers.length === 0) {
    return { success: false, message: 'No signers provided for batch sync' };
  }

  const documents = signers.map(signer => ({
    memberEmail: String(signer.email || '').trim(),
    memberPhone: String(signer.phone || '').trim(),
    defendantName: String(caseData.defendantName || '').trim(),
    caseNumber: String(caseData.caseNumber || '').trim(),
    documentName: String(caseData.documentName || 'Bail Bond Document').trim(),
    signingLink: String(signer.signingLink || '').trim(),
    signerRole: String(signer.role || 'signer').toLowerCase(),
    signNowDocumentId: String(signer.signNowDocumentId || caseData.signNowDocumentId || '').trim(),
    expiresAt: caseData.expiresAt ? new Date(caseData.expiresAt).toISOString() : null
  }));

  const payload = {
    apiKey: config.apiKey,
    documents: documents
  };

  Logger.log(`🔄 Syncing ${documents.length} signing links to Wix...`);
  return sendToWixWithRetry(config.endpoints.addDocumentsBatch, payload);
}

// =============================================================================
// BACKEND WORKFLOW INTEGRATION
// =============================================================================

/**
 * Enhanced generation flow that creates SignNow links AND syncs to Wix
 * This is the Function called by 'sendToWixPortal' action in Code.gs
 */
function generateAndSendWithWixPortal(formData) {
  Logger.log('🚀 Starting Wix Portal Workflow...');

  // 1. Validate Dependencies
  if (typeof SN_processCompleteWorkflow !== 'function') {
    Logger.log('❌ Error: SN_processCompleteWorkflow function not found. Check SignNow_Integration_Complete.gs');
    return { success: false, message: 'Server dependency missing: SignNow Integration' };
  }

  // 2. Prepare Params for Workflow
  // Dashboard.html must send 'selectedDocs' (array of strings) and 'pdfBase64' (string)
  const params = {
    formData: formData,
    selectedDocs: formData.selectedDocs || [], // Critical for field placement
    deliveryMethod: formData.signingMethod || 'email',
    pdfBase64: formData.pdfBase64,
    fileName: formData.fileName
  };

  // 3. Execute Workflow (SignNow)
  let signingResult;
  try {
    signingResult = SN_processCompleteWorkflow(params);
  } catch (e) {
    Logger.log('❌ SignNow generation failed: ' + e.message);
    return { success: false, message: 'SignNow error: ' + e.message };
  }

  if (!signingResult.success) {
    Logger.log('❌ SignNow generation returned failure: ' + JSON.stringify(signingResult));
    return signingResult;
  }

  Logger.log('✅ SignNow links generated. documentId: ' + signingResult.documentId);

  // 4. Prepare Data for Wix Sync
  const defendantName = (formData['defendant-first-name'] && formData['defendant-last-name'])
    ? `${formData['defendant-first-name']} ${formData['defendant-last-name']}`
    : (formData.defendantName || 'Unknown Defendant');

  const caseData = {
    defendantName: defendantName,
    caseNumber: formData.caseNumber || formData['case-number'] || 'PENDING',
    documentName: `Bail Packet - ${defendantName}`,
    signNowDocumentId: signingResult.documentId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiration default
  };

  // 5. Map Signers
  // signingResult.signingLinks contains the generated links
  let signersWithLinks = [];
  if (signingResult.signingLinks) {
    signersWithLinks = signingResult.signingLinks.map(signer => ({
      email: signer.email,
      phone: signer.phone,
      role: signer.role,
      signingLink: signer.link || signer.signingLink, // Handle both potential return keys
      signNowDocumentId: signingResult.documentId
    }));
  }

  // 6. Sync to Wix
  const wixResult = saveSigningLinksToWixBatch(signersWithLinks, caseData);

  // 7. Return Composite Result
  return {
    success: true,
    signingLinks: signingResult.signingLinks,
    documentId: signingResult.documentId,
    wixPortal: wixResult,
    message: wixResult.success
      ? 'Documents sent to Client Portal successfully!'
      : 'Documents created, but Portal Sync failed: ' + wixResult.message
  };
}

// =============================================================================
// ROBUST HELPER FUNCTIONS
// =============================================================================

/**
 * Sends a POST request to Wix with retry logic and error handling
 */
function sendToWixWithRetry(endpoint, payload) {
  const config = getWixPortalConfig();
  const url = config.baseUrl + endpoint;
  const params = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  let attempts = 0;
  let lastError = null;

  while (attempts < config.maxRetries) {
    attempts++;
    try {
      const response = UrlFetchApp.fetch(url, params);
      const code = response.getResponseCode();
      const content = response.getContentText();

      let result;
      try {
        result = JSON.parse(content);
      } catch (e) {
        result = { success: code === 200, message: content };
      }

      if (code >= 200 && code < 300) {
        // Success
        return result;
      } else if (code >= 500) {
        // Server Error - Retryable
        Logger.log(`⚠️ Wix Server Error (Attempt ${attempts}): ${code}`);
        Utilities.sleep(config.retryDelayMs * attempts); // Exponential backoff
      } else {
        // 4xx Client Error - Not Retryable
        Logger.log(`❌ Wix Client Error: ${code} - ${JSON.stringify(result)}`);
        return { success: false, message: `Wix rejected request (${code}): ${result.message || 'Unknown error'}` };
      }
    } catch (e) {
      // Network/DNS Errors - Retryable
      Logger.log(`⚠️ Network Error (Attempt ${attempts}): ${e.message}`);
      lastError = e;
      Utilities.sleep(config.retryDelayMs * attempts);
    }
  }

  Logger.log('❌ Max retries reached for Wix Sync.');
  return { success: false, message: `Sync failed after ${attempts} attempts. ${lastError ? lastError.message : ''}` };
}

/**
 * Format date safely for Wix (ISO String)
 */
function formatDateForWix(dateInput) {
  if (!dateInput) return null;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * Parse numeric values safely (handles "$1,000.00" -> 1000)
 */
function parseNumeric(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
}

// =============================================================================
// TESTING
// =============================================================================

function testWixConnection() {
  const config = getWixPortalConfig();
  Logger.log('🧪 Testing Wix Connection...');
  Logger.log(`URL: ${config.baseUrl}/health`); // Assuming a health endpoint exists or 404 confirms reachability

  try {
    const response = UrlFetchApp.fetch(config.baseUrl.replace('/_functions', '') + '/_functions/health', {
      method: 'GET',
      muteHttpExceptions: true
    });
    Logger.log(`Response: ${response.getResponseCode()} - ${response.getContentText()}`);
  } catch (e) {
    Logger.log(`Connection Failed: ${e.message}`);
  }
}

/**
 * Server-side handler for 'batchSaveToWixPortal' action from Dashboard.html
   * Maps Dashboard payload format to Wix API format
   */
function batchSaveToWixPortal_Server(documents) {
  Logger.log(`📥 batchSaveToWixPortal_Server called with ${documents ? documents.length : 0} docs`);

  if (!documents || !Array.isArray(documents)) {
    return { success: false, error: 'Invalid documents payload' };
  }

  const config = getWixPortalConfig();
  if (!config.apiKey) return { success: false, error: 'Wix API key missing' };

  // Map Dashboard format to Wix API format
  const wixPayloadDocs = documents.map(doc => ({
    memberEmail: String(doc.signerEmail || '').trim(),
    memberPhone: String(doc.signerPhone || '').trim(),
    defendantName: String(doc.defendantName || '').trim(),
    caseNumber: String(doc.caseNumber || '').trim(),
    documentName: String(doc.documentName || 'Bail Bond Document').trim(),
    signingLink: String(doc.signingLink || '').trim(),
    signerRole: String(doc.signerRole || 'signer').toLowerCase(),
    signNowDocumentId: String(doc.documentId || doc.signNowDocumentId || '').trim(),
    expiresAt: doc.expiresAt // Should already be ISO string from Dashboard
  }));

  const payload = {
    apiKey: config.apiKey,
    documents: wixPayloadDocs
  };

  Logger.log(`🔄 Syncing ${wixPayloadDocs.length} documents to Wix...`);
  return sendToWixWithRetry(config.endpoints.addDocumentsBatch, payload);
}

/**
 * Fetch Indemnitor Profile from Wix by Email
 * Called from Dashboard.html via Code.js anchor
 */
function fetchIndemnitorProfile(email) {
  const config = getWixPortalConfig();
  if (!config.apiKey) return { success: false, message: 'Wix API key missing' };

  const url = config.baseUrl + '/getIndemnitorProfile?email=' + encodeURIComponent(email);
  const params = {
    method: 'GET',
    headers: { 'api-key': config.apiKey },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    const result = JSON.parse(response.getContentText());
    return result;
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Fetch Pending Intakes from Wix Queue
 */
function fetchPendingIntakes() {
  const config = getWixPortalConfig();
  if (!config.apiKey) return { success: false, message: 'Wix API key missing' };

  const url = config.baseUrl + '/getPendingIntakes';
  const params = {
    method: 'GET',
    headers: { 'api-key': config.apiKey },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    return JSON.parse(response.getContentText());
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Mark Intake as Processed
 */
function markIntakeAsProcessed(intakeId) {
  const config = getWixPortalConfig();
  if (!config.apiKey) return { success: false, message: 'Wix API key missing' };

  const url = config.baseUrl + '/markIntakeProcessed';
  const payload = {
    apiKey: config.apiKey,
    intakeId: intakeId
  };

  const params = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    return JSON.parse(response.getContentText());
  } catch (e) {
    return { success: false, message: e.message };
  }
}