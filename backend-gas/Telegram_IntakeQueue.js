/**
 * Telegram_IntakeQueue.js
 *
 * Saves completed Telegram bot intakes to the IntakeQueue Google Sheet,
 * using the EXACT same schema as Wix web leads.
 *
 * This means Telegram intakes appear in Dashboard.html's intake queue
 * alongside all other leads, and must be reviewed and approved by an
 * agent before any documents are generated.
 *
 * FLOW:
 *   Telegram Bot (Telegram_IntakeFlow.js)
 *     → saveTelegramIntakeToQueue()       [this file]
 *       → IntakeQueue sheet (same as Wix)
 *         → Dashboard.html Queue tab
 *           → Agent reviews & clicks "Process"
 *             → handleNewIntake() / generateAndSendWithWixPortal()
 *               → SignNow
 *
 * NON-NEGOTIABLES:
 *   - Does NOT trigger document generation directly.
 *   - Does NOT bypass the agent approval step.
 *   - Uses the same column schema as handleNewIntake() in Code.js.
 *   - Notifies #intake Slack channel on submission.
 *   - Notifies #new-cases Slack channel on submission.
 *
 * Version: 1.0.0
 * Date: 2026-02-20
 */

// =============================================================================
// MAIN FUNCTION: Save Telegram Intake to Queue
// =============================================================================

/**
 * Saves a completed Telegram bot intake to the IntakeQueue sheet.
 * Called by Telegram_IntakeFlow.js when the user confirms their information.
 *
 * @param {object} intakeData - The collected conversation data from the bot.
 *   Expected fields (from shamrock_field_mappings.json canonical schema):
 *     DefName, DefFirstName, DefLastName, DefDOB, DefPhone, DefEmail,
 *     DefAddress, DefCity, DefState, DefZip, DefDL, DefFacility, DefCounty,
 *     DefPhysical, IndName, IndFirstName, IndLastName, IndRelation,
 *     IndPhone, IndEmail, IndAddress, IndCity, IndState, IndZip, IndDOB,
 *     IndEmployer, IndJobTitle, Ref1Name, Ref1Phone, Ref1Relation, Ref1Address,
 *     Ref2Name, Ref2Phone, Ref2Relation, Ref2Address
 * @param {string} telegramUserId - The Telegram chat ID (used as a unique key).
 * @returns {object} - { success: boolean, intakeId: string, row: number }
 */
function telegramIdScanForIntake_(intakeData) {
  var b64 = (intakeData && intakeData.id_image_b64) || '';
  if (!b64 && intakeData && intakeData.Doc_ID_Front) {
    var match = String(intakeData.Doc_ID_Front).match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && typeof DriveApp !== 'undefined') {
      try {
        var blob = DriveApp.getFileById(match[1]).getBlob();
        b64 = Utilities.base64Encode(blob.getBytes());
      } catch (driveErr) {
        console.error('CRM INTAKE ID SCAN FAILED source=telegram error=' + driveErr.message);
      }
    }
  }
  if (!b64 || typeof crmScanIdImage_ !== 'function') return {};
  return crmScanIdImage_(b64, (intakeData && intakeData.id_filename) || 'id.jpg') || {};
}

