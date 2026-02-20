const { execSync } = require('child_process');

// The values to set
const props = {
  GAS_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbwd5zOQmkwNgvVCjFo2QJchGgzKMvt2IRA_PylVI2YokEl18LKvdGpie92tvZmQh8v4IA/exec'
};

try {
  console.log('Setting GAS Script Properties via clasp...');
  for (const [key, value] of Object.entries(props)) {
    console.log(`Setting ${key}...`);
    // Need to execute this within the GAS project directory
    const output = execSync(`npx clasp setting --property ${key} "${value}"`, { 
      cwd: '/Users/brendan/Desktop/shamrock-bail-portal-site/backend-gas',
      encoding: 'utf-8' 
    });
    console.log(output);
  }
  console.log('Successfully updated properties!');
} catch (error) {
  console.error('Failed to set properties:', error.message);
  if (error.stdout) console.error('Stdout:', error.stdout);
  if (error.stderr) console.error('Stderr:', error.stderr);
}
