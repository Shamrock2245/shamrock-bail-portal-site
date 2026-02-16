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
        // [CORE] Configuration
        "PORTAL_BASE_URL": "https://www.shamrockbailbonds.biz",
        "GAS_WEB_APP_URL": "", // Paste your latest Web App URL here

        // [API KEYS] - AI & Intelligence
        "OPENAI_API_KEY": "",
        "GROK_API_KEY": "", // PASTE KEY HERE (Do not commit)
        "ELEVENLABS_API_KEY": "", // PASTE KEY HERE (Do not commit)
        "MANUS_VOICE_ID": "21m00Tcm4TlvDq8ikWAM", // Default: Rachel (Change to Cloned Voice)
        "GOOGLE_MAPS_API_KEY": "",

        // [TWILIO] - SMS & WhatsApp
        "TWILIO_ACCOUNT_SID": "", // PASTE SID HERE
        "TWILIO_AUTH_TOKEN": "",  // PASTE TOKEN HERE
        "TWILIO_PHONE_NUMBER": "+17272952245",
        "TWILIO_WHATSAPP_NUMBER": "+12399550178",

        // [SLACK] - Notifications
        "SLACK_BOT_TOKEN": "",
        "SLACK_WEBHOOK_URL": "", // General Webhook
        "SLACK_WEBHOOK_NEW_CASES": "", // #new-cases
        "SLACK_WEBHOOK_INTAKE": "",    // #intake
        "SLACK_WEBHOOK_ALERTS": "",    // #alerts

        // [SIGNNOW] - eSignatures
        "SIGNNOW_API_BASE_URL": "https://api.signnow.com",
        "SIGNNOW_API_TOKEN": "",
        "SIGNNOW_BASIC_TOKEN": "",
        "SIGNNOW_CLIENT_ID": "",
        "SIGNNOW_CLIENT_SECRET": "",

        // [GOOGLE DRIVE] - Folder IDs
        "DRIVE_ROOT_FOLDER_ID": "1ZyTCodt67UAxEbFdGqE3VNua-9TlblR3", // Shamrock Root
        "GOOGLE_DRIVE_FOLDER_ID": "", // Templates Folder (Legacy Name)
        "COMPLETED_BONDS_FOLDER_ID": "1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs",
        "INTAKE_FOLDER_ID": "",
        "PROCESSED_FOLDER_ID": "",
        "GOOGLE_DRIVE_OUTPUT_FOLDER_ID": "", // Public Audio/Media Output

        // [SHEETS] - Database
        "TARGET_SPREADSHEET_ID": "121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E"
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
