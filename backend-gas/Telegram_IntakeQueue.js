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
function saveTelegramIntakeToQueue(intakeData, telegramUserId) {
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
        'AI_Risk', 'AI_Rationale', 'AI_Score'
      ]);
      sheet.setFrozenRows(1);
      console.log('Created IntakeQueue sheet.');
    }

    const timestamp = new Date();

    // --- Generate a unique Intake ID (prefixed TG- to distinguish source) ---
    const intakeId = 'TG-' + timestamp.getTime() + '-' + (telegramUserId || 'unknown');

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
      aiScore
    ];

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();

    // --- Store the FULL intake data in a separate "TelegramIntakeData" sheet ---
    // This preserves all fields (DOB, address, DL, physical description, etc.)
    // that don't fit in the main IntakeQueue columns, so the agent can see
    // everything when they click "Process" in the Dashboard.
    _saveTelegramFullData(ss, intakeId, intakeData, telegramUserId);

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
        // Indemnitor
        'IndName', 'IndFirstName', 'IndLastName', 'IndRelation',
        'IndPhone', 'IndEmail', 'IndAddress', 'IndCity', 'IndState', 'IndZip',
        'IndDOB', 'IndEmployer', 'IndJobTitle', 'IndIncome',
        // References
        'Ref1Name', 'Ref1Phone', 'Ref1Relation', 'Ref1Address',
        'Ref2Name', 'Ref2Phone', 'Ref2Relation', 'Ref2Address',
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
      intakeData.Ref1Relation || '',
      intakeData.Ref1Address || '',
      intakeData.Ref2Name || '',
      intakeData.Ref2Phone || '',
      intakeData.Ref2Relation || '',
      intakeData.Ref2Address || '',
      // Raw JSON for full fidelity
      JSON.stringify(intakeData)
    ]);

    console.log('✅ Full Telegram intake data saved: ' + intakeId);
  } catch (e) {
    console.warn('_saveTelegramFullData failed (non-critical):', e.message);
  }
}

// =============================================================================
// DASHBOARD INTEGRATION: Retrieve full data when agent clicks "Process"
// =============================================================================

/**
 * Called by Dashboard.html's Queue.process() when an agent clicks "Process"
 * on a Telegram intake (IntakeID starts with "TG-").
 *
 * Returns the full data object so the Dashboard can hydrate all form fields,
 * exactly as it does for Wix intakes.
 *
 * @param {string} intakeId - The TG-prefixed intake ID
 * @returns {object|null} - Full intake data object, or null if not found
 */
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
      if (data[i][idxIntakeId] === intakeId) {
        // Return the full raw JSON for maximum fidelity
        if (idxRawJson !== -1 && data[i][idxRawJson]) {
          try {
            const rawData = JSON.parse(data[i][idxRawJson]);
            // Map canonical fields to the format Dashboard.html expects
            return _mapCanonicalToDashboardFormat(rawData, intakeId);
          } catch (e) {
            console.warn('Failed to parse RawJSON for ' + intakeId);
          }
        }
        // Fallback: build from individual columns
        const item = {};
        headers.forEach((h, idx) => { item[h] = data[i][idx]; });
        return _mapCanonicalToDashboardFormat(item, intakeId);
      }
    }
    return null;
  } catch (e) {
    console.error('getTelegramIntakeFullData failed:', e.message);
    return null;
  }
}

/**
 * Marks a Telegram intake as processed in the 'IntakeQueue' sheet.
 * Called by the Dashboard when an agent processes a Telegram lead.
 *
 * @param {string} intakeId - The TG-prefixed intake ID
 * @returns {boolean} - True if successful, false otherwise
 */
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
        // Found the row. 1-indexed for Apps Script, plus 1 for the loop
        const rowNum = i + 1;
        sheet.getRange(rowNum, idxStatus + 1).setValue('processed');

        if (idxProcessedAt !== -1) {
          sheet.getRange(rowNum, idxProcessedAt + 1).setValue(new Date());
        }

        console.log(`Telegram intake ${intakeId} marked as processed on row ${rowNum}`);
        return true;
      }
    }
    console.warn(`Telegram intake ${intakeId} not found to mark processed.`);
    return false;
  } catch (e) {
    console.error(`markTelegramIntakeProcessed failed for ${intakeId}:`, e.message);
    return false;
  }
}


/**
 * Maps the canonical field names (DefName, IndName, etc.) to the
 * camelCase format that Dashboard.html's hydration logic expects
 * (defendantName, indemnitorFullName, etc.).
 *
 * This is the bridge between the bot's schema and the Dashboard's schema.
 *
 * @param {object} data - Canonical field data
 * @param {string} intakeId - The intake ID
 * @returns {object} - Dashboard-compatible data object
 */
