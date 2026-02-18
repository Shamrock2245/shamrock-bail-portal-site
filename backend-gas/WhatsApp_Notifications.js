/**
 * WhatsApp_Notifications.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * All outbound WhatsApp notification functions for business operations.
 * Uses WhatsApp_CloudAPI.js (WhatsAppCloudAPI class) for sending.
 *
 * Functions:
 *   WA_notifyNewCase(caseData)
 *   WA_notifyCourtDateReminder(caseData, daysUntil)
 *   WA_notifyDocumentReady(phone, name, signingLink)
 *   WA_notifyDocumentSigned(caseData)
 *   WA_notifyPaymentReceived(phone, name, amount)
 *   WA_notifyPaymentOverdue(phone, name, amount, dueDate)
 *   WA_sendStealthPing(phone, name, magicLink)
 *   WA_notifyForfeitureAlert(caseData)
 *   WA_notifyBondDischarge(caseData)
 *   WA_sendBulkCourtReminders()  — triggered daily by time-based trigger
 */

// ─────────────────────────────────────────────────────────────────────────────
// NEW CASE NOTIFICATION
// Sent to indemnitor when a new case is created
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify indemnitor of new case creation.
 * @param {Object} caseData - { indemnitorPhone, indemnitorName, defendantName, caseNumber, bondAmount, county }
 */
function WA_notifyNewCase(caseData) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) {
    console.warn('WA_notifyNewCase: WhatsApp not configured');
    return { success: false, error: 'Not configured' };
  }

  const phone = _formatPhone(caseData.indemnitorPhone);
  if (!phone) return { success: false, error: 'Invalid phone number' };

  const message =
    'Hello ' + (caseData.indemnitorName || 'there') + ',\n\n' +
    'Shamrock Bail Bonds has processed a new bond for ' + (caseData.defendantName || 'your defendant') + '.\n\n' +
    'Case #: ' + (caseData.caseNumber || 'N/A') + '\n' +
    'Bond Amount: $' + (caseData.bondAmount || 'N/A') + '\n' +
    'County: ' + (caseData.county || 'N/A') + '\n\n' +
    'You will receive paperwork shortly. Reply HELP for options or call (239) 332-2245.';

  return client.sendText(phone, message);
}

// ─────────────────────────────────────────────────────────────────────────────
// COURT DATE REMINDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send court date reminder to defendant and/or indemnitor.
 * @param {Object} caseData - { defendantPhone, defendantName, indemnitorPhone, indemnitorName, courtDate, courtTime, courtroom, caseNumber }
 * @param {number} daysUntil - Days until court date (e.g. 7, 3, 1)
 */
function WA_notifyCourtDateReminder(caseData, daysUntil) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };

  const results = [];
  const courtDate = caseData.courtDate || 'your upcoming court date';
  const courtTime = caseData.courtTime || '';
  const courtroom = caseData.courtroom || '';
  const caseNum   = caseData.caseNumber || '';

  const urgencyLabel = daysUntil === 1 ? 'TOMORROW' : 'in ' + daysUntil + ' days';
  const urgencyEmoji = daysUntil === 1 ? '🚨' : (daysUntil <= 3 ? '⚠️' : '📅');

  const buildMessage = (name) =>
    urgencyEmoji + ' COURT DATE REMINDER — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'You have a court appearance ' + urgencyLabel + ':\n' +
    'Date: ' + courtDate + (courtTime ? ' at ' + courtTime : '') + '\n' +
    (courtroom ? 'Location: ' + courtroom + '\n' : '') +
    (caseNum ? 'Case #: ' + caseNum + '\n' : '') + '\n' +
    'IMPORTANT: Failure to appear may result in bond forfeiture and a warrant for your arrest.\n\n' +
    'Questions? Call Shamrock Bail Bonds: (239) 332-2245';

  // Notify defendant
  if (caseData.defendantPhone) {
    const phone = _formatPhone(caseData.defendantPhone);
    if (phone) results.push(client.sendText(phone, buildMessage(caseData.defendantName || 'Defendant')));
  }

  // Notify indemnitor
  if (caseData.indemnitorPhone) {
    const phone = _formatPhone(caseData.indemnitorPhone);
    if (phone) results.push(client.sendText(phone, buildMessage(caseData.indemnitorName || 'Co-signer')));
  }

  return { success: true, sent: results.length, results: results };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT READY FOR SIGNING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify a signer that their documents are ready.
 * @param {string} phone
 * @param {string} name
 * @param {string} signingLink - SignNow signing URL
 * @param {string} documentName - e.g. "Bail Bond Packet"
 */
