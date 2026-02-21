/**
 * Setup_Properties_Telegram.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MASTER PROPERTY SETUP — Zero hardcoded secrets                     ║
 * ║                                                                      ║
 * ║  HOW TO USE (one-tap desktop setup):                                 ║
 * ║  1. Open GAS editor → Run: setupAllProperties                        ║
 * ║     (authorize on first run)                                         ║
 * ║  2. Run: registerTelegramWebhook                                     ║
 * ║  3. Run: configureBotCommands                                        ║
 * ║  4. Run: verifyTelegramSetup                                         ║
 * ║                                                                      ║
 * ║  BOOTSTRAP REQUIREMENT:                                              ║
 * ║  Before running, set ONE property manually in GAS Project Settings:  ║
 * ║    Key:   GAS_WEBHOOK_URL                                            ║
 * ║    Value: (your GAS web app deployed URL)                            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Secrets source of truth: Wix Secrets Manager (shamrockbailbonds.biz)
 * Runtime cache: GAS Script Properties (set by this script)
 *
 * Version: 4.0.0 — Definitive master, covers all 77 properties
 * Date: 2026-02-20
 */

// =============================================================================
// PUBLIC CONFIGURATION — safe, non-secret values only
// =============================================================================

const SETUP_CONFIG = {
  wixSiteUrl: 'https://www.shamrockbailbonds.biz',
  telegramWebhookPath: '/_functions/telegramWebhook',
  secretsBridgePath: '/_functions/get_gasSecrets',
  botName: 'Shamrock Bail Bonds',
  botUsername: 'ShamrockBail_bot',
  elevenLabsModel: 'eleven_v3',
  elevenLabsDefaultVoiceId: '21m00Tcm4TlvDq8ikWAM',
  intakeEnabled: 'true',
  intakeMaxPerUserPerDay: '3',
  intakeStateTtlHours: '24',
  voiceNotesEnabled: 'true',
  voiceNotesMaxChars: '500',
  shamrockPhone: '(239) 332-2245',
  shamrockPaymentLink: 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd',
  shamrockEmail: 'admin@shamrockbailbonds.biz',
};

// =============================================================================
// STEP 1 — MAIN SETUP
// =============================================================================

/**
 * Master setup function. Loads all 19 Wix secrets and sets all
 * 77 GAS Script Properties (including legacy aliases) in one run.
 *
 * Expected result: "Updated X properties. Skipped 0."
 */
