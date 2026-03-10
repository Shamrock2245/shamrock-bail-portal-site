/**
 * BOOTSTRAP HELPER — Set GAS_WEBHOOK_URL from ScriptApp
 *
 * Run this once after deploying as a Web App to store the live URL
 * in Script Properties. After running setupAllProperties(), this
 * function is no longer needed.
 *
 * NOTE: This function must be run from within a deployed Web App context
 * so that ScriptApp.getService().getUrl() returns the correct URL.
 */
function setInternalGASUrl() {
  const props = PropertiesService.getScriptProperties();

  // Read the live URL from ScriptApp — never hardcode this value.
  let url;
  try {
    url = ScriptApp.getService().getUrl();
    if (!url) throw new Error('ScriptApp returned empty URL');
  } catch (e) {
    console.error('❌ Could not read URL from ScriptApp: ' + e.message);
    console.error('   Make sure this script is deployed as a Web App before running this function.');
    return;
  }

  props.setProperty('GAS_WEBHOOK_URL', url);
  console.log('✅ Set GAS_WEBHOOK_URL: ' + url);
}

function setTwitterTokens() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('TWITTER_API_KEY', 'REDACTED');
  props.setProperty('TWITTER_API_SECRET', 'REDACTED');
  props.setProperty('TWITTER_ACCESS_TOKEN', 'REDACTED');
  props.setProperty('TWITTER_ACCESS_TOKEN_SECRET', 'REDACTED');
  console.log('✅ Set Twitter Tokens successfully.');
}

/**
 * ─── TWITTER SMOKE TEST ─────────────────────────────────────────────────────
 * A timestamp is appended to every test post to prevent Twitter's
 * duplicate-content 403 error. Safe to run multiple times.
 */
function testTwitter() {
  try {
    // Timestamp prevents Twitter's duplicate-content 403
    var ts = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
    var result = SocialPublisher.publishPost('twitter',
      '🍀 Shamrock Bail Bonds — automated system check (' + ts + ' ET). ' +
      'Fast, professional bail bonds in SWFL. Call (239) 332-2245. ' +
      '#BailBonds #SWFL #FortMyers'
    );
    console.log('✅ Twitter Test Result:', result);
  } catch (e) {
    console.error('❌ Twitter Test Failed: ' + e.message);
  }
}

function setTikTokTokens() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('TIKTOK_CLIENT_KEY', 'REDACTED');
  props.setProperty('TIKTOK_CLIENT_SECRET', 'REDACTED');
  console.log('✅ Set TikTok Tokens successfully.');
}

/**
 * ─── TIKTOK OAUTH FLOW ──────────────────────────────────────────────────────
 * Step 1: Run setTikTokTokens() above to store TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET.
 * Step 2: Run logAuthUrl_TikTok() (in SocialPublisher.js) to get the OAuth URL.
 * Step 3: Visit the URL, authorize with your TikTok account.
 * Step 4: GAS will auto-store TIKTOK_ACCESS_TOKEN via the OAuth callback.
 * Step 5: Run testTikTok() below to confirm posting works.
 */
function testTikTok() {
  try {
    var ts = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
    var result = SocialPublisher.publishPost('tiktok',
      '🍀 Shamrock Bail Bonds — automated system check (' + ts + ' ET). ' +
      'Fast, professional bail bonds in SWFL. Call (239) 332-2245. ' +
      '#BailBonds #SWFL #FortMyers'
    );
    console.log('✅ TikTok Test Result:', result);
  } catch (e) {
    console.error('❌ TikTok Test Failed: ' + e.message);
  }
}

/**
 * ─── TELEGRAM PROPERTIES ────────────────────────────────────────────────
 * Sets TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID for social broadcasting.
 * Run this ONCE from the GAS IDE after replacing the placeholder values.
 *
 * To get your CHAT_ID:
 *   1. Add your bot to the target channel/group as admin
 *   2. Send a message in that channel
 *   3. Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
 *   4. Look for "chat": { "id": ... } in the response
 *   5. Channel IDs start with -100 (e.g., -1001234567890)
 */
