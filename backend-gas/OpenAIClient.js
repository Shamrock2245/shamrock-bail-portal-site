/**
 * OpenAIClient.js
 * 
 * Centralized client for interacting with OpenAI API (GPT-4o-mini).
 * Handles authentication, standard prompting, and error management.
 * 
 * Replaces GeminiClient.js with OpenAI for more reliable AI extraction.
 */

const OPENAI_CONFIG = {
    MODEL: 'gpt-4o-mini',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MAX_RETRIES: 2
};

/**
 * Call OpenAI API with a system prompt and user content
 * @param {string} systemPrompt - The core instruction (persona, rules)
 * @param {string|Object} userContent - The specific data to analyze (text, URL, or {mimeType, data})
 * @param {Object} options - Optional: { temperature: 0.7, jsonMode: false, maxTokens: 1000 }
 * @returns {string|Object|null} - The generated text or parsed JSON
 */
function callOpenAI(systemPrompt, userContent, options = {}) {
    try {
        const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
        if (!apiKey) {
            console.error("⛔ OpenAIClient: OPENAI_API_KEY is missing in Script Properties.");
            console.error("   Run setupOpenAIKey() to configure it.");
            return null;
        }

        const messages = [
            { role: "system", content: systemPrompt }
        ];

        // Handle different content types
        if (typeof userContent === 'object' && userContent.mimeType && userContent.data) {
            // Multi-modal (Image + Text) - OpenAI vision API
            const imageUrl = `data:${userContent.mimeType};base64,${userContent.data}`;
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: "Extract structured data from this booking image:" },
                    { type: "image_url", image_url: { url: imageUrl } }
                ]
            });
        } else {
            // Text only
            messages.push({ role: "user", content: String(userContent) });
        }

        const payload = {
            model: OPENAI_CONFIG.MODEL,
            messages: messages,
            temperature: options.temperature || 0.4,
            max_tokens: options.maxTokens || 1000
        };

        // Add JSON mode if requested (OpenAI structured outputs)
        if (options.jsonMode) {
            payload.response_format = { type: "json_object" };
        }

        const fetchOptions = {
            method: 'post',
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(OPENAI_CONFIG.API_URL, fetchOptions);
        const json = JSON.parse(response.getContentText());

        if (json.error) {
            console.error(`⛔ OpenAI API Error: ${json.error.message}`);
            console.error(`   Error type: ${json.error.type}`);
            console.error(`   Full error: ${JSON.stringify(json.error)}`);
            return null;
        }

        if (json.choices && json.choices.length > 0) {
            const rawText = json.choices[0].message.content;
            return options.jsonMode ? JSON.parse(rawText) : rawText.trim();
        }

        console.error("⛔ OpenAI returned no choices");
        return null;

    } catch (e) {
        console.error("⛔ OpenAIClient Exception: " + e.toString());
        console.error("   Stack: " + e.stack);
        return null;
    }
}

/**
 * Test OpenAI Connection
 */
function testOpenAIConnection() {
    const res = callOpenAI("You are a connection tester. Reply with exactly 'OK' and nothing else.", "Test");
    console.log("OpenAI Test Result: " + res);
    return res === 'OK';
}

/**
 * Setup OpenAI API Key in Script Properties
 * Run this once to configure the API key
 */
function setupOpenAIKey() {
    // IMPORTANT: Replace 'YOUR_OPENAI_API_KEY_HERE' with your actual OpenAI API key
    // Get your API key from: https://platform.openai.com/api-keys
    const apiKey = 'YOUR_OPENAI_API_KEY_HERE';
    
    if (!apiKey || !apiKey.startsWith('sk-')) {
        console.error('❌ Invalid API key format');
        return false;
    }
    
    try {
        PropertiesService.getScriptProperties().setProperty('OPENAI_API_KEY', apiKey);
        console.log('✅ OPENAI_API_KEY set successfully');
        
        // Test the connection
        const testResult = testOpenAIConnection();
        if (testResult) {
            console.log('✅ OpenAI connection verified');
            return true;
        } else {
            console.error('❌ OpenAI connection test failed');
            return false;
        }
    } catch (e) {
        console.error('❌ Failed to set OPENAI_API_KEY: ' + e.message);
        return false;
    }
}

/**
 * Verify OpenAI API Key is Set
 */
function verifyOpenAIKey() {
    const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
    if (!apiKey) {
        console.log('❌ OPENAI_API_KEY is not set');
        console.log('   Run setupOpenAIKey() to configure it');
        return false;
    }
    console.log('✅ OPENAI_API_KEY is set');
    console.log('   Key starts with: ' + apiKey.substring(0, 10) + '...');
    return true;
}
