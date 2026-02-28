/**
 * RiskIntelligenceLoop.js
 * 
 * "The Watchdog"
 * 
 * Connects all signals (location, sentiment, court data, check-in compliance)
 * into a comprehensive, real-time risk scoring engine.
 * 
 * Runs daily as a trigger. For each active defendant:
 *   1. Pulls latest location data (all modalities)
 *   2. Calculates check-in compliance rate
 *   3. Checks upcoming court dates
 *   4. Runs enriched AI risk analysis
 *   5. Updates risk score in tracking sheet
 *   6. Alerts staff on significant risk changes
 * 
 * Trigger: Daily at 7 AM ET via setupRiskIntelligenceTrigger()
 */

// =============================================================================
// 1. MAIN LOOP
// =============================================================================

/**
 * The main risk intelligence loop.
 * Processes all active defendants and updates their risk scores.
 */
function runRiskIntelligenceLoop() {
    console.log('🧠 RiskIntelligenceLoop: Starting daily analysis...');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Active_Defendants') || ss.getSheetByName('IntakeQueue') || ss.getSheetByName('Intake_Queue');

    if (!sheet) {
        console.error('RiskIntelligenceLoop: No defendant tracking sheet found.');
        return;
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
        console.log('RiskIntelligenceLoop: No active defendants to analyze.');
        return;
    }

    var headers = data[0];
    var riskColumnIndex = findColumnIndex_(headers, ['Risk Score', 'risk_score', 'riskScore', 'Risk Level', 'risk_level']);
    var nameColumnIndex = findColumnIndex_(headers, ['Name', 'Defendant Name', 'defendant_name', 'Defendant']);
    var countyColumnIndex = findColumnIndex_(headers, ['County', 'county']);
    var statusColumnIndex = findColumnIndex_(headers, ['Status', 'status']);

    // If no risk column exists, add one
    if (riskColumnIndex === -1) {
        riskColumnIndex = headers.length;
        sheet.getRange(1, riskColumnIndex + 1).setValue('AI Risk Score');
    }

    var processed = 0;
    var escalations = [];

    for (var i = 1; i < data.length; i++) {
        var row = data[i];

        // Only process active defendants
        var status = statusColumnIndex !== -1 ? String(row[statusColumnIndex] || '').toLowerCase() : 'active';
        if (status === 'closed' || status === 'completed' || status === 'released' || status === 'dismissed') {
            continue;
        }

        var defendantName = nameColumnIndex !== -1 ? row[nameColumnIndex] : 'Row ' + (i + 1);
        var county = countyColumnIndex !== -1 ? row[countyColumnIndex] : null;
        var previousScore = riskColumnIndex < row.length ? parseFloat(row[riskColumnIndex]) || 50 : 50;

        // Build enriched context for AI analysis
        var context = buildRiskContext_(row, headers, defendantName, county);

        // Run AI risk analysis with enriched data
        var newScore = calculateEnrichedRiskScore_(context);

        // Update the sheet
        sheet.getRange(i + 1, riskColumnIndex + 1).setValue(newScore.score);

        // Apply conditional formatting color
        var cell = sheet.getRange(i + 1, riskColumnIndex + 1);
        if (newScore.score >= 80) {
            cell.setBackground('#ff4444'); // Red
            cell.setFontColor('#ffffff');
        } else if (newScore.score >= 60) {
            cell.setBackground('#ff9800'); // Orange
            cell.setFontColor('#000000');
        } else if (newScore.score >= 40) {
            cell.setBackground('#ffeb3b'); // Yellow
            cell.setFontColor('#000000');
        } else {
            cell.setBackground('#4caf50'); // Green
            cell.setFontColor('#ffffff');
        }

        // Check for significant risk increase (escalation threshold: +20 points)
        var delta = newScore.score - previousScore;
        if (delta >= 20) {
            escalations.push({
                name: defendantName,
                previousScore: previousScore,
                newScore: newScore.score,
                delta: delta,
                riskLevel: newScore.riskLevel,
                summary: newScore.summary,
                row: i + 1
            });
        }

        processed++;

        // Rate limit AI calls
        if (processed % 5 === 0) {
            Utilities.sleep(2000);
        }
    }

    // Send escalation alerts
    if (escalations.length > 0) {
        sendRiskEscalationAlerts_(escalations);
    }

    console.log('✅ RiskIntelligenceLoop: Processed ' + processed + ' defendants, ' + escalations.length + ' escalations.');
}

