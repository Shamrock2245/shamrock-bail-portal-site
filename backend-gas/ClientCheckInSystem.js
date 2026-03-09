/**
 * ClientCheckInSystem.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Automates weekly check-ins for active clients via WhatsApp/SMS
 * and tracks their responses.
 */

var CCIS_CONFIG = {
    SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
    INTAKE_TAB: 'IntakeQueue',
    LOG_TAB: 'CheckInLogs',
    INTERVAL_DAYS: 7 // Check-in interval
};

/**
 * Triggered Weekly or Bi-weekly (Depending on schedule setup).
 * Sends a check-in link or standard message to active, open bonds.
 */
function sendAutomatedCheckIns() {
    Logger.log('📱 Initiating Automated Client Check-Ins...');

    try {
        var ss = SpreadsheetApp.openById(CCIS_CONFIG.SHEET_ID);
        var intakeSheet = ss.getSheetByName(CCIS_CONFIG.INTAKE_TAB);

        if (!intakeSheet) {
            Logger.log('❌ Error: IntakeQueue tab not found.');
            return;
        }

        var data = intakeSheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        var logSheet = getOrCreateCheckInLogSheet_(ss);
        var checkInLogs = loadCheckInLogs_(logSheet);
        var today = new Date();

        var checkInsSent = 0;

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var status = String(row[colIdx['status']] || '').trim().toLowerCase();

            // Only check in active bonds
            if (status.indexOf('void') > -1 || status.indexOf('discharge') > -1 || status === 'closed' || status === 'pending') {
                continue;
            }

            var intakeId = row[colIdx['intakeid'] || colIdx['_id']];
            if (!intakeId) continue;

            // Basic throttling: Ensure they haven't been checked in within CCIS_CONFIG.INTERVAL_DAYS
            var lastCheckInDate = checkInLogs[intakeId];
            if (lastCheckInDate) {
                var diffTime = today.getTime() - lastCheckInDate.getTime();
                var diffDays = diffTime / (1000 * 3600 * 24);
                if (diffDays < CCIS_CONFIG.INTERVAL_DAYS) {
                    continue; // Skip, checked in recently
                }
            }

            var defName = row[colIdx['defname'] || colIdx['def name']] || 'Client';
            var defPhone = row[colIdx['defphone'] || colIdx['def phone']];
            var bondAmount = row[colIdx['bond amount'] || colIdx['liability']] || '0';

            // We only send automated check-ins if there's a defendant phone
            // OR we can default to Indemnitor if required by agency policy
            var targetPhone = defPhone;
            if (!targetPhone || String(targetPhone).trim().length < 10) {
                // Fallback to Indemnitor?
                targetPhone = row[colIdx['indphone'] || colIdx['ind phone'] || colIdx['phone']];
            }

            if (!targetPhone || String(targetPhone).trim().length < 10) continue;

            // Construct Magic Check-In Link (or simple reply request)
            var message = `SHAMROCK BAIL BONDS CHECK-IN:\nHi ${defName}, this is your automated weekly check-in. Please reply "1" to confirm you are in town, or reply "2" if you need to speak with an agent. Thank you.`;

            var sent = false;
            try {
                // Use the Unified Notification Service
                var res = NotificationService.sendSms(targetPhone, message);
                if (res && res.success) sent = true;
            } catch (e) {
                Logger.log('Failed Check-In SMS: ' + e.message);
            }

            if (sent) {
                logSheet.appendRow([today, intakeId, defName, targetPhone, 'SENT', 'Pending']);
                checkInsSent++;
            }
        }

        Logger.log('✅ Daily Check-Ins Processed. Sent: ' + checkInsSent);

        if (checkInsSent > 0 && typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#alerts', `📍 *Automated Check-Ins:*\nDispatched ${checkInsSent} weekly check-in texts to active clients.`);
        }

    } catch (e) {
        Logger.log('❌ Error in sendAutomatedCheckIns: ' + e.message);
    }
}

/**
 * Handle incoming replies to check-ins (Webhook endpoint logic)
 * This expects to be called from the Twilio/WhatsApp webhook receiver in Code.js
 */
