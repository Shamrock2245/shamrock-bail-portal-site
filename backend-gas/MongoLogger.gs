/**
 * @fileoverview MongoLogger.gs
 * Fire-and-forget MongoDB logging layer for all GAS business events.
 *
 * Every function is wrapped in try/catch — if MongoDB is unreachable,
 * it logs a warning and returns gracefully. ZERO impact on existing flows.
 *
 * Collections:
 *   Intakes         — intake submissions (Web, Telegram, Mini-App)
 *   SignNowEvents   — packet sent, doc completed, link created
 *   Payments        — payment logs (Telegram, SwipeSimple)
 *   CourtDates      — scheduled court dates + reminders
 *   CheckIns        — defendant check-in events (GPS, selfie, Twilio)
 *   Communications  — outbound SMS, email, portal messages
 *   LeadScoring     — AI risk scores and lead evaluations
 *   ActivityLog     — lightweight audit trail of every doPost action
 *
 * Version: 1.0.0
 */

// ── Safe Wrapper ───────────────────────────────────────────────────────────────
function _mongoSafe(fn) {
  try {
    fn();
  } catch (e) {
    Logger.log('[MongoLogger] ⚠️ Non-fatal logging error: ' + e.message);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────
var MongoLogger = {

  /**
   * Log every doPost action (lightweight heartbeat).
   * Call at the TOP of doPost() before action routing.
   */
  logActivity: function(action, source) {
    _mongoSafe(function() {
      MongoDbService.insertOne('ActivityLog', {
        action:    action || 'unknown',
        source:    source || 'gas_doPost',
        timestamp: new Date().toISOString()
      });
    });
  },

  /**
   * Log an intake submission from any channel.
   * @param {Object} data — the raw intake payload
   * @param {string} [channel] — 'web', 'telegram', 'mini_app', 'voice'
   */
  logIntake: function(data, channel) {
    _mongoSafe(function() {
      MongoDbService.insertOne('Intakes', {
        channel:          channel || data.source || 'unknown',
        caseId:           data.caseId || data.case_id || '',
        defendantName:    data.defendantName || data.defendant_name || '',
        indemnitorName:   data.indemnitorName || data.indemnitor_name || '',
        indemnitorPhone:  data.indemnitorPhone || data.phone || '',
        indemnitorEmail:  data.indemnitorEmail || data.email || '',
        bondAmount:       data.bondAmount || data.bond_amount || '',
        county:           data.county || '',
        bookingNumber:    data.bookingNumber || data.booking_number || '',
        charges:          data.charges || '',
        status:           'submitted',
        rawPayload:       data,
        submittedAt:      new Date().toISOString()
      });
    });
  },

  /**
   * Log a SignNow event (packet sent, doc completed, link created).
   * @param {string} eventType — 'packet_sent', 'document_complete', 'link_created'
   * @param {Object} data
   */
  logSignNow: function(eventType, data) {
    _mongoSafe(function() {
      MongoDbService.insertOne('SignNowEvents', {
        eventType:    eventType,
        caseId:       data.caseId || data.case_id || '',
        documentId:   data.documentId || data.document_id || '',
        method:       data.method || '',
        recipientPhone: data.phone || data.recipientPhone || '',
        recipientEmail: data.email || data.recipientEmail || '',
        signingUrl:   data.signingUrl || data.signingLink || '',
        rawPayload:   data,
        eventAt:      new Date().toISOString()
      });
    });
  },

  /**
   * Log a payment event.
   * @param {Object} data — payment payload from Telegram or SwipeSimple
   */
  logPayment: function(data) {
    _mongoSafe(function() {
      MongoDbService.insertOne('Payments', {
        caseId:       data.caseId || data.case_id || '',
        amount:       data.amount || data.paymentAmount || 0,
        method:       data.method || data.paymentMethod || 'unknown',
        platform:     data.platform || 'telegram',
        telegramId:   data.telegramUserId || data.telegram_user_id || '',
        receiptUrl:   data.receiptUrl || '',
        rawPayload:   data,
        loggedAt:     new Date().toISOString()
      });
    });
  },

  /**
   * Log a court date scheduling or reminder event.
   * @param {Object} data
   * @param {string} [eventType] — 'scheduled' or 'reminder_sent'
   */
  logCourtDate: function(data, eventType) {
    _mongoSafe(function() {
      MongoDbService.insertOne('CourtDates', {
        eventType:      eventType || 'scheduled',
        caseId:         data.caseId || data.case_id || '',
        defendantName:  data.defendantName || data.defendant_name || '',
        courtDate:      data.courtDate || data.court_date || '',
        courtLocation:  data.courtLocation || data.location || '',
        caseNumber:     data.caseNumber || data.case_number || '',
        remindersSent:  data.remindersSent || 0,
        rawPayload:     data,
        loggedAt:       new Date().toISOString()
      });
    });
  },

  /**
   * Log a defendant check-in event.
   * @param {Object} data — check-in data (GPS, selfie, Twilio response)
   * @param {string} [source] — 'telegram', 'twilio', 'web'
   */
  logCheckIn: function(data, source) {
    _mongoSafe(function() {
      MongoDbService.insertOne('CheckIns', {
        source:         source || data.source || 'unknown',
        caseId:         data.caseId || data.case_id || '',
        defendantName:  data.defendantName || data.defendant_name || '',
        telegramId:     data.telegramUserId || data.telegram_user_id || '',
        phone:          data.phone || '',
        latitude:       data.latitude || data.lat || null,
        longitude:      data.longitude || data.lng || null,
        selfieUrl:      data.selfieUrl || data.selfie_url || '',
        rawPayload:     data,
        checkedInAt:    new Date().toISOString()
      });
    });
  },

  /**
   * Log an outbound communication (SMS, email, portal message).
   * @param {Object} data
   * @param {string} [platform] — 'sms', 'email', 'portal', 'whatsapp'
   */
  logComm: function(data, platform) {
    _mongoSafe(function() {
      MongoDbService.insertOne('Communications', {
        direction:  'outbound',
        platform:   platform || data.platform || 'portal',
        to:         data.to || data.phone || data.email || data.recipientPhone || '',
        from:       data.from || 'shamrock_gas',
        body:       data.body || data.message || data.text || '',
        caseId:     data.caseId || data.case_id || '',
        rawPayload: data,
        sentAt:     new Date().toISOString()
      });
    });
  },

  /**
   * Log an AI lead scoring / risk assessment result.
   * @param {Object} data — lead data + AI response
   * @param {string} [agentName] — 'TheAnalyst', 'TheClerk', etc.
   */
  logLeadScore: function(data, agentName) {
    _mongoSafe(function() {
      MongoDbService.insertOne('LeadScoring', {
        agentName:      agentName || 'TheAnalyst',
        defendantName:  data.defendantName || data.name || '',
        bondAmount:     data.bondAmount || data.bond_amount || 0,
        county:         data.county || '',
        riskScore:      data.riskScore || data.score || null,
        recommendation: data.recommendation || '',
        rawPayload:     data,
        scoredAt:       new Date().toISOString()
      });
    });
  }
};