function setTelegramProperties() {
  var props = PropertiesService.getScriptProperties();
  // ⚠️ REPLACE these with your real values before running
  props.setProperty('TELEGRAM_BOT_TOKEN', 'PASTE_YOUR_BOT_TOKEN_HERE');
  props.setProperty('TELEGRAM_CHAT_ID', 'PASTE_YOUR_CHAT_ID_HERE');
  console.log('✅ Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID successfully.');
  console.log('   Run testTelegram() to verify posting works.');
}

/**
 * ─── PEXELS API KEY ─────────────────────────────────────────────────────
 * Sets the Pexels API key for the Media Library public domain image search.
 * Get a free key at https://www.pexels.com/api/
 */
function setPexelsApiKey() {
  var props = PropertiesService.getScriptProperties();
  // REDACTED for git — value already deployed to GAS via clasp push 2026-02-27
  props.setProperty('PEXELS_API_KEY', 'REDACTED');
  console.log('✅ Set PEXELS_API_KEY successfully.');
}

/**
 * ─── TELEGRAM SOCIAL CHAT ID ────────────────────────────────────────────────
 * The TELEGRAM_BOT_TOKEN is already set (used by the intake bot).
 * To enable social broadcasting to a Telegram channel, you only need to set
 * TELEGRAM_CHAT_ID. Use setTelegramSocialChatId() in SocialPublisher.js.
 *
 * Quick test — run this after setting TELEGRAM_CHAT_ID:
 */
function testTelegram() {
  try {
    var ts = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
    var result = SocialPublisher.publishPost('telegram',
      '🍀 Shamrock Bail Bonds — automated system check (' + ts + ' ET). ' +
      'Fast, professional bail bonds in SWFL. Call (239) 332-2245. ' +
      '#BailBonds #SWFL #FortMyers'
    );
    console.log('✅ Telegram Test Result:', result);
  } catch (e) {
    console.error('❌ Telegram Test Failed: ' + e.message);
  }
}

/**
 * ─── SOCIAL CREDENTIAL FULL AUDIT ───────────────────────────────────────────
 * Run this from the GAS IDE to get a complete dump of all social-related
 * Script Properties and their status. Output appears in the Execution Log.
 * Safe to run at any time — read-only, no side effects.
 */
function auditAllSocialProps() {
  var props = PropertiesService.getScriptProperties().getProperties();

  var socialKeys = [
    'TWITTER_API_KEY', 'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_TOKEN_SECRET',
    'GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET',
    'GBP_ACCESS_TOKEN', 'GBP_REFRESH_TOKEN', 'GBP_LOCATION_ID',
    'YOUTUBE_ACCESS_TOKEN', 'YOUTUBE_REFRESH_TOKEN', 'YOUTUBE_CHANNEL_ID',
    'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET',
    'FB_PAGE_ACCESS_TOKEN', 'FB_PAGE_ID',
    'INSTAGRAM_ACCOUNT_ID',
    'THREADS_CLIENT_ID', 'THREADS_CLIENT_SECRET',
    'THREADS_ACCESS_TOKEN', 'THREADS_USER_ID',
    'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_ACCESS_TOKEN',
    'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_ACCESS_TOKEN',
    'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID',
    'SKOOL_API_KEY', 'PATREON_ACCESS_TOKEN'
  ];

  console.log('═══════════════════════════════════════════════════════');
  console.log('  SHAMROCK SOCIAL HUB — CREDENTIAL AUDIT');
  console.log('  ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET');
  console.log('═══════════════════════════════════════════════════════');

  var ready = [], missing = [];

  socialKeys.forEach(function (key) {
    var val = props[key];
    if (val && val.trim() !== '' && val !== 'REDACTED') {
      var preview = val.length > 20 ? val.substring(0, 12) + '...' + val.slice(-4) : val;
      console.log('  ✅ ' + key + ': ' + preview);
      ready.push(key);
    } else {
      console.log('  ❌ ' + key + ': NOT SET');
      missing.push(key);
    }
  });

  console.log('───────────────────────────────────────────────────────');
  console.log('  READY: ' + ready.length + ' / ' + socialKeys.length + ' keys set');
  if (missing.length > 0) {
    console.log('  MISSING: ' + missing.join(', '));
  }
  console.log('═══════════════════════════════════════════════════════');

  // Also run the built-in platform-level status check
  try {
    var status = getSocialCredentialStatus();
    console.log('\n  PLATFORM READY STATUS:');
    Object.keys(status).forEach(function (platform) {
      var s = status[platform];
      console.log('  ' + (s.ready ? '✅' : '❌') + ' ' + platform.toUpperCase() +
        ': ' + (s.ready ? 'READY' : 'NOT READY') +
        (s.note ? ' — ' + s.note : ''));
    });
  } catch (e) {
    console.log('  (getSocialCredentialStatus: ' + e.message + ')');
  }
  console.log('═══════════════════════════════════════════════════════');
}

