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
// TEMPLATE-BASED SENDS (uses approved WhatsApp templates)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send court date reminder using the approved 'court_date_reminder' template.
 * Falls back to plain text if template is not yet approved.
 * @param {Object} caseData - { phone, name, courtDate, courtTime, courtroom, caseNumber }
 */
function WA_templateCourtReminder(caseData) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const phone = _formatPhone(caseData.phone || caseData.defendantPhone || '');
  if (!phone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('WHATSAPP_COURT_TEMPLATE_NAME') || 'court_date_reminder';

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
    return WA_notifyCourtDateReminder(caseData, 1);
  }
}

/**
 * Send document signature request using the 'document_signature_request' template.
 * Falls back to plain text if template is not yet approved.
 * @param {string} phone - Recipient phone
 * @param {string} name - Recipient name
 * @param {string} signingLink - SignNow URL
 */
function WA_templateDocumentSignature(phone, name, signingLink) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('WHATSAPP_DOCUMENT_TEMPLATE_NAME') || 'document_signature_request';

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
    return WA_notifyDocumentReady(phone, name, signingLink, 'bail bond documents');
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
function WA_templatePaymentRequest(phone, name, amount, status, paymentLink) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('WHATSAPP_PAYMENT_TEMPLATE_NAME') || 'payment_request';
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
    return WA_notifyPaymentOverdue(phone, name, amount, '');
  }
}

/**
 * Send general follow-up / stealth ping using the 'general_followup' template.
 * Falls back to plain text if template is not yet approved.
 * @param {string} phone - Recipient phone
 * @param {string} name - Recipient name
 * @param {string} reference - Reference info (case number, date, etc.)
 */
function WA_templateGeneralFollowup(phone, name, reference) {
  const client = new WhatsAppCloudAPI();
  if (!client.isConfigured()) return { success: false, error: 'Not configured' };
  const formattedPhone = _formatPhone(phone);
  if (!formattedPhone) return { success: false, error: 'Invalid phone' };

  const props = PropertiesService.getScriptProperties();
  const templateName = props.getProperty('WHATSAPP_FOLLOWUP_TEMPLATE_NAME') || 'general_followup';

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
    return WA_sendStealthPing(phone, name, '');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ELEVENLABS VOICE NOTE INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a voice note (audio message) to a WhatsApp number.
 * Designed to work with ElevenLabs TTS audio URLs.
 *
 * The ElevenLabs audio URL must be publicly accessible (use a signed URL or
 * upload to Google Drive / S3 first). The WhatsApp Cloud API accepts MP3 and
 * OGG Opus formats.
 *
 * Typical usage with ElevenLabs:
 *   1. Generate audio via ElevenLabs API → get audio URL
 *   2. Upload to Google Drive or S3 to get a public URL
 *   3. Call WA_sendVoiceNote(phone, publicAudioUrl, logLabel)
 *
 * @param {string} phone - Recipient phone in any format
 * @param {string} audioUrl - Publicly accessible audio URL (MP3 or OGG)
 * @param {string} logLabel - Optional label for logging (e.g. case number)
 * @return {Object} API response
 */
function WA_sendVoiceNote(phone, audioUrl, logLabel) {
  const client = new WhatsAppCloudAPI();
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
    console.error('WA_sendVoiceNote error:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Generate an ElevenLabs voice note and send it via WhatsApp.
 * Requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in Script Properties.
 *
 * @param {string} phone - Recipient phone
 * @param {string} text - Text to convert to speech
 * @param {string} logLabel - Optional label for logging
 * @return {Object} Result with success status
 */
function WA_sendElevenLabsVoiceNote(phone, text, logLabel) {
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

    // Step 4: Send via WhatsApp
    const waResult = WA_sendVoiceNote(phone, publicUrl, logLabel);

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
    console.error('WA_sendElevenLabsVoiceNote error:', e.message);
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
 * Object-style alias for WA_notifyDocumentReady.
 * @param {Object} data - { memberPhone, memberName, signingLink, documentName }
 */
function WA_notifyDocumentReadyObj(data) {
  return WA_notifyDocumentReady(
    data.memberPhone || data.phone || '',
    data.memberName  || data.name  || 'Member',
    data.signingLink || data.link  || '',
    data.documentName || 'bail bond documents'
  );
}

/**
 * Object-style alias for WA_notifyPaymentOverdue.
 * @param {Object} data - { indemnitorPhone, indemnitorName, amountDue, dueDate }
 */
function WA_notifyPaymentOverdueObj(data) {
  return WA_notifyPaymentOverdue(
    data.indemnitorPhone || data.phone || '',
    data.indemnitorName  || data.name  || 'Indemnitor',
    data.amountDue || data.amount || '',
    data.dueDate   || data.date   || ''
  );
}
