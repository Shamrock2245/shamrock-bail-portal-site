/**
 * HistoricalBondMonitor.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Cross-references daily arrest scrapes and court-email forfeitures against
 * the HistoricalBonds sheet (~1 000 records, 2014-2017).
 *
 * When a match is found ("repeat offender"), multi-channel alerts fire:
 *   • Email  → admin@shamrockbailbonds.biz, shamrockbailoffice@gmail.com
 *   • SMS    → 239-955-0178
 *   • Telegram → Staff group (TELEGRAM_CHAT_ID)
 *   • Slack  → #new-arrests-lee-county
 *   • Sheet  → RepeatOffenderAlerts tab
 *
 * Public API:
 *   checkArrestsForRepeatOffenders(countyName)   — called from scrapers
 *   checkForfeitureForHistoricalBond(forfData)    — called from CourtEmailProcessor
 *   runDailyRepeatOffenderScan()                  — daily time-trigger safety net
 *   setupRepeatOffenderTrigger()                  — installs the daily trigger
 *   testHistoricalBondIndex()                     — manual verification
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var HBM_CONFIG = {
    // Historical bonds sheet (same spreadsheet the scrapers use)
    SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
    HISTORICAL_TAB: 'HistoricalBonds',
    ALERTS_TAB: 'RepeatOffenderAlerts',

    // Alert recipients
    EMAIL_TO: 'admin@shamrockbailbonds.biz,shamrockbailoffice@gmail.com',
    SMS_TO: '2399550178',

    // Minimum first-name prefix length for fuzzy matching
    FIRST_NAME_PREFIX_LEN: 3,

    // County sheet names (must match scraper tabs)
    COUNTY_TABS: {
        'Lee': 'Lee',
        'Collier': 'Collier'
    },

    // How far back (hours) to look for "new" arrests in the daily batch scan
    LOOKBACK_HOURS: 26
};

// ============================================================================
// HISTORICAL BOND INDEX  (in-memory lookup)
// ============================================================================

/**
 * Build a Map keyed by normalised last name.
 * Each value is an array of bond records for that surname.
 *
 * @returns {{ index: Map<string, Object[]>, count: number }}
 */
function loadHistoricalBondIndex() {
    var ss = SpreadsheetApp.openById(HBM_CONFIG.SHEET_ID);
    var tab = ss.getSheetByName(HBM_CONFIG.HISTORICAL_TAB);
    if (!tab) {
        Logger.log('⚠️ HistoricalBonds tab not found');
        return { index: new Map(), count: 0 };
    }

    var lastRow = tab.getLastRow();
    if (lastRow < 2) return { index: new Map(), count: 0 };

    // Columns: First Name | Last Name | Bond Date | Power Number | Liability Amount | Premium Amount | Source File
    var data = tab.getRange(2, 1, lastRow - 1, 7).getValues();
    var index = new Map();

    for (var i = 0; i < data.length; i++) {
        var firstName = normName_(data[i][0]);
        var lastName = normName_(data[i][1]);
        if (!lastName) continue;

        var record = {
            firstName: firstName,
            lastName: lastName,
            bondDate: data[i][2],
            powerNumber: normPower_(data[i][3]),
            liabilityAmount: data[i][4],
            premiumAmount: data[i][5],
            sourceFile: data[i][6]
        };

        var key = lastName.toUpperCase();
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(record);
    }

    Logger.log('📚 Historical Bond Index: ' + index.size + ' unique surnames, ' + data.length + ' total records');
    return { index: index, count: data.length };
}

// ============================================================================
// ARREST CROSS-REFERENCE
// ============================================================================

/**
 * Called by ArrestScraper_LeeCounty / ArrestScraper_CollierCounty
 * after new rows are written.
 *
 * Reads today's new arrests from the county tab and checks each against
 * the historical bond index.
 *
 * @param {string} countyName - 'Lee' or 'Collier'
 */
