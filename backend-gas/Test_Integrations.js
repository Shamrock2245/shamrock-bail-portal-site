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

function testTwitterAPI() {
    try {
        Logger.log("Testing Twitter API...");
        var result = SocialPublisher.publishPost("twitter", "Automated test from Shamrock Bail Bonds system. " + new Date().toISOString());
        Logger.log("Twitter Response: " + JSON.stringify(result));
    } catch (e) {
        Logger.log("Twitter API Error: " + e.message);
    }
}
