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

    // Logic: High score = Urgent Help. Low score = General assist.
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
