const { execSync } = require('child_process');
const fs = require('fs');

try {
  // We will run clasp logs and just grep for our specific log output.
  // First we need to deploy a script that logs it.
  const scriptContent = `
function logTokenForCLI() {
  const props = PropertiesService.getScriptProperties();
  console.log("=== TOKEN_START ===" + props.getProperty('TELEGRAM_BOT_TOKEN') + "=== TOKEN_END ===");
}
  `;
  fs.writeFileSync('Get_Token_Temp.js', scriptContent);
  execSync('clasp push -f', { stdio: 'inherit' });
  
  // Actually, we still can't execute it. But we CAN create a time-based trigger
  // that runs in 1 minute, wait, and check logs.
  const triggerScript = `
function createLogTrigger() {
  ScriptApp.newTrigger('logTokenForCLI')
    .timeBased()
    .after(1000)
    .create();
}
function logTokenForCLI() {
  const props = PropertiesService.getScriptProperties();
  console.log("=== TOKEN_START ===" + props.getProperty('TELEGRAM_BOT_TOKEN') + "=== TOKEN_END ===");
}
  `;
  fs.writeFileSync('Get_Token_Temp.js', triggerScript);
  execSync('clasp push -f', { stdio: 'inherit' });
  
  console.log("Deploying trigger... Go to the GAS editor and run 'createLogTrigger' manually, then run 'clasp logs'.");
} catch (e) {
  console.error(e);
}
