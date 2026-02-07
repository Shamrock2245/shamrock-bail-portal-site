/**
 * Test_Slack.js
 * run: testSlackIntegration()
 */
function testSlackIntegration() {
    console.log("🧪 Starting Slack Integration Test...");

    // Test 1: New Cases Channel
    console.log("🔔 Sending test to #new-arrests-lee-county...");
    const res1 = NotificationService.sendSlack('#new-arrests-lee-county', '🚀 Verification: Lee County Scraper is connected to Slack.');

    if (res1.success) {
        console.log("✅ Success! Check #new-cases channel.");
    } else {
        console.error("❌ Failed:", res1.error);
    }

    // Test 2: General Fallback
    console.log("🔔 Sending test to General...");
    const res2 = NotificationService.sendSlack('general', '🚀 Verification: System Notification Service is active.');

    if (res2.success) {
        console.log("✅ Success! Check #general (or fallback) channel.");
    } else {
        console.error("❌ Failed:", res2.error);
    }
}
