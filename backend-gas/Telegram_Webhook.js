/**
 * Telegram_Webhook.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Handles inbound Telegram messages forwarded from the Wix webhook.
 * Called by Code.js doPost() when action === 'telegram_inbound_message'
 *
 * Message routing logic:
 *   - /start, /help, /status, /cancel → Command handlers
 *   - Photos → ID verification / intake completion
 *   - Voice → Transcription via OpenAI Whisper → Manus AI
 *   - Location → GPS capture
 *   - Text (intake keywords) → Intake flow state machine
 *   - Text (mid-intake) → Intake flow continuation
 *   - Text (general) → Manus AI concierge
 *   - Callback queries → Inline keyboard button handlers
 *
 * Telegram-native implementation. No WhatsApp dependency.
 *
 * Version: 2.0.0 — Full Intake Flow Wired
 * Date: 2026-02-20
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const INTAKE_TRIGGER_KEYWORDS = [
  'bail', 'arrested', 'jail', 'bond', 'help', 'release', 'locked up',
  'need help', 'get out', 'cosign', 'indemnitor', 'paperwork', 'sign',
  'start', 'begin', 'i need', 'someone was', 'my husband', 'my wife',
  'my son', 'my daughter', 'my mom', 'my dad', 'my friend', 'my brother',
  'my sister', 'my boyfriend', 'my girlfriend', 'my partner', 'my family'
];

const SHAMROCK_PHONE = '(239) 332-2245';
const PAYMENT_LINK = 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// Called from Code.js doPost() dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle an inbound Telegram update forwarded from Wix.
 * @param {Object} update - Telegram update object
 * @return {Object} result
 */
