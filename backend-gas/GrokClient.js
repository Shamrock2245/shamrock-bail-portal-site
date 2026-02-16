/**
 * GrokClient.js
 * 
 * Centralized client for interacting with xAI's Grok API.
 * Compatible with OpenAI Chat Completions endpoint structure.
 * 
 * USAGE:
 * var client = new GrokClient();
 * var response = client.chat("Hello Grok!");
 */

class GrokClient {
    constructor() {
        this.API_URL = 'https://api.x.ai/v1/chat/completions';
        this.API_KEY = PropertiesService.getScriptProperties().getProperty('GROK_API_KEY');
        this.MODEL = 'grok-2-latest'; // Or 'grok-beta'
    }

    /**
     * Check if API Key is configured
     */
    hasKey() {
        return !!this.API_KEY;
    }

    /**
     * Send a standard chat message to Grok
     * @param {string|Array} messages - User message string or Array of {role, content} objects
     * @param {string} systemPrompt - Optional system instruction
     * @param {Object} options - { temperature, maxTokens, jsonMode }
     */
    chat(messages, systemPrompt, options = {}) {
        if (!this.hasKey()) {
            console.error("⛔ GrokClient: GROK_API_KEY is missing in Script Properties.");
            return null;
        }

        // Normalize messages to array
        let messagePayload = [];

        if (systemPrompt) {
            messagePayload.push({ role: "system", content: systemPrompt });
        }

        if (typeof messages === 'string') {
            messagePayload.push({ role: "user", content: messages });
        } else if (Array.isArray(messages)) {
            messagePayload = messagePayload.concat(messages);
        }

        const payload = {
            model: this.MODEL,
            messages: messagePayload,
            temperature: options.temperature || 0.7,
            stream: false
        };

        if (options.jsonMode) {
            // Grok supports JSON mode via response_format? Verify docs.
            // Assuming OpenAI compatibility:
            payload.response_format = { type: "json_object" };
        }

        const fetchOptions = {
            method: 'post',
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${this.API_KEY}`
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        try {
            const response = UrlFetchApp.fetch(this.API_URL, fetchOptions);
            const json = JSON.parse(response.getContentText());

            if (response.getResponseCode() !== 200) {
                console.error("⛔ Grok API Error:", json);
                throw new Error(`Grok API Error: ${json.error ? json.error.message : 'Unknown'}`);
            }

            if (json.choices && json.choices.length > 0) {
                return json.choices[0].message.content;
            }

            return null;

        } catch (e) {
            console.error("⛔ GrokClient Exception:", e);
            throw e;
        }
    }
}

// Global Help Function
function callGrok(systemPrompt, userMessage) {
    return new GrokClient().chat(userMessage, systemPrompt);
}
