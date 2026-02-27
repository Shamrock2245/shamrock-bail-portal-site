/**
 * ============================================================================
 * Telegram_Analytics.js
 * ============================================================================
 * Bot Analytics — Tracks intake funnel events, inline queries, and 
 * feature usage for conversion rate analysis.
 * 
 * SHEET: "BotAnalytics" (auto-created)
 * COLUMNS: Timestamp | EventType | UserId | Step | Metadata | SessionId
 * 
 * DEPENDS ON: Nothing (standalone logging utility)
 * ============================================================================
 */

// ============================================================================
// EVENT LOGGING
// ============================================================================

/**
 * Log a bot event to the BotAnalytics sheet.
 * Safe to call from anywhere — fails silently if sheet issues.
 * 
 * @param {string} eventType  - e.g. 'intake_started', 'intake_completed', 'inline_query'
 * @param {string} userId     - Telegram user/chat ID
 * @param {object} metadata   - Optional extra data { step, query, duration, ... }
 */
function logBotEvent(eventType, userId, metadata) {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) {
            var fallbackId = PropertiesService.getScriptProperties().getProperty('TARGET_SPREADSHEET_ID');
            if (fallbackId) ss = SpreadsheetApp.openById(fallbackId);
        }
        if (!ss) return;

        var sheet = ss.getSheetByName('BotAnalytics');
        if (!sheet) {
            sheet = ss.insertSheet('BotAnalytics');
            sheet.appendRow(['Timestamp', 'EventType', 'UserId', 'Step', 'Metadata', 'SessionId']);
            sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
            sheet.setFrozenRows(1);
        }

        var step = '';
        var sessionId = '';
        var metaStr = '';

        if (metadata) {
            step = metadata.step || metadata.currentStep || '';
            sessionId = metadata.sessionId || '';
            // Remove step/sessionId from meta before serializing
            var cleanMeta = {};
            for (var k in metadata) {
                if (metadata.hasOwnProperty(k) && k !== 'step' && k !== 'currentStep' && k !== 'sessionId') {
                    cleanMeta[k] = metadata[k];
                }
            }
            metaStr = JSON.stringify(cleanMeta);
            if (metaStr === '{}') metaStr = '';
        }

        sheet.appendRow([
            new Date(),
            eventType || '',
            String(userId || ''),
            step,
            metaStr,
            sessionId
        ]);

    } catch (e) {
        // Silent fail — analytics should never break core flow
        console.warn('Analytics log failed (non-fatal): ' + e.message);
    }
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get bot analytics summary for Dashboard consumption.
 * 
 * @param {object} options - { days: 7, startDate, endDate }
 * @returns {object} Funnel metrics + volume data
 */
function getBotAnalytics(options) {
    try {
        options = options || {};
        var days = options.days || 7;

        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName('BotAnalytics');
        if (!sheet || sheet.getLastRow() < 2) {
            return {
                success: true,
                period: days + ' days',
                totalEvents: 0,
                funnel: { started: 0, completed: 0, conversionRate: '0%' },
                volume: [],
                topDropoffs: []
            };
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        // Filter to date range
        var events = [];
        for (var i = 1; i < data.length; i++) {
            var ts = new Date(data[i][0]);
            if (ts >= cutoff) {
                events.push({
                    timestamp: ts,
                    type: String(data[i][1]),
                    userId: String(data[i][2]),
                    step: String(data[i][3]),
                    metadata: data[i][4] ? String(data[i][4]) : '',
                    sessionId: String(data[i][5])
                });
            }
        }

        // Funnel metrics
        var started = 0, completed = 0, abandoned = 0;
        var stepCounts = {};
        var dailyVolume = {};
        var inlineQueries = 0;

        events.forEach(function (evt) {
            // Count event types
            if (evt.type === 'intake_started') started++;
            if (evt.type === 'intake_completed') completed++;
            if (evt.type === 'intake_abandoned') abandoned++;
            if (evt.type === 'inline_query') inlineQueries++;

            // Step distribution
            if (evt.step) {
                stepCounts[evt.step] = (stepCounts[evt.step] || 0) + 1;
            }

            // Daily volume
            var dateKey = evt.timestamp.toISOString().split('T')[0];
            dailyVolume[dateKey] = (dailyVolume[dateKey] || 0) + 1;
        });

        var conversionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

        // Build volume array (sorted by date)
        var volumeArr = [];
        Object.keys(dailyVolume).sort().forEach(function (date) {
            volumeArr.push({ date: date, events: dailyVolume[date] });
        });

        // Find top drop-off steps
        var dropoffs = [];
        Object.keys(stepCounts).forEach(function (step) {
            dropoffs.push({ step: step, count: stepCounts[step] });
        });
        dropoffs.sort(function (a, b) { return b.count - a.count; });

        return {
            success: true,
            period: days + ' days',
            totalEvents: events.length,
            funnel: {
                started: started,
                completed: completed,
                abandoned: abandoned,
                conversionRate: conversionRate + '%'
            },
            inlineQueries: inlineQueries,
            volume: volumeArr.slice(-14), // Last 14 days max
            topSteps: dropoffs.slice(0, 10)
        };

    } catch (e) {
        console.error('Analytics query error: ' + e.message);
        return { success: false, error: e.message };
    }
}
