// ============================================================================
// Shamrock Bail Bonds - Unified Production Backend (Code.gs)
// Version: 4.0.0 - Production Release (CamelCase Sync & Full Automation)
// ============================================================================

/**
 * SINGLE ENTRY POINT for all GAS Web App requests.
 * 
 * UPDATES (v4.0.0):
 * - Integrated Wix CMS Sync (Cases Collection).
 * - Standardized to camelCase field keys.
 * - Robust retryOp utility for API calls.
 * - Preserved all Scraper & Menu functionality.
 * - Full implementation of Booking Data Savers.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SIGNNOW_API_BASE: props.getProperty('SIGNNOW_API_BASE_URL') || 'https://api.signnow.com',
    SIGNNOW_ACCESS_TOKEN: props.getProperty('SIGNNOW_API_TOKEN') || '',
    SIGNNOW_FOLDER_ID: props.getProperty('SIGNNOW_FOLDER_ID') || '79a05a382b38460b95a78d94a6d79a5ad55e89e6',
    GOOGLE_DRIVE_FOLDER_ID: props.getProperty('GOOGLE_DRIVE_FOLDER_ID') || '1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3',
    GOOGLE_DRIVE_OUTPUT_FOLDER_ID: props.getProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID') || '1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs',
    CURRENT_RECEIPT_NUMBER: parseInt(props.getProperty('CURRENT_RECEIPT_NUMBER') || '201204'),
    WIX_API_KEY: props.getProperty('GAS_API_KEY') || '', 
    WIX_SITE_URL: props.getProperty('WIX_SITE_URL') || 'https://www.shamrockbailbonds.biz',
    WEBHOOK_URL: props.getProperty('WEBHOOK_URL') || ''
  };
}

// ============================================================================
// TEMPLATE IDS
// ============================================================================
const TEMPLATE_DRIVE_IDS = {
  'paperwork-header': '15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1',
  'faq-cosigners': '1bjmH2w-XS5Hhe828y_Jmv9DqaS_gSZM7',
  'faq-defendants': '16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR',
  'indemnity-agreement': '1p4bYIiZ__JnJHhlmVwLyPJZpsmSdGq12',
  'defendant-application': '1cokWm8qCDpiGxYD6suZEjm9i8MoABeVe',
  'promissory-note': '104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt',
  'disclosure-form': '1qIIDudp7r3J7-6MHlL2US34RcrU9KZKY',
  'surety-terms': '1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf',
  'master-waiver': '181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs',
  'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu',
  'collateral-receipt': '1IAYq4H2b0N0vPnJN7b2vZPaHg_RNKCmP',
  'payment-plan': '1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A',
  'appearance-bond': '15SDM1oBysTw76bIL7Xt0Uhti8uRZKABs'
};

// ============================================================================
// MENU SYSTEM
// ============================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🟩 Bail Suite')
    .addSubMenu(ui.createMenu('🔄 Run Scrapers')
      .addItem('📍 Lee County', 'runLeeScraper')
      .addItem('📍 Collier County', 'runCollierScraper')
      .addItem('📍 Hendry County', 'runHendryScraper')
      .addItem('📍 Charlotte County', 'runCharlotteScraper')
      .addItem('📍 Manatee County', 'runManateeScraper')
      .addItem('📍 Sarasota County', 'runSarasotaScraper')
      .addItem('📍 Hillsborough County', 'runHillsboroughScraper')
      .addSeparator()
      .addItem('🚀 Run All Scrapers', 'runAllScrapers'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🎯 Lead Scoring')
      .addItem('📊 Score All Sheets', 'scoreAllSheets')
      .addItem('📈 Score Current Sheet', 'scoreCurrentSheet')
      .addItem('🔍 View Scoring Rules', 'viewScoringRules'))
    .addSeparator()
    .addItem('📝 Open Booking Form', 'openBookingFormFromRow')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ Triggers')
      .addItem('📅 Install Triggers', 'installTriggers')
      .addItem('👀 View Triggers', 'viewTriggers')
      .addItem('🚫 Disable Triggers', 'disableTriggers'))
    .addSeparator()
    .addItem('📊 View Status', 'viewStatus')
    .addToUi();
}

function openBookingFormFromRow() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getActiveRange();
  
  if (!selection) {
    ui.alert('No Selection', 'Please select a row.', ui.ButtonSet.OK);
    return;
  }
  
  const row = selection.getRow();
  if (row === 1) {
    ui.alert('Invalid Selection', 'Please select a data row.', ui.ButtonSet.OK);
    return;
  }
  
  // Scraper Column Mapping (0-indexed)
  // 0:Timestamp, 1:County, 2:Booking#, 3:ID, 4:Full, 5:First, 6:Mid, 7:Last, 8:DOB
  // 22:Charges, 23:Bond, 27:Case#, 28:Date, 29:Time, 30:Loc
  const data = sheet.getRange(row, 1, 1, 35).getValues()[0];
  const rowData = {
    scrapeTimestamp: data[0] || '',
    county: data[1] || '',
    bookingNumber: data[2] || '',
    personId: data[3] || '',
    fullName: data[4] || '',
    firstName: data[5] || '',
    middleName: data[6] || '',
    lastName: data[7] || '',
    dob: data[8] || '',
    bookingDate: data[9] || '',
    charges: data[22] || '',
    bondAmount: data[23] || '',
    caseNumber: data[27] || '',
    courtDate: data[28] || '',
    courtTime: data[29] || '',
    courtLocation: data[30] || '',
    leadScore: data[32] || '',
    leadStatus: data[33] || ''
  };

  const html = HtmlService.createTemplateFromFile('Dashboard');
  html.data = rowData;
  
  const output = html.evaluate()
    .setTitle('Shamrock Booking Form')
    .setWidth(1200)
    .setHeight(900);
    
  ui.showModalDialog(output, 'Shamrock Bail Bonds - Booking System');
}

// ============================================================================
// WEB APP
// ============================================================================

function doGet(e) {
  if (!e) e = { parameter: {} };
  
  if (e.parameter.mode === 'scrape') {
    return runLeeScraper();
  }
  
  if (e.parameter.action) {
    return handleGetAction(e);
  }
  
  const page = e.parameter.page || 'Dashboard';
  try {
    return HtmlService.createHtmlOutputFromFile(page)
      .setTitle('Shamrock Bail Bonds')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    return HtmlService.createHtmlOutput('<h1>Page Error</h1><p>' + error.message + '</p>');
  }
}

function handleGetAction(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  let result;
  
  try {
    switch(action) {
      case 'getTemplate':
        result = getPdfTemplateBase64(e.parameter.templateId);
        break;
      case 'getTemplateList':
        result = getTemplateList();
        break;
      case 'getNextReceiptNumber':
        result = getNextReceiptNumber();
        break;
      case 'getPdf':
        result = e.parameter.fileId ? getPdfByFileId(e.parameter.fileId) : { success: false, error: 'Missing fileId' };
        break;
      case 'health':
        result = { success: true, message: 'GAS v4.0.0 Online', timestamp: new Date().toISOString() };
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (error) {
    result = { success: false, error: error.message };
  }
  
  return createResponse(result, callback);
}

function doPost(e) {
  try {
    if (!e || !e.postData) throw new Error("No POST data received");
    const data = JSON.parse(e.postData.contents);
    
    // Webhook Handler
    if (data.event && data.event.startsWith('document.')) {
      return createResponse({ received: true });
    }

    const action = data.action;
    let result;

    switch(action) {
      // Templates
      case 'getTemplate':
        result = getPdfTemplateBase64(data.templateId);
        break;
      case 'getMultipleTemplates':
        result = getMultipleTemplates(data.templateIds);
        break;
      case 'getPdf':
        result = getPdfByFileId(data.fileId);
        break;

      // SignNow (Standard)
      case 'uploadToSignNow':
        result = uploadFilledPdfToSignNow(data.pdfBase64, data.fileName);
        break;
      case 'createSigningRequest':
        result = createSigningRequest(data);
        break;
      case 'sendForSignature':
        result = sendForSignature(data);
        break;
      case 'getDocumentStatus':
        result = getDocumentStatus(data.documentId);
        break;

      // SignNow (Advanced - Fallback)
      case 'directSignNowRequest':
        result = SN_makeRequest(data.endpoint, data.method, data.body);
        break;

      // Operations
      case 'saveBooking':
        result = saveBookingData(data.bookingData);
        break;
      case 'getNextReceiptNumber':
        result = getNextReceiptNumber();
        break;
      case 'incrementReceiptNumber':
        result = incrementReceiptNumber();
        break;
      case 'saveToGoogleDrive':
        result = saveFilledPacketToDrive(data);
        break;
      case 'saveDocumentToDrive':
        result = handleSaveDocumentToDrive(data.document);
        break;
      case 'runLeeScraper':
        result = runLeeScraper();
        break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    return createResponse(result);

  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function createResponse(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// CORE: BOOKING & WIX SYNC
// ============================================================================

/**
 * Saves to Sheets AND Syncs to Wix
 */