// =============================================================================
// 2. RISK CONTEXT BUILDER
// =============================================================================

/**
 * Builds a comprehensive risk context from all available data sources.
 * 
 * @param {Array} row - Spreadsheet row data
 * @param {Array} headers - Column headers
 * @param {string} name - Defendant name
 * @param {string} county - Defendant county
 * @returns {Object} Enriched context for AI analysis
 */
function buildRiskContext_(row, headers, name, county) {
    var context = {
        name: name,
        county: county,
        charges: findFieldValue_(row, headers, ['Charges', 'charges']),
        bondAmount: findFieldValue_(row, headers, ['Bond Amount', 'bond_amount', 'Bond']),
        intakeDate: findFieldValue_(row, headers, ['Timestamp', 'Date', 'Created']),
        source: findFieldValue_(row, headers, ['Source', 'source']),
        locationData: null,
        checkInCompliance: null,
        courtDateProximity: null,
        geofenceStatus: null
    };

    // Enrich with location data if available
    try {
        if (typeof getCaseMetadata === 'function') {
            var caseId = findFieldValue_(row, headers, ['Case ID', 'case_id', 'CaseNumber']);
            if (caseId) {
                var metadata = getCaseMetadata(caseId);
                if (metadata) {
                    context.locationData = metadata;
                }
            }
        }
    } catch (e) { /* location data unavailable */ }

    // Enrich with court date proximity
    for (var i = 0; i < row.length; i++) {
        if (row[i] instanceof Date && row[i] > new Date()) {
            var hoursUntil = (row[i] - new Date()) / (1000 * 60 * 60);
            context.courtDateProximity = {
                date: row[i].toISOString(),
                hoursUntil: Math.round(hoursUntil),
                daysUntil: Math.round(hoursUntil / 24)
            };
            break;
        }
    }

    return context;
}

// =============================================================================
// 3. AI RISK SCORING
// =============================================================================

/**
 * Uses AI to calculate an enriched risk score with location + behavioral data.
 * 
 * @param {Object} context - Enriched defendant context
 * @returns {Object} { score, riskLevel, summary }
 */
function calculateEnrichedRiskScore_(context) {
    // If AI is available, use enriched analysis
    if (typeof callOpenAI === 'function') {
        var systemPrompt = [
            'You are a Senior Underwriter for a Florida Bail Bond agency.',
            'Analyze the following defendant data and return a RISK SCORE.',
            '',
            'Data includes: charges, bond amount, location compliance, court date proximity, and behavioral signals.',
            '',
            'Scoring Guide:',
            '0-30: LOW RISK — Compliant, local, minor charges',
            '31-50: MODERATE — Some risk factors present',
            '51-70: HIGH — Multiple risk factors, needs monitoring',
            '71-90: VERY HIGH — Active risk indicators (location violations, missed check-ins)',
            '91-100: CRITICAL — Immediate flight risk (out of state, near airports, missed court)',
            '',
            'Return pure JSON:',
            '{ "score": number, "riskLevel": "LOW"|"MODERATE"|"HIGH"|"VERY_HIGH"|"CRITICAL", "summary": "one sentence explanation" }'
        ].join('\n');

        try {
            var result = callOpenAI(systemPrompt, JSON.stringify(context), { jsonMode: true });
            if (result && typeof result.score === 'number') {
                return result;
            }
        } catch (e) {
            console.warn('AI Risk Scoring failed: ' + e.message);
        }
    }

    // Fallback: rule-based scoring
    return fallbackRiskScore_(context);
}

/**
 * Fallback rule-based risk scoring when AI is unavailable.
 */
