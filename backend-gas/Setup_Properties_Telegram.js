/**
 * Setup_Properties_Telegram.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NO HARDCODED SECRETS — All values loaded at runtime from   ║
 * ║  Wix Secrets Manager via the GAS_WEBHOOK_URL endpoint.      ║
 * ║                                                              ║
 * ║  HOW TO USE (one-tap desktop setup):                        ║
 * ║  1. Open GAS editor → Select: setupAllProperties            ║
 * ║  2. Click ▶ Run  (authorize on first run)                   ║
 * ║  3. Run: registerTelegramWebhook                            ║
 * ║  4. Run: configureBotCommands                               ║
 * ║  5. Run: verifyTelegramSetup                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Secrets are stored exclusively in:
 *   • Wix Secrets Manager  (source of truth)
 *   • GAS Script Properties (runtime cache, set by this script)
 *
 * Version: 3.0.0 — Zero-secret build
 * Date: 2026-02-20
 */

// =============================================================================
// CONFIGURATION — Edit only these safe, non-secret values
// =============================================================================

const SETUP_CONFIG = {
  // Wix site base URL (public, not a secret)
  wixSiteUrl: 'https://www.shamrockbailbonds.biz',

  // Telegram webhook path on Wix (public endpoint)
  telegramWebhookPath: '/_functions/telegramWebhook',

  // Wix secrets-bridge endpoint (returns secrets to authorized GAS callers)
  secretsBridgePath: '/_functions/get_gasSecrets',

  // Bot display info (public, not a secret)
  botName: 'Shamrock Bail Bonds',
  botUsername: 'ShamrockBail_bot',

  // ElevenLabs model (not a secret)
  elevenLabsModel: 'eleven_v3',
  elevenLabsDefaultVoiceId: '21m00Tcm4TlvDq8ikWAM',

  // Intake flow settings (not secrets)
  intakeEnabled: 'true',
  intakeMaxPerUserPerDay: '3',
  intakeStateTtlHours: '24',
  voiceNotesEnabled: 'true',
  voiceNotesMaxChars: '500',

  // Business info (public)
  shamrockPhone: '(239) 332-2245',
  shamrockPaymentLink: 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd',
  shamrockEmail: 'admin@shamrockbailbonds.biz',
};

// =============================================================================
// STEP 1 — MAIN SETUP: Sets all Script Properties
// =============================================================================

/**
 * Loads all secrets from Wix Secrets Manager via the GAS_WEBHOOK_URL
 * and writes them into GAS Script Properties.
 *
 * The GAS_WEBHOOK_URL is the only bootstrap value needed — it must already
 * be set as a Script Property before running this function.
 *
 * To bootstrap: In the GAS editor, go to Project Settings → Script Properties
 * and add ONE property manually:
 *   Key:   GAS_WEBHOOK_URL
 *   Value: https://script.google.com/macros/s/.../exec
 *
 * Everything else is loaded automatically from Wix.
 */
