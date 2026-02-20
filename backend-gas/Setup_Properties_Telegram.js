/**
 * Setup_Properties_Telegram.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * ONE-CLICK SETUP for the Telegram Bot + ElevenLabs integration.
 *
 * HOW TO USE:
 *   1. Open this GAS project in the Apps Script editor
 *   2. Select the function: setupTelegramProperties
 *   3. Click ▶ Run
 *   4. Authorize when prompted
 *   5. Then run: registerTelegramWebhook
 *   6. Then run: verifyTelegramSetup
 *
 * REQUIRED SECRETS (fill in below before running):
 *   TELEGRAM_BOT_TOKEN   — From @BotFather on Telegram
 *   ELEVENLABS_API_KEY   — From elevenlabs.io/app/settings/api-keys
 *   WIX_SITE_URL         — Your Wix site URL (e.g. https://www.shamrockbailbonds.biz)
 *   WIX_API_KEY          — GAS_API_KEY secret set in Wix Secrets Manager
 *
 * Version: 1.0.0
 * Date: 2026-02-20
 */

// =============================================================================
// ⚠️  FILL THESE IN BEFORE RUNNING  ⚠️
// =============================================================================

const TELEGRAM_CONFIG = {
  // Get this from @BotFather — /newbot or /mybots
  BOT_TOKEN: '',  // e.g. '7123456789:AAHdqTcvCHhvQNKMe29udihh0k1lkH9tY8'

  // Your Wix site public URL (no trailing slash)
  WIX_SITE_URL: 'https://www.shamrockbailbonds.biz',

  // The Wix HTTP function endpoint that receives Telegram updates
  WEBHOOK_PATH: '/_functions/telegramWebhook',

  // Bot display settings (set via BotFather)
  BOT_NAME: 'Shamrock Bail Bonds',
  BOT_USERNAME: 'ShamrockBailBot',
  BOT_DESCRIPTION: '🍀 Shamrock Bail Bonds — 24/7 bail bond assistance for all 67 Florida counties. Get your loved one home fast.',
};

const ELEVENLABS_CONFIG = {
  // Get from elevenlabs.io/app/settings/api-keys
  API_KEY: '',

  // Voice ID — "Rachel" (American, clear, professional)
  // Change at: elevenlabs.io/app/voice-lab
  DEFAULT_VOICE_ID: '21m00Tcm4TlvDq8ikWAM',

  // Voice for Shamrock bot (warm, reassuring female voice)
  // Recommended: "Bella" (21m00Tcm4TlvDq8ikWAM) or "Elli" (MF3mGyEYCl7XYWbV9V6O)
  SHAMROCK_VOICE_ID: '21m00Tcm4TlvDq8ikWAM',

  // Model — use eleven_v3 for best quality
  MODEL_ID: 'eleven_v3',
};

const WIX_CONFIG = {
  // Must match GAS_API_KEY in Wix Secrets Manager
  API_KEY: '',  // e.g. 'sbb-gas-2026-abc123xyz'
};

// =============================================================================
// MAIN SETUP FUNCTION
// Run this first: setupTelegramProperties()
// =============================================================================

/**
 * Set all required Script Properties for Telegram + ElevenLabs.
 * Run this ONCE after filling in the config above.
 */