function saveTelegramIntakeToQueue(intakeData, telegramUserId) {
  intakeData = intakeData || {};
  const intakeId = intakeData.intakeId || intakeData.intake_id ||
    ('TG-' + Date.now() + '-' + (telegramUserId || 'unknown'));
  intakeData.intakeId = intakeId;

  var scan = {};
  try {
    scan = telegramIdScanForIntake_(intakeData) || {};
  } catch (scanErr) {
    console.error('CRM INTAKE ID SCAN FAILED source=telegram error=' + scanErr.message);
  }

  var crmResult = { ok: false, error: 'not_attempted' };
  try {
    if (typeof crmIntakeFromTelegram_ === 'function') {
      crmResult = crmIntakeFromTelegram_(intakeData, { scan: scan }) || crmResult;
    } else {
      console.error('CRM INTAKE FAILED source=telegram status=0 error=crmIntakeFromTelegram_missing');
    }
  } catch (crmErr) {
    console.error('CRM INTAKE FAILED source=telegram status=0 error=' + crmErr.message);
    crmResult = { ok: false, error: crmErr.message };
  }

  if (crmResult.ok) {
    console.log('CRM intake saved ' + (crmResult.intake_id || intakeId) + ' source=' + (crmResult.source || ''));
    return { success: true, intakeId: crmResult.intake_id || intakeId, via: 'crm' };
  }

  console.error('CRM INTAKE FAILED — falling back to IntakeQueue sheet. source=' +
    (crmResult.source || intakeData.source || 'telegram') +
    ' status=' + (crmResult.status || 0) +
    ' error=' + (crmResult.error || 'unknown'));

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- Ensure IntakeQueue sheet exists (same as handleNewIntake) ---
    let sheet = ss.getSheetByName('IntakeQueue');
    if (!sheet) {
      sheet = ss.insertSheet('IntakeQueue');
      sheet.appendRow([
        'Timestamp', 'IntakeID', 'Role', 'Email', 'Phone', 'FullName',
        'DefendantName', 'DefendantPhone', 'CaseNumber', 'Status',
        'References', 'EmployerInfo', 'ResidenceType', 'ProcessedAt',
        'AI_Risk', 'AI_Rationale', 'AI_Score', 'SuretyID'
      ]);
      sheet.setFrozenRows(1);
      console.log('Created IntakeQueue sheet.');
    }

    const timestamp = new Date();

    // --- Build References array (matches handleNewIntake schema) ---
    const references = [];
    if (intakeData.Ref1Name) {
      references.push({
        name: intakeData.Ref1Name || '',
        phone: intakeData.Ref1Phone || '',
        relation: intakeData.Ref1Relation || '',
        address: intakeData.Ref1Address || ''
      });
    }
    if (intakeData.Ref2Name) {
      references.push({
        name: intakeData.Ref2Name || '',
        phone: intakeData.Ref2Phone || '',
        relation: intakeData.Ref2Relation || '',
        address: intakeData.Ref2Address || ''
      });
    }

    // --- Build EmployerInfo object (matches handleNewIntake schema) ---
    const employerInfo = {
      employer: intakeData.IndEmployer || '',
      jobTitle: intakeData.IndJobTitle || '',
      income: intakeData.IndIncome || '',
      employerPhone: intakeData.IndEmpPhone || '',
      employerAddress: intakeData.IndEmpAddress || '',
      supervisor: intakeData.IndSupervisor || ''
    };

    // --- Run AI Flight Risk Analysis (same as handleNewIntake) ---
    let aiRisk = '', aiRationale = '', aiScore = '';
    try {
      if (typeof AI_analyzeFlightRisk === 'function') {
        const aiAnalysis = AI_analyzeFlightRisk({
          name: intakeData.DefName || 'Unknown',
          charges: intakeData.DefCharges || 'Pending',
          bond: '',
          residency: intakeData.DefState || 'FL',
          employment: intakeData.IndEmployer ? 'Employed' : 'Unknown',
          history: 'Unknown',
          ties: intakeData.IndRelation || 'Family'
        });
        aiRisk = aiAnalysis.riskLevel || '';
        aiRationale = aiAnalysis.rationale || '';
        aiScore = aiAnalysis.score || '';
      }
    } catch (aiErr) {
      console.warn('AI analysis skipped for Telegram intake:', aiErr.message);
    }

    // --- Build the row (EXACT same column order as handleNewIntake) ---
    // Columns: Timestamp | IntakeID | Role | Email | Phone | FullName |
    //          DefendantName | DefendantPhone | CaseNumber | Status |
    //          References | EmployerInfo | ResidenceType | ProcessedAt |
    //          AI_Risk | AI_Rationale | AI_Score
    const row = [
      timestamp,
      intakeId,
      'indemnitor',                                          // Role
      intakeData.IndEmail || '',                          // Email
      intakeData.IndPhone || telegramUserId.toString(),   // Phone
      intakeData.IndName || '',                          // FullName (Indemnitor)
      intakeData.DefName || '',                          // DefendantName
      intakeData.DefPhone || '',                          // DefendantPhone
      '',                                                    // CaseNumber (assigned by agent)
      'pending',                                             // Status
      JSON.stringify(references),                            // References (JSON)
      JSON.stringify(employerInfo),                          // EmployerInfo (JSON)
      '',                                                    // ResidenceType (not collected via bot)
      '',                                                    // ProcessedAt (empty until processed)
      aiRisk,
      aiRationale,
      aiScore,
      intakeData.surety_id || 'osi'                           // SuretyID (osi or palmetto)
    ];

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();

    // --- Store the FULL intake data in a separate "TelegramIntakeData" sheet ---
    // This preserves all fields (DOB, address, DL, physical description, etc.)
    // that don't fit in the main IntakeQueue columns, so the agent can see
    // everything when they click "Process" in the Dashboard.
    _saveTelegramFullData(ss, intakeId, intakeData, telegramUserId);

    // --- PIPING TO WIX CMS INTAKEQUEUE ---
    // User requested to send the Telegram bot data directly into Wix CMS IntakeQueue
    try {
      if (typeof getWixPortalConfig === 'function' && typeof sendToWixWithRetry === 'function') {
        const wixConfig = getWixPortalConfig();

        // Map Telegram fields (e.g., IndName) to Wix CMS fields (e.g., indemnitorName)
        const wixMappedData = {
          // System & Consent
          source: 'telegram',
          consentGiven: intakeData.consent || intakeData.consentGiven || false,
          consentTimestamp: intakeData.timestamp ? new Date(intakeData.timestamp) : (intakeData.consentTimestamp ? new Date(intakeData.consentTimestamp) : null),
          notes: 'Submitted via Telegram Mini App.',

          // Case & Defendant
          caseId: intakeId,
          defendantName: intakeData.DefName || '',
          defendantPhone: intakeData.DefPhone || '',
          defendantEmail: intakeData.DefEmail || '',
          county: intakeData.DefCounty || '',
          charges: intakeData.DefCharges || '',
          bondAmount: intakeData.DefBondAmount || '',

          // Indemnitor
          indemnitorName: intakeData.IndName || '',
          indemnitorPhone: intakeData.IndPhone || telegramUserId.toString(),
          indemnitorEmail: intakeData.IndEmail || '',
          indemnitorRelation: intakeData.IndRelation || '',
          indemnitorStreetAddress: intakeData.IndAddress || '',
          indemnitorCity: intakeData.IndCity || '',
          indemnitorState: intakeData.IndState || '',
          indemnitorZipCode: intakeData.IndZip || '',

          // References
          reference1Name: intakeData.Ref1Name || '',
          reference1Phone: intakeData.Ref1Phone || '',
          reference1Relation: intakeData.Ref1Relation || '',
          reference1Address: intakeData.Ref1Address || '',
          reference2Name: intakeData.Ref2Name || '',
          reference2Phone: intakeData.Ref2Phone || '',
          reference2Relation: intakeData.Ref2Relation || '',
          reference2Address: intakeData.Ref2Address || '',

          // Documents
          docIdFront: intakeData.Doc_ID_Front || null,

          // Surety routing — osi (default) or palmetto
          surety_id: intakeData.surety_id || 'osi'
        };

        const payload = {
          apiKey: wixConfig.apiKey,
          intakeData: wixMappedData
        };
        const wixResult = sendToWixWithRetry('/telegramIntake', payload);
        if (wixResult && wixResult.success) {
          console.log('✅ Telegram intake synced cleanly to Wix CMS IntakeQueue: ' + (wixResult.caseId || intakeId));
        } else {
          console.warn('⚠️ Telegram intake saved locally, but Wix CMS sync failed:', wixResult);
        }
      } else {
        console.warn('⚠️ WixPortalIntegration functions not found. Skipping Wix CMS sync.');
      }
    } catch (wixErr) {
      console.error('❌ Error piping Telegram intake to Wix CMS:', wixErr);
    }
    // -------------------------------------

    console.log('✅ Telegram intake saved to queue: ' + intakeId);

    // --- Notify Slack (all relevant channels simultaneously) ---
    try {
      NotificationService.sendNewIntakeAlert({
        intakeId: intakeId,
        defendantName: intakeData.DefName || 'Unknown',
        facility: intakeData.DefFacility || 'Unknown',
        county: intakeData.DefCounty || '',
        indemnitorName: intakeData.IndName || 'Unknown',
        indemnitorPhone: intakeData.IndPhone || '',
        indemnitorRelation: intakeData.IndRelation || '',
        source: 'telegram',
        aiRisk: aiRisk
      });
    } catch (slackErr) {
      console.warn('Slack alert failed (non-critical):', slackErr.message);
    }

    // --- Email Alert to Admin ---
    _sendAdminEmailAlert(intakeData, intakeId, aiRisk);

    // --- Notify the Telegram user that their intake was received ---
    return {
      success: true,
      intakeId: intakeId,
      row: lastRow
    };

  } catch (e) {
    console.error('saveTelegramIntakeToQueue failed:', e.message);
    return { success: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (le) { }
  }
}

