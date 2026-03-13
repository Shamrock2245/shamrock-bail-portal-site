/**
 * CourtReminderSystem.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Automates daily polling of the Master Intake queue to find upcoming court dates
 * and sends SMS/WhatsApp reminders to Defendants and Indemnitors using Twilio.
 *
 * It logs sent reminders to prevent duplicate notifications.
 */

var CRS_CONFIG = {
    SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
    INTAKE_TAB: 'IntakeQueue',
    LOG_TAB: 'CourtReminderLogs',
    REMINDER_DAYS: [7, 3, 1] // Send reminders 7 days, 3 days, and 1 day before
};

/**
 * Main Trigger Function (Run Daily at 9 AM)
 */
function processDailyCourtReminders() {
    Logger.log('📅 Initiating Daily Court Reminder Check...');
    try {
        var ss = SpreadsheetApp.openById(CRS_CONFIG.SHEET_ID);
        var intakeSheet = ss.getSheetByName(CRS_CONFIG.INTAKE_TAB);

        if (!intakeSheet) {
            Logger.log('❌ Error: IntakeQueue tab not found.');
            return;
        }

        var data = intakeSheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        var logSheet = getOrCreateLogSheet_(ss);
        var sentLogs = loadSentLogs_(logSheet);

        var today = new Date();
        // Reset time to start of day for accurate day-diff calculation
        today.setHours(0, 0, 0, 0);

        var remindersSent = 0;

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var status = String(row[colIdx['status']] || '').trim().toLowerCase();

            // Only remind active bonds
            if (status.indexOf('void') > -1 || status.indexOf('discharge') > -1 || status === 'closed' || status === 'pending') {
                continue;
            }

            var courtDateStr = row[colIdx['courtdate'] || colIdx['court date']];
            if (!courtDateStr) continue;

            var courtDate = new Date(courtDateStr);
            if (isNaN(courtDate.getTime())) continue; // Invalid date

            courtDate.setHours(0, 0, 0, 0);

            var diffTime = courtDate.getTime() - today.getTime();
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (CRS_CONFIG.REMINDER_DAYS.indexOf(diffDays) > -1) {
                var defName = row[colIdx['defname'] || colIdx['def name']] || 'Defendant';
                var defPhone = row[colIdx['defphone'] || colIdx['def phone']];
                var indPhone = row[colIdx['indphone'] || colIdx['ind phone'] || colIdx['phone']];
                var county = row[colIdx['county']] || 'your county';
                var caseNum = row[colIdx['casenumber'] || colIdx['case number']] || 'your case';
                var intakeId = row[colIdx['intakeid'] || colIdx['_id']];

                var logKey = intakeId + '_' + diffDays + 'day';

                // Prevent duplicates
                if (sentLogs[logKey]) continue;

                // Build Message
                var daysText = diffDays === 1 ? 'TOMORROW' : 'in ' + diffDays + ' days';
                var message = `SHAMROCK BAIL BONDS ALERT: ${defName}, you have court ${daysText} (${courtDate.toLocaleDateString()}) for ${county} County (Case: ${caseNum}). Please arrive early and dress appropriately. Reply to this message if you need assistance.`;

                var sentToD = false;
                var sentToI = false;

                // Dispatch via Unified NotificationService
                // (Assuming Twilio handles standard 10DLC SMS. Add WhatsApp syntax later if requested)
                try {
                    if (defPhone && String(defPhone).trim().length >= 10) {
                        // ── Respect Communication Preferences opt-out ──
                        if (typeof checkCommPrefsAllowed === 'function' && !checkCommPrefsAllowed(defPhone, 'sms')) {
                            Logger.log('🚫 Court reminder SMS skipped for defendant — opted out');
                        } else {
                            var resD = NotificationService.sendSms(defPhone, message);
                            if (resD && resD.success) sentToD = true;
                        }
                    }
                } catch (e) { Logger.log('Failed SMS to Defendant: ' + e.message); }

                try {
                    if (indPhone && String(indPhone).trim().length >= 10 && indPhone !== defPhone) {
                        // ── Respect Communication Preferences opt-out ──
                        if (typeof checkCommPrefsAllowed === 'function' && !checkCommPrefsAllowed(indPhone, 'sms')) {
                            Logger.log('🚫 Court reminder SMS skipped for indemnitor — opted out');
                        } else {
                            var resI = NotificationService.sendSms(indPhone, message);
                            if (resI && resI.success) sentToI = true;
                        }
                    }
                } catch (e) { Logger.log('Failed SMS to Indemnitor: ' + e.message); }

                // Log it if at least one succeeded
                if (sentToD || sentToI) {
                    logSheet.appendRow([new Date(), intakeId, defName, diffDays, sentToD ? defPhone : '', sentToI ? indPhone : '']);
                    remindersSent++;
                }
            }
        }

        Logger.log('✅ Daily Court Reminders Complete. Sent: ' + remindersSent);

        if (remindersSent > 0 && typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#alerts', `📢 *Court Reminders Processed:*\nSent ${remindersSent} SMS alerts for upcoming court dates.`);
        }

    } catch (e) {
        Logger.log('❌ Error in processDailyCourtReminders: ' + e.message);
    }
}

/**
 * Loads previously sent reminders into a Map for fast lookup
 */
function loadSentLogs_(logSheet) {
    var logs = {};
    if (logSheet.getLastRow() < 2) return logs;

    var data = logSheet.getDataRange().getValues();
    // Col 2 is IntakeId, Col 4 is Days Diff
    for (var i = 1; i < data.length; i++) {
        var intakeId = data[i][1];
        var diffDays = data[i][3];
        if (intakeId) {
            logs[intakeId + '_' + diffDays + 'day'] = true;
        }
    }
    return logs;
}

/**
 * Creates the Log tab if it doesn't exist
 */
function getOrCreateLogSheet_(ss) {
    var sheet = ss.getSheetByName(CRS_CONFIG.LOG_TAB);
    if (!sheet) {
        sheet = ss.insertSheet(CRS_CONFIG.LOG_TAB);
        sheet.appendRow(['Timestamp', 'IntakeID', 'DefendantName', 'DaysOut', 'SentToDefendant', 'SentToIndemnitor']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
        sheet.setFrozenRows(1);
    }
}

/**
 * Installs the daily trigger for Court Reminders.
 * Run this ONCE to schedule the job.
 */
function installCourtReminderTrigger() {
    Logger.log('⚙️ Installing Court Reminder Trigger...');

    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'processDailyCourtReminders') {
            ScriptApp.deleteTrigger(triggers[i]);
            Logger.log('🗑️ Removed existing Court Reminder trigger');
        }
    }

    // Install new trigger — daily at 9 AM ET
    ScriptApp.newTrigger('processDailyCourtReminders')
        .timeBased()
        .everyDays(1)
        .atHour(9)
        .inTimezone('America/New_York')
        .create();

    Logger.log('✅ Court Reminder trigger installed to run daily around 9 AM ET');
}
