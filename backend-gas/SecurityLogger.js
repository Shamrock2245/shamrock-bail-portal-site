//
// SecurityLogger.gs - Centralized Logging for Compliance
//

/**
 * Logs a security-related event.
 * @param {string} eventType The type of event (e.g., LOGIN_FAILURE, WEBHOOK_INVALID).
 * @param {object} details Additional event details.
 */
function logSecurityEvent(eventType, details) {
  _logToSheet(
    getSecureCredential("AUDIT_LOG_SHEET_ID"),
    "SecurityEvents",
    [
      new Date().toISOString(),
      eventType,
      Session.getActiveUser() ? Session.getActiveUser().getEmail() : "anonymous",
      details ? JSON.stringify(details) : "{}",
    ]
  );
}

/**
 * Logs a data processing event.
 * @param {string} eventType The type of event (e.g., DOCUMENT_GENERATED, PDF_DOWNLOADED).
 * @param {object} details Additional event details.
 */
function logProcessingEvent(eventType, details) {
  _logToSheet(
    getSecureCredential("AUDIT_LOG_SHEET_ID"),
    "ProcessingEvents",
    [
      new Date().toISOString(),
      eventType,
      details ? JSON.stringify(details) : "{}",
    ]
  );
}

/**
 * Logs an access event.
 * @param {string} userId The ID of the user accessing the resource.
 * @param {string} resource The resource being accessed.
 * @param {string} action The action being performed.
 * @param {object} details Additional event details.
 */
function logAccessEvent(userId, resource, action, details) {
  _logToSheet(
    getSecureCredential("AUDIT_LOG_SHEET_ID"),
    "AccessEvents",
    [
      new Date().toISOString(),
      userId,
      resource,
      action,
      details ? JSON.stringify(details) : "{}",
    ]
  );
}

/**
 * Helper function to append a row to a specified sheet.
 * @param {string} sheetId The ID of the Google Sheet.
 * @param {string} sheetName The name of the sheet.
 * @param {Array} rowData The data to append.
 */
function _logToSheet(sheetId, sheetName, rowData) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
    if (sheet) {
      sheet.appendRow(rowData);
    } else {
      console.error(`Sheet "${sheetName}" not found in spreadsheet ${sheetId}`);
      // Fallback: Try to log to console if sheet fails
      console.log(`[${sheetName}]`, rowData);
    }
  } catch (e) {
    console.error(`Failed to log to sheet: ${e.toString()}`);
  }
}
