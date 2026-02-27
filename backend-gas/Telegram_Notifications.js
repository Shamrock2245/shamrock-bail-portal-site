/**
 * Telegram_Notifications.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * All outbound Telegram notification functions for business operations.
 * Uses Telegram_CloudAPI.js (TelegramBotAPI class) for sending.
 *
 * Functions:
 *   TG_notifyNewCase(caseData)
 *   TG_notifyCourtDateReminder(caseData, daysUntil)
 *   TG_notifyDocumentReady(phone, name, signingLink)
 *   TG_notifyDocumentSigned(caseData)
 *   TG_notifyPaymentReceived(phone, name, amount)
 *   TG_notifyPaymentOverdue(phone, name, amount, dueDate)
 *   TG_sendStealthPing(phone, name, magicLink)
 *   TG_notifyForfeitureAlert(caseData)
 *   TG_notifyBondDischarge(caseData)
 *   TG_sendBulkCourtReminders()  — triggered daily by time-based trigger
 */

// ─────────────────────────────────────────────────────────────────────────────
// NEW CASE NOTIFICATION
// Sent to indemnitor when a new case is created
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify indemnitor of new case creation.
 * @param {Object} caseData - { indemnitorPhone, indemnitorName, defendantName, caseNumber, bondAmount, county }
 */
function TG_notifyNewCase(caseData) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) {
    console.warn('TG_notifyNewCase: Telegram not configured');
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

  return client.sendMessage(phone, message);
}

// ─────────────────────────────────────────────────────────────────────────────
// COURT DATE REMINDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send court date reminder to defendant and/or indemnitor.
 * @param {Object} caseData - { defendantPhone, defendantName, indemnitorPhone, indemnitorName, courtDate, courtTime, courtroom, caseNumber }
 * @param {number} daysUntil - Days until court date (e.g. 7, 3, 1)
 */
function TG_notifyCourtDateReminder(caseData, daysUntil) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };

  const results = [];
  const courtDate = caseData.courtDate || 'your upcoming court date';
  const courtTime = caseData.courtTime || '';
  const courtroom = caseData.courtroom || '';
  const caseNum = caseData.caseNumber || '';

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
    if (phone) results.push(client.sendMessage(phone, buildMessage(caseData.defendantName || 'Defendant')));
  }

  // Notify indemnitor
  if (caseData.indemnitorPhone) {
    const phone = _formatPhone(caseData.indemnitorPhone);
    if (phone) results.push(client.sendMessage(phone, buildMessage(caseData.indemnitorName || 'Co-signer')));
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
function TG_notifyDocumentReady(phone, name, signingLink, documentName) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };

  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const message =
    '📄 Document Ready — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'Your ' + (documentName || 'bail bond documents') + ' are ready for your electronic signature.\n\n' +
    'Sign here: ' + signingLink + '\n\n' +
    'This link expires in 48 hours. Questions? Call (239) 332-2245.';

  return client.sendMessage(formattedPhone, message);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT SIGNED CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confirm to all parties that documents have been signed.
 * @param {Object} caseData - { defendantPhone, defendantName, indemnitorPhone, indemnitorName, caseNumber }
 */
