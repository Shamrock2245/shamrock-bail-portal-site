/**
 * PaymentPlanReconciliation.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Automates tracking of expected payment plan revenue against SwipeSimple logs.
 */

var PAYPLAN_CONFIG = {
    SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
    INTAKE_TAB: 'IntakeQueue',
    PAYMENT_LOG_TAB: 'PaymentLog',
    RECONCILIATION_TAB: 'PaymentReconciliation'
};

/**
 * Triggers weekly (or daily) to scan active payment plans and reconcile against PaymentLogs.
 */
function reconcilePaymentPlans() {
    Logger.log('💸 Initiating Payment Plan Reconciliation...');

    try {
        var ss = SpreadsheetApp.openById(PAYPLAN_CONFIG.SHEET_ID);
        var intakeSheet = ss.getSheetByName(PAYPLAN_CONFIG.INTAKE_TAB);
        var paymentSheet = ss.getSheetByName(PAYPLAN_CONFIG.PAYMENT_LOG_TAB);

        if (!intakeSheet || !paymentSheet) {
            Logger.log('❌ Error: Necessary sheets not found.');
            return;
        }

        var intakeData = intakeSheet.getDataRange().getValues();
        var intakeHeaders = intakeData[0];
        var inIdx = {};
        intakeHeaders.forEach(function (h, i) { inIdx[String(h).toLowerCase().trim()] = i; });

        var payData = paymentSheet.getDataRange().getValues();
        var payHeaders = payData[0];
        var payIdx = {};
        payHeaders.forEach(function (h, i) { payIdx[String(h).toLowerCase().trim()] = i; });

        var reconSheet = getOrCreateReconSheet_(ss);

        // Let's clear the recon sheet and rebuild it so it's fresh
        if (reconSheet.getLastRow() > 1) {
            reconSheet.getRange(2, 1, reconSheet.getLastRow() - 1, 9).clearContent();
        }

        var delinquencies = 0;
        var reconRows = [];
        var today = new Date();

        for (var r = 1; r < intakeData.length; r++) {
            var row = intakeData[r];
            var status = String(row[inIdx['status']] || '').trim().toLowerCase();

            // Only examine active accounts
            if (status.indexOf('void') > -1 || status.indexOf('discharge') > -1 || status === 'closed') {
                continue;
            }

            // Check if they are on a payment plan
            var isOnPlan = false;
            // E.g., looking at a 'Payment Plan' column or comparing Received vs Total Premium
            var bondAmount = parseFloat(row[inIdx['bond amount'] || inIdx['liability']]) || 0;
            var premExpected = bondAmount * 0.10; // State minimum 10%

            // Allow override if they specifically listed premium expected
            if (inIdx['premium'] !== undefined) {
                premExpected = parseFloat(row[inIdx['premium']]) || premExpected;
            }

            var phone = String(row[inIdx['indphone'] || inIdx['ind phone'] || inIdx['phone']] || '').replace(/\D/g, '');
            if (phone.length === 10) phone = '1' + phone;

            var defPhone = String(row[inIdx['defphone'] || inIdx['def phone']] || '').replace(/\D/g, '');
            if (defPhone.length === 10) defPhone = '1' + defPhone;

            // Search PaymentLog for all payments associated with either Indemnitor or Defendant Phone
            var totalPaid = 0;
            var lastPaymentDate = 'Never';

            for (var p = 1; p < payData.length; p++) {
                var cPhone = String(payData[p][payIdx['phone']] || '').replace(/\D/g, '');
                if (cPhone.length === 10) cPhone = '1' + cPhone;

                if (cPhone !== '' && (cPhone === phone || cPhone === defPhone || cPhone.slice(-10) === phone.slice(-10))) {
                    totalPaid += parseFloat(payData[p][payIdx['amount']]) || 0;
                    var pDate = new Date(payData[p][payIdx['timestamp']]);
                    if (!isNaN(pDate.getTime())) {
                        if (lastPaymentDate === 'Never' || pDate > lastPaymentDate) {
                            lastPaymentDate = pDate;
                        }
                    }
                }
            }

            var balance = Math.max(0, premExpected - totalPaid);

            // We define a payment plan account as having an outstanding balance > 0
            if (balance > 0) {
                isOnPlan = true;
            }

            if (isOnPlan) {
                var defName = row[inIdx['defname'] || inIdx['def name']] || 'Unknown';
                var indName = row[inIdx['indname'] || inIdx['ind name']] || 'Unknown';
                var targetPhone = (phone.length > 5) ? phone : defPhone;

                var isDelinquent = 'No';

                // Super simple heuristic: If they haven't paid in > 30 days, they are delinquent.
                if (lastPaymentDate === 'Never') {
                    // If execution date is > 14 days ago and no payments...
                    var execDate = new Date(row[inIdx['executiondate'] || inIdx['date']]);
                    if (!isNaN(execDate.getTime())) {
                        var diff = (today.getTime() - execDate.getTime()) / (1000 * 3600 * 24);
                        if (diff > 14) isDelinquent = 'Yes';
                    }
                } else {
                    var diffPaid = (today.getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24);
                    if (diffPaid > 30) isDelinquent = 'Yes';
                }

                if (isDelinquent === 'Yes') delinquencies++;

                var lpdStr = (lastPaymentDate === 'Never') ? 'None' : Utilities.formatDate(lastPaymentDate, 'America/New_York', 'yyyy-MM-dd');

                reconRows.push([
                    row[inIdx['intakeid'] || inIdx['_id']],
                    defName,
                    indName,
                    targetPhone,
                    premExpected.toFixed(2),
                    totalPaid.toFixed(2),
                    balance.toFixed(2),
                    lpdStr,
                    isDelinquent
                ]);
            }
        }

        // Write out the reconciliation report
        if (reconRows.length > 0) {
            reconSheet.getRange(2, 1, reconRows.length, reconRows[0].length).setValues(reconRows);
        }

        Logger.log('✅ Payment Plan Reconciliation Complete.');
        Logger.log(`   Active Accounts: ${reconRows.length} | Delinquent: ${delinquencies}`);

        // Alert staff about high delinquencies
        if (delinquencies > 0 && typeof NotificationService !== 'undefined') {
            NotificationService.sendSlack('#alerts', `💸 *Payment Plan Reconciliation*\nScanned ${reconRows.length} active plans.\nFound *${delinquencies}* delinquent accounts (>30 days since last payment). Check the Reconciliations sheet.`);
        }

        return { success: true, activePlans: reconRows.length, delinquent: delinquencies };

    } catch (e) {
        Logger.log('❌ Error in reconcilePaymentPlans: ' + e.message);
        return { success: false, error: e.message };
    }
}

