/**
 * ADMIN UTILITY: BATCH UPDATE SCRIPT PROPERTIES
 * Run this function ONCE in the Apps Script Editor to set all necessary configuration.
 */
function ADMIN_UpdateAllProperties() {
    const props = PropertiesService.getScriptProperties();

    // -------------------------------------------------------------------------
    // 1. PROJECT CONFIGURATION (Defaults applied where possible)
    // -------------------------------------------------------------------------
    const config = {
        // --- API SECURITY ---
        'GAS_API_KEY': 'shamrock_placeholder_redacted_for_git', // Shared secret with Wix
        'MCP_API_KEY': 'REPLACE_WITH_MCP_API_KEY',  // Shared secret with Cursor/Context

        // --- URLS ---
        'WIX_SITE_URL': 'https://www.shamrockbailbonds.biz',
        'WEBHOOK_URL': 'REPLACE_WITH_SLACK_WEBHOOK_URL', // Needs full webhook if known, otherwise keep placeholder or use Bot Token

        // --- SLACK WEBHOOKS ---
        'SLACK_BOT_TOKEN': 'REPLACE_WITH_SLACK_BOT_TOKEN',

        // --- SIGNNOW INTEGRATION ---
        'SIGNNOW_API_BASE_URL': 'https://api.signnow.com',
        'SIGNNOW_API_KEY': 'd7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4', // Primary API Key
        'SIGNNOW_API_TOKEN': 'd7586a6fe7dc621f6f26d531e9073665111ce3c4dfe90408001e18637de141c4', // Same as API Key for compatibility
        'SIGNNOW_WEBHOOK_SECRET': 'b4633bfe7f90483abcf4801620aedc59', // For HMAC signature verification
        'SIGNNOW_CLIENT_ID': '3b4dd51e0a07557e5b0e6b42415759db', // OAuth Client ID
        'SIGNNOW_BASIC_TOKEN': 'M2I0ZGQ1MWUwYTA3NTU3ZTViMGU2YjQyNDE1NzU5ZGI6YjQ2MzNiZmU3ZjkwNDgzYWJjZjQ4MDE2MjBhZWRjNTk=', // Basic Auth Token
        'SIGNNOW_FOLDER_ID': '79a05a382b38460b95a78d94a6d79a5ad55e89e6',
        'SIGNNOW_TEMPLATE_ID': 'REPLACE_WITH_TEMPLATE_ID',

        // --- TWILIO INTEGRATION ---
        'TWILIO_ACCOUNT_SID': 'REPLACE_WITH_TWILIO_SID',
        'TWILIO_AUTH_TOKEN': 'REPLACE_WITH_TWILIO_TOKEN',
        'TWILIO_PHONE_NUMBER': '+17272952245',
        'TWILIO_VERIFY_SERVICE_SID': '',

        // --- GOOGLE DRIVE & SHEETS ---
        'GOOGLE_DRIVE_FOLDER_ID': '1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3', // "Shamrock Bail Bonds" Root
        'GOOGLE_DRIVE_OUTPUT_FOLDER_ID': '1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs', // "Signed Documents"
        'AUDIT_LOG_SHEET_ID': 'REPLACE_WITH_SHEET_ID', // If using separate sheet
        'TARGET_SPREADSHEET_ID': '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E', // Main Data Sheet

        // --- AI & EXTERNAL ---
        'GOOGLE_MAPS_API_KEY': 'REPLACE_WITH_GOOGLE_MAPS_KEY', // Public key with Domain Restrictions
        'OPENAI_API_KEY': 'sk-proj-placeholder-redacted-for-git-security',

        'FORM_URL': '', // If using external form
        'FORM_PREFILL_DATA': '',

        // --- BAIL SCHOOL ---
        'CERTIFICATE_TEMPLATE_ID': '', // Google Doc Template ID for Certificates

        // --- SYSTEM STATE ---
        'CURRENT_RECEIPT_NUMBER': '202500', // Auto-increments
        'LAST_INTAKE_POLL': new Date().toISOString()
    };

    // -------------------------------------------------------------------------
    // 2. APPLY UPDATES (SMART MERGE)
    // -------------------------------------------------------------------------
    const currentProps = props.getProperties();
    const updates = {};
    let skippedCount = 0;

    for (const key in config) {
        const newValue = config[key];

        // SAFETY CHECK: Don't overwrite existing good data with placeholders
        if (!newValue || newValue.includes('REPLACE_WITH') || newValue.includes('slack.com')) {
            console.log(`Bypassing ${key} (Placeholder/Invalid) - Keeping existing value.`);
            skippedCount++;
            continue;
        }

        updates[key] = newValue;
    }

    // Apply only the valid updates
    if (Object.keys(updates).length > 0) {
        props.setProperties(updates, false); // Merge
        console.log(`✅ Updated ${Object.keys(updates).length} properties.`);
    } else {
        console.log('ℹ️ No new properties to update.');
    }

    if (skippedCount > 0) {
        console.log(`⚠️ Skipped ${skippedCount} placeholders to protect existing settings.`);
    }

    // -------------------------------------------------------------------------
    // 3. LOG RESULTS
    // -------------------------------------------------------------------------
    console.log('✅ PROPERTIES UPDATED');
    const all = props.getProperties();
    for (const key in all) {
        let val = all[key];
        // Mask secrets in log
        if (key.match(/KEY|TOKEN|SID|SECRET|WEBHOOK/)) {
            val = val.substring(0, 5) + '...******';
        }
        console.log(`${key}: ${val}`);
    }

    return "Properties Updated Successfully";
}

/**
 * Helper to just set the Slack Webhook quickly
 */
function SETUP_SlackWebhook(url) {
    if (!url) throw new Error("Please provide a URL string");
    PropertiesService.getScriptProperties().setProperty('WEBHOOK_URL', url);
    return "Webhook Set";
}

/**
 * Helper to set SignNow Basic Token specifically.
 * Run this function in the editor with your token string.
 */
function SETUP_SignNowBasicToken(token) {
    if (!token || token.length < 10) throw new Error("Please provide a valid Basic Token string");
    PropertiesService.getScriptProperties().setProperty('SIGNNOW_BASIC_TOKEN', token);
    console.log("✅ SIGNNOW_BASIC_TOKEN has been set.");
    return "Token Set Successfully";
}

/**
 * Sends a deployment alert to Slack with the new Web App URL
 * @param {string} newUrl - The new Web App URL
 */
function ADMIN_SendDeploymentAlert(newUrl) {
    if (!newUrl) throw new Error("Please provide the new Web App URL");

    // Check if SlackIntegration is loaded
    if (typeof sendSlackMessage !== 'function') {
        console.error("sendSlackMessage function not found. Ensure SlackIntegration.js is present.");
        return "Failed: SlackIntegration not found";
    }

    const blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🚀 New System Deployment",
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Shamrock Portal Backend Updated*"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": `*New Web App URL:*\n\`${newUrl}\``
                },
                {
                    "type": "mrkdwn",
                    "text": "*Action Required:*\nUpdate Wix Secrets Manager"
                }
            ]
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Deployed at: ${new Date().toLocaleString()}`
                }
            ]
        }
    ];

    return sendSlackMessage('#alerts', '🚀 New Deployment: ' + newUrl, blocks);
}
