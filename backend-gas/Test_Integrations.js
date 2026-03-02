/**
 * Test_Integrations.js
 * 
 * Safe test scripts for verifying external API integrations.
 */

function testGrokAPI() {
    try {
        Logger.log("Testing Grok API...");
        var client = new GrokClient();

        // Fetch and log available models to diagnose the "Model not found" error
        var models = client.fetchAvailableModels();
        Logger.log("Available Grok Models: " + JSON.stringify(models, null, 2));

        var response = callGrok(
            "You are a helpful assistant.",
            "Hello Grok, are you receiving this message? Please reply with a short confirmation."
        );
        Logger.log("Grok Response: " + response);
    } catch (e) {
        Logger.log("Grok API Error: " + e.message);
    }
}

/**
 * Smoke test for Pexels public media search.
 * Run from GAS IDE → select testPexelsAPI → Run
 * Checks: PEXELS_API_KEY exists, API responds, results returned.
 */
function testPexelsAPI() {
    Logger.log("═══ PEXELS API SMOKE TEST ═══");
    try {
        // 1. Check if key is configured
        var key = PropertiesService.getScriptProperties().getProperty('PEXELS_API_KEY');
        Logger.log("  PEXELS_API_KEY: " + (key ? "✅ SET (" + key.substring(0, 8) + "...)" : "❌ NOT SET"));
        if (!key) { Logger.log("  ⛔ Cannot proceed without API key."); return; }

        // 2. Call the actual function
        var result = client_searchPublicMedia("courthouse", 5);
        Logger.log("  Success: " + result.success);
        Logger.log("  Total available: " + (result.total || 'N/A'));
        Logger.log("  Results returned: " + (result.results ? result.results.length : 0));

        if (result.results && result.results.length > 0) {
            var first = result.results[0];
            Logger.log("  First image:");
            Logger.log("    Title: " + first.title);
            Logger.log("    Photographer: " + first.photographer);
            Logger.log("    URL: " + first.url);
            Logger.log("    Source: " + first.source);
        }

        if (result.error) {
            Logger.log("  ❌ Error: " + result.error);
        }
    } catch (e) {
        Logger.log("  ❌ Exception: " + e.message);
    }
    Logger.log("═══ TEST COMPLETE ═══");
}

function testTwitterAPI() {
    try {
        Logger.log("Testing Twitter API...");
        var result = SocialPublisher.publishPost("twitter", "Automated test from Shamrock Bail Bonds system. " + new Date().toISOString());
        Logger.log("Twitter Response: " + JSON.stringify(result));
    } catch (e) {
        Logger.log("Twitter API Error: " + e.message);
    }
}

/**
 * Smoke test for LinkedIn Posts API integration.
 * Step 1: Validates credentials exist.
 * Step 2: Checks LinkedIn API connectivity via credential status.
 * Step 3 (OPTIONAL): Posts a test message — uncomment to run live.
 */
function testLinkedInAPI() {
    Logger.log("═══ LINKEDIN API TEST (Posts API v202501) ═══");

    // Step 1: Check credentials
    var props = PropertiesService.getScriptProperties();
    var checks = {
        LINKEDIN_ACCESS_TOKEN: !!props.getProperty('LINKEDIN_ACCESS_TOKEN'),
        LINKEDIN_COMPANY_URN: !!props.getProperty('LINKEDIN_COMPANY_URN'),
        LINKEDIN_CLIENT_ID: !!props.getProperty('LINKEDIN_CLIENT_ID'),
        LINKEDIN_CLIENT_SECRET: !!props.getProperty('LINKEDIN_CLIENT_SECRET')
    };
    Logger.log("  Credentials present: " + JSON.stringify(checks));
    var allPresent = checks.LINKEDIN_ACCESS_TOKEN && checks.LINKEDIN_COMPANY_URN;
    if (!allPresent) {
        Logger.log("  ❌ Missing required credentials. Run logAuthUrl_LinkedIn() first.");
        Logger.log("═══ TEST FAILED ═══");
        return;
    }
    Logger.log("  ✅ Required LinkedIn credentials found.");

    // Step 2: Check credential status in SocialPublisher
    var status = SocialPublisher.getCredentialStatus();
    Logger.log("  Dashboard status check: linkedin = " + status.linkedin);

    // Step 3: OPTIONAL — Post a live test (uncomment to run)
    /*
    try {
        var testMessage = "☘️ Shamrock Bail Bonds — LinkedIn Integration Test | " + new Date().toISOString();
        Logger.log("  Posting test message...");
        var result = SocialPublisher.publishPost('linkedin', testMessage);
        if (result && result.success) {
            Logger.log("  ✅ LinkedIn post successful! Post ID: " + result.id);
        } else {
            Logger.log("  ❌ LinkedIn post returned unexpected result: " + JSON.stringify(result));
        }
    } catch (e) {
        Logger.log("  ❌ LinkedIn post error: " + e.message);
    }
    */

    Logger.log("═══ LINKEDIN TEST COMPLETE ═══");
    Logger.log("  ℹ️ To run a live post test, uncomment the Step 3 block in testLinkedInAPI().");
}
