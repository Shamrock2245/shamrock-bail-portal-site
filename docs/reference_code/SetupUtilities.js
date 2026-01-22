/**
 * SetupUtilities.gs
 * Version: 3.5.0 (Aligned with Code.gs & WixPortalIntegration.gs)
 * 
 * Utility functions for setting up and validating the Shamrock Bail Bonds integration.
 * Run `runSystemDiagnostics()` to verify your environment is correctly configured.
 */

// =============================================================================
// 1. SYSTEM DIAGNOSTICS (Start Here)
// =============================================================================

/**
 * Runs a full health check on the system configuration and connections.
 * Verifies Script Properties, Google Drive access, SignNow API, and Wix API.
 */
function runSystemDiagnostics() {
    const ui = console; // Use console for logging
    ui.log('='.repeat(60));
    ui.log('🔍 SHAMROCK BAIL BONDS - SYSTEM DIAGNOSTICS (v3.5.1)');
    ui.log('⏱️ Time: ' + new Date().toISOString());
    ui.log('='.repeat(60));

    const props = PropertiesService.getScriptProperties().getProperties();
    let errors = [];
    let warnings = [];

    // --- CHECK 1: REQUIRED SCRIPT PROPERTIES ---
    ui.log('\n[1/4] Checking Configuration Keys...');
    const requiredKeys = [
        'SIGNNOW_API_TOKEN',            // Used in Code.gs
        'WIX_API_KEY',                  // Used in WixPortalIntegration.gs
        'WEBHOOK_URL',                  // Used for SignNow callbacks
        'GOOGLE_DRIVE_FOLDER_ID',       // Templates source
        'GOOGLE_DRIVE_OUTPUT_FOLDER_ID' // Completed PDF destination
    ];

    requiredKeys.forEach(key => {
        if (!props[key]) {
            ui.error(`❌ MISSING: ${key}`);
            errors.push(`Missing Property: ${key}`);
        } else {
            ui.log(`✅ Found: ${key}`);
        }
    });

    // --- CHECK 2: GOOGLE DRIVE ACCESS ---
    ui.log('\n[2/4] Verifying Google Drive Access...');

    // Check Output Folder
    const outputId = props['GOOGLE_DRIVE_OUTPUT_FOLDER_ID'];
    if (outputId) {
        try {
            const folder = DriveApp.getFolderById(outputId);
            ui.log(`✅ Output Folder Accessible: "${folder.getName()}"`);
        } catch (e) {
            ui.error(`❌ Output Folder Error: ${e.message}`);
            errors.push(`Invalid Output Folder ID: ${outputId}`);
        }
    }

    // Check Template Folder
    const templateId = props['GOOGLE_DRIVE_FOLDER_ID'];
    if (templateId) {
        try {
            const folder = DriveApp.getFolderById(templateId);
            ui.log(`✅ Template Folder Accessible: "${folder.getName()}"`);
        } catch (e) {
            ui.error(`❌ Template Folder Error: ${e.message}`);
            errors.push(`Invalid Template Folder ID: ${templateId}`);
        }
    }

    // --- CHECK 3: SIGNNOW CONNECTIVITY ---
    ui.log('\n[3/4] Testing SignNow API...');
    const snToken = props['SIGNNOW_API_TOKEN'];
    if (snToken) {
        const snStatus = testSignNowConnection(snToken);
        if (!snStatus) errors.push('SignNow API Verification Failed');
    } else {
        ui.warn('⚠️ Skipping SignNow test (No Token)');
    }

    // --- CHECK 4: WIX PORTAL CONNECTIVITY ---
    ui.log('\n[4/4] Testing Wix Portal API...');
    const wixKey = props['WIX_API_KEY'];
    if (wixKey) {
        const wixStatus = testWixHealth(wixKey);
        if (!wixStatus) warnings.push('Wix Portal Health Check Failed (Ensure site is published)');
    } else {
        ui.warn('⚠️ Skipping Wix test (No Key)');
    }

    // --- REPORT ---
    ui.log('\n' + '='.repeat(60));
    if (errors.length > 0) {
        ui.error(`❌ DIAGNOSTICS FAILED with ${errors.length} errors:`);
        errors.forEach(e => ui.error(`  - ${e}`));
        ui.log('\nACTION REQUIRED: Run setupScriptProperties() to fix missing keys.');
    } else if (warnings.length > 0) {
        ui.warn(`⚠️ PASSED WITH WARNINGS:`);
        warnings.forEach(w => ui.warn(`  - ${w}`));
    } else {
        ui.log('✅ ALL SYSTEMS OPERATIONAL');
    }
    ui.log('='.repeat(60));
}

// =============================================================================
// 2. SETUP & CONFIGURATION HELPERS
// =============================================================================

/**
 * Sets up default properties and validates existing ones.
 * Aligns strictly with Code.gs and WixPortalIntegration.gs expectations.
 */