function handleClientCheckInReply(fromNumber, body) {
    Logger.log('📥 Received Check-In Reply from ' + fromNumber + ': ' + body);

    // In a full DB environment, we'd look up the `fromNumber` in the DB.
    // For Google Sheets, we scan the logs.
    try {
        var ss = SpreadsheetApp.openById(CCIS_CONFIG.SHEET_ID);
        var logSheet = ss.getSheetByName(CCIS_CONFIG.LOG_TAB);
        if (!logSheet) return;

        var data = logSheet.getDataRange().getValues();
        var foundRow = -1;
        var intakeId = 'Unknown';
        var clientName = 'Unknown Client';

        // Scan backwards to find the MOST RECENT check in for this number
        for (var i = data.length - 1; i > 0; i--) {
            var loggedPhone = String(data[i][3]).replace(/\D/g, '');
            var incomingPhone = String(fromNumber).replace(/\D/g, '');

            // Weak equivalence match (last 10 digits)
            if (incomingPhone.indexOf(loggedPhone.slice(-10)) > -1 || loggedPhone.indexOf(incomingPhone.slice(-10)) > -1) {
                foundRow = i + 1; // 1-indexed for Sheets
                intakeId = data[i][1];
                clientName = data[i][2];
                break;
            }
        }

        var responseFlag = (body === '1') ? 'Checked In' : (body === '2' ? 'Requested Agent' : 'Custom Reply: ' + body);

        if (foundRow > -1) {
            // Update the log: Col 6 is Reply Status
            logSheet.getRange(foundRow, 6).setValue(responseFlag);
        }

        // Always alert staff if they ask for an agent or send weird stuff
        if (body !== '1' && typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#alerts', `🚨 *Check-In Alert | ${clientName}*\nThey replied: "${body}"\nPhone: ${fromNumber}`);
        } else if (body === '1' && typeof NotificationService !== 'undefined') {
            // Optional: Log success to intake channel without pinging everyone
            NotificationService.sendSlack('#intake', `📍 ${clientName} successfully checked in.`);
        }

    } catch (e) {
        Logger.log('❌ Error in handleClientCheckInReply: ' + e.message);
    }
}

/**
 * Returns a dictionary of { IntakeId: LastCheckInDate }
 */
function loadCheckInLogs_(logSheet) {
    var logs = {};
    if (logSheet.getLastRow() < 2) return logs;

    var data = logSheet.getDataRange().getValues();
    // Col 2 is IntakeId, Col 1 is Date
    for (var i = 1; i < data.length; i++) {
        var date = new Date(data[i][0]);
        var intakeId = data[i][1];
        if (intakeId && !isNaN(date.getTime())) {
            // Store the most recent date
            if (!logs[intakeId] || logs[intakeId] < date) {
                logs[intakeId] = date;
            }
        }
    }
    return logs;
}

function getOrCreateCheckInLogSheet_(ss) {
    var sheet = ss.getSheetByName(CCIS_CONFIG.LOG_TAB);
    if (!sheet) {
        sheet = ss.insertSheet(CCIS_CONFIG.LOG_TAB);
        sheet.appendRow(['Timestamp', 'IntakeID', 'DefendantName', 'TargetPhone', 'Status', 'Reply']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
        sheet.setFrozenRows(1);
    }
    return sheet;
}

/**
 * Installs the weekly trigger for Automated Client Check-Ins.
 * Run this ONCE to schedule the job.
 */
function installClientCheckInTrigger() {
    Logger.log('⚙️ Installing Client Check-In Trigger...');

    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'sendAutomatedCheckIns') {
            ScriptApp.deleteTrigger(triggers[i]);
            Logger.log('🗑️ Removed existing Client Check-In trigger');
        }
    }

    // Install new trigger — Weekly on Sundays at 11 AM ET
    ScriptApp.newTrigger('sendAutomatedCheckIns')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.SUNDAY)
        .atHour(11)
        .inTimezone('America/New_York')
        .create();

    Logger.log('✅ Client Check-In trigger installed for Sundays around 11 AM ET');
}
