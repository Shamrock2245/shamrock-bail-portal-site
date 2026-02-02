// ============================================================================
// Shamrock Bail Bonds - Unified Production Backend (Code.gs)
// Version: 6.3 - AI Agent Suite (Updated 2026-02-02)
// ============================================================================
/**
 * SINGLE ENTRY POINT for all GAS Web App requests.
 * 
 * V5.4.0 SUMMARY:
 * This backend orchestrates the entire Shamrock Portal workflow:
 * 1. INTAKE & BOOKING: Receives form data from Wix, generates receipts, and stores in 'Bookings' Sheet.
 * 2. SIGNNOW INTEGRATION: Handles document generation (Templates), PDF uploads, and embedded signing links.
 * 3. TWILIO SMS: Sends signing links and notifications via text message.
 * 4. MAGIC LINKS: Manages secure access links for Defendants/Indemnitors.
 * 5. COMPLIANCE: Validates SOC2 webhooks and logs all access/processing events.
 * 6. SECURITY: API Key enforcement and Viewer Allowlists.
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
    WEBHOOK_URL: props.getProperty('WEBHOOK_URL') || '',
    PAYMENT_LINK: 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd'
  };
  return _CONFIG_CACHE;
}
// ============================================================================
// WEB APP HANDLERS
// ============================================================================
// ============================================================================
// TEMPLATE CONFIGURATION
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

function getPDFTemplates(data) {
  if (!data || !data.templateIds || !Array.isArray(data.templateIds)) {
    return { success: false, error: 'Invalid templateIds' };
  }
  const result = { success: true, templates: {} };
  data.templateIds.forEach(key => {
    const driveId = TEMPLATE_DRIVE_IDS[key];
    if (driveId) {
      try {
        const blob = DriveApp.getFileById(driveId).getBlob();
        result.templates[key] = {
          success: true,
          pdfBase64: Utilities.base64Encode(blob.getBytes())
        };
      } catch (e) {
        result.templates[key] = { success: false, error: e.message };
      }
    } else {
      result.templates[key] = { success: false, error: 'Template key not found: ' + key };
    }
  });
  return result;
}

const ERROR_CODES = {
  // Standard System Codes
  INVALID_JSON: 'INVALID_JSON',
  MISSING_ACTION: 'MISSING_ACTION',
  UNKNOWN_ACTION: 'UNKNOWN_ACTION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Service Specific Codes (From Agentic Skill)
  AUTH_FAIL: 'AUTH_FAIL',
  VALIDATION_FAIL: 'VALIDATION_FAIL',
  SIGNNOW_API_FAIL: 'SIGNNOW_API_FAIL',
  SHEET_ACCESS_FAIL: 'SHEET_ACCESS_FAIL',
  TWILIO_API_FAIL: 'TWILIO_API_FAIL'
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
    // --- VIEWER ALLOWLIST (Security Hardening) ---
    const userEmail = Session.getActiveUser().getEmail();
    const allowed = isUserAllowed(userEmail);
    if (!allowed) {
      return HtmlService.createHtmlOutput('<h1>Access Denied</h1><p>You are not authorized to view this dashboard.</p>');
    }
    // ---------------------------------------------

    const VERSION = '6.0';

    // --- SLACK ALERT ---
    if (e.parameter.action === 'sendSlackAlert') {
      const result = sendSlackMessage(e.parameter.channel || '#alerts', e.parameter.text, e.parameter.blocks);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- AUTOMATIC DEVICE DETECTION ---
    // Get user agent from request headers (if available)
    let userAgent = '';
    try {
      // In GAS, user agent is not directly available in doGet()
      // We'll use the page parameter with fallback to auto-detection via client-side
      userAgent = e.parameter.userAgent || '';
    } catch (err) {
      userAgent = '';
    }

    // Determine page based on explicit parameter OR auto-detection
    let page = e.parameter.page || 'Dashboard';

    // Auto-detect device type if no explicit page parameter
    if (!e.parameter.page) {
      // Check for mobile/tablet indicators in userAgent (if provided)
      const ua = userAgent.toLowerCase();

      // Mobile detection (phones)
      if (ua.includes('iphone') || ua.includes('android') && ua.includes('mobile')) {
        page = 'mobile';
      }
      // Tablet detection (iPads, Android tablets)
      else if (ua.includes('ipad') || ua.includes('tablet') ||
        (ua.includes('android') && !ua.includes('mobile'))) {
        page = 'tablet';
      }
      // Desktop (default)
      else {
        page = 'Dashboard';
      }
    }
    // -----------------------------------

    // --- Mobile & Tablet Routing ---
    if (page === 'mobile') {
      return HtmlService.createTemplateFromFile('MobileDashboard')
        .evaluate()
        .setTitle('Shamrock Mobile Dashboard')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    if (page === 'tablet') {
      return HtmlService.createTemplateFromFile('TabletDashboard')
        .evaluate()
        .setTitle('Shamrock Tablet Dashboard')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    // ---------------------------------------------------

    // ALWAYS use template to support Dynamic URL Injection
    const template = HtmlService.createTemplateFromFile(page);

    // 1. Inject Dynamic App URL (Self-Discovery)
    try {
      template.gasUrl = ScriptApp.getService().getUrl();
    } catch (err) {
      console.warn('Failed to get service URL:', err);
      template.gasUrl = ''; // Frontend will use fallback
    }

    // 2. Inject Prefill Data (if requested)
    if (e.parameter.prefill === 'true') {
      let prefillData = null;
      try {
        if (typeof getPrefillData === 'function') {
          prefillData = getPrefillData();
        }
      } catch (err) {
        console.warn('Failed to retrieve prefill data:', err);
      }
      template.data = prefillData;
    } else {
      template.data = null;
    }

    return template.evaluate()
      .setTitle('Shamrock Bail Bonds')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  } catch (error) {
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

    // --- API KEY VERIFICATION (Security Hardening) ---
    const config = getConfig();
    // Allow if it matches the configured Wix API Key
    // OR if we are in a dev/test mode (verify via Property)? No, enforcing strict now.
    if (data.apiKey !== config.WIX_API_KEY) {
      if (typeof logSecurityEvent === 'function') logSecurityEvent('UNAUTHORIZED_API_ACCESS', { error: 'Invalid API Key' });
      return createErrorResponse('Unauthorized: Invalid API Key', ERROR_CODES.UNAUTHORIZED);
    }
    // -------------------------------------------------

    // Delegate to shared handler
    const result = handleAction(data);
    return createResponse(result); // Result typically has success: true/false
  } catch (error) {
    if (typeof logSecurityEvent === 'function') logSecurityEvent('DOPOST_FAILURE', { error: error.toString() });
    return createErrorResponse(error.toString(), ERROR_CODES.INTERNAL_ERROR, error.stack);
  }
}

/**
 * CLIENT BRIDGE for google.script.run
 */
