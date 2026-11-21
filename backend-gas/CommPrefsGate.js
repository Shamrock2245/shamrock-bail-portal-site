/**
 * CommPrefsGate.js
 * Shamrock Bail Bonds — Google Apps Script
 *
 * Central opt-in/opt-out gate for outbound communications.
 * Called by TheCloser, CourtReminderSystem, ClientCheckInSystem, etc.
 * before sending any SMS, WhatsApp, Telegram, or Email message, or placing
 * a phone call.
 *
 * Data source: "CommPrefs" tab in the Master spreadsheet.
 * Rows written by the Wix Portal → GAS doPost action 'updateCommPrefs'.
 *
 * Schema (CommPrefs sheet):
 *   A Phone | B FirstName | C LastName | D Email | E SmsOptIn | F WhatsAppOptIn |
 *   G TelegramOptIn | H EmailOptIn | I UpdatedAt | J CallOptIn | K CallOptInUpdatedAt
 *
 * J/K (phone-call consent) were added after the first nine columns so
 * existing rows keep their positions. They must exist in the live sheet
 * before this version is deployed; a call write is refused (no partial
 * write) while the header row does not have them.
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
 * saveCommPrefs_ only writes TRUE when the user explicitly chose it.
 *
 * @param {string} phone    — Client phone (any format, normalized to last 10 digits)
 * @param {string} channel  — 'sms', 'whatsapp', 'telegram', 'email', or 'call'
 * @returns {boolean}       — true if allowed to send, false if opted out.
 *                            'call' is the exception: allowed only when
 *                            CallOptIn is explicitly TRUE. No record, a
 *                            blank cell or a missing column is "not set",
 *                            which never allows a call.
 */
