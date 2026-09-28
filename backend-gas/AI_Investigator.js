/**
 * AI_Investigator.js
 * 
 * " The Investigator "
 * 
 * Analyzes comprehensive background reports (IRB, TLO, iDiCore) for deep vetting.
 * Cross-references Defendant vs Indemnitor data.
 * Specialized in detecting hidden risks, asset stability, and relationship verification.
 * 
 * Agent Doctrine (AGENTS.md):
 * Model: gpt-4o | Channel: On-demand | Output: Vetting Assessment -> Slack alert if high-risk flags detected
 */

/**
 * deepAnalyzeReports
 * @param {Object} payload - { defendantReport: string, indemnitorReport: string, defendantName?: string, indemnitorName?: string }
 * @returns {Object} JSON Analysis
 */
function AI_deepAnalyzeReports(payload) {
    console.log("🕵️ Investigator: Starting deep analysis of background reports...");

    const defReport = payload.defendantReport || "NO RECORD PROVIDED";
    const indReport = payload.indemnitorReport || "NO RECORD PROVIDED";

    // Truncate to avoid exceeding OpenAI 128k token context window (~37.5k tokens / 150k chars each)
    const MAX_CHARS = 150000;
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

    const result = callOpenAI(systemPrompt, userContent, { 
        model: 'gpt-4o', 
        maxTokens: 2500, 
        jsonMode: true, 
        useKnowledgeBase: true 
    });

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

    // AGENTS.md Doctrine: Send Slack alert to #leads if high-risk flags detected
    const isHighRisk = result.recommendation === "DECLINE" ||
        result.recommendation === "REQUIRE COLLATERAL" ||
        (typeof result.flightRiskScore === 'number' && result.flightRiskScore < 50) ||
        (typeof result.indemnitorStabilityScore === 'number' && result.indemnitorStabilityScore < 50) ||
        (Array.isArray(result.redFlags) && result.redFlags.length > 0);

    if (isHighRisk) {
        sendInvestigatorSlackAlert_(payload, result);
    }

    return result;
}

/**
 * Send Slack Alert for High-Risk Background Investigation Findings
 * @private
 */
function sendInvestigatorSlackAlert_(payload, analysis) {
    try {
        if (typeof NotificationService === 'undefined' || !NotificationService.notifySlack) {
            console.warn("NotificationService not available for Investigator Slack alert.");
            return;
        }

        const isDecline = analysis.recommendation === 'DECLINE';
        const color = isDecline ? '#ff0000' : '#ffa500';
        const defName = payload.defendantName || payload.name || "Defendant";
        const indName = payload.indemnitorName || "Indemnitor";

        const fields = [
            { title: "Recommendation", value: `*${analysis.recommendation}*`, short: true },
            { title: "Relationship Verified", value: analysis.relationshipVerified ? "✅ Yes" : "❌ No", short: true },
            { title: "Flight Risk Score", value: `${analysis.flightRiskScore}/100`, short: true },
            { title: "Indemnitor Stability", value: `${analysis.indemnitorStabilityScore}/100`, short: true },
            { title: "Subjects", value: `Defendant: ${defName}\nIndemnitor: ${indName}`, short: false },
            { title: "Flight Rationale", value: analysis.flightRiskRationale || "N/A", short: false },
            { title: "Indemnitor Rationale", value: analysis.indemnitorRationale || "N/A", short: false }
        ];

        if (Array.isArray(analysis.redFlags) && analysis.redFlags.length > 0) {
            fields.push({
                title: "⚠️ Red Flags",
                value: analysis.redFlags.map(rf => `• ${rf}`).join("\n"),
                short: false
            });
        }

        const slackPayload = {
            attachments: [{
                color: color,
                pretext: `🕵️ *Investigator Vetting Alert: ${analysis.recommendation}*`,
                fields: fields,
                footer: "Shamrock Digital Workforce — The Investigator (gpt-4o)"
            }]
        };

        NotificationService.notifySlack('SLACK_WEBHOOK_LEADS', slackPayload);
        console.log("🕵️ Sent Investigator Vetting Alert to Slack (#leads).");
    } catch (err) {
        console.warn("Failed to send Investigator Slack alert: " + err.message);
    }
}

// NOTE: client_runInvestigator lives in Code.js (includes isUserAllowed auth check).
// DO NOT duplicate here.