function setupAllProperties() {
  const props = PropertiesService.getScriptProperties();
  let updated = 0;
  let skipped = 0;
  const skippedList = [];

  console.log('🚀 Starting Master Property Setup v4.0...\n');

  // ── PHASE 1: Non-secret properties (set directly) ──────────────────────────
  const safeProperties = {
<<<<<<< Updated upstream
    // Telegram
    'TELEGRAM_WEBHOOK_URL': SETUP_CONFIG.wixSiteUrl + SETUP_CONFIG.telegramWebhookPath,
    'TELEGRAM_BOT_NAME': SETUP_CONFIG.botName,
    'TELEGRAM_BOT_USERNAME': SETUP_CONFIG.botUsername,

    // Wix
    'WIX_SITE_URL': SETUP_CONFIG.wixSiteUrl,
    'PORTAL_BASE_URL': SETUP_CONFIG.wixSiteUrl,
    'REDIRECT_URL': SETUP_CONFIG.wixSiteUrl + '/portal',

    // ElevenLabs (non-secret config)
    'ELEVENLABS_MODEL_ID': SETUP_CONFIG.elevenLabsModel,
    'ELEVENLABS_DEFAULT_VOICE_ID': SETUP_CONFIG.elevenLabsDefaultVoiceId,
    'ELEVENLABS_SHAMROCK_VOICE_ID': SETUP_CONFIG.elevenLabsDefaultVoiceId,
    'MANUS_VOICE_ID': SETUP_CONFIG.elevenLabsDefaultVoiceId,

    // Intake flow settings
=======
    'TELEGRAM_WEBHOOK_URL': SETUP_CONFIG.wixSiteUrl + SETUP_CONFIG.telegramWebhookPath,
    'TELEGRAM_BOT_NAME': SETUP_CONFIG.botName,
    'TELEGRAM_BOT_USERNAME': SETUP_CONFIG.botUsername,
    'WIX_SITE_URL': SETUP_CONFIG.wixSiteUrl,
    'ELEVENLABS_MODEL_ID': SETUP_CONFIG.elevenLabsModel,
    'ELEVENLABS_DEFAULT_VOICE_ID': SETUP_CONFIG.elevenLabsDefaultVoiceId,
    'ELEVENLABS_SHAMROCK_VOICE_ID': SETUP_CONFIG.elevenLabsDefaultVoiceId,
    'INTAKE_ENABLED': SETUP_CONFIG.intakeEnabled,
>>>>>>> Stashed changes
    'INTAKE_MAX_PER_USER_PER_DAY': SETUP_CONFIG.intakeMaxPerUserPerDay,
    'INTAKE_STATE_TTL_HOURS': SETUP_CONFIG.intakeStateTtlHours,
    'VOICE_NOTES_ENABLED': SETUP_CONFIG.voiceNotesEnabled,
    'VOICE_NOTES_MAX_CHARS': SETUP_CONFIG.voiceNotesMaxChars,
<<<<<<< Updated upstream
    // Business info
=======
>>>>>>> Stashed changes
    'SHAMROCK_PHONE': SETUP_CONFIG.shamrockPhone,
    'SHAMROCK_PAYMENT_LINK': SETUP_CONFIG.shamrockPaymentLink,
    'SHAMROCK_WEBSITE': SETUP_CONFIG.wixSiteUrl,
    'SHAMROCK_EMAIL': SETUP_CONFIG.shamrockEmail,
<<<<<<< Updated upstream
    // SignNow public config (not secrets)
    'SIGNNOW_API_BASE_URL': 'https://api.signnow.com',
    'SIGNNOW_SENDER_EMAIL': SETUP_CONFIG.shamrockEmail,

    // Slack workspace (public URL, not a webhook secret)
    'SLACK_WORKSPACE_URL': 'https://shamrockbailbonds.slack.com',

    // Slack Webhooks
    'SLACK_WEBHOOK_SIGNING_ERRORS': '[REDACTED]',
    'SLACK_WEBHOOK_NEW_CASES': '[REDACTED]',
    'SLACK_WEBHOOK_COURT_DATES': '[REDACTED]',
    'SLACK_WEBHOOK_FORFEITURES': '[REDACTED]',
    'SLACK_WEBHOOK_DISCHARGES': '[REDACTED]',
    'SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY': '[REDACTED]',
    'SLACK_WEBHOOK_INTAKE': '[REDACTED]',
    'SLACK_WEBHOOK_GENERAL': '[REDACTED]',
    'SLACK_WEBHOOK_DRIVE': '[REDACTED]',
    'SLACK_WEBHOOK_CALENDAR': '[REDACTED]',
    'SLACK_WEBHOOK_LEADS': '[REDACTED]',
    'SLACK_WEBHOOK_URL': '[REDACTED]',

    // Counters / state (initialize if not set)
    'LAST_INTAKE_POLL': new Date().toISOString(),
    'CONCIERGE_LAST_ROW': '2',
    'CURRENT_RECEIPT_NUMBER': '1001',
    'COLLIER_LAST_RUN_ISO_V2': new Date(Date.now() - 86400000).toISOString(),
=======
>>>>>>> Stashed changes
  };

  props.setProperties(safeProperties);
  updated += Object.keys(safeProperties).length;
  console.log('✅ Phase 1: ' + Object.keys(safeProperties).length + ' non-secret properties set.');

  // ── PHASE 2: Load secrets from Wix Secrets Manager ─────────────────────────
  console.log('\n🔑 Phase 2: Loading secrets from Wix Secrets Manager...');

<<<<<<< Updated upstream
  // ── GAS Webhook URL (self-referential — read from ScriptApp at runtime) ─────
  // NEVER hardcode this. ScriptApp.getService().getUrl() returns the live
  // deployed URL of THIS script, which is the correct value for GAS_WEBHOOK_URL.
  let gasWebhookUrl;
  try {
    gasWebhookUrl = ScriptApp.getService().getUrl();
    if (!gasWebhookUrl) throw new Error('ScriptApp returned empty URL');
    props.setProperty('GAS_WEBHOOK_URL', gasWebhookUrl);
    console.log('✅ GAS_WEBHOOK_URL set from ScriptApp: ' + gasWebhookUrl);
  } catch (e) {
    // If not deployed as a web app yet, read from existing property
    gasWebhookUrl = props.getProperty('GAS_WEBHOOK_URL') || '';
    if (gasWebhookUrl) {
      console.log('⚠️  GAS_WEBHOOK_URL read from existing property (not yet deployed as web app).');
    } else {
      console.error('❌ GAS_WEBHOOK_URL could not be determined. Deploy as Web App first, then re-run.');
      // Do not throw — allow the rest of setup to proceed
=======
  // The production GAS Webhook URL used for authentication
  const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbwd5zOQmkwNgvVCjFo2QJchGgzKMvt2IRA_PylVI2YokEl18LKvdGpie92tvZmQh8v4IA/exec';
  props.setProperty('GAS_WEBHOOK_URL', gasWebhookUrl);

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
>>>>>>> Stashed changes
    }
  }

  /**
   * Wix Secrets Manager — canonical names and their GAS property targets.
   * Format: { wixSecretName: [gasPropertyName, ...aliases] }
   *
   * Aliases ensure legacy code that references old names continues to work.
   */
  const WIX_SECRET_MAP = {
    // ── Telegram ──────────────────────────────────────────────────────────────
    'TELEGRAM_BOT_TOKEN': [
      'TELEGRAM_BOT_TOKEN',
    ],

    // ── ElevenLabs ────────────────────────────────────────────────────────────
    'ELEVENLABS_API_KEY': [
      'ELEVENLABS_API_KEY',
    ],

    // ── Wix ───────────────────────────────────────────────────────────────────
    'GAS_API_KEY': [
      'GAS_API_KEY',
      'WIX_API_KEY',          // alias: legacy code uses WIX_API_KEY
    ],

    // ── SignNow ───────────────────────────────────────────────────────────────
    // SignNow uses a single API key for all auth. All legacy token names
    // map to the same value so existing code continues to work.
    'SIGNNOW_API_KEY': [
      'SIGNNOW_API_KEY',
      'SIGNNOW_API_TOKEN',          // legacy alias
      'SIGNNOW_ACCESS_TOKEN',       // legacy alias
      'SIGNNOW_BASIC_TOKEN',        // legacy alias
      'SIGNNOW_BASIC_AUTH_TOKEN',   // legacy alias
      'SIGNNOW_CLIENT_ID',          // legacy alias (was misnamed)
      'SIGNNOW_CLIENT_SECRET',      // legacy alias (was misnamed)
      'SIGNNOW_OAUTH_CLIENT_ID',    // legacy alias
      'SIGNNOW_OAUTH_CLIENT_SECRET',// legacy alias
    ],
    'SIGNNOW_WEBHOOK_SECRET': [
      'SIGNNOW_WEBHOOK_SECRET',
    ],

    // ── Twilio ────────────────────────────────────────────────────────────────
    'TWILIO_ACCOUNT_SID': [
      'TWILIO_ACCOUNT_SID',
    ],
    'TWILIO_AUTH_TOKEN': [
      'TWILIO_AUTH_TOKEN',
    ],
    'TWILIO_FROM_NUMBER': [
      'TWILIO_FROM_NUMBER',
      'TWILIO_PHONE_NUMBER',        // alias: legacy code uses TWILIO_PHONE_NUMBER
      'TWILIO_WHATSAPP_NUMBER',     // alias: legacy WhatsApp ref (now Telegram)
    ],
    'TWILIO_VERIFY_SERVICE_SID': [
      'TWILIO_VERIFY_SERVICE_SID',
    ],

    // ── OpenAI / AI ───────────────────────────────────────────────────────────
    'OPENAI_API_KEY': [
      'OPENAI_API_KEY',
    ],

    // ── Google ────────────────────────────────────────────────────────────────
    'GOOGLE_MAPS_API_KEY': [
      'GOOGLE_MAPS_API_KEY',
    ],
    'GOOGLE_CLIENT_ID': [
      'GOOGLE_CLIENT_ID',
      'CLIENT_ID',                  // alias: legacy code uses CLIENT_ID
    ],
    'GOOGLE_CLIENT_SECRET': [
      'GOOGLE_CLIENT_SECRET',
      'CLIENT_SECRET',              // alias: legacy code uses CLIENT_SECRET
    ],

    // ── Slack ─────────────────────────────────────────────────────────────────
    // Webhooks are hardcoded in safeProperties, so we do not fetch them from Wix Secrets anymore.

    // ── Arrest Scraper ────────────────────────────────────────────────────────
    'ARREST_SCRAPER_API_KEY': [
      'ARREST_SCRAPER_API_KEY',
    ],

    // ── GAS Web App URLs ──────────────────────────────────────────────────────
    'GAS_WEBHOOK_URL': [
      'GAS_WEBHOOK_URL',
    ],
    'GAS_WEB_APP_URL': [
      'GAS_WEB_APP_URL',
    ],
  };

  /**
   * Properties that are intentionally NOT in Wix Secrets Manager.
   * These are logged as "intentionally omitted" rather than "skipped".
   */
  const INTENTIONALLY_OMITTED = {
    'GITHUB_PAT': 'GitHub PAT is not used by GAS — manage via GitHub settings directly.',
    'MCP_API_KEY': 'MCP API key is not applicable to GAS runtime.',
    'SLACK_BOT_TOKEN': 'Slack Bot Token not configured — add to Wix Secrets Manager if needed.',
    'SLACK_APP_ID': 'Slack App ID not configured — add to Wix Secrets Manager if needed.',
    'SLACK_CLIENT_ID': 'Slack Client ID not configured — add to Wix Secrets Manager if needed.',
    'SLACK_ACCESS_TOKEN': 'Slack Access Token not configured — add to Wix Secrets Manager if needed.',
    'SLACK_REFRESH_TOKEN': 'Slack Refresh Token not configured — add to Wix Secrets Manager if needed.',
    'GROK_API_KEY': 'Grok API key not in Wix Secrets Manager — add if xAI integration needed.',
    'GEMINI_API_KEY': 'Gemini API key not in Wix Secrets Manager — add if Gemini integration needed.',
    'GOOGLE_MAPS_SIGNATURE_SECRET': 'Maps Signature Secret saved in Wix but not needed at this time.',
    'OPENAI_WEBHOOK_SECRET': 'OpenAI Webhook Secret not needed by GAS.',
  };

  // ── Fetch and set all secrets ───────────────────────────────────────────────
  let secretsLoaded = 0;
  const allAliasesSet = [];

  for (const [wixName, gasPropNames] of Object.entries(WIX_SECRET_MAP)) {
    try {
      const value = _fetchWixSecret(wixName, gasWebhookUrl);
      if (value && value.trim() !== '' && !value.includes('PLACEHOLDER') && !value.includes('YOUR_')) {
        // Set the primary property and all aliases
        for (const propName of gasPropNames) {
          props.setProperty(propName, value);
          allAliasesSet.push(propName);
          updated++;
        }
        const aliasNote = gasPropNames.length > 1
          ? ' (+ ' + (gasPropNames.length - 1) + ' alias' + (gasPropNames.length > 2 ? 'es' : '') + ')'
          : '';
        console.log('  ✅ Set: ' + wixName + aliasNote);
        secretsLoaded++;
      } else {
        console.warn('  ⚠️  Skipping ' + wixName + ': Empty or not found in Wix Secrets Manager.');
        skipped++;
        skippedList.push(wixName);
      }
    } catch (e) {
      console.error('  ❌ Error loading ' + wixName + ': ' + e.message);
      skipped++;
      skippedList.push(wixName);
    }
  }

  // ── Log intentionally omitted properties ───────────────────────────────────
  console.log('\n📋 Intentionally omitted (not errors):');
  for (const [propName, reason] of Object.entries(INTENTIONALLY_OMITTED)) {
    console.log('  ℹ️  ' + propName + ': ' + reason);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Setup complete!');
  console.log('   Properties set:  ' + updated);
  console.log('   Secrets loaded:  ' + secretsLoaded + '/' + Object.keys(WIX_SECRET_MAP).length);
  console.log('   Skipped (errors): ' + skipped);
  if (skippedList.length > 0) {
    console.log('   Skipped list: ' + skippedList.join(', '));
  }
  console.log('═'.repeat(60));
  console.log('\nNext step: Run registerTelegramWebhook()');

  return { updated, secretsLoaded, skipped, skippedList };
}

// =============================================================================
// INTERNAL: Wix Secrets Bridge Fetch
// =============================================================================

/**
 * Fetches a single secret value from the Wix secrets bridge endpoint.
 *
 * The bridge is a Wix backend function (get_gasSecrets) that reads from
 * Wix Secrets Manager and returns the plaintext value to authorized callers.
 *
 * @param {string} secretName - Exact name as stored in Wix Secrets Manager
 * @param {string} gasWebhookUrl - GAS web app URL (used as caller identity)
 * @returns {string|null} The secret value, or null if not found/error
 */
function _fetchWixSecret(secretName, gasWebhookUrl) {
  const url = SETUP_CONFIG.wixSiteUrl + SETUP_CONFIG.secretsBridgePath +
    '?secret=' + encodeURIComponent(secretName);

  try {
    const resp = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'X-GAS-Caller': gasWebhookUrl || 'gas-setup',
        'X-Requested-By': 'GAS-Setup-Script-v4',
      }
    });

    const code = resp.getResponseCode();
    if (code === 200) {
      const body = JSON.parse(resp.getContentText());
      return body.value || null;
    }
    console.warn('    HTTP ' + code + ' fetching ' + secretName);
    return null;
  } catch (e) {
    console.warn('    Fetch error for ' + secretName + ': ' + e.message);
    return null;
  }
}