function TG_notifyDocumentSigned(caseData) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };

  const buildMessage = (name) =>
    '✅ Documents Signed — Shamrock Bail Bonds\n\n' +
    'Hello ' + name + ',\n\n' +
    'We have received your signed documents for case #' + (caseData.caseNumber || 'N/A') + '.\n\n' +
    'Your paperwork is complete. If you have any questions, call (239) 332-2245.';

  const results = [];
  if (caseData.defendantPhone) {
    const p = _formatPhone(caseData.defendantPhone);
    if (p) results.push(client.sendMessage(p, buildMessage(caseData.defendantName || 'Defendant')));
  }
  if (caseData.indemnitorPhone) {
    const p = _formatPhone(caseData.indemnitorPhone);
    if (p) results.push(client.sendMessage(p, buildMessage(caseData.indemnitorName || 'Co-signer')));
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
function TG_notifyPaymentReceived(phone, name, amount) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(phone);
  if (!p) return { success: false, error: 'Invalid phone' };

  return client.sendMessage(p,
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
function TG_notifyPaymentOverdue(phone, name, amount, dueDate) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(phone);
  if (!p) return { success: false, error: 'Invalid phone' };

  const paymentLink = PropertiesService.getScriptProperties().getProperty('PAYMENT_LINK')
    || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';

  return client.sendMessage(p,
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
function TG_sendStealthPing(phone, name, magicLink) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(phone);
  if (!p) return { success: false, error: 'Invalid phone' };

  return client.sendMessage(p,
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
function TG_notifyForfeitureAlert(caseData) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const p = _formatPhone(caseData.indemnitorPhone);
  if (!p) return { success: false, error: 'Invalid phone' };

  return client.sendMessage(p,
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
function TG_notifyBondDischarge(caseData) {
  const client = new TelegramBotAPI();
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
    if (p) results.push(client.sendMessage(p, buildMessage(caseData.defendantName || 'Defendant')));
  }
  if (caseData.indemnitorPhone) {
    const p = _formatPhone(caseData.indemnitorPhone);
    if (p) results.push(client.sendMessage(p, buildMessage(caseData.indemnitorName || 'Co-signer')));
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
function TG_sendBulkCourtReminders() {
  console.log('📅 Running bulk court date reminder check...');
  const config = _getWANotifConfig();
  if (!config.GOOGLE_SHEET_ID) {
    console.warn('TG_sendBulkCourtReminders: GOOGLE_SHEET_ID not set');
    return;
  }

  try {
    const ss = SpreadsheetApp.openById(config.GOOGLE_SHEET_ID);
    const sheet = ss.getSheetByName('Cases');
    if (!sheet) {
      console.warn('TG_sendBulkCourtReminders: "Cases" sheet not found');
      return;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const today = new Date();
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

      const diffMs = courtDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (!REMINDER_DAYS.includes(diffDays)) continue;

      const caseData = {
        defendantPhone: rowObj['DefendantPhone'] || rowObj['defendantPhone'] || '',
        defendantName: rowObj['DefendantName'] || rowObj['defendantName'] || 'Defendant',
        indemnitorPhone: rowObj['IndemnitorPhone'] || rowObj['indemnitorPhone'] || '',
        indemnitorName: rowObj['IndemnitorName'] || rowObj['indemnitorName'] || 'Co-signer',
        courtDate: courtDate.toLocaleDateString('en-US'),
        courtTime: rowObj['CourtTime'] || rowObj['courtTime'] || '',
        courtroom: rowObj['Courtroom'] || rowObj['courtroom'] || '',
        caseNumber: rowObj['CaseNumber'] || rowObj['caseNumber'] || ''
      };

      const result = TG_notifyCourtDateReminder(caseData, diffDays);
      if (result.sent > 0) sent += result.sent;
      console.log('Sent ' + diffDays + '-day reminder for case ' + caseData.caseNumber);
    }

    console.log('Bulk court reminders complete. Total messages sent: ' + sent);
    return { success: true, sent: sent };

  } catch (e) {
    console.error('TG_sendBulkCourtReminders error:', e);
    return { success: false, error: e.message };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE-BASED SENDS (uses approved Telegram templates)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send court date reminder using the approved 'court_date_reminder' template.
 * Falls back to plain text if template is not yet approved.
 * @param {Object} caseData - { phone, name, courtDate, courtTime, courtroom, caseNumber }
 */
function TG_templateCourtReminder(caseData) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const phone = _formatPhone(caseData.phone || caseData.defendantPhone || '');
  if (!phone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('TELEGRAM_COURT_TEMPLATE_NAME') || 'court_date_reminder';

  // Build template components matching the court_date_reminder template:
  // Body: Hello {{1}}, this is a reminder for your court date on {{2}} at {{3}}.
  //       Location: {{4}}. Case #: {{5}}.
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: caseData.name || 'Defendant' },
        { type: 'text', text: caseData.courtDate || 'your court date' },
        { type: 'text', text: caseData.courtTime || 'TBD' },
        { type: 'text', text: caseData.courtroom || 'See your paperwork' },
        { type: 'text', text: caseData.caseNumber || 'N/A' }
      ]
    }
  ];

  try {
    return client.sendTemplate(phone, templateName, 'en_US', components);
  } catch (e) {
    console.warn('Template send failed, falling back to text:', e.message);
    return TG_notifyCourtDateReminder(caseData, 1);
  }
}

/**
 * Send document signature request using the 'document_signature_request' template.
 * Falls back to plain text if template is not yet approved.
 * @param {string} phone - Recipient phone
 * @param {string} name - Recipient name
 * @param {string} signingLink - SignNow URL
 */
function TG_templateDocumentSignature(phone, name, signingLink) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('TELEGRAM_DOCUMENT_TEMPLATE_NAME') || 'document_signature_request';

  // Body: Hello {{1}}, your bail documents are ready for signature. Please sign here: {{2}}
  // Button: Visit Website → dynamic URL ({{1}})
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: name },
        { type: 'text', text: signingLink }
      ]
    },
    {
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [
        { type: 'text', text: signingLink }
      ]
    }
  ];

  try {
    return client.sendTemplate(formattedPhone, templateName, 'en_US', components);
  } catch (e) {
    console.warn('Template send failed, falling back to text:', e.message);
    return TG_notifyDocumentReady(phone, name, signingLink, 'bail bond documents');
  }
}

