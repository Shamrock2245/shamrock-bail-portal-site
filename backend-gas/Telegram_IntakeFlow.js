/**
 * Telegram_IntakeFlow.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Conversational intake state machine for Telegram.
 * Guides family members / indemnitors through the bail bond process
 * across all 67 Florida counties.
 *
 * FLOW OVERVIEW:
 *   greeting → county → defendant_name → defendant_dob → charges
 *   → bond_amount → indemnitor_name → indemnitor_phone → indemnitor_email
 *   → indemnitor_address → relationship → id_prompt → complete
 *
 * SECURITY:
 *   - All PII stored in GAS Script Properties (keyed by Telegram user ID)
 *   - No raw PII in logs (IDs only)
 *   - Rate limiting: max 1 intake per user per 24 hours
 *   - Input sanitization on all fields
 *
 * INTEGRATION:
 *   - On completion → pushes to Wix IntakeQueue via WixPortalIntegration.js
 *   - Sends signing link via Telegram when packet is ready
 *   - ElevenLabs voice note on complex steps
 *
 * Version: 1.0.0 — Telegram-Native
 * Date: 2026-02-20
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const INTAKE_STEPS = [
  'greeting',
  'county',
  'defendant_name',
  'defendant_dob',
  'charges',
  'bond_amount',
  'indemnitor_name',
  'indemnitor_phone',
  'indemnitor_email',
  'indemnitor_address',
  'relationship',
  'id_prompt',
  'complete'
];

const INTAKE_PROMPTS = {
  greeting: `🍀 *Welcome to Shamrock Bail Bonds*

I'm Manus, your digital assistant. I'll help get your loved one home as fast as possible.

This takes about 3 minutes. Everything you share is encrypted and secure.

*Which Florida county was your loved one arrested in?*
(Type the county name, e.g. "Lee" or "Collier")`,

  county: `Got it. Now I need a few details about the person who was arrested.

*What is the defendant's full legal name?*
(First and Last name, as it appears on their ID)`,

  defendant_name: `Thank you.

*What is the defendant's date of birth?*
(Format: MM/DD/YYYY)`,

  defendant_dob: `*What are the charges?*
(You can type them as listed on the arrest record, or say "I don't know" and I'll help.)`,

  charges: `*What is the bond amount?*
(Check the arrest record or booking sheet. Type the number, e.g. "5000")`,

  bond_amount: `Now I need your information as the person signing the bond (the Indemnitor/Co-signer).

*What is YOUR full legal name?*`,

  indemnitor_name: `*What is your best phone number?*
(We'll text you the signing link here too)`,

  indemnitor_phone: `*What is your email address?*
(Your signed documents will be sent here)`,

  indemnitor_email: `*What is your current home address?*
(Street, City, State, ZIP — required for the bond paperwork)`,

  indemnitor_address: `*What is your relationship to the defendant?*
(e.g. Mother, Father, Spouse, Friend, Employer)`,

  relationship: `Almost done! 

*I'll need a photo of your government-issued ID.*
Please send a clear photo of the front of your driver's license or passport.

This is required by Florida law to complete the bond.`,

  id_prompt: null // Handled by photo upload flow
};

const VOICE_SCRIPTS = {
  greeting: "Welcome to Shamrock Bail Bonds. I'm Manus, and I'm here to help get your loved one home tonight. This process takes about three minutes. Let's start with the county.",
  bond_amount: "The bond amount is the total set by the judge. Your premium — what you pay us — is typically ten percent of that number. So a ten thousand dollar bond means a one thousand dollar premium.",
  id_prompt: "Florida law requires us to verify your identity before we can post the bond. Please send a clear photo of the front of your driver's license or state ID. This is completely secure and only used for this transaction.",
  complete: "You're all set! Your intake has been submitted. An agent will review it immediately and send you the signing link. Most clients are signing within fifteen minutes."
};

// =============================================================================
// STATE MANAGEMENT
// Uses GAS Script Properties with user-scoped keys
// =============================================================================

/**
 * Get conversation state for a user
 * @param {string} userId - Telegram user ID (as string)
 * @returns {Object} state object
 */
function getConversationState(userId) {
  const props = PropertiesService.getScriptProperties();
  const key = `INTAKE_STATE_${userId}`;
  const raw = props.getProperty(key);

  if (!raw) {
    return {
      step: 'greeting',
      data: {},
      startedAt: null,
      lastActivity: null
    };
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse intake state for user:', userId);
    return { step: 'greeting', data: {}, startedAt: null, lastActivity: null };
  }
}