// =============================================================================
// STEP 2 — TELEGRAM WEBHOOK REGISTRATION
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

  console.log('🔗 Registering Telegram webhook...');
  console.log('   URL: ' + webhookUrl);

  // Clear any existing webhook
  const deleteResp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/deleteWebhook',
    { method: 'post', muteHttpExceptions: true }
  );
  const deleteResult = JSON.parse(deleteResp.getContentText());
  console.log('   Delete old webhook: ' + (deleteResult.ok ? '✅ cleared' : deleteResult.description));

  // Register new webhook with all required update types
  const setResp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + botToken + '/setWebhook',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'edited_message'],
        drop_pending_updates: true,
        max_connections: 40,
      }),
      muteHttpExceptions: true
    }
  );

  const result = JSON.parse(setResp.getContentText());

  if (result.ok) {
    console.log('✅ Webhook registered successfully!');
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
    { command: 'start', description: '🍀 Welcome to Shamrock Bail Bonds' },
    { command: 'bail', description: '🚀 Start bail bond paperwork' },
<<<<<<< Updated upstream
    { command: 'help', description: '📋 Show all options & FAQ' },
    { command: 'pay', description: '💳 Get payment link' },
    { command: 'status', description: '🔍 Check case status' },
    { command: 'county', description: '📍 Find your county jail info' },
=======
    { command: 'help', description: '📋 Show all options' },
    { command: 'pay', description: '💳 Get payment link' },
    { command: 'status', description: '🔍 Check case status' },
>>>>>>> Stashed changes
    { command: 'cancel', description: '❌ Cancel current operation' },
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
  console.log('Commands: ' + (cmdsResult.ok ? '✅ ' + commands.length + ' commands set' : '❌ ' + cmdsResult.description));

  // Set bot description (shown in profile)
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

  // Set short description (shown in search results)
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
  check('Telegram Bot Token', function () {
<<<<<<< Updated upstream
    const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new Error('Not set — run setupAllProperties()');
=======
    if (!botToken) throw new Error('Not set');
>>>>>>> Stashed changes
    const me = JSON.parse(
      UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/getMe',
        { muteHttpExceptions: true }).getContentText()
    );
    if (!me.ok) throw new Error(me.description);
    console.log('  ✅ Bot: @' + me.result.username + ' (' + me.result.first_name + ')');
  });