function handleTelegramInbound(update) {
  console.log('📩 Telegram update received:', JSON.stringify(update).substring(0, 300));

  const message = update.message;
  const callbackQuery = update.callback_query;

  // ── Callback queries (inline keyboard buttons) ──────────────────────────────
  if (callbackQuery) {
    return _handleCallbackQuery(callbackQuery);
  }

  if (!message) {
    console.warn('No message in update');
    return { success: false, message: 'No message found' };
  }

  // ── Extract core message data ────────────────────────────────────────────────
  const chatId    = message.chat.id;
  const from      = message.from;
  const userId    = from.id.toString();
  const username  = from.username || '';
  const firstName = from.first_name || 'there';
  const lastName  = from.last_name || '';
  const fullName  = `${firstName} ${lastName}`.trim();
  const text      = message.text || '';

  const data = {
    chatId:    chatId,
    userId:    userId,
    username:  username,
    name:      fullName,
    firstName: firstName,
    lastName:  lastName,
    messageId: message.message_id,
    timestamp: message.date,
    type:      _getMessageType(message),
    body:      text,
    message:   message,
    platform:  'telegram'
  };

  console.log(`📩 [${data.type}] from ${fullName} (@${username}) chatId=${chatId}: "${text.substring(0, 80)}"`);

  // Log to sheet (non-blocking)
  try { _logInboundMessage(data); } catch (e) { console.warn('Sheet log failed:', e.message); }

  // ── Route by message type ────────────────────────────────────────────────────

  // 1. Photos — ID verification / intake completion
  if (message.photo) {
    return _handlePhotoMessage(data);
  }

  // 2. Documents
  if (message.document) {
    return _handleDocumentMessage(data);
  }

  // 3. Location — GPS capture
  if (message.location) {
    return _handleLocationMessage(data);
  }

  // 4. Voice messages — transcribe then route
  if (message.voice) {
    return _handleVoiceMessage(data);
  }

  // ── Route by text content ────────────────────────────────────────────────────

  const lowerText = text.toLowerCase().trim();

  // 5. Slash commands
  if (text.startsWith('/')) {
    return _handleCommand(data);
  }

  // 6. Check if user is mid-intake — always continue their flow
  const intakeState = getConversationState(userId);
  const midIntake = intakeState.step && intakeState.step !== 'greeting' && intakeState.step !== 'complete';

  if (midIntake) {
    return _routeToIntakeFlow(data);
  }

  // 7. Intake trigger keywords — start new intake
  const isIntakeTrigger = INTAKE_TRIGGER_KEYWORDS.some(kw => lowerText.includes(kw));
  if (isIntakeTrigger) {
    return _startIntakeFlow(data);
  }

  // 8. Quick keyword handlers
  if (['help', 'menu'].includes(lowerText)) {
    return _handleHelpMenu(data);
  }

  if (lowerText.includes('pay') || lowerText.includes('payment') || lowerText.includes('premium')) {
    return _handlePaymentInquiry(data);
  }

  if (lowerText.includes('location') || lowerText.includes('office') || lowerText.includes('address') || lowerText.includes('where are you')) {
    return _handleLocationRequest(data);
  }

  if (lowerText.includes('status') || lowerText.includes('case') || lowerText.includes('update')) {
    return _handleStatusRequest(data);
  }

  // 9. Default → Manus AI concierge
  return _handleDefault(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTAKE FLOW HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a new intake flow for a user
 */
function _startIntakeFlow(data) {
  const bot = new TelegramBotAPI();
  bot.showTyping(data.chatId);

  // Initialize state at 'greeting' so processIntakeConversation sends the greeting prompt
  const state = {
    step: 'greeting',
    data: {},
    startedAt: new Date().toISOString(),
    lastActivity: null
  };
  saveConversationState(data.userId, state);

  const result = processIntakeConversation(data.userId, data.body, data.name);

  if (result.text) {
    bot.sendMessage(data.chatId, result.text);
  }
  if (result.voice_script) {
    generateAndSendVoiceNote(data.chatId, result.voice_script, 'telegram', data.chatId);
  }

  return { success: true, action: 'intake_started', chatId: data.chatId };
}

/**
 * Continue an active intake flow
 */
function _routeToIntakeFlow(data) {
  const bot = new TelegramBotAPI();
  bot.showTyping(data.chatId);

  const result = processIntakeConversation(data.userId, data.body, data.name);

  if (result.text) {
    bot.sendMessage(data.chatId, result.text);
  }
  if (result.voice_script) {
    generateAndSendVoiceNote(data.chatId, result.voice_script, 'telegram', data.chatId);
  }

  return { success: true, action: 'intake_continued', chatId: data.chatId };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle photo messages
 * If user is at id_prompt step → complete intake
 * Otherwise → store as ID upload
 */
function _handlePhotoMessage(data) {
  console.log(`📸 Photo received from ${data.name} (userId=${data.userId})`);

  const bot = new TelegramBotAPI();

  try {
    const message  = data.message;
    const photos   = message.photo;
    const largest  = photos[photos.length - 1]; // Highest resolution
    const fileId   = largest.file_id;
    const caption  = message.caption || '';

    // Check if user is at the id_prompt step of intake
    const intakeState = getConversationState(data.userId);

    if (intakeState.step === 'id_prompt') {
      // Complete the intake with this photo
      bot.showTyping(data.chatId);
      const result = completeIntakeWithPhoto(data.userId, data.chatId, fileId);

      if (result.text) {
        bot.sendMessage(data.chatId, result.text);
      }
      if (result.voice_script) {
        generateAndSendVoiceNote(data.chatId, result.voice_script, 'telegram', data.chatId);
      }

      return { success: true, action: 'intake_completed', chatId: data.chatId };
    }

    // General ID upload (not in intake flow)
    bot.sendMessage(data.chatId,
      '✅ *Photo received!*\n\nThank you. An agent will review your ID shortly.\n\nIf you\'re trying to start a new bond, type "I need to bail someone out" to begin.'
    );

    logProcessingEvent('TELEGRAM_PHOTO_RECEIVED', {
      userId: data.userId,
      fileId: fileId.substring(0, 20) + '...',
      caption: caption.substring(0, 50)
    });

    return { success: true, action: 'photo_received', chatId: data.chatId };

  } catch (e) {
    console.error('Error handling photo:', e);
    bot.sendMessage(data.chatId, 'I had trouble processing your photo. Please try again or call us at ' + SHAMROCK_PHONE);
    return { success: false, error: e.message };
  }
}

/**
 * Handle document messages (PDFs, etc.)
 */
function _handleDocumentMessage(data) {
  console.log(`📄 Document received from ${data.name}`);
  const bot = new TelegramBotAPI();

  bot.sendMessage(data.chatId,
    '📄 *Document received!*\n\nThank you. An agent will review it shortly.\n\nNeed to start paperwork? Type "I need to bail someone out".'
  );

  return { success: true, action: 'document_received' };
}

/**
 * Handle location messages — GPS capture for check-in
 */
function _handleLocationMessage(data) {
  console.log(`📍 Location received from ${data.name}`);
  const bot = new TelegramBotAPI();

  try {
    const location = data.message.location;
    const lat = location.latitude;
    const lng = location.longitude;

    // Log GPS check-in
    logProcessingEvent('TELEGRAM_LOCATION_RECEIVED', {
      userId: data.userId,
      lat: lat,
      lng: lng
    });

    bot.sendMessage(data.chatId,
      `📍 *Location received!*\n\nCoordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n\nThank you for checking in. An agent has been notified.`
    );

    return { success: true, action: 'location_captured', chatId: data.chatId, lat: lat, lng: lng };

  } catch (e) {
    console.error('Error handling location:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Handle voice messages — transcribe via OpenAI Whisper, then route
 */
function _handleVoiceMessage(data) {
  console.log(`🎤 Voice message received from ${data.name}`);
  const bot = new TelegramBotAPI();

  try {
    bot.showTyping(data.chatId);
    bot.sendChatAction(data.chatId, 'record_voice');

    const voiceFileId = data.message.voice.file_id;

    // Download the voice file
    const telegramClient = new TelegramBotAPI();
    const audioBlob = telegramClient.downloadFile(voiceFileId);

    // Transcribe via OpenAI Whisper
    let transcript = null;
    if (typeof transcribeAudio === 'function') {
      transcript = transcribeAudio(audioBlob);
    }

    if (!transcript) {
      bot.sendMessage(data.chatId,
        "🎤 I received your voice message but couldn't transcribe it clearly.\n\nCould you type your message instead? Or call us at " + SHAMROCK_PHONE
      );
      return { success: false, action: 'voice_transcription_failed' };
    }

    logProcessingEvent('TELEGRAM_VOICE_TRANSCRIBED', {
      userId: data.userId,
      transcriptLength: transcript.length
    });

    // Route the transcribed text as if it were a text message
    const textData = { ...data, body: transcript, type: 'text' };

    // Check intake state
    const intakeState = getConversationState(data.userId);
    const midIntake = intakeState.step && intakeState.step !== 'greeting' && intakeState.step !== 'complete';

    if (midIntake) {
      bot.sendMessage(data.chatId, `🎤 _I heard: "${transcript}"_`);
      return _routeToIntakeFlow(textData);
    }

    const isIntakeTrigger = INTAKE_TRIGGER_KEYWORDS.some(kw => transcript.toLowerCase().includes(kw));
    if (isIntakeTrigger) {
      bot.sendMessage(data.chatId, `🎤 _I heard: "${transcript}"_`);
      return _startIntakeFlow(textData);
    }

    // Route to Manus AI
    bot.sendMessage(data.chatId, `🎤 _I heard: "${transcript}"_`);
    return _handleDefault(textData);

  } catch (e) {
    console.error('Error handling voice message:', e);
    bot.sendMessage(data.chatId,
      "I had trouble with your voice message. Please type your message or call us at " + SHAMROCK_PHONE
    );
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route slash commands
 */
function _handleCommand(data) {
  const command = data.body.split(' ')[0].toLowerCase();
  console.log(`⚡ Command: ${command} from ${data.name}`);

  switch (command) {
    case '/start':   return _handleStart(data);
    case '/help':    return _handleHelpMenu(data);
    case '/bail':    return _startIntakeFlow(data);
    case '/status':  return _handleStatusRequest(data);
    case '/pay':     return _handlePaymentInquiry(data);
    case '/cancel':  return _handleCancelCommand(data);
    case '/restart': return _handleRestartCommand(data);
    default:         return _handleUnknownCommand(data);
  }
}

/**
 * /start — Welcome message with quick-action keyboard
 */
function _handleStart(data) {
  const bot = new TelegramBotAPI();

  const message = `🍀 *Welcome to Shamrock Bail Bonds!*

I'm Manus, your 24/7 digital assistant. I'm here to help get your loved one home as fast as possible.

*What I can do:*
✅ Guide you through bail bond paperwork
✅ Answer questions about the process
✅ Send you signing links instantly
✅ Accept ID photos securely
✅ Check case status

*To get started, tap a button below or just tell me what you need.*`;

  bot.sendMessageWithKeyboard(data.chatId, message, [
    [{ text: '🚀 Start Bail Paperwork', callback_data: 'start_intake' }],
    [{ text: '💳 Make a Payment', callback_data: 'make_payment' }],
    [{ text: '📋 Check Case Status', callback_data: 'check_status' }],
    [{ text: '📞 Call Us Now', url: 'tel:+12393322245' }]
  ]);

  return { success: true, action: 'start_sent', chatId: data.chatId };
}

/**
 * /help — Full menu
 */
function _handleHelpMenu(data) {
  const bot = new TelegramBotAPI();

  const message = `📋 *Shamrock Bail Bonds — Help Menu*

*Commands:*
/start — Welcome & quick actions
/bail — Start bail bond paperwork
/status — Check your case status
/pay — Get payment link
/cancel — Cancel current operation
/restart — Restart intake from beginning

*Quick phrases:*
• "I need to bail someone out"
• "My [family member] was arrested"
• "What's the process?"
• "How much does it cost?"

*24/7 Phone:* ${SHAMROCK_PHONE}
*Website:* shamrockbailbonds.biz

Just send me a message — I'm always here! 🍀`;

  bot.sendMessage(data.chatId, message);
  return { success: true, action: 'help_sent', chatId: data.chatId };
}

/**
 * /cancel — Cancel current operation
 */
function _handleCancelCommand(data) {
  const bot = new TelegramBotAPI();
  clearConversationState(data.userId);

  bot.sendMessage(data.chatId,
    '✅ *Cancelled.*\n\nNo problem. Type /start to begin again, or call us at ' + SHAMROCK_PHONE + ' if you need immediate help.'
  );
  return { success: true, action: 'cancelled', chatId: data.chatId };
}

/**
 * /restart — Restart intake from the beginning
 */
function _handleRestartCommand(data) {
  clearConversationState(data.userId);
  return _startIntakeFlow(data);
}

/**
 * Unknown command
 */
function _handleUnknownCommand(data) {
  const bot = new TelegramBotAPI();
  bot.sendMessage(data.chatId,
    `I don't recognize that command.\n\nType /help to see what I can do, or just tell me what you need in plain English.`
  );
  return { success: true, action: 'unknown_command' };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK RESPONSE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payment inquiry
 */
function _handlePaymentInquiry(data) {
  const bot = new TelegramBotAPI();

  const message = `💳 *Pay Your Bail Bond Premium*

Tap the button below to pay securely online:`;

  bot.sendMessageWithKeyboard(data.chatId, message, [
    [{ text: '💳 Pay Now', url: PAYMENT_LINK }],
    [{ text: '📞 Questions? Call Us', url: 'tel:+12393322245' }]
  ]);

  return { success: true, action: 'payment_sent', chatId: data.chatId };
}

/**
 * Office location request
 */
function _handleLocationRequest(data) {
  const bot = new TelegramBotAPI();

  const message = `📍 *Shamrock Bail Bonds*

We serve all 67 Florida counties — 24 hours a day, 7 days a week.

📞 *Phone:* ${SHAMROCK_PHONE}
🌐 *Website:* shamrockbailbonds.biz
📧 *Email:* admin@shamrockbailbonds.biz

*Service Area:* All of Florida
*Specialties:* Lee, Collier, Charlotte, Sarasota, Manatee, Hillsborough, Pinellas, and statewide`;

  bot.sendMessageWithKeyboard(data.chatId, message, [
    [{ text: '📞 Call Now', url: 'tel:+12393322245' }],
    [{ text: '🌐 Visit Website', url: 'https://www.shamrockbailbonds.biz' }]
  ]);

  return { success: true, action: 'location_sent', chatId: data.chatId };
}

/**
 * Case status request
 */
function _handleStatusRequest(data) {
  const bot = new TelegramBotAPI();

  bot.sendMessage(data.chatId,
    '🔍 *Case Status*\n\nTo check your case status, please provide:\n• The defendant\'s full name, OR\n• Your case number\n\nType it now and I\'ll look it up.'
  );

  return { success: true, action: 'status_requested', chatId: data.chatId };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT — MANUS AI CONCIERGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route to Manus AI for general questions
 */
function _handleDefault(data) {
  console.log(`💬 Routing to Manus AI for ${data.name}`);
  const bot = new TelegramBotAPI();
  bot.showTyping(data.chatId);

  const manusData = {
    from:      data.userId,
    name:      data.name,
    body:      data.body,
    type:      'text',
    messageId: data.messageId,
    timestamp: data.timestamp,
    platform:  'telegram',
    chatId:    data.chatId
  };

  if (typeof handleManusMessage === 'function') {
    return handleManusMessage(manusData);
  }

  // Fallback if Manus_Brain not loaded
  bot.sendMessageWithKeyboard(data.chatId,
    `I'm here to help! Here's what I can do:`,
    [
      [{ text: '🚀 Start Bail Paperwork', callback_data: 'start_intake' }],
      [{ text: '💳 Make a Payment', callback_data: 'make_payment' }],
      [{ text: '📞 Call Us', url: 'tel:+12393322245' }]
    ]
  );

  return { success: true, action: 'default_response' };
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLBACK QUERY HANDLER (Inline Keyboard Buttons)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle callback query from inline keyboard button press
 */
function _handleCallbackQuery(callbackQuery) {
  const queryId = callbackQuery.id;
  const cbData  = callbackQuery.data;
  const message = callbackQuery.message;
  const from    = callbackQuery.from;
  const chatId  = message.chat.id;
  const userId  = from.id.toString();
  const name    = `${from.first_name || ''} ${from.last_name || ''}`.trim();

  console.log(`🔘 Callback: "${cbData}" from ${name} (${userId})`);

  const bot = new TelegramBotAPI();
  bot.answerCallbackQuery(queryId, '');

  // Reconstruct a data object for handlers
  const data = {
    chatId:   chatId,
    userId:   userId,
    name:     name,
    firstName: from.first_name || 'there',
    body:     cbData,
    platform: 'telegram'
  };

  switch (cbData) {
    case 'start_intake':
      return _startIntakeFlow(data);

    case 'make_payment':
      return _handlePaymentInquiry(data);

    case 'check_status':
      return _handleStatusRequest(data);

    case 'help':
      return _handleHelpMenu(data);

    default:
      bot.sendMessage(chatId, 'Processing your request...');
      return { success: true, action: 'callback_handled', data: cbData };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine message type from Telegram message object
 */
function _getMessageType(message) {
  if (message.text)     return 'text';
  if (message.photo)    return 'photo';
  if (message.document) return 'document';
  if (message.voice)    return 'voice';
  if (message.video)    return 'video';
  if (message.location) return 'location';
  if (message.contact)  return 'contact';
  if (message.sticker)  return 'sticker';
  return 'unknown';
}

/**
 * Log inbound message to Google Sheet (Telegram_Inbound tab)
 * SOC2-safe: no message body stored, only metadata
 */
function _logInboundMessage(data) {
  try {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
      || '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E';

    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheet = ss.getSheetByName('Telegram_Inbound');

    if (!sheet) {
      sheet = ss.insertSheet('Telegram_Inbound');
      sheet.appendRow([
        'Timestamp', 'Chat ID', 'User ID', 'Username', 'Name',
        'Type', 'Body (truncated)', 'Message ID', 'Intake Step'
      ]);
      sheet.setFrozenRows(1);
    }

    const intakeState = getConversationState(data.userId);

    sheet.appendRow([
      new Date().toISOString(),
      data.chatId,
      data.userId,
      data.username,
      data.name,
      data.type,
      (data.body || '').substring(0, 100), // Truncate for SOC2
      data.messageId,
      intakeState.step || 'none'
    ]);

  } catch (e) {
    console.warn('Sheet log failed (non-fatal):', e.message);
  }
}