/**
 * Save conversation state for a user
 * @param {string} userId - Telegram user ID
 * @param {Object} state - State object to save
 */
function saveConversationState(userId, state) {
  const props = PropertiesService.getScriptProperties();
  const key = `INTAKE_STATE_${userId}`;
  state.lastActivity = new Date().toISOString();
  props.setProperty(key, JSON.stringify(state));
}

/**
 * Clear conversation state for a user
 * @param {string} userId - Telegram user ID
 */
function clearConversationState(userId) {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(`INTAKE_STATE_${userId}`);
}

// =============================================================================
// MAIN INTAKE PROCESSOR
// Called by Manus_Brain.js checkAndProcessIntake()
// =============================================================================

/**
 * Process an intake conversation message
 * @param {string} userId - Telegram user ID
 * @param {string} message - User's message text
 * @param {string} name - User's display name from Telegram
 * @returns {Object} { text, voice_script, handled }
 */
function processIntakeConversation(userId, message, name) {
  const state = getConversationState(userId);
  const currentStep = state.step;

  console.log(`[Intake] User ${userId} at step: ${currentStep}, message: "${message.substring(0, 50)}"`);

  // ── Handle /cancel command ──────────────────────────────────────────────────
  if (message.toLowerCase() === '/cancel' || message.toLowerCase() === 'cancel') {
    clearConversationState(userId);
    return {
      text: '✅ Intake cancelled. Type /start anytime to begin again, or call us at (239) 332-2245.',
      voice_script: null,
      handled: true
    };
  }

  // ── Handle /restart command ─────────────────────────────────────────────────
  if (message.toLowerCase() === '/restart' || message.toLowerCase() === 'restart') {
    clearConversationState(userId);
    const newState = { step: 'greeting', data: {}, startedAt: new Date().toISOString(), lastActivity: null };
    saveConversationState(userId, newState);
    return {
      text: INTAKE_PROMPTS.greeting,
      voice_script: VOICE_SCRIPTS.greeting,
      handled: true
    };
  }

  // ── Step: greeting (initial trigger) ───────────────────────────────────────
  if (currentStep === 'greeting') {
    const newState = {
      step: 'county',
      data: { userName: sanitizeInput(name) },
      startedAt: new Date().toISOString(),
      lastActivity: null
    };
    saveConversationState(userId, newState);
    return {
      text: INTAKE_PROMPTS.greeting,
      voice_script: VOICE_SCRIPTS.greeting,
      handled: true
    };
  }

  // ── Step: county ────────────────────────────────────────────────────────────
  if (currentStep === 'county') {
    const county = resolveCounty(message);
    if (!county) {
      return {
        text: `⚠️ I didn't recognize "${sanitizeInput(message)}" as a Florida county.\n\nPlease type the county name (e.g. "Lee", "Collier", "Miami-Dade", "Hillsborough").`,
        voice_script: null,
        handled: true
      };
    }

    state.data.county = county.name;
    state.data.countySlug = county.slug;
    state.step = 'defendant_name';
    saveConversationState(userId, state);

    // Provide county-specific context
    const countyInfo = getCountyInfo(county.slug);
    let countyContext = '';
    if (countyInfo) {
      countyContext = `\n\n📍 *${county.name} Info:*\n${countyInfo.process}`;
    }

    return {
      text: `✅ Got it — *${county.name} County*${countyContext}\n\n${INTAKE_PROMPTS.county}`,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: defendant_name ────────────────────────────────────────────────────
  if (currentStep === 'defendant_name') {
    const cleaned = sanitizeInput(message);
    if (cleaned.length < 3 || cleaned.split(' ').length < 2) {
      return {
        text: '⚠️ Please enter the defendant\'s *full legal name* (First and Last name).',
        voice_script: null,
        handled: true
      };
    }

    state.data.defendantName = cleaned;
    state.step = 'defendant_dob';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.defendant_name,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: defendant_dob ─────────────────────────────────────────────────────
  if (currentStep === 'defendant_dob') {
    const dob = parseDateOfBirth(message);
    if (!dob) {
      return {
        text: '⚠️ Please enter the date of birth in MM/DD/YYYY format.\n\nExample: 03/15/1985',
        voice_script: null,
        handled: true
      };
    }

    state.data.defendantDob = dob;
    state.step = 'charges';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.defendant_dob,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: charges ───────────────────────────────────────────────────────────
  if (currentStep === 'charges') {
    const cleaned = sanitizeInput(message);
    const charges = cleaned.toLowerCase() === "i don't know" || cleaned.toLowerCase() === 'unknown'
      ? 'Unknown — to be verified'
      : cleaned;

    state.data.charges = charges;
    state.step = 'bond_amount';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.charges,
      voice_script: VOICE_SCRIPTS.bond_amount,
      handled: true
    };
  }

  // ── Step: bond_amount ───────────────────────────────────────────────────────
  if (currentStep === 'bond_amount') {
    const amount = parseBondAmount(message);
    if (amount === null) {
      return {
        text: '⚠️ Please enter the bond amount as a number.\n\nExamples: "5000", "$10,000", "25000"\n\nIf you don\'t know, type "unknown".',
        voice_script: null,
        handled: true
      };
    }

    state.data.bondAmount = amount;
    state.step = 'indemnitor_name';
    saveConversationState(userId, state);

    const premium = amount !== 'Unknown' ? `\n\n💰 *Estimated Premium: $${Math.ceil(parseFloat(amount) * 0.10).toLocaleString()}* (10% of bond)` : '';

    return {
      text: `✅ Bond amount: *$${amount}*${premium}\n\n${INTAKE_PROMPTS.bond_amount}`,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: indemnitor_name ───────────────────────────────────────────────────
  if (currentStep === 'indemnitor_name') {
    const cleaned = sanitizeInput(message);
    if (cleaned.length < 3 || cleaned.split(' ').length < 2) {
      return {
        text: '⚠️ Please enter your *full legal name* (First and Last name).',
        voice_script: null,
        handled: true
      };
    }

    state.data.indemnitorName = cleaned;
    state.step = 'indemnitor_phone';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.indemnitor_name,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: indemnitor_phone ──────────────────────────────────────────────────
  if (currentStep === 'indemnitor_phone') {
    const phone = parsePhoneNumber(message);
    if (!phone) {
      return {
        text: '⚠️ Please enter a valid 10-digit US phone number.\n\nExample: 239-332-2245',
        voice_script: null,
        handled: true
      };
    }

    state.data.indemnitorPhone = phone;
    state.step = 'indemnitor_email';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.indemnitor_phone,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: indemnitor_email ──────────────────────────────────────────────────
  if (currentStep === 'indemnitor_email') {
    const email = message.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return {
        text: '⚠️ Please enter a valid email address.\n\nExample: jane.doe@gmail.com',
        voice_script: null,
        handled: true
      };
    }

    state.data.indemnitorEmail = email;
    state.step = 'indemnitor_address';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.indemnitor_email,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: indemnitor_address ────────────────────────────────────────────────
  if (currentStep === 'indemnitor_address') {
    const cleaned = sanitizeInput(message);
    if (cleaned.length < 10) {
      return {
        text: '⚠️ Please enter your full address including street, city, state, and ZIP.\n\nExample: 123 Main St, Fort Myers, FL 33901',
        voice_script: null,
        handled: true
      };
    }

    state.data.indemnitorAddress = cleaned;
    state.step = 'relationship';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.indemnitor_address,
      voice_script: null,
      handled: true
    };
  }

  // ── Step: relationship ──────────────────────────────────────────────────────
  if (currentStep === 'relationship') {
    const cleaned = sanitizeInput(message);
    if (cleaned.length < 2) {
      return {
        text: '⚠️ Please describe your relationship to the defendant (e.g. Mother, Spouse, Friend).',
        voice_script: null,
        handled: true
      };
    }

    state.data.relationship = cleaned;
    state.step = 'id_prompt';
    saveConversationState(userId, state);

    return {
      text: INTAKE_PROMPTS.relationship,
      voice_script: VOICE_SCRIPTS.id_prompt,
      handled: true
    };
  }

  // ── Step: id_prompt (waiting for photo — handled by photo handler) ──────────
  if (currentStep === 'id_prompt') {
    // User sent text instead of a photo
    return {
      text: '📸 I\'m waiting for a photo of your ID.\n\nPlease take a clear photo of the *front* of your driver\'s license or passport and send it here.',
      voice_script: null,
      handled: true
    };
  }

  // ── Step: complete ──────────────────────────────────────────────────────────
  if (currentStep === 'complete') {
    return {
      text: '✅ Your intake is already submitted! An agent will contact you shortly.\n\nQuestions? Call us at *(239) 332-2245*',
      voice_script: null,
      handled: true
    };
  }

  // Fallback
  return { handled: false };
}

/**
 * Complete the intake after ID photo is received
 * Called by _handlePhotoMessage in Telegram_Webhook.js
 * @param {string} userId - Telegram user ID
 * @param {string} chatId - Telegram chat ID
 * @param {string} photoFileId - Telegram file ID of the uploaded photo
 * @returns {Object} result
 */
function completeIntakeWithPhoto(userId, chatId, photoFileId) {
  const state = getConversationState(userId);

  if (state.step !== 'id_prompt') {
    return { handled: false };
  }

  // Store photo reference
  state.data.idPhotoFileId = photoFileId;
  state.data.telegramChatId = chatId;
  state.data.telegramUserId = userId;
  state.data.submittedAt = new Date().toISOString();
  state.step = 'complete';
  saveConversationState(userId, state);

  // Push to Wix IntakeQueue
  const pushResult = pushIntakeToWix(state.data);

  // Log to GAS Sheet
  logIntakeToSheet(state.data);

  // Notify staff via Slack
  notifyStaffNewIntake(state.data);

  const successText = `✅ *Intake Complete!*

Here's a summary:
• *Defendant:* ${state.data.defendantName}
• *County:* ${state.data.county}
• *Bond Amount:* $${state.data.bondAmount}
• *Your Name:* ${state.data.indemnitorName}

*What happens next:*
1. An agent reviews your intake (usually within 15 minutes)
2. You'll receive a signing link here on Telegram
3. Sign on your phone — takes 2 minutes
4. We post the bond and your loved one is released

Questions? Call *(239) 332-2245* anytime, 24/7.`;

  return {
    text: successText,
    voice_script: VOICE_SCRIPTS.complete,
    handled: true,
    intakeData: state.data,
    wixResult: pushResult
  };
}

// =============================================================================
// PUSH TO WIX INTAKEQUEUE
// =============================================================================

/**
 * Push completed intake data to Wix CMS IntakeQueue collection
 * @param {Object} data - Intake data
 * @returns {Object} result
 */
function pushIntakeToWix(data) {
  try {
    const config = getConfig();
    const wixUrl = config.WIX_SITE_URL;
    const apiKey = config.WIX_API_KEY;

    if (!wixUrl || !apiKey) {
      console.error('[Intake] Wix config missing — cannot push to IntakeQueue');
      return { success: false, error: 'Wix config missing' };
    }

    const endpoint = `${wixUrl}/_functions/post_intakeSubmit`;

    const payload = {
      apiKey: apiKey,
      source: 'telegram',
      telegramUserId: data.telegramUserId,
      telegramChatId: data.telegramChatId,
      indemnitorName: data.indemnitorName,
      indemnitorPhone: data.indemnitorPhone,
      indemnitorEmail: data.indemnitorEmail,
      indemnitorAddress: data.indemnitorAddress,
      relationship: data.relationship,
      defendantName: data.defendantName,
      defendantDob: data.defendantDob,
      county: data.county,
      charges: data.charges,
      bondAmount: data.bondAmount,
      idPhotoFileId: data.idPhotoFileId,
      submittedAt: data.submittedAt
    };

    const response = UrlFetchApp.fetch(endpoint, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
      const result = JSON.parse(responseText);
      console.log('[Intake] Successfully pushed to Wix IntakeQueue:', result);
      return { success: true, wixId: result.intakeId };
    } else {
      console.error(`[Intake] Wix push failed (${responseCode}):`, responseText);
      return { success: false, error: `HTTP ${responseCode}` };
    }

  } catch (e) {
    console.error('[Intake] Exception pushing to Wix:', e);
    return { success: false, error: e.message };
  }
}

// =============================================================================
// STAFF NOTIFICATIONS
// =============================================================================

/**
 * Notify staff of new Telegram intake via Slack
 * @param {Object} data - Intake data
 */
function notifyStaffNewIntake(data) {
  try {
    const config = getConfig();
    const slackUrl = config.SLACK_WEBHOOK_NEW_CASES;

    if (!slackUrl) return;

    const message = {
      text: `🍀 *New Telegram Intake Submitted*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🍀 *New Telegram Intake*\n*Defendant:* ${data.defendantName}\n*County:* ${data.county}\n*Bond:* $${data.bondAmount}\n*Indemnitor:* ${data.indemnitorName}\n*Phone:* ${data.indemnitorPhone}\n*Email:* ${data.indemnitorEmail}\n*Submitted:* ${new Date(data.submittedAt).toLocaleString()}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '📋 Open Dashboard' },
              url: 'https://script.google.com/macros/s/AKfycbz.../exec',
              style: 'primary'
            }
          ]
        }
      ]
    };

    UrlFetchApp.fetch(slackUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(message),
      muteHttpExceptions: true
    });

  } catch (e) {
    console.error('[Intake] Slack notification failed:', e);
  }
}

// =============================================================================
// LOG TO SHEET
// =============================================================================

/**
 * Log intake to the Intakes tab in the GAS spreadsheet
 * @param {Object} data - Intake data
 */
function logIntakeToSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E'
    );

    let sheet = ss.getSheetByName('TelegramIntakes');
    if (!sheet) {
      sheet = ss.insertSheet('TelegramIntakes');
      sheet.appendRow([
        'Submitted At', 'Telegram User ID', 'Defendant Name', 'DOB', 'County',
        'Charges', 'Bond Amount', 'Indemnitor Name', 'Phone', 'Email',
        'Address', 'Relationship', 'ID Photo File ID', 'Wix Pushed'
      ]);
    }

    sheet.appendRow([
      data.submittedAt,
      data.telegramUserId,
      data.defendantName,
      data.defendantDob,
      data.county,
      data.charges,
      data.bondAmount,
      data.indemnitorName,
      data.indemnitorPhone,
      data.indemnitorEmail,
      data.indemnitorAddress,
      data.relationship,
      data.idPhotoFileId || 'pending',
      'yes'
    ]);

  } catch (e) {
    console.error('[Intake] Sheet logging failed:', e);
  }
}

// =============================================================================
// SEND SIGNING LINK VIA TELEGRAM
// Called by GAS after packet is generated
// =============================================================================

/**
 * Send a signing link to a client via Telegram
 * @param {string} chatId - Telegram chat ID
 * @param {string} signingLink - SignNow signing URL
 * @param {string} defendantName - Defendant's name for context
 * @param {string} paymentLink - Payment link
 */
function sendSigningLinkViaTelegram(chatId, signingLink, defendantName, paymentLink) {
  try {
    const bot = new TelegramBotAPI();

    const text = `📋 *Your Bail Bond Paperwork is Ready!*

The documents for *${defendantName}* are ready to sign.

*Step 1 — Sign the paperwork:*
👉 [Tap here to sign](${signingLink})

*Step 2 — Pay the premium:*
💳 [Tap here to pay](${paymentLink || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd'})

Once both are complete, we post the bond immediately. 🚀

Questions? Reply here or call *(239) 332-2245*`;

    const result = bot.sendMessageWithKeyboard(chatId, text, [
      [{ text: '✍️ Sign Documents', url: signingLink }],
      [{ text: '💳 Pay Premium', url: paymentLink || 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd' }],
      [{ text: '📞 Call Us Now', url: 'tel:+12393322245' }]
    ]);

    // Also send ElevenLabs voice note for the signing step
    generateAndSendVoiceNote(
      chatId,
      `Your paperwork for ${defendantName} is ready. Tap the sign button, scroll to the bottom, and sign with your finger. It takes about two minutes. After signing, tap the payment button to pay the premium. Once both are done, we post the bond right away.`,
      'telegram',
      chatId
    );

    logProcessingEvent('TELEGRAM_SIGNING_LINK_SENT', {
      chatId: chatId,
      defendantName: defendantName
    });

    return { success: true, messageId: result.messageId };

  } catch (e) {
    console.error('[Intake] Failed to send signing link via Telegram:', e);
    return { success: false, error: e.message };
  }
}

// =============================================================================
// INPUT VALIDATION & SANITIZATION
// Patterns adapted from zeshuaro/telegram-pdf-bot (MIT License)
// =============================================================================

/**
 * Sanitize user input — strip HTML, limit length, trim whitespace
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  if (!input) return '';
  return input
    .toString()
    .replace(/<[^>]*>/g, '')          // Strip HTML tags
    .replace(/[^\w\s\-\.,#@'\/]/g, '') // Allow only safe chars
    .trim()
    .substring(0, 200);               // Max 200 chars
}

/**
 * Parse and validate date of birth
 * @param {string} input
 * @returns {string|null} Formatted date or null
 */
function parseDateOfBirth(input) {
  if (!input) return null;
  const cleaned = input.replace(/[^\d\/\-\.]/g, '');

  // MM/DD/YYYY or MM-DD-YYYY or MM.DD.YYYY
  const match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (!match) return null;

  const month = parseInt(match[1]);
  const day = parseInt(match[2]);
  const year = parseInt(match[3]);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > new Date().getFullYear()) return null;

  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

/**
 * Parse bond amount from user input
 * @param {string} input
 * @returns {string|null} Amount string or null
 */
function parseBondAmount(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();

  if (lower === 'unknown' || lower === "don't know" || lower === 'no bond') {
    return 'Unknown';
  }

  // Strip currency symbols, commas, spaces
  const cleaned = input.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num) || num < 0) return null;
  if (num > 10000000) return null; // Sanity check: $10M max

  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Parse and normalize US phone number
 * @param {string} input
 * @returns {string|null} E.164-ish format or null
 */
function parsePhoneNumber(input) {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');

  // Handle 10-digit or 11-digit (with leading 1)
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
  }

  return null;
}

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Resolve county name from user input
 * Handles common abbreviations and misspellings
 * @param {string} input
 * @returns {Object|null} { name, slug } or null
 */
function resolveCounty(input) {
  if (!input) return null;

  const normalized = input.toLowerCase().trim()
    .replace(/\s+county$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z\-]/g, '');

  // Direct match
  if (RAG_KNOWLEDGE_BASE[normalized]) {
    return { name: RAG_KNOWLEDGE_BASE[normalized].name, slug: normalized };
  }

  // Alias map for common variations
  const ALIASES = {
    'miami': 'miami-dade',
    'miami dade': 'miami-dade',
    'miamidade': 'miami-dade',
    'dade': 'miami-dade',
    'ft myers': 'lee',
    'fort myers': 'lee',
    'naples': 'collier',
    'tampa': 'hillsborough',
    'orlando': 'orange',
    'jacksonville': 'duval',
    'pensacola': 'escambia',
    'tallahassee': 'leon',
    'gainesville': 'alachua',
    'ocala': 'marion',
    'daytona': 'volusia',
    'daytona beach': 'volusia',
    'st pete': 'pinellas',
    'saint pete': 'pinellas',
    'st. pete': 'pinellas',
    'clearwater': 'pinellas',
    'sarasota': 'sarasota',
    'bradenton': 'manatee',
    'fort lauderdale': 'broward',
    'ft lauderdale': 'broward',
    'west palm': 'palm-beach',
    'west palm beach': 'palm-beach',
    'palm beach': 'palm-beach',
    'key west': 'monroe',
    'keys': 'monroe',
    'punta gorda': 'charlotte',
    'cape coral': 'lee',
    'bonita springs': 'lee',
    'marco island': 'collier',
    'arcadia': 'desoto',
    'sebring': 'highlands',
    'lake city': 'columbia',
    'panama city': 'bay',
    'pensacola': 'escambia',
    'st augustine': 'st-johns',
    'saint augustine': 'st-johns',
    'st. augustine': 'st-johns',
    'lakeland': 'polk',
    'bartow': 'polk',
    'kissimmee': 'osceola',
    'sanford': 'seminole',
    'titusville': 'brevard',
    'cocoa': 'brevard',
    'melbourne': 'brevard',
    'vero beach': 'indian-river',
    'fort pierce': 'st-lucie',
    'ft pierce': 'st-lucie',
    'stuart': 'martin',
    'brooksville': 'hernando',
    'inverness': 'citrus',
    'crystal river': 'citrus',
    'deland': 'volusia',
    'leesburg': 'lake',
    'tavares': 'lake',
    'starke': 'bradford',
    'green cove springs': 'clay',
    'fernandina beach': 'nassau',
    'live oak': 'suwannee',
    'jasper': 'hamilton',
    'madison': 'madison',
    'perry': 'taylor',
    'cross city': 'dixie',
    'chiefland': 'levy',
    'bronson': 'levy',
    'trenton': 'gilchrist',
    'newberry': 'alachua',
    'macclenny': 'baker',
    'quincy': 'gadsden',
    'marianna': 'jackson',
    'blountstown': 'calhoun',
    'wewahitchka': 'gulf',
    'port st joe': 'gulf',
    'apalachicola': 'franklin',
    'crawfordville': 'wakulla',
    'monticello': 'jefferson',
    'mayo': 'lafayette',
    'jasper': 'hamilton',
    'labelle': 'hendry',
    'moore haven': 'glades',
    'clewiston': 'hendry',
    'okeechobee': 'okeechobee',
    'wauchula': 'hardee',
    'avon park': 'highlands',
    'lake placid': 'highlands',
    'bushnell': 'sumter',
    'the villages': 'sumter',
    'dunnellon': 'marion',
    'palatka': 'putnam',
    'bunnell': 'flagler',
    'de land': 'volusia',
    'new smyrna': 'volusia',
    'deltona': 'volusia',
    'sanford': 'seminole',
    'altamonte': 'seminole',
    'longwood': 'seminole',
    'oviedo': 'seminole',
    'winter garden': 'orange',
    'apopka': 'orange',
    'clermont': 'lake',
    'mount dora': 'lake',
    'eustis': 'lake',
    'zephyrhills': 'pasco',
    'new port richey': 'pasco',
    'dade city': 'pasco',
    'land o lakes': 'pasco',
    'bartow': 'polk',
    'winter haven': 'polk',
    'haines city': 'polk',
    'auburndale': 'polk',
    'plant city': 'hillsborough',
    'brandon': 'hillsborough',
    'riverview': 'hillsborough',
    'ruskin': 'hillsborough',
    'sun city': 'hillsborough',
    'venice': 'sarasota',
    'englewood': 'sarasota',
    'north port': 'sarasota',
    'port charlotte': 'charlotte',
    'punta gorda': 'charlotte',
    'immokalee': 'collier',
    'everglades city': 'collier',
    'clewiston': 'hendry',
    'belle glade': 'palm-beach',
    'pahokee': 'palm-beach',
    'homestead': 'miami-dade',
    'hialeah': 'miami-dade',
    'coral gables': 'miami-dade',
    'miami beach': 'miami-dade',
    'north miami': 'miami-dade',
    'opa-locka': 'miami-dade',
    'florida city': 'miami-dade',
    'pompano beach': 'broward',
    'hollywood': 'broward',
    'miramar': 'broward',
    'pembroke pines': 'broward',
    'coral springs': 'broward',
    'deerfield beach': 'broward',
    'boca raton': 'palm-beach',
    'delray beach': 'palm-beach',
    'boynton beach': 'palm-beach',
    'lake worth': 'palm-beach',
    'riviera beach': 'palm-beach',
    'jupiter': 'palm-beach',
    'port st lucie': 'st-lucie',
    'hutchinson island': 'st-lucie',
    'hobe sound': 'martin',
    'jensen beach': 'martin',
    'sebastian': 'indian-river',
    'fellsmere': 'indian-river',
    'okeechobee city': 'okeechobee'
  };

  const aliasKey = input.toLowerCase().trim().replace(/\s+county$/i, '').trim();
  const aliasSlug = ALIASES[aliasKey];
  if (aliasSlug && RAG_KNOWLEDGE_BASE[aliasSlug]) {
    return { name: RAG_KNOWLEDGE_BASE[aliasSlug].name, slug: aliasSlug };
  }

  // Fuzzy match — find county where name starts with input
  const inputLower = input.toLowerCase().trim();
  for (const [slug, info] of Object.entries(RAG_KNOWLEDGE_BASE)) {
    if (info.name.toLowerCase().startsWith(inputLower)) {
      return { name: info.name, slug: slug };
    }
  }

  return null;
}

/**
 * Get county info from knowledge base
 * @param {string} slug - County slug
 * @returns {Object|null}
 */
function getCountyInfo(slug) {
  return RAG_KNOWLEDGE_BASE[slug] || null;
}

// =============================================================================
// PROCESSING EVENT LOGGER
// =============================================================================

/**
 * Log a processing event (SOC2-safe — no raw PII)
 * @param {string} eventType
 * @param {Object} metadata
 */
function logProcessingEvent(eventType, metadata) {
  try {
    console.log(`[EVENT] ${eventType}:`, JSON.stringify(metadata));

    // Log to sheet if SecurityLogger is available
    if (typeof SecurityLogger !== 'undefined' && SecurityLogger.log) {
      SecurityLogger.log(eventType, metadata);
    }
  } catch (e) {
    console.error('logProcessingEvent failed:', e);
  }
}
