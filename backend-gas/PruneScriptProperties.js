/**
 * ADMIN UTILITY: PRUNE & AUDIT SCRIPT PROPERTIES
 * 
 * Run these functions from the Apps Script Editor to clean up your project settings.
 */

/**
 * 1. AUDIT: List all current Script Properties (Masked for safety)
 */
function AUDIT_ListAllProperties() {
    const props = PropertiesService.getScriptProperties().getProperties();
    const keys = Object.keys(props).sort();

    console.log('='.repeat(60));
    console.log(`🔍 CURRENT SCRIPT PROPERTIES (${keys.length} Total)`);
    console.log('='.repeat(60));

    keys.forEach(key => {
        let val = props[key];
        // Mask sensitive values
        if (key.match(/KEY|TOKEN|SID|SECRET|WEBHOOK|PASSWORD/i)) {
            if (val.length > 10) {
                val = val.substring(0, 5) + '...******' + val.substring(val.length - 3);
            } else {
                val = '******';
            }
        }
        console.log(`${key}: ${val}`);
    });
    console.log('='.repeat(60));
}

/**
 * 2. PRUNE: Remove obsolete or placeholder properties
 *    - Deletes 'MCP_API_KEY' if it's the placeholder
 *    - Deletes 'TWILIO_...' if they are placeholders
 *    - Deletes 'WEBHOOK_URL' if it erroneously points to Slack
 */
function ADMIN_PruneObsoleteProperties() {
    const props = PropertiesService.getScriptProperties();
    const all = props.getProperties();
    let deletedCount = 0;

    console.log('='.repeat(60));
    console.log('🧹 PRUNING OBSOLETE PROPERTIES');
    console.log('='.repeat(60));

    // A. Define keys/values to target
    const keysToDelete = [
        // 'MCP_API_KEY',           // KEEP: Used in MCPServer.js for Manus auth
        'TWILIO_VERIFY_SERVICE_SID' // Unused (NotificationService.gs uses SID/AuthToken/Phone)
    ];

    // B. Check specific values (Placeholders)
    const placeholderPatterns = [
        'REPLACE_WITH',
        'shamrock_placeholder'
    ];

    Object.keys(all).forEach(key => {
        const val = all[key];
        let shouldDelete = false;
        let reason = '';

        // Check specific keys
        if (keysToDelete.includes(key)) {
            shouldDelete = true;
            reason = 'Key is marked obsolete';
        }

        // Check for placeholders (Prevent deleting if value was actually set to something real)
        if (!shouldDelete && placeholderPatterns.some(p => val.includes(p))) {
            shouldDelete = true;
            reason = 'Value is a placeholder';
        }

        // Check for bad Webhook (SignNow webhook pointing to Slack)
        if (key === 'WEBHOOK_URL' && val.includes('slack.com')) {
            shouldDelete = true;
            reason = 'Invalid Webhook (Points to Slack instead of Script URL)';
        }

        // Execute Delete
        if (shouldDelete) {
            props.deleteProperty(key);
            console.log(`❌ DELETED: ${key}`);
            console.log(`   Reason: ${reason}`);
            deletedCount++;
        }
    });

    if (deletedCount === 0) {
        console.log('✨ No obsolete properties found to delete.');
    } else {
        console.log(`✅ Deleted ${deletedCount} properties.`);
    }
}

/**
 * 3. VERIFY: Check Critical Integrations
 */
function VERIFY_Integrations() {
    const props = PropertiesService.getScriptProperties().getProperties();
    const errors = [];
    const warnings = [];

    console.log('='.repeat(60));
    console.log('✅ VERIFYING CRITICAL INTEGRATIONS');
    console.log('='.repeat(60));

    // SLACK
    if (!props['SLACK_BOT_TOKEN'] || !props['SLACK_BOT_TOKEN'].startsWith('xoxb-')) {
        errors.push('SLACK_BOT_TOKEN is missing or invalid format (should start with xoxb-)');
    } else {
        console.log('✅ Slack Bot Token: Present');
    }

    // SIGNNOW
    if (!props['SIGNNOW_API_TOKEN']) {
        errors.push('SIGNNOW_API_TOKEN is missing');
    } else {
        console.log('✅ SignNow API Token: Present');
    }

    // WIX KEY
    if (!props['WIX_API_KEY']) {
        errors.push('WIX_API_KEY is missing');
    } else {
        console.log('✅ Wix API Key: Present');
    }

    // FORM PREFILL (Just informational)
    if (props['FORM_PREFILL_DATA']) {
        console.log('ℹ️ FORM_PREFILL_DATA is currently set (Temporary Data present)');
    }

    // REPORT
    if (errors.length > 0) {
        console.error('❌ ISSUES FOUND:');
        errors.forEach(e => console.error(`   - ${e}`));
    } else {
        console.log('🎉 All critical integration keys are present.');
    }
}
