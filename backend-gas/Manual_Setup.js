/**
 * MANUAL SETUP — Register SignNow Webhook
 * Run this function once after deploying as a Web App to register
 * the SignNow completion webhook pointing to this script's live URL.
 *
 * The URL is read from ScriptApp at runtime — never hardcoded.
 */
function manual_register_webhook() {
  // ScriptApp.getService().getUrl() returns the live deployed URL of this script.
  // Falls back to the stored property if not running as a deployed web app.
  const url = ScriptApp.getService().getUrl()
    || PropertiesService.getScriptProperties().getProperty('GAS_WEBHOOK_URL');

  if (!url) {
    console.error('❌ Cannot register webhook: GAS_WEBHOOK_URL is not set. Deploy as Web App first.');
    return;
  }

  console.log('🔗 Registering SignNow webhook to: ' + url);
  SN_registerCompletionWebhook(url);
}
