/**
 * Utilities.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Single canonical source for all shared utility functions.
 * All other GAS files should call these functions rather than
 * maintaining their own local copies.
 *
 * Consolidates duplicates found in:
 *   - WebhookHandler.js, Telegram_PhotoHandler.js → getFileExtension()
 *   - ArrestScraper_LeeCounty.js, ComprehensiveMenuSystem.js, MCPHelpers.js → formatDate_()
 *   - LeadScoringSystem.js, QualifiedTabRouter.js → getOrCreateSheet_()
 *   - ComprehensiveMenuSystem.js, MCPHelpers.js → mapSheetDataToForm_(), parseChargesFromSheet_()
 *   - SetupUtilities.js, SystemHealthCheck.js → runSystemDiagnostics()
 *
 * @version 1.0.0
 * @author  Manus AI (deduplication pass 2026-02-20)
 */

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Get file extension from a MIME type.
 * Canonical version — previously duplicated in WebhookHandler.js and
 * Telegram_PhotoHandler.js.
 *
 * @param {string} mimeType - MIME type string (e.g. 'image/jpeg')
 * @returns {string}        - File extension including dot (e.g. '.jpg')
 */
function getFileExtension(mimeType) {
  const mimeMap = {
    'image/jpeg':                 '.jpg',
    'image/jpg':                  '.jpg',
    'image/png':                  '.png',
    'image/gif':                  '.gif',
    'image/webp':                 '.webp',
    'image/heic':                 '.heic',
    'image/heif':                 '.heif',
    'application/pdf':            '.pdf',
    'application/msword':         '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain':                 '.txt',
    'audio/ogg':                  '.ogg',
    'audio/mpeg':                 '.mp3',
    'audio/mp4':                  '.m4a',
    'video/mp4':                  '.mp4',
    'video/quicktime':            '.mov',
  };
  return mimeMap[mimeType] || '.bin';
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Format a date value to MM/DD/YYYY string.
 * Canonical version — previously duplicated in ArrestScraper_LeeCounty.js,
 * ComprehensiveMenuSystem.js, and MCPHelpers.js.
 *
 * @param {Date|string|number} dateValue - Date to format
 * @returns {string}                     - Formatted date string
 */
function formatDate_(dateValue) {
  if (!dateValue) return '';
  try {
    const d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    const year  = d.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    return String(dateValue);
  }
}

/**
 * Format a date to a long human-readable string (e.g. "February 20, 2026").
 * @param {Date|string} dateValue
 * @returns {string}
 */
function formatDateLong(dateValue) {
  if (!dateValue) return '';
  try {
    const d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return String(dateValue);
  }
}

/**
 * Format a date + time to a readable string (e.g. "Feb 20, 2026 at 2:30 PM").
 * @param {Date|string} dateValue
 * @returns {string}
 */
function formatDateTime(dateValue) {
  if (!dateValue) return '';
  try {
    const d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  } catch (e) {
    return String(dateValue);
  }
}

// =============================================================================
// GOOGLE SHEETS UTILITIES
// =============================================================================

/**
 * Get or create a sheet by name within a spreadsheet.
 * Canonical version — previously duplicated in LeadScoringSystem.js and
 * QualifiedTabRouter.js.
 *
 * @param {Spreadsheet} ss   - Google Spreadsheet object
 * @param {string}      name - Sheet name to find or create
 * @returns {Sheet}          - Google Sheet object
 */
function getOrCreateSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Map a row of sheet data to a form-compatible object.
 * Canonical version — previously duplicated in ComprehensiveMenuSystem.js
 * and MCPHelpers.js.
 *
 * @param {Array} sheetData - Row data from a Google Sheet
 * @returns {Object}        - Mapped form data object
 */
function mapSheetDataToForm_(sheetData) {
  if (!sheetData || !sheetData.length) return {};
  // Standard 34-column schema mapping
  return {
    defendantFirstName:  sheetData[0]  || '',
    defendantLastName:   sheetData[1]  || '',
    defendantDOB:        formatDate_(sheetData[2]),
    defendantAddress:    sheetData[3]  || '',
    defendantCity:       sheetData[4]  || '',
    defendantState:      sheetData[5]  || 'FL',
    defendantZip:        sheetData[6]  || '',
    defendantPhone:      sheetData[7]  || '',
    defendantSSN:        sheetData[8]  || '',
    chargeDescription:   sheetData[9]  || '',
    bondAmount:          sheetData[10] || '',
    county:              sheetData[11] || '',
    jailName:            sheetData[12] || '',
    bookingNumber:       sheetData[13] || '',
    arrestDate:          formatDate_(sheetData[14]),
    caseNumber:          sheetData[15] || '',
    indemnitorFirstName: sheetData[16] || '',
    indemnitorLastName:  sheetData[17] || '',
    indemnitorDOB:       formatDate_(sheetData[18]),
    indemnitorAddress:   sheetData[19] || '',
    indemnitorCity:      sheetData[20] || '',
    indemnitorState:     sheetData[21] || 'FL',
    indemnitorZip:       sheetData[22] || '',
    indemnitorPhone:     sheetData[23] || '',
    indemnitorEmail:     sheetData[24] || '',
    indemnitorEmployer:  sheetData[25] || '',
    indemnitorRelation:  sheetData[26] || '',
    reference1Name:      sheetData[27] || '',
    reference1Phone:     sheetData[28] || '',
    reference2Name:      sheetData[29] || '',
    reference2Phone:     sheetData[30] || '',
    premiumAmount:       sheetData[31] || '',
    agentName:           sheetData[32] || '',
    bondDate:            formatDate_(sheetData[33]),
  };
}

/**
 * Parse charges from a sheet row.
 * Canonical version — previously duplicated in ComprehensiveMenuSystem.js
 * and MCPHelpers.js.
 *
 * @param {Array} sheetData - Row data from a Google Sheet
 * @returns {Array}         - Array of charge objects
 */
function parseChargesFromSheet_(sheetData) {
  if (!sheetData) return [];
  const chargeStr = sheetData[9] || '';
  if (!chargeStr) return [];

  return chargeStr.split(/[;,\n]+/).map(c => c.trim()).filter(Boolean).map(charge => ({
    description: charge,
    statute:     '',
    degree:      '',
  }));
}

// =============================================================================
// GOOGLE DRIVE UTILITIES
// =============================================================================

/**
 * Get or create a subfolder within a parent folder.
 * This is the canonical version used by PDF_Processor.js and any other
 * file that needs Drive folder management.
 *
 * @param {string|Folder} parentOrId - Parent folder or folder ID
 * @param {string}        name       - Subfolder name to find or create
 * @returns {Folder}                 - Google Drive Folder object
 */
function getOrCreateDriveSubfolder(parentOrId, name) {
  let parent;
  if (typeof parentOrId === 'string') {
    try {
      parent = DriveApp.getFolderById(parentOrId);
    } catch (e) {
      parent = DriveApp.getRootFolder();
    }
  } else {
    parent = parentOrId || DriveApp.getRootFolder();
  }

  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

/**
 * Get the Shamrock root Drive folder from Script Properties.
 * Falls back to My Drive root if not configured.
 *
 * @returns {Folder} - Google Drive Folder object
 */
function getShamrockRootFolder() {
  const props    = PropertiesService.getScriptProperties();
  const folderId = props.getProperty('GOOGLE_DRIVE_FOLDER_ID');
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) { /* fall through */ }
  }
  return DriveApp.getRootFolder();
}