function WA_notifyDocumentReady(phone, name, signingLink, documentName) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };

  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const message =
    '📄 Document Ready — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'Your ' + (documentName || 'bail bond documents') + ' are ready for your electronic signature.\n\n' +
    'Sign here: ' + signingLink + '\n\n' +
    'This link expires in 48 hours. Questions? Call (239) 332-2245.';

  return client.sendText(formattedPhone, message);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT SIGNED CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confirm to all parties that documents have been signed.
 * @param {Object} caseData - { defendantPhone, defendantName, indemnitorPhone, indemnitorName, caseNumber }
 */
function WA_notifyDocumentSigned(caseData) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };

  const buildMessage = (name) =>
    '✅ Documents Signed — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'We have received your signed documents for case #' + (caseData.caseNumber || 'N/A') + '.\n\n' +
    'Your paperwork is complete. If you have any questions, call (239) 332-2245.';

  const results = [];
  if (caseData.defendantPhone) {
    const p = _formatPhone(caseData.defendantPhone);
    if (p) results.push(client.sendText(p, buildMessage(caseData.defendantName || 'Defendant')));
  }
  if (caseData.indemnitorPhone) {
    const p = _formatPhone(caseData.indemnitorPhone);
    if (p) results.push(client.sendText(p, buildMessage(caseData.indemnitorName || 'Co-signer')));
  }
  return { success: true, sent: results.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confirm payment received.
 * @param {string} phone
 * @param {string} name
 * @param {string|number} amount
 */
function WA_notifyPaymentReceived(phone, name, amount) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(phone);
  if (!p) return { success: false, error: 'Invalid phone' };

  return client.sendText(p,
    '💚 Payment Received — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'We have received your payment of $' + amount + '. Thank you!\n\n' +
    'Questions? Call (239) 332-2245.'
  );
}

/**
 * Alert of overdue payment.
 * @param {string} phone
 * @param {string} name
 * @param {string|number} amount
 * @param {string} dueDate
 */
