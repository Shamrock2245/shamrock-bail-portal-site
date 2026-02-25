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

  socialKeys.forEach(function(key) {
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
    Object.keys(status).forEach(function(platform) {
      var s = status[platform];
      console.log('  ' + (s.ready ? '✅' : '❌') + ' ' + platform.toUpperCase() +
        ': ' + (s.ready ? 'READY' : 'NOT READY') +
        (s.note ? ' — ' + s.note : ''));
    });
  } catch(e) {
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
  } catch(e) {
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
  } catch(e) {
    console.error('❌ Threads Setup Failed: ' + e.message);
    console.error('   Click "Connect Threads" in the Dashboard first, then run this.');
  }
}

/**
 * ─── GBP LOCATION DISCOVERY ─────────────────────────────────────────────────
 * After completing GBP OAuth, run this to discover your GBP Location ID.
 * Copy the ID from the log and add GBP_LOCATION_ID to Script Properties.
 */
function discoverGBPLocation() {
  try {
    logGbpLocations();
  } catch(e) {
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

  platforms.forEach(function(platform) {
    try {
      var result = SocialPublisher.publishPost(platform, testPost);
      if (result && result.success) {
        console.log('  ✅ ' + platform.toUpperCase() + ': Posted' + (result.id ? ' (ID: ' + result.id + ')' : ''));
      } else {
        console.log('  ⚠️  ' + platform.toUpperCase() + ': ' + (result ? (result.error || result.note || 'Failed') : 'No response'));
      }
    } catch(e) {
      console.log('  ❌ ' + platform.toUpperCase() + ': ' + e.message);
    }
  });

  console.log('═══════════════════════════════════════════════════════');
}
