/**
 * SlackIntegration.js
 * Handles interactions with the Slack API.
 */

/**
 * Sends a message to a Slack channel.
 * @param {string} channel - Channel ID or name (e.g., '#alerts')
 * @param {string} text - Main message text
 * @param {Array} blocks - Optional Block Kit blocks
 * @returns {Object} Slack response
 */
function sendSlackMessage(channel, text, blocks = null) {
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('SLACK_BOT_TOKEN');

    if (!token) {
        console.error("❌ Slack Error: Missing SLACK_BOT_TOKEN");
        return { success: false, error: "Missing SLACK_BOT_TOKEN" };
    }

    try {
        const payload = {
            channel: channel,
            text: text
        };

        if (blocks) {
            payload.blocks = blocks;
        }

        const options = {
            method: 'post',
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            payload: JSON.stringify(payload)
        };

        const response = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
        const data = JSON.parse(response.getContentText());

        if (data.ok) {
            console.log(`✅ Slack message sent to ${channel}`);
            return { success: true, ts: data.ts };
        } else {
            console.error(`❌ Slack API Error: ${data.error}`);
            return { success: false, error: data.error };
        }

    } catch (e) {
        console.error(`❌ Slack Exception: ${e.message}`);
        return { success: false, error: e.message };
    }
}

/**
 * Handle incoming Slack Events (Webhook)
 * Hook this up to `doPost` in Code.js if needed.
 */
function handleSlackEvent(e) {
    // Implementation for verifying signature and handling events
    // ...
}
