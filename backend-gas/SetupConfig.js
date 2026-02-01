/**
 * SetupConfig.js
 * 
 * Centralized configuration Setup for external integrations.
 * Run these functions to safely store credentials in Script Properties.
 */

/**
 * Configures Slack App Credentials.
 * Replace placeholders with values from your valid screenshot/App Dashboard.
 */
function setupSlackProperties() {
    const props = PropertiesService.getScriptProperties();

    // 1. App Credentials (Reference: Your uploaded screenshot)
    const SLACK_CONFIG = {
        'SLACK_APP_ID': 'A09NLQOG8QN',
        'SLACK_CLIENT_ID': '9768679556864.9768016552630',
        'SLACK_CLIENT_SECRET': 'YOUR_CLIENT_SECRET_HERE', // From Screenshot (masked)
        'SLACK_SIGNING_SECRET': 'YOUR_SIGNING_SECRET_HERE', // From Screenshot (masked)
        'SLACK_VERIFICATION_TOKEN': 'YOUR_VERIFICATION_TOKEN_HERE', // From Screenshot (masked)
        'SLACK_BOT_TOKEN': 'xoxb-YOUR-BOT-TOKEN-HERE' // Need this for posting messages!
    };

    // 2. Save to Properties
    for (const [key, value] of Object.entries(SLACK_CONFIG)) {
        if (value.includes('YOUR_')) {
            console.warn(`⚠️ Skipping ${key}: Placeholder value detected. Please update SetupConfig.js first.`);
            continue;
        }
        props.setProperty(key, value);
        console.log(`✅ Set Property: ${key}`);
    }

    console.log("Slack Configuration Check Complete.");
}