function doPostFromClient(data) {
  if (data.action === 'sendToWixPortal') {
    return client_sendToWixPortal(data);
  }
  if (data.action === 'batchSaveToWixPortal') {
    return client_batchSaveToWixPortal(data);
  }
  return handleAction(data);
}

/**
 * CLIENT WRAPPERS (for google.script.run)
 * Direct calls from Dashboard.html
 */
function client_parseBooking(base64String) {
  // "The Clerk"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized Access" };

  return AI_parseBookingSheet(base64String);
}

function client_analyzeLead(leadJsonString) {
  // "The Analyst"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized Access" };

  try {
    const lead = JSON.parse(leadJsonString);
    return AI_analyzeFlightRisk(lead);
  } catch (e) {
    return { error: "Invalid JSON format for Lead" };
  }
}

function client_checkSentiment(notes) {
  // "The Monitor"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized Access" };

  return AI_analyzeCheckIn({ notes: notes, memberId: 'manual-test' });
}

function client_runInvestigator(payload) {
  // "The Investigator"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized Access" };

  // Delegates to the new module
  return AI_deepAnalyzeReports(payload);
}

function client_getCountyStats(countyName) {
  // "The Dashboard"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized Access" };

  return getCountyStats(countyName);
}


function client_getSystemStatus() {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized Access" };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logs = [];

  ['Lee', 'Collier'].forEach(c => {
    const sh = ss.getSheetByName(c);
    if (sh && sh.getLastRow() > 1) {
      const lastDate = sh.getRange(sh.getLastRow(), 1).getValue(); // Col 1 is Timestamp
      let timeStr = 'Unknown';
      if (lastDate instanceof Date) {
        timeStr = Utilities.formatDate(lastDate, 'America/New_York', 'h:mm a');
      }
      logs.push(`${c}: Scraped ${timeStr}`);
    } else {
      logs.push(`${c}: No Data`);
    }
  });

  return {
    status: 'active',
    logs: logs
  };
}

