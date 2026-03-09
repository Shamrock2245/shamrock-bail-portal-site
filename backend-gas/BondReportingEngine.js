/**
 * BondReportingEngine.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Automates the generation of liability reports, agent commissions,
 * and void/discharge reconciliations to replicate the core features
 * of legacy software like Captira and Bail Books.
 */

var BRE_CONFIG = {
    // Uses the main database spreadsheet
    SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',

    // Core data tabs
    INTAKE_TAB: 'IntakeQueue',
    BOND_INVENTORY_TAB: 'BondInventory', // Used to track power numbers

    // Reporting tabs (Will be created if missing)
    REPORT_LIABILITY_TAB: 'Report_Liability',
    REPORT_COMMISSION_TAB: 'Report_Commissions',

    // Commission Structure (Example - can be parameterized)
    COMMISSION_RATE: 0.20, // 20% of premium
    PREMIUM_RATE: 0.10,    // 10% of bond amount (Florida standard)

    // Notification
    ADMIN_EMAIL: 'admin@shamrockbailbonds.biz'
};

/**
 * Generates a real-time Weekly Liability Report.
 * Reads active bonds, calculates total exposure, and groups by county.
 */
function generateWeeklyLiabilityReport() {
    try {
        Logger.log('📊 Generating Weekly Liability Report...');
        var ss = SpreadsheetApp.openById(BRE_CONFIG.SHEET_ID);
        var intakeSheet = ss.getSheetByName(BRE_CONFIG.INTAKE_TAB);

        if (!intakeSheet || intakeSheet.getLastRow() < 2) {
            Logger.log('⚠️ IntakeQueue is empty or missing.');
            return;
        }

        var data = intakeSheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        var activeLiability = 0;
        var countyStats = {};
        var executionDateCutoff = new Date();
        executionDateCutoff.setDate(executionDateCutoff.getDate() - 7); // Last 7 days

        var recentExecutions = 0;
        var recentLiability = 0;

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var status = String(row[colIdx['status']] || '').trim().toLowerCase();

            // Only count bonds that are executed/active (not voided/discharged or purely pending)
            // Depending on the exact workflow, 'signed', 'completed', 'active' might be used.
            if (status.indexOf('void') > -1 || status.indexOf('discharge') > -1 || status.indexOf('forfeit') > -1) {
                continue;
            }
            if (status === 'pending' || status === 'initiated') {
                continue; // Not yet executed
            }

            var bondAmount = parseFloat(row[colIdx['bondamt'] || colIdx['bond amount']]) || 0;
            var county = String(row[colIdx['county']] || 'Unknown').trim();
            var timestamp = new Date(row[colIdx['timestamp'] || 0]);

            if (bondAmount > 0) {
                activeLiability += bondAmount;

                if (!countyStats[county]) {
                    countyStats[county] = { count: 0, liability: 0 };
                }
                countyStats[county].count++;
                countyStats[county].liability += bondAmount;

                // Track volume for the past 7 days
                if (timestamp >= executionDateCutoff) {
                    recentExecutions++;
                    recentLiability += bondAmount;
                }
            }
        }

        Logger.log('✅ Total Active Liability: $' + activeLiability.toLocaleString());
        Logger.log('✅ Recent (7 Day) Executions: ' + recentExecutions + ' bonds, $' + recentLiability.toLocaleString());

        // Save to Report Sheet
        var reportSheet = ss.getSheetByName(BRE_CONFIG.REPORT_LIABILITY_TAB);
        if (!reportSheet) {
            reportSheet = ss.insertSheet(BRE_CONFIG.REPORT_LIABILITY_TAB);
            reportSheet.appendRow(['Report Date', 'Total Active Liability', '7-Day Executions', '7-Day Liability Volume', 'County Breakdown']);
            reportSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
            reportSheet.setFrozenRows(1);
        }

        var breakdownStr = Object.keys(countyStats).map(function (c) {
            return c + ': ' + countyStats[c].count + ' ($' + countyStats[c].liability.toLocaleString() + ')';
        }).join(' | ');

        reportSheet.appendRow([
            new Date(),
            activeLiability,
            recentExecutions,
            recentLiability,
            breakdownStr
        ]);

        return {
            success: true,
            totalLiability: activeLiability,
            recentLiability: recentLiability,
            breakdown: countyStats
        };

    } catch (e) {
        Logger.log('❌ Error generating liability report: ' + e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Calculates agent commissions based on executed bonds in a date range.
 * Simulates standard 1099 reporting (Agent -> Surety/Company)
 */
function generateAgentCommissionReport(month, year) {
    try {
        Logger.log('💰 Generating Agent Commission Report...');
        var ss = SpreadsheetApp.openById(BRE_CONFIG.SHEET_ID);
        var intakeSheet = ss.getSheetByName(BRE_CONFIG.INTAKE_TAB);

        if (!intakeSheet) return { success: false, error: 'IntakeQueue missing' };

        var data = intakeSheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        var targetMonth = month !== undefined ? month : new Date().getMonth();
        var targetYear = year !== undefined ? year : new Date().getFullYear();

        var agentStats = {};
        var totalCommissions = 0;

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var timestamp = new Date(row[colIdx['timestamp'] || 0]);

            // Filter by month/year
            if (timestamp.getMonth() !== targetMonth || timestamp.getFullYear() !== targetYear) {
                continue;
            }

            var status = String(row[colIdx['status']] || '').trim().toLowerCase();
            // Only pay commissions on completed/executed bonds
            if (status.indexOf('void') > -1 || status === 'pending' || status === 'initiated') {
                continue;
            }

            var bondAmount = parseFloat(row[colIdx['bondamt'] || colIdx['bond amount']]) || 0;
            var agentName = String(row[colIdx['agent'] || colIdx['postingagent']] || 'House Account').trim();

            if (bondAmount > 0) {
                var premium = bondAmount * BRE_CONFIG.PREMIUM_RATE;
                var commission = premium * BRE_CONFIG.COMMISSION_RATE;

                if (!agentStats[agentName]) {
                    agentStats[agentName] = { bondCount: 0, totalLiability: 0, totalPremium: 0, commissionDue: 0 };
                }

                agentStats[agentName].bondCount++;
                agentStats[agentName].totalLiability += bondAmount;
                agentStats[agentName].totalPremium += premium;
                agentStats[agentName].commissionDue += commission;

                totalCommissions += commission;
            }
        }

        // Save to Report Sheet
        var reportSheet = ss.getSheetByName(BRE_CONFIG.REPORT_COMMISSION_TAB);
        if (!reportSheet) {
            reportSheet = ss.insertSheet(BRE_CONFIG.REPORT_COMMISSION_TAB);
            reportSheet.appendRow(['Report Period', 'Agent', 'Bonds Written', 'Total Liability', 'Total Premium', 'Commission Due', 'Generated On']);
            reportSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
            reportSheet.setFrozenRows(1);
        }

        var periodStr = (targetMonth + 1) + '/' + targetYear;
        var runDate = new Date();

        Object.keys(agentStats).forEach(function (agent) {
            var stats = agentStats[agent];
            reportSheet.appendRow([
                periodStr,
                agent,
                stats.bondCount,
                stats.totalLiability,
                stats.totalPremium,
                stats.commissionDue,
                runDate
            ]);
        });

        Logger.log('✅ Commission calculation complete. Total Due: $' + totalCommissions.toLocaleString());
        return { success: true, period: periodStr, agentStats: agentStats, totalCommissions: totalCommissions };

    } catch (e) {
        Logger.log('❌ Error generating commission report: ' + e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Generates a Reconciliation Report for Voided or Discharged Bonds.
 * Helps balance the total liability by finding bonds that are no longer active.
 */
function generateVoidDischargeReconciliation(daysBack) {
    try {
        Logger.log('📉 Generating Void/Discharge Reconciliation Report...');
        var ss = SpreadsheetApp.openById(BRE_CONFIG.SHEET_ID);
        var intakeSheet = ss.getSheetByName(BRE_CONFIG.INTAKE_TAB);

        if (!intakeSheet) return { success: false, error: 'IntakeQueue missing' };

        var data = intakeSheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        var lookbackDays = daysBack || 30; // Default to last 30 days
        var cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

        var reconciledCount = 0;
        var totalLiabilityCleared = 0;
        var reconciledDetails = [];

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var status = String(row[colIdx['status']] || '').trim().toLowerCase();
            var timestamp = new Date(row[colIdx['timestamp'] || 0]);

            // We are looking for bonds specifically marked as 'void', 'discharged', or 'closed' recently
            if (status.indexOf('void') > -1 || status.indexOf('discharge') > -1 || status === 'closed') {
                if (timestamp >= cutoffDate) {
                    var bondAmount = parseFloat(row[colIdx['bondamt'] || colIdx['bond amount']]) || 0;
                    var fullName = String(row[colIdx['defname'] || colIdx['def name']] || 'Unknown');
                    var caseNumber = String(row[colIdx['casenumber'] || colIdx['case number']] || 'Unknown');

                    reconciledCount++;
                    totalLiabilityCleared += bondAmount;

                    reconciledDetails.push({
                        name: fullName,
                        caseNumber: caseNumber,
                        amount: bondAmount,
                        status: status,
                        date: timestamp
                    });
                }
            }
        }

        Logger.log('✅ Reconciled ' + reconciledCount + ' bonds. Liability Cleared: $' + totalLiabilityCleared.toLocaleString());

        // We could write this to a new tab like 'Report_Reconciliation'
        var reportSheet = ss.getSheetByName('Report_Reconciliation');
        if (!reportSheet) {
            reportSheet = ss.insertSheet('Report_Reconciliation');
            reportSheet.appendRow(['Report Date', 'Bonds Reconciled', 'Total Liability Cleared', 'Lookback Days']);
            reportSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
            reportSheet.setFrozenRows(1);
        }

        reportSheet.appendRow([
            new Date(),
            reconciledCount,
            totalLiabilityCleared,
            lookbackDays
        ]);

        return {
            success: true,
            reconciledCount: reconciledCount,
            totalCleared: totalLiabilityCleared,
            details: reconciledDetails
        };

    } catch (e) {
        Logger.log('❌ Error generating Void/Discharge report: ' + e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Endpoint for Dashboard to trigger reporting functions
 */
function api_generateReporting(action, payload) {
    if (action === 'liability') {
        return generateWeeklyLiabilityReport();
    } else if (action === 'commissions') {
        return generateAgentCommissionReport(payload.month, payload.year);
    } else if (action === 'reconciliation') {
        return generateVoidDischargeReconciliation(payload.daysBack);
    }
    return { success: false, error: 'Unknown reporting action' };
}