function WA_notifyPaymentOverdue(phone, name, amount, dueDate) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(phone);
  if (!p) return { success: false, error: 'Invalid phone' };

  const paymentLink = PropertiesService.getScriptProperties().getProperty('PAYMENT_LINK')
    || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';

  return client.sendText(p,
    '⚠️ Payment Overdue — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'A payment of $' + amount + ' was due on ' + dueDate + ' and has not been received.\n\n' +
    'Pay now: ' + paymentLink + '\n\n' +
    'To avoid bond complications, please pay immediately or call (239) 332-2245.'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEALTH PING (Compliance Check-In Request)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a stealth compliance ping with a magic link.
 * @param {string} phone
 * @param {string} name
 * @param {string} magicLink - Auto-login portal URL
 */
function WA_sendStealthPing(phone, name, magicLink) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(phone);
  if (!p) return { success: false, error: 'Invalid phone' };

  return client.sendText(p,
    'Shamrock Bail Bonds — Status Check Required\n\n' +
    'Hello ' + name + ', please confirm your current status: ' + magicLink
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORFEITURE ALERT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Alert indemnitor of a bond forfeiture.
 * @param {Object} caseData - { indemnitorPhone, indemnitorName, defendantName, caseNumber, bondAmount }
 */
function WA_notifyForfeitureAlert(caseData) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(caseData.indemnitorPhone);
  if (!p) return { success: false, error: 'Invalid phone' };

  return client.sendText(p,
    '🚨 URGENT — Bond Forfeiture Notice\n\n' +
    'Hello ' + (caseData.indemnitorName || 'Co-signer') + ',\n\n' +
    'A forfeiture has been filed on the bond for ' + (caseData.defendantName || 'your defendant') + ' (Case #' + (caseData.caseNumber || 'N/A') + ').\n\n' +
    'Bond Amount at Risk: $' + (caseData.bondAmount || 'N/A') + '\n\n' +
    'You MUST call Shamrock Bail Bonds IMMEDIATELY: (239) 332-2245\n' +
    'This is time-sensitive. Failure to act may result in full bond liability.'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOND DISCHARGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify all parties of bond discharge.
 * @param {Object} caseData - { defendantPhone, defendantName, indemnitorPhone, indemnitorName, caseNumber }
 */
function WA_notifyBondDischarge(caseData) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };

  const buildMessage = (name) =>
    '✅ Bond Discharged — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'The bond for case #' + (caseData.caseNumber || 'N/A') + ' has been officially discharged. ' +
    'All obligations under this bond are now complete.\n\n' +
    'Thank you for choosing Shamrock Bail Bonds. Call (239) 332-2245 if you have questions.';

  const results = [];
  if (caseData.defendantPhone) {
    const p = _formatPhone(caseData.defendantPhone);
    if (p) results.push(client.sendText(p, buildMessage(caseData.defendantName || 'Defendant')));
  }
  if (caseData.indemnitorPhone) {
    const p = _formatPhone(caseData.indemnitorPhone);
    if (p) results.push(client.sendText(p, buildMessage(caseData.indemnitorName || 'Co-signer')));
  }
  return { success: true, sent: results.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK COURT DATE REMINDERS (Time-triggered daily)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scan all active cases for upcoming court dates and send reminders.
 * Set up a daily time-based trigger in GAS to call this function.
 * Sends reminders at: 7 days, 3 days, 1 day before court date.
 */
function WA_sendBulkCourtReminders() {
  console.log('📅 Running bulk court date reminder check...');
  const config = _getWANotifConfig();
  if (!config.GOOGLE_SHEET_ID) {
    console.warn('WA_sendBulkCourtReminders: GOOGLE_SHEET_ID not set');
    return;
  }

  try {
    const ss    = SpreadsheetApp.openById(config.GOOGLE_SHEET_ID);
    const sheet = ss.getSheetByName('Cases');
    if (!sheet) {
      console.warn('WA_sendBulkCourtReminders: "Cases" sheet not found');
      return;
    }

    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const today   = new Date();
    today.setHours(0, 0, 0, 0);

    const REMINDER_DAYS = [7, 3, 1];
    let sent = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowObj = {};
      headers.forEach((h, idx) => { rowObj[h] = row[idx]; });

      // Skip inactive cases
      const status = (rowObj['Status'] || rowObj['status'] || '').toLowerCase();
      if (['discharged', 'forfeited', 'closed', 'cancelled'].includes(status)) continue;

      // Parse court date
      const courtDateRaw = rowObj['CourtDate'] || rowObj['courtDate'] || rowObj['Court Date'] || '';
      if (!courtDateRaw) continue;
      const courtDate = new Date(courtDateRaw);
      courtDate.setHours(0, 0, 0, 0);

      const diffMs   = courtDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (!REMINDER_DAYS.includes(diffDays)) continue;

      const caseData = {
        defendantPhone:  rowObj['DefendantPhone'] || rowObj['defendantPhone'] || '',
        defendantName:   rowObj['DefendantName']  || rowObj['defendantName']  || 'Defendant',
        indemnitorPhone: rowObj['IndemnitorPhone']|| rowObj['indemnitorPhone']|| '',
        indemnitorName:  rowObj['IndemnitorName'] || rowObj['indemnitorName'] || 'Co-signer',
        courtDate:       courtDate.toLocaleDateString('en-US'),
        courtTime:       rowObj['CourtTime'] || rowObj['courtTime'] || '',
        courtroom:       rowObj['Courtroom'] || rowObj['courtroom'] || '',
        caseNumber:      rowObj['CaseNumber']|| rowObj['caseNumber']|| ''
      };

      const result = WA_notifyCourtDateReminder(caseData, diffDays);
      if (result.sent > 0) sent += result.sent;
      console.log('Sent ' + diffDays + '-day reminder for case ' + caseData.caseNumber);
    }

    console.log('Bulk court reminders complete. Total messages sent: ' + sent);
    return { success: true, sent: sent };

  } catch (e) {
    console.error('WA_sendBulkCourtReminders error:', e);
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function _formatPhone(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '1' + cleaned;
  if (cleaned.length < 11) return null;
  return '+' + cleaned;
}

function _getWANotifConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    GOOGLE_SHEET_ID: props.getProperty('GOOGLE_SHEET_ID') || ''
  };
}