<<<<<<< Updated upstream
  // 2. Webhook registration
  check('Webhook Registration', function () {
    const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
=======
  // 2. Webhook
  check('Webhook Registration', function () {
>>>>>>> Stashed changes
    if (!botToken) throw new Error('Token not set');
    const wh = JSON.parse(
      UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/getWebhookInfo',
        { muteHttpExceptions: true }).getContentText()
    );
    if (!wh.ok || !wh.result.url) throw new Error('No webhook registered — run registerTelegramWebhook()');
    console.log('  ✅ Webhook: ' + wh.result.url);
    if (wh.result.last_error_message) {
      console.warn('  ⚠️  Last error: ' + wh.result.last_error_message);
    }
  });

  // 3. ElevenLabs
  check('ElevenLabs API Key', function () {
<<<<<<< Updated upstream
    const key = props.getProperty('ELEVENLABS_API_KEY');
    if (!key) throw new Error('Not set — check Wix Secrets Manager: ELEVENLABS_API_KEY');
=======
    if (!elevenLabsKey) throw new Error('Not set');
>>>>>>> Stashed changes
    const el = UrlFetchApp.fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': key },
      muteHttpExceptions: true
    });
    if (el.getResponseCode() !== 200) throw new Error('HTTP ' + el.getResponseCode() + ' — key may be invalid');
    const user = JSON.parse(el.getContentText());
    const tier = (user.subscription && user.subscription.tier) || 'active';
    const chars = (user.subscription && user.subscription.character_count) || '?';
    const limit = (user.subscription && user.subscription.character_limit) || '?';
    console.log('  ✅ ElevenLabs: ' + tier + ' plan | ' + chars + '/' + limit + ' chars used');
  });