function setupAllProperties() {
  const props = PropertiesService.getScriptProperties();

  // ── Non-secret values: set directly ────────────────────────────────────────
  const safeProperties = {
    'TELEGRAM_WEBHOOK_URL':         SETUP_CONFIG.wixSiteUrl + SETUP_CONFIG.telegramWebhookPath,
    'TELEGRAM_BOT_NAME':            SETUP_CONFIG.botName,
    'TELEGRAM_BOT_USERNAME':        SETUP_CONFIG.botUsername,
    'WIX_SITE_URL':                 SETUP_CONFIG.wixSiteUrl,
    'ELEVENLABS_MODEL_ID':          SETUP_CONFIG.elevenLabsModel,
    'ELEVENLABS_DEFAULT_VOICE_ID':  SETUP_CONFIG.elevenLabsDefaultVoiceId,
    'ELEVENLABS_SHAMROCK_VOICE_ID': SETUP_CONFIG.elevenLabsDefaultVoiceId,
    'INTAKE_ENABLED':               SETUP_CONFIG.intakeEnabled,
    'INTAKE_MAX_PER_USER_PER_DAY':  SETUP_CONFIG.intakeMaxPerUserPerDay,
    'INTAKE_STATE_TTL_HOURS':       SETUP_CONFIG.intakeStateTtlHours,
    'VOICE_NOTES_ENABLED':          SETUP_CONFIG.voiceNotesEnabled,
    'VOICE_NOTES_MAX_CHARS':        SETUP_CONFIG.voiceNotesMaxChars,
    'SHAMROCK_PHONE':               SETUP_CONFIG.shamrockPhone,
    'SHAMROCK_PAYMENT_LINK':        SETUP_CONFIG.shamrockPaymentLink,
    'SHAMROCK_WEBSITE':             SETUP_CONFIG.wixSiteUrl,
    'SHAMROCK_EMAIL':               SETUP_CONFIG.shamrockEmail,
  };

  props.setProperties(safeProperties);
  console.log('✅ ' + Object.keys(safeProperties).length + ' non-secret properties set.');

  // ── Secrets: load from Wix Secrets Manager via bridge endpoint ─────────────
  console.log('🔑 Loading secrets from Wix Secrets Manager...');

  const gasWebhookUrl = props.getProperty('GAS_WEBHOOK_URL');
  if (!gasWebhookUrl) {
    throw new Error(
      '❌ GAS_WEBHOOK_URL not set.\n' +
      'Go to GAS Project Settings → Script Properties and add:\n' +
      '  Key: GAS_WEBHOOK_URL\n' +
      '  Value: (your GAS web app URL)\n' +
      'Then re-run setupAllProperties().'
    );
  }

  // The secret names we need Wix to provide
  const secretNames = [
    'TELEGRAM_BOT_TOKEN',
    'ELEVENLABS_API_KEY',
    'WIX_API_KEY',
    'GAS_API_KEY',
    'SIGNNOW_API_KEY',
    'SIGNNOW_WEBHOOK_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER',
    'TWILIO_VERIFY_SERVICE_SID',
    'OPENAI_API_KEY',
    'GOOGLE_MAPS_API_KEY',
    'ARREST_SCRAPER_API_KEY',
    'SLACK_WEBHOOK_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  // Fetch each secret individually from Wix Secrets Manager
  // using the existing Wix backend endpoint pattern
  const wixApiKey = _fetchWixSecret('GAS_API_KEY', gasWebhookUrl);
  if (!wixApiKey) {
    throw new Error(
      '❌ Could not retrieve GAS_API_KEY from Wix.\n' +
      'Ensure the Wix site is published and the secrets bridge endpoint is deployed.'
    );
  }

  let secretsLoaded = 0;
  for (const secretName of secretNames) {
    try {
      const value = _fetchWixSecret(secretName, gasWebhookUrl, wixApiKey);
      if (value) {
        props.setProperty(secretName, value);
        secretsLoaded++;
        console.log('  ✅ ' + secretName + ' loaded');
      } else {
        console.warn('  ⚠️  ' + secretName + ' returned empty — check Wix Secrets Manager');
      }
    } catch (e) {
      console.error('  ❌ Failed to load ' + secretName + ': ' + e.message);
    }
  }

  console.log('');
  console.log('✅ Setup complete: ' + secretsLoaded + '/' + secretNames.length + ' secrets loaded.');
  console.log('Next step: Run registerTelegramWebhook()');

  return { safePropertiesSet: Object.keys(safeProperties).length, secretsLoaded };
}

/**
 * Fetches a single secret value from the Wix secrets bridge endpoint.
 * The bridge endpoint is a Wix backend function that reads from Wix Secrets Manager
 * and returns the value to authorized GAS callers.
 *
 * @param {string} secretName - The secret name to fetch
 * @param {string} gasWebhookUrl - The GAS web app URL (used as caller identity)
 * @param {string} [apiKey] - Optional API key for authenticated requests
 * @returns {string|null} The secret value, or null if not found
 */
function _fetchWixSecret(secretName, gasWebhookUrl, apiKey) {
  const wixSiteUrl = SETUP_CONFIG.wixSiteUrl;
  const bridgePath = SETUP_CONFIG.secretsBridgePath;

  const url = wixSiteUrl + bridgePath +
    '?secret=' + encodeURIComponent(secretName) +
    (apiKey ? '&apiKey=' + encodeURIComponent(apiKey) : '');

  try {
    const resp = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'X-GAS-Caller': gasWebhookUrl || 'gas-setup',
        'X-Requested-By': 'GAS-Setup-Script'
      }
    });

    if (resp.getResponseCode() === 200) {
      const body = JSON.parse(resp.getContentText());
      return body.value || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// =============================================================================
// STEP 2 — WEBHOOK REGISTRATION
// =============================================================================

/**
 * Registers the Wix webhook URL with Telegram.
 * Run AFTER setupAllProperties().
 */
function registerTelegramWebhook() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
  const webhookUrl = props.getProperty('TELEGRAM_WEBHOOK_URL');

  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not set. Run setupAllProperties() first.');
  if (!webhookUrl) throw new Error('TELEGRAM_WEBHOOK_URL not set. Run setupAllProperties() first.');

  console.log('🔗 Registering webhook: ' + webhookUrl);

  // Clear any existing webhook
  const deleteResp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/deleteWebhook',
    { method: 'post', muteHttpExceptions: true }
  );
  const deleteResult = JSON.parse(deleteResp.getContentText());
  console.log('Delete existing webhook: ' + (deleteResult.ok ? '✅ cleared' : deleteResult.description));

  // Register new webhook
  const setResp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/setWebhook',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'edited_message'],
        drop_pending_updates: true
      }),
      muteHttpExceptions: true
    }
  );

  const result = JSON.parse(setResp.getContentText());

  if (result.ok) {
    console.log('✅ Webhook registered!');
    console.log('Next step: Run configureBotCommands()');
  } else {
    throw new Error('❌ Webhook registration failed: ' + result.description);
  }

  return result;
}

