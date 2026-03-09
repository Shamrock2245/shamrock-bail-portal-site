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
    ABANDONED_STATUSES: ['pending', 'incomplete', 'abandoned', 'started', '', 'new - ai intake'],

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
        sms: '🍀 Hi {name}, this is Shamrock Bail Bonds. We noticed you started a bail application but didn\'t finish. We\'re standing by 24/7 to help you get your loved one home. Reply or call us: (239) 955-0178',
        telegram: '🍀 Hi {name}!\n\nThis is Shamrock Bail Bonds. We noticed you started a bail application but didn\'t finish.\n\nWe\'re standing by 24/7 — just tap the button below to pick up where you left off.\n\n📞 (239) 955-0178',
        subject: '1-Hour Follow-Up'
    },
    '24h': {
        sms: '🍀 {name}, Shamrock Bail Bonds here. Your bail application is still waiting. Time matters — the sooner we start, the sooner they\'re home. Questions? Text back or call: (239) 955-0178',
        whatsapp: '🍀 Hi {name}! This is Shamrock Bail Bonds reaching out because you started a bail application yesterday. We know this is stressful — we\'re here to help, no judgment. Just reply here or call (239) 955-0178 to pick up where you left off.',
        telegram: '🍀 {name}, your bail application is still waiting.\n\nEvery hour matters when someone you love is in custody. We\'re ready to move the moment you are.\n\nTap below to continue — or call us anytime:\n📞 (239) 955-0178',
        subject: '24-Hour Follow-Up'
    },
    '72h': {
        sms: '🍀 {name}, it\'s been a few days since you started your bail application with Shamrock Bail Bonds. If you still need help, we\'re here. If not, no worries — we wish you the best. Call anytime: (239) 955-0178',
        telegram: '🍀 {name}, we\'re still here if you need us.\n\nYour bail application was started a few days ago. If your situation has changed, no worries — we understand.\n\nIf you still need help getting your loved one home, we\'re one tap away:\n📞 (239) 955-0178',
        subject: '72-Hour Final Follow-Up (The Closer)'
    },
    // Shannon AI Agent follow-up — tailored for callers who spoke to the voice AI
    'shannon': {
        sms: '🍀 Hi {name}, this is Shamrock Bail Bonds. You spoke with our agent Shannon earlier about a bail bond. We want to make sure you have everything you need. Ready to move forward? Reply here or call: (239) 955-0178',
        telegram: '🍀 Hi {name}!\n\nYou recently spoke with Shannon, our bail bond assistant. We\'re ready to help get your loved one home.\n\nTap below to continue — or call us:\n📞 (239) 955-0178',
        subject: 'Shannon AI Intake Follow-Up'
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
        var source = String(_getVal(row, colIdx, ['source', 'intakesource']) || '').toLowerCase().trim();

        // Skip if completed or no phone
        if (CLOSER_CONFIG.COMPLETED_STATUSES.indexOf(status) !== -1) continue;
        if (!phone || phone.replace(/\D/g, '').length < 10) continue;

        // Check if this is an abandoned intake we should follow up on
        if (CLOSER_CONFIG.ABANDONED_STATUSES.indexOf(status) === -1) continue;

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

        // Detect Shannon AI source for tailored messaging
        var isShannonIntake = (source === 'elevenlabs after-hours' || source === 'shannon ai');

        // Determine which drip to send
        var dripLevel = _getDripLevel(ageMs, intakeId, sentFollowUps);
        if (!dripLevel) continue;

        // Shannon intakes get the dedicated 'shannon' template on first contact,
        // then fall through to normal drip cadence for subsequent touches
        if (isShannonIntake && dripLevel === '1h') {
            dripLevel = 'shannon';
        }

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

            // Determine best SMS sender
            if (typeof NotificationService !== 'undefined' && typeof NotificationService.sendSms === 'function') {
                NotificationService.sendSms(cleanPhone, smsBody);
                channels.push('sms');
                Logger.log('  📱 SMS sent via NotificationService to ' + cleanPhone.slice(-4));
            } else if (typeof sendSmsViaTwilio === 'function') {
                sendSmsViaTwilio(cleanPhone, smsBody);
                channels.push('sms');
                Logger.log('  📱 SMS sent via sendSmsViaTwilio to ' + cleanPhone.slice(-4));
            } else {
                Logger.log('  ⚠️ SMS sending function not available (NotificationService.sendSms or sendSmsViaTwilio)');
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

    // Telegram (all drip levels — if client has a Telegram chat ID on file)
    // Looks up the Telegram chat ID from IntakeQueue by phone number.
    // Falls back gracefully if TG_sendCloserFollowUp is not available.
    if (template.telegram) {
        try {
            var tgBody = template.telegram.replace(/\{name\}/g, firstName);
            var tgSent = false;

            // Method 1: Use TG_sendCloserFollowUp if available (preferred)
            if (typeof TG_sendCloserFollowUp === 'function') {
                var tgResult = TG_sendCloserFollowUp(phone, tgBody, intakeId);
                if (tgResult && tgResult.sent) {
                    channels.push('telegram');
                    tgSent = true;
                    Logger.log('  📨 Telegram sent via TG_sendCloserFollowUp');
                }
            }

            // Method 2: Use TG_notifyDocumentReady pattern (sendMessage by phone)
            if (!tgSent && typeof TG_templateGeneralFollowup === 'function') {
                var tgMsg = TG_templateGeneralFollowup(phone, firstName, '');
                if (tgMsg && tgMsg.sent) {
                    channels.push('telegram');
                    tgSent = true;
                    Logger.log('  📨 Telegram sent via TG_templateGeneralFollowup');
                }
            }

            if (!tgSent) {
                Logger.log('  ⚠️ Telegram: no chat ID found for ' + phone.slice(-4) + ' (client may not have messaged the bot yet)');
            }
        } catch (tgErr) {
            Logger.log('  ❌ Telegram failed: ' + tgErr.message);
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
