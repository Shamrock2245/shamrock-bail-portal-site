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
 * Reuses 95% of WhatsApp infrastructure!
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
  
  // Construct normalized data object (similar to WhatsApp format)
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
  
  // 7. Quick replies / keywords
  if (['help', 'menu', 'start'].includes(lowerText)) {
    return _handleHelpMenu(data);
  }
  
  if (lowerText.includes('pay') || lowerText.includes('payment')) {
    return _handlePaymentInquiry(data);
  }
  
  if (lowerText.includes('location') || lowerText.includes('office') || lowerText.includes('address')) {
    return _handleLocationRequest(data);
  }
  
  // 8. Default → Route to Manus AI (includes intake flow)
  return _handleDefault(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE TYPE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle photo messages (ID verification)
 */
function _handlePhotoMessage(data) {
  console.log(`📸 Photo received from ${data.name}`);
  
  try {
    const message = data.message;
    const photos = message.photo; // Array of PhotoSize objects
    
    // Get largest photo
    const largestPhoto = photos[photos.length - 1];
    const fileId = largestPhoto.file_id;
    const caption = message.caption || '';
    
    // Call photo handler (reuses WhatsApp handler!)
    if (typeof handlePhotoUpload === 'function') {
      // Convert Telegram data to WhatsApp-like format
      const phoneNumber = data.userId.toString(); // Use user ID as identifier
      const result = handlePhotoUpload(phoneNumber, fileId, 'image/jpeg', caption, 'telegram');
      
      // Send response
      const bot = new TelegramBotAPI();
      bot.sendMessage(data.chatId, result.message);
      
      return {
        success: result.success,
        action: 'photo_uploaded',
        chatId: data.chatId,
        complete: result.complete
      };
    } else {
      console.warn('handlePhotoUpload function not found');
      const bot = new TelegramBotAPI();
      bot.sendMessage(data.chatId, 'Thank you for the photo! I\'ve received it. ✅');
      return { success: true, action: 'photo_acknowledged' };
    }
    
  } catch (e) {
    console.error('Error handling photo:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Handle document messages
 */
function _handleDocumentMessage(data) {
  console.log(`📄 Document received from ${data.name}`);
  
  const bot = new TelegramBotAPI();
  bot.sendMessage(data.chatId, 'Thank you for the document! I\'ve received it. 📄');
  
  // TODO: Implement document storage if needed
  
  return { success: true, action: 'document_received' };
}

/**
 * Handle location messages (GPS capture)
 */
function _handleLocationMessage(data) {
  console.log(`📍 Location received from ${data.name}`);
  
  try {
    const location = data.message.location;
    
    // Convert to WhatsApp-like format
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
    
    // Call location handler (reuses WhatsApp handler!)
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
  // Can use OpenAI Whisper like WhatsApp handler
  
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
  // Can reuse WhatsApp OTP logic
  
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
      return _handleStart(data);
    case '/help':
      return _handleHelpMenu(data);
    case '/status':
      return _handleStatus(data);
    case '/cancel':
      return _handleCancel(data);
    default:
      return _handleUnknownCommand(data);
  }
}

/**
 * Handle /start command
 */
function _handleStart(data) {
  const bot = new TelegramBotAPI();
  
  const message = `👋 *Welcome to Shamrock Bail Bonds!*

I'm Manus, your digital assistant. I can help you:

✅ Complete bail bond paperwork
✅ Check case status
✅ Make payments
✅ Get office information

*To get started, just tell me:*
"I need to bail someone out"

Or type /help to see all options.`;
  
  bot.sendMessage(data.chatId, message);
  
  return { success: true, action: 'start_sent', chatId: data.chatId };
}

/**
 * Handle help/menu request
 */
function _handleHelpMenu(data) {
  const bot = new TelegramBotAPI();
  
  const message = `📋 *Shamrock Bail Bonds - Menu*

*Commands:*
/start - Start conversation
/help - Show this menu
/status - Check case status
/cancel - Cancel current operation

*Quick Actions:*
• "I need to bail someone out" - Start paperwork
• "Payment" - Get payment link
• "Office location" - Get our address
• "Contact" - Get phone number

*Need immediate help?*
Call us: (239) 955-0178

Just send me a message and I'll assist you! 😊`;
  
  bot.sendMessage(data.chatId, message);
  
  return { success: true, action: 'help_sent', chatId: data.chatId };
}

/**
 * Handle status request
 */
function _handleStatus(data) {
  const bot = new TelegramBotAPI();
  bot.sendMessage(data.chatId, 'Let me check your case status... 🔍\n\nPlease provide your case number or defendant name.');
  
  return { success: true, action: 'status_requested', chatId: data.chatId };
}

/**
 * Handle cancel command
 */
function _handleCancel(data) {
  const bot = new TelegramBotAPI();
  
  // Clear conversation state
  const userId = data.userId.toString();
  try {
    CacheService.getScriptCache().remove(`intake_${userId}`);
    CacheService.getScriptCache().remove(`photo_${userId}`);
  } catch (e) {
    console.warn('Could not clear cache:', e);
  }
  
  bot.sendMessage(data.chatId, '❌ Operation cancelled.\n\nType /start to begin again.');
  
  return { success: true, action: 'cancelled', chatId: data.chatId };
}

/**
 * Handle unknown command
 */
function _handleUnknownCommand(data) {
  const bot = new TelegramBotAPI();
  bot.sendMessage(data.chatId, `I don't recognize that command. Type /help to see available commands.`);
  
  return { success: true, action: 'unknown_command', chatId: data.chatId };
}

/**
 * Handle payment inquiry
 */
function _handlePaymentInquiry(data) {
  const bot = new TelegramBotAPI();
  bot.sendMessage(data.chatId, '💳 *Payment Information*\n\nTo get your payment link, please provide your case number or the defendant\'s name.');
  
  return { success: true, action: 'payment_inquiry', chatId: data.chatId };
}

/**
 * Handle location request
 */
function _handleLocationRequest(data) {
  const bot = new TelegramBotAPI();
  
  const message = `📍 *Shamrock Bail Bonds*

**Address:**
1234 Main Street
Fort Myers, FL 33901

**Phone:**
(239) 955-0178

**Hours:**
24/7 - We're always here to help!

[View on Google Maps](https://www.google.com/maps?q=Shamrock+Bail+Bonds+Fort+Myers)`;
  
  bot.sendMessage(data.chatId, message);
  
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
  
  // Convert Telegram data to WhatsApp-like format for Manus
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
  
  // Hand off to Manus_Brain (reuses WhatsApp handler!)
  if (typeof handleManusWhatsApp === 'function') {
    return handleManusWhatsApp(manusData);
  } else {
    console.warn('handleManusWhatsApp function not found');
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
  
  // Handle different callback data
  switch (data) {
    case 'start_intake':
      bot.sendMessage(chatId, 'Great! Let\'s start. What is the defendant\'s full legal name?');
      return { success: true, action: 'intake_started' };
      
    case 'check_status':
      bot.sendMessage(chatId, 'Please provide your case number or defendant name.');
      return { success: true, action: 'status_check' };
      
    case 'make_payment':
      bot.sendMessage(chatId, 'Please provide your case number to get your payment link.');
      return { success: true, action: 'payment_request' };
      
    default:
      bot.sendMessage(chatId, 'Button clicked! Processing your request...');
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
    const config = _getConfig();
    if (!config.GOOGLE_SHEET_ID) return;
    
    const ss = SpreadsheetApp.openById(config.GOOGLE_SHEET_ID);
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

/**
 * Get configuration
 */
function _getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    GOOGLE_SHEET_ID: props.getProperty('SPREADSHEET_ID') || props.getProperty('GOOGLE_SHEET_ID') || ''
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Functions are global in GAS - no explicit exports needed
