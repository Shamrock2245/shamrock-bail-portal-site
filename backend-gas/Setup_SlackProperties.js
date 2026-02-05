/**
 * Setup_SlackProperties.js
 * 
 * Utility to programmatically set Script Properties.
 * Bypasses the 50-property limit of the GAS UI.
 * 
 * INSTRUCTIONS:
 * 1. Open this file in the GAS Editor.
 * 2. Update the 'value' variable in `configureSlackWebhookNewCases`.
 * 3. Run `configureSlackWebhookNewCases` from the dropdown.
 * 4. (Optional) Run `auditScriptProperties` to verify everything.
 */

/**
 * SETS the SLACK_WEBHOOK_NEW_CASES property.
 * Replace 'YOUR_WEBHOOK_URL_HERE' with the actual URL before running.
 */
function configureSlackWebhookNewCases() {
    const PROPERTY_KEY = 'SLACK_WEBHOOK_NEW_CASES';

    // ⚠️ PASTE YOUR WEBHOOK URL HERE ⚠️
    // Example: 'https://hooks.slack.com/services/T_YOUR_TEAM_ID/B_YOUR_BOT_ID/YOUR_TOKEN'
    const value = 'YOUR_WEBHOOK_URL_HERE'; // <--- PASTE HERE

    if (value === 'YOUR_WEBHOOK_URL_HERE') {
        console.error('❌ Error: You must replace "YOUR_WEBHOOK_URL_HERE" with the actual Slack Webhook URL inside the script.');
        return;
    }

    const props = PropertiesService.getScriptProperties();
    props.setProperty(PROPERTY_KEY, value);

    console.log(`✅ Successfully set ${PROPERTY_KEY}`);
    console.log(`   Value Prefix: ${value.substring(0, 35)}...`); // Log only safe prefix
}

/**
 * Utility to list all properties (masked) to verify existing setup.
 */
function auditScriptProperties() {
    const props = PropertiesService.getScriptProperties().getProperties();
    const keys = Object.keys(props).sort();

    console.log(`🔍 Found ${keys.length} Script Properties:`);
    console.log('------------------------------------------------');

    keys.forEach(key => {
        let val = props[key];
        // Mask long secrets
        if (val.length > 10 && !val.startsWith('http')) {
            val = val.substring(0, 4) + '... (masked)';
        } else if (val.startsWith('https://hooks.slack.com')) {
            val = val.substring(0, 35) + '... (masked webhook)';
        }
        console.log(`• ${key}: ${val}`);
    });

    console.log('------------------------------------------------');
    console.log('✅ End of Audit');
}
