/**
 * CommPrefsGate.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Central opt-in/opt-out gate for outbound communications.
 * Called by TheCloser, CourtReminderSystem, ClientCheckInSystem, etc.
 * before sending any SMS, WhatsApp, Telegram, or Email message.
 *
 * Data source: "CommPrefs" tab in the Master spreadsheet.
 * Rows written by the Wix Portal → GAS doPost action 'updateCommPrefs'.
 *
 * Schema (CommPrefs sheet):
 *   Phone | FirstName | LastName | Email | SmsOptIn | WhatsAppOptIn | TelegramOptIn | EmailOptIn | UpdatedAt
 *
 * Date: 2026-03-13
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var COMMPREFS_CONFIG = {
    SHEET_TAB: 'CommPrefs'
};

// =============================================================================
// PUBLIC API — check before sending
// =============================================================================

/**
 * Check if a client has opted in to a specific channel.
 * Returns true (allowed) if no record exists (opt-in by default).
 *
 * @param {string} phone    — Client phone (any format, normalized to last 10 digits)
 * @param {string} channel  — 'sms', 'whatsapp', 'telegram', or 'email'
 * @returns {boolean}       — true if allowed to send, false if opted out
 */
function checkCommPrefsAllowed(phone, channel) {
    if (!phone || !channel) return true; // Fail-open: allow if no data

    var prefs = getCommPrefsForPhone_(phone);
    if (!prefs) return true; // No record = default opt-in

    var key = channel.toLowerCase().trim();

    switch (key) {
        case 'sms':       return prefs.smsOptIn !== false;
        case 'whatsapp':  return prefs.whatsAppOptIn !== false;
        case 'telegram':  return prefs.telegramOptIn !== false;
        case 'email':     return prefs.emailOptIn !== false;
        default:          return true; // Unknown channel = allow
    }
}

/**
 * Get all comm prefs for a phone number.
 * Returns null if no record found.
 *
 * @param {string} phone
 * @returns {Object|null}
 */
function getCommPrefsForPhone_(phone) {
    if (!phone) return null;

    var cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) return null;

    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName(COMMPREFS_CONFIG.SHEET_TAB);
        if (!sheet || sheet.getLastRow() <= 1) return null;

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var colIdx = {};
        headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

        for (var r = 1; r < data.length; r++) {
            var rowPhone = String(data[r][colIdx['phone']] || '').replace(/\D/g, '').slice(-10);
            if (rowPhone === cleanPhone) {
                return {
                    phone:          rowPhone,
                    firstName:      data[r][colIdx['firstname']] || '',
                    lastName:       data[r][colIdx['lastname']] || '',
                    email:          data[r][colIdx['email']] || '',
                    smsOptIn:       data[r][colIdx['smsoptin']] !== false && String(data[r][colIdx['smsoptin']]).toLowerCase() !== 'false',
                    whatsAppOptIn:  data[r][colIdx['whatsappoptin']] !== false && String(data[r][colIdx['whatsappoptin']]).toLowerCase() !== 'false',
                    telegramOptIn:  data[r][colIdx['telegramoptin']] !== false && String(data[r][colIdx['telegramoptin']]).toLowerCase() !== 'false',
                    emailOptIn:     data[r][colIdx['emailoptin']] !== false && String(data[r][colIdx['emailoptin']]).toLowerCase() !== 'false',
                    updatedAt:      data[r][colIdx['updatedat']] || ''
                };
            }
        }
    } catch (err) {
        Logger.log('[CommPrefsGate] Error reading prefs: ' + err.message);
    }

    return null;
}

// =============================================================================
// WRITE — called from doPost 'updateCommPrefs' action
// =============================================================================

/**
 * Save or update communication preferences.
 * Upsert by phone number (last 10 digits).
 *
 * @param {Object} data — { phone, firstName, lastName, email, smsOptIn, whatsappOptIn, telegramOptIn, emailOptIn }
 * @returns {Object}    — { success, message }
 */
function saveCommPrefs(data) {
    if (!data || !data.phone) {
        return { success: false, message: 'Phone number is required.' };
    }

    var cleanPhone = String(data.phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
        return { success: false, message: 'Invalid phone number.' };
    }

    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName(COMMPREFS_CONFIG.SHEET_TAB);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(COMMPREFS_CONFIG.SHEET_TAB);
            sheet.appendRow(['Phone', 'FirstName', 'LastName', 'Email', 'SmsOptIn', 'WhatsAppOptIn', 'TelegramOptIn', 'EmailOptIn', 'UpdatedAt']);
            sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
            sheet.setFrozenRows(1);
        }

        var now = new Date().toISOString();
        var newRow = [
            cleanPhone,
            data.firstName || '',
            data.lastName || '',
            data.email || '',
            data.smsOptIn !== false,
            data.whatsappOptIn !== false,
            data.telegramOptIn !== false,
            data.emailOptIn !== false,
            now
        ];

        // Check if we already have a row for this phone
        if (sheet.getLastRow() > 1) {
            var phones = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
            for (var r = 0; r < phones.length; r++) {
                var existing = String(phones[r][0]).replace(/\D/g, '').slice(-10);
                if (existing === cleanPhone) {
                    // Update existing row (row index = r + 2 because 1-indexed + header)
                    sheet.getRange(r + 2, 1, 1, 9).setValues([newRow]);
                    Logger.log('[CommPrefsGate] Updated prefs for ' + cleanPhone.slice(-4));
                    return { success: true, message: 'Preferences updated.', action: 'updated' };
                }
            }
        }

        // Insert new row
        sheet.appendRow(newRow);
        Logger.log('[CommPrefsGate] Saved new prefs for ' + cleanPhone.slice(-4));
        return { success: true, message: 'Preferences saved.', action: 'created' };

    } catch (err) {
        Logger.log('[CommPrefsGate] Error saving prefs: ' + err.message);
        return { success: false, message: 'Error saving preferences: ' + err.message };
    }
}

// =============================================================================
// doPost HANDLER — route from Code.js
// =============================================================================

/**
 * Handle the 'updateCommPrefs' action from doPost.
 * Expected payload:
 *   { action: 'updateCommPrefs', apiKey: '...', phone, firstName, lastName, email,
 *     smsOptIn, whatsappOptIn, telegramOptIn, emailOptIn }
 */
function handleUpdateCommPrefs(data) {
    Logger.log('[CommPrefsGate] Received updateCommPrefs');
    return saveCommPrefs(data);
}
