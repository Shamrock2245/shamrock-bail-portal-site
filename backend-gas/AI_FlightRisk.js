/**
 * AI_FlightRisk.gs
 * 
 * " The Analyst "
 * 
 * Uses OpenAI GPT-4o-mini to score leads based on flight risk and business logic.
 * Replaces rigid "if/else" math with semantic understanding of charges.
 */

/**
 * Analyzes a raw lead for Flight Risk and Business Viability.
 * @param {Object} lead - { name, charges, bondAmount, agency, county }
 * @returns {Object} - { score: number, riskLevel: 'Low'|'Medium'|'High', summary: string, qualified: boolean }
 */
function AI_analyzeFlightRisk(lead) {
    const systemPrompt = `
    You are a Senior Underwriter for a Bail Bonds agency in Florida.
    Your job is to analyze arrest records and applicant details to determine the "Flight Risk" and "Business Viability" of a potential client.

    **Risk Factors (Nuance):**
    - High Risk: Out of State/County Warrants, "Fugitive", "Escape", "Violent Felonies", "Trafficking", History of FTAs (Failure to Appear), Unemployed, No local ties.
    - Low Risk: DUI, Petty Theft, Traffic violations, Locals, Employed, Strong community ties (family).

    **Business Rules:**
    - We WANT: High bond amounts ($5k+), local residents, first-time offenders.
    - We AVOID: Extradition cases, "No Bond", "Hold for ICE/Marshall", Multiple recent FTAs.

    **Task:**
    Analyze the provided JSON data.
    Output pure JSON with no markdown formatting:
    {
        "score": number (0-100, where 100 is PERFECT CLIENT, 0 is DO NOT WRITE),
        "riskLevel": "Low" | "Medium" | "High" | "Critical",
        "rationale": "One short sentence explaining why.",
        "qualified": boolean (true if score > 60)
    }
    `;

    // Filter essential data to save tokens
    const leadData = JSON.stringify({
        charges: lead.charges,
        agency: lead.agency || "Unknown",
        bond: lead.bond,
        // Detailed Factors
        residency: lead.residency || (lead.address && lead.address.toLowerCase().includes("fl") ? "Local (FL)" : "Unknown/Out of State"),
        employment: lead.employment || "Unknown",
        history: lead.history || "Unknown (No FTA info provided)",
        ties: lead.ties || "Unknown",
        notes: lead.notes || ""
    });

    console.log(`🤖 Analyst: Reviewing ${lead.name || 'Anonymous'}...`);

    const result = callOpenAI(systemPrompt, leadData, { jsonMode: true, useKnowledgeBase: true });

    if (!result) {
        console.warn("Analyst failed to generate. Returning fallback neutral score.");
        return { score: 50, riskLevel: "Medium", rationale: "AI Analysis Failed", qualified: false };
    }

    // Pass through original lead info if needed or just return the analysis
    return result;
}

/**
 * Batch Analysis Helper
 * Processes a list of leads (e.g. from the 'Fresh' tab).
 */
function AI_batchAnalyze(leads) {
    return leads.map(lead => {
        const analysis = AI_analyzeFlightRisk(lead);
        return { ...lead, ...analysis };
    });
}