function checkArrestsForRepeatOffenders(countyName) {
    try {
        Logger.log('🔍 Checking ' + countyName + ' County arrests for repeat offenders...');

        var result = loadHistoricalBondIndex();
        if (result.count === 0) {
            Logger.log('⚠️ No historical bonds loaded — skipping');
            return;
        }
        var index = result.index;

        // Read the county sheet
        var tabName = HBM_CONFIG.COUNTY_TABS[countyName] || countyName;
        var ss = SpreadsheetApp.openById(HBM_CONFIG.SHEET_ID);
        var sheet = ss.getSheetByName(tabName);
        if (!sheet || sheet.getLastRow() < 2) return;

        // Headers: same order as scrapers write (see headers_() in each scraper)
        // Index 5 = First_Name, 7 = Last_Name, 2 = Booking_Number,
        // 22 = Charges, 23 = Bond_Amount, 9 = Booking_Date, 4 = Full_Name, 0 = Scrape_Timestamp
        var allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 32).getValues();

        // Only check rows scraped within the lookback window
        var cutoff = new Date(Date.now() - HBM_CONFIG.LOOKBACK_HOURS * 3600000);
        var matchCount = 0;

        for (var i = 0; i < allData.length; i++) {
            var scrapeTs = allData[i][0];
            if (scrapeTs instanceof Date && scrapeTs < cutoff) continue;

            var arrestFirstName = normName_(allData[i][5]);
            var arrestLastName = normName_(allData[i][7]);
            if (!arrestLastName) continue;

            var key = arrestLastName.toUpperCase();
            if (!index.has(key)) continue;

            // Fuzzy first-name check
            var candidates = index.get(key);
            var matches = [];
            for (var j = 0; j < candidates.length; j++) {
                if (fuzzyFirstNameMatch_(arrestFirstName, candidates[j].firstName)) {
                    matches.push(candidates[j]);
                }
            }

            if (matches.length > 0) {
                matchCount++;
                var arrestData = {
                    type: 'arrest',
                    county: countyName,
                    fullName: allData[i][4] || (arrestLastName + ', ' + arrestFirstName),
                    firstName: arrestFirstName,
                    lastName: arrestLastName,
                    bookingNumber: allData[i][2],
                    charges: allData[i][22],
                    bondAmount: allData[i][23],
                    bookingDate: allData[i][9],
                    detailUrl: allData[i][31],
                    historicalBonds: matches
                };

                fireRepeatOffenderAlert(arrestData);
            }
        }

        Logger.log('✅ Repeat offender scan complete: ' + matchCount + ' match(es) in ' + countyName + ' County');
    } catch (e) {
        Logger.log('❌ checkArrestsForRepeatOffenders error: ' + e.message);
    }
}

// ============================================================================
// FORFEITURE CROSS-REFERENCE
// ============================================================================

/**
 * Called by CourtEmailProcessor.processForfeitureEmail() after extracting
 * forfeiture data.
 *
 * @param {Object} forfData - { defendant, caseNumber, amount, forfeitureDate, powerNumber }
 */
function checkForfeitureForHistoricalBond(forfData) {
    try {
        if (!forfData) return;
        Logger.log('🔍 Checking forfeiture for historical bond match...');

        var result = loadHistoricalBondIndex();
        if (result.count === 0) return;
        var index = result.index;

        var matches = [];
        var normPower = normPower_(forfData.powerNumber);

        // Strategy 1: Power Number match (strongest signal)
        if (normPower && normPower !== 'UNKNOWN') {
            index.forEach(function (records) {
                records.forEach(function (rec) {
                    if (rec.powerNumber === normPower) {
                        matches.push(rec);
                    }
                });
            });
        }

        // Strategy 2: Name match fallback
        if (matches.length === 0 && forfData.defendant) {
            var parts = parseName_(forfData.defendant);
            if (parts.lastName) {
                var key = parts.lastName.toUpperCase();
                if (index.has(key)) {
                    var candidates = index.get(key);
                    for (var j = 0; j < candidates.length; j++) {
                        if (fuzzyFirstNameMatch_(parts.firstName, candidates[j].firstName)) {
                            matches.push(candidates[j]);
                        }
                    }
                }
            }
        }

        if (matches.length > 0) {
            Logger.log('🚨 FORFEITURE matches ' + matches.length + ' historical bond(s)!');
            fireRepeatOffenderAlert({
                type: 'forfeiture',
                county: '',
                fullName: forfData.defendant,
                caseNumber: forfData.caseNumber,
                forfeitureAmount: forfData.amount,
                forfeitureDate: forfData.forfeitureDate,
                powerNumber: forfData.powerNumber,
                historicalBonds: matches
            });
        } else {
            Logger.log('ℹ️ No historical bond match for forfeiture');
        }
    } catch (e) {
        Logger.log('❌ checkForfeitureForHistoricalBond error: ' + e.message);
    }
}