/**
 * Retrieves pending intakes from the IntakeQueue sheet
 * Used by Dashboard.html to populate the intake queue
 */
function getPendingIntakes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('IntakeQueue');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const pending = [];

  // Indices
  const idxStatus = headers.indexOf('Status');
  const idxId = headers.indexOf('IntakeID');

  if (idxStatus === -1) return [];

  // Iterate rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idxStatus] === 'pending') {
      // Map row to object based on headers
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      // Parse JSON fields if necessary
      try {
        if (item.EmployerInfo && typeof item.EmployerInfo === 'string') {
          item.EmployerInfo = JSON.parse(item.EmployerInfo);
        }
        if (item.References && typeof item.References === 'string') {
          item.References = JSON.parse(item.References);
        }
      } catch (e) {
        console.warn('Failed to parse JSON for intake ' + item.IntakeID);
      }

      pending.push(item);
    }
  }

  return pending.reverse(); // Newest first
}



function runCollierArrestsNow() {
  // Wrapper for the new Collier Scraper module
  if (typeof ArrestScraper_CollierCounty !== 'undefined' && ArrestScraper_CollierCounty.runCollierArrestsNow) {
    return ArrestScraper_CollierCounty.runCollierArrestsNow();
  } else {
    // If mapped globally by the GAS runtime
    return runCollierArrestsNow();
  }
}

/**
 * CENTRAL ACTION DISPATCHER
 */
function handleAction(data) {
  const action = data.action;

  // 1. INTAKE & QUEUE
  if (action === 'intakeSubmission') return handleIntakeSubmission(data);
  if (action === 'newIntake') return handleNewIntake(data.caseId, data.data);
  if (action === 'fetchPendingIntakes') return getWixIntakeQueue(); // Updated to new robust function
  if (action === 'markIntakeProcessed') return markWixIntakeAsSynced(data.intakeId); // Updated to new robust function

  // 1.5. NOTIFICATIONS
  if (action === 'sendEmail') return handleSendEmail(data);
  if (action === 'sendSlackAlert') return sendSlackMessage(data.channel, data.text, data.blocks);
  if (action === 'testEmailAdmin') return sendDashboardLinkEmail();

  // 1.6. BAIL SCHOOL
  if (action === 'generateCertificate') return handleCertificateGeneration(data);

  // 1.7 SYSTEM
  if (action === 'getSystemStatus') return client_getSystemStatus();

  // New action to handle PDF template requests
  if (action === 'getPDFTemplates') return getPDFTemplates(data);

  // --- Granular SignNow Actions (Supported by Dashboard.html) ---
  if (action === 'uploadToSignNow') return SN_uploadDocument(data.pdfBase64, data.fileName);
  if (action === 'addSignatureFields') return SN_addFields(data.documentId, data.fields);
  if (action === 'sendEmailInvite') return SN_sendEmailInvite(data.documentId, data.signers, data.options);
  if (action === 'sendSmsInvite') return SN_sendSmsInvite(data.documentId, data.signers, data.options);
  if (action === 'createEmbeddedLink') return SN_createEmbeddedLink(data.documentId, data.email, data.role);
  if (action === 'batchSaveToWixPortal') return batchSaveToWixPortal(data);

  // 2. SIGNING & DOCS
  if (action === 'sendForSignature') return handleSendForSignature(data);
  if (action === 'createPortalSigningSession') return createPortalSigningSession(data);
  if (action === 'getPDFTemplates') return getPDFTemplates(data);

  // 4. CHECK-INS
  // 4. CHECK-INS
  if (action === 'logDefendantLocation') return handleLocationLog(data.data);

  // 5. AI AGENTS (Public API)
  if (action === 'parseBookingSheet') return AI_parseBookingSheet(data.fileData);
  if (action === 'testAIAnalyst') return AI_analyzeFlightRisk(data.lead);
  if (action === 'testAIMonitor') return AI_analyzeCheckIn(data.checkIn);

  // 3. PROFILES (Stub/Future)
  if (action === 'fetchIndemnitorProfile') {
    return { success: false, error: 'Profile lookup not yet implemented' };
  }

  // 4. UTILS
  if (action === 'getNextReceiptNumber') return getNextReceiptNumber();
  if (action === 'health') return { success: true, version: '5.9', timestamp: new Date().toISOString() };

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', 'shamrock-secure-2026');
    return { success: true, message: 'API Key reset to: shamrock-secure-2026' };
  }
  // ------------------------------

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', 'shamrock-secure-2026');
    return { success: true, message: 'API Key reset to: shamrock-secure-2026' };
  }
  // ------------------------------

  return { success: false, error: 'Unknown Action: ' + action };
}

