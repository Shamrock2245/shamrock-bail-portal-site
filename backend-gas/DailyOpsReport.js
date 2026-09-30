/**
 * DailyOpsReport.js
 * Shamrock Bail Bonds — Daily Operations Summary Bot
 *
 * Every morning at 7 AM ET, sends a Telegram message to the staff channel
 * summarizing the last 24 hours of activity.
 *
 * Report includes:
 *   1. New arrests overnight (count + top 3 by bond amount)
 *   2. Pending intakes (count + oldest)
 *   3. Court dates today
 *   4. Payment plans due this week
 *   5. Bot analytics snapshot (yesterday's conversion rate)
 *   6. Active bonds summary (county breakdown)
 *
 * Trigger: setupDailyOpsReportTrigger() → runs daily at 7 AM ET
 *
 * Dependencies:
 *   - StatsService.js (getCountyStats)
 *   - Telegram_Analytics.js (getBotAnalytics)
 *   - Telegram_API.js (TelegramBotAPI)
 *
 * Date: 2026-02-27
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var OPS_CONFIG = {
    // Sheet names
    ARRESTS_SHEET: 'Arrests',
    INTAKE_SHEET: 'IntakeQueue',
    COURT_DATES_SHEET: 'CourtDates',
    PAYMENT_PLANS_SHEET: 'PaymentPlans',
    CASES_SHEET: 'Cases',

    // Report window
    LOOKBACK_HOURS: 24,

    // Max items to list in each section
    MAX_ARRESTS_LISTED: 3,
    MAX_INTAKES_LISTED: 3,
    MAX_COURT_DATES_LISTED: 5,
    MAX_PAYMENTS_LISTED: 5,

    // Staff Telegram channel ID (Script Property: STAFF_TELEGRAM_CHAT_ID)
    STAFF_CHANNEL_PROP: 'STAFF_TELEGRAM_CHAT_ID',
};

// =============================================================================
// MAIN REPORT FUNCTION
// =============================================================================

/**
 * Generate and send the daily ops report.
 * Called by the time-driven trigger at 7 AM ET.
 */
