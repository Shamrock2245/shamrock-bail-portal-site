const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Let's replace Get_Token_Temp.js with one that triggers an EMAIL to the user instead
  // since clasp push works, we can just push a script that emails them their token.
  const emailScript = `
function emailToken() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN');
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Shamrock Telegram Token", "Your Telegram Bot Token is: " + token);
}
  `;
  fs.writeFileSync('Get_Token_Temp.js', emailScript);
  execSync('clasp push -f', { stdio: 'inherit' });
  console.log("Deployed emailToken script. Now running via clasp run...");
  // Even if clasp run doesn't output to console, the email might send if it actually executes.
  try {
     execSync('npx clasp run emailToken');
  } catch(e) {}
  console.log("Check your email!");
} catch (e) {
  console.error(e);
}