/**
 * Build the canonical Drive folder path for a completed bond case.
 * Follows the naming convention: LastNameFirstInitial_YYYYMMDD
 * e.g., "JonesBob21026" per project convention.
 *
 * @param {string} defendantLastName  - Defendant's last name
 * @param {string} defendantFirstName - Defendant's first name
 * @param {Date}   bondDate           - Date the bond was written
 * @returns {string}                  - Canonical folder name
 */
function buildCaseFolderName(defendantLastName, defendantFirstName, bondDate) {
  const last    = (defendantLastName  || 'Unknown').replace(/[^a-zA-Z]/g, '');
  const first   = (defendantFirstName || '').replace(/[^a-zA-Z]/g, '').substring(0, 3);
  const d       = (bondDate instanceof Date) ? bondDate : new Date(bondDate || Date.now());
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `${last}${first}${dateStr}`;
}

// =============================================================================
// STRING & VALIDATION UTILITIES
// =============================================================================

/**
 * Sanitize a user-supplied string for safe storage and display.
 * Strips HTML, limits length, trims whitespace.
 *
 * @param {string} input   - Raw user input
 * @param {number} maxLen  - Maximum allowed length (default 200)
 * @returns {string}       - Sanitized string
 */
function sanitizeInput(input, maxLen) {
  if (!input) return '';
  return input
    .toString()
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/[^\w\s\-\.,#@'\/()]/g, '') // Allow only safe chars
    .trim()
    .substring(0, maxLen || 200);
}

/**
 * Sanitize a filename — remove path traversal chars, limit length.
 * @param {string} name - Raw filename
 * @returns {string}    - Safe filename
 */
function sanitizeFilename(name) {
  if (!name) return 'document';
  return name
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\./, '_')
    .trim()
    .substring(0, 100);
}