// ============================================================================
// MULTI-CHANNEL ALERT DISPATCHER
// ============================================================================

/**
 * Fire alerts on all channels for a repeat offender match.
 *
 * @param {Object} match - Contains type, name, arrest/forfeiture details, historicalBonds[]
 */
function fireRepeatOffenderAlert(match) {
    Logger.log('🚨 REPEAT OFFENDER ALERT: ' + match.fullName + ' (' + match.type + ')');

    var textMsg = formatRepeatOffenderText_(match);
    var htmlMsg = formatRepeatOffenderHtml_(match);
    var subject = match.type === 'forfeiture'
        ? '🚨 FORFEITURE ON HISTORICAL BOND — ' + match.fullName
        : '🚨 REPEAT OFFENDER DETECTED — ' + match.fullName;

    // 1. EMAIL
    try {
        NotificationService.sendEmail(HBM_CONFIG.EMAIL_TO, subject, textMsg, htmlMsg);
        Logger.log('📧 Email alert sent');
    } catch (e) { Logger.log('⚠️ Email failed: ' + e.message); }

    // 2. SMS
    try {
        NotificationService.sendSms(HBM_CONFIG.SMS_TO, textMsg.substring(0, 1500));
        Logger.log('📱 SMS alert sent to ' + HBM_CONFIG.SMS_TO);
    } catch (e) { Logger.log('⚠️ SMS failed: ' + e.message); }

    // 3. TELEGRAM (Staff group)
    try {
        var chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
        if (chatId) {
            NotificationService.sendTelegram(chatId, textMsg);
            Logger.log('📲 Telegram alert sent');
        }
    } catch (e) { Logger.log('⚠️ Telegram failed: ' + e.message); }

    // 4. SLACK
    try {
        NotificationService.sendSlack('#new-arrests-lee-county', textMsg);
        Logger.log('💬 Slack alert sent');
    } catch (e) { Logger.log('⚠️ Slack failed: ' + e.message); }

    // 5. SHEET — RepeatOffenderAlerts tab
    try {
        appendToAlertSheet_(match);
        Logger.log('📊 Alert logged to RepeatOffenderAlerts sheet');
    } catch (e) { Logger.log('⚠️ Sheet logging failed: ' + e.message); }
}

// ============================================================================
// DAILY BATCH SCAN (Safety net trigger)
// ============================================================================

/**
 * Scans all county sheets for arrests added in the last LOOKBACK_HOURS.
 * Intended to run via daily time-driven trigger as redundancy.
 */
function runDailyRepeatOffenderScan() {
    Logger.log('═══════════════════════════════════════');
    Logger.log('🔍 Daily Repeat Offender Scan');
    Logger.log('═══════════════════════════════════════');

    var counties = Object.keys(HBM_CONFIG.COUNTY_TABS);
    for (var i = 0; i < counties.length; i++) {
        checkArrestsForRepeatOffenders(counties[i]);
    }

    Logger.log('═══════════════════════════════════════');
    Logger.log('✅ Daily scan complete');
    Logger.log('═══════════════════════════════════════');
}

/**
 * Install a daily time-driven trigger to run the repeat offender scan.
 */
function setupRepeatOffenderTrigger() {
    // Remove existing
    ScriptApp.getProjectTriggers().forEach(function (t) {
        if (t.getHandlerFunction() === 'runDailyRepeatOffenderScan') {
            ScriptApp.deleteTrigger(t);
        }
    });

    ScriptApp.newTrigger('runDailyRepeatOffenderScan')
        .timeBased()
        .everyDays(1)
        .atHour(6) // 6 AM ET
        .create();

    Logger.log('⏰ Installed daily trigger for runDailyRepeatOffenderScan (6 AM)');
}

