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

function testTwitter() {
  try {
    var result = SocialPublisher.publishPost('twitter',
      "Hello world! This is a test tweet from the new automated Shamrock Bail Bonds system. 🍀🚀"
    );
    console.log("✅ Twitter Test Result: ", result);
  } catch (e) {
    console.error("❌ Twitter Test Failed: " + e.message);
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
    var result = SocialPublisher.publishPost('tiktok',
      "Hello from Shamrock Bail Bonds! 🍀 Automated post test. #BailBonds #SWFL"
    );
    console.log("✅ TikTok Test Result:", result);
  } catch (e) {
    console.error("❌ TikTok Test Failed: " + e.message);
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
    var result = SocialPublisher.publishPost('telegram',
      "Hello from Shamrock Bail Bonds! 🍀 Automated post test. #BailBonds #SWFL"
    );
    console.log("✅ Telegram Test Result:", result);
  } catch (e) {
    console.error("❌ Telegram Test Failed: " + e.message);
  }
}
