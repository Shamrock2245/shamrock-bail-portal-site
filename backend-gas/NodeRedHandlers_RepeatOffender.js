/**
 * NodeRedHandlers_RepeatOffender.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Handlers called by the Node-RED "Repeat Offender Alerts" tab.
 * These supplement HistoricalBondMonitor.js with dedup-aware writes,
 * cosigner lookup, and outreach capabilities.
 *
 * ACTIONS (routed via Code.js doPost / handleGetAction):
 *   - lookupCosigners          — Search Posted Bonds / Cases for indemnitor info
 *   - writeRepeatOffenderAlerts — Write deduped rows to RepeatOffenderAlerts sheet
 *   - sendRepeatOffenderOutreach — SMS cosigners about re-arrested defendants
 *   - runDripCampaign           — Execute a drip follow-up campaign (The Closer)
 *   - getCommPreferences        — Return comm prefs for a phone number (read-only)
 *
 * Date: 2026-03-17
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var NR_REPEAT_CONFIG = {
    SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
    ALERTS_TAB: 'RepeatOffenderAlerts',
    POSTED_BONDS_TAB: 'Posted Bonds',

    // Columns in Posted Bonds (0-indexed) — adjust if your schema differs
    PB_DEFENDANT_NAME_COL: 1,   // B: Defendant Name
    PB_INDEMNITOR_NAME_COL: 5,  // F: Indemnitor/Cosigner Name
    PB_INDEMNITOR_PHONE_COL: 6, // G: Indemnitor Phone
    PB_INDEMNITOR_EMAIL_COL: 7, // H: Indemnitor Email
    PB_BOND_NUMBER_COL: 0,      // A: Bond/Power Number
    PB_CASE_ID_COL: 2           // C: Case ID
};

// =============================================================================
// 1. LOOKUP COSIGNERS
// =============================================================================

/**
 * Search Posted Bonds sheet for indemnitor/cosigner info by defendant name.
 *
 * @param {Object} data - { defendantNames: string[] }
 * @returns {Object} - { success, cosigners: { "NAME": { indemnitorName, indemnitorPhone, ... } } }
 */