function sendDailyOpsReport() {
    Logger.log('═══════════════════════════════════════════');
    Logger.log('📊 DAILY OPS REPORT — Generating...');
    Logger.log('═══════════════════════════════════════════');

    try {
        var report = _buildOpsReport();
        var sent = _sendReportToStaff(report);

        Logger.log('✅ Daily Ops Report sent: ' + (sent ? 'SUCCESS' : 'FAILED'));
        return { success: sent, reportLength: report.length };
    } catch (error) {
        Logger.log('❌ Daily Ops Report failed: ' + error.message);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// REPORT BUILDER
// =============================================================================

/**
 * Build the full ops report as a formatted string.
 * @returns {string} - Formatted Telegram message
 */
function _buildOpsReport() {
    var ss = SpreadsheetApp.getActiveSpreadsheet() || (function() {
        var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E';
        return SpreadsheetApp.openById(id);
    })();
    var now = new Date();
    var lookbackMs = OPS_CONFIG.LOOKBACK_HOURS * 60 * 60 * 1000;
    var since = new Date(now.getTime() - lookbackMs);

    var lines = [];

    // ── HEADER ──
    lines.push('📊 *SHAMROCK BAIL BONDS — DAILY OPS*');
    lines.push('📅 ' + _formatDate(now) + ' | 7 AM Report');
    lines.push('');

    // ── SECTION 1: NEW ARRESTS ──
    var arrestsSection = _buildArrestsSection(ss, since);
    lines.push(arrestsSection);

    // ── SECTION 2: PENDING INTAKES ──
    var intakesSection = _buildIntakesSection(ss, since);
    lines.push(intakesSection);

    // ── SECTION 3: COURT DATES TODAY ──
    var courtSection = _buildCourtDatesSection(ss, now);
    lines.push(courtSection);

    // ── SECTION 4: PAYMENT PLANS DUE THIS WEEK ──
    var paymentsSection = _buildPaymentsSection(ss, now);
    lines.push(paymentsSection);

    // ── SECTION 5: BOT ANALYTICS ──
    var analyticsSection = _buildAnalyticsSection(since, now);
    lines.push(analyticsSection);

    // ── SECTION 6: ACTIVE BONDS SUMMARY ──
    var bondsSection = _buildActiveBondsSection(ss);
    lines.push(bondsSection);

    // ── FOOTER ──
    lines.push('');
    lines.push('─────────────────────────────');
    lines.push('🍀 _Shamrock Bail Bonds Automation_');
    lines.push('_Reply HELP to this channel for commands_');

    return lines.join('\n');
}

// =============================================================================
// SECTION BUILDERS
// =============================================================================

/**
 * Section 1: New arrests in the last 24 hours.
 */
function _buildArrestsSection(ss, since) {
    var lines = [];
    lines.push('🚔 *NEW ARRESTS (Last 24h)*');

    try {
        var sheet = ss.getSheetByName(OPS_CONFIG.ARRESTS_SHEET);
        if (!sheet || sheet.getLastRow() <= 1) {
            lines.push('  No arrest data available.');
            lines.push('');
            return lines.join('\n');
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = _buildColIdx(headers);

        var newArrests = [];
        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var timestamp = _dorGetVal(row, colIdx, ['timestamp', 'date', 'created', 'arrest date']);
            if (!timestamp) continue;

            var arrestDate;
            try {
                arrestDate = new Date(timestamp);
                if (isNaN(arrestDate.getTime())) continue;
            } catch (e) { continue; }

            if (arrestDate.getTime() >= since.getTime()) {
                var bondAmt = parseFloat(String(_dorGetVal(row, colIdx, ['bond', 'bond amount', 'bail', 'bail amount']) || '0').replace(/[^0-9.]/g, '')) || 0;
                newArrests.push({
                    name: _dorGetVal(row, colIdx, ['name', 'defendant name', 'defname']) || 'Unknown',
                    county: _dorGetVal(row, colIdx, ['county']) || 'Unknown',
                    charge: _dorGetVal(row, colIdx, ['charge', 'charges', 'offense']) || 'Unknown',
                    bondAmount: bondAmt,
                    timestamp: arrestDate
                });
            }
        }

        // Sort by bond amount descending
        newArrests.sort(function (a, b) { return b.bondAmount - a.bondAmount; });

        lines.push('  Total: *' + newArrests.length + '* new arrest(s)');

        if (newArrests.length > 0) {
            lines.push('  Top ' + Math.min(OPS_CONFIG.MAX_ARRESTS_LISTED, newArrests.length) + ' by bond:');
            for (var i = 0; i < Math.min(OPS_CONFIG.MAX_ARRESTS_LISTED, newArrests.length); i++) {
                var a = newArrests[i];
                lines.push('  • ' + a.name + ' — ' + a.county + ' — $' + _dorFormatMoney(a.bondAmount));
            }
        }

    } catch (e) {
        lines.push('  ⚠️ Error reading arrests: ' + e.message);
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * Section 2: Pending intakes.
 */
function _buildIntakesSection(ss, since) {
    var lines = [];
    lines.push('📋 *PENDING INTAKES*');

    try {
        var sheet = ss.getSheetByName(OPS_CONFIG.INTAKE_SHEET);
        if (!sheet || sheet.getLastRow() <= 1) {
            lines.push('  No intake data.');
            lines.push('');
            return lines.join('\n');
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = _buildColIdx(headers);

        var pending = [];
        var newToday = 0;

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var status = String(_dorGetVal(row, colIdx, ['status']) || '').toLowerCase().trim();
            if (['completed', 'signed', 'active', 'posted', 'declined', 'closed', 'processed'].indexOf(status) !== -1) continue;

            var timestamp = _dorGetVal(row, colIdx, ['timestamp', 'date', 'created']);
            var intakeDate;
            try {
                intakeDate = new Date(timestamp);
            } catch (e) { intakeDate = null; }

            var name = _dorGetVal(row, colIdx, ['indname', 'ind name', 'name']) || 'Unknown';
            var phone = _dorGetVal(row, colIdx, ['indphone', 'ind phone', 'phone']) || '';
            var defName = _dorGetVal(row, colIdx, ['defname', 'def name', 'defendant']) || 'Unknown';

            pending.push({
                name: name,
                defName: defName,
                phone: phone,
                date: intakeDate,
                ageHours: intakeDate ? Math.floor((new Date().getTime() - intakeDate.getTime()) / 3600000) : null
            });

            if (intakeDate && intakeDate.getTime() >= since.getTime()) {
                newToday++;
            }
        }

        // Sort by oldest first
        pending.sort(function (a, b) {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.getTime() - b.date.getTime();
        });

        lines.push('  Total pending: *' + pending.length + '* | New today: *' + newToday + '*');

        if (pending.length > 0) {
            lines.push('  Oldest ' + Math.min(OPS_CONFIG.MAX_INTAKES_LISTED, pending.length) + ':');
            for (var i = 0; i < Math.min(OPS_CONFIG.MAX_INTAKES_LISTED, pending.length); i++) {
                var p = pending[i];
                var ageStr = p.ageHours !== null ? ' (' + p.ageHours + 'h old)' : '';
                lines.push('  • ' + p.name + ' → ' + p.defName + ageStr);
            }
        }

    } catch (e) {
        lines.push('  ⚠️ Error reading intakes: ' + e.message);
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * Section 3: Court dates today.
 */
function _buildCourtDatesSection(ss, now) {
    var lines = [];
    lines.push('⚖️ *COURT DATES TODAY*');

    try {
        var sheet = ss.getSheetByName(OPS_CONFIG.COURT_DATES_SHEET);
        if (!sheet || sheet.getLastRow() <= 1) {
            lines.push('  No court date data.');
            lines.push('');
            return lines.join('\n');
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = _buildColIdx(headers);

        var todayStr = _formatDateShort(now);
        var todayDates = [];

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var courtDate = _dorGetVal(row, colIdx, ['court date', 'courtdate', 'date', 'hearing date']);
            if (!courtDate) continue;

            var dateStr = _formatDateShort(new Date(courtDate));
            if (dateStr !== todayStr) continue;

            var status = String(_dorGetVal(row, colIdx, ['status']) || '').toLowerCase();
            if (['appeared', 'dismissed', 'closed'].indexOf(status) !== -1) continue;

            todayDates.push({
                name: _dorGetVal(row, colIdx, ['defendant', 'name', 'defname']) || 'Unknown',
                caseNumber: _dorGetVal(row, colIdx, ['case number', 'casenumber', 'case#']) || '',
                time: _dorGetVal(row, colIdx, ['time', 'court time']) || '',
                courtroom: _dorGetVal(row, colIdx, ['courtroom', 'location', 'court']) || '',
                county: _dorGetVal(row, colIdx, ['county']) || ''
            });
        }

        if (todayDates.length === 0) {
            lines.push('  ✅ No court dates today.');
        } else {
            lines.push('  *' + todayDates.length + '* appearance(s) today:');
            for (var i = 0; i < Math.min(OPS_CONFIG.MAX_COURT_DATES_LISTED, todayDates.length); i++) {
                var d = todayDates[i];
                var timeStr = d.time ? ' @ ' + d.time : '';
                var caseStr = d.caseNumber ? ' | #' + d.caseNumber : '';
                lines.push('  • ' + d.name + timeStr + caseStr);
            }
            if (todayDates.length > OPS_CONFIG.MAX_COURT_DATES_LISTED) {
                lines.push('  ... and ' + (todayDates.length - OPS_CONFIG.MAX_COURT_DATES_LISTED) + ' more');
            }
        }

    } catch (e) {
        lines.push('  ⚠️ Error reading court dates: ' + e.message);
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * Section 4: Payment plans due this week.
 */
function _buildPaymentsSection(ss, now) {
    var lines = [];
    lines.push('💰 *PAYMENTS DUE THIS WEEK*');

    try {
        var sheet = ss.getSheetByName(OPS_CONFIG.PAYMENT_PLANS_SHEET);
        if (!sheet || sheet.getLastRow() <= 1) {
            lines.push('  No payment plan data.');
            lines.push('');
            return lines.join('\n');
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = _buildColIdx(headers);

        var weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        var dueSoon = [];
        var overdue = [];

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var status = String(_dorGetVal(row, colIdx, ['status']) || '').toLowerCase();
            if (['paid', 'closed', 'cancelled'].indexOf(status) !== -1) continue;

            var dueDate = _dorGetVal(row, colIdx, ['next due date', 'nextduedate', 'due date', 'duedate']);
            if (!dueDate) continue;

            var dueDateObj;
            try {
                dueDateObj = new Date(dueDate);
                if (isNaN(dueDateObj.getTime())) continue;
            } catch (e) { continue; }

            var name = _dorGetVal(row, colIdx, ['name', 'client name', 'indemnitor']) || 'Unknown';
            var amount = parseFloat(String(_dorGetVal(row, colIdx, ['next due amount', 'nextdueamount', 'amount']) || '0').replace(/[^0-9.]/g, '')) || 0;

            if (dueDateObj.getTime() < now.getTime()) {
                overdue.push({ name: name, amount: amount, dueDate: dueDateObj });
            } else if (dueDateObj.getTime() <= weekEnd.getTime()) {
                dueSoon.push({ name: name, amount: amount, dueDate: dueDateObj });
            }
        }

        if (overdue.length === 0 && dueSoon.length === 0) {
            lines.push('  ✅ No payments due this week.');
        } else {
            if (overdue.length > 0) {
                lines.push('  🔴 *Overdue:* ' + overdue.length);
                for (var i = 0; i < Math.min(3, overdue.length); i++) {
                    lines.push('  • ' + overdue[i].name + ' — $' + _dorFormatMoney(overdue[i].amount) + ' (was ' + _formatDateShort(overdue[i].dueDate) + ')');
                }
            }
            if (dueSoon.length > 0) {
                lines.push('  🟡 *Due this week:* ' + dueSoon.length);
                for (var i = 0; i < Math.min(OPS_CONFIG.MAX_PAYMENTS_LISTED, dueSoon.length); i++) {
                    lines.push('  • ' + dueSoon[i].name + ' — $' + _dorFormatMoney(dueSoon[i].amount) + ' on ' + _formatDateShort(dueSoon[i].dueDate));
                }
            }
        }

    } catch (e) {
        lines.push('  ⚠️ Error reading payment plans: ' + e.message);
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * Section 5: Bot analytics snapshot.
 */
function _buildAnalyticsSection(since, now) {
    var lines = [];
    lines.push('🤖 *BOT ANALYTICS (Yesterday)*');

    try {
        if (typeof getBotAnalytics === 'function') {
            var analytics = getBotAnalytics({
                startDate: since,
                endDate: now
            });

            if (analytics && analytics.summary) {
                var s = analytics.summary;
                lines.push('  Sessions: *' + (s.totalSessions || 0) + '*');
                lines.push('  Intakes started: *' + (s.intakesStarted || 0) + '*');
                lines.push('  Intakes completed: *' + (s.intakesCompleted || 0) + '*');

                var convRate = s.intakesStarted > 0
                    ? Math.round((s.intakesCompleted / s.intakesStarted) * 100) + '%'
                    : 'N/A';
                lines.push('  Conversion rate: *' + convRate + '*');

                if (s.signingLinksOpened !== undefined) {
                    lines.push('  Signing links opened: *' + s.signingLinksOpened + '*');
                }
                if (s.documentsSigned !== undefined) {
                    lines.push('  Documents signed: *' + s.documentsSigned + '*');
                }
            } else {
                lines.push('  No analytics data for this period.');
            }
        } else {
            // Fallback: read from BotAnalytics sheet directly
            var ss = SpreadsheetApp.getActiveSpreadsheet();
            var analyticsSheet = ss.getSheetByName('BotAnalytics');
            if (analyticsSheet && analyticsSheet.getLastRow() > 1) {
                var data = analyticsSheet.getDataRange().getValues();
                var headers = data[0];
                var colIdx = _buildColIdx(headers);

                var sessions = 0;
                var intakesStarted = 0;
                var intakesCompleted = 0;

                for (var r = 1; r < data.length; r++) {
                    var ts = _dorGetVal(data[r], colIdx, ['timestamp', 'date']);
                    if (!ts) continue;
                    var tsDate;
                    try { tsDate = new Date(ts); } catch (e) { continue; }
                    if (tsDate.getTime() < since.getTime()) continue;

                    var eventType = String(_dorGetVal(data[r], colIdx, ['event', 'event type', 'eventtype']) || '').toLowerCase();
                    if (eventType === 'session_start' || eventType === 'message') sessions++;
                    if (eventType === 'intake_start') intakesStarted++;
                    if (eventType === 'intake_complete') intakesCompleted++;
                }

                lines.push('  Sessions: *' + sessions + '*');
                lines.push('  Intakes started: *' + intakesStarted + '*');
                lines.push('  Intakes completed: *' + intakesCompleted + '*');
            } else {
                lines.push('  Analytics not available.');
            }
        }
    } catch (e) {
        lines.push('  ⚠️ Error reading analytics: ' + e.message);
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * Section 6: Active bonds summary.
 */
function _buildActiveBondsSection(ss) {
    var lines = [];
    lines.push('🏛️ *ACTIVE BONDS*');

    try {
        var sheet = ss.getSheetByName(OPS_CONFIG.CASES_SHEET);
        if (!sheet || sheet.getLastRow() <= 1) {
            lines.push('  No cases data.');
            lines.push('');
            return lines.join('\n');
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = _buildColIdx(headers);

        var countByCounty = {};
        var totalActive = 0;
        var totalPremium = 0;

        for (var r = 1; r < data.length; r++) {
            var row = data[r];
            var status = String(_dorGetVal(row, colIdx, ['status']) || '').toLowerCase();
            if (['closed', 'discharged', 'forfeited', 'cancelled'].indexOf(status) !== -1) continue;

            var county = String(_dorGetVal(row, colIdx, ['county']) || 'Unknown');
            var premium = parseFloat(String(_dorGetVal(row, colIdx, ['premium', 'bond premium', 'amount']) || '0').replace(/[^0-9.]/g, '')) || 0;

            countByCounty[county] = (countByCounty[county] || 0) + 1;
            totalActive++;
            totalPremium += premium;
        }

        lines.push('  Total active: *' + totalActive + '* | Premium: *$' + _dorFormatMoney(totalPremium) + '*');

        // County breakdown
        var counties = Object.keys(countByCounty).sort(function (a, b) {
            return countByCounty[b] - countByCounty[a];
        });
        if (counties.length > 0) {
            var countyLine = counties.slice(0, 5).map(function (c) {
                return c + ': ' + countByCounty[c];
            }).join(' | ');
            lines.push('  ' + countyLine);
        }

    } catch (e) {
        lines.push('  ⚠️ Error reading cases: ' + e.message);
    }

    lines.push('');
    return lines.join('\n');
}

// =============================================================================
// DELIVERY
// =============================================================================

/**
 * Send the report to the staff Telegram channel.
 * @param {string} reportText - Formatted report text
 * @returns {boolean} - true if sent successfully
 */
function _sendReportToStaff(reportText) {
    try {
        var client = new TelegramBotAPI();
        if (!client.isConfigured()) {
            Logger.log('⚠️ Telegram not configured — cannot send daily ops report');
            return false;
        }

        var staffChatId = _dorGetConfigSafe(OPS_CONFIG.STAFF_CHANNEL_PROP);
        if (!staffChatId) {
            Logger.log('⚠️ STAFF_TELEGRAM_CHAT_ID not set in Script Properties');
            return false;
        }

        var result = client.sendMessage(staffChatId, reportText, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });

        return result && result.success;
    } catch (e) {
        Logger.log('❌ Error sending report: ' + e.message);
        return false;
    }
}

// =============================================================================
// TRIGGER SETUP
// =============================================================================

/**
 * Install the daily 7 AM trigger for the ops report.
 * Run this ONCE in the GAS editor.
 */
function setupDailyOpsReportTrigger() {
    // Remove existing triggers to prevent duplicates
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function (t) {
        if (t.getHandlerFunction() === 'sendDailyOpsReport') {
            ScriptApp.deleteTrigger(t);
            Logger.log('🗑️ Removed existing Daily Ops Report trigger');
        }
    });

    // Install new trigger — daily at 7 AM ET
    ScriptApp.newTrigger('sendDailyOpsReport')
        .timeBased()
        .everyDays(1)
        .atHour(7)
        .inTimezone('America/New_York')
        .create();

    Logger.log('✅ Daily Ops Report trigger installed');
    Logger.log('   Function: sendDailyOpsReport()');
    Logger.log('   Schedule: Daily at 7 AM ET');
    Logger.log('   Staff Channel: ' + (_dorGetConfigSafe(OPS_CONFIG.STAFF_CHANNEL_PROP) || 'NOT SET — add STAFF_TELEGRAM_CHAT_ID to Script Properties'));

    return { success: true, schedule: 'Daily at 7 AM ET' };
}

/**
 * Manually run the report for testing.
 */
function testDailyOpsReport() {
    Logger.log('🧪 TEST RUN — Daily Ops Report');
    return sendDailyOpsReport();
}

// =============================================================================
// HELPERS
// =============================================================================

function _buildColIdx(headers) {
    var idx = {};
    headers.forEach(function (h, i) { idx[String(h).toLowerCase().trim()] = i; });
    return idx;
}

function _dorGetVal(row, colIdx, keys) {
    for (var k = 0; k < keys.length; k++) {
        var i = colIdx[keys[k].toLowerCase()];
        if (i !== undefined && row[i] !== undefined && row[i] !== '') return row[i];
    }
    return null;
}

function _formatDate(date) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function _formatDateShort(date) {
    if (!date || isNaN(date.getTime())) return 'N/A';
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}

function _dorFormatMoney(amount) {
    if (!amount && amount !== 0) return '0';
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function _dorGetConfigSafe(key) {
    try {
        if (typeof getConfig === 'function') {
            var cfg = getConfig();
            if (cfg && cfg[key]) return cfg[key];
        }
        return PropertiesService.getScriptProperties().getProperty(key);
    } catch (e) {
        return null;
    }
}