function _mapCanonicalToDashboardFormat(data, intakeId) {
  return {
    // System
    IntakeID: intakeId,
    source: 'telegram',
    Status: 'pending',
    Role: 'indemnitor',

    // Defendant (camelCase for Dashboard hydration)
    DefendantName: data.DefName || '',
    defendantName: data.DefName || '',
    defendantFirstName: data.DefFirstName || '',
    defendantLastName: data.DefLastName || '',
    defendantDOB: data.DefDOB || '',
    defendantPhone: data.DefPhone || '',
    defendantEmail: data.DefEmail || '',
    defendantAddress: data.DefAddress || '',
    defendantCity: data.DefCity || '',
    defendantState: data.DefState || 'FL',
    defendantZip: data.DefZip || '',
    defendantDL: data.DefDL || '',
    defendantFacility: data.DefFacility || '',
    defendantCounty: data.DefCounty || '',
    defendantPhysical: data.DefPhysical || '',
    County: data.DefCounty || '',

    // Indemnitor (camelCase for Dashboard hydration)
    indemnitorFullName: data.IndName || '',
    indemnitorFirstName: data.IndFirstName || '',
    indemnitorLastName: data.IndLastName || '',
    indemnitorRelation: data.IndRelation || '',
    indemnitorPhone: data.IndPhone || '',
    indemnitorEmail: data.IndEmail || '',
    email: data.IndEmail || '',
    phone: data.IndPhone || '',
    indemnitorAddress: data.IndAddress || '',
    indemnitorCity: data.IndCity || '',
    indemnitorState: data.IndState || 'FL',
    indemnitorZip: data.IndZip || '',
    indemnitorDOB: data.IndDOB || '',
    indemnitorEmployerName: data.IndEmployer || '',
    indemnitorJobTitle: data.IndJobTitle || '',
    indemnitorIncome: data.IndIncome || '',

    // References (array format for Dashboard)
    references: [
      {
        name: data.Ref1Name || '',
        phone: data.Ref1Phone || '',
        relation: data.Ref1Relation || '',
        address: data.Ref1Address || ''
      },
      {
        name: data.Ref2Name || '',
        phone: data.Ref2Phone || '',
        relation: data.Ref2Relation || '',
        address: data.Ref2Address || ''
      }
    ].filter(r => r.name), // Remove empty references

    // Flat reference fields (for backward compatibility)
    reference1Name: data.Ref1Name || '',
    reference1Phone: data.Ref1Phone || '',
    reference1Relation: data.Ref1Relation || '',
    reference1Address: data.Ref1Address || '',
    reference2Name: data.Ref2Name || '',
    reference2Phone: data.Ref2Phone || '',
    reference2Relation: data.Ref2Relation || '',
    reference2Address: data.Ref2Address || ''
  };
}

// // =============================================================================
// EMAIL ALERT
// =============================================================================

/**
 * Sends an email alert to admin@shamrockbailbonds.biz when a new Telegram
 * intake is received. This ensures agents are notified even if the Dashboard
 * is not open and Slack is not checked.
 *
 * @param {object} intakeData - Canonical intake data
 * @param {string} intakeId - The generated intake ID
 * @param {string} aiRisk - AI risk level (High/Medium/Low)
 */
