/**
 * ============================================================================
 * Bulk_Update_Properties.js
 * ============================================================================
 * INSTRUCTIONS:
 * 1. Open this file in the Google Apps Script Editor.
 * 2. Paste your 50+ properties into the `PROPERTIES_TO_UPDATE` object below.
 * 3. Run the function `RUN_BulkUpdate()` from the editor toolbar.
 * 4. Check the Execution Log for results.
 * ============================================================================
 */

function RUN_BulkUpdate() {
    // --- PASTE YOUR PROPERTIES HERE ---
    const PROPERTIES_TO_UPDATE = {
        // Core Configuration
        "PORTAL_BASE_URL": "https://www.shamrockbailbonds.biz",
        "GAS_WEB_APP_URL": "", // Add your GAS Web App URL here

        // API Keys
        "OPENAI_API_KEY": "",
        "SLACK_WEBHOOK_URL": "",
        "SIGNNOW_API_TOKEN": "",
        "SIGNNOW_BASIC_TOKEN": "",
        "GOOGLE_MAPS_API_KEY": "",

        // Folder IDs
        "DRIVE_ROOT_FOLDER_ID": "",
        "COMPLETED_BONDS_FOLDER_ID": "",
        "INTAKE_FOLDER_ID": "",
        "PROCESSED_FOLDER_ID": "",

        // Twilio
        "TWILIO_ACCOUNT_SID": "",
        "TWILIO_AUTH_TOKEN": "",
        "TWILIO_PHONE_NUMBER": "",

        // Add all other 50+ properties here...
        // "ANOTHER_PROPERTY": "value",
    };

    // --- DO NOT EDIT BELOW THIS LINE ---

    const scriptProperties = PropertiesService.getScriptProperties();
    const currentProps = scriptProperties.getProperties();

    console.log("🚀 Starting Bulk Property Update...");

    let updatedCount = 0;

    for (const [key, value] of Object.entries(PROPERTIES_TO_UPDATE)) {
        if (value === "" || value === null || value === undefined) {
            console.warn(`⚠️ Skipping empty value for key: ${key}`);
            continue;
        }

        // Update property
        scriptProperties.setProperty(key, String(value));
        console.log(`✅ Set: ${key}`);
        updatedCount++;
    }

    console.log(`🎉 Finished! Updated ${updatedCount} properties.`);

    // Optional: List all current properties to verify
    // console.log("Current Properties:", scriptProperties.getProperties());
}
