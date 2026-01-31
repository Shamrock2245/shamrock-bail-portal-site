/**
 * AI_CheckInMonitor.gs
 * 
 * " The Parole Officer "
 * 
 * Monitors incoming check-ins for sentiment and risk.
 * Alerts staff if a defendant sounds distressed, non-compliant, or admits to fleeing.
 */

/**
 * Frequency: Called synchronously when a Check-In is logged via API.
 * 
 * @param {Object} checkInData - { notes, latitude, longitude, memberId, name }
 * @returns {Object|null} - Analysis result if Alert needed, else null.
 */
function AI_analyzeCheckIn(checkInData) {
    // 1. Filter: Only analyze if there is distinct content
    // Ignore empty notes or standard "Checking in" text
    const text = (checkInData.notes || "").trim();
    if (!text || text.length < 5 || text.toLowerCase() === "checking in") {
        return null;
    }

    console.log(`🤖 Monitor: Analyzing check-in sentiment for ${checkInData.memberId}...`);

    const systemPrompt = `
    You are a Probation Officer Assistant.
    Analyze this message from a defendant on bail.
    
    Determine two things:
    1. Sentiment: Is the user distressed, angry, or excuse-making?
    2. Intent: Are they admitting to skipping court, leaving town, or self-harm?

    **Output JSON only:**
    {
        "status": "OK" | "WARNING" | "CRITICAL",
        "alert_staff": boolean (true if status is WARNING or CRITICAL),
        "summary": "Brief explanation"
    }
    `;

    const userContent = `Message: "${text}"\nTime: ${new Date().toISOString()}`;

    const result = callGemini(systemPrompt, userContent, { jsonMode: true });

    if (result && result.alert_staff) {
        // Send Alert immediately
        sendCheckInAlert_(checkInData, result);
        return result;
    }

    return null;
}

/**
 * Send Slack Alert for Check-In Risk
 */
function sendCheckInAlert_(data, analysis) {
    const url = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_LEADS');
    if (!url) return;

    const color = analysis.status === 'CRITICAL' ? '#ff0000' : '#ffa500';

    const payload = {
        attachments: [{
            color: color,
            pretext: "🚨 *Defendant Check-In Alert*",
            fields: [
                { title: "Defendent", value: data.name || data.memberEmail || "Unknown", short: true },
                { title: "Status", value: analysis.status, short: true },
                { title: "Message", value: `"${data.notes}"`, short: false },
                { title: "AI Analysis", value: analysis.summary, short: false }
            ],
            footer: "Shamrock AI Monitor"
        }]
    };

    try {
        UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload) });
        console.log("🚨 Sent Check-In Alert to Slack.");
    } catch (e) {
        console.error("Failed to send Slack alert", e);
    }
}