function setupTelegramProperties() {
  const props = PropertiesService.getScriptProperties();

  console.log('🔧 Setting up Telegram + ElevenLabs properties...');

  // ── Validate inputs ──────────────────────────────────────────────────────────
  const errors = [];
  if (!TELEGRAM_CONFIG.BOT_TOKEN) errors.push('TELEGRAM_CONFIG.BOT_TOKEN is empty');
  if (!ELEVENLABS_CONFIG.API_KEY) errors.push('ELEVENLABS_CONFIG.API_KEY is empty');
  if (!WIX_CONFIG.API_KEY) errors.push('WIX_CONFIG.API_KEY is empty');

  if (errors.length > 0) {
    console.error('❌ Setup aborted. Please fill in the required values:');
    errors.forEach(e => console.error('  -', e));
    throw new Error('Missing required configuration. See logs.');
  }

  // ── Set properties ───────────────────────────────────────────────────────────
  const propertiesToSet = {
    // Telegram
    'TELEGRAM_BOT_TOKEN':          TELEGRAM_CONFIG.BOT_TOKEN,
    'TELEGRAM_WEBHOOK_URL':        TELEGRAM_CONFIG.WIX_SITE_URL + TELEGRAM_CONFIG.WEBHOOK_PATH,
    'TELEGRAM_BOT_NAME':           TELEGRAM_CONFIG.BOT_NAME,
    'TELEGRAM_BOT_USERNAME':       TELEGRAM_CONFIG.BOT_USERNAME,

    // ElevenLabs
    'ELEVENLABS_API_KEY':          ELEVENLABS_CONFIG.API_KEY,
    'ELEVENLABS_DEFAULT_VOICE_ID': ELEVENLABS_CONFIG.DEFAULT_VOICE_ID,
    'ELEVENLABS_SHAMROCK_VOICE_ID':ELEVENLABS_CONFIG.SHAMROCK_VOICE_ID,
    'ELEVENLABS_MODEL_ID':         ELEVENLABS_CONFIG.MODEL_ID,

    // Wix
    'WIX_SITE_URL':                TELEGRAM_CONFIG.WIX_SITE_URL,
    'WIX_API_KEY':                 WIX_CONFIG.API_KEY,

    // Intake flow settings
    'INTAKE_ENABLED':              'true',
    'INTAKE_MAX_PER_USER_PER_DAY': '3',
    'INTAKE_STATE_TTL_HOURS':      '24',

    // Voice note settings
    'VOICE_NOTES_ENABLED':         'true',
    'VOICE_NOTES_MAX_CHARS':       '500',

    // Business info
    'SHAMROCK_PHONE':              '(239) 332-2245',
    'SHAMROCK_PAYMENT_LINK':       'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd',
    'SHAMROCK_WEBSITE':            'https://www.shamrockbailbonds.biz',
    'SHAMROCK_EMAIL':              'admin@shamrockbailbonds.biz',
  };

  props.setProperties(propertiesToSet);

  console.log('✅ Properties set successfully:');
  Object.keys(propertiesToSet).forEach(key => {
    const val = propertiesToSet[key];
    // Mask sensitive values in logs
    const masked = key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET')
      ? val.substring(0, 8) + '...' + val.substring(val.length - 4)
      : val;
    console.log(`  ${key}: ${masked}`);
  });

  console.log('\n✅ Step 1 complete. Now run: registerTelegramWebhook()');
}

// =============================================================================
// WEBHOOK REGISTRATION
// Run after setupTelegramProperties()
// =============================================================================

/**
 * Register the Wix webhook URL with Telegram.
 * Run AFTER setupTelegramProperties().
 */
function registerTelegramWebhook() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
  const webhookUrl = props.getProperty('TELEGRAM_WEBHOOK_URL');

  if (!botToken || !webhookUrl) {
    throw new Error('Run setupTelegramProperties() first.');
  }

  console.log(`🔗 Registering webhook: ${webhookUrl}`);

  // Delete existing webhook first (clean slate)
  const deleteResponse = UrlFetchApp.fetch(
    `https://api.telegram.org/bot${botToken}/deleteWebhook`,
    { method: 'post', muteHttpExceptions: true }
  );
  console.log('Delete webhook response:', deleteResponse.getContentText());

  // Set new webhook
  const setResponse = UrlFetchApp.fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
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

  const result = JSON.parse(setResponse.getContentText());
  console.log('Set webhook response:', JSON.stringify(result, null, 2));

  if (result.ok) {
    console.log('✅ Webhook registered successfully!');
    console.log('\n✅ Step 2 complete. Now run: configureBotCommands()');
  } else {
    console.error('❌ Webhook registration failed:', result.description);
    throw new Error('Webhook registration failed: ' + result.description);
  }

  return result;
}

/**
 * Configure bot commands visible in the Telegram menu
 */
