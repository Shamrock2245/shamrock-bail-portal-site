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
 * Handle incoming Slack Webhooks (from Slash Commands)
 * Routed from SOC2_WebhookHandler.js
 */
function handleSlackWebhookSOC2(e) {
    try {
        const payload = e.parameter;
        // Verify the command matches our expectation
        if (payload.command !== '/tg_reply') {
            return ContentService.createTextOutput("Ignored: Command must be /tg_reply").setMimeType(ContentService.MimeType.TEXT);
        }

        const text = payload.text || '';
        // Format of text: "chatId message"
        const parts = text.split(' ');
        if (parts.length < 2) {
            return ContentService.createTextOutput(
                "Format: `/tg_reply [chatId] [message]`\\nExample: `/tg_reply 123456789 Hello there!`"
            ).setMimeType(ContentService.MimeType.TEXT);
        }

        const chatId = parts[0].trim();
        const replyMessage = parts.slice(1).join(' ').trim();

        // Send the message via Telegram Bot API
        try {
            const bot = new TelegramBotAPI();
            bot.sendMessage(chatId, replyMessage);
            return ContentService.createTextOutput(`✅ Reply sent successfully to Chat ID: ${chatId}`).setMimeType(ContentService.MimeType.TEXT);
        } catch (tgError) {
            console.error('Failed to send Telegram reply via Slack command:', tgError);
            return ContentService.createTextOutput(`❌ Failed to send Telegram message: ${tgError.message}`).setMimeType(ContentService.MimeType.TEXT);
        }
    } catch (e) {
        console.error('Slack Webhook Error:', e);
        return ContentService.createTextOutput(`Error: ${e.message}`).setMimeType(ContentService.MimeType.TEXT);
    }
}