// =============================================================================
// STEP 3 — BOT COMMANDS & PROFILE
// =============================================================================

/**
 * Configure the bot command menu visible in Telegram.
 * Run AFTER registerTelegramWebhook().
 */
function configureBotCommands() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');

  if (!botToken) throw new Error('Run setupAllProperties() first.');

  const commands = [
    { command: 'start',   description: '🍀 Welcome to Shamrock Bail Bonds' },
    { command: 'bail',    description: '🚀 Start bail bond paperwork' },
    { command: 'help',    description: '📋 Show all options' },
    { command: 'pay',     description: '💳 Get payment link' },
    { command: 'status',  description: '🔍 Check case status' },
    { command: 'cancel',  description: '❌ Cancel current operation' },
    { command: 'restart', description: '🔄 Restart intake from beginning' },
  ];

  const cmdsResp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/setMyCommands',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ commands }),
      muteHttpExceptions: true
    }
  );
  const cmdsResult = JSON.parse(cmdsResp.getContentText());
  console.log('Commands: ' + (cmdsResult.ok ? '✅ set' : '❌ ' + cmdsResult.description));

  UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/setMyDescription',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        description:
          '🍀 Shamrock Bail Bonds — 24/7 bail bond assistance for all 67 Florida counties.\n\n' +
          'I guide you through the entire bail process, collect paperwork, send signing links, ' +
          'and answer your questions instantly.\n\nType /start to begin.'
      }),
      muteHttpExceptions: true
    }
  );

  UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/setMyShortDescription',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        short_description: '🍀 24/7 bail bond assistance — all 67 Florida counties'
      }),
      muteHttpExceptions: true
    }
  );

  console.log('✅ Bot profile configured!');
  console.log('Next step: Run verifyTelegramSetup()');

  return cmdsResult;
}

// =============================================================================
// STEP 4 — FULL VERIFICATION
// =============================================================================

/**
 * Verifies the complete setup end-to-end.
 * Run after all three setup steps above.
 */