function configureBotCommands() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');

  if (!botToken) throw new Error('Run setupTelegramProperties() first.');

  const commands = [
    { command: 'start',   description: '🍀 Welcome to Shamrock Bail Bonds' },
    { command: 'bail',    description: '🚀 Start bail bond paperwork' },
    { command: 'help',    description: '📋 Show all options' },
    { command: 'pay',     description: '💳 Get payment link' },
    { command: 'status',  description: '🔍 Check case status' },
    { command: 'cancel',  description: '❌ Cancel current operation' },
    { command: 'restart', description: '🔄 Restart intake from beginning' },
  ];

  const response = UrlFetchApp.fetch(
    `https://api.telegram.org/bot${botToken}/setMyCommands`,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ commands: commands }),
      muteHttpExceptions: true
    }
  );

  const result = JSON.parse(response.getContentText());
  console.log('Set commands response:', JSON.stringify(result, null, 2));

  if (result.ok) {
    console.log('✅ Bot commands configured!');
    console.log('\n✅ Step 3 complete. Now run: configureBotProfile()');
  }

  return result;
}

/**
 * Set bot name, description, and short description via BotFather API
 */
function configureBotProfile() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');

  if (!botToken) throw new Error('Run setupTelegramProperties() first.');

  // Set bot description
  const descResponse = UrlFetchApp.fetch(
    `https://api.telegram.org/bot${botToken}/setMyDescription`,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        description: '🍀 Shamrock Bail Bonds — 24/7 bail bond assistance for all 67 Florida counties.\n\nI can guide you through the entire bail process, collect paperwork, send signing links, and answer your questions instantly.\n\nType /start to begin.'
      }),
      muteHttpExceptions: true
    }
  );
  console.log('Set description:', JSON.parse(descResponse.getContentText()).ok ? '✅' : '❌');

  // Set short description
  const shortDescResponse = UrlFetchApp.fetch(
    `https://api.telegram.org/bot${botToken}/setMyShortDescription`,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        short_description: '🍀 24/7 bail bond assistance — all 67 Florida counties'
      }),
      muteHttpExceptions: true
    }
  );
  console.log('Set short description:', JSON.parse(shortDescResponse.getContentText()).ok ? '✅' : '❌');

  console.log('✅ Bot profile configured!');
  console.log('\n✅ Step 4 complete. Now run: verifyTelegramSetup()');
}

// =============================================================================
// VERIFICATION
// =============================================================================

/**
 * Verify the complete Telegram + ElevenLabs setup
 * Run after all setup steps are complete
 */
