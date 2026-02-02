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
        'GAS_API_KEY': 'shamrock-secure-2026', // Shared secret with Wix
        'MCP_API_KEY': 'shamrock-mcp-secret',  // Shared secret with Cursor/Context

        // --- URLS ---
        'WIX_SITE_URL': 'https://www.shamrockbailbonds.biz',
        'WEBHOOK_URL': 'https://hooks.slack.com/services/T08N11G5WJC/B08MY450U8N/...', // Needs full webhook if known, otherwise keep placeholder or use Bot Token

        // --- SLACK WEBHOOKS ---
        'SLACK_BOT_TOKEN': '[REDACTED]',

        // --- SIGNNOW INTEGRATION ---
        'SIGNNOW_API_BASE_URL': 'https://api.signnow.com',
        'SIGNNOW_API_TOKEN': '0c35edbbf6823555a8434624aaec4830fd4477bb5befee3da2fa29e2b258913d', // Using API Key as Token
        'SIGNNOW_FOLDER_ID': '79a05a382b38460b95a78d94a6d79a5ad55e89e6',
        'SIGNNOW_TEMPLATE_ID': 'REPLACE_WITH_TEMPLATE_ID',

        // --- TWILIO INTEGRATION ---
        'TWILIO_ACCOUNT_SID': '[REDACTED]',
        'TWILIO_AUTH_TOKEN': '26d7f55f69f8d55ee4579c80d4f40f0d',
        'TWILIO_PHONE_NUMBER': '+17272952245',
        'TWILIO_VERIFY_SERVICE_SID': '',

        // --- GOOGLE DRIVE & SHEETS ---
        'GOOGLE_DRIVE_FOLDER_ID': '1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3', // "Shamrock Bail Bonds" Root
        'GOOGLE_DRIVE_OUTPUT_FOLDER_ID': '1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs', // "Signed Documents"
        'AUDIT_LOG_SHEET_ID': 'REPLACE_WITH_SHEET_ID', // If using separate sheet
        'TARGET_SPREADSHEET_ID': '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E', // Main Data Sheet

        // --- AI & EXTERNAL ---
        'GEMINI_API_KEY': 'REPLACE_WITH_GEMINI_KEY',
        'FORM_URL': '', // If using external form
        'FORM_PREFILL_DATA': '',

        // --- BAIL SCHOOL ---
        'CERTIFICATE_TEMPLATE_ID': '', // Google Doc Template ID for Certificates

        // --- SYSTEM STATE ---
        'CURRENT_RECEIPT_NUMBER': '202500', // Auto-increments
        'LAST_INTAKE_POLL': new Date().toISOString()
    };

    // -------------------------------------------------------------------------
    // 2. APPLY UPDATES
    // -------------------------------------------------------------------------
    // Note: setProperties(config, false) MERGES with existing. 
    // setProperties(config, true) DELETES all others first.
    // We use FALSE (Merge) to be safe, but you can switch to TRUE to clean house.

    // -------------------------------------------------------------------------
    // 2. APPLY UPDATES (SMART MERGE)
    // -------------------------------------------------------------------------
    const currentProps = props.getProperties();
    const updates = {};
    let skippedCount = 0;

    for (const key in config) {
        const newValue = config[key];

        // SAFETY CHECK: Don't overwrite existing good data with placeholders
        // Also skip 'shamrock-bail-bonds.slack.com' as it's not a valid webhook
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