<<<<<<< Updated upstream
  // 4. Wix endpoint reachable
  check('Wix Site Reachable', function () {
    const wixUrl = props.getProperty('WIX_SITE_URL');
=======
  // 4. Wix endpoint
  check('Wix IntakeQueue Endpoint', function () {
>>>>>>> Stashed changes
    if (!wixUrl) throw new Error('WIX_SITE_URL not set');
    const wx = UrlFetchApp.fetch(wixUrl, { muteHttpExceptions: true });
    if (wx.getResponseCode() >= 500) throw new Error('Server error HTTP ' + wx.getResponseCode());
    console.log('  ✅ Wix site reachable (HTTP ' + wx.getResponseCode() + ')');
  });

<<<<<<< Updated upstream
  // 5. SignNow API key present
  check('SignNow API Key', function () {
    const key = props.getProperty('SIGNNOW_API_KEY');
    if (!key) throw new Error('Not set — check Wix Secrets Manager: SIGNNOW_API_KEY');
    console.log('  ✅ SignNow key present (' + key.substring(0, 8) + '...)');
  });

  // 6. Twilio credentials
  check('Twilio Credentials', function () {
    const sid = props.getProperty('TWILIO_ACCOUNT_SID');
    const token = props.getProperty('TWILIO_AUTH_TOKEN');
    if (!sid || !token) throw new Error('Missing SID or token — check Wix Secrets Manager');
    console.log('  ✅ Twilio: SID ' + sid.substring(0, 8) + '...');
  });

  // 7. OpenAI key
  check('OpenAI API Key', function () {
    const key = props.getProperty('OPENAI_API_KEY');
    if (!key) throw new Error('Not set — check Wix Secrets Manager: OPENAI_API_KEY');
    console.log('  ✅ OpenAI key present (' + key.substring(0, 8) + '...)');
  });

  // 8. Slack webhook
  check('Slack Webhook', function () {
    const url = props.getProperty('SLACK_WEBHOOK_URL');
    if (!url) throw new Error('Not set — check Wix Secrets Manager: SLACK_WEBHOOK_URL');
    console.log('  ✅ Slack webhook configured');
=======
  // 5. SignNow
  check('SignNow API Key', function () {
    if (!signNowKey) throw new Error('Not set');
    console.log('✅ SignNow key present (' + signNowKey.substring(0, 8) + '...)');
  });

  // 6. Twilio
  check('Twilio Credentials', function () {
    if (!twilioSid || !twilioToken) throw new Error('Missing SID or token');
    console.log('✅ Twilio credentials present');
>>>>>>> Stashed changes
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
 * Show a summary of all currently set Script Properties (names only, no values).
 * Useful for auditing what's been set without exposing secrets.
 */
function auditProperties() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const keys = Object.keys(all).sort();

  console.log('📊 Script Properties Audit (' + keys.length + ' total):\n');

  const secretPatterns = ['KEY', 'TOKEN', 'SECRET', 'SID', 'PASSWORD', 'AUTH'];
  keys.forEach(function (k) {
    const isSecret = secretPatterns.some(function (p) { return k.includes(p); });
    const display = isSecret ? '[REDACTED]' : all[k];
    console.log('  ' + k + ': ' + display);
  });

  return keys.length;
}

/**
 * List all active intake conversations (for monitoring).
 */
function getActiveIntakeSummary() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  const active = [];

  Object.keys(allProps).forEach(function (key) {
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
  active.forEach(function (a) {
<<<<<<< Updated upstream
    console.log('  User ' + a.userId + ' | Step: ' + a.step + ' | ' + a.defendantName + ' | ' + a.county);
=======
    console.log('  User ' + a.userId + ': step=' + a.step +
      ', defendant=' + a.defendantName + ', county=' + a.county);
>>>>>>> Stashed changes
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

  Object.keys(allProps).forEach(function (key) {
    if (key.startsWith('INTAKE_STATE_')) {
      props.deleteProperty(key);
      cleared++;
    }
  });

  console.log('✅ Cleared ' + cleared + ' intake states');
  return cleared;
}
