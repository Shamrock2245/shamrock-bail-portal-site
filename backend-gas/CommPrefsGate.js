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
 * Blank/unknown stored flags also fail-open here (`!== false`) so
 * court and check-in reminders keep their current runtime behavior.
 * That is not the same as recording TRUE as affirmative consent;
 * saveCommPrefs only writes TRUE when the user explicitly chose it.
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
                    smsOptIn:       parseCommPrefCell_(data[r][colIdx['smsoptin']]),
                    whatsAppOptIn:  parseCommPrefCell_(data[r][colIdx['whatsappoptin']]),
                    telegramOptIn:  parseCommPrefCell_(data[r][colIdx['telegramoptin']]),
                    emailOptIn:     parseCommPrefCell_(data[r][colIdx['emailoptin']]),
                    updatedAt:      data[r][colIdx['updatedat']] || ''
                };
            }
        }
    } catch (err) {
        Logger.log('[CommPrefsGate] Error reading prefs: ' + err.message);
    }

    return null;
}

/**
 * Parse a CommPrefs sheet cell into explicit true/false or null (blank/unknown).
 * Blank is not coerced to true here; checkCommPrefsAllowed still fail-opens
 * on null via `!== false`.
 */
function parseCommPrefCell_(value) {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return null;
    var s = String(value).trim().toLowerCase();
    if (s === '') return null;
    if (s === 'true' || s === 'yes' || s === '1') return true;
    if (s === 'false' || s === 'no' || s === '0') return false;
    return null;
}

/**
 * Return explicit true/false if the payload includes the flag, else undefined
 * (omitted). null is treated as omitted. Accepts alias keys (whatsappOptIn /
 * whatsAppOptIn).
 */
function explicitCommPrefFlag_(data, keys) {
    if (!data || typeof data !== 'object') return undefined;
    for (var i = 0; i < keys.length; i++) {
        if (Object.prototype.hasOwnProperty.call(data, keys[i]) &&
            data[keys[i]] !== undefined &&
            data[keys[i]] !== null) {
            var raw = data[keys[i]];
            if (raw === true || raw === false) return raw;
            var s = String(raw).trim().toLowerCase();
            if (s === 'true' || s === 'yes' || s === '1') return true;
            if (s === 'false' || s === 'no' || s === '0') return false;
        }
    }
    return undefined;
}

/**
 * Value to write for a channel flag.
 * Only an explicit true or false is written as such. TRUE is never recorded
 * as affirmative consent unless the user chose it.
 * Omitted on an existing row: keep the stored cell (including blank).
 * Omitted on a new row: write blank/unknown, never TRUE.
 */
function resolveCommPrefWrite_(incoming, existingCell) {
    if (incoming === true || incoming === false) return incoming;
    if (arguments.length > 1) return existingCell;
    return '';
}

// =============================================================================
// WRITE — called from doPost 'updateCommPrefs' action
// =============================================================================

/**
 * Save or update communication preferences.
 * Upsert by phone number (last 10 digits).
 *
 * Only explicit true or false channel flags are written. Omitted
 * (undefined/null) flags keep the stored value on an existing row, and are
 * stored as blank/unknown on a new row — never TRUE. checkCommPrefsAllowed
 * still fail-opens on blank/unknown at send time, but that is not recorded
 * as affirmative consent.
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
        var smsFlag = explicitCommPrefFlag_(data, ['smsOptIn']);
        var whatsappFlag = explicitCommPrefFlag_(data, ['whatsappOptIn', 'whatsAppOptIn']);
        var telegramFlag = explicitCommPrefFlag_(data, ['telegramOptIn']);
        var emailFlag = explicitCommPrefFlag_(data, ['emailOptIn']);

        // Check if we already have a row for this phone
        if (sheet.getLastRow() > 1) {
            var existingRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
            for (var r = 0; r < existingRows.length; r++) {
                var existing = String(existingRows[r][0] || '').replace(/\D/g, '').slice(-10);
                if (existing === cleanPhone) {
                    // Keep stored values (including blank) for omitted flags.
                    var updatedRow = [
                        cleanPhone,
                        data.firstName || existingRows[r][1] || '',
                        data.lastName || existingRows[r][2] || '',
                        data.email || existingRows[r][3] || '',
                        resolveCommPrefWrite_(smsFlag, existingRows[r][4]),
                        resolveCommPrefWrite_(whatsappFlag, existingRows[r][5]),
                        resolveCommPrefWrite_(telegramFlag, existingRows[r][6]),
                        resolveCommPrefWrite_(emailFlag, existingRows[r][7]),
                        now
                    ];
                    // Update existing row (row index = r + 2 because 1-indexed + header)
                    sheet.getRange(r + 2, 1, 1, 9).setValues([updatedRow]);
                    Logger.log('[CommPrefsGate] Updated prefs for ' + cleanPhone.slice(-4));
                    return { success: true, message: 'Preferences updated.', action: 'updated' };
                }
            }
        }

        // Insert new row. Omitted channels are blank/unknown, never TRUE.
        var newRow = [
            cleanPhone,
            data.firstName || '',
            data.lastName || '',
            data.email || '',
            resolveCommPrefWrite_(smsFlag),
            resolveCommPrefWrite_(whatsappFlag),
            resolveCommPrefWrite_(telegramFlag),
            resolveCommPrefWrite_(emailFlag),
            now
        ];
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