function checkCommPrefsAllowed(phone, channel) {
    var key = String(channel || '').toLowerCase().trim();
    if (!phone || !key) return key !== 'call'; // Fail-open if no data, except calls

    var prefs = getCommPrefsForPhone_(phone);
    if (!prefs) return key !== 'call'; // No record = default opt-in, except calls

    // Phone calls are opt-in only: only an explicit TRUE allows a call.
    if (key === 'call') return prefs.callOptIn === true;

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
                    // Missing column (sheet not migrated) or blank cell = not set.
                    callOptIn:      colIdx['calloptin'] === undefined ? null : parseCommPrefCell_(data[r][colIdx['calloptin']]),
                    callOptInUpdatedAt: colIdx['calloptinupdatedat'] === undefined ? '' : (data[r][colIdx['calloptinupdatedat']] || ''),
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
 * Optimistic-concurrency check, run UNDER the script lock in saveCommPrefs_.
 * data.expected (optional) maps channel keys to the value the caller read
 * (true / false / null = blank or no row). If any listed channel's stored
 * value differs, the write is refused as a conflict. Callers that do not
 * send expected keep the old last-writer-wins behavior.
 *
 * @param {Object|undefined} expected
 * @param {Array|null} row — existing sheet row, or null when none exists
 * @returns {boolean} true when the stored state differs from expected
 */
var COMMPREFS_EXPECTED_COLUMNS_ = {
    smsOptIn: 4,
    whatsappOptIn: 5,
    whatsAppOptIn: 5,
    telegramOptIn: 6,
    emailOptIn: 7,
    callOptIn: 9
};

var COMMPREFS_BASE_WIDTH_ = 9;   // A..I
var COMMPREFS_CALL_WIDTH_ = 11;  // A..K (CallOptIn, CallOptInUpdatedAt)
var COMMPREFS_HEADERS_ = ['Phone', 'FirstName', 'LastName', 'Email', 'SmsOptIn', 'WhatsAppOptIn', 'TelegramOptIn', 'EmailOptIn', 'UpdatedAt', 'CallOptIn', 'CallOptInUpdatedAt'];

/**
 * True when the sheet header has CallOptIn in J and CallOptInUpdatedAt in K.
 */
function commPrefsHasCallColumns_(sheet) {
    if (!sheet || sheet.getLastColumn() < COMMPREFS_CALL_WIDTH_) return false;
    var header = sheet.getRange(1, 1, 1, COMMPREFS_CALL_WIDTH_).getValues()[0];
    return String(header[9] || '').toLowerCase().trim() === 'calloptin' &&
        String(header[10] || '').toLowerCase().trim() === 'calloptinupdatedat';
}

function commPrefsExpectedMismatch_(expected, row) {
    if (!expected || typeof expected !== 'object' || Array.isArray(expected)) return false;
    for (var key in COMMPREFS_EXPECTED_COLUMNS_) {
        if (!Object.prototype.hasOwnProperty.call(COMMPREFS_EXPECTED_COLUMNS_, key)) continue;
        if (!Object.prototype.hasOwnProperty.call(expected, key)) continue;
        var want = parseCommPrefCell_(expected[key]);
        var have = row ? parseCommPrefCell_(row[COMMPREFS_EXPECTED_COLUMNS_[key]]) : null;
        if (want !== have) return true;
    }
    return false;
}

function commPrefsConflict_() {
    return {
        success: false,
        conflict: true,
        code: 'conflict',
        message: 'Preferences changed since they were loaded. Please reload and try again.'
    };
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
 * @param {Object} data — { phone, firstName, lastName, email, smsOptIn, whatsappOptIn, telegramOptIn, emailOptIn, callOptIn?, expected? }
 * @returns {Object}    — { success, message } or { success: false, conflict: true, code: 'conflict' }
 */
function saveCommPrefs_(data) {
    if (!data || !data.phone) {
        return { success: false, message: 'Phone number is required.' };
    }

    var cleanPhone = String(data.phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
        return { success: false, message: 'Invalid phone number.' };
    }

    // Serialize the sheet read-modify-write so concurrent scoped
    // updates for the same phone cannot restore a stale row.
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
        Logger.log('[CommPrefsGate] Could not acquire script lock for ' + cleanPhone.slice(-4));
        return {
            success: false,
            message: 'Could not update communication preferences. Please try again or call (239) 332-2245.'
        };
    }

    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName(COMMPREFS_CONFIG.SHEET_TAB);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(COMMPREFS_CONFIG.SHEET_TAB);
            sheet.appendRow(COMMPREFS_HEADERS_);
            sheet.getRange(1, 1, 1, COMMPREFS_HEADERS_.length).setFontWeight('bold');
            sheet.setFrozenRows(1);
        }

        var now = new Date().toISOString();
        var smsFlag = explicitCommPrefFlag_(data, ['smsOptIn']);
        var whatsappFlag = explicitCommPrefFlag_(data, ['whatsappOptIn', 'whatsAppOptIn']);
        var telegramFlag = explicitCommPrefFlag_(data, ['telegramOptIn']);
        var emailFlag = explicitCommPrefFlag_(data, ['emailOptIn']);
        var callFlag = explicitCommPrefFlag_(data, ['callOptIn']);
        var hasCallColumns = commPrefsHasCallColumns_(sheet);
        var expectsCall = !!(data.expected && typeof data.expected === 'object' &&
            Object.prototype.hasOwnProperty.call(data.expected, 'callOptIn'));
        if ((callFlag !== undefined || expectsCall) && !hasCallColumns) {
            // Never drop a phone-call choice silently: refuse the whole save
            // until CallOptIn / CallOptInUpdatedAt exist in columns J/K.
            Logger.log('[CommPrefsGate] CallOptIn columns missing; refusing call write for ' + cleanPhone.slice(-4));
            return {
                success: false,
                code: 'call_column_missing',
                message: 'Phone-call preferences cannot be saved yet. Please try again later or call (239) 332-2245.'
            };
        }
        var width = hasCallColumns ? COMMPREFS_CALL_WIDTH_ : COMMPREFS_BASE_WIDTH_;

        // Check if we already have a row for this phone
        if (sheet.getLastRow() > 1) {
            var existingRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
            for (var r = 0; r < existingRows.length; r++) {
                var existing = String(existingRows[r][0] || '').replace(/\D/g, '').slice(-10);
                if (existing === cleanPhone) {
                    // Compare-and-swap under the same lock as the write.
                    if (commPrefsExpectedMismatch_(data.expected, existingRows[r])) {
                        Logger.log('[CommPrefsGate] Conflict for ' + cleanPhone.slice(-4));
                        return commPrefsConflict_();
                    }
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
                    if (hasCallColumns) {
                        // Omitted call flag keeps the stored cell and its timestamp.
                        updatedRow.push(resolveCommPrefWrite_(callFlag, existingRows[r][9]));
                        updatedRow.push(callFlag === undefined ? existingRows[r][10] : now);
                    }
                    // Update existing row (row index = r + 2 because 1-indexed + header)
                    sheet.getRange(r + 2, 1, 1, width).setValues([updatedRow]);
                    Logger.log('[CommPrefsGate] Updated prefs for ' + cleanPhone.slice(-4));
                    return { success: true, message: 'Preferences updated.', action: 'updated' };
                }
            }
        }

        // No row: every expected value must be blank/unknown.
        if (commPrefsExpectedMismatch_(data.expected, null)) {
            Logger.log('[CommPrefsGate] Conflict (no row) for ' + cleanPhone.slice(-4));
            return commPrefsConflict_();
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
        if (hasCallColumns) {
            // Omitted call flag on a new row is blank (not set), never TRUE.
            newRow.push(resolveCommPrefWrite_(callFlag));
            newRow.push(callFlag === undefined ? '' : now);
        }
        sheet.appendRow(newRow);
        Logger.log('[CommPrefsGate] Saved new prefs for ' + cleanPhone.slice(-4));
        return { success: true, message: 'Preferences saved.', action: 'created' };

    } catch (err) {
        Logger.log('[CommPrefsGate] Error saving prefs: ' + err.message);
        return { success: false, message: 'Error saving preferences: ' + err.message };
    } finally {
        lock.releaseLock();
    }
}

// =============================================================================
// doPost HANDLER — route from Code.js
// =============================================================================

/**
 * Handle the 'updateCommPrefs' action from doPost.
 * Private (trailing underscore): hidden from google.script.run. Reached only
 * via doPost → dispatchCommPrefsUpdate_ after the API key check.
 * Expected payload:
 *   { action: 'updateCommPrefs', apiKey: '...', phone, firstName, lastName, email,
 *     smsOptIn, whatsappOptIn, telegramOptIn, emailOptIn, callOptIn }
 */
function handleUpdateCommPrefs_(data) {
    Logger.log('[CommPrefsGate] Received updateCommPrefs');
    return saveCommPrefs_(data);
}