function _sendAdminEmailAlert(intakeData, intakeId, aiRisk) {
  try {
    const ADMIN_EMAIL = 'admin@shamrockbailbonds.biz';
    const riskLabel = aiRisk || 'Pending';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    const subject = '📱 New Telegram Intake: ' + (intakeData.DefName || 'Unknown Defendant') +
      ' — ' + (intakeData.DefFacility || 'Unknown Facility');

    const plainBody = [
      'A new bail bond intake was submitted via the Telegram bot.',
      '',
      'INTAKE ID: ' + intakeId,
      'RECEIVED:  ' + timestamp,
      'AI RISK:   ' + riskLabel,
      '',
      '--- DEFENDANT ---',
      'Name:     ' + (intakeData.DefName || '—'),
      'DOB:      ' + (intakeData.DefDOB || '—'),
      'Facility: ' + (intakeData.DefFacility || '—'),
      'County:   ' + (intakeData.DefCounty || '—'),
      'Phone:    ' + (intakeData.DefPhone || '—'),
      'Email:    ' + (intakeData.DefEmail || '—'),
      '',
      '--- CO-SIGNER (INDEMNITOR) ---',
      'Name:         ' + (intakeData.IndName || '—'),
      'DOB:          ' + (intakeData.IndDOB || '—'),
      'Relationship: ' + (intakeData.IndRelation || '—'),
      'Phone:        ' + (intakeData.IndPhone || '—'),
      'Email:        ' + (intakeData.IndEmail || '—'),
      'Address:      ' + (intakeData.IndAddress || '—'),
      'Employer:     ' + (intakeData.IndEmployer || '—'),
      '',
      '--- REFERENCES ---',
      'Ref 1: ' + (intakeData.Ref1Name || '—') + ' | ' + (intakeData.Ref1Phone || '—') + ' | ' + (intakeData.Ref1Relation || '—'),
      'Ref 2: ' + (intakeData.Ref2Name || '—') + ' | ' + (intakeData.Ref2Phone || '—') + ' | ' + (intakeData.Ref2Relation || '—'),
      '',
      '--- ACTION REQUIRED ---',
      'Open the Dashboard → Queue tab → find Intake ID ' + intakeId + ' → click Process.',
      '',
      'Shamrock Bail Bonds | Automated Alert System'
    ].join('\n');

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#0f172a;color:#fff;padding:20px 28px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:20px;">📱 New Telegram Intake</h2>
          <p style="margin:4px 0 0;opacity:.75;font-size:13px;">Received ${timestamp} — AI Risk: <strong>${riskLabel}</strong></p>
        </div>
        <div style="background:#f8f9fc;padding:24px 28px;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="background:#fff;">
              <td colspan="2" style="padding:8px 12px;font-weight:700;color:#0f172a;border-bottom:2px solid #e2e8f0;">DEFENDANT</td>
            </tr>
            <tr><td style="padding:6px 12px;color:#64748b;width:140px;">Name</td><td style="padding:6px 12px;">${intakeData.DefName || '—'}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:6px 12px;color:#64748b;">DOB</td><td style="padding:6px 12px;">${intakeData.DefDOB || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Facility</td><td style="padding:6px 12px;">${intakeData.DefFacility || '—'}${intakeData.DefCounty ? ' (' + intakeData.DefCounty + ' County)' : ''}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:6px 12px;color:#64748b;">Phone</td><td style="padding:6px 12px;">${intakeData.DefPhone || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Email</td><td style="padding:6px 12px;">${intakeData.DefEmail || '—'}</td></tr>
            <tr style="background:#fff;">
              <td colspan="2" style="padding:12px 12px 8px;font-weight:700;color:#0f172a;border-bottom:2px solid #e2e8f0;border-top:2px solid #e2e8f0;">CO-SIGNER (INDEMNITOR)</td>
            </tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Name</td><td style="padding:6px 12px;">${intakeData.IndName || '—'}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:6px 12px;color:#64748b;">DOB</td><td style="padding:6px 12px;">${intakeData.IndDOB || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Relationship</td><td style="padding:6px 12px;">${intakeData.IndRelation || '—'}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:6px 12px;color:#64748b;">Phone</td><td style="padding:6px 12px;">${intakeData.IndPhone || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Email</td><td style="padding:6px 12px;">${intakeData.IndEmail || '—'}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:6px 12px;color:#64748b;">Address</td><td style="padding:6px 12px;">${intakeData.IndAddress || '—'}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Employer</td><td style="padding:6px 12px;">${intakeData.IndEmployer || '—'}${intakeData.IndJobTitle ? ' / ' + intakeData.IndJobTitle : ''}</td></tr>
            <tr style="background:#fff;">
              <td colspan="2" style="padding:12px 12px 8px;font-weight:700;color:#0f172a;border-bottom:2px solid #e2e8f0;border-top:2px solid #e2e8f0;">REFERENCES</td>
            </tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Reference 1</td><td style="padding:6px 12px;">${intakeData.Ref1Name || '—'} &mdash; ${intakeData.Ref1Phone || '—'} &mdash; ${intakeData.Ref1Relation || '—'}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:6px 12px;color:#64748b;">Reference 2</td><td style="padding:6px 12px;">${intakeData.Ref2Name || '—'} &mdash; ${intakeData.Ref2Phone || '—'} &mdash; ${intakeData.Ref2Relation || '—'}</td></tr>
          </table>
          <div style="margin-top:20px;background:#d4af37;padding:14px 20px;border-radius:6px;">
            <strong style="font-size:14px;">Action Required:</strong>
            Open the Dashboard → Queue tab → find Intake ID <code>${intakeId}</code> → click ⬇️ Process
          </div>
          <p style="margin-top:16px;font-size:11px;color:#94a3b8;">Intake ID: ${intakeId} &bull; Source: Telegram Bot &bull; Shamrock Bail Bonds Automated Alert</p>
        </div>
      </div>`;

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });
    console.log('✉️ Admin email alert sent for intake: ' + intakeId);
  } catch (e) {
    console.warn('Admin email alert failed (non-critical):', e.message);
  }
}

// =============================================================================
// EXPORTS (GAS — functions are global, no explicit exports needed)
// =============================================================================