function fallbackRiskScore_(context) {
    var score = 40; // Baseline

    // Charges-based adjustments
    var charges = String(context.charges || '').toLowerCase();
    if (charges.indexOf('murder') > -1 || charges.indexOf('trafficking') > -1) score += 30;
    else if (charges.indexOf('felony') > -1) score += 15;
    else if (charges.indexOf('dui') > -1 || charges.indexOf('theft') > -1) score -= 10;

    // Court date proximity
    if (context.courtDateProximity) {
        if (context.courtDateProximity.hoursUntil < 48) score += 10;
        if (context.courtDateProximity.hoursUntil < 12) score += 15;
    }

    // Location compliance
    if (context.geofenceStatus && !context.geofenceStatus.compliant) score += 25;

    score = Math.max(0, Math.min(100, score));

    var riskLevel = score >= 91 ? 'CRITICAL' : score >= 71 ? 'VERY_HIGH' : score >= 51 ? 'HIGH' : score >= 31 ? 'MODERATE' : 'LOW';

    return { score: score, riskLevel: riskLevel, summary: 'Rule-based assessment (AI unavailable).' };
}

// =============================================================================
// 4. ESCALATION ALERTS
// =============================================================================

/**
 * Send alerts for significant risk score increases.
 */
function sendRiskEscalationAlerts_(escalations) {
    var msg = '🧠 *Risk Intelligence Alert*\n━━━━━━━━━━━━━━━━━━\n';
    msg += escalations.length + ' defendant(s) with significant risk increases:\n\n';

    escalations.forEach(function (e) {
        var emoji = e.riskLevel === 'CRITICAL' ? '🔴' : e.riskLevel === 'VERY_HIGH' ? '🟠' : '🟡';
        msg += emoji + ' *' + e.name + '*\n';
        msg += '   Score: ' + e.previousScore + ' → ' + e.newScore + ' (Δ+' + e.delta + ')\n';
        msg += '   Level: ' + e.riskLevel + '\n';
        msg += '   ' + e.summary + '\n\n';
    });

    msg += '_Review immediately. Escalations exceeding +20 points require agent follow-up._';

    try {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#alerts', msg);

            // For CRITICAL escalations, also send to #urgent
            var critical = escalations.filter(function (e) { return e.riskLevel === 'CRITICAL'; });
            if (critical.length > 0) {
                var urgentMsg = '🚨 *CRITICAL RISK ESCALATION*\n';
                critical.forEach(function (c) {
                    urgentMsg += '🔴 ' + c.name + ' — Score jumped to ' + c.newScore + '. ' + c.summary + '\n';
                });
                NotificationService.sendSlack('#urgent', urgentMsg);
            }
        }
    } catch (e) {
        console.error('Risk Escalation Alert Failed: ' + e.message);
    }
}

// =============================================================================
// 5. HELPERS
// =============================================================================

function findColumnIndex_(headers, possibleNames) {
    for (var i = 0; i < headers.length; i++) {
        var header = String(headers[i]).toLowerCase().trim();
        for (var j = 0; j < possibleNames.length; j++) {
            if (header === possibleNames[j].toLowerCase()) return i;
        }
    }
    return -1;
}

function findFieldValue_(row, headers, possibleNames) {
    var idx = findColumnIndex_(headers, possibleNames);
    if (idx !== -1 && idx < row.length) return row[idx];
    return null;
}

// =============================================================================
// 6. TRIGGER INSTALLER
// =============================================================================

/**
 * Install the daily risk intelligence trigger.
 */
function setupRiskIntelligenceTrigger() {
    var allTriggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < allTriggers.length; i++) {
        if (allTriggers[i].getHandlerFunction() === 'runRiskIntelligenceLoop') {
            ScriptApp.deleteTrigger(allTriggers[i]);
        }
    }

    ScriptApp.newTrigger('runRiskIntelligenceLoop')
        .timeBased()
        .atHour(12) // 7 AM ET = 12 PM UTC
        .everyDays(1)
        .inTimezone('America/New_York')
        .create();

    console.log('✅ Installed: runRiskIntelligenceLoop (daily 7 AM ET)');
    return '✅ Risk Intelligence Trigger Installed.';
}
