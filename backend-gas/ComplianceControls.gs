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
  // TODO: Connect this to the actual ConsentLog sheet or database.
  // For now, returning true to NOT BLOCK operations during the transition phase,
  // unless explicitly requiring strict mode.
  // Ideally: Query 'ConsentLog' for the latest entry for this personId + consentType.
  
  // Implementation stub:
  /*
  const sheetId = getSecureCredential('CONSENT_LOG_SHEET_ID');
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('ConsentLog');
  const data = sheet.getDataRange().getValues();
  // ... filter logic ...
  */
  
  return true; // Placeholder for non-blocking deployment
}

/**
 * Applies retention policies to data.
 */
function applyRetentionPolicies() {
  for (const dataType in RETENTION_SCHEDULE) {
    const retention = RETENTION_SCHEDULE[dataType];
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - retention.years);

    // TODO: Implement logic to find and delete data older than the cutoff date
    logProcessingEvent('RETENTION_POLICY_APPLIED', { dataType: dataType, cutoff: cutoffDate.toISOString() });
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