/**
 * Send payment request using the 'payment_request' template.
 * Falls back to plain text if template is not yet approved.
 * @param {string} phone - Recipient phone
 * @param {string} name - Recipient name
 * @param {string} amount - Amount due (e.g. "$250.00")
 * @param {string} status - Payment status (e.g. "Overdue", "Due Today")
 * @param {string} paymentLink - SwipeSimple or other payment URL
 */
function TG_templatePaymentRequest(phone, name, amount, status, paymentLink) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('TELEGRAM_PAYMENT_TEMPLATE_NAME') || 'payment_request';
  const link = paymentLink || props.getProperty('PAYMENT_LINK') || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';

  // Body: Hello {{1}}, this is a notice regarding your payment of {{2}}. Status: {{3}}. Pay here: {{4}}
  // Button: Visit Website → dynamic URL ({{1}})
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: name },
        { type: 'text', text: amount },
        { type: 'text', text: status },
        { type: 'text', text: link }
      ]
    },
    {
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [
        { type: 'text', text: link }
      ]
    }
  ];

  try {
    return client.sendTemplate(formattedPhone, templateName, 'en_US', components);
  } catch (e) {
    console.warn('Template send failed, falling back to text:', e.message);
    return TG_notifyPaymentOverdue(phone, name, amount, '');
  }
}

/**
 * Send general follow-up / stealth ping using the 'general_followup' template.
 * Falls back to plain text if template is not yet approved.
 * @param {string} phone - Recipient phone
 * @param {string} name - Recipient name
 * @param {string} reference - Reference info (case number, date, etc.)
 */