// =============================================================================
// FULL DATA STORE: Preserves all bot-collected fields for the agent
// =============================================================================

/**
 * Saves the complete, unabridged intake data to a "TelegramIntakeData" sheet.
 * This is a supplementary record so agents can see every field the bot collected
 * when they click "Process" in the Dashboard.
 *
 * The Dashboard's Queue.process() function will look for this data when
 * hydrating the form fields.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} intakeId
 * @param {object} intakeData
 * @param {string} telegramUserId
 */
function _saveTelegramFullData(ss, intakeId, intakeData, telegramUserId) {
  try {
    let sheet = ss.getSheetByName('TelegramIntakeData');
    if (!sheet) {
      sheet = ss.insertSheet('TelegramIntakeData');
      sheet.appendRow([
        'Timestamp', 'IntakeID', 'TelegramUserID', 'Source',
        // Defendant
        'DefName', 'DefFirstName', 'DefLastName', 'DefDOB',
        'DefPhone', 'DefEmail', 'DefAddress', 'DefCity', 'DefState', 'DefZip',
        'DefDL', 'DefFacility', 'DefCounty', 'DefPhysical',
        'DefCharges', 'DefBondAmount',
        // Indemnitor
        'IndName', 'IndFirstName', 'IndLastName', 'IndRelation',
        'IndPhone', 'IndEmail', 'IndAddress', 'IndCity', 'IndState', 'IndZip',
        'IndDOB', 'IndEmployer', 'IndJobTitle', 'IndIncome',
        // References
        'Ref1Name', 'Ref1Phone', 'Ref1Relation', 'Ref1Address',
        'Ref2Name', 'Ref2Phone', 'Ref2Relation', 'Ref2Address',
        // Location & Consent
        'GPSLatitude', 'GPSLongitude', 'ManualLocation',
        'ConsentGiven', 'ConsentTimestamp',
        // Surety
        'SuretyID',
        // Metadata
        'RawJSON'
      ]);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      intakeId,
      telegramUserId || '',
      'telegram_bot_v2',
      // Defendant
      intakeData.DefName || '',
      intakeData.DefFirstName || '',
      intakeData.DefLastName || '',
      intakeData.DefDOB || '',
      intakeData.DefPhone || '',
      intakeData.DefEmail || '',
      intakeData.DefAddress || '',
      intakeData.DefCity || '',
      intakeData.DefState || 'FL',
      intakeData.DefZip || '',
      intakeData.DefDL || '',
      intakeData.DefFacility || '',
      intakeData.DefCounty || '',
      intakeData.DefPhysical || '',
      intakeData.DefCharges || '',
      intakeData.DefBondAmount || '',
      // Indemnitor
      intakeData.IndName || '',
      intakeData.IndFirstName || '',
      intakeData.IndLastName || '',
      intakeData.IndRelation || '',
      intakeData.IndPhone || telegramUserId.toString(),
      intakeData.IndEmail || '',
      intakeData.IndAddress || '',
      intakeData.IndCity || '',
      intakeData.IndState || 'FL',
      intakeData.IndZip || '',
      intakeData.IndDOB || '',
      intakeData.IndEmployer || '',
      intakeData.IndJobTitle || '',
      intakeData.IndIncome || '',
      // References
      intakeData.Ref1Name || '',
      intakeData.Ref1Phone || '',
