//
// ComplianceControls.gs - Core SOC II Compliance Controls
//

/**
 * Data classification schema.
 */
const DATA_CLASSIFICATION = {
  PUBLIC: { level: 0, controls: 'Standard handling' },
  INTERNAL: { level: 1, controls: 'Access logging required' },
  CONFIDENTIAL: { level: 2, controls: 'Encryption, access logging, retention limits' },
  RESTRICTED: { level: 3, controls: 'Script Properties only, no logging of values' }
};

/**
 * Data retention schedule.
 */
const RETENTION_SCHEDULE = {
  'bail_bond_documents': { years: 7, reason: 'Florida legal requirement' },
  'arrest_records': { years: 7, reason: 'Business records' },
  'consent_logs': { years: 7, reason: 'Compliance evidence' },
  'security_logs': { years: 3, reason: 'Security monitoring' },
  'marketing_data': { years: 2, reason: 'Business operations' }
};

/**
 * Records user consent.
 * @param {string} personId The ID of the person giving consent.
 * @param {string} consentType The type of consent being given.
 * @param {boolean} consentGiven True if consent was given.
 */
function recordConsent(personId, consentType, consentGiven) {
  try {
    const sheetId = getSecureCredential('CONSENT_LOG_SHEET_ID');
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('ConsentLog');

    if (!sheet) {
      throw new Error('ConsentLog sheet not found');
    }

    sheet.appendRow([
      new Date().toISOString(),
      personId,
      consentType,
      consentGiven,
      Session.getActiveUser() ? Session.getActiveUser().getEmail() : 'anonymous'
    ]);

    logAccessEvent(personId, 'consent', 'record', { consentType: consentType, consentGiven: consentGiven });
  } catch (e) {
    logSecurityEvent('CONSENT_LOG_FAILURE', { error: e.toString() });
    throw e;
  }
}

/**
 * Checks if a user has given consent.
 * @param {string} personId The ID of the person.
 * @param {string} consentType The type of consent.
 * @returns {boolean} True if consent has been given.
 */
function hasConsent(personId, consentType) {
  try {
    const sheetId = getSecureCredential('CONSENT_LOG_SHEET_ID');
    if (!sheetId) {
      console.warn('hasConsent: Missing CONSENT_LOG_SHEET_ID');
      return false;
    }

    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('ConsentLog');
    if (!sheet) return false;

    // Get all data (Optimization: In a real high-volume app, we'd use a filter or temporary cache)
    const data = sheet.getDataRange().getValues();

    // Columns: [Timestamp, PersonId, ConsentType, ConsentGiven, UserEmail]
    // We search from bottom up for the latest entry
    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];
      if (String(row[1]) === String(personId) && row[2] === consentType) {
        return row[3] === true || row[3] === 'true';
      }
    }

    return false;
  } catch (e) {
    console.error('Error in hasConsent:', e);
    return false; // Fail safe
  }
}

/**
 * Applies retention policies to data.
 */
/**
 * Applies retention policies to data.
 * - Archives/Deletes old rows from Audit Sheets.
 * - Deletes old files from Drive Output Folder.
 */
function applyRetentionPolicies() {
  console.log('🛡️ Starting Retention Policy Enforcement...');

  for (const dataType in RETENTION_SCHEDULE) {
    const retention = RETENTION_SCHEDULE[dataType];
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - retention.years);

    console.log(`Checking ${dataType} (Retention: ${retention.years} years, Cutoff: ${cutoffDate.toISOString()})`);

    try {
      if (dataType === 'security_logs') {
        purgeSheetRows('SecurityEvents', 0, cutoffDate); // Date is Col 0 (A)
        purgeSheetRows('AccessEvents', 0, cutoffDate);
        purgeSheetRows('ProcessingEvents', 0, cutoffDate);
      }
      else if (dataType === 'consent_logs') {
        purgeSheetRows('ConsentLog', 0, cutoffDate);
      }
      else if (dataType === 'bail_bond_documents') {
        purgeOldFiles(cutoffDate);
      }

    } catch (e) {
      console.error(`Failed retention for ${dataType}: ${e.message}`);
      logSecurityEvent('RETENTION_FAILURE', { dataType: dataType, error: e.message });
    }
  }
}

/**
 * Helper: Deletes rows older than cutoff date from a specific tab in the Audit Log Sheet.
 */
function purgeSheetRows(tabName, dateColIndex, cutoffDate) {
  const sheetId = getSecureCredential('AUDIT_LOG_SHEET_ID');
  if (!sheetId) return;

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();
  // Start from bottom to delete safely
  let deleted = 0;

  // Skip header (row 0)
  for (let i = rows.length - 1; i > 0; i--) {
    const rowDate = new Date(rows[i][dateColIndex]);
    if (rowDate < cutoffDate) {
      sheet.deleteRow(i + 1); // deleteRow is 1-indexed
      deleted++;
    }
  }

  if (deleted > 0) {
    console.log(`🗑️ Purged ${deleted} rows from ${tabName}`);
    logProcessingEvent('DATA_PURGED', { source: tabName, count: deleted });
  }
}

/**
 * Helper: Deletes old files from the "Shamrock Completed Bonds" folder.
 */
function purgeOldFiles(cutoffDate) {
  const folderId = getSecureCredential('GOOGLE_DRIVE_OUTPUT_FOLDER_ID');
  if (!folderId) return;

  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  let deleted = 0;

  while (files.hasNext()) {
    const file = files.next();
    if (file.getDateCreated() < cutoffDate) {
      file.setTrashed(true);
      deleted++;
    }
  }

  if (deleted > 0) {
    console.log(`🗑️ Trashed ${deleted} old files from Drive.`);
    logProcessingEvent('FILES_PURGED', { count: deleted });
  }
}

/**
 * SOC II Compliant Wrapper for Wix Portal Integration.
 * Logs access, wraps execution in try/catch, and ensures audit trail.
 * 
 * @param {object} formData - The booking/form data to process.
 * @returns {object} The result of the operation.
 */
function generateAndSendWithWixPortal_Safe(formData) {
  const user = Session.getActiveUser() ? Session.getActiveUser().getEmail() : 'anonymous';
  const caseId = formData.caseNumber || formData['case-number'] || 'UNKNOWN_CASE';

  // 1. Access Log
  if (typeof logAccessEvent === 'function') {
    logAccessEvent(user, 'WixPortal', 'initiate_sync', { caseId: caseId });
  }

  try {
    // 2. Validate Input (Basic)
    if (!formData) throw new Error("No form data provided");

    // 3. Execute Business Logic
    if (typeof generateAndSendWithWixPortal !== 'function') {
      throw new Error("Core function generateAndSendWithWixPortal not found");
    }

    const result = generateAndSendWithWixPortal(formData);

    // 4. Log Success/Failure
    if (result.success) {
      if (typeof logProcessingEvent === 'function') {
        logProcessingEvent('WIX_SYNC_SUCCESS', { caseId: caseId, documentId: result.documentId });
      }
    } else {
      if (typeof logSecurityEvent === 'function') {
        logSecurityEvent('WIX_SYNC_FAILURE', { caseId: caseId, error: result.message });
      }
    }

    return result;

  } catch (e) {
    // 5. Catch & Log Exception
    console.error("Critical Wix Sync Error: " + e.message);
    if (typeof logSecurityEvent === 'function') {
      logSecurityEvent('WIX_SYNC_EXCEPTION', { caseId: caseId, error: e.message, stack: e.stack });
    }
    return { success: false, error: "System Error: " + e.message };
  }
}