// ============================================================================
// MESSAGE FORMATTERS
// ============================================================================

function formatRepeatOffenderText_(match) {
    var lines = [];

    if (match.type === 'forfeiture') {
        lines.push('🚨 FORFEITURE ON HISTORICAL BOND 🚨');
        lines.push('');
        lines.push('Defendant: ' + (match.fullName || 'Unknown'));
        lines.push('Case: ' + (match.caseNumber || 'N/A'));
        lines.push('Forfeiture Amount: $' + (match.forfeitureAmount || 'N/A'));
        if (match.forfeitureDate) {
            lines.push('Forfeiture Date: ' + (match.forfeitureDate instanceof Date ? match.forfeitureDate.toDateString() : match.forfeitureDate));
        }
        if (match.powerNumber) lines.push('Power Number: ' + match.powerNumber + ' ← MATCH FOUND');
    } else {
        lines.push('🚨 REPEAT OFFENDER DETECTED 🚨');
        lines.push('');
        lines.push('Name: ' + (match.fullName || 'Unknown'));
        lines.push('New Arrest: Booking #' + (match.bookingNumber || 'N/A') + ' (' + match.county + ' County)');
        if (match.charges) lines.push('Charges: ' + String(match.charges).substring(0, 200));
        if (match.bondAmount) lines.push('Bond: $' + match.bondAmount);
    }

    // Bond history
    var bonds = match.historicalBonds || [];
    lines.push('');
    lines.push('⚡ BOND HISTORY (' + bonds.length + ' previous bond' + (bonds.length !== 1 ? 's' : '') + '):');

    var totalLiability = 0;
    for (var i = 0; i < bonds.length; i++) {
        var b = bonds[i];
        var dateStr = b.bondDate instanceof Date ? Utilities.formatDate(b.bondDate, 'America/New_York', 'MM/dd/yyyy') : (b.bondDate || 'N/A');
        var amt = parseFloat(b.liabilityAmount) || 0;
        totalLiability += amt;
        lines.push('  • ' + dateStr + ' — ' + (b.powerNumber || 'N/A') + ' — $' + amt.toLocaleString());
    }

    lines.push('');
    lines.push('Total Historical Liability: $' + totalLiability.toLocaleString());

    if (match.type === 'forfeiture') {
        lines.push('');
        lines.push('⚠️ IMMEDIATE ACTION REQUIRED');
    }

    lines.push('');
    lines.push('— Shamrock Bail Bonds Alert System');

    return lines.join('\n');
}

function formatRepeatOffenderHtml_(match) {
    var text = formatRepeatOffenderText_(match);
    // Simple HTML conversion: escape, newlines → <br>
    return '<div style="font-family:monospace;white-space:pre-wrap;line-height:1.6;">' +
        text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') +
        '</div>';
}

// ============================================================================
// ALERT SHEET LOGGER
// ============================================================================

function appendToAlertSheet_(match) {
    var ss = SpreadsheetApp.openById(HBM_CONFIG.SHEET_ID);
    var tab = ss.getSheetByName(HBM_CONFIG.ALERTS_TAB);

    if (!tab) {
        tab = ss.insertSheet(HBM_CONFIG.ALERTS_TAB);
        tab.getRange(1, 1, 1, 10).setValues([[
            'Timestamp', 'Alert Type', 'Name', 'County', 'Booking/Case',
            'Charges', 'New Bond Amount', 'Historical Bonds Count',
            'Total Historical Liability', 'Details'
        ]]);
        tab.setFrozenRows(1);
        // Bold header
        tab.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#FF6B6B').setFontColor('#FFFFFF');
    }

    var bonds = match.historicalBonds || [];
    var totalLiability = 0;
    var details = [];
    for (var i = 0; i < bonds.length; i++) {
        totalLiability += (parseFloat(bonds[i].liabilityAmount) || 0);
        details.push((bonds[i].powerNumber || 'N/A') + ' ($' + (bonds[i].liabilityAmount || 0) + ')');
    }

    tab.appendRow([
        new Date(),
        match.type === 'forfeiture' ? 'FORFEITURE' : 'ARREST',
        match.fullName || '',
        match.county || '',
        match.type === 'forfeiture' ? (match.caseNumber || '') : (match.bookingNumber || ''),
        match.charges ? String(match.charges).substring(0, 500) : '',
        match.type === 'forfeiture' ? (match.forfeitureAmount || '') : (match.bondAmount || ''),
        bonds.length,
        totalLiability,
        details.join(' | ')
    ]);
}

