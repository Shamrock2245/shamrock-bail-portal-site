/**
 * TheCloser.js
 * Shamrock Bail Bonds — "The Closer" Bot
 *
 * Automated follow-up for abandoned intakes.
 * Scans IntakeQueue for stale entries and sends drip SMS/WhatsApp reminders.
 *
 * Drip Schedule:
 *   ── 1 hour after last activity  → Gentle reminder (SMS)
 *   ── 24 hours after last activity → Urgency follow-up (SMS + WhatsApp)
 *   ── 72 hours after last activity → Final "we're here for you" (SMS + Slack)
 *
 * Trigger: setupCloserTrigger() → runs every 30 minutes via time-driven trigger
 *
 * Date: 2026-02-25
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var CLOSER_CONFIG = {
    // Drip intervals in milliseconds
    DRIP_1H: 1 * 60 * 60 * 1000,   // 1 hour
    DRIP_24H: 24 * 60 * 60 * 1000,  // 24 hours
    DRIP_72H: 72 * 60 * 60 * 1000,  // 72 hours

    // Max follow-ups per run (rate limiting)
    MAX_PER_RUN: 20,

    // Sheet names
    INTAKE_SHEET: 'IntakeQueue',
    FOLLOWUP_LOG: 'CloserFollowUpLog',

    // Statuses that indicate an intake is "abandoned"
    ABANDONED_STATUSES: ['pending', 'incomplete', 'abandoned', 'started', ''],

    // Do not follow up on these statuses
    COMPLETED_STATUSES: ['completed', 'signed', 'active', 'posted', 'declined', 'closed'],

    // Business hours only (ET)
    BUSINESS_START_HOUR: 8,   // 8 AM ET
    BUSINESS_END_HOUR: 21,    // 9 PM ET
};

// =============================================================================
// DRIP MESSAGE TEMPLATES
// =============================================================================

var CLOSER_MESSAGES = {
    '1h': {
        sms: '🍀 Hi {name}, this is Shamrock Bail Bonds. We noticed you started a bail application but didn\'t finish. We\'re standing by 24/7 to help you get your loved one home. Reply or call us: (239) 237-1809',
        subject: '1-Hour Follow-Up'
    },
    '24h': {
        sms: '🍀 {name}, Shamrock Bail Bonds here. Your bail application is still waiting. Time matters — the sooner we start, the sooner they\'re home. Questions? Text back or call: (239) 237-1809',
        whatsapp: '🍀 Hi {name}! This is Shamrock Bail Bonds reaching out because you started a bail application yesterday. We know this is stressful — we\'re here to help, no judgment. Just reply here or call (239) 237-1809 to pick up where you left off.',
        subject: '24-Hour Follow-Up'
    },
    '72h': {
        sms: '🍀 {name}, it\'s been a few days since you started your bail application with Shamrock Bail Bonds. If you still need help, we\'re here. If not, no worries — we wish you the best. Call anytime: (239) 237-1809',
        subject: '72-Hour Final Follow-Up (The Closer)'
    }
};

// =============================================================================
// MAIN SCANNER — runs on timer trigger
// =============================================================================

/**
 * Scan IntakeQueue for abandoned intakes and send appropriate follow-ups.
 * Called by the time-driven trigger every 30 minutes.
 */
