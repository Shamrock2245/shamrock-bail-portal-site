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
        this.MODEL = 'grok-3'; // Supported model version
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
        let finalSystemPrompt = systemPrompt;
        if (options.useKnowledgeBase && typeof RAG_getKnowledge === 'function') {
            try {
                const kb = RAG_getKnowledge();
                const kbString = "\n\nShamrock Bail Bonds Knowledge Base Data:\n" + JSON.stringify(kb, null, 2);
                if (finalSystemPrompt) {
                    finalSystemPrompt += kbString;
                } else {
                    finalSystemPrompt = kbString;
                }
            } catch (e) {
                console.warn("Failed to inject Knowledge Base", e);
            }
        }

        if (!this.hasKey()) {
            console.warn("⚠️ GrokClient: GROK_API_KEY is missing in Script Properties.");
            const fallback = failoverToOpenAI_(finalSystemPrompt, messages, options);
            if (fallback !== null) return fallback;
            return null;
        }

        // Normalize messages to array
        let messagePayload = [];

        if (finalSystemPrompt) {
            messagePayload.push({ role: "system", content: String(finalSystemPrompt) });
        }

        if (typeof messages === 'string') {
            messagePayload.push({ role: "user", content: messages });
        } else if (Array.isArray(messages)) {
            messagePayload = messagePayload.concat(messages);
        } else if (typeof messages === 'object' && messages !== null) {
            messagePayload.push(messages);
        }

        const payload = {
            model: options.model || this.MODEL,
            messages: messagePayload,
            temperature: options.temperature || 0.7,
            stream: false
        };

        if (options.maxTokens) {
            payload.max_tokens = options.maxTokens;
        }

        if (options.jsonMode) {
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
                const fallback = failoverToOpenAI_(finalSystemPrompt, messages, options);
                if (fallback !== null) return fallback;
                throw new Error(`Grok API Error: ${json.error ? json.error.message : 'Unknown'}`);
            }

            if (json.choices && json.choices.length > 0) {
                const rawContent = json.choices[0].message.content;
                if (options.jsonMode) {
                    try {
                        let cleanJson = String(rawContent).trim();
                        if (cleanJson.startsWith('```')) {
                            cleanJson = cleanJson.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '');
                        }
                        return JSON.parse(cleanJson);
                    } catch (parseErr) {
                        console.warn("⚠️ Grok returned invalid JSON, returning raw text", parseErr);
                        return rawContent;
                    }
                }
                return String(rawContent).trim();
            }

            const fallback = failoverToOpenAI_(finalSystemPrompt, messages, options);
            if (fallback !== null) return fallback;
            return null;

        } catch (e) {
            console.error("⛔ GrokClient Exception:", e);
            const fallback = failoverToOpenAI_(finalSystemPrompt, messages, options);
            if (fallback !== null) return fallback;
            throw e;
        }
    }

    /**
     * Fetch available models to diagnose "Model not found" errors
     */
    fetchAvailableModels() {
        if (!this.hasKey()) return null;
        try {
            const response = UrlFetchApp.fetch('https://api.x.ai/v1/models', {
                method: 'get',
                headers: {
                    'Authorization': 'Bearer ' + this.API_KEY,
                },
                muteHttpExceptions: true
            });
            const content = response.getContentText();
            return JSON.parse(content);
        } catch (e) {
            console.error("GrokClient: fetchAvailableModels error", e);
            return null;
        }
    }
}

/**
 * Automated failover to OpenAI when Grok is unavailable or errors
 * @private
 */
function failoverToOpenAI_(systemPrompt, messages, options) {
    if (options && options._isFallback) return null; // Prevent circular failover
    if (typeof callOpenAI === 'function') {
        console.log("🔄 Grok unavailable or error. Seamlessly failing over to OpenAI...");
        try {
            const openAiOptions = Object.assign({}, options, { _isFallback: true });
            let userContent = messages;
            if (Array.isArray(messages) && messages.length > 0) {
                // If messages array has user message as last element, extract it
                const lastUser = messages.slice().reverse().find(m => m.role === 'user');
                if (lastUser) userContent = lastUser.content;
            }
            return callOpenAI(systemPrompt, userContent, openAiOptions);
        } catch (openAiErr) {
            console.error("⛔ OpenAI failover also failed: " + openAiErr.toString());
        }
    }
    return null;
}

// Global Help Function with flexible argument ordering
function callGrok(systemPrompt, userMessage, options = {}) {
    let finalSystem = systemPrompt;
    let finalUser = userMessage;

    // Resilient argument swapping: if first argument is an array or object with role, it's the messages payload
    if (Array.isArray(systemPrompt) || (typeof systemPrompt === 'object' && systemPrompt !== null && systemPrompt.role)) {
        finalUser = systemPrompt;
        finalSystem = userMessage;
    }

    return new GrokClient().chat(finalUser, finalSystem, options);
}
