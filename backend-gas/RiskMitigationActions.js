/**
 * ============================================================================
 * RiskMitigationActions.js
 * ============================================================================
 * Backend handlers for the Netlify risk mitigation functions:
 *   1. get_unacknowledged_reminders  (engagement-watchdog)
 *   2. escalate_to_cosigner          (engagement-watchdog)
 *   3. get_forfeiture_cases           (daily-briefing forfeiture clock)
 *   4. get_recent_client_messages     (sentiment-watchdog)
 *   5. flag_high_stress_case          (sentiment-watchdog)
 *   + post_slack_message              (shared utility for all Netlify fns)
 *   + get_upcoming_court_dates        (court-reminder)
 *   + send_court_reminders            (court-reminder)
 *   + get_daily_stats                 (daily-briefing)
 *
 * Sheet dependencies:
 *   - IntakeQueue (court dates, defendant info)
 *   - CheckInLog (for geo-fencing)
 *   - ClientUpdates (for sentiment analysis)
 *   - ForfeitureTracker (for forfeiture clock — auto-created)
 *   - CourtReminderLog (for engagement tracking — auto-created)
 *   - PaymentLog (for daily stats)
 */

// ─────────────────────────────────────────────────────
// 1. POST SLACK MESSAGE (used by ALL Netlify functions)
// ─────────────────────────────────────────────────────
function handlePostSlackMessage(data) {
    try {
        var channel = data.channel || '#general';
        var message = data.message || 'No message provided';

        // Try NotificationService.sendSlack first (handles webhook routing)
        if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
            var result = NotificationService.sendSlack(channel, message);
            return { success: result.success, channel: channel };
        }

        // Fallback to sendSlackMessage (from SlackIntegration.js)
        if (typeof sendSlackMessage === 'function') {
            var slackChannel = getConfig().SLACK_WEBHOOK_GENERAL || getConfig().SLACK_WEBHOOK_SHAMROCK;
            if (channel.includes('alert')) {
                slackChannel = getConfig().SLACK_WEBHOOK_ALERTS || slackChannel;
            }
            sendSlackMessage(slackChannel, message, null);
            return { success: true, channel: channel };
        }

        return { success: false, error: 'No Slack integration available' };
    } catch (e) {
        Logger.log('❌ post_slack_message error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// 2. GET UPCOMING COURT DATES (court-reminder.mjs)
// ─────────────────────────────────────────────────────
function handleGetUpcomingCourtDates(data) {
    try {
        var hoursAhead = data.hoursAhead || 48;
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName('IntakeQueue');
        if (!sheet || sheet.getLastRow() <= 1) return { dates: [] };

        var rows = sheet.getDataRange().getValues();
        var headers = rows[0];
        var ci = {};
        headers.forEach(function (h, i) { ci[String(h).toLowerCase().trim()] = i; });

        var now = new Date();
        var cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
        var dates = [];

        for (var r = 1; r < rows.length; r++) {
            var row = rows[r];
            var gv = function (keys) {
                for (var k = 0; k < keys.length; k++) {
                    var idx = ci[keys[k].toLowerCase()];
                    if (idx !== undefined && row[idx]) return String(row[idx]);
                }
                return '';
            };

            var courtDateStr = gv(['CourtDate', 'Court Date', 'courtdate', 'NextCourtDate']);
            if (!courtDateStr) continue;

            var courtDate;
            try { courtDate = new Date(courtDateStr); } catch (e) { continue; }
            if (isNaN(courtDate.getTime())) continue;
            if (courtDate < now || courtDate > cutoff) continue;

            dates.push({
                name: gv(['DefName', 'Def Name', 'defname', 'Defendant Name']),
                phone: gv(['DefPhone', 'Def Phone', 'IndPhone', 'Ind Phone', 'Phone']),
                date: courtDate.toLocaleDateString(),
                time: gv(['CourtTime', 'Court Time', 'courttime']) || courtDate.toLocaleTimeString(),
                location: gv(['Courtroom', 'courtroom', 'Court Room', 'Court Location']) || 'See Court Notice',
                caseNumber: gv(['CaseNumber', 'Case Number', 'casenumber']),
            });
        }

        Logger.log('📅 Found ' + dates.length + ' upcoming court date(s) within ' + hoursAhead + 'hrs');
        return { dates: dates };
    } catch (e) {
        Logger.log('❌ get_upcoming_court_dates error: ' + e.message);
        return { dates: [], error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// 3. SEND COURT REMINDERS (court-reminder.mjs)
// ─────────────────────────────────────────────────────
function handleSendCourtReminders(data) {
    try {
        var reminders = data.reminders || [];
        var sent = 0;

        // Log reminders and send via SMS
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var logSheet = ss.getSheetByName('CourtReminderLog');
        if (!logSheet) {
            logSheet = ss.insertSheet('CourtReminderLog');
            logSheet.appendRow(['Timestamp', 'CaseNumber', 'Name', 'Phone', 'CourtDate', 'Message', 'Acknowledged', 'AcknowledgedAt']);
            logSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
        }

        for (var i = 0; i < reminders.length; i++) {
            var r = reminders[i];
            // Log the reminder
            logSheet.appendRow([
                new Date(),
                r.caseNumber || '',
                r.name || '',
                r.phone || '',
                r.courtDate || '',
                r.message || '',
                'No',
                ''
            ]);

            // Send SMS via NotificationService
            if (r.phone && typeof NotificationService !== 'undefined') {
                try {
                    NotificationService.sendSms(r.phone, r.message);
                    sent++;
                } catch (smsErr) {
                    Logger.log('SMS send failed for ' + r.name + ': ' + smsErr.message);
                }
            }
        }

        Logger.log('📱 Sent ' + sent + '/' + reminders.length + ' court reminders');
        return { success: true, sent: sent, total: reminders.length };
    } catch (e) {
        Logger.log('❌ send_court_reminders error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// 4. GET DAILY STATS (daily-briefing.mjs)
// ─────────────────────────────────────────────────────
function handleGetDailyStats(data) {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var stats = {
            activeBonds: 0,
            newIntakesYesterday: 0,
            pendingSignatures: 0,
            todaysCourtDates: [],
            paymentsDueToday: [],
            overduePayments: 0
        };

        // Count active intakes
        var iq = ss.getSheetByName('IntakeQueue');
        if (iq && iq.getLastRow() > 1) {
            var iqData = iq.getDataRange().getValues();
            var iqHeaders = iqData[0];
            var iqIdx = {};
            iqHeaders.forEach(function (h, i) { iqIdx[String(h).toLowerCase().trim()] = i; });

            var now = new Date();
            var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            var todayStr = now.toLocaleDateString();

            for (var r = 1; r < iqData.length; r++) {
                var row = iqData[r];
                var gv = function (keys) {
                    for (var k = 0; k < keys.length; k++) {
                        var idx = iqIdx[keys[k].toLowerCase()];
                        if (idx !== undefined && row[idx]) return String(row[idx]);
                    }
                    return '';
                };

                var status = gv(['Status', 'status']).toLowerCase();
                if (status === 'active' || status === 'posted' || status === '') stats.activeBonds++;

                // Check timestamp for yesterday's intakes
                var ts = row[iqIdx['timestamp'] || 0];
                if (ts) {
                    var tsDate;
                    try { tsDate = new Date(ts); } catch (e) { tsDate = null; }
                    if (tsDate && tsDate >= yesterday) stats.newIntakesYesterday++;
                }

                // Check court dates for today
                var courtDateStr = gv(['CourtDate', 'Court Date', 'courtdate']);
                if (courtDateStr) {
                    try {
                        var cd = new Date(courtDateStr);
                        if (cd.toLocaleDateString() === todayStr) {
                            stats.todaysCourtDates.push({
                                name: gv(['DefName', 'Def Name', 'defname']),
                                time: gv(['CourtTime', 'Court Time', 'courttime']),
                                courtroom: gv(['Courtroom', 'courtroom']),
                                caseNumber: gv(['CaseNumber', 'Case Number', 'casenumber'])
                            });
                        }
                    } catch (e) { /* skip bad dates */ }
                }
            }
        }

        // Get payment stats
        var paySheet = ss.getSheetByName('PaymentLog');
        if (paySheet && paySheet.getLastRow() > 1) {
            var payData = paySheet.getDataRange().getValues();
            stats.totalPayments = payData.length - 1;
        }

        Logger.log('📊 Daily stats compiled: ' + stats.activeBonds + ' active, ' + stats.todaysCourtDates.length + ' court dates today');
        return stats;
    } catch (e) {
        Logger.log('❌ get_daily_stats error: ' + e.message);
        return { error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// 5. GET UNACKNOWLEDGED REMINDERS (engagement-watchdog.mjs)
// ─────────────────────────────────────────────────────
function handleGetUnacknowledgedReminders(data) {
    try {
        var hoursUntilCourt = data.hoursUntilCourt || 24;
        var ss = SpreadsheetApp.getActiveSpreadsheet();

        // Read from CourtReminderLog
        var logSheet = ss.getSheetByName('CourtReminderLog');
        if (!logSheet || logSheet.getLastRow() <= 1) return { cases: [] };

        var rows = logSheet.getDataRange().getValues();
        var headers = rows[0];
        var ci = {};
        headers.forEach(function (h, i) { ci[String(h).toLowerCase().trim()] = i; });

        var now = new Date();
        var cutoff = new Date(now.getTime() + hoursUntilCourt * 60 * 60 * 1000);
        var cases = [];

        for (var r = 1; r < rows.length; r++) {
            var row = rows[r];
            var ack = String(row[ci['acknowledged'] || 6] || 'No').toLowerCase();
            if (ack === 'yes' || ack === 'true') continue; // Skip acknowledged

            var courtDateStr = String(row[ci['courtdate'] || 4] || '');
            if (!courtDateStr) continue;
            var courtDate;
            try { courtDate = new Date(courtDateStr); } catch (e) { continue; }
            if (isNaN(courtDate.getTime())) continue;
            if (courtDate > cutoff || courtDate < now) continue; // Only within window

            var hoursUntil = Math.round((courtDate.getTime() - now.getTime()) / (60 * 60 * 1000));

            // Get co-signer info from IntakeQueue
            var caseNumber = String(row[ci['casenumber'] || 1] || '');
            var cosignerInfo = getCosignerForCase_(caseNumber);

            cases.push({
                caseNumber: caseNumber,
                defendantName: String(row[ci['name'] || 2] || ''),
                cosignerPhone: cosignerInfo.phone,
                cosignerName: cosignerInfo.name,
                courtDate: courtDate.toLocaleDateString(),
                courtTime: courtDate.toLocaleTimeString(),
                courtLocation: '',
                reminderSentAt: String(row[ci['timestamp'] || 0] || ''),
                hoursUntilCourt: hoursUntil,
                acknowledged: false
            });
        }

        Logger.log('⚠️ Found ' + cases.length + ' unacknowledged reminder(s)');
        return { cases: cases };
    } catch (e) {
        Logger.log('❌ get_unacknowledged_reminders error: ' + e.message);
        return { cases: [], error: e.message };
    }
}

/**
 * Helper: Look up co-signer info from IntakeQueue by case number
 */
function getCosignerForCase_(caseNumber) {
    if (!caseNumber) return { name: '', phone: '' };
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var iq = ss.getSheetByName('IntakeQueue');
        if (!iq || iq.getLastRow() <= 1) return { name: '', phone: '' };

        var rows = iq.getDataRange().getValues();
        var headers = rows[0];
        var ci = {};
        headers.forEach(function (h, i) { ci[String(h).toLowerCase().trim()] = i; });

        for (var r = 1; r < rows.length; r++) {
            var gv = function (keys) {
                for (var k = 0; k < keys.length; k++) {
                    var idx = ci[keys[k].toLowerCase()];
                    if (idx !== undefined && rows[r][idx]) return String(rows[r][idx]);
                }
                return '';
            };
            var cn = gv(['CaseNumber', 'Case Number', 'casenumber']);
            if (cn === caseNumber) {
                return {
                    name: gv(['IndName', 'Ind Name', 'indname', 'Indemnitor']),
                    phone: gv(['IndPhone', 'Ind Phone', 'indphone', 'Indemnitor Phone'])
                };
            }
        }
        return { name: '', phone: '' };
    } catch (e) {
        return { name: '', phone: '' };
    }
}

// ─────────────────────────────────────────────────────
// 6. ESCALATE TO CO-SIGNER (engagement-watchdog.mjs)
// ─────────────────────────────────────────────────────
function handleEscalateToCosigner(data) {
    try {
        var escalations = data.escalations || [];
        var results = { smsCount: 0, slackCount: 0, errors: [] };

        for (var i = 0; i < escalations.length; i++) {
            var esc = escalations[i];

            // 1. Send SMS to co-signer if phone available
            if (esc.cosignerPhone && esc.cosignerSMS) {
                try {
                    NotificationService.sendSms(esc.cosignerPhone, esc.cosignerSMS);
                    results.smsCount++;
                } catch (smsErr) {
                    results.errors.push('SMS failed for ' + esc.caseNumber + ': ' + smsErr.message);
                }
            }

            // 2. Post Slack alert
            if (esc.slackMessage) {
                try {
                    NotificationService.sendSlack('#alerts', esc.slackMessage);
                    results.slackCount++;
                } catch (slackErr) {
                    results.errors.push('Slack failed for ' + esc.caseNumber + ': ' + slackErr.message);
                }
            }
        }

        Logger.log('🚨 Escalated ' + escalations.length + ' case(s): ' + results.smsCount + ' SMS, ' + results.slackCount + ' Slack');
        return { success: true, results: results };
    } catch (e) {
        Logger.log('❌ escalate_to_cosigner error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// 7. GET FORFEITURE CASES (daily-briefing.mjs)
// ─────────────────────────────────────────────────────
function handleGetForfeitureCases(data) {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();

        // Try ForfeitureTracker sheet first
        var sheet = ss.getSheetByName('ForfeitureTracker');
        if (!sheet) {
            // Auto-create the sheet with headers
            sheet = ss.insertSheet('ForfeitureTracker');
            sheet.appendRow([
                'CaseNumber', 'DefendantName', 'BondAmount', 'ForfeitureDate',
                'GracePeriodDays', 'Status', 'Notes', 'LastUpdated'
            ]);
            sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
            Logger.log('📋 Created ForfeitureTracker sheet');
            return { cases: [] }; // Empty on first run
        }

        if (sheet.getLastRow() <= 1) return { cases: [] };

        var rows = sheet.getDataRange().getValues();
        var headers = rows[0];
        var ci = {};
        headers.forEach(function (h, i) { ci[String(h).toLowerCase().trim()] = i; });

        var now = new Date();
        var cases = [];

        for (var r = 1; r < rows.length; r++) {
            var row = rows[r];
            var status = String(row[ci['status'] || 5] || 'active').toLowerCase();
            if (status === 'resolved' || status === 'dismissed') continue;

            var forfDateStr = String(row[ci['forfeituredate'] || 3] || '');
            var graceDays = parseInt(row[ci['graceperioddays'] || 4] || 90, 10); // FL default 90 days
            var forfDate;
            try { forfDate = new Date(forfDateStr); } catch (e) { continue; }
            if (isNaN(forfDate.getTime())) continue;

            // Compute days remaining in grace period
            var graceDeadline = new Date(forfDate.getTime() + graceDays * 24 * 60 * 60 * 1000);
            var daysRemaining = Math.ceil((graceDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (daysRemaining < 0) daysRemaining = 0; // Past deadline

            cases.push({
                caseNumber: String(row[ci['casenumber'] || 0] || ''),
                defendantName: String(row[ci['defendantname'] || 1] || ''),
                bondAmount: parseFloat(row[ci['bondamount'] || 2] || 0),
                forfeitureDate: forfDate.toLocaleDateString(),
                gracePeriodDays: graceDays,
                daysRemaining: daysRemaining,
                status: status
            });
        }

        // Sort by days remaining (most urgent first)
        cases.sort(function (a, b) { return a.daysRemaining - b.daysRemaining; });

        Logger.log('⏰ Found ' + cases.length + ' active forfeiture case(s)');
        return { cases: cases };
    } catch (e) {
        Logger.log('❌ get_forfeiture_cases error: ' + e.message);
        return { cases: [], error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// 8. GET RECENT CLIENT MESSAGES (sentiment-watchdog.mjs)
// ─────────────────────────────────────────────────────
function handleGetRecentClientMessages(data) {
    try {
        var hoursSince = data.hoursSince || 4;
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName('ClientUpdates');
        if (!sheet || sheet.getLastRow() <= 1) return { messages: [] };

        var rows = sheet.getDataRange().getValues();
        var headers = rows[0];
        var ci = {};
        headers.forEach(function (h, i) { ci[String(h).toLowerCase().trim()] = i; });

        var since = new Date(new Date().getTime() - hoursSince * 60 * 60 * 1000);
        var messages = [];

        for (var r = 1; r < rows.length; r++) {
            var row = rows[r];
            var ts = row[ci['timestamp'] || 0];
            if (!ts) continue;
            var tsDate;
            try { tsDate = new Date(ts); } catch (e) { continue; }
            if (tsDate < since) continue;

            // Get the form data which contains the actual message
            var formDataStr = String(row[ci['formdata'] || 6] || '{}');
            var formData;
            try { formData = JSON.parse(formDataStr); } catch (e) { formData = {}; }

            // Extract message content from form data
            var messageContent = formData.tip || formData.message || formData.reason ||
                formData.circumstances || formData.notes || formDataStr;

            // Get reference and case number
            var referenceId = String(row[ci['referenceid'] || 1] || '');

            messages.push({
                caseNumber: referenceId,
                name: String(row[ci['name'] || 4] || ''),
                message: messageContent,
                channel: String(row[ci['source'] || 9] || 'telegram'),
                timestamp: tsDate.toISOString(),
                updateType: String(row[ci['type'] || 2] || '')
            });
        }

        Logger.log('💬 Found ' + messages.length + ' client message(s) in last ' + hoursSince + ' hours');
        return { messages: messages };
    } catch (e) {
        Logger.log('❌ get_recent_client_messages error: ' + e.message);
        return { messages: [], error: e.message };
    }
}

// ─────────────────────────────────────────────────────
// 9. FLAG HIGH STRESS CASE (sentiment-watchdog.mjs)
// ─────────────────────────────────────────────────────
function handleFlagHighStressCase(data) {
    try {
        var flagged = data.flagged || [];
        var ss = SpreadsheetApp.getActiveSpreadsheet();

        // Log to SentimentFlags sheet
        var sheet = ss.getSheetByName('SentimentFlags');
        if (!sheet) {
            sheet = ss.insertSheet('SentimentFlags');
            sheet.appendRow([
                'Timestamp', 'CaseNumber', 'Name', 'Sentiment', 'StressIndicators',
                'Explanation', 'FlightRiskDelta', 'Channel', 'OriginalMessage', 'Reviewed'
            ]);
            sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
        }

        for (var i = 0; i < flagged.length; i++) {
            var f = flagged[i];
            sheet.appendRow([
                new Date(),
                f.caseNumber || '',
                f.name || '',
                f.sentiment || '',
                (f.stressIndicators || []).join(', '),
                f.explanation || '',
                f.flightRiskDelta || 0,
                f.channel || '',
                f.message || '',
                'No'
            ]);
        }

        Logger.log('🧠 Flagged ' + flagged.length + ' high-stress case(s)');
        return { success: true, flaggedCount: flagged.length };
    } catch (e) {
        Logger.log('❌ flag_high_stress_case error: ' + e.message);
        return { success: false, error: e.message };
    }
}