function runTheCloser() {
    Logger.log('═══════════════════════════════════════════');
    Logger.log('🔐 THE CLOSER — Scanning for abandoned intakes');
    Logger.log('═══════════════════════════════════════════');

    // Check business hours
    var now = new Date();
    var etHour = _getETHour(now);
    if (etHour < CLOSER_CONFIG.BUSINESS_START_HOUR || etHour >= CLOSER_CONFIG.BUSINESS_END_HOUR) {
        Logger.log('⏰ Outside business hours (' + etHour + ' ET). Skipping.');
        return { skipped: true, reason: 'outside_business_hours' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var intakeSheet = ss.getSheetByName(CLOSER_CONFIG.INTAKE_SHEET);

    if (!intakeSheet || intakeSheet.getLastRow() <= 1) {
        Logger.log('ℹ️ No intake data found.');
        return { processed: 0 };
    }

    // Get follow-up log (to avoid duplicate messages)
    var logSheet = _getOrCreateFollowUpLog(ss);
    var sentFollowUps = _getSentFollowUps(logSheet);

    // Read all intakes
    var rows = intakeSheet.getDataRange().getValues();
    var headers = rows[0];
    var colIdx = {};
    headers.forEach(function (h, i) { colIdx[String(h).toLowerCase().trim()] = i; });

    var processed = 0;
    var sent = 0;

    for (var r = 1; r < rows.length && sent < CLOSER_CONFIG.MAX_PER_RUN; r++) {
        var row = rows[r];

        // Extract key fields
        var status = String(_getVal(row, colIdx, ['status']) || '').toLowerCase().trim();
        var phone = String(_getVal(row, colIdx, ['indphone', 'ind phone', 'phone']) || '');
        var name = String(_getVal(row, colIdx, ['indname', 'ind name', 'name']) || '');
        var timestamp = _getVal(row, colIdx, ['timestamp', 'date', 'created']);

        // Skip if completed or no phone
        if (CLOSER_CONFIG.COMPLETED_STATUSES.indexOf(status) !== -1) continue;
        if (!phone || phone.replace(/\D/g, '').length < 10) continue;

        // Determine age of the intake
        var createdDate;
        try {
            createdDate = new Date(timestamp);
            if (isNaN(createdDate.getTime())) continue;
        } catch (e) {
            continue;
        }

        var ageMs = now.getTime() - createdDate.getTime();
        var intakeId = phone.replace(/\D/g, '').slice(-10) + '_' + createdDate.getTime();

        // Determine which drip to send
        var dripLevel = _getDripLevel(ageMs, intakeId, sentFollowUps);
        if (!dripLevel) continue;

        processed++;

        // Send the follow-up
        try {
            var result = _sendFollowUp(dripLevel, name, phone, intakeId);
            if (result.sent) {
                sent++;
                // Log it
                logSheet.appendRow([
                    new Date(),
                    intakeId,
                    name,
                    phone,
                    dripLevel,
                    result.channels.join(', '),
                    'sent'
                ]);
                Logger.log('📤 ' + dripLevel + ' follow-up sent to ' + (name || phone.slice(-4)));
            }
        } catch (sendErr) {
            Logger.log('❌ Failed to send ' + dripLevel + ' to ' + (name || 'unknown') + ': ' + sendErr.message);
            logSheet.appendRow([
                new Date(),
                intakeId,
                name,
                phone,
                dripLevel,
                'error',
                sendErr.message
            ]);
        }
    }

    Logger.log('');
    Logger.log('🔐 THE CLOSER — Complete');
    Logger.log('   Processed: ' + processed + ' abandoned intakes');
    Logger.log('   Sent: ' + sent + ' follow-ups');

    // Slack summary (if any were sent)
    if (sent > 0) {
        try {
            var slackUrl = _getConfigSafe('SLACK_WEBHOOK_SHAMROCK');
            if (slackUrl && typeof sendSlackMessage === 'function') {
                sendSlackMessage(slackUrl,
                    '🔐 The Closer sent ' + sent + ' follow-up(s) for abandoned intakes.',
                    null
                );
            }
        } catch (slackErr) {
            Logger.log('Slack summary failed (non-fatal): ' + slackErr.message);
        }
    }

    return { processed: processed, sent: sent };
}

// =============================================================================
// DRIP LEVEL DETERMINATION
// =============================================================================

/**
 * Determine which drip message to send based on age and sent history.
 * Returns '1h', '24h', '72h', or null if no action needed.
 */
function _getDripLevel(ageMs, intakeId, sentFollowUps) {
    var sent = sentFollowUps[intakeId] || {};

    if (ageMs >= CLOSER_CONFIG.DRIP_72H && !sent['72h']) {
        return '72h';
    }
    if (ageMs >= CLOSER_CONFIG.DRIP_24H && !sent['24h']) {
        return '24h';
    }
    if (ageMs >= CLOSER_CONFIG.DRIP_1H && !sent['1h']) {
        return '1h';
    }

    return null;
}

// =============================================================================
// FOLLOW-UP SENDER
// =============================================================================

/**
 * Send a follow-up message via appropriate channels.
 */
function _sendFollowUp(dripLevel, name, phone, intakeId) {
    var template = CLOSER_MESSAGES[dripLevel];
    if (!template) return { sent: false };

    var firstName = (name || 'Friend').split(' ')[0];
    var channels = [];

    // SMS (always, if we have a Twilio setup)
    if (template.sms) {
        try {
            var smsBody = template.sms.replace(/\{name\}/g, firstName);
            var cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length === 10) cleanPhone = '+1' + cleanPhone;
            else if (cleanPhone.length === 11 && cleanPhone[0] === '1') cleanPhone = '+' + cleanPhone;
            else cleanPhone = '+' + cleanPhone;

            if (typeof sendTwilioSMS === 'function') {
                sendTwilioSMS(cleanPhone, smsBody);
                channels.push('sms');
                Logger.log('  📱 SMS sent to ' + cleanPhone.slice(-4));
            } else {
                Logger.log('  ⚠️ sendTwilioSMS not available');
            }
        } catch (smsErr) {
            Logger.log('  ❌ SMS failed: ' + smsErr.message);
        }
    }

    // WhatsApp (24h drip only)
    if (template.whatsapp) {
        try {
            var waBody = template.whatsapp.replace(/\{name\}/g, firstName);
            var waPhone = phone.replace(/\D/g, '');
            if (waPhone.length === 10) waPhone = '+1' + waPhone;
            else if (waPhone.length === 11 && waPhone[0] === '1') waPhone = '+' + waPhone;
            else waPhone = '+' + waPhone;

            if (typeof sendTwilioWhatsApp === 'function') {
                sendTwilioWhatsApp(waPhone, waBody);
                channels.push('whatsapp');
                Logger.log('  💬 WhatsApp sent to ' + waPhone.slice(-4));
            } else if (typeof sendWhatsAppMessage === 'function') {
                sendWhatsAppMessage(waPhone, waBody);
                channels.push('whatsapp');
            } else {
                Logger.log('  ⚠️ WhatsApp sender not available');
            }
        } catch (waErr) {
            Logger.log('  ❌ WhatsApp failed: ' + waErr.message);
        }
    }

    return {
        sent: channels.length > 0,
        channels: channels
    };
}

// =============================================================================
// FOLLOW-UP LOG MANAGEMENT
// =============================================================================

/**
 * Get or create the CloserFollowUpLog sheet.
 */
function _getOrCreateFollowUpLog(ss) {
    var sheet = ss.getSheetByName(CLOSER_CONFIG.FOLLOWUP_LOG);
    if (!sheet) {
        sheet = ss.insertSheet(CLOSER_CONFIG.FOLLOWUP_LOG);
        sheet.appendRow(['Timestamp', 'IntakeID', 'Name', 'Phone', 'DripLevel', 'Channels', 'Status']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }
    return sheet;
}

/**
 * Build a map of already-sent follow-ups to prevent duplicates.
 * Returns: { intakeId: { '1h': true, '24h': true, ... } }
 */
function _getSentFollowUps(logSheet) {
    var map = {};
    if (logSheet.getLastRow() <= 1) return map;

    var data = logSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        var id = String(data[i][1]);  // IntakeID
        var level = String(data[i][4]); // DripLevel
        var status = String(data[i][6]); // Status

        if (status === 'sent') {
            if (!map[id]) map[id] = {};
            map[id][level] = true;
        }
    }
    return map;
}

// =============================================================================
// TRIGGER SETUP
// =============================================================================

/**
 * Install the 30-minute trigger for The Closer.
 * Run this ONCE in the GAS editor.
 */
function setupCloserTrigger() {
    // Remove existing triggers to prevent duplicates
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function (t) {
        if (t.getHandlerFunction() === 'runTheCloser') {
            ScriptApp.deleteTrigger(t);
            Logger.log('🗑️ Removed existing Closer trigger');
        }
    });

    // Install new trigger — every 30 minutes
    ScriptApp.newTrigger('runTheCloser')
        .timeBased()
        .everyMinutes(30)
        .create();

    Logger.log('✅ The Closer trigger installed (every 30 minutes)');
    Logger.log('   Function: runTheCloser()');
    Logger.log('   Note: Only runs during business hours (8 AM - 9 PM ET)');

    return { success: true, interval: '30 minutes' };
}

/**
 * Manually run The Closer for testing.
 */
function testTheCloser() {
    Logger.log('🧪 TEST RUN — The Closer (dry run mode not yet implemented, will send real messages)');
    return runTheCloser();
}

// =============================================================================
// HELPERS
// =============================================================================

function _getVal(row, colIdx, keys) {
    for (var k = 0; k < keys.length; k++) {
        var idx = colIdx[keys[k].toLowerCase()];
        if (idx !== undefined && row[idx] !== undefined && row[idx] !== '') return row[idx];
    }
    return null;
}

function _getETHour(date) {
    // Simple ET approximation (UTC - 5, ignoring DST for safety)
    var utcHour = date.getUTCHours();
    var etHour = utcHour - 5;
    if (etHour < 0) etHour += 24;
    return etHour;
}

function _getConfigSafe(key) {
    try {
        if (typeof getConfig === 'function') return getConfig()[key];
        return PropertiesService.getScriptProperties().getProperty(key);
    } catch (e) {
        return null;
    }
}