/**
 * ─── COMPLETE FACEBOOK OAUTH FLOW ───────────────────────────────────────────
 * After clicking "Connect Facebook" in the Dashboard and authorizing,
 * run this to exchange the short-lived token for a long-lived Page Access Token.
 * FB_PAGE_ACCESS_TOKEN and FB_PAGE_ID will be auto-stored.
 */
function completeFacebookSetup() {
  try {
    var result = exchangeFacebookTokenForPageToken();
    console.log('✅ Facebook Setup Result:', JSON.stringify(result));
  } catch (e) {
    console.error('❌ Facebook Setup Failed: ' + e.message);
    console.error('   Click "Connect Facebook" in the Dashboard first, then run this.');
  }
}

/**
 * ─── COMPLETE THREADS OAUTH FLOW ────────────────────────────────────────────
 * After clicking "Connect Threads" in the Dashboard and authorizing,
 * run this to exchange the short-lived token for a 60-day token.
 */
function completeThreadsSetup() {
  try {
    var result = exchangeThreadsTokenForLongLived();
    console.log('✅ Threads Setup Result:', JSON.stringify(result));
  } catch (e) {
    console.error('❌ Threads Setup Failed: ' + e.message);
    console.error('   Click "Connect Threads" in the Dashboard first, then run this.');
  }
}

/**
 * ─── GOOGLE OAUTH CREDENTIALS (for GBP + YouTube) ───────────────────────────
 * Run this ONCE to store the Google OAuth Client ID and Secret.
 * Source: shamrock-bail-suite GCP project credentials file.
 * After running, proceed with logAuthUrl_GBP() to authorize.
 */
function setGoogleOAuthCredentials() {
  var props = PropertiesService.getScriptProperties();
  // REDACTED for git — values already deployed to GAS via clasp push
  props.setProperty('GOOGLE_OAUTH_CLIENT_ID', 'REDACTED');
  props.setProperty('GOOGLE_OAUTH_CLIENT_SECRET', 'REDACTED');
  props.setProperty('GBP_LOCATION_ID', '8371915753604835374');
  props.setProperty('YOUTUBE_CHANNEL_ID', 'UC7DJBUpinY6ZqPjiSmpb0ow');
  console.log('✅ Google OAuth credentials + GBP Location ID + YouTube Channel ID stored.');
}

/**
 * ─── GITHUB FINE-GRAINED PAT ────────────────────────────────────────────────
 * Stores a fine-grained GitHub Personal Access Token scoped to the
 * shamrock-telegram-app repository. Used for any GAS→GitHub interactions
 * (e.g., triggering deployments, reading repo content, webhook payloads).
 *
 * Run this ONCE from the GAS IDE after deploying.
 */
function setGitHubToken() {
  var props = PropertiesService.getScriptProperties();
  // Updated 2026-03-10 — new fine-grained PAT scoped to all Shamrock2245 repos
  props.setProperty('GITHUB_PAT', 'REDACTED');
  console.log('✅ Set GITHUB_PAT successfully.');
  console.log('   Scoped to: ALL Shamrock2245 repos');
}

/**
 * ─── SLACK BOT TOKEN ────────────────────────────────────────────────────────
 * Stores the Slack Bot Token for internal alerting (Intake leads, Bounty
 * Board alerts, SignNow notifications, etc.).
 * Used by Node-RED flows and GAS webhook handlers.
 *
 * Run this ONCE from the GAS IDE.
 */
