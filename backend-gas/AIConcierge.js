/**
 * AIConcierge.gs
 * 
 * " The Automated Front Desk "
 * 
 * Monitors qualified leads and engages immediately.
 * 1. Scans "Qualified" tab for new rows.
 * 2. Identifies "Hot" leads (Score >= 70).
 * 3. Alerts internal team via Slack.
 * 4. (Future) Sends SMS intro via Twilio.
 */

const CONCIERGE_CONFIG = {
    MASTER_SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
    QUALIFIED_TAB_NAME: 'Qualified',

    // Property key to track progress
    PROP_LAST_PROCESSED_ROW: 'CONCIERGE_LAST_ROW',

    // Slack Webhook (Set in Script Properties)
    SLACK_WEBHOOK_PROP: 'SLACK_WEBHOOK_LEADS',

    // Columns (0-indexed) based on QualifiedTabRouter schema
    // Schema: Sync_Timestamp, Source_Tab, Booking_Number, ...
    // We need to match the columns dynamically or hardcode if stable.
    // QualifiedTabRouter adds [Sync_Timestamp, Source_Tab] then the 34 columns.
    // So:
    // Col 0: Sync_Timestamp
    // Col 1: Source_Tab
    // Col 2: Booking_Number
    // ...
    // Col 33: Lead_Score (approx, need to verify)
    // Col 34: Lead_Status (approx)

    // Let's use header mapping to be safe.
};

function processConciergeQueue() {
    console.log("🤖 AI Concierge: Starting run...");
    const lock = LockService.getScriptLock();

    // Fail fast if locked (overlapping runs)
    if (!lock.tryLock(5000)) {
        console.log("🤖 AI Concierge: Locked. Skipping.");
        return;
    }

    try {
        const ss = SpreadsheetApp.openById(CONCIERGE_CONFIG.MASTER_SHEET_ID);
        const sheet = ss.getSheetByName(CONCIERGE_CONFIG.QUALIFIED_TAB_NAME);

        if (!sheet) {
            console.error("Qualified tab not found.");
            return;
        }

        const lastRow = sheet.getLastRow();
        const props = PropertiesService.getScriptProperties();
        let lastProcessed = parseInt(props.getProperty(CONCIERGE_CONFIG.PROP_LAST_PROCESSED_ROW) || '1');

        // If sheet is empty or only headers
        if (lastRow <= 1) {
            return;
        }

        // If we are up to date
        if (lastProcessed >= lastRow) {
            console.log("🤖 AI Concierge: Up to date.");
            return;
        }

        // Process new rows
        // Identify headers first
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const map = buildHeaderMap_(headers);

        if (!map.Lead_Status || !map.Full_Name) {
            console.error("Missing required columns in Qualified check.");
            return;
        }

        // Grab the new range
        const startRow = lastProcessed + 1;
        const numRows = lastRow - lastProcessed;
        const data = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();

        let processedCount = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = startRow + i;

            const status = String(row[map.Lead_Status] || '').trim();
            const score = row[map.Lead_Score];

            // LOGIC: Alert on HOT leads
            if (status.toLowerCase() === 'hot') {
                const lead = {
                    name: row[map.Full_Name],
                    booking: row[map.Booking_Number],
                    county: row[map.County] || row[map.Source_Tab] || 'Unknown', // Fallback
                    charges: row[map.Charges],
                    agency: row[map.Agency] || 'Unknown',
                    bond: row[map.Bond_Amount],
                    notes: row[map.Notes] || '', // If available
                    score: score,
                    row: rowNum
                };

                // 🧠 AI ANALYST: Get Second Opinion
                const aiAnalysis = AI_analyzeFlightRisk(lead);

                // Add AI Data to Lead Object for Alerts
                lead.aiRisk = aiAnalysis.riskLevel;
                lead.aiRationale = aiAnalysis.rationale;
                lead.aiScore = aiAnalysis.score;

                sendSlackAlert_(lead);

                // Activate SMS Agent
                sendTwilioIntro_(lead);
            }

            processedCount++;
        }

        // Update pointer
        props.setProperty(CONCIERGE_CONFIG.PROP_LAST_PROCESSED_ROW, String(lastRow));
        console.log(`🤖 AI Concierge: Processed ${processedCount} new rows. Pointer at ${lastRow}.`);

    } catch (e) {
        console.error("AI Concierge Error: " + e.toString());
    } finally {
        lock.releaseLock();
    }
}

