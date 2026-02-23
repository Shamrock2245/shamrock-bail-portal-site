/**
 * ============================================================================
 * Setup_Properties.js (MASTER)
 * ============================================================================
 * Unified configuration script for Shamrock Bail Bonds Backend.
 * Replaces all previous setup scripts (Bulk_Update, SetProperties, SetupConfig).
 * 
 * INSTRUCTIONS:
 * 1. Open this file in the Google Apps Script Editor.
 * 2. Fill in the `MASTER_CONFIG` object below with your actual values.
 * 3. Run `RUN_UpdateAllProperties()` from the editor toolbar.
 * 4. Run `AUDIT_CurrentProperties()` to verify.
 * ============================================================================
 */

function RUN_UpdateAllProperties() {
    // --- MASTER CONFIGURATION OBJECT ---
    const MASTER_CONFIG = {
        "TEMPLATE_SURETY_TERMS": "1VfmyUTpchfwJTlENlR72JxmoE_NCF-uf",
        "GITHUB_PAT": "REPLACE_WITH_GITHUB_PAT",
        "TWILIO_PHONE_NUMBER": "+17272952245",
        "SIGNNOW_API_BASE_URL": "https://api.signnow.com",
        "TEMPLATE_MASTER_WAIVER": "181mgKQN-VxvQOyzDquFs8cFHUN0tjrMs",
        "SLACK_BOT_TOKEN": "REPLACE_WITH_SLACK_BOT_TOKEN",
        "TARGET_SPREADSHEET_ID": "121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E",
        "SIGNNOW_CLIENT_ID": "REPLACE_WITH_SIGNNOW_CLIENT_ID",
        "DRIVE_ROOT_FOLDER_ID": "1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3",
        "SIGNNOW_TEMPLATE_DEFENDANT_APP": "5ca8b3a3dbc748aa8e33201fcbe87f985850573f",
        "SIGNNOW_TEMPLATE_FAQ_COSIGNER": "37725f4033cc4316a154a7edc2e0600da71f8938",
        "LAST_INTAKE_POLL": "2026-02-07T20:30:38.096Z",
        "CLIENT_ID": "REPLACE_WITH_GOOGLE_CLIENT_ID",
        "MCP_API_KEY": "REPLACE_WITH_MCP_API_KEY",
        "SIGNNOW_WEBHOOK_SECRET": "REPLACE_WITH_SIGNNOW_WEBHOOK_SECRET",
        "ELEVENLABS_API_KEY": "REPLACE_WITH_ELEVENLABS_API_KEY",
        "SLACK_WEBHOOK_NEW_CASES": "REPLACE_WITH_SLACK_WEBHOOK_NEW_CASES",
        "AUDIT_LOG_SHEET_ID": "1Do1biI-DZEcDyQGUbFzxg2VqolF_DCO1Q4K1GojkqG8",
        "SIGNNOW_ACCESS_TOKEN": "REPLACE_WITH_SIGNNOW_ACCESS_TOKEN",
        "SIGNNOW_OAUTH_CLIENT_ID": "REPLACE_WITH_SIGNNOW_OAUTH_CLIENT_ID",
        "GOOGLE_DRIVE_FOLDER_ID": "1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3",
        "SLACK_WEBHOOK_COURT_DATES": "REPLACE_WITH_SLACK_WEBHOOK_COURT_DATES",
        "CLIENT_SECRET": "REPLACE_WITH_GOOGLE_CLIENT_SECRET",
        "SIGNNOW_API_TOKEN": "REPLACE_WITH_SIGNNOW_API_TOKEN",
        "MANUS_VOICE_ID": "21m00Tcm4TlvDq8ikWAM",
        "TEMPLATE_SSA_RELEASE": "1govKv_N1wl0FIePV8Xfa8mFmZ9JT8mNu",
        "SIGNNOW_OAUTH_CLIENT_SECRET": "REPLACE_WITH_SIGNNOW_OAUTH_CLIENT_SECRET",
        "SIGNNOW_SENDER_EMAIL": "admin@shamrockbailbonds.biz",
        "CONCIERGE_LAST_ROW": "145470",
        "CURRENT_RECEIPT_NUMBER": "202500",
        "REDIRECT_URL": "https://www.shamrockbailbonds.biz",
        "TEMPLATE_FAQ_DEFENDANTS": "16j9Z8eTii-J_p4o6A2LrzgzptGB8aOhR",
        "SLACK_WEBHOOK_GENERAL": "REPLACE_WITH_SLACK_WEBHOOK_GENERAL",
        "GROK_API_KEY": "REPLACE_WITH_GROK_API_KEY",
        "SIGNNOW_CLIENT_SECRET": "REPLACE_WITH_SIGNNOW_CLIENT_SECRET",
        "SIGNNOW_TEMPLATE_FAQ_DEFENDANT": "41ea80f5087f4bbca274f545b6e270748182e013",
        "GOOGLE_DRIVE_OUTPUT_FOLDER_ID": "1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs",
        "SLACK_WEBHOOK_FORFEITURES": "REPLACE_WITH_SLACK_WEBHOOK_FORFEITURES",
        "OPENAI_API_KEY": "REPLACE_WITH_OPENAI_API_KEY",
        "TWILIO_WHATSAPP_NUMBER": "+12399550178",
        "SIGNNOW_BASIC_TOKEN": "REPLACE_WITH_SIGNNOW_BASIC_TOKEN",
        "COMPLETED_BONDS_FOLDER_ID": "1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs",
        "SLACK_APP_ID": "REPLACE_WITH_SLACK_APP_ID",
        "SLACK_CLIENT_ID": "REPLACE_WITH_SLACK_CLIENT_ID",
        "SIGNNOW_TEMPLATE_PAYMENT_PLAN": "ea13db9ec6e7462d963682e6b53f5ca0e46c892f",
        "GEMINI_API_KEY": "REPLACE_WITH_GEMINI_API_KEY",
        "TEMPLATE_PROMISSORY_NOTE": "104-ArZiCm3cgfQcT5rIO0x_OWiaw6Ddt",
        "SIGNNOW_PASSWORD": "REPLACE_WITH_SIGNNOW_PASSWORD",
        "GAS_API_KEY": "REPLACE_WITH_GAS_API_KEY",
        "CONSENT_LOG_SHEET_ID": "1Do1biI-DZEcDyQGUbFzxg2VqolF_DCO1Q4K1GojkqG8",
        "COLLIER_DEDUPE_SET_V2": "[\"booking:Booking Date\",\"row:vEIRkjA8j4QG9tqjwPJXroNVot7bEnR0PRuufBJguuw=\"]",
        "TEMPLATE_PAYMENT_PLAN": "1v-qkaegm6MDymiaPK45JqfXXX2_KOj8A",
        "SIGNNOW_BASIC_AUTH_TOKEN": "REPLACE_WITH_SIGNNOW_BASIC_AUTH_TOKEN",
        "SLACK_WORKSPACE_URL": "https://shamrock-bail-bonds.slack.com",
        "TEMPLATE_PAPERWORK_HEADER": "15sTaIIwhzHk96I8X3rxz7GtLMU-F5zo1",
        "TEMPLATE_INDEMNITY_AGREEMENT": "1p4bYIiZ__JnJHhlmVwLyPJZpsmSdGq12",
        "WIX_API_KEY": "REPLACE_WITH_WIX_API_KEY",
        "QUEUE_STORE_SSN": "false",
        "TWILIO_AUTH_TOKEN": "REPLACE_WITH_TWILIO_AUTH_TOKEN",
        "QUEUE_STORE_DL": "false",
        "SIGNNOW_TEMPLATE_COLLATERAL": "903275f447284cce83e973253f2760c334eb3768",
        "SIGNNOW_TEMPLATE_DISCLOSURE": "08f56f268b2c4b45a1de434b278c840936d09ad9",
        "SIGNNOW_TEMPLATE_MASTER_WAIVER": "cc7e8c7bd0c343088ecb55b965baee881dfd1950",
        "PORTAL_BASE_URL": "https://www.shamrockbailbonds.biz",
        "TWILIO_ACCOUNT_SID": "REPLACE_WITH_TWILIO_ACCOUNT_SID",
        "SLACK_WEBHOOK_DISCHARGES": "REPLACE_WITH_SLACK_WEBHOOK_DISCHARGES",
        "SLACK_WEBHOOK_LEADS": "REPLACE_WITH_SLACK_WEBHOOK_LEADS",
        "SLACK_WEBHOOK_SIGNING_ERRORS": "REPLACE_WITH_SLACK_WEBHOOK_SIGNING_ERRORS",
        "SLACK_WEBHOOK_INTAKE": "REPLACE_WITH_SLACK_WEBHOOK_INTAKE",
        "SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY": "REPLACE_WITH_SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY",
        "SLACK_WEBHOOK_SHAMROCK": "REPLACE_WITH_SLACK_WEBHOOK_SHAMROCK",
        "SLACK_WEBHOOK_DRIVE": "REPLACE_WITH_SLACK_WEBHOOK_DRIVE",
        "SLACK_WEBHOOK_CALENDAR": "REPLACE_WITH_SLACK_WEBHOOK_CALENDAR",
        "SIGNNOW_USERNAME": "admin@shamrockbailbonds.biz",
        "SLACK_ACCESS_TOKEN": "REPLACE_WITH_SLACK_ACCESS_TOKEN",
        "SIGNNOW_FOLDER_ID": "79a05a382b38460b95a78d94a6d79a5ad55e89e6",
        "FORM_PREFILL_DATA": "{\"defendantFullName\":\"JONES, JOHN MOSES\",\"source\":\"Lee\"}",
        "WIX_SITE_URL": "https://www.shamrockbailbonds.biz",
        "SIGNNOW_API_KEY": "REPLACE_WITH_SIGNNOW_API_KEY",
        "COLLIER_LAST_RUN_ISO_V2": "2026-01-01T23:43:16.247Z",
        "SIGNNOW_TEMPLATE_INDEMNITY": "2c16525316f143338db14b4ef578aabe67bd47d8",
        "SLACK_REFRESH_TOKEN": "REPLACE_WITH_SLACK_REFRESH_TOKEN",
        "GOOGLE_MAPS_API_KEY": "REPLACE_WITH_GOOGLE_MAPS_API_KEY",
        "TELEGRAM_BOT_TOKEN": "8595177993:AAEzOf0divQztt7zGqg0ac-S5QibJuNKdkA",
        "TELEGRAM_CHANNEL_ID": "@shamrockbroadcasterbot",
        "X_API_KEY": "ba7MR5sX2cnhXLelGlocvoGNt",
        "X_API_SECRET": "JlfJipIVebeTO0LOVfmhkPJKESBZ5GxIQHaYf3RpbOpQ0yqugs",
        "X_BEARER_TOKEN": "AAAAAAAAAAAAAAAAAAAAALIf7wEAAAAAm50TynUU2pzKKIaaruysrwZh5F0%3DprcbY9YwHTKq1gHSYnvanT9AavOHd9xcz73rScBhckXpmSOG5B",
        "X_ACCESS_TOKEN": "2017992003821117442-IWQwciyh7BHqjvvpogiKw3LApfQPyI",
        "X_ACCESS_SECRET": "0dpUGXlKd4UzvkGdS0IelhlRZKl0GufBe3GTRqhz3AZKt",
        "X_OAUTH2_CLIENT_SECRET": "wuX4nYpAoRT3XBxeLp0QRi1yOPJqaz2w0iHAgbp-2FvBGVycOX",
        "META_PAGE_ACCESS_TOKEN": "REPLACE_WITH_META_PAGE_ACCESS_TOKEN",
        "INSTAGRAM_ACCOUNT_ID": "REPLACE_WITH_INSTAGRAM_ACCOUNT_ID",
        "LINKEDIN_ACCESS_TOKEN": "REPLACE_WITH_LINKEDIN_ACCESS_TOKEN",
        "LINKEDIN_ORGANIZATION_ID": "REPLACE_WITH_LINKEDIN_ORGANIZATION_ID"
    };

    // --- EXECUTION LOGIC ---
    const scriptProperties = PropertiesService.getScriptProperties();
    let updatedCount = 0;
    let skippedCount = 0;

    console.log("🚀 Starting Master Property Update...");

    for (const [key, value] of Object.entries(MASTER_CONFIG)) {
        // Skip empty or placeholder values
        if (!value || value === "" || String(value).includes("REPLACE_WITH")) {
            console.warn(`⚠️ Skipping ${key}: Empty or Placeholder.`);
            skippedCount++;
            continue;
        }

        scriptProperties.setProperty(key, String(value));
        console.log(`✅ Set: ${key}`);
        updatedCount++;
    }

    console.log(`🎉 Finished! Updated ${updatedCount} properties. Skipped ${skippedCount}.`);
}

/**
 * UTILITY: Audit current properties
 * Prints a masked list of all currently set properties.
 */
function AUDIT_CurrentProperties() {
    const props = PropertiesService.getScriptProperties().getProperties();
    const keys = Object.keys(props).sort();

    console.log(`🔍 Found ${keys.length} Script Properties:`);
    console.log('------------------------------------------------');

    keys.forEach(key => {
        let val = props[key];
        // Mask long secrets
        if (val.length > 10 && !val.startsWith('http')) {
            val = val.substring(0, 4) + '...******';
        }
        console.log(`• ${key}: ${val}`);
    });
    console.log('------------------------------------------------');
}
