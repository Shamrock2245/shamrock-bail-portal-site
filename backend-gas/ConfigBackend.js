/**
 * ============================================================================
 * ConfigBackend.gs
 * ============================================================================
 * Server-side handlers for the Configuration Modal.
 */

function openConfigModal() {
    const template = HtmlService.createTemplateFromFile('ConfigModal');
    template.appVersion = '7.0.0-AI-ROBUST'; // Hardcoded sync or fetch from global if possible, but matching Code.html
    const html = template.evaluate()
        .setWidth(600)
        .setHeight(800)
        .setTitle('⚙️ System Configuration');
    SpreadsheetApp.getUi().showModalDialog(html, '⚙️ System Configuration');
}

/**
 * Fetch current secrets (masked) for the UI.
 */
function getConfigForUI() {
    const props = PropertiesService.getScriptProperties();
    const keys = [
        'SLACK_WEBHOOK_NEW_CASES',
        'SLACK_WEBHOOK_COURT_DATES',
        'SLACK_WEBHOOK_FORFEITURES',
        'SLACK_WEBHOOK_DISCHARGES',
        'SLACK_WEBHOOK_GENERAL',
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER'
    ];

    const config = {};
    keys.forEach(k => {
        const val = props.getProperty(k);
        config[k] = val ? val : '';
    });

    return config;
}

// VALIDATION HELPERS
function isValidUrl_(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function isValidSlackWebhook_(url) {
    return url && url.startsWith('https://hooks.slack.com/services/');
}

function isValidPhone_(phone) {
    // Basic E.164 check (allows +1...) or local 10 digit
    return /^\+?[1-9]\d{1,14}$/.test(phone);
}

/**
 * Save secrets from the UI.
 */
function saveConfigFromUI(formObject) {
    const props = PropertiesService.getScriptProperties();
    let updated = 0;
    let errors = [];

    Object.keys(formObject).forEach(key => {
        let val = formObject[key];
        if (val && val.trim() !== '') {
            val = val.trim();

            // Validation Logic
            if (key.startsWith('SLACK_WEBHOOK_') && !isValidSlackWebhook_(val)) {
                errors.push(`${key}: Invalid Slack Webhook URL.`);
                return;
            }
            if (key === 'TWILIO_PHONE_NUMBER' && !isValidPhone_(val)) {
                errors.push(`${key}: Invalid Phone Number format (Use E.164 e.g. +1234567890).`);
                return;
            }

            props.setProperty(key, val);
            updated++;
        }
    });

    if (errors.length > 0) {
        return { success: false, error: "Validation Failed:\n" + errors.join("\n") };
    }

    return { success: true, message: `Updated ${updated} secrets successfully.` };
}
