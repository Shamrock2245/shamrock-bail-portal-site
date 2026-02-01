/**
 * RAGService.gs
 * 
 * Retrieval Augmented Generation
 * Wraps simple context lookup for "Smart AI" responses.
 */

// If importing KnowledgeBase in GAS, it's just available as global RAG_KNOWLEDGE_BASE or function.
// In local dev we assume RAG_getKnowledge() is available.

function RAG_queryCounty(countyName) {
    const db = RAG_getKnowledge();
    const slug = (countyName || "").toLowerCase().trim().replace(/\s+county/g, "").replace(/\s+/g, "-");

    const entry = db[slug] || db['default'];
    return entry;
}

/**
 * Generates the "Concierge" text message for a new lead.
 * @param {Object} lead - { name, county, score }
 * @returns {String} SMS Body
 */
function RAG_generateIntroSMS(lead) {
    const context = RAG_queryCounty(lead.county);
    const firstName = lead.name.split(" ")[0];

    // 1. Try AI Generation (If Key Exists)
    const geminiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (geminiKey) {
        const aiResponse = callGeminiAPI_(geminiKey, lead, context);
        if (aiResponse) return aiResponse;
    }

    // 2. Fallback: Rule-Based Logic
    console.warn("Falling back to legacy RAG template (No API Key or Error)");
    if (lead.score >= 80) {
        return `Hi ${firstName}, this is Shamrock Bail Bonds. We saw the booking in ${context.name}. ` +
            `Because it's ${context.name}, ${context.process} ` +
            `Do you want me to start the paperwork now?`;
    } else {
        return `Hi ${firstName}, this is Shamrock Bail Bonds. Just checking in on the situation in ${context.name}. ` +
            `We have an agent nearby if you need answers.`;
    }
}

/**
 * Calls Google Gemini 1.5 Flash to generate natural text
 */
function callGeminiAPI_(apiKey, lead, context) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;

    // Robust Prompt Engineering
    const systemPrompt = `You are "Shamrock", a helpful, empathetic, and professional bail bond agent assistant. 
    Your goal is to send a clear, helpful SMS to a potential client who just had a loved one arrested.
    
    Context:
    - County: ${context.name}
    - Process: ${context.process}
    - Lead Name: ${lead.name}
    - Urgency Score: ${lead.score}/100
    - Jail Location: ${context.jail_location}

    Instructions:
    - Keep it under 160 characters if possible, or max 300.
    - Be conversational but professional.
    - If Urgency is High (>80), offer immediate paperwork.
    - If Urgency is Low, just offer help/answers.
    - Use the County Process data to sound like a local expert.
    - Do NOT include placeholders like [Name]. Use the real name: ${lead.name.split(' ')[0]}.
    `;

    const payload = {
        "contents": [{
            "parts": [{ "text": systemPrompt }]
        }]
    };

    try {
        const response = UrlFetchApp.fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        const json = JSON.parse(response.getContentText());

        if (json.candidates && json.candidates.length > 0) {
            return json.candidates[0].content.parts[0].text.trim();
        } else {
            console.error("Gemini API Error: " + JSON.stringify(json));
            return null;
        }
    } catch (e) {
        console.error("Gemini Fetch Failed: " + e.message);
        return null;
    }
}

/**
 * Generates an internal Slack context block
 * @param {Object} lead 
 */
function RAG_generateSlackContext(lead) {
    const context = RAG_queryCounty(lead.county);
    return `*${context.name} Strategy:* ${context.process}\n*Tips:* ${context.tips.join(", ")}`;
}