function TG_templateGeneralFollowup(phone, name, reference) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('TELEGRAM_FOLLOWUP_TEMPLATE_NAME') || 'general_followup';

  // Body: Hello {{1}}, please confirm you received this message regarding your bond status. Reference: {{2}}
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: name },
        { type: 'text', text: reference || 'your bond' }
      ]
    }
  ];

  try {
    return client.sendTemplate(formattedPhone, templateName, 'en_US', components);
  } catch (e) {
    console.warn('Template send failed, falling back to text:', e.message);
    return TG_sendStealthPing(phone, name, '');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ELEVENLABS VOICE NOTE INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a voice note (audio message) to a Telegram number.
 * Designed to work with ElevenLabs TTS audio URLs.
 *
 * The ElevenLabs audio URL must be publicly accessible (use a signed URL or
 * upload to Google Drive / S3 first). The Telegram Cloud API accepts MP3 and
 * OGG Opus formats.
 *
 * Typical usage with ElevenLabs:
 *   1. Generate audio via ElevenLabs API → get audio URL
 *   2. Upload to Google Drive or S3 to get a public URL
 *   3. Call TG_sendVoiceNote(phone, publicAudioUrl, logLabel)
 *
 * @param {string} phone - Recipient phone in any format
 * @param {string} audioUrl - Publicly accessible audio URL (MP3 or OGG)
 * @param {string} logLabel - Optional label for logging (e.g. case number)
 * @return {Object} API response
 */
function TG_sendVoiceNote(phone, audioUrl, logLabel) {
  const client = new TelegramBotAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone number' };
  if (!audioUrl) return { success: false, error: 'No audio URL provided' };

  console.log('🎙️ Sending voice note to ' + formattedPhone + (logLabel ? ' [' + logLabel + ']' : ''));

  try {
    const result = client.sendAudio(formattedPhone, audioUrl);
    console.log('Voice note result:', JSON.stringify(result));
    return result;
  } catch (e) {
    console.error('TG_sendVoiceNote error:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Generate an ElevenLabs voice note and send it via Telegram.
 * Requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in Script Properties.
 *
 * @param {string} phone - Recipient phone
 * @param {string} text - Text to convert to speech
 * @param {string} logLabel - Optional label for logging
 * @return {Object} Result with success status
 */
function TG_sendElevenLabsVoiceNote(phone, text, logLabel) {
  const props = PropertiesService.getScriptProperties();
  const elevenLabsKey = props.getProperty('ELEVENLABS_API_KEY');
  const voiceId = props.getProperty('ELEVENLABS_VOICE_ID') || 'EXAVITQu4vr4xnSDxMaL'; // Default: Bella

  if (!elevenLabsKey) {
    console.error('ELEVENLABS_API_KEY not set in Script Properties');
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  try {
    // Step 1: Generate audio from ElevenLabs
    console.log('🎙️ Generating ElevenLabs audio for: ' + text.substring(0, 50) + '...');
    const elevenLabsUrl = 'https://api.elevenlabs.io/v1/text-to-speech/' + voiceId;
    const audioResponse = UrlFetchApp.fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      payload: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }),
      muteHttpExceptions: true
    });

    if (audioResponse.getResponseCode() !== 200) {
      throw new Error('ElevenLabs API error: ' + audioResponse.getContentText());
    }

    // Step 2: Save audio to Google Drive temporarily
    const audioBlob = audioResponse.getBlob().setName('shamrock_voice_' + Date.now() + '.mp3');
    const folder = DriveApp.getRootFolder(); // Or use a specific folder ID
    const file = folder.createFile(audioBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Step 3: Get public URL (direct download link)
    const fileId = file.getId();
    const publicUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;

    console.log('✅ Audio generated and uploaded: ' + publicUrl);

    // Step 4: Send via Telegram
    const waResult = TG_sendVoiceNote(phone, publicUrl, logLabel);

    // Step 5: Clean up file after 1 hour (set expiry via trigger or just leave it)
    // For now, log the file ID for manual cleanup
    console.log('Audio file ID (for cleanup): ' + fileId);

    return {
      success: waResult.success || false,
      audioFileId: fileId,
      audioUrl: publicUrl,
      waResult: waResult
    };

  } catch (e) {
    console.error('TG_sendElevenLabsVoiceNote error:', e.message);
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

// ─────────────────────────────────────────────────────────────────────────────
// OBJECT-STYLE ALIASES (for callers that pass a single caseData object)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Object-style alias for TG_notifyDocumentReady.
 * @param {Object} data - { memberPhone, memberName, signingLink, documentName }
 */
function TG_notifyDocumentReadyObj(data) {
  return TG_notifyDocumentReady(
    data.memberPhone || data.phone || '',
    data.memberName || data.name || 'Member',
    data.signingLink || data.link || '',
    data.documentName || 'bail bond documents'
  );
}

/**
 * Object-style alias for TG_notifyPaymentOverdue.
 * @param {Object} data - { indemnitorPhone, indemnitorName, amountDue, dueDate }
 */
function TG_notifyPaymentOverdueObj(data) {
  return TG_notifyPaymentOverdue(
    data.indemnitorPhone || data.phone || '',
    data.indemnitorName || data.name || 'Indemnitor',
    data.amountDue || data.amount || '',
    data.dueDate || data.date || ''
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY PAYMENT & CHECK-IN REPORT
// Call via GAS time-driven trigger (daily at 6 PM EST)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a daily Slack summary of payments and check-ins.
 * Reads PaymentLog and CheckInLog sheets, filters to today's entries.
 */
function sendDailyPaymentReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = new Date();
  var todayStr = Utilities.formatDate(today, 'America/New_York', 'yyyy-MM-dd');
  var displayDate = Utilities.formatDate(today, 'America/New_York', 'MMM dd, yyyy');

  // ── Payments ──
  var paymentCount = 0;
  var paymentTotal = 0;
  var paymentSheet = ss.getSheetByName('PaymentLog');
  if (paymentSheet && paymentSheet.getLastRow() > 1) {
    var payData = paymentSheet.getDataRange().getValues();
    for (var i = 1; i < payData.length; i++) {
      var rowDate = payData[i][0]; // Timestamp column
      if (rowDate instanceof Date) {
        var rowStr = Utilities.formatDate(rowDate, 'America/New_York', 'yyyy-MM-dd');
        if (rowStr === todayStr) {
          paymentCount++;
          paymentTotal += parseFloat(payData[i][4]) || 0; // Amount column
        }
      }
    }
  }

  // ── Check-ins ──
  var checkinCount = 0;
  var checkinSheet = ss.getSheetByName('CheckInLog');
  if (checkinSheet && checkinSheet.getLastRow() > 1) {
    var ciData = checkinSheet.getDataRange().getValues();
    for (var j = 1; j < ciData.length; j++) {
      var ciDate = ciData[j][0];
      if (ciDate instanceof Date) {
        var ciStr = Utilities.formatDate(ciDate, 'America/New_York', 'yyyy-MM-dd');
        if (ciStr === todayStr) {
          checkinCount++;
        }
      }
    }
  }

  // ── Build Slack Message ──
  var totalFormatted = '$' + paymentTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  var msg =
    '📊 *Daily Payment & Check-In Report — ' + displayDate + '*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '💳 *Payments Today:* ' + paymentCount + '\n' +
    '💰 *Total Collected:* ' + totalFormatted + '\n' +
    '📍 *Check-Ins Today:* ' + checkinCount + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '_via Telegram Mini App_';

  // Send to Slack
  try {
    var config = getConfig();
    var slackChannel = config.SLACK_WEBHOOK_INTAKE || config.SLACK_WEBHOOK_SHAMROCK;
    if (slackChannel) {
      sendSlackMessage(slackChannel, msg, null);
      Logger.log('✅ Daily payment report sent to Slack');
    } else {
      Logger.log('⚠️ No Slack channel configured for daily report');
    }
  } catch (err) {
    Logger.log('❌ Failed to send daily payment report: ' + err.message);
  }

  return { paymentCount: paymentCount, paymentTotal: paymentTotal, checkinCount: checkinCount };
}


// ─────────────────────────────────────────────────────────────────────────────
// COURT DATE REMINDER SEQUENCES (Feature #2)
// 4-Touch System: 7 days, 3 days, 1 day, morning-of
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schedule the full 4-touch court date reminder sequence.
 * Creates rows in "CourtDateReminders" sheet that get picked up by a trigger.
 * 
 * @param {string} chatId    - Telegram chat ID
 * @param {string} name      - Defendant name
 * @param {string} courtDate - Court date (ISO or parseable)
 * @param {string} caseNum   - Case reference
 * @param {string} courtInfo - Optional court name/location
 */
function TG_scheduleCourtDateSequence(chatId, name, courtDate, caseNum, courtInfo) {
  try {
    var courtDateObj = new Date(courtDate);
    if (isNaN(courtDateObj.getTime())) {
      console.error('Invalid court date: ' + courtDate);
      return { success: false, error: 'Invalid court date' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('CourtDateReminders');
    if (!sheet) {
      sheet = ss.insertSheet('CourtDateReminders');
      sheet.appendRow([
        'ChatId', 'Name', 'CourtDate', 'CaseNumber', 'CourtInfo',
        'Touch', 'SendAt', 'Status', 'SentAt'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Define 4 touches
    var touches = [
      { touch: 1, label: '7-day', daysBefore: 7 },
      { touch: 2, label: '3-day', daysBefore: 3 },
      { touch: 3, label: '1-day', daysBefore: 1 },
      { touch: 4, label: 'morning-of', daysBefore: 0 }
    ];

    var rows = [];
    touches.forEach(function (t) {
      var sendAt = new Date(courtDateObj);
      sendAt.setDate(sendAt.getDate() - t.daysBefore);
      // Morning-of: set to 7 AM EST; others: set to 9 AM EST
      sendAt.setHours(t.daysBefore === 0 ? 7 : 9, 0, 0, 0);

      // Only schedule if sendAt is in the future
      if (sendAt > new Date()) {
        rows.push([
          String(chatId), name, courtDateObj.toISOString(), caseNum || '',
          courtInfo || '', t.label, sendAt.toISOString(), 'pending', ''
        ]);
      }
    });

    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    }

    // Send immediate confirmation
    var bot = new TelegramBotAPI();
    var dateStr = Utilities.formatDate(courtDateObj, 'America/New_York', 'EEEE, MMMM d, yyyy');
    bot.sendMessage(chatId,
      '✅ *Court Date Registered*\n\n' +
      '📅 *Date:* ' + dateStr + '\n' +
      (courtInfo ? '🏛 *Court:* ' + courtInfo + '\n' : '') +
      '\nYou will receive reminders:\n' +
      '• 7 days before\n' +
      '• 3 days before\n' +
      '• 1 day before\n' +
      '• Morning of your court date\n\n' +
      '_Never miss a court date with Shamrock! 🍀_',
      { parse_mode: 'Markdown' }
    );

    if (typeof logBotEvent === 'function') {
      logBotEvent('court_date_scheduled', String(chatId), {
        courtDate: courtDateObj.toISOString(),
        touches: rows.length
      });
    }

    return { success: true, touchesScheduled: rows.length };

  } catch (e) {
    console.error('Failed to schedule court date sequence: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Process pending court date reminders.
 * Called by a time-driven trigger every 30 minutes.
 */
function TG_processCourtDateReminders() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('CourtDateReminders');
    if (!sheet || sheet.getLastRow() < 2) return;

    var data = sheet.getDataRange().getValues();
    var now = new Date();
    var sent = 0;

    for (var i = 1; i < data.length; i++) {
      var status = data[i][7]; // Status column
      if (status !== 'pending') continue;

      var sendAt = new Date(data[i][6]); // SendAt column
      if (sendAt > now) continue; // Not time yet

      var chatId = data[i][0];
      var name = data[i][1];
      var courtDate = new Date(data[i][2]);
      var courtInfo = data[i][4];
      var touch = data[i][5];

      // Send the reminder
      var ok = _sendCourtDateReminder(chatId, name, courtDate, courtInfo, touch);
      if (ok) {
        sheet.getRange(i + 1, 8).setValue('sent');
        sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
        sent++;
      } else {
        sheet.getRange(i + 1, 8).setValue('failed');
      }
    }

    if (sent > 0) {
      console.log('✅ Sent ' + sent + ' court date reminders');
    }

  } catch (e) {
    console.error('Court date reminder processor error: ' + e.message);
  }
}

/**
 * Send a single court date reminder message.
 */
function _sendCourtDateReminder(chatId, name, courtDate, courtInfo, touch) {
  try {
    var dateStr = Utilities.formatDate(courtDate, 'America/New_York', 'EEEE, MMMM d, yyyy');
    var firstName = (name || 'there').split(' ')[0];

    var messages = {
      '7-day': '📅 *Court Date Reminder — 1 Week Away*\n\n' +
        'Hey ' + firstName + ', just a heads up — your court date is in *7 days*.\n\n' +
        '🏛 *Date:* ' + dateStr + '\n' +
        (courtInfo ? '📍 *Court:* ' + courtInfo + '\n' : '') +
        '\n_Need help preparing? Reply or call us anytime!_ 🍀',

      '3-day': '⏰ *Court Date — 3 Days Away*\n\n' +
        firstName + ', your court date is coming up in *3 days*.\n\n' +
        '🏛 *Date:* ' + dateStr + '\n' +
        (courtInfo ? '📍 *Court:* ' + courtInfo + '\n' : '') +
        '\n✅ *Checklist:*\n' +
        '• Confirm transportation\n' +
        '• Dress appropriately\n' +
        '• Arrive 30 minutes early\n' +
        '• Bring valid ID\n\n' +
        '_Questions? We\'re here 24/7._ 🍀',

      '1-day': '🚨 *Court Date — TOMORROW*\n\n' +
        firstName + ', your court appearance is *tomorrow*!\n\n' +
        '🏛 *Date:* ' + dateStr + '\n' +
        (courtInfo ? '📍 *Court:* ' + courtInfo + '\n' : '') +
        '\n⚠️ *Important:*\n' +
        '• Set your alarm\n' +
        '• Plan to arrive 30 min early\n' +
        '• Missing court can result in a warrant\n\n' +
        '_You\'ve got this! Call if you need anything._ 🍀',

      'morning-of': '🔔 *COURT DATE TODAY*\n\n' +
        'Good morning ' + firstName + '! Today is your court date.\n\n' +
        '🏛 *Date:* ' + dateStr + '\n' +
        (courtInfo ? '📍 *Court:* ' + courtInfo + '\n' : '') +
        '\n📞 If there\'s an emergency, call us *immediately*: (239) 332-2245\n\n' +
        '_Good luck today! 🍀_'
    };

    var text = messages[touch] || messages['7-day'];

    var bot = new TelegramBotAPI();
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

    if (typeof logBotEvent === 'function') {
      logBotEvent('court_reminder_sent', String(chatId), { touch: touch });
    }

    return true;
  } catch (e) {
    console.error('Failed to send court reminder: ' + e.message);
    return false;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// ONE-TAP SIGNING DEEP LINK (Feature #3)
// Sends a deep link to the Telegram Documents Mini App
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a one-tap signing link via Telegram.
 * Creates a deep link to the Telegram Documents mini-app for signing.
 * 
 * @param {string} chatId     - Telegram chat ID
 * @param {string} caseNumber - Case/bond reference
 * @param {string} docType    - Document type (e.g., 'bail_application')
 * @param {string} signerName - Name of the person signing
 */
function TG_sendSigningDeepLink(chatId, caseNumber, docType, signerName) {
  try {
    var props = PropertiesService.getScriptProperties();
    var miniAppUrl = props.getProperty('TELEGRAM_MINIAPP_DOCUMENTS_URL')
      || 'https://shamrock-telegram-documents.netlify.app';

    // Construct deep link with signing context
    var params = [
      'case=' + encodeURIComponent(caseNumber || ''),
      'doc=' + encodeURIComponent(docType || ''),
      'signer=' + encodeURIComponent(signerName || ''),
      'source=telegram_deeplink'
    ].join('&');

    // Use Telegram's web_app button
    var bot = new TelegramBotAPI();
    var firstName = (signerName || 'there').split(' ')[0];

    bot.sendMessage(chatId,
      '✍️ *Ready to Sign Your Documents*\n\n' +
      'Hey ' + firstName + ', your bail documents are ready for signing.\n\n' +
      '📋 *Case:* ' + (caseNumber || 'Pending') + '\n' +
      '📄 *Document:* ' + _formatDocType(docType) + '\n\n' +
      'Tap the button below to sign — it takes less than 2 minutes!\n\n' +
      '_Powered by SignNow electronic signatures 🔒_',
      {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: [[{
            text: '✍️ Sign Now — One Tap',
            web_app: { url: miniAppUrl + '?' + params }
          }]]
        })
      }
    );

    if (typeof logBotEvent === 'function') {
      logBotEvent('signing_link_sent', String(chatId), {
        caseNumber: caseNumber,
        docType: docType
      });
    }

    return { success: true };

  } catch (e) {
    console.error('Failed to send signing deep link: ' + e.message);
    return { success: false, error: e.message };
  }
}

function _formatDocType(docType) {
  if (!docType) return 'Bail Bond Documents';
  return docType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}


// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT PROGRESS NOTIFICATIONS (Feature #8)
// Visual progress updates for payment plans
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a payment progress notification to a client.
 * Shows a visual progress bar with payment details.
 * 
 * @param {string} chatId     - Telegram chat ID
 * @param {object} paymentData - { totalDue, totalPaid, nextDueDate, nextDueAmount, planName }
 */
function TG_sendPaymentProgressUpdate(chatId, paymentData) {
  try {
    var totalDue = parseFloat(paymentData.totalDue) || 0;
    var totalPaid = parseFloat(paymentData.totalPaid) || 0;
    var remaining = Math.max(0, totalDue - totalPaid);
    var percent = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

    // Build visual progress bar (20 chars wide)
    var barLength = 20;
    var filled = Math.round(barLength * percent / 100);
    var progressBar = '';
    for (var i = 0; i < barLength; i++) {
      progressBar += i < filled ? '█' : '░';
    }

    // Status emoji
    var statusEmoji = percent >= 100 ? '🎉' : (percent >= 75 ? '🟢' : (percent >= 50 ? '🟡' : '🔵'));

    var text = statusEmoji + ' *Payment Progress Update*\n\n'
      + '```\n'
      + progressBar + ' ' + percent + '%\n'
      + '```\n\n'
      + '💰 *Total Premium:* $' + totalDue.toLocaleString() + '\n'
      + '✅ *Paid:* $' + totalPaid.toLocaleString() + '\n'
      + '📊 *Remaining:* $' + remaining.toLocaleString() + '\n';

    if (paymentData.nextDueDate) {
      var nextDate = new Date(paymentData.nextDueDate);
      var dateStr = Utilities.formatDate(nextDate, 'America/New_York', 'MMM d, yyyy');
      text += '\n📅 *Next Payment:* $' + (parseFloat(paymentData.nextDueAmount) || 0).toLocaleString()
        + ' due ' + dateStr + '\n';
    }

    if (percent >= 100) {
      text += '\n🎉 *Congratulations! Your bond is fully paid off!* 🍀';
    } else {
      text += '\n_Make a payment anytime — reply "pay" or call (239) 332-2245._';
    }

    var replyMarkup = null;
    if (percent < 100) {
      var payUrl = PropertiesService.getScriptProperties().getProperty('SWIPESIMPLE_PAYMENT_LINK') || '';
      if (payUrl) {
        replyMarkup = JSON.stringify({
          inline_keyboard: [[
            { text: '💳 Make a Payment', url: payUrl }
          ]]
        });
      }
    }

    var bot = new TelegramBotAPI();
    var opts = { parse_mode: 'Markdown' };
    if (replyMarkup) opts.reply_markup = replyMarkup;
    bot.sendMessage(chatId, text, opts);

    if (typeof logBotEvent === 'function') {
      logBotEvent('payment_progress_sent', String(chatId), {
        percent: percent,
        remaining: remaining
      });
    }

    return { success: true, percent: percent };

  } catch (e) {
    console.error('Failed to send payment progress: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Process all clients with active payment plans and send weekly progress updates.
 * Called by a time-driven trigger (weekly, Mondays at 10 AM).
 */
function TG_processWeeklyPaymentProgress() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PaymentPlans');
    if (!sheet || sheet.getLastRow() < 2) {
      console.log('No payment plans found');
      return;
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var sent = 0;

    // Find column indices
    var chatIdCol = headers.indexOf('ChatId');
    var totalDueCol = headers.indexOf('TotalDue');
    var totalPaidCol = headers.indexOf('TotalPaid');
    var nextDateCol = headers.indexOf('NextDueDate');
    var nextAmtCol = headers.indexOf('NextDueAmount');
    var statusCol = headers.indexOf('Status');

    if (chatIdCol === -1 || totalDueCol === -1) {
      console.warn('PaymentPlans sheet missing required columns');
      return;
    }

    for (var i = 1; i < data.length; i++) {
      var status = statusCol >= 0 ? String(data[i][statusCol]).toLowerCase() : 'active';
      if (status !== 'active') continue;

      var chatId = String(data[i][chatIdCol]);
      if (!chatId) continue;

      TG_sendPaymentProgressUpdate(chatId, {
        totalDue: data[i][totalDueCol],
        totalPaid: totalPaidCol >= 0 ? data[i][totalPaidCol] : 0,
        nextDueDate: nextDateCol >= 0 ? data[i][nextDateCol] : null,
        nextDueAmount: nextAmtCol >= 0 ? data[i][nextAmtCol] : null
      });
      sent++;
    }

    console.log('✅ Sent ' + sent + ' weekly payment progress updates');

  } catch (e) {
    console.error('Weekly payment progress error: ' + e.message);
  }
}
