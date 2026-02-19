/**
 * WhatsApp_Webhook.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Handles inbound WhatsApp messages forwarded from the Wix webhook.
 * Called by Code.js doPost() when action === 'whatsapp_inbound_message'
 *
 * Message routing logic:
 *   - If message looks like a 6-digit OTP reply → validate OTP
 *   - If message is a check-in keyword → log check-in
 *   - If message is a payment keyword → send payment link
 *   - Otherwise → send to AI Concierge or default reply
 */

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// Called from Code.js doPost() dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle an inbound WhatsApp message forwarded from Wix.
 * @param {Object} data - { from, name, messageId, type, body, timestamp }
 * @return {Object} result
 */
function handleWhatsAppInbound(data) {
  const from = data.from || '';
  const name = data.name || 'Unknown';
  const body = (data.body || '').trim();
  const type = data.type || 'text';
  const messageId = data.messageId || '';

  console.log('📩 WhatsApp inbound from +' + from + ' (' + name + '): "' + body + '"');

  // Log to Google Sheet
  _logInboundMessage(from, name, body, type, messageId);

  // ── Route based on content ─────────────────────────────────────────────────

  // 1. 6-digit OTP reply
  if (/^\d{6}$/.test(body)) {
    return _handleOTPReply(from, body);
  }

  // 2. Check-in keywords
  const lowerBody = body.toLowerCase();
  if (['here', 'checked in', 'check in', 'im here', "i'm here", 'present'].includes(lowerBody)) {
    return _handleCheckIn(from, name, body);
  }

  // 3. Payment keywords
  if (lowerBody.includes('pay') || lowerBody.includes('payment') || lowerBody.includes('balance')) {
    return _handlePaymentInquiry(from, name);
  }

  // 4. Help / menu
  if (['help', 'menu', 'hi', 'hello', 'hey', 'start'].includes(lowerBody)) {
    return _handleHelpMenu(from, name);
  }

  // 5. STOP / unsubscribe
  if (['stop', 'unsubscribe', 'cancel', 'quit'].includes(lowerBody)) {
    return _handleStop(from, name);
  }

  // 6. Location / Office
  if (lowerBody.includes('location') || lowerBody.includes('office') || lowerBody.includes('address') || lowerBody.includes('map')) {
    return _handleLocation(from, name);
  }

  // 7. Forms
  if (lowerBody.includes('form') || lowerBody.includes('paperwork') || lowerBody.includes('download')) {
    return _handleForms(from, name);
  }

  // 8. Review / Feedback
  if (lowerBody.includes('review') || lowerBody.includes('feedback') || lowerBody.includes('rate')) {
    return _handleReviewRequest(from, name);
  }

  // 9. Default — acknowledge and route to staff
  return _handleDefault(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

function _handleOTPReply(from, code) {
  console.log('🔑 OTP reply from +' + from + ': ' + code);
  // The OTP validation is handled server-side by WA_validateOTP in WhatsApp_Auth.js
  // Here we just acknowledge receipt
  const client = new WhatsAppCloudAPI();
  const formattedPhone = '+' + from;
  client.sendText(formattedPhone, 'Your code has been received. Verifying...');
  return { success: true, action: 'otp_received', from: from };
}

function _handleCheckIn(from, name, body) {
  console.log('✅ Check-in from +' + from + ' (' + name + ')');

  // Log check-in to Google Sheet
  const ss = SpreadsheetApp.openById(_getConfig().GOOGLE_SHEET_ID);
  const sheet = ss.getSheetByName('CheckIns') || ss.insertSheet('CheckIns');
  sheet.appendRow([
    new Date().toISOString(),
    '+' + from,
    name,
    'whatsapp',
    body
  ]);

  // Reply
  const client = new WhatsAppCloudAPI();
  client.sendText('+' + from,
    '✅ Check-in received, ' + name + '! Your compliance has been logged for ' + new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' }) + '. ' +
    'If you have any questions, reply HELP or call Shamrock Bail Bonds at (239) 332-2245.'
  );

  // Notify staff via Slack
  try {
    NotificationService.notifySlack('SLACK_WEBHOOK_ALERTS', {
      text: '📍 Check-in received from ' + name + ' (+' + from + ') via WhatsApp'
    });
  } catch (e) { }

  return { success: true, action: 'check_in_logged', from: from };
}

function _handlePaymentInquiry(from, name) {
  console.log('💳 Payment inquiry from +' + from + ' (' + name + ')');
  const config = _getConfig();
  const paymentLink = config.PAYMENT_LINK || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';

  const client = new WhatsAppCloudAPI();
  client.sendText('+' + from,
    'Hi ' + name + '! Here is your secure payment link for Shamrock Bail Bonds:\n\n' +
    paymentLink + '\n\n' +
    'If you have questions about your balance, please call us at (239) 332-2245 or reply HELP.'
  );

  return { success: true, action: 'payment_link_sent', from: from };
}

function _handleHelpMenu(from, name) {
  const client = new WhatsAppCloudAPI();
  client.sendText('+' + from,
    'Hi ' + name + '! Welcome to Shamrock Bail Bonds.\n\n' +
    'Here is what you can do:\n' +
    '• Reply *HERE* to check in\n' +
    '• Reply *PAY* for payment options\n' +
    '• Reply *STOP* to unsubscribe\n' +
    '• Call us: (239) 332-2245\n' +
    '• Office: (239) 332-2245\n\n' +
    'We are available 24/7 for emergencies.'
  );
  return { success: true, action: 'help_sent', from: from };
}

function _handleStop(from, name) {
  console.log('🚫 STOP from +' + from + ' (' + name + ')');
  // Log the opt-out
  try {
    const props = PropertiesService.getScriptProperties();
    const optOuts = JSON.parse(props.getProperty('WA_OPT_OUTS') || '[]');
    if (!optOuts.includes(from)) {
      optOuts.push(from);
      props.setProperty('WA_OPT_OUTS', JSON.stringify(optOuts));
    }
  } catch (e) { }

  const client = new WhatsAppCloudAPI();
  client.sendText('+' + from,
    'You have been unsubscribed from Shamrock Bail Bonds WhatsApp notifications. ' +
    'Reply START to resubscribe at any time. For urgent matters call (239) 332-2245.'
  );
  return { success: true, action: 'opted_out', from: from };
}

function _handleLocation(from, name) {
  const client = new WhatsAppCloudAPI();
  client.sendText('+' + from,
    '📍 *Shamrock Bail Bonds Office*\n' +
    '1528 Broadway, Fort Myers, FL 33901\n\n' +
    'Get Directions: https://www.google.com/maps/dir/?api=1&destination=Shamrock+Bail+Bonds+1528+Broadway+Fort+Myers+FL+33901\n' +
    'Hours: 24/7\n' +
    'Phone: (239) 332-2245'
  );
  return { success: true, action: 'location_sent', from: from };
}

function _handleForms(from, name) {
  const client = new WhatsAppCloudAPI();
  client.sendText('+' + from,
    '📄 *Common Forms*\n\n' +
    'Which form do you need? Reply with the number:\n\n' +
    '1. Weekly Check-In\n' +
    '2. Travel Request\n' +
    '3. Credit Card Authorization\n' +
    '4. Indigent Status Application\n\n' +
    'Or visit our forms page: https://www.shamrockbailbonds.biz/forms'
  );
  return { success: true, action: 'forms_menu_sent', from: from };
}

function _handleReviewRequest(from, name) {
  const client = new WhatsAppCloudAPI();
  client.sendText('+' + from,
    '⭐ *Rate Your Experience*\n\n' +
    'Hi ' + name + ', if we handled your case well, please leave us a 5-star review. It helps others find us!\n\n' +
    'Rate us on Google: https://share.google/xhZ13e8XMlR4Dl1Qg'
  );
  return { success: true, action: 'review_request_sent', from: from };
}

function _handleDefault(data) {
  const { from, name, body } = data;
  console.log('💬 Routing message to Manus_Brain for +' + from + ' (' + name + ')');

  // Notify staff of inbound interaction
  try {
    NotificationService.notifySlack('SLACK_WEBHOOK_ALERTS', {
      text: '🤖 Manus AI interacting with ' + name + ' (+' + from + ')'
    });
  } catch (e) { }

  // Hand off to Manus_Brain
  return handleManusWhatsApp(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────────────────────────────────────

function _logInboundMessage(from, name, body, type, messageId) {
  try {
    const config = _getConfig();
    if (!config.GOOGLE_SHEET_ID) return;
    const ss = SpreadsheetApp.openById(config.GOOGLE_SHEET_ID);
    let sheet = ss.getSheetByName('WhatsApp_Inbound');
    if (!sheet) {
      sheet = ss.insertSheet('WhatsApp_Inbound');
      sheet.appendRow(['Timestamp', 'From', 'Name', 'Type', 'Body', 'MessageID']);
    }
    sheet.appendRow([new Date().toISOString(), '+' + from, name, type, body, messageId]);
  } catch (e) {
    console.warn('Could not log inbound message to sheet:', e.message);
  }
}

function _getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    GOOGLE_SHEET_ID: props.getProperty('GOOGLE_SHEET_ID') || '',
    PAYMENT_LINK: props.getProperty('PAYMENT_LINK') || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd'
  };
}
