/**
 * GeminiClient.gs
 * 
 * Centralized client for interacting with Google Gemini API (1.5 Flash).
 * Handles authentication, standard prompting, and error management.
 */

const GEMINI_CONFIG = {
    MODEL: 'gemini-1.5-flash-001',
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent',
    MAX_RETRIES: 2
};

/**
 * Call Gemini API with a system prompt and user context
 * @param {string} systemPrompt - The core instruction (persona, rules)
 * @param {string} userContent - The specific data to analyze (JSON string or text)
 * @param {Object} options - Optional: { temperature: 0.7, jsonMode: false }
 * @returns {string|Object|null} - The generated text or parsed JSON
 */
function callGemini(systemPrompt, userContent, options = {}) {
    try {
        const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
        if (!apiKey) {
            console.error("⛔ GeminiClient: GEMINI_API_KEY is missing in Script Properties.");
            return null;
        }

        const url = `${GEMINI_CONFIG.API_URL}?key=${apiKey}`;

        // Construct robust prompt payload
        const parts = [{ text: systemPrompt + "\n\nDATA TO ANALYZE:\n" }];

        // Check if userContent is complex (contains image)
        if (typeof userContent === 'object' && userContent.mimeType && userContent.data) {
            // Multi-modal (Image + Text)
            parts.push({
                inline_data: {
                    mime_type: userContent.mimeType,
                    data: userContent.data // Base64 string
                }
            });
            if (userContent.text) parts.push({ text: userContent.text });
        } else {
            // Text only
            parts.push({ text: String(userContent) });
        }

        const contents = [{ role: "user", parts: parts }];

        const payload = {
            contents: contents,
            generationConfig: {
                temperature: options.temperature || 0.4,
                maxOutputTokens: options.maxTokens || 800
            }
        };

        // Add JSON mode if requested (Supported in newer Gemini versions, but prompting for JSON is safer cross-version)
        if (options.jsonMode) {
            payload.generationConfig.response_mime_type = "application/json";
        }

        const fetchOptions = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, fetchOptions);
        const json = JSON.parse(response.getContentText());

        if (json.error) {
            console.error(`⛔ Gemini API Error: ${json.error.message}`);
            return null;
        }

        if (json.candidates && json.candidates.length > 0) {
            const rawText = json.candidates[0].content.parts[0].text;
            return options.jsonMode ? JSON.parse(rawText) : rawText.trim();
        }

        return null;

    } catch (e) {
        console.error("⛔ GeminiClient Exception: " + e.toString());
        return null;
    }
}

/**
 * Test Connection
 */
function testGeminiConnection() {
    const res = callGemini("You are a connection tester. Reply with 'OK'.", "Test");
    console.log("Gemini Test Result: " + res);
    return res === 'OK';
}
