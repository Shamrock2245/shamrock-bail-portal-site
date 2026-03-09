function emailToken() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN');
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Shamrock Telegram Token", "Your Telegram Bot Token is: " + token);
}
function dumpTokens() {
  var props = PropertiesService.getScriptProperties().getProperties();
  console.log("=== TELEGRAM_BOT_TOKEN ===");
  console.log(props['TELEGRAM_BOT_TOKEN']);
  console.log("=== TELEGRAM_CHAT_ID ===");
  console.log(props['TELEGRAM_CHAT_ID']);
  console.log("=== END_TOKENS ===");
}