function setupScriptProperties() {
    const props = PropertiesService.getScriptProperties();
    const existing = props.getProperties();

    console.log('📝 Configuring Script Properties...');

    // 1. Set Defaults for commonly constant values if missing
    const defaults = {
        'SIGNNOW_API_BASE_URL': 'https://api.signnow.com',
        'CURRENT_RECEIPT_NUMBER': '202500' // Start of 2025 sequence
    };

    Object.entries(defaults).forEach(([key, val]) => {
        if (!existing[key]) {
            props.setProperty(key, val);
            console.log(`➕ Set Default: ${key} = ${val}`);
        }
    });

    // 2. Check for Output Folder (Auto-create if missing logic could go here, but safer to ask)
    if (!existing['GOOGLE_DRIVE_OUTPUT_FOLDER_ID']) {
        console.log('⚠️ GOOGLE_DRIVE_OUTPUT_FOLDER_ID is missing.');
        console.log('   Run `getOrCreateOutputFolder()` to generate it.');
    }

    // 3. Generate Wix Key if missing
    if (!existing['WIX_API_KEY']) {
        console.log('⚠️ WIX_API_KEY is missing.');
        console.log('   Run `generateMyWixApiKey()` to create one.');
    }

    // 4. Check for Webhook URL
    if (!existing['WEBHOOK_URL']) {
        console.log('⚠️ WEBHOOK_URL is missing. SignNow events won\'t reach this script.');
        console.log('   Run `setWebhookUrl("YOUR_DEPLOYED_WEB_APP_URL")` to fix.');
    }

    console.log('✅ Configuration Update Complete. Run `runSystemDiagnostics()` to verify.');
}

/**
 * Save the deployed Web App URL for webhook callbacks
 */
function setWebhookUrl(url) {
    if (!url || !url.includes('script.google.com')) {
        throw new Error('Invalid Google Apps Script Web App URL');
    }
    PropertiesService.getScriptProperties().setProperty('WEBHOOK_URL', url);
    console.log('✅ Webhook URL saved: ' + url);
}

/**
 * Creates or retrieves the 'Shamrock Completed Bonds' folder and saves ID.
 */
function getOrCreateOutputFolder() {
    const folderName = 'Shamrock Completed Bonds';
    const props = PropertiesService.getScriptProperties();

    // Check if we already have it configured
    const existingId = props.getProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID');
    if (existingId) {
        try {
            const f = DriveApp.getFolderById(existingId);
            console.log(`✅ Folder already configured: "${f.getName()}" (ID: ${existingId})`);
            return existingId;
        } catch (e) {
            console.log('⚠️ Configured folder ID is invalid. Searching/Creating new one...');
        }
    }

    // Search existing
    const folders = DriveApp.getFoldersByName(folderName);
    let folder;
    if (folders.hasNext()) {
        folder = folders.next();
        console.log(`✅ Found existing folder: "${folderName}"`);
    } else {
        folder = DriveApp.createFolder(folderName);
        console.log(`mjb Created new folder: "${folderName}"`);
    }

    props.setProperty('GOOGLE_DRIVE_OUTPUT_FOLDER_ID', folder.getId());
    console.log(`💾 Saved Property: GOOGLE_DRIVE_OUTPUT_FOLDER_ID = ${folder.getId()}`);
    return folder.getId();
}

/**
 * Generates a secure random key for Wix Integration.
 * Use this key in Wix Secrets Manager as well.
 */
function generateMyWixApiKey() {
    const key = Utilities.getUuid(); // Simple UUID is sufficient for this purpose
    const props = PropertiesService.getScriptProperties();

    props.setProperty('WIX_API_KEY', key);

    console.log('🔑 WIX API KEY GENERATED & SAVED LOCALLY');
    console.log('------------------------------------------------');
    console.log(`Key: ${key}`);
    console.log('------------------------------------------------');
    console.log('👉 ACTION REQUIRED:');
    console.log('1. Go to your Wix Dashboard > Settings > Secrets Manager');
    console.log('2. Create a new Secret named "GAS_API_KEY" (or logic updates)');
    console.log('3. Paste this key value.');

    return key;
}

// =============================================================================
// 3. CONNECTIVITY TESTERS (Private helpers)
// =============================================================================

function testSignNowConnection(token) {
    try {
        const response = UrlFetchApp.fetch('https://api.signnow.com/user', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
            const user = JSON.parse(response.getContentText());
            console.log(`✅ SignNow Connected: ${user.email} (ID: ${user.id})`);
            return true;
        } else {
            console.error(`❌ SignNow Error ${response.getResponseCode()}: ${response.getContentText()}`);
            return false;
        }
    } catch (e) {
        console.error(`❌ SignNow Exception: ${e.message}`);
        return false;
    }
}

function testWixHealth(apiKey) {
    // Try to hit the health endpoint
    // Note: Adjust URL if using a different site/environment
    const baseUrl = 'https://www.shamrockbailbonds.biz/_functions';

    try {
        const response = UrlFetchApp.fetch(`${baseUrl}/health`, {
            method: 'GET',
            headers: { 'X-API-Key': apiKey }, // Passing key just in case, though health might be public
            muteHttpExceptions: true
        });

        const code = response.getResponseCode();
        if (code === 200) {
            console.log(`✅ Wix Portal Healthy: ${response.getContentText()}`);
            return true;
        } else {
            console.warn(`⚠️ Wix Health Check returned ${code} (This might be normal if /health isn't exposed yet)`);
            return false;
        }
    } catch (e) {
        console.warn(`⚠️ Wix Unavailable: ${e.message}`);
        return false;
    }
}