function setSlackBotToken() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SLACK_BOT_TOKEN', 'REDACTED');
  console.log('✅ Set SLACK_BOT_TOKEN successfully.');
  console.log('   Used for: #alerts, #new-cases, #bonds-live Slack channels');
}

/**
 * ─── NODE-RED / NGROK STATIC URL ────────────────────────────────────────────
 * Stores the permanent ngrok base URL so GAS can call Node-RED webhooks.
 * Updated 2026-03-10 — switched from dynamic to static free domain.
 *
 * Run this ONCE from the GAS IDE.
 */
function setNodeRedEndpoint() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('NODE_RED_BASE_URL', 'https://pseudospherical-etta-untactually.ngrok-free.dev');
  console.log('✅ Set NODE_RED_BASE_URL successfully.');
  console.log('   Static domain — survives ngrok restarts');
}

/**
 * ─── GITHUB PAT — TELEGRAM APPS REPO ───────────────────────────────────────
 * Stores a separate GitHub PAT scoped to the shamrock-telegram-app repository.
 * Kept as a separate property so each repo can have independently-scoped tokens.
 *
 * Run this ONCE from the GAS IDE after pasting your real token.
 */
function setGitHubTokenTelegram() {
  var props = PropertiesService.getScriptProperties();
  // REDACTED for git — paste real value in GAS IDE before running
  props.setProperty('GITHUB_PAT_TELEGRAM', 'REDACTED');
  console.log('✅ Set GITHUB_PAT_TELEGRAM successfully.');
  console.log('   Scoped to: shamrock-telegram-app repo');
}

/**
 * ─── GBP LOCATION DISCOVERY ─────────────────────────────────────────────────
 * After completing GBP OAuth, run this to discover your GBP Location ID.
 * Copy the ID from the log and add GBP_LOCATION_ID to Script Properties.
 */
function discoverGBPLocation() {
  try {
    logGbpLocations();
  } catch (e) {
    console.error('❌ GBP Discovery Failed: ' + e.message);
    console.error('   Complete GBP OAuth via logAuthUrl_GBP() first.');
  }
}

/**
 * ─── FULL SOCIAL HUB SMOKE TEST ─────────────────────────────────────────────
 * Tests all configured platforms with a timestamped post.
 * Platforms not yet configured will return a graceful error — not a crash.
 */
function smokeTestAllPlatforms() {
  var ts = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
  var testPost = '🍀 Shamrock Bail Bonds — system check (' + ts + ' ET). ' +
    'Fast bail bonds in SWFL. (239) 332-2245 #BailBonds #SWFL';

  var platforms = ['twitter', 'gbp', 'youtube', 'facebook', 'instagram', 'threads', 'telegram', 'tiktok', 'linkedin'];

  console.log('═══════════════════════════════════════════════════════');
  console.log('  SOCIAL HUB SMOKE TEST — ' + ts + ' ET');
  console.log('═══════════════════════════════════════════════════════');

  platforms.forEach(function (platform) {
    try {
      var result = SocialPublisher.publishPost(platform, testPost);
      if (result && result.success) {
        console.log('  ✅ ' + platform.toUpperCase() + ': Posted' + (result.id ? ' (ID: ' + result.id + ')' : ''));
      } else {
        console.log('  ⚠️  ' + platform.toUpperCase() + ': ' + (result ? (result.error || result.note || 'Failed') : 'No response'));
      }
    } catch (e) {
      console.log('  ❌ ' + platform.toUpperCase() + ': ' + e.message);
    }
  });

  console.log('═══════════════════════════════════════════════════════');
}

// =============================================================================
// INTAKE QUEUE DIAGNOSTICS
// =============================================================================

/**
 * debugFetchQueue
 * Run this from the GAS IDE to diagnose why the Dashboard Intake Queue is blank.
 * Checks both the Google Sheets path and the Wix CMS path independently.
 * Read-only — no side effects.
 *
 * HOW TO RUN:
 *   GAS IDE → select "debugFetchQueue" from the function dropdown → click Run
 *   Then check the Execution Log for the output.
 */