/**
 * Send Slack Notification (Enriched with AI)
 */
function sendSlackAlert_(lead) {
    const url = PropertiesService.getScriptProperties().getProperty(CONCIERGE_CONFIG.SLACK_WEBHOOK_PROP);

    if (!url) {
        console.warn("Slack Webhook URL not set.");
        return;
    }

    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "🔥 New HOT Lead Detected",
                emoji: true
            }
        },
        {
            type: "section",
            fields: [
                { type: "mrkdwn", text: `*Name:*\n${lead.name}` },
                { type: "mrkdwn", text: `*Math Score:*\n${lead.score}/100` },
                { type: "mrkdwn", text: `*County:*\n${lead.county}` },
                { type: "mrkdwn", text: `*Bond:*\n${lead.bond}` }
            ]
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Charges:*\n${lead.charges}`
            }
        }
    ];

    // AI Insight Block
    if (lead.aiRisk) {
        let icon = "⚪️";
        if (lead.aiRisk === 'High' || lead.aiRisk === 'Critical') icon = "🔴";
        if (lead.aiRisk === 'Medium') icon = "🟡";
        if (lead.aiRisk === 'Low') icon = "🟢";

        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*🤖 AI Analyst Opinion:*\n${icon} *${lead.aiRisk} Risk* (${lead.aiScore}/100)\n_${lead.aiRationale}_`
            }
        });
    }

    // Action Buttons
    blocks.push({
        type: "actions",
        elements: [
            {
                type: "button",
                text: { type: "plain_text", text: "View Dashboard" },
                url: "https://www.shamrockbailbonds.biz/portal-staff",
                style: "primary"
            }
        ]
    });

    const payload = { blocks: blocks };

    try {
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload)
        };
        UrlFetchApp.fetch(url, options);
    } catch (e) {
        console.error("Failed to send Slack alert: " + e.message);
    }
}

/**
 * Send SMS Intro (Powered by RAG)
 */
function sendTwilioIntro_(lead) {
    if (!lead.phone) {
        console.warn("Skipping Twilio: No phone for " + lead.name);
        return;
    }

    try {
        const props = PropertiesService.getScriptProperties();
        // Updated to match your actual Script Properties (Code.js standard)
        const sid = props.getProperty('TWILIO_ACCOUNT_SID');
        const token = props.getProperty('TWILIO_AUTH_TOKEN');
        const fromNum = props.getProperty('TWILIO_PHONE_NUMBER');

        if (!sid || !token || !fromNum) {
            console.error("Missing Twilio Credentials in Script Properties");
            return;
        }

        // RAG Generation
        const bodyContent = RAG_generateIntroSMS(lead);

        const payload = {
            To: lead.phone,
            From: fromNum,
            Body: bodyContent
        };

        const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const options = {
            method: 'post',
            headers: {
                'Authorization': 'Basic ' + Utilities.base64Encode(`${sid}:${token}`)
            },
            payload: payload
        };

        UrlFetchApp.fetch(url, options);
        console.log(`✅ SMS Sent to ${lead.name} (${lead.county}) via Twilio`);

    } catch (e) {
        console.error("Twilio Error: " + e.message);
    }
}

function buildHeaderMap_(headers) {
    const map = {};
    headers.forEach((h, i) => {
        map[String(h).trim()] = i;
    });
    return map;
}

/**
 * Install Trigger
 */
function installConciergeTrigger() {
    // Clear existing
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
        if (t.getHandlerFunction() === 'processConciergeQueue') ScriptApp.deleteTrigger(t);
    });

    // Set new (10 mins)
    ScriptApp.newTrigger('processConciergeQueue')
        .timeBased()
        .everyMinutes(10)
        .create();

    console.log("Concierge trigger installed.");
}
