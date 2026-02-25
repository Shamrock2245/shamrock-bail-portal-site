const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Running clasp run getTelegramToken...");
  // We have to use a local installation of clasp to avoid the global EPERM issue.
  // Wait, the clasp command uses the global one which has EPERM on .clasprc.json
  // Let's use npx clasp run
  const output = execSync('npx clasp run getTelegramToken', { encoding: 'utf-8' });
  console.log(output);
} catch (e) {
  console.error(e.stdout || e.message);
}
