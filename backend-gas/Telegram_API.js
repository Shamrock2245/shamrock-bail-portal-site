/**
 * Telegram_API.js
 * 
 * Telegram Bot API client for Shamrock Bail Bonds
 * Handles all Telegram Bot API interactions
 * 
 * Features:
 * - Send text messages
 * - Send photos/documents
 * - Download media files
 * - Handle inline keyboards
 * - Send location requests
 * - Error handling and retry logic
 * 
 * API Documentation: https://core.telegram.org/bots/api
 * 
 * Version: 1.0.0
 * Date: 2026-02-19
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Get Telegram configuration from Script Properties
 */
function getTelegramConfig() {
  const props = PropertiesService.getScriptProperties();
  
  return {
    botToken: props.getProperty('TELEGRAM_BOT_TOKEN') || '',
    baseUrl: 'https://api.telegram.org/bot',
    maxRetries: 3,
    retryDelay: 1000 // milliseconds
  };
}

// =============================================================================
// TELEGRAM BOT API CLIENT CLASS
// =============================================================================

class TelegramBotAPI {
  constructor() {
    const config = getTelegramConfig();
    this.botToken = config.botToken;
    this.baseUrl = config.baseUrl + this.botToken;
    this.maxRetries = config.maxRetries;
    this.retryDelay = config.retryDelay;
    
    if (!this.botToken) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured in Script Properties');
    }
  }
  
  // ===========================================================================
  // CORE API METHODS
  // ===========================================================================
  
  /**
   * Make API request to Telegram
   * @param {string} method - API method name (e.g., 'sendMessage')
   * @param {object} params - Request parameters
   * @returns {object} - API response
   */
  _request(method, params = {}) {
    const url = `${this.baseUrl}/${method}`;
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(params),
      muteHttpExceptions: true
    };
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();
        
        if (responseCode === 200) {
          const data = JSON.parse(responseText);
          
          if (data.ok) {
            return data.result;
          } else {
            console.error(`Telegram API error: ${data.description}`);
            lastError = new Error(data.description);
          }
        } else {
          console.error(`HTTP ${responseCode}: ${responseText}`);
          lastError = new Error(`HTTP ${responseCode}`);
        }
        
      } catch (e) {
        console.error(`Telegram API request failed (attempt ${attempt}):`, e);
        lastError = e;
      }
      
      // Retry with exponential backoff
      if (attempt < this.maxRetries) {
        Utilities.sleep(this.retryDelay * attempt);
      }
    }
    
    throw lastError || new Error('Telegram API request failed');
  }
  
  // ===========================================================================
  // MESSAGE SENDING
  // ===========================================================================
  
  /**
   * Send text message
   * @param {string|number} chatId - Chat ID or username
   * @param {string} text - Message text (supports Markdown)
   * @param {object} options - Additional options (keyboard, parse_mode, etc.)
   * @returns {object} - Sent message
   */
  sendMessage(chatId, text, options = {}) {
    console.log(`📤 Sending Telegram message to ${chatId}`);
    
    const params = {
      chat_id: chatId,
      text: text,
      parse_mode: options.parse_mode || 'Markdown',
      disable_web_page_preview: options.disable_preview || false,
      ...options
    };
    
    try {
      const result = this._request('sendMessage', params);
      console.log(`✅ Message sent: ${result.message_id}`);
      return { success: true, messageId: result.message_id, result: result };
    } catch (e) {
      console.error('Failed to send message:', e);
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Send photo
   * @param {string|number} chatId - Chat ID
   * @param {string} photo - File ID or URL
   * @param {string} caption - Photo caption
   * @param {object} options - Additional options
   * @returns {object} - Sent message
   */
  sendPhoto(chatId, photo, caption = '', options = {}) {
    console.log(`📤 Sending photo to ${chatId}`);
    
    const params = {
      chat_id: chatId,
      photo: photo,
      caption: caption,
      parse_mode: options.parse_mode || 'Markdown',
      ...options
    };
    
    try {
      const result = this._request('sendPhoto', params);
      return { success: true, messageId: result.message_id, result: result };
    } catch (e) {
      console.error('Failed to send photo:', e);
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Send document
   * @param {string|number} chatId - Chat ID
   * @param {string} document - File ID or URL
   * @param {string} caption - Document caption
   * @param {object} options - Additional options
   * @returns {object} - Sent message
   */
  sendDocument(chatId, document, caption = '', options = {}) {
    console.log(`📤 Sending document to ${chatId}`);
    
    const params = {
      chat_id: chatId,
      document: document,
      caption: caption,
      parse_mode: options.parse_mode || 'Markdown',
      ...options
    };
    
    try {
      const result = this._request('sendDocument', params);
      return { success: true, messageId: result.message_id, result: result };
    } catch (e) {
      console.error('Failed to send document:', e);
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Send voice message (audio file)
   * @param {string|number} chatId - Chat ID
   * @param {string} voice - File ID or URL
   * @param {object} options - Additional options
   * @returns {object} - Sent message
   */
  sendVoice(chatId, voice, options = {}) {
    console.log(`📤 Sending voice message to ${chatId}`);
    
    const params = {
      chat_id: chatId,
      voice: voice,
      ...options
    };
    
    try {
      const result = this._request('sendVoice', params);
      return { success: true, messageId: result.message_id, result: result };
    } catch (e) {
      console.error('Failed to send voice:', e);
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Send location
   * @param {string|number} chatId - Chat ID
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {object} options - Additional options
   * @returns {object} - Sent message
   */
  sendLocation(chatId, latitude, longitude, options = {}) {
    const params = {
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude,
      ...options
    };
    
    try {
      const result = this._request('sendLocation', params);
      return { success: true, messageId: result.message_id, result: result };
    } catch (e) {
      console.error('Failed to send location:', e);
      return { success: false, error: e.message };
    }
  }
  
  // ===========================================================================
  // INTERACTIVE ELEMENTS
  // ===========================================================================
  
  /**
   * Send message with inline keyboard
   * @param {string|number} chatId - Chat ID
   * @param {string} text - Message text
   * @param {array} buttons - Array of button rows
   * @returns {object} - Sent message
   * 
   * Example buttons format:
   * [
   *   [{ text: 'Button 1', callback_data: 'btn1' }],
   *   [{ text: 'Button 2', url: 'https://example.com' }]
   * ]
   */
  sendMessageWithKeyboard(chatId, text, buttons) {
    const keyboard = {
      inline_keyboard: buttons
    };
    
    return this.sendMessage(chatId, text, {
      reply_markup: keyboard
    });
  }
  
  /**
   * Request location from user
   * @param {string|number} chatId - Chat ID
   * @param {string} text - Request message
   * @returns {object} - Sent message
   */
  requestLocation(chatId, text) {
    const keyboard = {
      keyboard: [
        [{
          text: '📍 Share My Location',
          request_location: true
        }]
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    };
    
    return this.sendMessage(chatId, text, {
      reply_markup: keyboard
    });
  }
  
  /**
   * Answer callback query (from inline keyboard button)
   * @param {string} callbackQueryId - Callback query ID
   * @param {string} text - Alert text (optional)
   * @param {boolean} showAlert - Show as alert vs toast
   * @returns {object} - Result
   */
  answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    const params = {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    };
    
    try {
      this._request('answerCallbackQuery', params);
      return { success: true };
    } catch (e) {
      console.error('Failed to answer callback query:', e);
      return { success: false, error: e.message };
    }
  }
  
  // ===========================================================================
  // FILE OPERATIONS
  // ===========================================================================
  
  /**
   * Get file info
   * @param {string} fileId - Telegram file ID
   * @returns {object} - File info with file_path
   */
  getFile(fileId) {
    try {
      return this._request('getFile', { file_id: fileId });
    } catch (e) {
      console.error('Failed to get file info:', e);
      throw e;
    }
  }
  
  /**
   * Download file
   * @param {string} fileId - Telegram file ID
   * @returns {Blob} - File blob
   */
  downloadFile(fileId) {
    console.log(`⬇️ Downloading file: ${fileId}`);
    
    try {
      // Get file info
      const fileInfo = this.getFile(fileId);
      const filePath = fileInfo.file_path;
      
      // Download file
      const fileUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
      const response = UrlFetchApp.fetch(fileUrl);
      const blob = response.getBlob();
      
      console.log(`✅ File downloaded: ${blob.getName()} (${blob.getBytes().length} bytes)`);
      
      return blob;
      
    } catch (e) {
      console.error('Failed to download file:', e);
      throw e;
    }
  }
  
  // ===========================================================================
  // BOT MANAGEMENT
  // ===========================================================================
  
  /**
   * Get bot info
   * @returns {object} - Bot information
   */
  getMe() {
    try {
      return this._request('getMe');
    } catch (e) {
      console.error('Failed to get bot info:', e);
      throw e;
    }
  }
  
  /**
   * Set webhook URL
   * @param {string} url - Webhook URL
   * @returns {boolean} - Success
   */
  setWebhook(url) {
    console.log(`Setting webhook: ${url}`);
    
    try {
      this._request('setWebhook', { url: url });
      console.log('✅ Webhook set successfully');
      return true;
    } catch (e) {
      console.error('Failed to set webhook:', e);
      return false;
    }
  }
  
  /**
   * Delete webhook
   * @returns {boolean} - Success
   */
  deleteWebhook() {
    try {
      this._request('deleteWebhook');
      console.log('✅ Webhook deleted');
      return true;
    } catch (e) {
      console.error('Failed to delete webhook:', e);
      return false;
    }
  }
  
  /**
   * Get webhook info
   * @returns {object} - Webhook information
   */
  getWebhookInfo() {
    try {
      return this._request('getWebhookInfo');
    } catch (e) {
      console.error('Failed to get webhook info:', e);
      throw e;
    }
  }
  
  // ===========================================================================
  // CHAT ACTIONS
  // ===========================================================================
  
  /**
   * Send chat action (typing indicator)
   * @param {string|number} chatId - Chat ID
   * @param {string} action - Action type (typing, upload_photo, etc.)
   * @returns {boolean} - Success
   */
  sendChatAction(chatId, action = 'typing') {
    try {
      this._request('sendChatAction', {
        chat_id: chatId,
        action: action
      });
      return true;
    } catch (e) {
      console.error('Failed to send chat action:', e);
      return false;
    }
  }
  
  /**
   * Show typing indicator
   * @param {string|number} chatId - Chat ID
   */
  showTyping(chatId) {
    this.sendChatAction(chatId, 'typing');
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format phone number for Telegram (remove + and spaces)
 * Telegram uses chat IDs, not phone numbers, but this is useful for logging
 */
function formatTelegramPhone(phone) {
  if (!phone) return null;
  return phone.toString().replace(/[^\d]/g, '');
}

/**
 * Escape Markdown special characters
 */
function escapeTelegramMarkdown(text) {
  if (!text) return '';
  return text.toString()
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

/**
 * Format message with bold/italic (Markdown)
 */
function formatTelegramMessage(text, options = {}) {
  let formatted = text;
  
  if (options.bold) {
    formatted = `*${formatted}*`;
  }
  
  if (options.italic) {
    formatted = `_${formatted}_`;
  }
  
  if (options.code) {
    formatted = `\`${formatted}\``;
  }
  
  return formatted;
}

// =============================================================================
// TESTING FUNCTIONS
// =============================================================================

/**
 * Test Telegram connection
 */
function testTelegramConnection() {
  try {
    const bot = new TelegramBotAPI();
    const me = bot.getMe();
    
    console.log('✅ Telegram bot connected!');
    console.log(`Bot name: ${me.first_name}`);
    console.log(`Username: @${me.username}`);
    console.log(`Bot ID: ${me.id}`);
    
    return { success: true, bot: me };
    
  } catch (e) {
    console.error('❌ Telegram connection failed:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Test sending a message
 */
function testTelegramMessage(chatId, message = 'Hello from Shamrock Bail Bonds! 🎉') {
  try {
    const bot = new TelegramBotAPI();
    const result = bot.sendMessage(chatId, message);
    
    if (result.success) {
      console.log('✅ Test message sent successfully!');
    } else {
      console.error('❌ Failed to send test message:', result.error);
    }
    
    return result;
    
  } catch (e) {
    console.error('❌ Test failed:', e);
    return { success: false, error: e.message };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Functions are global in GAS - no explicit exports needed
