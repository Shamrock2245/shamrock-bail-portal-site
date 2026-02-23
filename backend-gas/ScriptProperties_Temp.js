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
    var result = SocialPublisher.publish(
      "Hello world! This is a test tweet from the new automated Shamrock Bail Bonds system. 🍀🚀",
      ['twitter']
    );
    console.log("✅ Twitter Test Result: ", result);
  } catch (e) {
    console.error("❌ Twitter Test Failed: " + e.message);
  }
}
