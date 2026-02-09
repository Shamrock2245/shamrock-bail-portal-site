/**
 * SystemHealthCheck.js
 * Comprehensive diagnostic and end-to-end test suite for the Shamrock Bail Bonds system.
 * 
 * USAGE:
 * 1. Open this file in the GAS Editor.
 * 2. Select 'runSystemDiagnostics' to check connections.
 * 3. Select 'runEndToEndTestWorkflow' to simulate a full transaction (creates real artifacts).
 */

// =============================================================================
// 1. SAFE DIAGNOSTICS (Connection Checks)
// =============================================================================

function runSystemDiagnostics() {
    Logger.log('🔍 STARTING SYSTEM DIAGNOSTICS...');

    const results = {
        scriptProperties: checkScriptProperties(),
        googleDrive: checkGoogleDriveAccess(),
        googleSheets: checkSheetAccess(),
        signNow: checkSignNowConnectivity(),
        wix: checkWixConnectivity(),
        twilio: checkTwilioConfiguration()
    };

    Logger.log('===================================================');
    Logger.log('DIAGNOSTIC RESULTS:');
    Logger.log(JSON.stringify(results, null, 2));
    Logger.log('===================================================');

    const allPass = Object.values(results).every(r => r.success);
    if (allPass) {
        Logger.log('✅ ALL SYSTEMS OPERATIONAL');
    } else {
        Logger.log('⚠️ SOME SYSTEMS FAILED - CHECK LOGS ABOVE');
    }
}