function verifyTelegramSetup() {
  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
  const elevenLabsKey = props.getProperty('ELEVENLABS_API_KEY');
  const wixUrl = props.getProperty('WIX_SITE_URL');
  const wixKey = props.getProperty('WIX_API_KEY');

  console.log('🔍 Verifying Telegram + ElevenLabs setup...\n');

  let allPassed = true;

  // ── Check 1: Bot token ────────────────────────────────────────────────────────
  console.log('1. Checking Telegram Bot Token...');
  if (!botToken) {
    console.error('   ❌ TELEGRAM_BOT_TOKEN not set');
    allPassed = false;
  } else {
    const meResponse = UrlFetchApp.fetch(
      `https://api.telegram.org/bot${botToken}/getMe`,
      { muteHttpExceptions: true }
    );
    const me = JSON.parse(meResponse.getContentText());
    if (me.ok) {
      console.log(`   ✅ Bot: @${me.result.username} (${me.result.first_name})`);
    } else {
      console.error('   ❌ Invalid bot token:', me.description);
      allPassed = false;
    }
  }

  // ── Check 2: Webhook ──────────────────────────────────────────────────────────
  console.log('2. Checking Webhook registration...');
  if (botToken) {
    const webhookResponse = UrlFetchApp.fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
      { muteHttpExceptions: true }
    );
    const webhookInfo = JSON.parse(webhookResponse.getContentText());
    if (webhookInfo.ok && webhookInfo.result.url) {
      console.log(`   ✅ Webhook URL: ${webhookInfo.result.url}`);
      if (webhookInfo.result.last_error_message) {
        console.warn(`   ⚠️  Last error: ${webhookInfo.result.last_error_message}`);
      }
    } else {
      console.error('   ❌ No webhook registered');
      allPassed = false;
    }
  }

  // ── Check 3: ElevenLabs ───────────────────────────────────────────────────────
  console.log('3. Checking ElevenLabs API Key...');
  if (!elevenLabsKey) {
    console.error('   ❌ ELEVENLABS_API_KEY not set');
    allPassed = false;
  } else {
    const elResponse = UrlFetchApp.fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': elevenLabsKey },
      muteHttpExceptions: true
    });
    if (elResponse.getResponseCode() === 200) {
      const user = JSON.parse(elResponse.getContentText());
      console.log(`   ✅ ElevenLabs: ${user.subscription?.tier || 'active'} plan`);
    } else {
      console.error('   ❌ ElevenLabs API key invalid');
      allPassed = false;
    }
  }

  // ── Check 4: Wix endpoint ─────────────────────────────────────────────────────
  console.log('4. Checking Wix intake endpoint...');
  if (!wixUrl || !wixKey) {
    console.error('   ❌ WIX_SITE_URL or WIX_API_KEY not set');
    allPassed = false;
  } else {
    const testResponse = UrlFetchApp.fetch(
      `${wixUrl}/_functions/get_pendingIntakes?apiKey=${wixKey}`,
      { muteHttpExceptions: true }
    );
    if (testResponse.getResponseCode() === 200) {
      console.log('   ✅ Wix IntakeQueue endpoint reachable');
    } else {
      console.warn(`   ⚠️  Wix endpoint returned ${testResponse.getResponseCode()} — may need deployment`);
    }
  }

  // ── Check 5: Script Properties ────────────────────────────────────────────────
  console.log('5. Checking Script Properties...');
  const requiredProps = [
    'TELEGRAM_BOT_TOKEN', 'ELEVENLABS_API_KEY', 'WIX_SITE_URL', 'WIX_API_KEY',
    'SHAMROCK_PHONE', 'SHAMROCK_PAYMENT_LINK', 'INTAKE_ENABLED'
  ];
  let propsMissing = false;
  requiredProps.forEach(key => {
    const val = props.getProperty(key);
    if (!val) {
      console.error(`   ❌ Missing: ${key}`);
      propsMissing = true;
      allPassed = false;
    }
  });
  if (!propsMissing) {
    console.log('   ✅ All required properties set');
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED — Telegram bot is ready!');
    console.log('\nNext steps:');
    console.log('  1. Send /start to your bot on Telegram to test');
    console.log('  2. Try the intake flow: "I need to bail someone out"');
    console.log('  3. Monitor logs in the GAS editor');
  } else {
    console.error('❌ SOME CHECKS FAILED — Review errors above');
  }

  return allPassed;
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Send a test message to yourself via the bot
 * Replace CHAT_ID with your own Telegram user ID
 * (Get it by messaging @userinfobot on Telegram)
 */
function sendTestMessage() {
  const YOUR_CHAT_ID = ''; // ← Fill in your Telegram chat ID

  if (!YOUR_CHAT_ID) {
    console.error('Fill in YOUR_CHAT_ID before running this function');
    return;
  }

  const props = PropertiesService.getScriptProperties();
  const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');

  if (!botToken) throw new Error('Run setupTelegramProperties() first.');

  const response = UrlFetchApp.fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: YOUR_CHAT_ID,
        text: '🍀 *Shamrock Bail Bonds bot is live!*\n\nThis is a test message from the GAS backend.\n\nType /start to begin.',
        parse_mode: 'Markdown'
      }),
      muteHttpExceptions: true
    }
  );

  const result = JSON.parse(response.getContentText());
  console.log(result.ok ? '✅ Test message sent!' : '❌ Failed: ' + result.description);
  return result;
}

/**
 * Test ElevenLabs voice generation and send to Telegram
 * Replace CHAT_ID with your own Telegram user ID
 */
