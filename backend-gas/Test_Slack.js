/**
 * Test_Slack.js
 * run: testSlackIntegration()
 */
function testSlackIntegration() {
    const logs = [];
    logs.push("🧪 Starting Slack Integration Test...");

    // Test 1: New Cases Channel (Webhook)
    logs.push("🔔 Test 1: Webhook -> #new-arrests-lee-county...");
    const res1 = NotificationService.sendSlack('#new-arrests-lee-county', '🚀 Verification: Lee County Scraper is connected to Slack.');

    if (res1.success) {
        logs.push("✅ Webhook Success! Check #new-arrests-lee-county.");
    } else {
        logs.push(`❌ Webhook Failed: ${res1.error}`);
    }

    // Test 2: General Fallback (Webhook)
    logs.push("🔔 Test 2: Webhook -> General...");
    const res2 = NotificationService.sendSlack('general', '🚀 Verification: System Notification Service is active.');

    if (res2.success) {
        logs.push("✅ Webhook General Success!");
    } else {
        logs.push(`❌ Webhook General Failed: ${res2.error}`);
    }

    // Test 3: Bot Token (Direct)
    if (typeof sendSlackMessage === 'function') {
        logs.push("🔔 Test 3: Bot Token -> #alerts...");
        const res3 = sendSlackMessage('#alerts', '🚀 Verification: Bot Token Integration is active.');
        if (res3 && res3.success) {
            logs.push("✅ Bot Token Success! Check #alerts.");
        } else {
            logs.push(`❌ Bot Token Failed: ${res3 ? res3.error : 'No response'}`);
        }
    } else {
        logs.push("⚠️ Skipped Test 3: sendSlackMessage not found.");
    }

    return {
        success: true,
        logs: logs
    };
}
