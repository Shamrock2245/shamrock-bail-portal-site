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
        'SLACK_CLIENT_SECRET': 'YOUR_SLACK_CLIENT_SECRET',
        'SLACK_SIGNING_SECRET': 'YOUR_SLACK_SIGNING_SECRET',
        'SLACK_VERIFICATION_TOKEN': 'YOUR_SLACK_VERIFICATION_TOKEN',
        'SLACK_BOT_TOKEN': 'YOUR_SLACK_BOT_TOKEN'
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

/**
 * Configures Twilio API Credentials.
 * Replace placeholders with your actual Twilio Account SID, Auth Token, and Phone Number.
 */
function setupTwilioProperties() {
    const props = PropertiesService.getScriptProperties();

    // 1. Twilio Credentials
    // Replace 'YOUR_TWILIO_ACCOUNT_SID' with your actual Account SID
    props.setProperty('TWILIO_ACCOUNT_SID', 'YOUR_TWILIO_ACCOUNT_SID');
    // Replace 'YOUR_TWILIO_AUTH_TOKEN' with your actual Auth Token
    props.setProperty('TWILIO_AUTH_TOKEN', 'YOUR_TWILIO_AUTH_TOKEN');
    // Replace '+17272952245' with your actual Twilio Phone Number
    props.setProperty('TWILIO_PHONE_NUMBER', '+17272952245');

    console.log("Twilio Configuration Check Complete.");
}

/**
 * Configures SignNow Credentials.
 * Uses the Basic Token for auto-refreshing access tokens.
 */
function setupSignNowProperties() {
    const props = PropertiesService.getScriptProperties();

    const SIGNNOW_CONFIG = {
        'SIGNNOW_API_BASE_URL': 'https://api.signnow.com', // Production Environment
        'SIGNNOW_BASIC_TOKEN': 'REPLACE_WITH_YOUR_BASIC_TOKEN' // Paste your Basic Token here
    };

    for (const [key, value] of Object.entries(SIGNNOW_CONFIG)) {
        if (value.includes('REPLACE_WITH')) {
            console.warn(`⚠️ Skipping ${key}: Placeholder value detected.`);
            continue;
        }
        props.setProperty(key, value);
        console.log(`✅ Set Property: ${key}`);
    }
    console.log("SignNow Configuration Check Complete.");
}