function debugFetchQueue() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('=== INTAKE QUEUE DIAGNOSTIC ===');

  // 1. Check IntakeQueue sheet
  const iqSheet = ss.getSheetByName('IntakeQueue');
  if (!iqSheet) {
    Logger.log('❌ IntakeQueue sheet: NOT FOUND');
  } else {
    const iqRows = iqSheet.getLastRow() - 1;
    Logger.log('✅ IntakeQueue sheet: found, ' + iqRows + ' data rows');
    if (iqRows > 0) {
      const iqData = iqSheet.getDataRange().getValues();
      const iqHeaders = iqData[0];
      const idxStatus = iqHeaders.indexOf('Status');
      let pendingCount = 0;
      for (let i = 1; i < iqData.length; i++) {
        if (String(iqData[i][idxStatus] || '').trim().toLowerCase() === 'pending') pendingCount++;
      }
      Logger.log('   → Rows with Status=pending: ' + pendingCount);
      Logger.log('   → Headers: ' + iqHeaders.join(', '));
      if (iqData.length > 1) Logger.log('   → Sample row 2: ' + JSON.stringify(iqData[1]).substring(0, 300));
    }
  }

  // 2. Check Telegram_IntakeQueue sheet
  const tqSheet = ss.getSheetByName('Telegram_IntakeQueue');
  if (!tqSheet) {
    Logger.log('❌ Telegram_IntakeQueue sheet: NOT FOUND');
  } else {
    const tqRows = tqSheet.getLastRow() - 1;
    Logger.log('✅ Telegram_IntakeQueue sheet: found, ' + tqRows + ' data rows');
    if (tqRows > 0) {
      const tqData = tqSheet.getDataRange().getValues();
      const tqHeaders = tqData[0];
      const idxStatus2 = tqHeaders.indexOf('Status');
      let pendingCount2 = 0;
      for (let j = 1; j < tqData.length; j++) {
        if (String(tqData[j][idxStatus2] || '').trim().toLowerCase() === 'pending') pendingCount2++;
      }
      Logger.log('   → Rows with Status=pending: ' + pendingCount2);
      Logger.log('   → Headers: ' + tqHeaders.join(', '));
      if (tqData.length > 1) Logger.log('   → Sample row 2: ' + JSON.stringify(tqData[1]).substring(0, 300));
    }
  }

  // 3. Check TelegramIntakeData sheet
  const tidSheet = ss.getSheetByName('TelegramIntakeData');
  if (!tidSheet) {
    Logger.log('❌ TelegramIntakeData sheet: NOT FOUND');
  } else {
    Logger.log('✅ TelegramIntakeData sheet: found, ' + (tidSheet.getLastRow() - 1) + ' data rows');
  }

  // 4. Test Wix pendingIntakes endpoint
  Logger.log('--- Wix CMS path ---');
  try {
    const result = debugWixIntakeQueueConnection();
    Logger.log('Wix endpoint status: ' + result.statusCode);
    Logger.log('Wix intakes count: ' + (result.parsed && result.parsed.intakes ? result.parsed.intakes.length : 'N/A'));
    if (result.parsed && result.parsed.intakes && result.parsed.intakes.length > 0) {
      Logger.log('Sample Wix intake: ' + JSON.stringify(result.parsed.intakes[0]).substring(0, 200));
    }
  } catch (e) {
    Logger.log('❌ Wix endpoint error: ' + e.message);
  }

  // 5. Run the actual combined fetch
  Logger.log('--- Combined fetchPendingIntakes result ---');
  try {
    const combined = handleAction({ action: 'fetchPendingIntakes' });
    Logger.log('Total intakes returned to Dashboard: ' + (combined ? combined.length : 0));
    if (combined && combined.length > 0) {
      Logger.log('First intake: ' + JSON.stringify(combined[0]).substring(0, 300));
    }
  } catch (e) {
    Logger.log('❌ fetchPendingIntakes threw: ' + e.message);
  }

  Logger.log('=== DIAGNOSTIC COMPLETE ===');
}