function handleLookupCosigners(data) {
    try {
        var names = data.defendantNames || [];
        if (!names.length) return { success: true, cosigners: {} };

        var ss = SpreadsheetApp.openById(NR_REPEAT_CONFIG.SHEET_ID);
        var sheet = ss.getSheetByName(NR_REPEAT_CONFIG.POSTED_BONDS_TAB);

        var result = {};

        if (sheet && sheet.getLastRow() > 1) {
            var allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();

            for (var n = 0; n < names.length; n++) {
                var searchName = String(names[n]).toUpperCase().trim();
                result[searchName] = null; // Default: not found

                for (var r = 0; r < allData.length; r++) {
                    var rowName = String(allData[r][NR_REPEAT_CONFIG.PB_DEFENDANT_NAME_COL] || '').toUpperCase().trim();
                    if (rowName === searchName || rowName.indexOf(searchName) > -1 || searchName.indexOf(rowName) > -1) {
                        var indemnitorName = String(allData[r][NR_REPEAT_CONFIG.PB_INDEMNITOR_NAME_COL] || '').trim();
                        var indemnitorPhone = String(allData[r][NR_REPEAT_CONFIG.PB_INDEMNITOR_PHONE_COL] || '').trim();

                        if (indemnitorName || indemnitorPhone) {
                            result[searchName] = {
                                indemnitorName: indemnitorName,
                                indemnitorPhone: indemnitorPhone,
                                indemnitorEmail: String(allData[r][NR_REPEAT_CONFIG.PB_INDEMNITOR_EMAIL_COL] || '').trim(),
                                bondNumber: String(allData[r][NR_REPEAT_CONFIG.PB_BOND_NUMBER_COL] || '').trim(),
                                caseId: String(allData[r][NR_REPEAT_CONFIG.PB_CASE_ID_COL] || '').trim()
                            };
                            break; // Use most recent match
                        }
                    }
                }
            }
        }

        Logger.log('🔍 Cosigner lookup: ' + names.length + ' searched, ' +
            Object.values(result).filter(function(v) { return v !== null; }).length + ' found');

        return { success: true, cosigners: result };

    } catch (e) {
        Logger.log('❌ handleLookupCosigners error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 2. WRITE DEDUPED REPEAT OFFENDER ALERTS
// =============================================================================

/**
 * Write ONLY new (deduplicated) alerts to the RepeatOffenderAlerts sheet.
 * Dedup key: uppercase(Name) + Booking#
 *
 * @param {Object} data - { alerts: [{ timestamp, alertType, name, county, booking, charges, bondAmount, historicalBonds, totalLiability, details }] }
 * @returns {Object} - { success, written, skipped }
 */
function handleWriteRepeatOffenderAlerts(data) {
    try {
        var alerts = data.alerts || [];
        if (!alerts.length) return { success: true, written: 0, skipped: 0 };

        var ss = SpreadsheetApp.openById(NR_REPEAT_CONFIG.SHEET_ID);
        var sheet = ss.getSheetByName(NR_REPEAT_CONFIG.ALERTS_TAB);

        if (!sheet) {
            sheet = ss.insertSheet(NR_REPEAT_CONFIG.ALERTS_TAB);
            sheet.getRange(1, 1, 1, 10).setValues([['Timestamp', 'Alert Type', 'Name', 'County', 'Booking/Case', 'Charges', 'New Bond Amount', 'Historical Bonds Count', 'Total Historical Liability', 'Details']]);
            sheet.setFrozenRows(1);
            sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#FF6B6B').setFontColor('#FFFFFF');
        }

        // Load existing entries for dedup
        var existingKeys = new Set();
        if (sheet.getLastRow() > 1) {
            var existing = sheet.getRange(2, 3, sheet.getLastRow() - 1, 3).getValues(); // Name (col 3) + Booking (col 5)
            for (var i = 0; i < existing.length; i++) {
                var name = String(existing[i][0] || '').toUpperCase().trim();
                var booking = String(existing[i][2] || '').trim();
                if (name && booking) existingKeys.add(name + '|' + booking);
            }
        }

        var written = 0;
        var skipped = 0;

        for (var a = 0; a < alerts.length; a++) {
            var alert = alerts[a];
            var dedupKey = String(alert.name || '').toUpperCase().trim() + '|' + String(alert.booking || '').trim();

            if (existingKeys.has(dedupKey)) {
                skipped++;
                continue;
            }

            sheet.appendRow([
                alert.timestamp || new Date(),
                alert.alertType || 'ARREST',
                String(alert.name || '').toUpperCase().trim(),
                alert.county || '',
                alert.booking || '',
                String(alert.charges || '').substring(0, 500),
                alert.bondAmount || '',
                alert.historicalBonds || '',
                alert.totalLiability || '',
                alert.details || ''
            ]);

            existingKeys.add(dedupKey);
            written++;
        }

        Logger.log('📝 RepeatOffenderAlerts: ' + written + ' written, ' + skipped + ' dupes skipped');
        return { success: true, written: written, skipped: skipped };

    } catch (e) {
        Logger.log('❌ handleWriteRepeatOffenderAlerts error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 3. SEND REPEAT OFFENDER OUTREACH (SMS TO COSIGNERS)
// =============================================================================

/**
 * Send SMS outreach to cosigners of re-arrested defendants.
 *
 * @param {Object} data - { contacts: [{ cosignerName, cosignerPhone, defendantName, county, message }] }
 * @returns {Object} - { success, sent, failed }
 */
function handleSendRepeatOffenderOutreach(data) {
    try {
        var contacts = data.contacts || [];
        if (!contacts.length) return { success: true, sent: 0, failed: 0 };

        var sent = 0;
        var failed = 0;

        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            if (!c.cosignerPhone) { failed++; continue; }

            // Check comm prefs before sending
            if (typeof checkCommPrefsAllowed === 'function') {
                if (!checkCommPrefsAllowed(c.cosignerPhone, 'sms')) {
                    Logger.log('⚠️ SMS opted out for ' + c.cosignerPhone.slice(-4));
                    failed++;
                    continue;
                }
            }

            var messageBody = c.message || (
                'Hi ' + (c.cosignerName || 'there').split(',')[0] +
                ', this is Shamrock Bail Bonds. We see ' + (c.defendantName || 'your defendant') +
                ' has been arrested again in ' + (c.county || 'SWFL') +
                ' County. As a previous cosigner, we can help quickly — call us 24/7 at (239) 444-2663. 🍀'
            );

            try {
                if (typeof NotificationService !== 'undefined' && NotificationService.sendSms) {
                    NotificationService.sendSms(c.cosignerPhone, messageBody);
                    sent++;
                } else {
                    Logger.log('⚠️ NotificationService not available');
                    failed++;
                }
            } catch (smsErr) {
                Logger.log('⚠️ SMS send error: ' + smsErr.message);
                failed++;
            }
        }

        // Slack notification
        if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
            NotificationService.sendSlack('#alerts',
                '📱 *Repeat Offender Outreach:* ' + sent + ' SMS sent, ' + failed + ' failed\n' +
                contacts.map(function(c) { return '• ' + (c.cosignerName || '?') + ' ← ' + (c.defendantName || '?'); }).join('\n')
            );
        }

        Logger.log('📱 Repeat Offender Outreach: ' + sent + ' sent, ' + failed + ' failed');
        return { success: true, sent: sent, failed: failed };

    } catch (e) {
        Logger.log('❌ handleSendRepeatOffenderOutreach error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 4. RUN DRIP CAMPAIGN (The Closer)
// =============================================================================

/**
 * Execute a follow-up drip campaign via The Closer.
 * Node-RED calls this to trigger follow-up sequences for abandoned intakes.
 *
 * @param {Object} data - { campaignType, maxContacts, lookbackDays }
 * @returns {Object} - { success, contacted, skipped }
 */
function handleRunDripCampaign(data) {
    try {
        var campaignType = data.campaignType || 'abandoned_intake';
        var maxContacts = data.maxContacts || 20;
        var lookbackDays = data.lookbackDays || 7;

        // Check if The Closer's runTheCloser function exists
        if (typeof runTheCloser === 'function') {
            var result = runTheCloser();
            return {
                success: true,
                message: 'Drip campaign executed via The Closer',
                campaignType: campaignType,
                result: result
            };
        }

        // Fallback: Manual abandoned intake follow-up
        var ss = SpreadsheetApp.openById(NR_REPEAT_CONFIG.SHEET_ID);
        var iq = ss.getSheetByName('IntakeQueue');
        if (!iq || iq.getLastRow() <= 1) {
            return { success: true, contacted: 0, message: 'No intake queue data' };
        }

        var cutoff = new Date(Date.now() - lookbackDays * 86400000);
        var data_rows = iq.getRange(2, 1, iq.getLastRow() - 1, 10).getValues();
        var contacted = 0;
        var skipped = 0;

        for (var r = 0; r < data_rows.length && contacted < maxContacts; r++) {
            var timestamp = data_rows[r][0];
            var phone = String(data_rows[r][3] || '').trim();  // Assuming col D = phone
            var status = String(data_rows[r][8] || '').toLowerCase();  // Assuming col I = status

            if (!(timestamp instanceof Date) || timestamp < cutoff) continue;
            if (status === 'completed' || status === 'signed') { skipped++; continue; }
            if (!phone) { skipped++; continue; }

            // Check comm prefs
            if (typeof checkCommPrefsAllowed === 'function' && !checkCommPrefsAllowed(phone, 'sms')) {
                skipped++;
                continue;
            }

            // Send follow-up
            var msg = 'Hi, this is Shamrock Bail Bonds. We noticed you started an intake recently but didn\'t finish. ' +
                      'We\'re here to help 24/7 — call us at (239) 444-2663 or reply to this text. 🍀';

            if (typeof NotificationService !== 'undefined' && NotificationService.sendSms) {
                NotificationService.sendSms(phone, msg);
                contacted++;
            }
        }

        return { success: true, contacted: contacted, skipped: skipped, campaignType: campaignType };

    } catch (e) {
        Logger.log('❌ handleRunDripCampaign error: ' + e.message);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// 5. GET COMM PREFERENCES (Read-Only, for Node-RED)
// =============================================================================

/**
 * Return communication preferences for a given phone number.
 * Wraps CommPrefsGate.js getCommPrefsForPhone_().
 *
 * @param {Object} data - { phone: string }
 * @returns {Object} - { success, prefs: { smsOptIn, whatsAppOptIn, ... } }
 */
function handleGetCommPreferences(data) {
    try {
        var phone = data.phone || '';
        if (!phone) return { success: false, error: 'Phone number required' };

        if (typeof checkCommPrefsAllowed === 'function') {
            // Use the existing CommPrefsGate lookup
            var prefs = {
                smsOptIn: checkCommPrefsAllowed(phone, 'sms'),
                whatsAppOptIn: checkCommPrefsAllowed(phone, 'whatsapp'),
                telegramOptIn: checkCommPrefsAllowed(phone, 'telegram'),
                emailOptIn: checkCommPrefsAllowed(phone, 'email')
            };
            return { success: true, phone: phone, prefs: prefs };
        }

        return { success: false, error: 'CommPrefsGate not loaded' };

    } catch (e) {
        Logger.log('❌ handleGetCommPreferences error: ' + e.message);
        return { success: false, error: e.message };
    }
}