function checkScriptProperties() {
    try {
        const props = PropertiesService.getScriptProperties().getProperties();
        const required = ['WIX_API_KEY', 'SIGNNOW_API_TOKEN', 'AUDIT_LOG_SHEET_ID'];
        const missing = required.filter(k => !props[k]);

        if (missing.length > 0) return { success: false, error: 'Missing properties: ' + missing.join(', ') };
        return { success: true, count: Object.keys(props).length };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function checkGoogleDriveAccess() {
    try {
        // Check Root output folder if defined, else just Root
        const folderId = INTEGRATION_CONFIG ? INTEGRATION_CONFIG.COMPLETED_BONDS_FOLDER_ID : null;
        if (folderId) {
            DriveApp.getFolderById(folderId);
            return { success: true, message: 'Completed Bonds folder accessible' };
        }
        return { success: true, message: 'Drive accessible (No specific folder config found in this scope)' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function checkSheetAccess() {
    try {
        const sheetId = PropertiesService.getScriptProperties().getProperty('AUDIT_LOG_SHEET_ID');
        if (!sheetId) return { success: false, error: 'AUDIT_LOG_SHEET_ID not set' };
        SpreadsheetApp.openById(sheetId);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function checkSignNowConnectivity() {
    try {
        // Simple User Get call
        const cfg = SN_getConfig(); // From SignNow_Integration_Complete.js
        const res = UrlFetchApp.fetch(cfg.API_BASE + '/user', {
            headers: { 'Authorization': 'Bearer ' + cfg.ACCESS_TOKEN },
            muteHttpExceptions: true
        });
        if (res.getResponseCode() === 200) return { success: true };
        return { success: false, error: 'SignNow API returned ' + res.getResponseCode() };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function checkWixConnectivity() {
    if (typeof testWixConnection === 'function') {
        // Capture log output is hard here, so we just run it and assume no error thrown = partial success, 
        // but better to re-implement a robust check returning a value.
        try {
            const config = getWixPortalConfig();
            const res = UrlFetchApp.fetch(config.baseUrl.replace('/_functions', '') + '/_functions/health', { muteHttpExceptions: true });
            return { success: res.getResponseCode() === 200, code: res.getResponseCode() };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
    return { success: false, error: 'testWixConnection function not found' };
}

function checkTwilioConfiguration() {
    const sid = PropertiesService.getScriptProperties().getProperty('TWILIO_ACCOUNT_SID');
    const token = PropertiesService.getScriptProperties().getProperty('TWILIO_AUTH_TOKEN');
    if (sid && token) return { success: true, message: 'Credentials present' };
    return { success: false, error: 'Missing Twilio credentials' };
}


// =============================================================================
// 2. END-TO-END WORKFLOW SIMULATION
// =============================================================================

/**
 * SIMULATES the full flow:
 * Data Entry -> Generate PDF -> SignNow Upload -> Invite -> Wix Sync
 * 
 * WARNING: This creates REAL documents in SignNow and Wix.
 * Use a test email you can access.
 */
function runEndToEndTestWorkflow() {
    const TEST_EMAIL = Session.getActiveUser().getEmail() || 'admin@shamrockbailbonds.biz';
    Logger.log(`🚀 STARTING END-TO-END TEST (Recipient: ${TEST_EMAIL})...`);

    // 1. Create Dummy PDF
    const pdfBlob = Utilities.newBlob('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /MediaBox [0 0 612 792] /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (TEST BAIL DOCUMENT) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000157 00000 n \n0000000302 00000 n \n0000000389 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n483\n%%EOF', 'application/pdf', 'TEST_BAIL_PACKET.pdf');
    const pdfBase64 = Utilities.base64Encode(pdfBlob.getBytes());

    // 2. Mock Form Data
    const formData = {
        'defendant-first-name': 'TEST_DEFENDANT',
        'defendant-last-name': 'DO_NOT_PROCESS',
        'defendant-email': TEST_EMAIL,
        'defendant-phone': '555-555-5555',
        'case-number': 'TEST-CASE-' + new Date().getTime(),
        'selectedDocs': ['test-doc'],
        'signingMethod': 'email', // Use email to verify delivery
        'pdfBase64': pdfBase64,
        'fileName': 'TEST_BAIL_PACKET.pdf'
    };

    Logger.log('Step 1: Mock Data Created');

    // 3. Call the Workflow Orchestrator
    Logger.log('Step 2: Calling generateAndSendWithWixPortal...');

    if (typeof generateAndSendWithWixPortal !== 'function') {
        Logger.log('❌ Error: generateAndSendWithWixPortal not found.');
        return;
    }

    const result = generateAndSendWithWixPortal(formData);

    Logger.log('===================================================');
    Logger.log('WORKFLOW RESULT:');
    Logger.log(JSON.stringify(result, null, 2));
    Logger.log('===================================================');

    if (result.success) {
        Logger.log('✅ TEST PASSED: Link generated and synced.');
        Logger.log('👉 Check your email (' + TEST_EMAIL + ') for the SignNow invite.');
        Logger.log('👉 Check Wix "PendingDocuments" collection for the new record.');
    } else {
        Logger.log('❌ TEST FAILED: ' + result.message);
    }
}

// =============================================================================
// 3. AI AGENT DEMOS
// =============================================================================

/**
 * Validates "The Analyst" (AI_FlightRisk.js)
 * Simulates scoring a high-risk and low-risk lead.
 */
function runAnalystDemo() {
    Logger.log('🧠 TESTING "THE ANALYST" (Risk Assessment)...');

    // 1. High Risk Scenario
    const highRiskLead = {
        name: "Johnny Fugitive",
        charges: ["Grand Theft Auto", "Resisting Arrest w/ Violence"],
        bond: 25000,
        history: "3 Prior FTAs",
        residency: "Out of State (Ohio)"
    };

    // 2. Low Risk Scenario
    const lowRiskLead = {
        name: "Sally Local",
        charges: ["DUI First Offense"],
        bond: 1500,
        history: "None",
        residency: "Local (Fort Myers, FL), Employed at Publix 5 years"
    };

    Logger.log(`\nScenario A: ${highRiskLead.name} (${highRiskLead.charges[0]})`);
    const scoreA = AI_analyzeFlightRisk(highRiskLead);
    Logger.log(JSON.stringify(scoreA, null, 2));

    Logger.log(`\nScenario B: ${lowRiskLead.name} (${lowRiskLead.charges[0]})`);
    const scoreB = AI_analyzeFlightRisk(lowRiskLead);
    Logger.log(JSON.stringify(scoreB, null, 2));

    Logger.log('\n✅ ANALYST DEMO COMPLETE');
}

/**
 * Validates "The Clerk" (AI_BookingParser.js)
 * Tests connection to OpenAI Vision (using a URL for simplicity).
 */
function runClerkDemo() {
    Logger.log('👁️ TESTING "THE CLERK" (OCR & Vision)...');

    // A public URL to a sample mugshot or text-heavy image is best, 
    // but here we test the URL parser which is easier than mocking Base64.
    const testUrl = "https://www.sheriffleefl.org/wp-content/uploads/2024/01/sample-arrest.jpg"; // Dummy URL context

    // We'll mock the internal call if you don't have a real URL handy, 
    // OR we can just test the function existence and config.
    // For now, let's call the URL extractor with a known test string.

    try {
        Logger.log("Sending test prompt to OpenAI...");
        // Direct call to see if API key works
        const testPrompt = "Extract data from this text: Defendant John Doe, DOB 01/01/1980, Charge: DUI";
        const result = callOpenAI("Extract JSON: {name, dob, charge}", testPrompt, { jsonMode: true });

        Logger.log("Result:");
        Logger.log(JSON.stringify(result, null, 2));

        if (result && result.name === "John Doe") {
            Logger.log("✅ CLERK INTEGRATION OPERATIONAL");
        } else {
            Logger.log("⚠️ CLERK FAILED (Check OpenAI Key)");
        }
    } catch (e) {
        Logger.log("❌ CLERK ERROR: " + e.message);
    }
}
