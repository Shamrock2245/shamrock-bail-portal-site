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

    const employerInfo = {
      employer: intakeData.IndEmployer || '',
      jobTitle: intakeData.IndJobTitle || '',
      income: intakeData.IndIncome || '',
      employerPhone: intakeData.IndEmpPhone || '',
      employerAddress: intakeData.IndEmpAddress || '',
      supervisor: intakeData.IndSupervisor || ''
    };

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

    const row = [
      timestamp,
      intakeId,
      'indemnitor',
      intakeData.IndEmail || '',
      intakeData.IndPhone || telegramUserId.toString(),
      intakeData.IndName || '',
      intakeData.DefName || '',
      intakeData.DefPhone || '',
      '',
      'pending',
      JSON.stringify(references),
      JSON.stringify(employerInfo),
      '',
      '',
      aiRisk,
      aiRationale,
      aiScore,
      intakeData.surety_id || 'osi'
    ];

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();
    _saveTelegramFullData(ss, intakeId, intakeData, telegramUserId);

    try {
      if (typeof getWixPortalConfig === 'function' && typeof sendToWixWithRetry === 'function') {
        const wixConfig = getWixPortalConfig();
        const wixMappedData = {
          source: 'telegram',
          consentGiven: intakeData.consent || intakeData.consentGiven || false,
          consentTimestamp: intakeData.timestamp ? new Date(intakeData.timestamp) : (intakeData.consentTimestamp ? new Date(intakeData.consentTimestamp) : null),
          notes: 'Submitted via Telegram Mini App.',
          caseId: intakeId,
          defendantName: intakeData.DefName || '',
          defendantPhone: intakeData.DefPhone || '',
          defendantEmail: intakeData.DefEmail || '',
          county: intakeData.DefCounty || '',
          charges: intakeData.DefCharges || '',
          bondAmount: intakeData.DefBondAmount || '',
          indemnitorName: intakeData.IndName || '',
          indemnitorPhone: intakeData.IndPhone || telegramUserId.toString(),
          indemnitorEmail: intakeData.IndEmail || '',
          indemnitorRelation: intakeData.IndRelation || '',
          indemnitorStreetAddress: intakeData.IndAddress || '',
          indemnitorCity: intakeData.IndCity || '',
          indemnitorState: intakeData.IndState || '',
          indemnitorZipCode: intakeData.IndZip || '',
          reference1Name: intakeData.Ref1Name || '',
          reference1Phone: intakeData.Ref1Phone || '',
          reference1Relation: intakeData.Ref1Relation || '',
          reference1Address: intakeData.Ref1Address || '',
          reference2Name: intakeData.Ref2Name || '',
          reference2Phone: intakeData.Ref2Phone || '',
          reference2Relation: intakeData.Ref2Relation || '',
          reference2Address: intakeData.Ref2Address || '',
          docIdFront: intakeData.Doc_ID_Front || null,
          surety_id: intakeData.surety_id || 'osi'
        };
        const payload = { apiKey: wixConfig.apiKey, intakeData: wixMappedData };
        const wixResult = sendToWixWithRetry('/telegramIntake', payload);
        if (wixResult && wixResult.success) {
          console.log('Telegram intake synced to Wix CMS IntakeQueue: ' + (wixResult.caseId || intakeId));
        } else {
          console.warn('Telegram intake saved locally, but Wix CMS sync failed:', wixResult);
        }
      }
    } catch (wixErr) {
      console.error('Error piping Telegram intake to Wix CMS:', wixErr);
    }

    console.log('Telegram intake saved to queue: ' + intakeId);
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
    _sendAdminEmailAlert(intakeData, intakeId, aiRisk);
    return { success: true, intakeId: intakeId, row: lastRow };
  } catch (e) {
    console.error('saveTelegramIntakeToQueue failed:', e.message);
    return { success: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (le) { }
  }
}

function _saveTelegramFullData(ss, intakeId, intakeData, telegramUserId) {
  try {
    let sheet = ss.getSheetByName('TelegramIntakeData');
    if (!sheet) {
      sheet = ss.insertSheet('TelegramIntakeData');
      sheet.appendRow(['Timestamp', 'IntakeID', 'TelegramUserID', 'Source', 'DefName', 'IndName', 'RawJSON']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date(), intakeId, telegramUserId || '', 'telegram_bot_v2', intakeData.DefName || '', intakeData.IndName || '', JSON.stringify(intakeData)]);
  } catch (e) {
    console.warn('_saveTelegramFullData failed (non-critical):', e.message);
  }
}

function getTelegramIntakeFullData(intakeId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('TelegramIntakeData');
    if (!sheet) return null;
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idxIntakeId = headers.indexOf('IntakeID');
    const idxRawJson = headers.indexOf('RawJSON');
    if (idxIntakeId === -1) return null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idxIntakeId] === intakeId && idxRawJson !== -1 && data[i][idxRawJson]) {
        return JSON.parse(data[i][idxRawJson]);
      }
    }
    return null;
  } catch (e) {
    console.error('getTelegramIntakeFullData failed:', e.message);
    return null;
  }
}

function markTelegramIntakeProcessed(intakeId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('IntakeQueue');
    if (!sheet) return false;
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idxIntakeId = headers.indexOf('IntakeID');
    const idxStatus = headers.indexOf('Status');
    const idxProcessedAt = headers.indexOf('ProcessedAt');
    if (idxIntakeId === -1 || idxStatus === -1) return false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idxIntakeId] === intakeId) {
        const rowNum = i + 1;
        sheet.getRange(rowNum, idxStatus + 1).setValue('processed');
        if (idxProcessedAt !== -1) sheet.getRange(rowNum, idxProcessedAt + 1).setValue(new Date());
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('markTelegramIntakeProcessed failed:', e.message);
    return false;
  }
}

function _mapCanonicalToDashboardFormat(data, intakeId) {
  return {
    IntakeID: intakeId,
    source: 'telegram',
    defendantName: data.DefName || '',
    indemnitorFullName: data.IndName || '',
    indemnitorPhone: data.IndPhone || '',
    indemnitorEmail: data.IndEmail || '',
    surety_id: data.surety_id || data.SuretyID || 'osi'
  };
}

function _sendAdminEmailAlert(intakeData, intakeId, aiRisk) {
  try {
    MailApp.sendEmail({
      to: 'admin@shamrockbailbonds.biz',
      subject: 'New Telegram Intake: ' + (intakeData.DefName || 'Unknown Defendant'),
      body: 'Intake ' + intakeId + ' for ' + (intakeData.DefName || '') + '. Office 239-332-2245.'
    });
  } catch (e) {
    console.warn('Admin email alert failed (non-critical):', e.message);
  }
}
