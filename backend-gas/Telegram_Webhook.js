/**
 * Telegram_Webhook.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Handles inbound Telegram messages forwarded from the Wix webhook.
 * Called by Code.js doPost() when action === 'telegram_inbound_message'
 *
 * Message routing logic:
 *   - Photos → Photo handler (ID verification)
 *   - Location → GPS capture
 *   - Text with OTP → OTP validation
 *   - General text → Manus AI (includes intake flow)
 *   - Callback queries → Button handlers
 *
 * Built for Telegram Integration
 * 
 * Version: 1.0.0
 * Date: 2026-02-19
 */

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// Called from Code.js doPost() dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle an inbound Telegram message forwarded from Wix.
 * @param {Object} update - Telegram update object
 * @return {Object} result
 */
function handleTelegramInbound(update) {
  console.log('📩 Telegram update received:', JSON.stringify(update));

  // Extract message or callback query
  const message = update.message;
  const callbackQuery = update.callback_query;

  if (callbackQuery) {
    return _handleCallbackQuery(callbackQuery);
  }

  if (!message) {
    console.warn('No message in update');
    return { success: false, message: 'No message found' };
  }

  // Extract message data
  const chatId = message.chat.id;
  const from = message.from;
  const userId = from.id;
  const username = from.username || '';
  const firstName = from.first_name || 'User';
  const lastName = from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  const messageId = message.message_id;
  const date = message.date;
  const text = message.text || '';

  // Construct normalized data object
  const data = {
    chatId: chatId,
    userId: userId,
    username: username,
    name: fullName,
    firstName: firstName,
    lastName: lastName,
    messageId: messageId,
    timestamp: date,
    type: _getMessageType(message),
    body: text,
    message: message, // Full message object for handlers
    platform: 'telegram'
  };

  console.log(`📩 Telegram message from ${fullName} (@${username}): type=${data.type}, text="${text}"`);

  // Log to Google Sheet
  _logInboundMessage(data);

  // ── Route based on message type ────────────────────────────────────────────

  // 1. Photos (ID verification)
  if (message.photo) {
    return _handlePhotoMessage(data);
  }

  // 2. Documents
  if (message.document) {
    return _handleDocumentMessage(data);
  }

  // 3. Location (GPS capture)
  if (message.location) {
    return _handleLocationMessage(data);
  }

  // 4. Voice messages
  if (message.voice) {
    return _handleVoiceMessage(data);
  }

  // ── Route based on text content ────────────────────────────────────────────

  const lowerText = text.toLowerCase().trim();

  // 5. OTP validation
  if (/^\d{6}$/.test(text)) {
    return _handleOTPReply(data);
  }

  // 6. Commands
  if (text.startsWith('/')) {
    return _handleCommand(data);
  }

  // NOTE: Numbered menu choices (1-5) and active intake check follow below

  const trimmed = text.trim();

  // 7. ── NUMBERED MENU CHOICES (1–5) ──────────────────────────────────────────
  //    Checked BEFORE the active-intake check so a user can always restart.
  if (trimmed === '1' || lowerText === 'post bail now' || lowerText === 'post bail') {
    return _handleMenuPostBail(data);
  }
  if (trimmed === '2' || lowerText === 'check jail status' || lowerText === 'jail status') {
    return _handleMenuJailStatus(data);
  }
  if (trimmed === '3' || lowerText === 'speak to a bondsman' || lowerText === 'bondsman' || lowerText === 'agent') {
    return _handleMenuSpeakToBondsman(data);
  }
  if (trimmed === '4' || lowerText === 'payment' || lowerText === 'pay' || lowerText.includes('financing')) {
    return _handleMenuPayment(data);
  }
  if (trimmed === '5' || lowerText === 'general questions' || lowerText === 'faq') {
    return _handleMenuGeneralQuestions(data);
  }

  // 8. ── ACTIVE INTAKE FLOW ──────────────────────────────────────────────────
  //    If the user is mid-intake, route ALL messages to the state machine.
  const userIdStr = userId.toString();
  if (typeof getConversationState === 'function') {
    const state = getConversationState(userIdStr);
    const isActiveIntake = state &&
      state.step &&
      state.step !== 'greeting' &&
      state.step !== 'complete';
    if (isActiveIntake) {
      return _routeToIntakeFlow(data);
    }
  }

  // 9. Keyword shortcuts
  if (['help', 'menu', 'start'].includes(lowerText)) {
    return _handleWelcomeMessage(data);
  }
  if (lowerText.includes('location') || lowerText.includes('office') || lowerText.includes('address')) {
    return _handleLocationRequest(data);
  }
  if (lowerText.includes('bail') || lowerText.includes('arrested') || lowerText.includes('jail') || lowerText.includes('bond') || lowerText.includes('release') || lowerText.includes('custody')) {
    return _handleMenuPostBail(data);
  }

  // 10. Default → Route to Manus AI (includes RAG knowledge base)
  return _handleDefault(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE TYPE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle photo messages (ID verification).
 * Routes through PDF_Processor.js handleIncomingDocument() which uses
 * the ID front/back/selfie state machine for guided compliance uploads.
 */
function _handlePhotoMessage(data) {
  console.log(`📸 Photo received from ${data.name}`);

  try {
    const message = data.message;
    const photos = message.photo; // Array of PhotoSize objects

    // Get largest photo (best quality)
    const largestPhoto = photos[photos.length - 1];
    const fileId = largestPhoto.file_id;
    const caption = message.caption || '';

    // Check if user is in an active intake flow expecting a document
    if (typeof getConversationState === 'function') {
      const state = getConversationState(data.userId);
      if (state && ['upload_id', 'upload_utility', 'upload_paystub'].includes(state.step)) {
        if (typeof processIntakeMessage === 'function') {
          const token = `__DOC__${fileId}__${caption || 'photo.jpg'}__image/jpeg`;
          const result = processIntakeMessage(data.userId, token, data.name);
          const bot = new TelegramBotAPI();
          if (result.text) bot.sendMessage(data.chatId, result.text, { parse_mode: 'Markdown' });
          if (result.voice_script && typeof generateAndSendVoiceNote === 'function') {
            generateAndSendVoiceNote(data.chatId, result.voice_script, 'telegram', data.userId);
          }
          return { success: true, action: 'intake_photo_processed' };
        }
      }
    }

    // Check if user is in a document task selection state first
    if (typeof isDocumentTaskSelection === 'function' && isDocumentTaskSelection(caption, data.userId)) {
      return processDocumentTaskSelection(data.chatId, data.userId, caption);
    }

    // Route through PDF_Processor for unified ID photo handling
    if (typeof handleIncomingDocument === 'function') {
      return handleIncomingDocument(
        data.chatId,
        data.userId,
        fileId,
        caption || `photo_${Date.now()}.jpg`,
        'image/jpeg'
      );
    }

    // Fallback acknowledgement
    const bot = new TelegramBotAPI();
    bot.sendMessage(data.chatId, 'Thank you for the photo! ✅ I\'ve received it.');
    return { success: true, action: 'photo_acknowledged' };

  } catch (e) {
    console.error('Error handling photo:', e);
    const bot = new TelegramBotAPI();
    bot.sendMessage(data.chatId, '❌ There was an error processing your photo. Please try again or call (239) 332-2245.');
    return { success: false, error: e.message };
  }
}

/**
 * Handle document messages (PDF, DOCX, etc.).
 * Routes through PDF_Processor.js handleIncomingDocument() which presents
 * a task menu: ID Photo | Signed Documents | Supporting Document | Cancel.
 */
function _handleDocumentMessage(data) {
  console.log(`📄 Document received from ${data.name}`);

  try {
    const doc = data.message.document;
    const fileId = doc.file_id;
    const name = doc.file_name || 'document';
    const mime = doc.mime_type || 'application/octet-stream';

    // Check if user is in an active intake flow expecting a document
    if (typeof getConversationState === 'function') {
      const state = getConversationState(data.userId);
      if (state && ['upload_id', 'upload_utility', 'upload_paystub'].includes(state.step)) {
        if (typeof processIntakeMessage === 'function') {
          const token = `__DOC__${fileId}__${name}__${mime}`;
          const result = processIntakeMessage(data.userId, token, data.name);
          const bot = new TelegramBotAPI();
          if (result.text) bot.sendMessage(data.chatId, result.text, { parse_mode: 'Markdown' });
          if (result.voice_script && typeof generateAndSendVoiceNote === 'function') {
            generateAndSendVoiceNote(data.chatId, result.voice_script, 'telegram', data.userId);
          }
          return { success: true, action: 'intake_document_processed' };
        }
      }
    }

    // Check if user is responding to a document task menu
    if (typeof isDocumentTaskSelection === 'function' && isDocumentTaskSelection(data.body, data.userId)) {
      return processDocumentTaskSelection(data.chatId, data.userId, data.body);
    }

    // Route through PDF_Processor for the full task menu
    if (typeof handleIncomingDocument === 'function') {
      return handleIncomingDocument(data.chatId, data.userId, fileId, name, mime);
    }

    // Fallback
    const bot = new TelegramBotAPI();
    bot.sendMessage(data.chatId, 'Thank you for the document! 📄 I\'ve received it.');
    return { success: true, action: 'document_received' };

  } catch (e) {
    console.error('Error handling document:', e);
    const bot = new TelegramBotAPI();
    bot.sendMessage(data.chatId, '❌ There was an error processing your document. Please try again or call (239) 332-2245.');
    return { success: false, error: e.message };
  }
}

/**
 * Handle location messages (GPS capture)
 */
function _handleLocationMessage(data) {
  console.log(`📍 Location received from ${data.name}`);

  try {
    const location = data.message.location;

    // Convert to normalized format
    const locationData = {
      from: data.userId.toString(),
      phoneNumber: data.userId.toString(),
      type: 'location',
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      timestamp: data.timestamp,
      platform: 'telegram'
    };

    // Call location handler
    if (typeof handleLocationMessage === 'function') {
      const result = handleLocationMessage(locationData);

      // Response is sent by the handler itself
      return {
        success: result.success,
        action: 'location_captured',
        chatId: data.chatId,
        location: result.location
      };
    } else {
      console.warn('handleLocationMessage function not found');
      const bot = new TelegramBotAPI();
      bot.sendMessage(data.chatId, 'Thank you for sharing your location! 📍');
      return { success: true, action: 'location_acknowledged' };
    }

  } catch (e) {
    console.error('Error handling location:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Handle voice messages
 */
function _handleVoiceMessage(data) {
  console.log(`🎤 Voice message received from ${data.name}`);

  // TODO: Implement voice transcription if needed
  // Can use OpenAI Whisper

  const bot = new TelegramBotAPI();
  bot.sendMessage(data.chatId, 'I received your voice message! 🎤\n\nFor now, please send text messages. Voice support coming soon!');

  return { success: true, action: 'voice_received' };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT MESSAGE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle OTP reply
 */
function _handleOTPReply(data) {
  console.log(`🔑 OTP reply from ${data.name}: ${data.body}`);

  const bot = new TelegramBotAPI();
  bot.sendMessage(data.chatId, 'Your code has been received. Verifying... ⏳');

  // TODO: Implement OTP validation for Telegram
  // Can reuse core OTP logic

  return { success: true, action: 'otp_received', chatId: data.chatId };
}

/**
 * Handle commands (/start, /help, etc.)
 */
function _handleCommand(data) {
  const command = data.body.split(' ')[0].toLowerCase();

  console.log(`⚡ Command received: ${command}`);

  switch (command) {
    case '/start':
    case '/help':
      return _handleWelcomeMessage(data);
    case '/bail':
    case '/postbail':
      return _handleMenuPostBail(data);
    case '/pay':
    case '/payment':
      return _handleMenuPayment(data);
    case '/status':
    case '/jailstatus':
      return _handleMenuJailStatus(data);
    case '/agent':
    case '/bondsman':
      return _handleMenuSpeakToBondsman(data);
    case '/faq':
    case '/questions':
      return _handleMenuGeneralQuestions(data);
    case '/cancel':
    case '/restart':
      return _handleCancel(data);
    default:
      return _handleUnknownCommand(data);
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================
var PAYMENT_LINK = 'https://swipesimple.com/links/lnk_07a13eb404d7f3057a56d56d8bb488c8';
var SHAMROCK_PHONE = '(239) 332-2245';

// =============================================================================
// WELCOME MESSAGE
// =============================================================================

/**
 * Send the main welcome message — statewide Florida coverage.
 * Used by /start, /help, and the 'help'/'menu' keyword shortcuts.
 */
function _handleWelcomeMessage(data) {
  const bot = new TelegramBotAPI();
  const msg =
    '🍀 *Shamrock Bail Bonds — We\'re Ready to Help*\n\n' +
    'If you\'re here, it\'s urgent. Take a breath — we\'ve got you.\n\n' +
    'We provide fast, confidential bail bond services across *all 67 Florida counties* — ' +
    'from Pensacola to Key West, the Gulf Coast to the Atlantic.\n\n' +
    '*Available 24/7. No judgment. Just solutions.*\n\n' +
    'To get started, please choose an option below:';

  bot.sendMessageWithKeyboard(data.chatId, msg, [
    [{ text: '🚀 Post Bail Now', callback_data: 'menu_1' }],
    [{ text: '🔍 Check Jail Status', callback_data: 'menu_2' }],
    [{ text: '📞 Speak to a Bondsman', callback_data: 'menu_3' }],
    [{ text: '💳 Payment Options', callback_data: 'menu_4' }, { text: '❓ FAQ', callback_data: 'menu_5' }]
  ]);
  return { success: true, action: 'welcome_sent', chatId: data.chatId };
}

// =============================================================================
// NUMBERED MENU OPTION HANDLERS
// =============================================================================

/**
 * Option 1 — Post Bail Now: starts the conversational intake state machine.
 */
function _handleMenuPostBail(data) {
  const bot = new TelegramBotAPI();
  const userId = data.userId.toString();
  console.log('🚀 Starting intake flow for ' + data.name + ' (' + userId + ')');

  if (typeof processIntakeMessage === 'function') {
    // Clear any stale state first
    if (typeof clearConversationState === 'function') {
      clearConversationState(userId);
    }
    // Trigger the first question from the state machine
    const result = processIntakeMessage(userId, '/start', data.firstName);
    if (result && result.text) {
      bot.sendMessage(data.chatId, result.text, { parse_mode: 'Markdown' });
    }
    return { success: true, action: 'intake_started', chatId: data.chatId };
  }

  // Fallback if intake module not loaded
  bot.sendMessage(data.chatId,
    '📋 *Let\'s start your bail bond paperwork.*\n\n' +
    '*Before we begin, please review our terms:*\n\n' +
    'By continuing, you agree to:\n' +
    '• Sign documents electronically (legally binding)\n' +
    '• Allow us to capture your location at signing time\n' +
    '• Receive necessary text/voice communications about this case\n' +
    '• Authorize Shamrock Bail Bonds to use this data for underwriting purposes.\n\n' +
    'Do you agree to these terms?\n' +
    '*(Please reply "I agree" or "Yes")*',
    { parse_mode: 'Markdown' }
  );
  return { success: true, action: 'intake_fallback_started', chatId: data.chatId };
}

/**
 * Option 2 — Check Jail Status
 */
function _handleMenuJailStatus(data) {
  const bot = new TelegramBotAPI();
  const msg =
    '🔍 *Jail Status Check*\n\n' +
    'To look up someone\'s custody status, please tell me:\n' +
    '• The *defendant\'s full name*\n' +
    '• The *county or city* where they were arrested\n\n' +
    'For the fastest results, you can also search directly:\n' +
    '• *Lee County:* https://www.leeclerk.org/\n' +
    '• *Collier County:* https://www.colliersheriff.org/\n' +
    '• *Charlotte County:* https://www.charlottesheriff.org/\n' +
    '• *Hendry County:* https://www.hendrysheriff.org/\n' +
    '• *All Florida counties:* https://www.vinelink.com/\n\n' +
    'Or call us and we\'ll look it up for you: 📞 ' + SHAMROCK_PHONE;
  bot.sendMessageWithKeyboard(data.chatId, msg, [
    [{ text: '🏠 Main Menu', callback_data: 'show_menu' }]
  ]);
  return { success: true, action: 'jail_status_sent', chatId: data.chatId };
}

/**
 * Option 3 — Speak to a Bondsman Immediately
 */
function _handleMenuSpeakToBondsman(data) {
  const bot = new TelegramBotAPI();
  const msg =
    '📞 *Speak to a Licensed Bondsman*\n\n' +
    'Our agents are available *24 hours a day, 7 days a week* — including holidays.\n\n' +
    '👉 *Call or text us now:*\n' +
    SHAMROCK_PHONE + '\n\n' +
    'When you call, have ready:\n' +
    '• The defendant\'s full name\n' +
    '• The county or jail where they\'re held\n' +
    '• Your relationship to the defendant\n\n' +
    'We\'ll handle everything from there. 🍀\n\n' +
    '_You can also tap the button below to start the paperwork process online._';
  bot.sendMessageWithKeyboard(data.chatId, msg, [
    [{ text: '🚀 Post Bail Now', callback_data: 'menu_1' }],
    [{ text: '🏠 Main Menu', callback_data: 'show_menu' }]
  ]);
  return { success: true, action: 'bondsman_contact_sent', chatId: data.chatId };
}

/**
 * Option 4 — Payment & Financing Options
 */
function _handleMenuPayment(data) {
  const bot = new TelegramBotAPI();
  const msg =
    '💳 *Payment & Financing Options*\n\n' +
    'Shamrock Bail Bonds offers flexible payment options to help you ' +
    'get your loved one home as quickly as possible.\n\n' +
    '*Standard Premium:* 10% of the total bond amount (Florida state rate)\n\n' +
    '*We accept:*\n' +
    '✅ Credit & Debit Cards\n' +
    '✅ Cash\n' +
    '✅ Payment Plans (ask your agent)\n' +
    '✅ Collateral (property, vehicles, jewelry)\n\n' +
    '👉 *Make a payment now:*\n' +
    PAYMENT_LINK + '\n\n' +
    'Have questions about financing? Call us: 📞 ' + SHAMROCK_PHONE + '\n\n' +
    '_Your agent will discuss all available options with you._';
  bot.sendMessageWithKeyboard(data.chatId, msg, [
    [{ text: '💳 Pay Now', url: PAYMENT_LINK }],
    [{ text: '🏠 Main Menu', callback_data: 'show_menu' }]
  ]);
  return { success: true, action: 'payment_info_sent', chatId: data.chatId };
}

/**
 * Option 5 — General Questions (FAQ)
 */
function _handleMenuGeneralQuestions(data) {
  const bot = new TelegramBotAPI();
  bot.showTyping(data.chatId);
  const msg =
    '❓ *General Questions — Shamrock Bail Bonds*\n\n' +
    '*How does bail work?*\n' +
    'When someone is arrested, a judge sets a bail amount. A bail bond allows ' +
    'them to be released while awaiting trial. You pay 10% (the premium) to us, ' +
    'and we post the full bond with the court.\n\n' +
    '*How long does it take?*\n' +
    'Once paperwork is signed and payment is received, most releases happen ' +
    'within 2–6 hours depending on the jail\'s processing time.\n\n' +
    '*What do I need to get started?*\n' +
    '• Defendant\'s full name and date of birth\n' +
    '• The jail or county where they\'re held\n' +
    '• Your ID and contact information\n' +
    '• 10% of the bond amount (or collateral)\n\n' +
    '*Do you cover my county?*\n' +
    'Yes — we cover *all 67 Florida counties* through our statewide network.\n\n' +
    '*Is this confidential?*\n' +
    'Absolutely. Everything you share with us is private and professional.\n\n' +
    '📞 More questions? Call us anytime: ' + SHAMROCK_PHONE;
  bot.sendMessageWithKeyboard(data.chatId, msg, [
    [{ text: '🚀 Post Bail Now', callback_data: 'menu_1' }],
    [{ text: '🏠 Main Menu', callback_data: 'show_menu' }]
  ]);
  return { success: true, action: 'faq_sent', chatId: data.chatId };
}

// =============================================================================
// INTAKE FLOW ROUTER
// =============================================================================

/**
 * Route a mid-intake message to the processIntakeMessage state machine.
 */
function _routeToIntakeFlow(data) {
  const bot = new TelegramBotAPI();
  const userId = data.userId.toString();
  try {
    const result = processIntakeMessage(userId, data.body, data.firstName);
    if (result && result.text) {
      bot.sendMessage(data.chatId, result.text, { parse_mode: 'Markdown' });
    }
    // Intake complete — send confirmation
    if (result && result.intakeId) {
      const confirmMsg =
        '✅ *Your information has been securely received.*\n\n' +
        'Reference ID: `' + result.intakeId + '`\n\n' +
        'A licensed bondsman is reviewing your case right now. You will receive a call or text shortly.\n\n' +
        '💳 *Next Steps:*\n' +
        'If you know the premium due, please feel free to pay your defendant\'s bond securely using the link below. Be sure to add any notes that you would like.\n\n' +
        '_If you prefer other payment methods, please discuss that with your agent._\n\n' +
        '📞 *Need immediate assistance?* Call us 24/7 at ' + SHAMROCK_PHONE;

      bot.sendMessageWithKeyboard(data.chatId, confirmMsg, [
        [{ text: '💳 Secure Payment Link', url: PAYMENT_LINK }]
      ]);
    }
    return { success: true, action: 'intake_flow_processed', chatId: data.chatId };
  } catch (e) {
    console.error('Intake flow error:', e);
    bot.sendMessage(data.chatId,
      '⚠️ Something went wrong. Please type *1* to start over or call us at ' + SHAMROCK_PHONE,
      { parse_mode: 'Markdown' }
    );
    return { success: false, error: e.message };
  }
}

// =============================================================================
// LEGACY STUBS — kept for backward compatibility
// =============================================================================

function _handleStart(data) { return _handleWelcomeMessage(data); }
function _handleHelpMenu(data) { return _handleWelcomeMessage(data); }
function _handleStatus(data) { return _handleMenuJailStatus(data); }
function _handlePaymentInquiry(data) { return _handleMenuPayment(data); }

/**
 * Handle cancel / restart command
 */
function _handleCancel(data) {
  const bot = new TelegramBotAPI();
  const userId = data.userId.toString();
  try {
    if (typeof clearConversationState === 'function') clearConversationState(userId);
    CacheService.getScriptCache().remove('intake_' + userId);
    CacheService.getScriptCache().remove('photo_' + userId);
  } catch (e) {
    console.warn('Could not clear cache:', e);
  }
  bot.sendMessage(data.chatId,
    '❌ Operation cancelled.\n\nType /start or send *1* to begin again.',
    { parse_mode: 'Markdown' }
  );
  return { success: true, action: 'cancelled', chatId: data.chatId };
}

/**
 * Handle unknown command
 */
function _handleUnknownCommand(data) {
  const bot = new TelegramBotAPI();
  bot.sendMessageWithKeyboard(data.chatId,
    'I don\'t recognize that command.\n\nTap the button below to see the main menu or call ' + SHAMROCK_PHONE + ' for immediate help.',
    [
      [{ text: '🏠 Main Menu', callback_data: 'show_menu' }]
    ]
  );
  return { success: true, action: 'unknown_command', chatId: data.chatId };
}

/**
 * Handle office location request
 */
function _handleLocationRequest(data) {
  const bot = new TelegramBotAPI();
  const msg =
    '📍 *Shamrock Bail Bonds*\n\n' +
    'We are a mobile bail bond agency serving *all 67 Florida counties*.\n' +
    'Our agents come to you — at the jail, courthouse, or wherever you need us.\n\n' +
    '📞 Call or text us anytime: ' + SHAMROCK_PHONE + '\n\n' +
    '_We don\'t have a single storefront — we have the whole state of Florida._';
  bot.sendMessage(data.chatId, msg, { parse_mode: 'Markdown' });
  return { success: true, action: 'location_sent', chatId: data.chatId };
}

/**
 * Handle default (route to Manus AI)
 */
function _handleDefault(data) {
  console.log(`💬 Routing message to Manus_Brain for ${data.name}`);

  // Show typing indicator
  const bot = new TelegramBotAPI();
  bot.showTyping(data.chatId);

  // Convert Telegram data to normalized format for Manus
  const manusData = {
    from: data.userId.toString(),
    name: data.name,
    body: data.body,
    type: 'text',
    messageId: data.messageId,
    timestamp: data.timestamp,
    platform: 'telegram',
    chatId: data.chatId // Keep for response
  };

  // Hand off to Manus_Brain
  if (typeof handleManus === 'function') {
    return handleManus(manusData);
  } else {
    console.warn('handleManus function not found');
    bot.sendMessage(data.chatId, 'I\'m here to help! How can I assist you today?');
    return { success: true, action: 'default_response' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLBACK QUERY HANDLER (Inline Keyboard Buttons)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle callback query from inline keyboard button
 */
function _handleCallbackQuery(callbackQuery) {
  const queryId = callbackQuery.id;
  const data = callbackQuery.data;
  const message = callbackQuery.message;
  const from = callbackQuery.from;
  const chatId = message.chat.id;

  console.log(`🔘 Callback query: ${data} from ${from.first_name}`);

  const bot = new TelegramBotAPI();

  // Answer the callback query (removes loading state)
  bot.answerCallbackQuery(queryId, 'Processing...');

  // Build a synthetic data object for reuse with menu handlers
  const syntheticData = {
    chatId: chatId,
    userId: from.id,
    username: from.username || '',
    name: ((from.first_name || '') + ' ' + (from.last_name || '')).trim(),
    firstName: from.first_name || 'there',
    body: data,
    message: message,
    platform: 'telegram'
  };

  // Handle different callback data
  switch (data) {
    case 'show_menu':
      return _handleWelcomeMessage(syntheticData);

    case 'start_intake':
    case 'menu_1':
      return _handleMenuPostBail(syntheticData);

    case 'check_status':
    case 'menu_2':
      return _handleMenuJailStatus(syntheticData);

    case 'speak_agent':
    case 'menu_3':
      return _handleMenuSpeakToBondsman(syntheticData);

    case 'make_payment':
    case 'menu_4':
      return _handleMenuPayment(syntheticData);

    case 'general_questions':
    case 'menu_5':
      return _handleMenuGeneralQuestions(syntheticData);

    default:
      bot.sendMessage(chatId, 'Processing your request...');
      return { success: true, action: 'callback_handled', data: data };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine message type
 */
function _getMessageType(message) {
  if (message.text) return 'text';
  if (message.photo) return 'photo';
  if (message.document) return 'document';
  if (message.voice) return 'voice';
  if (message.video) return 'video';
  if (message.location) return 'location';
  if (message.contact) return 'contact';
  return 'unknown';
}

/**
 * Log inbound message to Google Sheet
 */
function _logInboundMessage(data) {
  try {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      const props = PropertiesService.getScriptProperties();
      const fallbackId = props.getProperty('TARGET_SPREADSHEET_ID');
      if (!fallbackId) return;
      ss = SpreadsheetApp.openById(fallbackId);
    }

    let sheet = ss.getSheetByName('Telegram_Inbound');

    if (!sheet) {
      sheet = ss.insertSheet('Telegram_Inbound');
      sheet.appendRow(['Timestamp', 'Chat ID', 'User ID', 'Username', 'Name', 'Type', 'Body', 'Message ID']);
    }

    sheet.appendRow([
      new Date().toISOString(),
      data.chatId,
      data.userId,
      data.username,
      data.name,
      data.type,
      data.body,
      data.messageId
    ]);

  } catch (e) {
    console.warn('Could not log inbound message to sheet:', e.message);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Functions are global in GAS - no explicit exports needed