/**
 * Validate a US phone number and return E.164 format.
 * @param {string} input - Raw phone number
 * @returns {string|null} - E.164 formatted phone or null if invalid
 */
function parsePhoneNumber(input) {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return null;
}

/**
 * Validate an email address.
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Format a currency amount as a USD string.
 * @param {number|string} amount - Amount to format
 * @returns {string}             - Formatted string (e.g. "$1,250.00")
 */
function formatCurrency(amount) {
  const num = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '$0.00';
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// =============================================================================
// SYSTEM DIAGNOSTICS
// =============================================================================

/**
 * Run system diagnostics and return a health report.
 * Canonical version — previously duplicated in SetupUtilities.js and
 * SystemHealthCheck.js. Both files should call this function.
 *
 * @returns {Object} - Health report object
 */
function runSystemDiagnostics() {
  const report = {
    timestamp:  new Date().toISOString(),
    status:     'ok',
    checks:     [],
    warnings:   [],
    errors:     [],
  };

  // Check Script Properties
  try {
    const props = PropertiesService.getScriptProperties().getProperties();
    const requiredKeys = [
      'TELEGRAM_BOT_TOKEN',
      'ELEVENLABS_API_KEY',
      'SIGNNOW_CLIENT_ID',
      'SIGNNOW_CLIENT_SECRET',
      'WIX_WEBHOOK_SECRET',
      'GOOGLE_DRIVE_FOLDER_ID',
      'SPREADSHEET_ID',
    ];
    requiredKeys.forEach(key => {
      if (props[key]) {
        report.checks.push({ key, status: 'configured' });
      } else {
        report.warnings.push({ key, status: 'missing', message: `${key} not set in Script Properties` });
        report.status = 'warning';
      }
    });
  } catch (e) {
    report.errors.push({ check: 'script_properties', error: e.message });
    report.status = 'error';
  }

  // Check Drive folder access
  try {
    const folder = getShamrockRootFolder();
    report.checks.push({ check: 'drive_folder', status: 'accessible', name: folder.getName() });
  } catch (e) {
    report.warnings.push({ check: 'drive_folder', status: 'inaccessible', error: e.message });
    if (report.status === 'ok') report.status = 'warning';
  }

  // Check Spreadsheet access
  try {
    const props = PropertiesService.getScriptProperties();
    const ssId  = props.getProperty('SPREADSHEET_ID');
    if (ssId) {
      const ss = SpreadsheetApp.openById(ssId);
      report.checks.push({ check: 'spreadsheet', status: 'accessible', name: ss.getName() });
    }
  } catch (e) {
    report.warnings.push({ check: 'spreadsheet', status: 'inaccessible', error: e.message });
    if (report.status === 'ok') report.status = 'warning';
  }

  console.log('[Utilities] System diagnostics:', JSON.stringify(report, null, 2));
  return report;
}

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

/**
 * Log a processing event to the console and optionally to Sheets.
 * This is the canonical version. Files that previously called their own
 * logProcessingEvent() should call this one.
 *
 * @param {string} eventType - Event type label (e.g. 'INTAKE_COMPLETE')
 * @param {Object} metadata  - Additional data to log
 */
function logProcessingEvent(eventType, metadata) {
  const entry = {
    timestamp: new Date().toISOString(),
    eventType: eventType,
    ...metadata,
  };
  console.log(`[Event] ${eventType}:`, JSON.stringify(entry));

  // Optionally write to Sheets audit log
  try {
    const props = PropertiesService.getScriptProperties();
    const ssId  = props.getProperty('SPREADSHEET_ID');
    if (!ssId) return;
    const ss    = SpreadsheetApp.openById(ssId);
    const sheet = getOrCreateSheet_(ss, 'AuditLog');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'EventType', 'Data']);
    }
    sheet.appendRow([entry.timestamp, eventType, JSON.stringify(metadata)]);
  } catch (e) {
    // Non-fatal — logging to Sheets is best-effort
    console.warn('[Utilities] Could not write to AuditLog sheet:', e.message);
  }
}