function verifyTelegramSetup() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
  const elevenLabsKey = props.getProperty('ELEVENLABS_API_KEY');
  const wixUrl = props.getProperty('WIX_SITE_URL');
  const wixKey = props.getProperty('WIX_API_KEY');
  const signNowKey = props.getProperty('SIGNNOW_API_KEY');
  const twilioSid = props.getProperty('TWILIO_ACCOUNT_SID');
  const twilioToken = props.getProperty('TWILIO_AUTH_TOKEN');

  console.log('🔍 Running full verification...\n');
  let passed = 0;
  let failed = 0;

  function check(name, fn) {
    try {
      fn();
      passed++;
    } catch (e) {
      console.error('❌ ' + name + ': ' + e.message);
      failed++;
    }
  }

  // 1. Telegram bot token
  check('Telegram Bot Token', function() {
    if (!botToken) throw new Error('Not set');
    const me = JSON.parse(
      UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/getMe',
        { muteHttpExceptions: true }).getContentText()
    );
    if (!me.ok) throw new Error(me.description);
    console.log('✅ Bot: @' + me.result.username + ' (' + me.result.first_name + ')');
  });

  // 2. Webhook
  check('Webhook Registration', function() {
    if (!botToken) throw new Error('Token not set');
    const wh = JSON.parse(
      UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/getWebhookInfo',
        { muteHttpExceptions: true }).getContentText()
    );
    if (!wh.ok || !wh.result.url) throw new Error('No webhook registered');
    console.log('✅ Webhook: ' + wh.result.url);
    if (wh.result.last_error_message) {
      console.warn('   ⚠️  Last error: ' + wh.result.last_error_message);
    }
  });

  // 3. ElevenLabs
  check('ElevenLabs API Key', function() {
    if (!elevenLabsKey) throw new Error('Not set');
    const el = UrlFetchApp.fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': elevenLabsKey },
      muteHttpExceptions: true
    });
    if (el.getResponseCode() !== 200) throw new Error('HTTP ' + el.getResponseCode());
    const user = JSON.parse(el.getContentText());
    console.log('✅ ElevenLabs: ' + (user.subscription && user.subscription.tier || 'active'));
  });

  // 4. Wix endpoint
  check('Wix IntakeQueue Endpoint', function() {
    if (!wixUrl) throw new Error('WIX_SITE_URL not set');
    const wx = UrlFetchApp.fetch(
      wixUrl + '/_functions/get_pendingIntakes' + (wixKey ? '?apiKey=' + wixKey : ''),
      { muteHttpExceptions: true }
    );
    if (wx.getResponseCode() >= 500) throw new Error('Server error ' + wx.getResponseCode());
    console.log('✅ Wix endpoint reachable (HTTP ' + wx.getResponseCode() + ')');
  });

  // 5. SignNow
  check('SignNow API Key', function() {
    if (!signNowKey) throw new Error('Not set');
    console.log('✅ SignNow key present (' + signNowKey.substring(0, 8) + '...)');
  });

  // 6. Twilio
  check('Twilio Credentials', function() {
    if (!twilioSid || !twilioToken) throw new Error('Missing SID or token');
    console.log('✅ Twilio credentials present');
  });

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed === 0) {
    console.log('✅ ALL CHECKS PASSED — System is live!');
    console.log('🍀 Message @ShamrockBail_bot on Telegram to test.');
  } else {
    console.error('❌ ' + failed + ' check(s) failed — review errors above.');
  }

  return { passed, failed };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Send a test message to yourself via the bot.
 * Get your chat ID by messaging @userinfobot on Telegram first.
 */
function sendTestMessage() {
  const YOUR_CHAT_ID = ''; // ← Fill in your Telegram chat ID before running

  if (!YOUR_CHAT_ID) {
    throw new Error(
      'Fill in YOUR_CHAT_ID before running.\n' +
      'Message @userinfobot on Telegram to get your numeric chat ID.'
    );
  }

  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('Run setupAllProperties() first.');

  const resp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/sendMessage',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: YOUR_CHAT_ID,
        text: '🍀 *Shamrock Bail Bonds bot is live!*\n\nAll systems are go. Type /start to begin.',
        parse_mode: 'Markdown'
      }),
      muteHttpExceptions: true
    }
  );

  const result = JSON.parse(resp.getContentText());
  console.log(result.ok ? '✅ Test message sent!' : '❌ Failed: ' + result.description);
  return result;
}

/**
 * List all active intake conversations (for monitoring)
 */
function getActiveIntakeSummary() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  const active = [];

  Object.keys(allProps).forEach(function(key) {
    if (key.startsWith('INTAKE_STATE_')) {
      try {
        const state = JSON.parse(allProps[key]);
        active.push({
          userId: key.replace('INTAKE_STATE_', ''),
          step: state.step,
          startedAt: state.startedAt,
          defendantName: (state.data && state.data.defendantName) || 'not yet collected',
          county: (state.data && state.data.county) || 'not yet collected'
        });
      } catch (e) { /* skip malformed */ }
    }
  });

  console.log('📊 Active intake conversations: ' + active.length);
  active.forEach(function(a) {
    console.log('  User ' + a.userId + ': step=' + a.step +
      ', defendant=' + a.defendantName + ', county=' + a.county);
  });

  return active;
}

/**
 * Emergency reset — clears all active intake states
 */
function clearAllIntakeStates() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  let cleared = 0;

  Object.keys(allProps).forEach(function(key) {
    if (key.startsWith('INTAKE_STATE_')) {
      props.deleteProperty(key);
      cleared++;
    }
  });

  console.log('✅ Cleared ' + cleared + ' intake states');
  return cleared;
}