// ============================================================================
// NAME / MATCHING UTILITIES
// ============================================================================

/**
 * Normalise a name: trim, collapse whitespace, uppercase.
 */
function normName_(v) {
    if (v == null || v === '') return '';
    return String(v).trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Normalise a power number: strip whitespace, uppercase.
 */
function normPower_(v) {
    if (v == null || v === '') return '';
    return String(v).trim().replace(/\s+/g, '').toUpperCase();
}

/**
 * Fuzzy first-name match.
 * Returns true if either name starts with the other's first N chars.
 * Handles "Rob" vs "Robert", "Mike" vs "Michael", etc.
 */
function fuzzyFirstNameMatch_(name1, name2) {
    if (!name1 || !name2) return false;
    var a = name1.toUpperCase();
    var b = name2.toUpperCase();
    if (a === b) return true;

    var prefixLen = HBM_CONFIG.FIRST_NAME_PREFIX_LEN;
    var aPrefix = a.substring(0, prefixLen);
    var bPrefix = b.substring(0, prefixLen);

    return a.indexOf(bPrefix) === 0 || b.indexOf(aPrefix) === 0;
}

/**
 * Parse "LAST, FIRST" or "FIRST LAST" format defendant name.
 */
function parseName_(fullName) {
    if (!fullName) return { firstName: '', lastName: '' };
    var s = String(fullName).trim();

    // "LAST, FIRST MIDDLE"
    if (s.indexOf(',') > -1) {
        var parts = s.split(',');
        return {
            lastName: normName_(parts[0]),
            firstName: normName_((parts[1] || '').split(' ')[0])
        };
    }

    // "FIRST LAST"
    var words = s.split(/\s+/);
    if (words.length >= 2) {
        return {
            firstName: normName_(words[0]),
            lastName: normName_(words[words.length - 1])
        };
    }

    return { firstName: '', lastName: normName_(s) };
}

// ============================================================================
// TEST / VERIFICATION
// ============================================================================

/**
 * Manual test: verify the historical bond index loads and find known names.
 */
function testHistoricalBondIndex() {
    var result = loadHistoricalBondIndex();
    Logger.log('Total records: ' + result.count);
    Logger.log('Unique surnames: ' + result.index.size);

    // Sample lookup
    var testNames = ['ROCA', 'SMITH', 'JOHNSON', 'WILLIAMS'];
    for (var i = 0; i < testNames.length; i++) {
        var found = result.index.get(testNames[i]);
        Logger.log('  ' + testNames[i] + ': ' + (found ? found.length + ' record(s)' : 'NOT FOUND'));
    }
}

/**
 * Manual test: simulate a repeat offender arrest to verify all alert channels.
 */
function testRepeatOffenderAlert() {
    fireRepeatOffenderAlert({
        type: 'arrest',
        county: 'Lee',
        fullName: 'TEST PERSON — IGNORE',
        firstName: 'TEST',
        lastName: 'PERSON',
        bookingNumber: 'TEST-0000',
        charges: 'Test Alert — Please Ignore',
        bondAmount: '0',
        bookingDate: new Date().toISOString(),
        historicalBonds: [{
            firstName: 'TEST',
            lastName: 'PERSON',
            bondDate: '2014-01-01',
            powerNumber: 'TEST-000',
            liabilityAmount: 10000,
            premiumAmount: 1000,
            sourceFile: 'test'
        }]
    });
    Logger.log('✅ Test alert fired — check Email, SMS, Telegram, Slack, and Sheet');
}