function getOrCreateReconSheet_(ss) {
    var sheet = ss.getSheetByName(PAYPLAN_CONFIG.RECONCILIATION_TAB);
    if (!sheet) {
        sheet = ss.insertSheet(PAYPLAN_CONFIG.RECONCILIATION_TAB);
        sheet.appendRow(['IntakeID', 'Defendant', 'Indemnitor', 'Phone', 'Total Expected', 'Total Paid', 'Balance', 'Last Payment', 'Delinquent(>30d)']);
        sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
        sheet.setFrozenRows(1);
    }
    return sheet;
}

/**
 * Installs the weekly trigger for Payment Plan Reconciliation.
 * Run this ONCE to schedule the job.
 */
function installPaymentPlanReconTrigger() {
    Logger.log('⚙️ Installing Payment Plan Recon Trigger...');

    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'reconcilePaymentPlans') {
            ScriptApp.deleteTrigger(triggers[i]);
            Logger.log('🗑️ Removed existing Payment Plan Recon trigger');
        }
    }

    // Install new trigger — Weekly on Fridays at 2 PM ET
    ScriptApp.newTrigger('reconcilePaymentPlans')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.FRIDAY)
        .atHour(14)
        .inTimezone('America/New_York')
        .create();

    Logger.log('✅ Payment Plan Recon trigger installed for Fridays around 2 PM ET');
}
