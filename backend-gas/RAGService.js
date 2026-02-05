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

    // 1. Try AI Generation (Gemini)
    try {
        const systemPrompt = `You are "Shamrock", a helpful, empathetic, and professional bail bond agent assistant. 
        Your goal is to send a clear, helpful SMS to a potential client who just had a loved one arrested.
        
        Instructions:
        - Keep it under 160 characters if possible, or max 300.
        - Be conversational but professional.
        - If Urgency is High (>80), offer immediate paperwork.
        - If Urgency is Low, just offer help/answers.
        - Use the provided County Process data to sound like a local expert.
        - Do NOT include placeholders like [Name]. Use the real name provided.
        `;

        const userData = {
            LeadName: lead.name,
            County: context.name,
            Process: context.process,
            UrgencyScore: lead.score,
            JailLocation: context.jail_location
        };

        // Use the centralized OpenAIClient
        // Ensure callOpenAI is available (global in GAS)
        if (typeof callOpenAI === 'function') {
            const aiResponse = callOpenAI(systemPrompt, JSON.stringify(userData));
            if (aiResponse) return aiResponse;
        } else {
            console.warn("OpenAIClient (callOpenAI) not found. Using fallback.");
        }

    } catch (e) {
        console.error("RAG AI Generation Failed:", e);
    }

    // 2. Fallback: Rule-Based Logic
    console.warn("Falling back to legacy RAG template");
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
 * Generates an internal Slack context block
 * @param {Object} lead 
 */
function RAG_generateSlackContext(lead) {
    const context = RAG_queryCounty(lead.county);
    return `*${context.name} Strategy:* ${context.process}\n*Tips:* ${context.tips.join(", ")}`;
}
