/**
 * AI_Investigator.gs
 * 
 * " The Investigator "
 * 
 * Analyzes comprehensive background reports (IRB, TLO, iDiCore) for deep vetting.
 * Cross-references Defendant vs Indemnitor data.
 * specialized in detecting hidden risks, asset stability, and relationship verification.
 */

/**
 * deepAnalyzeReports
 * @param {Object} payload - { defendantReport: string, indemnitorReport: string }
 * @returns {Object} JSON Analysis
 */
function AI_deepAnalyzeReports(payload) {
    console.log("🕵️ Investigator: Starting deep analysis of background reports...");

    const defReport = payload.defendantReport || "NO RECORD PROVIDED";
    const indReport = payload.indemnitorReport || "NO RECORD PROVIDED";

    // Truncate if insanely large to avoid context limits (Gemini 1.5 Flash has ~1M tokens, so we are likely safe, but let's be sane)
    const MAX_CHARS = 300000; // ~75k tokens
    const defSafe = defReport.length > MAX_CHARS ? defReport.substring(0, MAX_CHARS) + "...[TRUNCATED]" : defReport;
    const indSafe = indReport.length > MAX_CHARS ? indReport.substring(0, MAX_CHARS) + "...[TRUNCATED]" : indReport;

    const systemPrompt = `
    You are a Senior Private Investigator and Risk Analyst for a Bail Bonds Agency.
    Your goal is to parse two "Comprehensive Background Reports" (sources: TLO, IRB, etc.) and generate a Vetting Assessment.

    **The Subjects:**
    1. **Defendant**: The person in jail. Risk = Running away.
    2. **Indemnitor**: The co-signer. Risk = Ability to pay / Influence on Defendant.

    **Your Analysis Tasks:**
    
    1. **Flight Risk (The Analyst's Job)**:
       - Does the Defendant have a history of "Failure to Appear" (FTA)?
       - Do they have active warrants elsewhere?
       - Do they move addresses constantly (transient)?
       
    2. **Character & Stability (The Monitor's Job)**:
       - Is the Indemnitor financially stable? (Bankruptcies, Liens, Judgments vs Assets/Property)
       - Does the Indemnitor have a dedicated relationship to the Defendant? (Same address history, shared assets, marriage record?)
       - Are there "Red Flags" in the Indemnitor's past (Fraud, Felonies)?
    
    3. **Cross-Reference**:
       - Verify if they truly know each other.
       - Do addresses align?

    **Output Format (JSON Only):**
    {
        "flightRiskScore": number (0-100, 100=Safe, 0=Dangerous),
        "flightRiskRationale": "string",
        "indemnitorStabilityScore": number (0-100, 100=Rock Solid, 0=Broke/Criminal),
        "indemnitorRationale": "string",
        "relationshipVerified": boolean,
        "relationshipNotes": "string",
        "redFlags": ["List of specific warnings found in text"],
        "recommendation": "WRITE BOND" | "REQUIRE COLLATERAL" | "DECLINE"
    }
    `;

    const userContent = `
    === REPORT 1: DEFENDANT ===
    ${defSafe}

    === REPORT 2: INDEMNITOR ===
    ${indSafe}
    `;

    const result = callOpenAI(systemPrompt, userContent, { jsonMode: true, useKnowledgeBase: true });

    if (!result) {
        console.warn("🕵️ Investigator failed to generate. Returning fallback safe object.");
        return {
            flightRiskScore: 50,
            flightRiskRationale: "AI Analysis Failed",
            indemnitorStabilityScore: 50,
            indemnitorRationale: "AI Analysis Failed",
            relationshipVerified: false,
            relationshipNotes: "AI Analysis Failed",
            redFlags: ["AI Analysis Failed - Manual Review Required"],
            recommendation: "REQUIRE COLLATERAL"
        };
    }

    return result;
}

/**
 * Client-facing wrapper
 */
function client_runInvestigator(payload) {
    const email = Session.getActiveUser().getEmail();
    // Security check (reusing global helper if available, else simple check)
    // if (!isUserAllowed(email)) return { error: "Unauthorized" }; 

    return AI_deepAnalyzeReports(payload);
}