function testVoiceNote() {
  const YOUR_CHAT_ID = ''; // ← Fill in your Telegram chat ID

  if (!YOUR_CHAT_ID) {
    console.error('Fill in YOUR_CHAT_ID before running this function');
    return;
  }

  console.log('🎤 Testing ElevenLabs voice note...');

  const script = 'Welcome to Shamrock Bail Bonds. I am Manus, your digital assistant. I am here to help get your loved one home tonight. This is a test of the voice note system.';

  try {
    const client = new ElevenLabsClient();
    const audioBlob = client.textToSpeech(script);

    if (!audioBlob) {
      console.error('❌ ElevenLabs returned no audio');
      return;
    }

    console.log('✅ Audio generated, sending to Telegram...');

    const props = PropertiesService.getScriptProperties();
    const botToken = props.getProperty('TELEGRAM_BOT_TOKEN');

    const formData = {
      chat_id: YOUR_CHAT_ID,
      audio: audioBlob,
      caption: '🎤 Test voice note from Shamrock Bail Bonds bot',
      parse_mode: 'Markdown'
    };

    const response = UrlFetchApp.fetch(
      `https://api.telegram.org/bot${botToken}/sendAudio`,
      {
        method: 'post',
        payload: formData,
        muteHttpExceptions: true
      }
    );

    const result = JSON.parse(response.getContentText());
    console.log(result.ok ? '✅ Voice note sent!' : '❌ Failed: ' + result.description);
    return result;

  } catch (e) {
    console.error('❌ Voice note test failed:', e);
  }
}

/**
 * Simulate a full intake conversation (for testing without Telegram)
 */
function testIntakeFlow() {
  const testUserId = 'TEST_USER_' + new Date().getTime();
  const testName = 'Test User';

  console.log('🧪 Testing intake flow...\n');

  const steps = [
    'I need to bail someone out',
    'Lee',
    'John Smith',
    '03/15/1985',
    'DUI',
    '5000',
    'Jane Smith',
    '239-555-1234',
    'jane@test.com',
    '123 Main St, Fort Myers, FL 33901',
    'Mother'
  ];

  steps.forEach((input, i) => {
    console.log(`\nStep ${i + 1}: User says: "${input}"`);
    const result = processIntakeConversation(testUserId, input, testName);
    console.log(`Bot responds: "${(result.text || '').substring(0, 150)}..."`);
    if (result.voice_script) {
      console.log(`Voice note: "${result.voice_script.substring(0, 100)}..."`);
    }
  });

  // Check final state
  const finalState = getConversationState(testUserId);
  console.log('\n📊 Final intake state:', JSON.stringify(finalState.data, null, 2));
  console.log('Current step:', finalState.step);

  // Clean up test state
  clearConversationState(testUserId);
  console.log('\n✅ Test complete. State cleaned up.');
}

/**
 * Clear all intake states (emergency reset)
 * Use only in development/testing
 */
function clearAllIntakeStates() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  let cleared = 0;

  Object.keys(allProps).forEach(key => {
    if (key.startsWith('INTAKE_STATE_')) {
      props.deleteProperty(key);
      cleared++;
    }
  });

  console.log(`✅ Cleared ${cleared} intake states`);
  return cleared;
}

/**
 * Get a summary of all active intake conversations
 */
function getActiveIntakeSummary() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  const active = [];

  Object.keys(allProps).forEach(key => {
    if (key.startsWith('INTAKE_STATE_')) {
      try {
        const state = JSON.parse(allProps[key]);
        active.push({
          userId: key.replace('INTAKE_STATE_', ''),
          step: state.step,
          startedAt: state.startedAt,
          lastActivity: state.lastActivity,
          defendantName: state.data?.defendantName || 'not yet collected',
          county: state.data?.county || 'not yet collected'
        });
      } catch (e) {
        // Skip malformed states
      }
    }
  });

  console.log(`📊 Active intake conversations: ${active.length}`);
  active.forEach(a => {
    console.log(`  User ${a.userId}: step=${a.step}, defendant=${a.defendantName}, county=${a.county}`);
  });

  return active;
}
