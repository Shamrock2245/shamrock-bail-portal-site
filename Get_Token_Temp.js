
function emailToken() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN');
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Shamrock Telegram Token", "Your Telegram Bot Token is: " + token);
}
  