function handleGetAction(e) {
  // Limited GET actions for security
  const action = e.parameter.action;
  const callback = e.parameter.callback;

  if (action === 'health') return createResponse({ success: true, version: '5.9', timestamp: new Date().toISOString() }, callback);
  if (action === 'getNextReceiptNumber') return createResponse(getNextReceiptNumber(), callback);

  return createErrorResponse('Unknown action', ERROR_CODES.UNKNOWN_ACTION);
}

function createResponse(data, callback) {
  const json = JSON.stringify(data);
  const output = ContentService.createTextOutput(callback ? callback + '(' + json + ')' : json);
  output.setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  return output;
}

function createErrorResponse(message, code = 'INTERNAL_ERROR', details = null, userMessage = null, retryable = false) {
  return createResponse({
    success: false,
    error: {
      code: code,
      message: message,
      userMessage: userMessage || "An unexpected error occurred. Please try again or contact support.",
      details: details,
      retryable: retryable
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
      "Body": body,
      "StatusCallback": "https://www.shamrockbailbonds.biz/_functions/twilioStatus"
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

/**
 * Sends a message to Slack via Webhook
 * @param {string} channel - Channel/User to send to (optional override if webhook supports it)
 * @param {string} text - Fallback text
 * @param {Array} blocks - Block Kit blocks
 */
/**
 * Sends a message to Slack via Bot API or Webhook
 * @param {string} channel - Channel ID (C12345) or Name (#general)
 * @param {string} text - Fallback text
 * @param {Array} blocks - Block Kit blocks
 */
function sendSlackMessage(channel, text, blocks) {
  const config = getConfig();
  const botToken = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
  const webhookUrl = config.WEBHOOK_URL;

  // MODE 1: BOT API (Preferred)
  if (botToken && botToken.startsWith('xoxb-')) {
    const apiEndpoint = 'https://slack.com/api/chat.postMessage';

    // Default to #general if no channel provided
    const targetChannel = channel || '#general';

    const payload = {
      channel: targetChannel,
      text: text,
      blocks: blocks
      // icon_emoji and username are controlled by App Configuration in Slack
    };

    try {
      const response = UrlFetchApp.fetch(apiEndpoint, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + botToken
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const result = JSON.parse(response.getContentText());
      if (result.ok) {
        return { success: true, ts: result.ts };
      } else {
        console.error('Slack Bot API Error:', result.error);
        return { success: false, error: 'Bot API Failed: ' + result.error };
      }
    } catch (e) {
      console.error('Slack Bot Exception:', e);
      return { success: false, error: e.message };
    }
  }

  // MODE 2: WEBHOOK (Legacy)
  if (!webhookUrl) {
    console.warn('Slack Config Missing: No Bot Token and No Webhook');
    return { success: false, error: 'Slack not configured' };
  }

  // Create Payload for Webhook
  const payload = {
    text: text,
    username: 'Shamrock Portal',
    icon_emoji: ':shamrock:'
  };

  if (channel) payload.channel = channel;
  if (blocks) payload.blocks = blocks;

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      console.error('Slack Webhook Error:', response.getContentText());
      return { success: false, error: response.getContentText() };
    }

    return { success: true };

  } catch (e) {
    console.error('Slack Send Exception:', e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// SUB: BAIL SCHOOL CERTIFICATES
// ============================================================================
function handleCertificateGeneration(data) {
  // data: { courseId, studentName, completionDate, studentId }
  const studentEmail = data.studentEmail; // Ensure this is passed from frontend!

  console.log(`🎓 Generating Certificate for ${data.studentName}`);

  // 1. Get Template ID
  const props = PropertiesService.getScriptProperties();
  const templateId = props.getProperty('CERTIFICATE_TEMPLATE_ID'); // Ensure this property is set in GAS
  if (!templateId) {
    console.warn('Certificate Generation Skipped: No Template ID');
    // Still send email but warn admin
    if (studentEmail) {
      MailApp.sendEmail({
        to: studentEmail,
        subject: `Course Completion: ${data.courseId}`,
        htmlBody: `<h1>Congratulations, ${data.studentName}!</h1><p>You have completed <strong>${data.courseId}</strong>.</p><p>Contact admin for your certificate.</p>`
      });
    }
    return { success: true, message: "Course recorded, certificate pending config." };
  }

  try {
    // 2. Clone Template
    const templateFile = DriveApp.getFileById(templateId);
    const folderId = getConfig().GOOGLE_DRIVE_OUTPUT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);

    const copy = templateFile.makeCopy(`Certificate - ${data.studentName} - ${data.courseId}`, folder);
    const doc = DocumentApp.openById(copy.getId());
    const body = doc.getBody();

    // 3. Replace Placeholders
    body.replaceText('{{StudentName}}', data.studentName || 'Student');
    body.replaceText('{{CourseName}}', data.courseId || 'Bail Agent Course');
    body.replaceText('{{Date}}', new Date().toLocaleDateString());

    doc.saveAndClose();

    // 4. Export PDF
    const pdfBlob = copy.getAs('application/pdf');

    // 5. Send Email with Attachment
    if (studentEmail) {
      MailApp.sendEmail({
        to: studentEmail,
        subject: `Certificate of Completion: ${data.courseId}`,
        htmlBody: `
                <h1>Congratulations!</h1>
                <p>Attached is your official certificate for <strong>${data.courseId}</strong>.</p>
                <br><p>Shamrock Bail School</p>
            `,
        attachments: [pdfBlob]
      });
    }

    // Cleanup temp doc (optional, keeps Drive clean)
    copy.setTrashed(true);

    return { success: true, message: "Certificate Generated and Emailed" };

  } catch (e) {
    console.error("Certificate Error: " + e.message);
    return { success: false, error: "Failed to generate certificate: " + e.message };
  }

  return { success: true, message: "Certificate Request Processed", status: "queued" };
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

    // --- NEW: Generate URL for Download (Unsigned Packet) ---
    if (data.method === 'download_url') {
      // We need to return a download URL for the document we just filled
      // SignNow API: Get Download Link or manual download
      // Since 'downloadSignedPdf' exists, we can reuse it to get blob, then what?
      // We can't return a blob to Wix easily. 
      // Better: Generate a specialized "Singing Link" for "Self" or just "Download Link"
      // Actually, SignNow has a "Download Document" endpoint. 
      // But we need a public URL? No, we return Base64 to frontend, frontend handles download?
      // Or upload to Wix Media? 
      // Simplest: Return Base64 of the filled PDF.

      const pdfBlob = downloadSignedPdf(documentId); // It's not signed yet, but it's filled. API allows download of draft? Yes.
      if (pdfBlob) {
        return {
          success: true,
          method: 'download_url',
          fileData: Utilities.base64Encode(pdfBlob.getBytes()),
          fileName: `${docName}.pdf`
        };
      } else {
        return { success: false, error: "Failed to download generated PDF from SignNow" };
      }
    }
    // --------------------------------------------------------

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
 * Handles 'newIntake' action from Wix
 * Preserves the Wix-generated Case ID for 2-way sync
 */
function handleNewIntake(caseId, data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('IntakeQueue');

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
    // CRITICAL: Use the passed caseId as the IntakeID (Col 1)
    // This allows approveIntake() to send this ID back to Wix
    const intakeId = caseId || ('INT-' + timestamp.getTime());

    // Construct References
    var references = data.references || [];
    if (references.length === 0) {
      if (data.reference1Name) {
        references.push({
          name: data.reference1Name,
          phone: data.reference1Phone,
          relation: data.reference1Relation || 'Ref 1',
          address: (data.reference1Address || '')
        });
      }
    }

    const row = [
      timestamp,
      intakeId, // <--- SYNC KEY
      data.role || 'indemnitor',
      data.indemnitorEmail || data.email || '',
      data.indemnitorPhone || data.phone || '',
      data.indemnitorFullName || data.fullName || '',
      data.defendantFullName || data.defendantName || '',
      data.defendantPhone || '',
      data.caseNumber || '',
      'pending',
      JSON.stringify(references),
      JSON.stringify({
        employer: data.indemnitorEmployerName,
        employerPhone: data.indemnitorEmployerPhone
      }),
      data.residenceType || '',
      ''
    ];

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();
    console.log(`✅ New Intake Synced: ${intakeId}`);

    // --- CRITICAL FIX: TRIGGER DOCUMENT GENERATION ---
    // The intake is saved, now we MUST trigger the SignNow flow
    let docResult = { success: false, message: 'Doc gen skipped' };

    try {
      // Merge caseId into data for the generator
      const docData = {
        ...data,
        caseNumber: data.caseNumber || intakeId, // Fallback if no case number yet
        caseId: intakeId,
        // Ensure required fields for generator are present or mapped
        'defendant-first-name': data.defendantFirstName || data.defendantName.split(' ')[0],
        'defendant-last-name': data.defendantLastName || data.defendantName.split(' ').slice(1).join(' '),
        signingMethod: data.signingMethod || 'email', // Default to email invites
        selectedDocs: data.selectedDocs || ['bail_application', 'indemnity_agreement'] // Default package
      };

      console.log(`🚀 Triggering Auto-Docs for ${intakeId}`);
      docResult = generateAndSendWithWixPortal_Safe(docData);
      console.log(`📄 Auto-Docs Result: ${docResult.success ? 'SUCCESS' : 'FAILED'} - ${docResult.message}`);

    } catch (docErr) {
      console.error(`❌ Auto-Docs Failed completely: ${docErr.message}`);
      docResult = { success: false, error: docErr.message };
    }
    // -----------------------------------------------

    return {
      success: true,
      message: 'Intake linked & Docs triggering...',
      intakeId: intakeId,
      row: lastRow,
      docGen: docResult
    };

  } catch (e) {
    console.error('handleNewIntake failed: ' + e.message);
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

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

    // Construct References Array (Handle both array and flat fields)
    var references = data.references;
    if (!references || !Array.isArray(references) || references.length === 0) {
      references = [];
      // Attempt to build from flat fields (reference1Name, etc.)
      if (data.reference1Name) {
        references.push({
          name: data.reference1Name,
          phone: data.reference1Phone,
          relation: data.reference1Relation || 'Reference 1',
          address: (data.reference1Address || '') + ' ' + (data.reference1City || '') + ' ' + (data.reference1State || '')
        });
      }
      if (data.reference2Name) {
        references.push({
          name: data.reference2Name,
          phone: data.reference2Phone,
          relation: data.reference2Relation || 'Reference 2',
          address: (data.reference2Address || '') + ' ' + (data.reference2City || '') + ' ' + (data.reference2State || '')
        });
      }
    }

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
      JSON.stringify(references),
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

        // Map to Dashboard Expectations (Schema Normalization)
        intake.submittedAt = intake.Timestamp;
        intake.defendantName = intake.DefendantName;
        intake.name = intake.FullName;
        intake.phone = intake.Phone;
        intake.relationship = intake.Role;
        intake.email = intake.Email;
        intake._id = intake.IntakeID;

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

/**
 * Checks if a user is allowed to access the Dashboard
 * @param {string} email - The email address of the user
 * @returns {boolean} - True if allowed
 */
function isUserAllowed(email) {
  if (!email) return false;

  // 1. Allow Admin/Owner
  const ALLOWED_USERS = [
    'brendan@shamrockbailbonds.biz',
    'admin@shamrockbailbonds.biz',
    'info@shamrockbailbonds.biz',
    'shamrockbailoffice@gmail.com'
  ];

  if (ALLOWED_USERS.includes(email.toLowerCase())) return true;

  // 2. Allow Domain (Staff)
  if (email.endsWith('@shamrockbailbonds.biz')) return true;

  // 3. Fallback: Log unauthorized attempt
  console.warn(`Unauthorized dashboard access attempt: ${email}`);
  return false;
}

/**
 * HANDLER: Send Email
 * Allows Wix to trigger emails via GAS (e.g. Magic Links)
 */
function handleSendEmail(data) {
  if (!data.to || !data.subject || !data.htmlBody) {
    return { success: false, error: 'Missing email fields (to, subject, htmlBody)' };
  }

  try {
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      htmlBody: data.htmlBody,
      // name: 'Shamrock Portal' // Optional sender name
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * DEBUG: Test Email Sending directly from Editor
 */
function testEmailSimple() {
  const email = Session.getActiveUser().getEmail();
  Logger.log("Attempting to send email to: " + email);
  try {
    MailApp.sendEmail({
      to: email,
      subject: "Test Email from Script Editor",
      body: "If you receive this, MailApp is working."
    });
    Logger.log("Email sent successfully.");
    return "Sent";
  } catch (e) {
    Logger.log("Error sending email: " + e.message);
    return "Error: " + e.message;
  }
}
/**
 * Handles incoming location logs from the Wix Portal
 */
function handleLocationLog(data) {
  try {
    const sheet = setupCheckInsSheet(); // Auto-create if needed

    sheet.appendRow([
      data.timestamp || new Date(),
      data.memberId,
      data.memberEmail,
      data.phoneNumber,
      data.latitude,
      data.longitude,
      data.address,
      data.intersection,
      data.notes,
      data.imageUrl,
      data.riskLevel,
      data.ipAddress,
      data.deviceModel || data.device
    ]);
    const lastRow = sheet.getLastRow();

    // 🧠 AI MONITOR: Analyze Notes for Risk/Sentiment
    if (data.notes) {
      try {
        // Pass row number so AI can update status
        data._sheetRow = lastRow;
        AI_analyzeCheckIn(data); // "The Parole Officer"
      } catch (aiError) {
        console.error("AI Monitor Error:", aiError);
      }
    }

    // 🌎 GEO-FENCE: Check if Out of State
    try {
      checkGeoFencing(data);
    } catch (geoError) {
      console.error("Geo-Fence Error:", geoError);
    }

    /**
     * Checks if location is outside Florida and alerts staff
     */
    function checkGeoFencing(data) {
      // 1. Determine State from Address
      let isFlorida = true; // Assume innocent until proven guilty
      let address = data.address || "";

      // If no address but lat/lng, try to reverse geocode (quota permitting)
      if (!address && data.latitude && data.longitude) {
        try {
          const geo = Maps.newGeocoder().reverseGeocode(data.latitude, data.longitude);
          if (geo.results && geo.results.length > 0) {
            address = geo.results[0].formatted_address;
          }
        } catch (e) {
          console.warn("Geocoding failed, skipping fence check");
          return;
        }
      }

      // 2. Simple String Check
      if (address) {
        const upper = address.toUpperCase();
        // Check if it clearly contains a state other than FL? 
        // Easier: Check if it contains " FL" or "FLORIDA"
        // If it contains neither, it MIGHT be out of state.
        // To be safe/precise: if it contains " AL ", " GA ", etc? No, too many cases.
        // Let's assume standard format ending in "City, ST Zip".

        // Strict Rule: If it works, it works. If ambiguous, don't spam.
        const hasFL = upper.includes(" FL") || upper.includes("FLORIDA");

        // Only alert if we are somewhat sure it's NOT FL (e.g. contains another state code logic or just lacks FL)
        // User asked "if anyone leaves the state".
        if (!hasFL && address.length > 10) {
          isFlorida = false;
        }
      }

      // 3. Trigger Alert
      if (!isFlorida) {
        const name = data.memberEmail || "Unknown Client"; // data.memberId is usually UUID
        const mapLink = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
        const msg = `🚨 GEO-FENCE ALERT: ${name} is OUT OF STATE.\nLoc: ${address}\nMap: ${mapLink}`;

        const phones = ['2399550178', '2399550301', '2397849365'];
        phones.forEach(p => sendSmsViaTwilio(p, msg));
        console.log(`🚨 Sent Geo-Fence Alert for ${name}`);
      }
    }

    return { success: true, message: 'Location Logged in Sheet' };
  } catch (e) {
    console.error('Location Log Error', e);
    return { success: false, message: e.message };
  }
}

/**
 * Sends the current Dashboard Link to Admin
 */
function sendDashboardLinkEmail() {
  const email = "admin@shamrockbailbonds.biz";
  const url = ScriptApp.getService().getUrl();
  const version = "7.5.0";
  const subject = `GAS Project's Dashboard.html Link Updated! Version ${version}`;
  const body = `The deployed Web App URL is active and updated:
  
${url}

Deployment Version: ${version}
Logic: Geo-Fencing (3 phones), AI Agents (Secured), Persistence (Check-Ins).
  `;

  MailApp.sendEmail(email, subject, body);
  console.log(`📧 Sent Dashboard Link to ${email}`);
}

/**
 * Changes intake status to "Approved" and syncs to Wix
 * Called from Dashboard
 */
function approveIntake(intakeId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('IntakeQueue');
    const data = sheet.getDataRange().getValues();

    // 1. Find the row
    // IntakeID is Col 1 (Index 0)
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(intakeId)) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Intake ID not found' };
    }

    // 2. Update Status locally (Col 10 => J)
    // Status is Col 10 (J). Check header to be sure? Index 9.
    // getRange(row, col). col is 1-indexed. J is 10.
    sheet.getRange(rowIndex, 10).setValue('Approved');

    // 3. Sync to Wix
    const wixUrl = 'https://www.shamrockbailbonds.biz/_functions/updateIntakeStatus';
    const apiKey = PropertiesService.getScriptProperties().getProperty('GAS_API_KEY') || 'shamrock-secret-key';

    const payload = {
      apiKey: apiKey,
      caseId: intakeId,
      status: 'Approved'
    };

    // Call Wix
    const response = UrlFetchApp.fetch(wixUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const resText = response.getContentText();
    const resJson = JSON.parse(resText);

    if (response.getResponseCode() === 200 && resJson.success) {
      return { success: true, message: 'Approved and synced to Wix' };
    } else {
      console.error('Wix Sync Failed:', resText);
      // Return success true anyway because local approval worked? 
      // User might want to know sync failed.
      return { success: true, warning: 'Approved locally, but Wix sync failed: ' + (resJson.message || 'Unknown') };
    }

  } catch (e) {
    console.error('approveIntake Error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Handles batch usage of documents from Portal
 * (Placeholder for full sync logic)
 */
function batchSaveToWixPortal(data) {
  console.log('Batch Save Requested:', data);
  return { success: true, processed: data.documents ? data.documents.length : 0 };
}

/**
 * Triggers the Qualified Router's cleanup and re-sync logic.
 * Call from Dashboard.
 */
function client_forceCleanup() {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized" };

  try {
    forceFullCleanup(); // Defined in QualifiedTabRouter.gs
    return { success: true, message: "Qualified data cleared and re-synced." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function client_batchSaveToWixPortal(data) {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized" };
  return batchSaveToWixPortal(data);
}

function client_sendToWixPortal(data) {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized" };

  console.log('client_sendToWixPortal started');

  // 1. Process with SignNow (Upload + Invite)
  // Ensure delivery method is 'embedded' for portal use if not specified
  if (!data.deliveryMethod) data.deliveryMethod = 'embedded';

  const snResult = SN_processCompleteWorkflow(data);

  if (!snResult.success) {
    console.error('SignNow Workflow Failed:', snResult.error);
    return snResult;
  }

  // 2. Save Links to Wix Portal
  if (snResult.signingLinks && snResult.signingLinks.length > 0) {
    const defendantName = `${data['defendant-first-name']} ${data['defendant-last-name']}`;
    const caseNumber = data.charges && data.charges[0] ? data.charges[0].caseNumber : '';

    // Transform to Wix Portal Format
    const documents = snResult.signingLinks.map(link => ({
      signerEmail: link.email,
      signerName: link.firstName + ' ' + link.lastName,
      signerPhone: link.phone,
      signerRole: link.role,
      signingLink: link.link, // SignNow returns 'link'
      documentId: snResult.documentId,
      defendantName: defendantName,
      caseNumber: caseNumber,
      documentName: data.fileName || 'Bail Bond Packet',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const wixResult = batchSaveToWixPortal({ documents: documents });
    return { success: true, documentId: snResult.documentId, wixResult: wixResult };
  }

  return { success: true, documentId: snResult.documentId, message: "No signing links generated (download mode?)" };
}

function client_batchSaveToWixPortal(data) {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized" };
  return batchSaveToWixPortal(data);
}

function client_sendToWixPortal(data) {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized" };

  console.log('client_sendToWixPortal started');

  // 1. Process with SignNow (Upload + Invite)
  // Ensure delivery method is 'embedded' for portal use if not specified
  if (!data.deliveryMethod) data.deliveryMethod = 'embedded';

  const snResult = SN_processCompleteWorkflow(data);

  if (!snResult.success) {
    console.error('SignNow Workflow Failed:', snResult.error);
    return snResult;
  }

  // 2. Save Links to Wix Portal
  if (snResult.signingLinks && snResult.signingLinks.length > 0) {
    const defendantName = `${data['defendant-first-name']} ${data['defendant-last-name']}`;
    const caseNumber = data.charges && data.charges[0] ? data.charges[0].caseNumber : '';

    // Transform to Wix Portal Format
    const documents = snResult.signingLinks.map(link => ({
      signerEmail: link.email,
      signerName: link.firstName + ' ' + link.lastName,
      signerPhone: link.phone,
      signerRole: link.role,
      signingLink: link.link, // SignNow returns 'link'
      documentId: snResult.documentId,
      defendantName: defendantName,
      caseNumber: caseNumber,
      documentName: data.fileName || 'Bail Bond Packet',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const wixResult = batchSaveToWixPortal({ documents: documents });
    return { success: true, documentId: snResult.documentId, wixResult: wixResult };
  }

  return { success: true, documentId: snResult.documentId, message: "No signing links generated (download mode?)" };
}
