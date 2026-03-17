// ============================================================================
// Shamrock Bail Bonds - Unified Production Backend (Code.gs)
// Version: 6.7 - SignNow API Token Fallback (Updated 2026-02-03)
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
    GOOGLE_DOC_TEMPLATE_ID: props.getProperty('GOOGLE_DOC_TEMPLATE_ID') || '',
    WIX_API_KEY: props.getProperty('GAS_API_KEY') || '',
    WIX_SITE_URL: props.getProperty('WIX_SITE_URL') || 'https://www.shamrockbailbonds.biz',
    WEBHOOK_URL: props.getProperty('WEBHOOK_URL') || '',
    // Slack Webhooks — all channels from Shamrock Bail Bonds Slack workspace
    SLACK_WEBHOOK_NEW_CASES: props.getProperty('SLACK_WEBHOOK_NEW_CASES') || '',
    SLACK_WEBHOOK_COURT_DATES: props.getProperty('SLACK_WEBHOOK_COURT_DATES') || '',
    SLACK_WEBHOOK_FORFEITURES: props.getProperty('SLACK_WEBHOOK_FORFEITURES') || '',
    SLACK_WEBHOOK_DISCHARGES: props.getProperty('SLACK_WEBHOOK_DISCHARGES') || '',
    SLACK_WEBHOOK_GENERAL: props.getProperty('SLACK_WEBHOOK_GENERAL') || '',
    SLACK_WEBHOOK_SIGNING_ERRORS: props.getProperty('SLACK_WEBHOOK_SIGNING_ERRORS') || '',
    SLACK_WEBHOOK_INTAKE: props.getProperty('SLACK_WEBHOOK_INTAKE') || '',
    SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY: props.getProperty('SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY') || '',
    SLACK_WEBHOOK_SHAMROCK: props.getProperty('SLACK_WEBHOOK_SHAMROCK') || '',
    SLACK_WEBHOOK_DRIVE: props.getProperty('SLACK_WEBHOOK_DRIVE') || '',
    SLACK_WEBHOOK_CALENDAR: props.getProperty('SLACK_WEBHOOK_CALENDAR') || '',
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
// SINGLE SOURCE OF TRUTH: Synced with Server_DocumentLogic.js → PDF_DRIVE_FILE_IDS
// Source PDFs live in /osiforms/ folder. If you re-upload, update BOTH files.
const TEMPLATE_DRIVE_IDS = {
  'paperwork-header': '15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1',
  'faq-cosigners': '1bjmH2w-XS5Hhe828y_Jmv9DqaS_gSZM7',
  'faq-defendants': '16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR',
  'indemnity-agreement': '1Raa2gzHOlO5kSJOeDE25eBh2H8LcjN5L',
  'defendant-application': '1JxBubXg0up1NeFBaWgi6qGNA133tSCxG',
  'promissory-note': '104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt',
  'disclosure-form': '1qIIDudp7r3J7-6MHlL2US34RcrU9KZKY',
  'surety-terms': '1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf',
  'master-waiver': '181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs',
  'ssa-release': '1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu',
  'collateral-receipt': '1IAYq4H2b0N0vPnJN7b2vZPaHg_RNKCmP',
  'payment-plan': '1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A',
  'appearance-bond': '15SDM1oBysTw76bIL7Xt0Uhti8uRZKABs',
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

  if (e.parameter && e.parameter.testDoc) {
    if (typeof generateMotionForRemission === 'function') {
      try {
        var result = generateMotionForRemission({
          defendantName: "NATHAN STONE",
          county: "LEE",
          courtName: "CIRCUIT",
          caseNumber: "24-CF-000001",
          bondAmount: "5000",
          estreatureDate: "June 1, 2024",
          apprehensionDate: "June 5, 2024",
          bondDate: "January 15, 2024"
        }, null);
        return ContentService.createTextOutput("Testing Nathan Stone Doc Generated. Link: " + result.url);
      } catch (err) {
        return ContentService.createTextOutput("Error: " + err.message);
      }
    }
  }

  // ElevenLabs Conversation Init — handle via GET to avoid GAS POST redirect issues
  if (e.parameter && e.parameter.source === 'elevenlabs_init') {
    if (typeof handleElevenLabsConversationInit === 'function') {
      return handleElevenLabsConversationInit(e);
    }
  }

  // ElevenLabs Post-Call — forwarded from Netlify proxy to avoid 302 redirect
  if (e.parameter && e.parameter.source === 'elevenlabs_webhook' && e.parameter.postcall_data) {
    try {
      const payload = JSON.parse(decodeURIComponent(e.parameter.postcall_data));
      Logger.log('🎙️ Post-call webhook forwarded from Netlify | Call: ' + (payload.call_id || 'unknown'));
      if (typeof routeElevenLabsWebhook === 'function') {
        return routeElevenLabsWebhook(payload);
      } else if (typeof handlePostCallTranscription === 'function' && payload.type === 'post_call_transcription') {
        return handlePostCallTranscription(payload);
      }
      return ContentService.createTextOutput('Post-call processed').setMimeType(ContentService.MimeType.TEXT);
    } catch (parseErr) {
      Logger.log('❌ Post-call parse error: ' + parseErr.message);
      return ContentService.createTextOutput('Parse error: ' + parseErr.message).setMimeType(ContentService.MimeType.TEXT);
    }
  }

  // Shannon Send Paperwork Tool — forwarded from Netlify proxy
  if (e.parameter && e.parameter.source === 'send_paperwork' && e.parameter.data) {
    // Auth: Verify shared secret
    if (!verifyElevenLabsToolSecret_(e)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    try {
      const paperworkData = JSON.parse(decodeURIComponent(e.parameter.data));
      Logger.log('📄 Shannon send-paperwork request: ' + JSON.stringify(paperworkData));
      if (typeof handleShannonSendPaperwork === 'function') {
        const result = handleShannonSendPaperwork(paperworkData);
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Handler not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (parseErr) {
      Logger.log('❌ Send-paperwork parse error: ' + parseErr.message);
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: parseErr.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Shannon Notify Bondsman Tool (Path A) — log intake + Slack alert
  if (e.parameter && e.parameter.source === 'notify_bondsman' && e.parameter.data) {
    // Auth: Verify shared secret
    if (!verifyElevenLabsToolSecret_(e)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    try {
      const intakeData = JSON.parse(decodeURIComponent(e.parameter.data));
      Logger.log('📞 Shannon notify-bondsman request: ' + JSON.stringify(intakeData));
      if (typeof handleShannonNotifyBondsman === 'function') {
        const result = handleShannonNotifyBondsman(intakeData);
        return ContentService.createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Handler not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (parseErr) {
      Logger.log('❌ Notify-bondsman parse error: ' + parseErr.message);
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Parse error' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 1. Check for JSON mode explicitly OR direct action= param (Node-RED scheduler calls use ?action=xxx without format=json)
  // Route action= params FIRST so Node-RED GET calls never fall through to the HTML renderer
  if (e.parameter.action) return handleGetAction(e);

  if (e.parameter.format === 'json') {
    if (e.parameter.mode === 'scrape') {
      const result = runLeeScraper();
      return createResponse(result);
    }
    if (e.parameter.action === 'test_pdf') {
      const result = typeof testPdfHydration === 'function' ? testPdfHydration() : { error: 'Function not found' };
      return ContentService.createTextOutput(JSON.stringify(result, null, 2)).setMimeType(ContentService.MimeType.JSON);
    }
    if (e.parameter.action === 'test_ai') {
      const result = typeof testAIConnections === 'function' ? testAIConnections() : { error: 'Function testAIConnections not found' };
      return ContentService.createTextOutput(JSON.stringify(result, null, 2)).setMimeType(ContentService.MimeType.JSON);
    }

    if (e.parameter.action === 'analyze_tags') {
      const result = typeof analyzeTagPatterns === 'function' ? analyzeTagPatterns() : 'Function not found';
      return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.TEXT);
    }

    if (e.parameter.action === 'auto_tag') {
      const result = typeof runAutoTagging === 'function' ? runAutoTagging() : 'Function not found';
      return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.TEXT);
    }

    if (e.parameter.setup === 'signnow') {
      const url = ScriptApp.getService().getUrl();
      // Ensure we register the current active URL
      try {
        SN_registerCompletionWebhook(url);
        return ContentService.createTextOutput(`Webhook Registered Successfully to: ${url}`);
      } catch (err) {
        return ContentService.createTextOutput(`Webhook Registration Failed: ${err.message}`);
      }
    }

    return createErrorResponse('No action specified', ERROR_CODES.MISSING_ACTION);
  }

  // 2. Default to HTML for Browser
  try {
    // --- VIEWER ALLOWLIST (Security Hardening) ---
    // BYPASS FOR VERIFICATION: User email is hidden by cross-domain policies. 
    // Allowing access knowing the URL is the secret for now.
    /*
    const userEmail = Session.getActiveUser().getEmail();
    const allowed = isUserAllowed(userEmail);
    if (!allowed) {
      return HtmlService.createHtmlOutput('<h1>Access Denied</h1><p>You are not authorized to view this dashboard.</p><p>Detected Email: "<strong>' + userEmail + '</strong>"</p><p>Please ensure you are logged in with an authorized account (e.g. @shamrockbailbonds.biz).</p>');
    }
    */
    // ---------------------------------------------

    // --- APP VERSION CONTROL ---
    const APP_VERSION = 'v232-Release';

    // --- SLACK ALERT ---
    if (e.parameter.action === 'sendSlackAlert') {
      const result = NotificationService.sendSlack(e.parameter.channel || '#alerts', e.parameter.text, e.parameter.blocks);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- AUTOMATIC DEVICE DETECTION ---
    let userAgent = '';
    try { userAgent = e.parameter.userAgent || ''; } catch (err) { }

    // Page Routing
    let page = e.parameter.page || 'Dashboard';
    if (!e.parameter.page) {
      const ua = userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('android') && ua.includes('mobile')) page = 'mobile';
      else if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) page = 'tablet';
    }

    // Specialized Routing for Config Modal (if requested directly via URL)
    if (page === 'ConfigModal') {
      const template = HtmlService.createTemplateFromFile('ConfigModal');
      template.appVersion = APP_VERSION;
      return template.evaluate().setTitle('⚙️ Configuration').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // --- Mobile & Tablet Routing ---
    if (page === 'mobile' || page === 'tablet') {
      const templateName = page === 'mobile' ? 'MobileDashboard' : 'TabletDashboard';
      const title = page === 'mobile' ? 'Shamrock Mobile' : 'Shamrock Tablet';

      const template = HtmlService.createTemplateFromFile(templateName);
      template.mapsApiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY') || '';
      template.appVersion = APP_VERSION; // Inject Version

      return template.evaluate()
        .setTitle(title)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // --- STANDARD DASHBOARD ---
    // ALWAYS use template to support Dynamic URL Injection
    const template = HtmlService.createTemplateFromFile(page); // Default 'Dashboard'
    template.mapsApiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY') || '';
    template.appVersion = APP_VERSION; // Inject Version

    // 1. Inject Dynamic App URL (Self-Discovery)
    try {
      template.gasUrl = ScriptApp.getService().getUrl();
    } catch (err) {
      template.gasUrl = '';
    }

    // 2. Inject Data (Robust)
    template.data = getDashboardData();
    if (e.parameter.prefill === 'true') {
      try {
        if (typeof getPrefillData === 'function') {
          const prefill = getPrefillData();
          template.data = { ...template.data, ...prefill };
        }
      } catch (err) { console.warn('Prefill failed', err); }
    }

    return template.evaluate()
      .setTitle('Shamrock Bail Bonds')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  } catch (error) {
    return HtmlService.createHtmlOutput('<h1>Page Error</h1><p>' + error.message + '</p>');
  }
}

/**
 * Gather data for the Dashboard injection
 */
function getDashboardData() {
  try {
    const config = getConfig();
    const user = Session.getActiveUser().getEmail();
    return {
      user: user,
      env: 'production',
      wixSiteUrl: config.WIX_SITE_URL || 'https://www.shamrockbailbonds.biz',
      config: {
        SIGNNOW_API_BASE: config.SIGNNOW_API_BASE,
        // Don't expose secrets here
      }
    };
  } catch (e) {
    console.error("Error getting dashboard data: " + e.message);
    return { error: e.message };
  }
}


/**
 * PUBLIC API: Fetch statistics for all counties
 * Called by Dashboard.html via google.script.run
 */
function getCountyStatistics(refresh = false) {
  // OPTIMIZATION (V190): Cache Results for 10 Minutes
  const cache = CacheService.getScriptCache();
  const cacheKey = 'STATS_V1_CACHE';

  // 1. Try Cache
  if (!refresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      // console.log("Serving Stats from Cache");
      return JSON.parse(cached);
    }
  }

  // 2. Fetch Fresh Data
  const counties = ['Lee', 'Collier', 'Charlotte', 'Sarasota', 'Hendry', 'DeSoto', 'Manatee', 'Palm Beach', 'Seminole', 'Orange', 'Pinellas', 'Broward', 'Hillsborough'];
  const stats = {};

  counties.forEach(county => {
    // Normalize key for frontend (lowercase, dashes)
    const key = county.toLowerCase().replace(/\s+/g, '-');
    // Fetch stats using service
    try {
      if (typeof getCountyStats === 'function') {
        stats[key] = getCountyStats(county);
      } else {
        stats[key] = { exists: false, error: 'StatsService missing' };
      }
    } catch (e) {
      console.warn(`Failed to get stats for ${county}: ${e.message}`);
      stats[key] = { exists: false, error: e.message };
    }
  });

  // 3. Store in Cache (600s = 10m)
  try {
    cache.put(cacheKey, JSON.stringify(stats), 600);
  } catch (err) {
    console.warn("Failed to write stats to cache", err);
  }

  return stats;
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
    // 2. Route Webhooks FIRST (SOC II Verified)
    // Must happen BEFORE postData check — some webhooks (e.g. ElevenLabs init)
    // may send params as query params without a JSON body.
    if (e && (e.pathInfo || (e.parameter && e.parameter.source))) {
      if (typeof handleSOC2Webhook === 'function') {
        return handleSOC2Webhook(e);
      }
    }

    if (!e || !e.postData) throw new Error("No POST data received");

    // Fail Fast: Parse JSON
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      if (typeof logSecurityEvent === 'function') logSecurityEvent('JSON_PARSE_ERROR', { error: parseError.toString() });
      return createErrorResponse('Invalid JSON payload', ERROR_CODES.INVALID_JSON);
    }

    // --- MERGE URL PARAMETERS (CRITICAL FOR WIX/3RD PARTY INTEGRATION) ---
    // Allows passing apiKey/action in URL when body structure is fixed
    if (e.parameter && e.parameter.apiKey && !data.apiKey) data.apiKey = e.parameter.apiKey;
    if (e.parameter && e.parameter.action && !data.action) data.action = e.parameter.action;





    // --- WEBHOOK HANDLER (SOC II Aware) ---
    if (data.event && data.event.startsWith('document.')) {
      if (typeof handleSOC2Webhook === 'function') {
        if (typeof logProcessingEvent === 'function') logProcessingEvent('LEGACY_WEBHOOK_RECEIVED', { event: data.event });
        return createResponse({ received: true });
      }
    }

    // NEW: Telegram webhook handling
    if (data.action === 'telegram_inbound_message') {
      // Auth: Verify Telegram webhook relay secret
      if (typeof verifyTelegramWebhookSecret_ === 'function' && !verifyTelegramWebhookSecret_(e)) {
        return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
      }

      // Idempotency: Skip duplicate Telegram updates
      var tgUpdateId = data.update && data.update.update_id ? String(data.update.update_id) : '';
      if (tgUpdateId && typeof IdempotencyGuard !== 'undefined' && IdempotencyGuard.isDuplicate('telegram', tgUpdateId)) {
        return createResponse({ success: true, skipped: true, reason: 'duplicate_update' });
      }

      if (typeof handleTelegramInbound === 'function') {
        return createResponse(handleTelegramInbound(data.update));
      } else {
        console.error('handleTelegramInbound function not found');
        return createErrorResponse('Function handleTelegramInbound not found', ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // --- TELEGRAM MINI APP (no-cors — cannot send API key) ---
    // These actions bypass API key verification because the Mini App
    // uses fetch({ mode: 'no-cors' }) which cannot read responses or
    // send custom headers reliably. Security is via Telegram initData.
    if (data.action === 'telegram_mini_app_intake') {
      try {
        Logger.log('📱 Telegram Mini App intake received');
        const result = saveTelegramIntakeToQueue(data, data.telegramUserId || 'mini_app_unknown');
        // Send Slack notification
        try {
          const slackChannel = getConfig().SLACK_WEBHOOK_INTAKE || getConfig().SLACK_WEBHOOK_SHAMROCK;
          if (slackChannel) {
            sendSlackMessage(slackChannel,
              `📱 New Telegram Mini App Intake: ${data.DefName || 'Unknown'} | Facility: ${data.DefFacility || 'N/A'} | Indemnitor: ${data.IndName || 'N/A'} | Phone: ${data.IndPhone || 'N/A'}`,
              null
            );
          }
        } catch (slackErr) {
          Logger.log('Slack notification failed (non-fatal): ' + slackErr.message);
        }
        return createResponse(result);
      } catch (intakeErr) {
        Logger.log('❌ Mini App intake error: ' + intakeErr.message);
        return createErrorResponse(intakeErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    if (data.action === 'telegram_mini_app_upload') {
      try {
        Logger.log('📎 Telegram Mini App file upload: ' + data.docType);
        // Save file to Google Drive
        const folder = DriveApp.getFolderById(getConfig().GOOGLE_DRIVE_FOLDER_ID);
        const decoded = Utilities.base64Decode(data.base64Data);
        const blob = Utilities.newBlob(decoded, data.mimeType || 'image/jpeg', data.fileName || 'upload.jpg');
        const file = folder.createFile(blob);
        file.setDescription('Telegram Mini App upload | User: ' + (data.telegramUserId || 'unknown') + ' | Type: ' + (data.docType || 'unknown'));
        return createResponse({ success: true, fileId: file.getId(), fileUrl: file.getUrl() });
      } catch (uploadErr) {
        Logger.log('❌ Mini App upload error: ' + uploadErr.message);
        return createErrorResponse(uploadErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }
    if (data.action === 'telegram_payment_log') {
      try {
        Logger.log('💳 Telegram Mini App payment log: ' + data.referenceId);
        MongoLogger.logPayment(data);
        // Log to PaymentLog sheet
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName('PaymentLog');
        if (!sheet) {
          sheet = ss.insertSheet('PaymentLog');
          sheet.appendRow(['Timestamp', 'ReferenceID', 'Name', 'Phone', 'Amount', 'Type', 'Status', 'TelegramUserID', 'TelegramUsername', 'Source']);
          sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
        }
        sheet.appendRow([
          new Date(),
          data.referenceId || '',
          data.name || '',
          data.phone || '',
          data.amount || 0,
          data.paymentType || '',
          data.status || 'initiated',
          data.telegramUserId || '',
          data.telegramUsername || '',
          data.source || 'telegram_mini_app'
        ]);
        // Slack notification
        try {
          const slackChannel = getConfig().SLACK_WEBHOOK_INTAKE || getConfig().SLACK_WEBHOOK_SHAMROCK;
          if (slackChannel) {
            sendSlackMessage(slackChannel,
              `💳 Payment initiated via Telegram: ${data.name || 'Unknown'} | $${data.amount || '?'} | ${data.paymentType || 'unknown'} | Ref: ${data.referenceId || 'N/A'}`,
              null
            );
          }
        } catch (slackErr) {
          Logger.log('Slack notification failed (non-fatal): ' + slackErr.message);
        }
        return createResponse({ success: true, referenceId: data.referenceId });
      } catch (payErr) {
        Logger.log('❌ Payment log error: ' + payErr.message);
        return createErrorResponse(payErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    if (data.action === 'telegram_payment_lookup') {
      try {
        Logger.log('🔍 Payment lookup: ' + data.phone);
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var cleanPh = (data.phone || '').replace(/\D/g, '');
        if (cleanPh.length === 10) cleanPh = '1' + cleanPh;

        var clientInfo = null;

        // Search IntakeQueue for client info
        var iqSheet = ss.getSheetByName('IntakeQueue');
        if (iqSheet && iqSheet.getLastRow() > 1) {
          var iqRows = iqSheet.getDataRange().getValues();
          var hdrs = iqRows[0];
          var ci = {};
          hdrs.forEach(function (h, i) { ci[String(h).toLowerCase().trim()] = i; });

          for (var r = iqRows.length - 1; r >= 1; r--) {
            var rw = iqRows[r];
            var ph = String(rw[ci['indphone'] || ci['ind phone'] || ci['phone']] || '').replace(/\D/g, '');
            if (ph.length === 10) ph = '1' + ph;
            if (ph === cleanPh || ph.slice(-10) === cleanPh.slice(-10)) {
              var gv = function (keys) {
                for (var k = 0; k < keys.length; k++) {
                  var idx = ci[keys[k].toLowerCase()];
                  if (idx !== undefined && rw[idx]) return String(rw[idx]);
                }
                return '';
              };
              clientInfo = {
                name: gv(['DefName', 'Def Name', 'Name']),
                bondAmount: parseFloat(gv(['BondAmt', 'Bond Amount'])) || 0,
                charges: gv(['Charges', 'charges']),
                caseNumber: gv(['CaseNumber', 'Case Number'])
              };
              break;
            }
          }
        }

        // Search PaymentLog for payment history
        var payments = [];
        var paySheet = ss.getSheetByName('PaymentLog');
        if (paySheet && paySheet.getLastRow() > 1) {
          var payRows = paySheet.getDataRange().getValues();
          var payHdrs = payRows[0];
          var pi = {};
          payHdrs.forEach(function (h, i) { pi[String(h).toLowerCase().trim()] = i; });

          for (var p = 1; p < payRows.length; p++) {
            var payPh = String(payRows[p][pi['phone'] || 0] || '').replace(/\D/g, '');
            if (payPh.length === 10) payPh = '1' + payPh;
            if (payPh === cleanPh || payPh.slice(-10) === cleanPh.slice(-10)) {
              payments.push({
                date: payRows[p][pi['timestamp'] || 0] ? new Date(payRows[p][pi['timestamp'] || 0]).toLocaleDateString() : '',
                amount: parseFloat(payRows[p][pi['amount'] || 0]) || 0,
                method: String(payRows[p][pi['method'] || pi['type'] || 0] || 'Unknown'),
                reference: String(payRows[p][pi['referenceid'] || pi['reference'] || 0] || '')
              });
            }
          }
        }

        var totalPaid = payments.reduce(function (sum, p) { return sum + p.amount; }, 0);

        return createResponse({
          success: true,
          found: !!clientInfo,
          client: clientInfo,
          payments: payments,
          totalPaid: totalPaid,
          remainingBalance: clientInfo ? Math.max(0, clientInfo.bondAmount - totalPaid) : null,
          phone: data.phone
        });
      } catch (lookupErr) {
        Logger.log('❌ Payment lookup error: ' + lookupErr.message);
        return createErrorResponse(lookupErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }
    if (data.action === 'telegram_checkin_log') {
      try {
        Logger.log('📍 Telegram Mini App check-in: ' + data.referenceId);
        MongoLogger.logCheckIn(data, 'telegram');
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName('CheckInLog');
        if (!sheet) {
          sheet = ss.insertSheet('CheckInLog');
          sheet.appendRow(['Timestamp', 'ReferenceID', 'Name', 'Phone', 'HasSelfie', 'Latitude', 'Longitude', 'TelegramUserID', 'TelegramUsername', 'Source']);
          sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
        }
        sheet.appendRow([
          new Date(),
          data.referenceId || '',
          data.name || '',
          data.phone || '',
          data.hasSelfie ? 'Yes' : 'No',
          data.latitude || '',
          data.longitude || '',
          data.telegramUserId || '',
          data.telegramUsername || '',
          data.source || 'telegram_mini_app'
        ]);
        // Slack notification
        try {
          const slackChannel = getConfig().SLACK_WEBHOOK_INTAKE || getConfig().SLACK_WEBHOOK_SHAMROCK;
          if (slackChannel) {
            var locationStr = (data.latitude && data.longitude)
              ? data.latitude.toFixed(4) + ', ' + data.longitude.toFixed(4)
              : 'Not provided';
            sendSlackMessage(slackChannel,
              '📍 Check-in via Telegram: ' + (data.name || 'Unknown') + ' | Location: ' + locationStr + ' | Selfie: ' + (data.hasSelfie ? '✅' : '❌') + ' | Ref: ' + (data.referenceId || 'N/A'),
              null
            );
          }
        } catch (slackErr) {
          Logger.log('Slack notification failed (non-fatal): ' + slackErr.message);
        }
        return createResponse({ success: true, referenceId: data.referenceId });
      } catch (checkinErr) {
        Logger.log('❌ Check-in log error: ' + checkinErr.message);
        return createErrorResponse(checkinErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── COMMUNICATION PREFERENCES ───
    // MOVED to handleAction() for API key enforcement (Audit C-01)
    // updateCommPrefs now requires authenticated API key

    // ─── BOT ANALYTICS (Feature #4) ───
    if (data.action === 'get_bot_analytics') {
      try {
        var analytics = getBotAnalytics(data.options || { days: 7 });
        return createResponse(analytics);
      } catch (analyticsErr) {
        return createErrorResponse(analyticsErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── TWILIO INBOUND SMS HANDLER ───
    if (data.action === 'twilio_check_in') {
      try {
        Logger.log('📞 Incoming Twilio Message: ' + data.fromNumber);
        MongoLogger.logCheckIn(data, 'twilio');
        if (typeof handleClientCheckInReply === 'function') {
          handleClientCheckInReply(data.fromNumber, data.body);
          return createResponse({ success: true, message: 'Check-in processed' });
        }
        return createErrorResponse('Check-in system disabled', ERROR_CODES.INTERNAL_ERROR);
      } catch (e) {
        return createErrorResponse(e.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── COURT DATE SCHEDULE (Feature #2) ───
    if (data.action === 'schedule_court_date') {
      try {
        Logger.log('📅 Court date scheduling: ' + data.chatId);
        MongoLogger.logCourtDate(data, 'scheduled');
        var courtResult = TG_scheduleCourtDateSequence(
          data.chatId, data.name, data.courtDate, data.caseNumber, data.courtInfo
        );
        return createResponse(courtResult);
      } catch (courtErr) {
        return createErrorResponse(courtErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── SIGNING DEEP LINK (Feature #3) ───
    if (data.action === 'send_signing_link') {
      try {
        Logger.log('✍️ Sending signing deep link to: ' + data.chatId);
        var signResult = TG_sendSigningDeepLink(
          data.chatId, data.caseNumber, data.docType, data.signerName
        );
        return createResponse(signResult);
      } catch (signErr) {
        return createErrorResponse(signErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── PREMIUM CALCULATOR API (Feature #1) ───
    if (data.action === 'calculate_premium') {
      try {
        var premResult = calculatePremium(data.bailAmount, data.chargeCount, data.county);
        return createResponse({ success: true, quote: premResult });
      } catch (premErr) {
        return createErrorResponse(premErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── STATUS LOOKUP (Returns Real Case Data) ───
    if (data.action === 'telegram_status_lookup') {
      try {
        Logger.log('🔍 Status lookup: ' + (data.phone || 'unknown'));
        var ss = SpreadsheetApp.getActiveSpreadsheet();

        // Log the lookup
        var lookSheet = ss.getSheetByName('CaseStatusLookups');
        if (!lookSheet) {
          lookSheet = ss.insertSheet('CaseStatusLookups');
          lookSheet.appendRow(['Timestamp', 'Phone', 'Name', 'TelegramUserID', 'Source']);
          lookSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
        }
        lookSheet.appendRow([
          new Date(),
          data.phone || '',
          data.name || '',
          data.telegramUserId || '',
          data.source || 'telegram_mini_app'
        ]);

        // --- SEARCH IntakeQueue for matching phone ---
        var cleanPhone = (data.phone || '').replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '1' + cleanPhone;
        var caseData = null;

        // Try IntakeQueue first (indemnitor phone)
        var iq = ss.getSheetByName('IntakeQueue');
        if (iq && iq.getLastRow() > 1) {
          var iqData = iq.getDataRange().getValues();
          var headers = iqData[0];

          // Find column indices dynamically
          var colIdx = {};
          headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

          for (var r = iqData.length - 1; r >= 1; r--) {
            var row = iqData[r];
            // Check indemnitor phone and defendant phone columns
            var indPhone = String(row[colIdx['indphone'] || colIdx['ind phone'] || colIdx['phone']] || '').replace(/\D/g, '');
            var defPhone = String(row[colIdx['defphone'] || colIdx['def phone']] || '').replace(/\D/g, '');
            if (indPhone.length === 10) indPhone = '1' + indPhone;
            if (defPhone.length === 10) defPhone = '1' + defPhone;

            if (indPhone === cleanPhone || defPhone === cleanPhone ||
              indPhone.slice(-10) === cleanPhone.slice(-10) ||
              defPhone.slice(-10) === cleanPhone.slice(-10)) {
              // Found a match — build case data
              var getValue = function (keys) {
                for (var k = 0; k < keys.length; k++) {
                  var idx = colIdx[keys[k].toLowerCase()];
                  if (idx !== undefined && row[idx]) return String(row[idx]);
                }
                return '';
              };

              caseData = {
                name: getValue(['DefName', 'Def Name', 'defname', 'Defendant Name']) || getValue(['IndName', 'Ind Name', 'indname', 'Name']) || data.name,
                phone: data.phone,
                status: getValue(['Status', 'status']) || 'Active',
                courtDates: {
                  nextDate: getValue(['CourtDate', 'Court Date', 'courtdate', 'NextCourtDate']) || null,
                  courtroom: getValue(['Courtroom', 'courtroom', 'Court Room']) || null,
                  judge: getValue(['Judge', 'judge']) || null
                },
                payment: {
                  nextDue: getValue(['NextPaymentDate', 'Next Payment', 'nextpaymentdate']) || null,
                  amountDue: parseFloat(getValue(['AmountDue', 'Amount Due', 'amountdue'])) || null,
                  remainingBalance: parseFloat(getValue(['RemainingBalance', 'Remaining Balance', 'Balance'])) || null,
                  lastPayment: getValue(['LastPayment', 'Last Payment', 'lastpayment']) || null
                },
                caseSummary: {
                  bondAmount: parseFloat(getValue(['BondAmt', 'Bond Amount', 'BondAmount', 'bondamt'])) || null,
                  charges: getValue(['Charges', 'charges', 'DefCharges', 'Charge']) || null,
                  postingDate: getValue(['PostingDate', 'Posting Date', 'postingdate', 'Timestamp']) || null,
                  caseNumber: getValue(['CaseNumber', 'Case Number', 'casenumber', 'CaseNo']) || null
                },
                documents: []
              };

              // Strip empty court dates
              if (!caseData.courtDates.nextDate && !caseData.courtDates.courtroom) {
                caseData.courtDates = null;
              }
              // Strip empty payment
              if (!caseData.payment.nextDue && !caseData.payment.amountDue) {
                caseData.payment = null;
              }

              Logger.log('✅ Case found for phone: ' + cleanPhone.slice(-4));
              break;
            }
          }
        }

        return createResponse({
          success: true,
          found: !!caseData,
          caseData: caseData,
          phone: data.phone
        });
      } catch (lookupErr) {
        Logger.log('❌ Status lookup error: ' + lookupErr.message);
        return createErrorResponse(lookupErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── DOCUMENT LOOKUP (Telegram Documents Mini-App) ───
    if (data.action === 'telegram_document_lookup') {
      try {
        Logger.log('📄 Telegram document lookup request');
        var docLookupResult = handleTelegramDocumentLookup(data);
        return createResponse(docLookupResult);
      } catch (docLookupErr) {
        Logger.log('❌ Document lookup error: ' + docLookupErr.message);
        return createErrorResponse(docLookupErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── GET SIGNING URL (Telegram Documents Mini-App) ───
    if (data.action === 'telegram_get_signing_url') {
      try {
        Logger.log('🖊️ Telegram signing URL request');
        var signUrlResult = handleTelegramGetSigningUrl(data);
        return createResponse(signUrlResult);
      } catch (signUrlErr) {
        Logger.log('❌ Signing URL error: ' + signUrlErr.message);
        return createErrorResponse(signUrlErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── GET PACKET MANIFEST (Multi-Indemnitor Doc List) ───
    if (data.action === 'get_packet_manifest') {
      try {
        Logger.log('📦 Packet manifest request');
        var manifestResult = handleGetPacketManifest(data);
        return createResponse(manifestResult);
      } catch (manifestErr) {
        Logger.log('❌ Manifest error: ' + manifestErr.message);
        return createErrorResponse(manifestErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── DOCUMENT STATUS CHECK (Telegram Documents Mini-App) ───
    if (data.action === 'telegram_document_status') {
      try {
        Logger.log('📊 Telegram document status check');
        var docStatusResult = handleTelegramDocumentStatus(data);
        return createResponse(docStatusResult);
      } catch (docStatusErr) {
        Logger.log('❌ Document status error: ' + docStatusErr.message);
        return createErrorResponse(docStatusErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── CLIENT UPDATE ───
    if (data.action === 'telegram_client_update') {
      try {
        Logger.log('📝 Client update (' + data.updateType + '): ' + (data.referenceId || 'N/A'));
        var ss2 = SpreadsheetApp.getActiveSpreadsheet();

        var updateSheet = ss2.getSheetByName('ClientUpdates');
        if (!updateSheet) {
          updateSheet = ss2.insertSheet('ClientUpdates');
          updateSheet.appendRow(['Timestamp', 'ReferenceID', 'Type', 'IsAnonymous', 'Name', 'Phone', 'FormData', 'TelegramUserID', 'TelegramUsername', 'Source']);
          updateSheet.getRange(1, 1, 1, 10).setFontWeight('bold');
        }

        updateSheet.appendRow([
          new Date(),
          data.referenceId || '',
          data.updateType || '',
          data.isAnonymous ? 'Yes' : 'No',
          data.name || '',
          data.phone || '',
          JSON.stringify(data.formData || {}),
          data.telegramUserId || '',
          data.telegramUsername || '',
          data.source || 'telegram_mini_app'
        ]);

        // Slack alert
        try {
          var slackCh = getConfig().SLACK_WEBHOOK_INTAKE || getConfig().SLACK_WEBHOOK_SHAMROCK;
          if (slackCh) {
            var emoji = data.isAnonymous ? '🚨' : '📝';
            var typeLabel = {
              contact: 'Contact Info',
              address: 'Address/Whereabouts',
              extension: 'Payment Extension',
              circumstances: 'Circumstances',
              anonymous_tip: '🚨 ANONYMOUS TIP'
            }[data.updateType] || data.updateType;

            var slackMsg = emoji + ' *Client Update via Telegram*\n'
              + '> Type: *' + typeLabel + '*\n'
              + '> Ref: `' + (data.referenceId || 'N/A') + '`\n';

            if (!data.isAnonymous) {
              slackMsg += '> Name: ' + (data.name || 'Unknown') + '\n';
              slackMsg += '> Phone: ' + (data.phone || 'N/A') + '\n';
            }

            // Include key form details
            var fd = data.formData || {};
            if (data.updateType === 'anonymous_tip') {
              slackMsg += '> Defendant: *' + (fd.defendantName || 'Not provided') + '*\n';
              slackMsg += '> Tip: ' + (fd.tip || 'No details') + '\n';
            } else if (data.updateType === 'extension') {
              slackMsg += '> Requested Date: ' + (fd.requestedDate || 'N/A') + '\n';
              slackMsg += '> Reason: ' + (fd.reason || 'N/A') + '\n';
            } else if (data.updateType === 'address') {
              slackMsg += '> New Address: ' + [fd.address, fd.city, fd.state, fd.zip].filter(Boolean).join(', ') + '\n';
            }

            sendSlackMessage(slackCh, slackMsg, null);
          }
        } catch (slackErr) {
          Logger.log('Slack notification failed (non-fatal): ' + slackErr.message);
        }

        return createResponse({ success: true, referenceId: data.referenceId });
      } catch (updateErr) {
        Logger.log('❌ Client update error: ' + updateErr.message);
        return createErrorResponse(updateErr.message, ERROR_CODES.INTERNAL_ERROR);
      }
    }

    // ─── RISK MITIGATION & NETLIFY FUNCTION ACTIONS ───
    // These actions are called by Netlify serverless functions (no API key)
    if (data.action === 'post_slack_message') {
      return createResponse(handlePostSlackMessage(data));
    }
    if (data.action === 'get_upcoming_court_dates') {
      return createResponse(handleGetUpcomingCourtDates(data));
    }
    if (data.action === 'send_court_reminders') {
      return createResponse(handleSendCourtReminders(data));
    }
    if (data.action === 'get_daily_stats') {
      return createResponse(handleGetDailyStats(data));
    }
    if (data.action === 'get_unacknowledged_reminders') {
      return createResponse(handleGetUnacknowledgedReminders(data));
    }
    if (data.action === 'escalate_to_cosigner') {
      return createResponse(handleEscalateToCosigner(data));
    }
    if (data.action === 'get_forfeiture_cases') {
      return createResponse(handleGetForfeitureCases(data));
    }
    if (data.action === 'get_recent_client_messages') {
      return createResponse(handleGetRecentClientMessages(data));
    }
    if (data.action === 'flag_high_stress_case') {
      return createResponse(handleFlagHighStressCase(data));
    }
    // Homepage Telegram Hub section analytics (Phase 7 -- 2026-03-03)
    if (data.action === 'logTelegramSectionEvent') {
      return createResponse(logTelegramSectionEvent_(JSON.parse(data.data || '{}')));
    }

    // --- END TELEGRAM MINI APP ---

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
// Supports single string or array
function client_parseBooking(inputData) {
  // "The Clerk"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: `Unauthorized Access. User: '${email}' (Not in allowed list/domain)` };

  return AI_parseBookingSheet(inputData);
}

function client_extractFromUrl(url) {
  // "The Clerk"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: `Unauthorized Access. User: '${email}'` };
  return AI_extractBookingFromUrl(url);
}

function client_analyzeLead(leadJsonString) {
  // "The Analyst"
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: `Unauthorized Access. User: '${email}'` };

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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Read from BOTH sheet names — 'IntakeQueue' (Wix/manual path) and
  // 'Telegram_IntakeQueue' (Telegram bot path, created by INIT_TELEGRAM_INTAKE_QUEUE_HEADERS)
  const SHEET_NAMES = ['IntakeQueue', 'Telegram_IntakeQueue'];
  const pending = [];
  const seenIds = new Set();

  SHEET_NAMES.forEach(function (sheetName) {
    try {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log('getPendingIntakes: sheet not found: ' + sheetName);
        return;
      }
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        Logger.log('getPendingIntakes: ' + sheetName + ' has no data rows');
        return;
      }
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idxStatus = headers.indexOf('Status');
      const idxId = headers.indexOf('IntakeID');
      if (idxStatus === -1) {
        Logger.log('getPendingIntakes: ' + sheetName + ' missing Status column');
        return;
      }
      for (var i = 1; i < data.length; i++) {
        const row = data[i];
        const statusVal = String(row[idxStatus] || '').trim().toLowerCase();
        if (statusVal === 'pending') {
          const item = {};
          headers.forEach(function (header, index) {
            item[header] = row[index];
          });
          // Parse JSON fields
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
          // Deduplicate by IntakeID
          const intakeId = item.IntakeID || '';
          if (!intakeId || !seenIds.has(intakeId)) {
            if (intakeId) seenIds.add(intakeId);
            pending.push(item);
          }
        }
      }
      Logger.log('getPendingIntakes: ' + sheetName + ' contributed ' + pending.length + ' pending rows so far');
    } catch (sheetErr) {
      Logger.log('getPendingIntakes: error reading ' + sheetName + ': ' + sheetErr.message);
    }
  });

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

  // ── MongoDB Activity Audit Trail ──
  MongoLogger.logActivity(action, data.source || 'gas');

  // ─── COMMUNICATION PREFERENCES (Portal → GAS Sync) ───
  // Moved here from pre-auth zone for API key enforcement (Audit C-01)
  if (action === 'updateCommPrefs') {
    try {
      Logger.log('📋 Communication preferences update: ' + (data.phone || 'unknown'));
      if (typeof handleUpdateCommPrefs === 'function') {
        return handleUpdateCommPrefs(data);
      }
      return { success: false, error: 'CommPrefsGate not loaded' };
    } catch (prefsErr) {
      Logger.log('❌ CommPrefs update error: ' + prefsErr.message);
      return { success: false, error: prefsErr.message };
    }
  }

  // 1. INTAKE & QUEUE
  if (action === 'intakeSubmission') { MongoLogger.logIntake(data, 'web'); return handleIntakeSubmission(data); }
  if (action === 'newIntake') { MongoLogger.logIntake(data, 'web'); return handleNewIntake(data.caseId, data.data); }
  if (action === 'fetchPendingIntakes') {
    // Wix CMS path — wrapped in try/catch so a Wix API failure never blocks
    // the Google Sheets path (which has the confirmed Telegram intake data).
    let wixIntakes = [];
    try {
      wixIntakes = getWixIntakeQueue() || [];
    } catch (wixErr) {
      Logger.log('⚠️ getWixIntakeQueue failed (non-fatal): ' + wixErr.message);
      // Continue — Sheets data will still be returned below
    }

    // Google Sheets path — reads IntakeQueue sheet directly
    let tgIntakes = [];
    try {
      tgIntakes = getPendingIntakes() || [];
    } catch (sheetErr) {
      Logger.log('⚠️ getPendingIntakes (Sheets) failed (non-fatal): ' + sheetErr.message);
    }

    Logger.log('fetchPendingIntakes: wix=' + wixIntakes.length + ' sheets=' + tgIntakes.length);
    if (wixIntakes.length > 0) Logger.log('  wix[0] keys: ' + Object.keys(wixIntakes[0]).join(', '));
    if (tgIntakes.length > 0) Logger.log('  sheets[0] keys: ' + Object.keys(tgIntakes[0]).join(', '));

    // Deduplicate by IntakeID (Wix record wins if same ID exists in both)
    const seen = new Set();
    const deduped = [];
    [...wixIntakes, ...tgIntakes].forEach(item => {
      const id = item.IntakeID || item._id || '';
      if (!id || !seen.has(id)) {
        if (id) seen.add(id);
        deduped.push(item);
      }
    });

    // Sort by Timestamp descending
    deduped.sort((a, b) => {
      const timeA = new Date(a.Timestamp || 0).getTime();
      const timeB = new Date(b.Timestamp || 0).getTime();
      return timeB - timeA;
    });

    // JSON.stringify avoids google.script.run's broken serialization
    // of arrays-of-complex-objects (they arrive as plain objects on the client).
    // The client-side Queue.fetch parses this back with JSON.parse.
    return JSON.stringify(deduped);
  }
  if (action === 'markIntakeProcessed') {
    if (String(data.intakeId).startsWith('TG-')) {
      return markTelegramIntakeProcessed(data.intakeId);
    } else {
      return markWixIntakeAsSynced(data.intakeId);
    }
  }
  // Telegram intake full data (for Dashboard Queue.process() hydration when IntakeID starts with 'TG-')
  if (action === 'getTelegramIntakeData') return getTelegramIntakeFullData(data.intakeId);

  // Telegram Mini App (authenticated path — fallback if API key is sent)
  if (action === 'telegram_mini_app_intake') { MongoLogger.logIntake(data, 'mini_app'); return saveTelegramIntakeToQueue(data, data.telegramUserId || 'mini_app_unknown'); }
  if (action === 'telegram_mini_app_upload') {
    const folder = DriveApp.getFolderById(getConfig().GOOGLE_DRIVE_FOLDER_ID);
    const decoded = Utilities.base64Decode(data.base64Data);
    const blob = Utilities.newBlob(decoded, data.mimeType || 'image/jpeg', data.fileName || 'upload.jpg');
    const file = folder.createFile(blob);
    file.setDescription('TG Mini App | User: ' + (data.telegramUserId || 'unknown') + ' | Type: ' + (data.docType || 'unknown'));
    return { success: true, fileId: file.getId(), fileUrl: file.getUrl() };
  }

  // 1.5. NOTIFICATIONS
  if (action === 'sendEmail') return handleSendEmail(data);
  if (action === 'sendSlackAlert') return NotificationService.sendSlack(data.channel, data.text, data.blocks);
  if (action === 'testEmailAdmin') return sendDashboardLinkEmail();

  // 1.5a. PORTAL CLIENT MESSAGE (from indemnitor portal #sendMessageBtn)
  if (action === 'portalClientMessage') {
    try {
      MongoLogger.logComm(data, 'portal');
      var msgData = data || {};
      var caseId = msgData.caseId || 'unknown';
      var senderName = msgData.senderName || 'Indemnitor';
      var msgText = msgData.message || '';
      var msgSource = msgData.source || 'portal';
      var msgTime = msgData.timestamp || new Date().toISOString();

      // Log to Slack #client-messages channel
      if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
        var slackText = '*Portal Message Received*\n' +
          '*From:* ' + senderName + '\n' +
          '*Case:* ' + caseId + '\n' +
          '*Source:* ' + msgSource + '\n' +
          '*Time:* ' + msgTime + '\n' +
          '*Message:* ' + msgText;
        NotificationService.sendSlack('#client-messages', slackText);
      }

      // Log to IntakeQueue sheet if caseId is known
      try {
        var ss = SpreadsheetApp.openById(
          PropertiesService.getScriptProperties().getProperty('INTAKE_SHEET_ID')
        );
        var logSheet = ss.getSheetByName('ClientMessages') ||
          ss.insertSheet('ClientMessages');
        if (logSheet.getLastRow() === 0) {
          logSheet.appendRow(['Timestamp', 'CaseId', 'SenderName', 'SenderEmail', 'Source', 'Message']);
        }
        logSheet.appendRow([msgTime, caseId, senderName, msgData.senderEmail || '', msgSource, msgText]);
      } catch (sheetErr) {
        Logger.log('\u26a0\ufe0f ClientMessages sheet log failed (non-fatal): ' + sheetErr.message);
      }

      return { success: true, logged: true };
    } catch (e) {
      Logger.log('\u274c portalClientMessage error: ' + e.message);
      return { success: false, error: e.message };
    }
  }

  // 1.6. BAIL SCHOOL
  if (action === 'generateCertificate') return handleCertificateGeneration(data);

  // 1.7 SYSTEM
  if (action === 'getSystemStatus') return client_getSystemStatus();
  if (action === 'logWixEvent') return handleWixLogEvent(data);

  // New action to handle PDF template requests
  if (action === 'getPDFTemplates') return getPDFTemplates(data);

  // --- Granular SignNow Actions (Supported by Dashboard.html) ---
  if (action === 'uploadToSignNow') return SN_uploadDocument(data.pdfBase64, data.fileName);
  if (action === 'addSignatureFields') return SN_addFields(data.documentId, data.fields);
  if (action === 'sendEmailInvite') return SN_sendEmailInvite(data.documentId, data.signers, data.options);
  if (action === 'sendSmsInvite') return SN_sendSmsInvite(data.documentId, data.signers, data.options);
  if (action === 'createEmbeddedLink') return SN_createEmbeddedLink(data.documentId, data.email, data.role);
  if (action === 'batchSaveToWixPortal') return batchSaveToWixPortal(data);
  if (action === 'fillSinglePdfWithAdobe') return fillSinglePdfWithAdobe(data);
  if (action === 'getFieldMapping') return getMappingForDocumentTemplate(data.templateKey, data.intakeData);

  // 2. SIGNING & DOCS
  if (action === 'sendForSignature') { MongoLogger.logSignNow('packet_sent', data); return handleSendForSignature(data); }
  if (action === 'createPortalSigningSession') return createPortalSigningSession(data);

  // 4. CHECK-INS
  if (action === 'logDefendantLocation') { MongoLogger.logCheckIn(data.data || data, 'web'); return handleLocationLog(data.data); }
  if (action === 'log_ping_request') return handleLogPingRequest(data);

  // 5. AI AGENTS (Public API)
  if (action === 'parseBookingSheet') return AI_parseBookingSheet(data.fileData);
  if (action === 'testAIAnalyst') { MongoLogger.logLeadScore(data.lead || data, 'TheAnalyst'); return AI_analyzeFlightRisk(data.lead); }
  if (action === 'testAIMonitor') return AI_analyzeCheckIn(data.checkIn);

  // 3. PROFILES (Stub/Future)
  if (action === 'fetchIndemnitorProfile') {
    return { success: false, error: 'Profile lookup not yet implemented' };
  }

  // 6. CONTENT & MEDIA
  if (action === 'generateBlogAudio') return WORKFLOW_createBlogAudio(data.text, data.title, data.voiceId);

  // 4. UTILS
  if (action === 'getNextReceiptNumber') return getNextReceiptNumber();
  if (action === 'health') return { success: true, version: '5.9', timestamp: new Date().toISOString() };


  // --- CLERICAL OPERATIONS ---
  if (action === 'scrapeLee') {
    try {
      if (typeof scrapeLeeCounty === 'function') {
        scrapeLeeCounty();
        if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
          NotificationService.sendSlack('#alerts', '🛠️ *Manual Trigger:* Lee County Scraper executed via Dashboard.');
        }
        return { success: true, message: 'Lee County Scrape initiated' };
      }
      return { success: false, error: 'Function scrapeLeeCounty not found' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (action === 'processCourtEmails') {
    try {
      if (typeof processCourtEmails === 'function') {
        const results = processCourtEmails();
        if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack && results) {
          NotificationService.sendSlack('#alerts', `🛠️ *Manual Trigger:* Court Emails Processed.\n✅ ${results.processed || 0} | ⏭️ ${results.skipped || 0} | ❌ ${results.errors || 0}`);
        }
        return { success: true, results: results };
      }
      return { success: false, error: 'Function processCourtEmails not found' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // TEMP: EMAIL RESEARCH
  if (action === 'researchEmails') {
    if (typeof api_researchEmails === 'function') {
      return api_researchEmails(data.query || '');
    }
    return { success: false, error: 'Function not found' };
  }

  // 6.6 COURT DOCUMENT GENERATION (Stipulations, Motions, Affidavits)
  if (action === 'generateCourtDocument') {
    try {
      const type = data.docType; // 'motion', 'stipulation', 'order', 'affidavit'
      const caseData = data.caseData || {};
      const folderId = data.folderId || null;

      let result = null;
      if (type === 'motion') result = generateMotionForRemission(caseData, folderId);
      else if (type === 'stipulation') result = generateStipulation(caseData, folderId);
      else if (type === 'order') result = generateOrder(caseData, folderId);
      else if (type === 'affidavit') result = generateAffidavit(caseData, folderId);
      else throw new Error("Invalid document type requested: " + type);

      return { success: true, docId: result.docId, url: result.url };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 6.5 CALENDAR INTEGRATION (Dashboard Widget)
  if (action === 'getUpcomingCourtDates') {
    try {
      const calendarId = 'admin@shamrockbailbonds.biz';
      const calendar = CalendarApp.getCalendarById(calendarId);
      if (!calendar) return { success: false, error: 'Calendar not found' };

      const now = new Date();
      const lookahead = new Date();
      lookahead.setDate(now.getDate() + 30); // Next 30 days

      const events = calendar.getEvents(now, lookahead);
      const mappedEvents = events.map(e => ({
        title: e.getTitle(),
        startTime: e.getStartTime().toISOString(),
        endTime: e.getEndTime().toISOString(),
        location: e.getLocation(),
        description: e.getDescription(),
        color: e.getColor()
      }));

      return { success: true, events: mappedEvents };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 7. REPORTING ENGINE
  if (action === 'generateReport') {
    if (typeof api_generateReporting === 'function') {
      return api_generateReporting(data.reportType, data.payload || {});
    } else {
      return { success: false, error: 'Reporting Engine not loaded' };
    }
  }

  // 8. COURT REMINDERS (Triggers & Manual Runs)
  if (action === 'installCourtReminders') {
    if (typeof installCourtReminderTrigger === 'function') {
      installCourtReminderTrigger();
      return { success: true, message: 'Court Reminder Daily Trigger Installed (9 AM ET)' };
    }
    return { success: false, error: 'Court Reminder System not found' };
  }

  if (action === 'runCourtReminders') {
    if (typeof processDailyCourtReminders === 'function') {
      processDailyCourtReminders();
      return { success: true, message: 'Court Reminders Processed Manually' };
    }
    return { success: false, error: 'Court Reminder System not found' };
  }
  // 8.5 BOND RENEWAL CHECK (T-007: Node-RED Bond Renewal Pipeline)
  if (action === 'getBondRenewals') {
    try {
      const daysAhead = data.params?.daysAhead || [30, 60, 90];
      const maxDays = Math.max(...daysAhead);
      const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
      const casesSheet = ss.getSheetByName('Cases');
      if (!casesSheet) return { success: false, error: 'Cases sheet not found' };
      
      const allData = casesSheet.getDataRange().getValues();
      const headers = allData[0];
      const bondDateCol = headers.indexOf('Bond_Date') !== -1 ? headers.indexOf('Bond_Date') : headers.indexOf('bond_date');
      const nameCol = headers.indexOf('Defendant_Name') !== -1 ? headers.indexOf('Defendant_Name') : headers.indexOf('defendant_name');
      const bondNumCol = headers.indexOf('Bond_Number') !== -1 ? headers.indexOf('Bond_Number') : headers.indexOf('bond_number');
      const statusCol = headers.indexOf('Status') !== -1 ? headers.indexOf('Status') : headers.indexOf('status');
      const phoneCol = headers.indexOf('Indemnitor_Phone') !== -1 ? headers.indexOf('Indemnitor_Phone') : headers.indexOf('indemnitor_phone');
      const amountCol = headers.indexOf('Bond_Amount') !== -1 ? headers.indexOf('Bond_Amount') : headers.indexOf('bond_amount');
      
      const now = new Date();
      const renewals = [];
      
      for (let i = 1; i < allData.length; i++) {
        const row = allData[i];
        const status = statusCol >= 0 ? String(row[statusCol]).toLowerCase() : '';
        if (status === 'discharged' || status === 'forfeited' || status === 'void') continue;
        
        const bondDate = bondDateCol >= 0 ? new Date(row[bondDateCol]) : null;
        if (!bondDate || isNaN(bondDate.getTime())) continue;
        
        // Bond renewal = 1 year from bond date
        const expirationDate = new Date(bondDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        
        const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0 && daysRemaining <= maxDays) {
          renewals.push({
            defendantName: nameCol >= 0 ? row[nameCol] : 'Unknown',
            bondNumber: bondNumCol >= 0 ? row[bondNumCol] : '',
            expirationDate: expirationDate.toISOString().split('T')[0],
            daysRemaining: daysRemaining,
            indemnitorPhone: phoneCol >= 0 ? row[phoneCol] : '',
            bondAmount: amountCol >= 0 ? row[amountCol] : 0,
            urgency: daysRemaining <= 30 ? 'urgent' : daysRemaining <= 60 ? 'soon' : 'upcoming'
          });
        }
      }
      
      renewals.sort((a, b) => a.daysRemaining - b.daysRemaining);
      return { success: true, renewals: renewals, count: renewals.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 9. CLIENT CHECK-INS (Triggers & Manual Runs)
  if (action === 'installClientCheckIns') {
    if (typeof installClientCheckInTrigger === 'function') {
      installClientCheckInTrigger();
      return { success: true, message: 'Client Check-In Weekly Trigger Installed (Sun 11 AM ET)' };
    }
    return { success: false, error: 'Client Check-In System not found' };
  }

  if (action === 'runClientCheckIns') {
    if (typeof sendAutomatedCheckIns === 'function') {
      sendAutomatedCheckIns();
      return { success: true, message: 'Automated Client Check-Ins Processed Manually' };
    }
    return { success: false, error: 'Client Check-In System not found' };
  }

  // 10. PAYMENT PLAN RECONCILIATION
  if (action === 'installPaymentPlanRecon') {
    if (typeof installPaymentPlanReconTrigger === 'function') {
      installPaymentPlanReconTrigger();
      return { success: true, message: 'Payment Plan Recon Weekly Trigger Installed (Fri 2 PM ET)' };
    }
    return { success: false, error: 'Payment Plan Recon System not found' };
  }

  if (action === 'runPaymentPlanRecon') {
    if (typeof reconcilePaymentPlans === 'function') {
      var result = reconcilePaymentPlans();
      return { success: true, message: 'Payment Plan Reconciliation Processed Manually', data: result };
    }
    return { success: false, error: 'Payment Plan Recon System not found' };
  }

  // ── NODE-RED DASHBOARD BUTTON ALIASES ──────────────────────────────────────
  // These route action names sent by Node-RED dashboard buttons to existing
  // GAS functions. Node-RED uses slightly different action names than the
  // original Code.js handlers, so these aliases bridge the gap.

  // 11a. SCRAPER — Dynamic county scraping from Node-RED
  if (action === 'scrapeCounty') {
    try {
      const county = (data.county || 'lee').toLowerCase();
      const scraperMap = {
        'lee': 'scrapeLeeCounty',
        'collier': 'runCollierArrestsNow',
        'charlotte': 'scrapeCharlotteCounty'
      };
      const fnName = scraperMap[county];
      if (fnName && typeof this[fnName] === 'function') {
        this[fnName]();
      } else if (typeof scrapeLeeCounty === 'function' && county === 'lee') {
        scrapeLeeCounty();
      } else if (typeof runCollierArrestsNow === 'function' && county === 'collier') {
        runCollierArrestsNow();
      } else {
        return { success: false, error: 'No scraper found for county: ' + county };
      }
      if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
        NotificationService.sendSlack('#alerts', '🛠️ *Manual Trigger:* ' + county.charAt(0).toUpperCase() + county.slice(1) + ' County Scraper executed via Node-RED Dashboard.');
      }
      return { success: true, message: county + ' County Scrape initiated', county: county };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 11b. BOND REPORTING ENGINE — Liability Report
  if (action === 'generateLiabilityReport') {
    try {
      if (typeof generateWeeklyLiabilityReport === 'function') {
        const result = generateWeeklyLiabilityReport();
        if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
          NotificationService.sendSlack('#alerts', '📊 *Liability Report* generated via Node-RED Dashboard.');
        }
        return { success: true, message: 'Liability Report generated', data: result };
      }
      return { success: false, error: 'Function generateWeeklyLiabilityReport not found' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 11c. BOND REPORTING ENGINE — Commission (1099) Report
  if (action === 'generateCommissionReport') {
    try {
      if (typeof generateAgentCommissionReport === 'function') {
        const year = (data.reportParams && data.reportParams.year) || new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const result = generateAgentCommissionReport(month, year);
        if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
          NotificationService.sendSlack('#alerts', '💰 *Commission Report* (' + year + ') generated via Node-RED Dashboard.');
        }
        return { success: true, message: 'Commission Report generated for ' + year, data: result };
      }
      return { success: false, error: 'Function generateAgentCommissionReport not found' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 11d. BOND REPORTING ENGINE — Void/Discharge Reconciliation
  if (action === 'reconcileVoidDischarges') {
    try {
      if (typeof generateVoidDischargeReconciliation === 'function') {
        const daysBack = (data.reconParams && data.reconParams.lookbackDays) || 30;
        const result = generateVoidDischargeReconciliation(daysBack);
        if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
          NotificationService.sendSlack('#alerts', '🔍 *Void/Discharge Reconciliation* (' + daysBack + ' days back) completed via Node-RED Dashboard.');
        }
        return { success: true, message: 'Void/Discharge Recon completed (' + daysBack + ' day lookback)', data: result };
      }
      return { success: false, error: 'Function generateVoidDischargeReconciliation not found' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 11e. CHECK-IN ALIASES (Node-RED sends 'installCheckIns' / 'runCheckIns')
  if (action === 'installCheckIns') {
    if (typeof installClientCheckInTrigger === 'function') {
      installClientCheckInTrigger();
      return { success: true, message: 'Client Check-In Weekly Trigger Installed' };
    }
    return { success: false, error: 'Client Check-In System not found' };
  }

  if (action === 'runCheckIns') {
    if (typeof sendAutomatedCheckIns === 'function') {
      const result = sendAutomatedCheckIns();
      return { success: true, message: 'Automated Client Check-Ins Processed', data: result };
    }
    return { success: false, error: 'Client Check-In System not found' };
  }

  // 11f. PAYMENT RECON ALIASES (Node-RED sends 'installPaymentRecon' / 'runPaymentRecon')
  if (action === 'installPaymentRecon') {
    if (typeof installPaymentPlanReconTrigger === 'function') {
      installPaymentPlanReconTrigger();
      return { success: true, message: 'Payment Plan Recon Trigger Installed' };
    }
    return { success: false, error: 'Payment Plan Recon System not found' };
  }

  if (action === 'runPaymentRecon') {
    if (typeof reconcilePaymentPlans === 'function') {
      var reconResult = reconcilePaymentPlans();
      return { success: true, message: 'Payment Plan Reconciliation Processed', data: reconResult };
    }
    return { success: false, error: 'Payment Plan Recon System not found' };
  }

  // 11g. COURT REMINDER OVERRIDE (Node-RED Dashboard form — T-002)
  if (action === 'sendCourtReminderOverride') {
    try {
      const params = data.params || data;
      const phone = params.phone || '';
      const defendantName = params.defendantName || 'Defendant';
      const courtDate = params.courtDate || '';
      const courtLocation = params.courtLocation || '';
      const caseNumber = params.caseNumber || '';

      if (!phone || !courtDate) {
        return { success: false, error: 'Phone and court date are required' };
      }

      // Format the SMS message
      var smsBody = '🍀 Shamrock Bail Bonds — Court Date Reminder\n\n' +
        'Defendant: ' + defendantName + '\n' +
        'Court Date: ' + courtDate + '\n';
      if (courtLocation) smsBody += 'Location: ' + courtLocation + '\n';
      if (caseNumber) smsBody += 'Case #: ' + caseNumber + '\n';
      smsBody += '\nPlease arrive 30 minutes early. Questions? Call (239) 332-2245.';

      // Send via NotificationService (Twilio)
      var smsResult = null;
      if (typeof NotificationService !== 'undefined' && NotificationService.sendSms) {
        smsResult = NotificationService.sendSms(phone, smsBody);
      } else {
        return { success: false, error: 'NotificationService not available' };
      }

      // Log to Slack
      if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
        NotificationService.sendSlack('#court-dates',
          '📱 *Court Reminder Override* sent via Node-RED Dashboard\n' +
          '*To:* ' + phone + '\n' +
          '*Defendant:* ' + defendantName + '\n' +
          '*Court Date:* ' + courtDate + '\n' +
          '*Location:* ' + (courtLocation || 'N/A'));
      }

      return { success: true, message: 'Court reminder override sent to ' + phone, smsResult: smsResult };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 8. DOCUMENT GENERATION (Magic Tags)
  if (action === 'generate_document') {
    try {
      const newDocId = fillDocumentTemplate(data.templateId, data.folderId, data.title, data.data);
      return { success: true, documentId: newDocId, url: `https://docs.google.com/document/d/${newDocId}` };
    } catch (e) {
      return { success: false, error: e.toString() };
    }
  }

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    const secret = 'shamrock_gas_2026_secure_key_aqhrvpytqw';
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', secret);
    PropertiesService.getScriptProperties().setProperty('WIX_API_KEY', secret);
    return { success: true, message: 'API Keys reset to: ' + secret };
  }
  // ------------------------------

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    const secret = 'shamrock_gas_2026_secure_key_aqhrvpytqw';
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', secret);
    PropertiesService.getScriptProperties().setProperty('WIX_API_KEY', secret);
    return { success: true, message: 'API Keys reset to: ' + secret };
  }
  // ------------------------------

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    const secret = 'shamrock_gas_2026_secure_key_aqhrvpytqw';
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', secret);
    PropertiesService.getScriptProperties().setProperty('WIX_API_KEY', secret);
    return { success: true, message: 'API Keys reset to: ' + secret };
  }
  // ------------------------------

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    const secret = 'shamrock_gas_2026_secure_key_aqhrvpytqw';
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', secret);
    PropertiesService.getScriptProperties().setProperty('WIX_API_KEY', secret);
    return { success: true, message: 'API Keys reset to: ' + secret };
  }
  // ------------------------------

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    const secret = 'shamrock_gas_2026_secure_key_aqhrvpytqw';
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', secret);
    PropertiesService.getScriptProperties().setProperty('WIX_API_KEY', secret);
    return { success: true, message: 'API Keys reset to: ' + secret };
  }
  // ------------------------------

  // --- EMERGENCY ADMIN ACTION ---
  if (action === 'RESET_KEYS_ADMIN_OVERRIDE') {
    const secret = 'shamrock_gas_2026_secure_key_aqhrvpytqw';
    PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', secret);
    PropertiesService.getScriptProperties().setProperty('WIX_API_KEY', secret);
    return { success: true, message: 'API Keys reset to: ' + secret };
  }
  // ------------------------------

  // ── NODE-RED REPEAT OFFENDER HANDLERS ────────────────────────────────────
  // Routes to NodeRedHandlers_RepeatOffender.js

  if (action === 'lookupCosigners') {
    try {
      const result = typeof handleLookupCosigners === 'function'
        ? handleLookupCosigners(data)
        : { success: false, error: 'handleLookupCosigners not loaded' };
      return result;
    } catch (e) { return { success: false, error: e.message }; }
  }

  if (action === 'writeRepeatOffenderAlerts') {
    try {
      const result = typeof handleWriteRepeatOffenderAlerts === 'function'
        ? handleWriteRepeatOffenderAlerts(data)
        : { success: false, error: 'handleWriteRepeatOffenderAlerts not loaded' };
      return result;
    } catch (e) { return { success: false, error: e.message }; }
  }

  if (action === 'sendRepeatOffenderOutreach') {
    try {
      const result = typeof handleSendRepeatOffenderOutreach === 'function'
        ? handleSendRepeatOffenderOutreach(data)
        : { success: false, error: 'handleSendRepeatOffenderOutreach not loaded' };
      return result;
    } catch (e) { return { success: false, error: e.message }; }
  }

  if (action === 'runDripCampaign') {
    try {
      const result = typeof handleRunDripCampaign === 'function'
        ? handleRunDripCampaign(data)
        : { success: false, error: 'handleRunDripCampaign not loaded' };
      return result;
    } catch (e) { return { success: false, error: e.message }; }
  }

  if (action === 'getCommPreferences') {
    try {
      const result = typeof handleGetCommPreferences === 'function'
        ? handleGetCommPreferences(data)
        : { success: false, error: 'handleGetCommPreferences not loaded' };
      return result;
    } catch (e) { return { success: false, error: e.message }; }
  }

  return { success: false, error: 'Unknown Action: ' + action };
}

/**
 * Endpoint for Dashboard to ask Adobe to fill a specific template.
 */
function fillSinglePdfWithAdobe(data) {
  try {
    const { templateKey, intakeData } = data;
    const driveId = TEMPLATE_DRIVE_IDS[templateKey];
    if (!driveId) throw new Error('Template drive ID not found for ' + templateKey);

    // Get PDF Blob
    const templateBlob = DriveApp.getFileById(driveId).getBlob();

    // Map data
    const mappedData = getMappingForDocumentTemplate(templateKey, intakeData);

    // Fill via Adobe
    const filledBlob = AdobePDFService.fillPdfForm(templateBlob, mappedData);

    return {
      success: true,
      pdfBase64: Utilities.base64Encode(filledBlob.getBytes())
    };
  } catch (e) {
    console.error('fillSinglePdfWithAdobe error:', e.message);
    return { success: false, error: e.message };
  }
}

function handleGetAction(e) {
  // GET action router — handles both browser JSON requests and Node-RED scheduler calls
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  const data = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : {};

  // ── HEALTH & DIAGNOSTICS ──────────────────────────────────────────────────
  if (action === 'ping') {
    return createResponse({
      success: true,
      message: 'Pong',
      timestamp: new Date().toISOString(),
      version: 'v4.2.0'
    }, callback);
  }
  if (action === 'health') return createResponse({ success: true, version: 'V409', timestamp: new Date().toISOString() }, callback);
  if (action === 'getNextReceiptNumber') return createResponse(getNextReceiptNumber(), callback);
  if (action === 'testSlack') return createResponse(testSlackIntegration(), callback);

  // ── NODE-RED SCHEDULER ACTIONS (16) ──────────────────────────────────────
  // All functions confirmed to exist in their respective .js files.
  // Each is wrapped in try/catch to prevent one failure from crashing the router.

  if (action === 'runAutoPostingEngine') {
    try {
      const result = typeof runAutoPostingEngine === 'function'
        ? runAutoPostingEngine()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'scoreAndSyncQualifiedRows') {
    try {
      const result = typeof scoreAndSyncQualifiedRows === 'function'
        ? scoreAndSyncQualifiedRows()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'processConciergeQueue') {
    try {
      const result = typeof processConciergeQueue === 'function'
        ? processConciergeQueue()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'pollWixIntakeQueue') {
    try {
      const result = typeof pollWixIntakeQueue === 'function'
        ? pollWixIntakeQueue()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'refreshGoogleTokens') {
    try {
      const result = typeof refreshGoogleTokens === 'function'
        ? refreshGoogleTokens()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'refreshLongLivedTokens') {
    try {
      const result = typeof refreshLongLivedTokens === 'function'
        ? refreshLongLivedTokens()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'runDailyRepeatOffenderScan') {
    try {
      const result = typeof runDailyRepeatOffenderScan === 'function'
        ? runDailyRepeatOffenderScan()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'runRiskIntelligenceLoop') {
    try {
      const result = typeof runRiskIntelligenceLoop === 'function'
        ? runRiskIntelligenceLoop()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'processDailyCourtReminders') {
    try {
      const result = typeof processDailyCourtReminders === 'function'
        ? processDailyCourtReminders()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'TG_processCourtDateReminders') {
    try {
      const result = typeof TG_processCourtDateReminders === 'function'
        ? TG_processCourtDateReminders()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'TG_processWeeklyPaymentProgress') {
    try {
      const result = typeof TG_processWeeklyPaymentProgress === 'function'
        ? TG_processWeeklyPaymentProgress()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'retryFailedPosts') {
    try {
      const result = typeof retryFailedPosts === 'function'
        ? retryFailedPosts()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'sendAutomatedCheckIns') {
    try {
      const result = typeof sendAutomatedCheckIns === 'function'
        ? sendAutomatedCheckIns()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'checkCourtDateProximity') {
    try {
      const result = typeof checkCourtDateProximity === 'function'
        ? checkCourtDateProximity()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  if (action === 'runTheCloser') {
    try {
      const result = typeof runTheCloser === 'function'
        ? runTheCloser()
        : { success: false, message: 'Handler not yet implemented' };
      return createResponse({ success: true, action: action, result: result }, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  // ── LEGACY / MISC ─────────────────────────────────────────────────────────
  if (action === 'sendSlackAlert') {
    const result = NotificationService.sendSlack(e.parameter.channel || '#alerts', e.parameter.text, e.parameter.blocks);
    return createResponse(result, callback);
  }

  if (action === 'getRecentBookings') {
    try {
      const result = typeof getRecentBookings === 'function' ? getRecentBookings() : { success: false, message: 'Not implemented' };
      return createResponse(result, callback);
    } catch (err) {
      return createResponse({ success: false, action: action, error: err.message }, callback);
    }
  }

  return createErrorResponse('Unknown action: ' + action, ERROR_CODES.UNKNOWN_ACTION);
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
  // DEPRECATED: Use NotificationService.sendSms
  if (typeof NotificationService !== 'undefined') {
    return NotificationService.sendSms(to, body);
  }

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
  // REFACTORED: Use Unified NotificationService
  if (typeof NotificationService !== 'undefined') {
    return NotificationService.sendSlack(channel, text, blocks);
  }
  // Fallback ( Legacy Logic )
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
  const cId = formData.caseNumber || formData.caseId || data.caseId || '';
  const prefix = cId ? `[${cId}] ` : '';
  const docName = `${prefix}Bond Application - ${formData.defendantFullName || 'Defendant'} - ${new Date().toISOString().split('T')[0]}`;
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
    const cId = data.caseId || data.formData?.caseId || '';
    const prefix = cId ? `[${cId}] ` : '';
    const docName = `${prefix}Bail Application - ${defendantName} - ${new Date().toISOString().split('T')[0]}`;
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
/**
 * @deprecated Use SN_uploadDocument() from SignNow_Integration_Complete.js.
 * Shim for backward compatibility — all callers route to the canonical implementation.
 */
function uploadFilledPdfToSignNow(pdfBase64, fileName) {
  Logger.log('[Code.js] uploadFilledPdfToSignNow() → delegating to SN_uploadDocument() [canonical]');
  return SN_uploadDocument(pdfBase64, fileName);
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
  // REFACTORED: Now uses NotificationService for consistency
  if (typeof NotificationService !== 'undefined') {
    return NotificationService.sendEmail(data.to, data.subject, data.textBody, data.htmlBody);
  } else {
    // Fallback if Service is missing (should not happen in prod)
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
        'References', 'EmployerInfo', 'ResidenceType', 'ProcessedAt',
        'AI_Risk', 'AI_Rationale', 'AI_Score'
      ]);
      sheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    // CRITICAL: Use the passed caseId as the IntakeID (Col 1)
    // This allows approveIntake() to send this ID back to Wix
    const intakeId = caseId || ('INT-' + timestamp.getTime());

    // Construct References
    // Construct References (Robustly)
    var references = data.references || [];

    // Log incoming keys to debug mismatches
    console.log(`🔍 handleNewIntake Data Keys: ${Object.keys(data).join(', ')}`);

    if (references.length === 0) {
      // Try to build from flat fields (Ref 1)
      if (data.reference1Name || data.Reference1Name || data.ref1Name) {
        references.push({
          name: data.reference1Name || data.Reference1Name || data.ref1Name,
          phone: data.reference1Phone || data.Reference1Phone || data.ref1Phone,
          relation: data.reference1Relation || 'Ref 1',
          address: data.reference1Address || data.Reference1Address || data.ref1Address || ''
        });
      }

      // Try to build from flat fields (Ref 2)
      if (data.reference2Name || data.Reference2Name || data.ref2Name) {
        references.push({
          name: data.reference2Name || data.Reference2Name || data.ref2Name,
          phone: data.reference2Phone || data.Reference2Phone || data.ref2Phone,
          relation: data.reference2Relation || 'Ref 2',
          address: data.reference2Address || data.Reference2Address || data.ref2Address || ''
        });
      }
    }

    // 🧠 AI ANALYST: Analyze Incoming Intake
    let aiRisk = '', aiRationale = '', aiScore = '';
    try {
      const aiAnalysis = AI_analyzeFlightRisk({
        name: data.defendantFullName || data.defendantName || '',
        charges: '', // Charges often not in intake yet
        bond: '',    // Bond often not in intake yet
        residency: data.residenceType || 'Unknown',
        employment: data.indemnitorEmployerName ? 'Employed' : 'Unknown',
        history: 'Unknown',
        ties: 'Family' // Inference based on indemnitor
      });
      aiRisk = aiAnalysis.riskLevel;
      aiRationale = aiAnalysis.rationale;
      aiScore = aiAnalysis.score;
    } catch (aiErr) {
      console.warn("AI Analysis failed for intake: " + aiErr.message);
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
      '', // ProcessedAt
      aiRisk,      // Col 15: AI Risk
      aiRationale, // Col 16: AI Rationale
      aiScore      // Col 17: AI Score
    ];

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();
    console.log(`✅ New Intake Synced: ${intakeId}`);

    // --- NOTIFY SLACK ---
    try {
      const slackText = `🚨 *New Indemnitor Intake*\n*Case:* ${data.caseNumber || 'Pending'}\n*Def:* ${data.defendantName}\n*Indemnitor:* ${data.indemnitorFullName}\n*Risk:* ${aiRisk || 'N/A'}`;
      if (typeof sendSlackMessage === 'function') {
        NotificationService.sendSlack('#new-cases', slackText);
      }
    } catch (slackErr) {
      console.warn('Failed to send Slack alert:', slackErr);
    }

    // --- SYNC AI DATA BACK TO WIX ---
    if (aiRisk) {
      updateWixIntakeWithAI(intakeId, {
        riskLevel: aiRisk,
        score: aiScore,
        rationale: aiRationale
      });
    }

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

      // [NEW] Generate PDF from Google Doc Template (Auto-Intake Flow)
      try {
        if (typeof PDFService !== 'undefined' && typeof PDFService.generatePdfFromTemplate === 'function') {

          // 1. Normalize Data for Hydration (Code.js Fix)
          // We need standard keys like {{DefName}} to populate the doc.
          // buildMasterDataObject is global in PDF_Mappings.js
          let pdfData = docData;
          if (typeof buildMasterDataObject === 'function') {
            const masterData = buildMasterDataObject(docData);
            pdfData = { ...docData, ...masterData };
            console.log('✅ Auto-Intake: Hydrated Master Data for PDF');
          } else {
            console.warn('⚠️ Auto-Intake: buildMasterDataObject not found. Hydration may be incomplete.');
          }

          const pdfBlob = PDFService.generatePdfFromTemplate(pdfData);
          docData.pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());
          docData.fileName = pdfBlob.getName();
          console.log('✅ Auto-Intake: Generated PDF Blob (' + docData.fileName + ')');
        } else {
          console.warn('⚠️ Auto-Intake: PDFService not available. Skipping PDF generation.');
        }
      } catch (pdfErr) {
        console.error('❌ Auto-Intake: PDF Generation Failed: ' + pdfErr.message);
      }

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
      // Prepare the form data for document generation
      // Merge all original data first, then apply overrides/defaults
      const formData = {
        ...data, // Include ALL intake data (references, employer, etc.)
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
        selectedDocs: data.selectedDocs || ['bail_application', 'indemnitor_agreement'],
        premiumAmount: data.premiumAmount || '',
        bondAmount: data.bondAmount || ''
      };

      // [NEW] Generate PDF from Google Doc Template
      try {
        if (typeof PDFService !== 'undefined' && typeof PDFService.generatePdfFromTemplate === 'function') {

          // 1. Normalize Data for Hydration (Code.js Fix)
          let pdfData = formData;
          if (typeof buildMasterDataObject === 'function') {
            const masterData = buildMasterDataObject(formData);
            pdfData = { ...formData, ...masterData };
            console.log('✅ Hydrated Master Data for PDF');
          } else {
            Logger.log('⚠️ buildMasterDataObject not found.');
          }

          const pdfBlob = PDFService.generatePdfFromTemplate(pdfData);
          formData.pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());
          formData.fileName = pdfBlob.getName();
          Logger.log('✅ Generated PDF Blob for case: ' + formData.caseNumber);
        } else {
          Logger.log('⚠️ PDFService not available. Skipping PDF generation.');
        }
      } catch (pdfErr) {
        Logger.log('❌ PDF Generation Failed: ' + pdfErr.message);
        // We might want to abort or proceed? Let's proceed but warn.
        // Actually, without PDF, SignNow upload will fail if it expects base64.
        // We will log and let it try the downstream fail.
      }

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
  // 0. LINK-AS-SECRET MODE (Fix for Iframe/Wix)
  // If we can't detect the user (iframe), we trust they have the valid script URL.
  if (!email) {
    console.warn('isUserAllowed: No email detected (Iframe/Anonymous). Allowing access via Link-as-Secret policy.');
    return true;
  }

  const emailLower = email.toLowerCase();

  // 1. Allow Admin/Owner
  const ALLOWED_USERS = [
    'brendan@shamrockbailbonds.biz',
    'admin@shamrockbailbonds.biz',
    'shamrockbailoffice@gmail.com' // staff Gmail — kept as explicit exception
  ];

  if (ALLOWED_USERS.includes(emailLower)) return true;

  // 2. Allow Domain (Staff) - RELAXED CHECK
  if (emailLower.endsWith('@shamrockbailbonds.biz')) return true;

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
      name: 'Shamrock Portal' // Sender name
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

/**
 * Handles incoming logs from Wix "Advanced Log Tools"
 * Expects: ?action=logWixEvent&apiKey=...
 */
function handleWixLogEvent(data) {
  try {
    // Log the entire payload to the processing log
    // We strip apiKey/action to keep the log clean if possible, but data is fine
    const logPayload = { ...data };
    delete logPayload.apiKey;
    delete logPayload.action;

    if (typeof logProcessingEvent === 'function') {
      logProcessingEvent('WIX_SYSTEM_LOG', logPayload);
    } else {
      console.log('WIX_SYSTEM_LOG:', JSON.stringify(logPayload));
    }
    return createResponse({ success: true });
  } catch (e) {
    return createErrorResponse(e.message);
  }
}

/**
 * Frontend Wrapper: Get Indemnitor Profile & Documents
 */
function client_getIndemnitorProfile(email) {
  return fetchIndemnitorProfile(email, true);
}
/**
 * Handle Stealth Ping Request Logging
 * Action: log_ping_request
 */
function handleLogPingRequest(data) {
  const SPREADSHEET_ID = '10NtcPx-nmEktlZRuurE5E_ozh7mCXzbYqiNI28JddMs';
  const SHEET_NAME = 'Defendants';

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      // Create if missing, with headers
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["Timestamp", "Defendant Name", "Staff ID", "Status", "Latitude", "Longitude", "Approx Address"]);
    }

    // Append Row
    // usage: [Timestamp, Defendant Name, Staff ID, Status, Lat, Long, Address]
    sheet.appendRow([
      new Date(),
      data.defendantName || 'Unknown',
      data.staffId || 'System',
      'PING_REQUESTED',
      'PENDING', // Lat
      'PENDING', // Long
      'Waiting for check-in...' // Address
    ]);

    return { success: true };
  } catch (e) {
    console.error("Error logging ping request", e);
    return { success: false, error: e.message };
  }
}

/**
 * Endpoint for Dashboard Outreach Tab
 * Dispatches an automated message via Twilio or Telegram.
 * @param {Object} payload - { phone, message, provider }
 */
/**
 * Look up a Telegram Chat ID from a phone number.
 * Searches: CheckInLog, IntakeQueue, ClientUpdates, CaseStatusLookups
 * Called from Dashboard Outreach UI when Telegram provider is selected.
 */
function lookupTelegramChatId(phone) {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { chatId: null, error: 'Unauthorized' };

  if (!phone) return { chatId: null, error: 'No phone provided' };

  var cleanPhone = phone.toString().replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = '1' + cleanPhone;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Sheets to search (in order of reliability)
  var sheetsToSearch = [
    { name: 'CheckInLog', phoneCol: ['phone'], chatIdCol: ['telegramuserid'] },
    { name: 'IntakeQueue', phoneCol: ['indphone', 'ind phone', 'phone', 'defphone', 'def phone'], chatIdCol: ['telegramuserid', 'telegram_user_id'] },
    { name: 'ClientUpdates', phoneCol: ['phone'], chatIdCol: ['telegramuserid'] },
    { name: 'CaseStatusLookups', phoneCol: ['phone'], chatIdCol: ['telegramuserid'] }
  ];

  for (var s = 0; s < sheetsToSearch.length; s++) {
    var cfg = sheetsToSearch[s];
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet || sheet.getLastRow() <= 1) continue;

    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var ci = {};
    headers.forEach(function (h, i) { ci[String(h).toLowerCase().trim()] = i; });

    // Find phone column index
    var phoneIdx = -1;
    for (var p = 0; p < cfg.phoneCol.length; p++) {
      if (ci[cfg.phoneCol[p]] !== undefined) { phoneIdx = ci[cfg.phoneCol[p]]; break; }
    }

    // Find chatId column index
    var chatIdx = -1;
    for (var c = 0; c < cfg.chatIdCol.length; c++) {
      if (ci[cfg.chatIdCol[c]] !== undefined) { chatIdx = ci[cfg.chatIdCol[c]]; break; }
    }

    if (phoneIdx === -1 || chatIdx === -1) continue;

    // Search from bottom up (most recent first)
    for (var r = rows.length - 1; r >= 1; r--) {
      var rowPhone = String(rows[r][phoneIdx] || '').replace(/\D/g, '');
      if (rowPhone.length === 10) rowPhone = '1' + rowPhone;

      var chatId = String(rows[r][chatIdx] || '').trim();

      if (chatId && (rowPhone === cleanPhone || rowPhone.slice(-10) === cleanPhone.slice(-10))) {
        Logger.log('✅ Found Telegram Chat ID ' + chatId + ' for phone ' + cleanPhone.slice(-4) + ' in ' + cfg.name);
        return { chatId: chatId, source: cfg.name };
      }
    }
  }

  Logger.log('⚠️ No Telegram Chat ID found for phone ' + cleanPhone.slice(-4));
  return { chatId: null };
}

function sendOutreachMessage(payload) {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { success: false, error: "Unauthorized" };

  console.log('sendOutreachMessage triggered', JSON.stringify(payload));

  if (!payload || !payload.phone || !payload.message) {
    return { success: false, error: "Missing required fields (phone, message)" };
  }

  const provider = payload.provider || 'twilio';

  try {
    if (provider === 'twilio') {
      const result = NotificationService.sendSms(payload.phone, payload.message);
      if (result && result.success) {
        logProcessingEvent('OUTREACH_TEXT_SENT', { provider: 'twilio', phone: payload.phone });
        return { success: true, sid: result.sid };
      } else {
        return { success: false, error: result.error || "Twilio error" };
      }
    } else if (provider === 'telegram') {
      // Note: For Telegram, the 'phone' field should actually be a chat_id.
      const result = NotificationService.sendTelegram(payload.phone, payload.message);
      if (result && result.success) {
        logProcessingEvent('OUTREACH_TEXT_SENT', { provider: 'telegram', chatId: payload.phone });
        return { success: true };
      } else {
        return { success: false, error: result.error || "Telegram error" };
      }
    } else {
      return { success: false, error: "Unknown provider check" };
    }
  } catch (e) {
    console.error('sendOutreachMessage error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Triggers a direct SMS/Email payment link to the Indemnitor
 * Called from Dashboard after SignNow invite is sent.
 */
function notifyPaymentLink(payload) {
  const email = Session.getActiveUser().getEmail();
  if (!isUserAllowed(email)) return { error: "Unauthorized" };

  try {
    const paymentLink = 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';
    const defendantName = payload.defendantName || 'the defendant';
    const message = `Shamrock Bail Bonds: We have sent paperwork to your email for ${defendantName}. Please sign ASAP.\n\nPremium Payment Link: ${paymentLink}`;

    let smsResult = false;
    let emailResult = false;

    if (payload.indemnitorPhone) {
      const res = NotificationService.sendSms(payload.indemnitorPhone, message);
      if (res && res.success) {
        smsResult = true;
      }
    }

    if (payload.indemnitorEmail) {
      const subject = `Bail Premium Payment Link for ${defendantName}`;
      NotificationService.sendEmail(payload.indemnitorEmail, subject, message, message);
      emailResult = true;
    }

    return { success: true, sms: smsResult, email: emailResult };
  } catch (e) {
    console.error('notifyPaymentLink error:', e);
    return { success: false, error: e.message };
  }
}
