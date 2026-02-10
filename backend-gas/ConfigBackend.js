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
        // Slack
        'SLACK_WEBHOOK_NEW_CASES',
        'SLACK_WEBHOOK_COURT_DATES',
        'SLACK_WEBHOOK_FORFEITURES',
        'SLACK_WEBHOOK_DISCHARGES',
        'SLACK_WEBHOOK_GENERAL',
        // Twilio
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
        // SignNow
        'SIGNNOW_PRODUCTION_TOKEN',
        'SIGNNOW_SANDBOX_TOKEN',
        'SIGNNOW_API_BASE_URL',
        // Deployment
        'GAS_WEB_APP_URL',
        'WIX_PORTAL_URL',
        // Scrapers
        'SCRAPER_ENABLED_LEE',
        'SCRAPER_ENABLED_COLLIER',
        'SCRAPER_ENABLED_ORANGE',
        'SCRAPER_ENABLED_OSCEOLA',
        'SCRAPER_ENABLED_POLK',
        'SCRAPER_ENABLED_PINELLAS',
        'SCRAPER_ENABLED_HILLSBOROUGH',
        'SCRAPER_ENABLED_SEMINOLE',
        'SCRAPER_ENABLED_MANATEE',
        'SCRAPER_ENABLED_PASCO',
        'SCRAPER_ENABLED_SARASOTA',
        'SCRAPER_ENABLED_DESOTO',
        'SCRAPER_ENABLED_CHARLOTTE',
        'SCRAPER_ENABLED_GLADES',
        'SCRAPER_ENABLED_HENDRY'
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
    if (!url) return true; // Allow empty
    return url.startsWith('https://hooks.slack.com/services/');
}

function isValidPhone_(phone) {
    if (!phone) return true; // Allow empty
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

    // Keys that must be valid URLs if present
    const urlKeys = ['SIGNNOW_API_BASE_URL', 'GAS_WEB_APP_URL', 'WIX_PORTAL_URL'];

    Object.keys(formObject).forEach(key => {
        let val = formObject[key];

        // Handle whitespace
        if (typeof val === 'string') {
            val = val.trim();
        }

        if (val !== null && val !== '') { // Only process non-empty
            // Validation Logic
            if (key.startsWith('SLACK_WEBHOOK_') && !isValidSlackWebhook_(val)) {
                errors.push(`${key}: Invalid Slack Webhook URL.`);
                return;
            }
            if (key === 'TWILIO_PHONE_NUMBER' && !isValidPhone_(val)) {
                errors.push(`${key}: Invalid Phone Number format.`);
                return;
            }
            if (urlKeys.includes(key) && !isValidUrl_(val)) {
                errors.push(`${key}: Invalid URL format.`);
                return;
            }

            props.setProperty(key, val);
            updated++;
        }
    });

    if (errors.length > 0) {
        return { success: false, error: "Validation Failed:\n" + errors.join("\n") };
    }

    return { success: true, message: `Updated ${updated} settings successfully.` };
}