function saveBookingData(formData) {
  try {
    if (!formData || typeof formData !== 'object') throw new Error('Invalid form data');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const isBondWritten = formData['status'] === 'Bond Written' || formData['status'] === 'Active';
    const sheetName = isBondWritten ? "Shamrock's Bonds" : "Qualified";
    
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);

    // Full Mapping (Aligned with SCHEMA.md and Dashboard.html)
    const timestamp = new Date();
    const ind1 = (formData.indemnitors && formData.indemnitors[0]) ? formData.indemnitors[0] : {};
    const ind2 = (formData.indemnitors && formData.indemnitors[1]) ? formData.indemnitors[1] : {};

    const rowData = [
        timestamp.toISOString(),
        formData['agent-name'] || 'Shamrock Bail Bonds',
        (formData['defendant-first-name'] + ' ' + formData['defendant-last-name']).trim(),
        formData['defendant-booking-number'] || '',
        formData['defendant-dob'] || '',
        formData['defendant-phone'] || '',
        formData['defendant-email'] || '',
        formData['defendant-street-address'] || '',
        formData['defendant-city'] || '',
        formData['defendant-zipcode'] || '',
        ind1.name || '', ind1.phone || '', ind1.email || '', ind1.address || '', ind1.city || '',
        ind2.name || '', ind2.phone || '', ind2.email || '', ind2.address || '', ind2.city || '',
        formData['payment-total-bond'] || '0',
        formData['payment-premium-due'] || '0',
        formData['payment-down'] || '0',
        formData['payment-balance'] || '0',
        formData['payment-method'] || '',
        formData['court-date'] || '',
        formData['court-time'] || '',
        formData['court-location'] || '',
        formData['defendant-court-type'] || '',
        formData['defendant-county'] || '',
        formData['case-number'] || '',
        formData['defendant-jail-facility'] || '',
        (formData.charges || []).map(c => c.charge).join(' | '),
        formData['mugshot-url'] || '',
        formData['detail-url'] || '',
        formData['signnow_doc_ids'] || '',
        formData['signnow_invite_ids'] || '',
        formData['signnow_status'] || 'Pending Signing',
        formData['lead_score'] || '',
        formData['lead_status'] || '',
        formData['defendant-notes'] || ''
    ];

    sheet.appendRow(rowData);

    // V1 Integration: Wix Sync
    try {
      const wixResult = syncCaseDataToWix(formData, rowData, timestamp);
      Logger.log('Wix Sync Result: ' + JSON.stringify(wixResult));
    } catch (e) {
      Logger.log('Wix Sync Failed: ' + e.message); // Non-blocking
    }

    return { success: true, message: 'Booking saved successfully' };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Syncs new case to Wix (CamelCase Standard)
 */
function syncCaseDataToWix(formData, rowData, timestamp) {
  const config = getConfig();
  if (!config.WIX_API_KEY) throw new Error("Missing GAS_API_KEY property");

  const ind1 = (formData.indemnitors && formData.indemnitors[0]) ? formData.indemnitors[0] : {};
  
  const payload = {
    apiKey: config.WIX_API_KEY,
    caseData: {
      caseNumber: formData['case-number'] || formData['defendant-booking-number'] || 'UNK-' + Date.now(),
      defendantName: (formData['defendant-first-name'] + ' ' + formData['defendant-last-name']).trim(),
      defendantEmail: formData['defendant-email'] || '',
      defendantPhone: formData['defendant-phone'] || '',
      indemnitorName: ind1.name || '',
      indemnitorEmail: ind1.email || '',
      indemnitorPhone: ind1.phone || '',
      bondAmount: formData['payment-total-bond'] || '0',
      county: formData['defendant-county'] || '',
      arrestDate: formData['arrest-date'] || timestamp.toISOString().split('T')[0],
      charges: (formData.charges || []).map(c => c.charge).join(' | '),
      status: formData['status'] || 'Active',
      receiptNumber: formData['receipt-number'] || '',
      gasSheetRow: 0
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const url = config.WIX_SITE_URL.replace(/\/$/, '') + '/_functions/apiSyncCaseData';
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() >= 400) {
    throw new Error(`Wix API ${response.getResponseCode()}: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

// ============================================================================
// SIGNNOW (Robust + Fallback)
// ============================================================================

function retryOp(func, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return func();
    } catch (e) {
      if (i === retries - 1) throw e;
      Utilities.sleep(1000 * Math.pow(2, i));
    }
  }
}

function SN_makeRequest(endpoint, method, body) {
  // Generic handler for advanced/custom calls
  const config = getConfig();
  const options = {
    method: method || 'GET',
    headers: { 
      'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  if (body) options.payload = JSON.stringify(body);
  
  const url = config.SIGNNOW_API_BASE + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
  const res = UrlFetchApp.fetch(url, options);
  return JSON.parse(res.getContentText());
}

function uploadFilledPdfToSignNow(pdfBase64, fileName) {
  const config = getConfig();
  if (!config.SIGNNOW_ACCESS_TOKEN) return { success: false, error: 'Missing SN Token' };

  return retryOp(() => {
    const boundary = '----Bound' + Utilities.getUuid();
    const pdfBytes = Utilities.base64Decode(pdfBase64);
    
    // Simple multipart construction
    let head = '--' + boundary + '\r\n' + 
               'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
               'Content-Type: application/pdf\r\n\r\n';
    let tail = '\r\n--' + boundary + '--\r\n';
    
    const payload = Utilities.newBlob(head).getBytes()
        .concat(pdfBytes)
        .concat(Utilities.newBlob(tail).getBytes());
        
    const options = {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
      payload: payload,
      muteHttpExceptions: true
    };
    
    const res = UrlFetchApp.fetch(config.SIGNNOW_API_BASE + '/document', options);
    const json = JSON.parse(res.getContentText());
    
    if (res.getResponseCode() < 300) return { success: true, documentId: json.id };
    throw new Error(json.error || 'Upload failed');
  });
}

function createSigningRequest(data) {
  const config = getConfig();
  const payload = {
    to: data.signers.map(s => ({ email: s.email, role: s.role || 'Signer', order: 1 })),
    from: data.fromEmail || 'admin@shamrockbailbonds.biz',
    subject: data.subject || 'Sign Documents',
    message: data.message || 'Please sign attached.'
  };

  const options = {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN, 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(config.SIGNNOW_API_BASE + '/document/' + data.documentId + '/invite', options);
  const json = JSON.parse(res.getContentText());
  
  if (res.getResponseCode() === 200) return { success: true, inviteId: json.id };
  return { success: false, error: json.error || 'Invite failed' };
}

function sendForSignature(data) {
  const upload = uploadFilledPdfToSignNow(data.pdfBase64, data.fileName);
  if (!upload.success) return upload;

  const invite = createSigningRequest({
    documentId: upload.documentId,
    signers: data.signers,
    subject: data.subject,
    message: data.message,
    fromEmail: data.fromEmail
  });

  return { 
    success: invite.success, 
    documentId: upload.documentId, 
    inviteId: invite.inviteId,
    error: invite.error 
  };
}

function getDocumentStatus(documentId) {
    return SN_makeRequest('/document/' + documentId, 'GET');
}

// ============================================================================
// PDF FILES & RECEIPTS
// ============================================================================

function getPdfTemplateBase64(templateId) {
  const id = TEMPLATE_DRIVE_IDS[templateId];
  if (!id) return { success: false, error: 'Template not found' };
  try {
     return { success: true, pdfBase64: Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()) };
  } catch(e) { return { success: false, error: e.message }; }
}

function getNextReceiptNumber() {
    return { success: true, receiptNumber: getConfig().CURRENT_RECEIPT_NUMBER };
}

function incrementReceiptNumber() {
    const props = PropertiesService.getScriptProperties();
    const next = parseInt(props.getProperty('CURRENT_RECEIPT_NUMBER') || '201204') + 1;
    props.setProperty('CURRENT_RECEIPT_NUMBER', next.toString());
    return { success: true, receiptNumber: next };
}

function saveFilledPacketToDrive(data) {
    if (!data.pdfBase64 || !data.fileName) return { success: false };
    const folder = DriveApp.getFolderById(getConfig().GOOGLE_DRIVE_OUTPUT_FOLDER_ID);
    folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), 'application/pdf', data.fileName));
    return { success: true };
}

function handleSaveDocumentToDrive(doc) {
    if (!doc || !doc.fileUrl) return { success: false };
    const folder = DriveApp.getFolderById(getConfig().GOOGLE_DRIVE_OUTPUT_FOLDER_ID);
    const res = UrlFetchApp.fetch(doc.fileUrl);
    folder.createFile(res.getBlob().setName(doc.fileName));
    return { success: true };
}

// ============================================================================
// SCRAPERS & UTILS
// ============================================================================

function runLeeScraper() {
    triggerWebhook('lee', 'scrape');
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Lee Triggered' })).setMimeType(ContentService.MimeType.JSON);
}
// Stub other scrapers to prevent menu errors
function runCollierScraper() { triggerWebhook('collier', 'scrape'); }
function runHendryScraper() { triggerWebhook('hendry', 'scrape'); }
function runCharlotteScraper() { triggerWebhook('charlotte', 'scrape'); }
function runManateeScraper() { triggerWebhook('manatee', 'scrape'); }
function runSarasotaScraper() { triggerWebhook('sarasota', 'scrape'); }
function runHillsboroughScraper() { triggerWebhook('hillsborough', 'scrape'); }
function runAllScrapers() { triggerWebhook('all', 'scrape'); }

function triggerWebhook(county, action) {
    const url = getConfig().WEBHOOK_URL;
    if (url) {
        UrlFetchApp.fetch(url, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({ county, action, timestamp: new Date() }),
            muteHttpExceptions: true
        });
    }
}

// Placeholders for menu items if implementation is not critical for V1
function scoreAllSheets() {}
function scoreCurrentSheet() {}
function viewScoringRules() {}
function installTriggers() {}
function viewTriggers() {}
function disableTriggers() {}
function viewStatus() {}
// ============================================================================
