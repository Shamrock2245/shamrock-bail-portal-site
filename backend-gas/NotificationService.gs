/**
 * ============================================================================
 * NotificationService.gs
 * ============================================================================
 * Unified provider for all system alerts.
 * Supports: Slack (Webhooks), Twilio (SMS), Email (MailApp).
 * 
 * Usage:
 * NotificationService.notifySlack(webhookKey, messageOrBlocks);
 * NotificationService.sendSms(to, body);
 * NotificationService.sendEmail(to, subject, body);
 */

var NotificationService = (function() {

  // --- PRIVATE HELPERS ---

  function getConfig_() {
    return PropertiesService.getScriptProperties();
  }

  function getSlackUrl_(key) {
    const props = getConfig_();
    // Support direct URL or Property Key
    if (key.startsWith('https://')) return key;
    return props.getProperty(key) || props.getProperty('SLACK_WEBHOOK_GENERAL'); // Fallback
  }

  function logError_(method, error) {
    console.error(`NotificationService.${method} Failed: ${error}`);
  }

  return {
    
    /**
     * Send to Slack via Webhook.
     * @param {string} webhookKey - Script Property Key (e.g., 'SLACK_WEBHOOK_NEW_CASES') or direct URL.
     * @param {string|object} content - Plain text string OR Block Kit JSON object.
     */
    notifySlack: function(webhookKey, content) {
      try {
        const url = getSlackUrl_(webhookKey);
        if (!url) {
          console.warn(`No Slack Webhook found for key: ${webhookKey}`);
          return { success: false, error: 'No webhook URL' };
        }

        const payload = (typeof content === 'string') 
          ? { text: content } 
          : content; // Assume valid block kit object

        const options = {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };

        const res = UrlFetchApp.fetch(url, options);
        if (res.getResponseCode() < 300) return { success: true };
        
        throw new Error(`Slack API ${res.getResponseCode()}: ${res.getContentText()}`);

      } catch (e) {
        logError_('notifySlack', e.message);
        return { success: false, error: e.message };
      }
    },

    /**
     * Helper to route legacy calls to correct webhook based on channel name.
     * @param {string} channel - The channel name (e.g. '#new-cases')
     * @param {string} text - The message text
     * @param {Array} blocks - Optional Block Kit blocks
     */
    sendSlack: function(channel, text, blocks) {
      // 1. Determine Webhook Key based on Channel
      let webhookKey = 'SLACK_WEBHOOK_GENERAL'; // Default fallback
      
      if (channel) {
        const ch = channel.toLowerCase().trim();
        if (ch === '#new-cases' || ch.includes('new-cases')) webhookKey = 'SLACK_WEBHOOK_NEW_CASES';
        else if (ch === '#new-arrests-lee-county' || ch.includes('lee-county')) webhookKey = 'SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY';
        else if (ch === '#intake' || ch.includes('intake')) webhookKey = 'SLACK_WEBHOOK_INTAKE';
        else if (ch === '#court-dates' || ch.includes('court')) webhookKey = 'SLACK_WEBHOOK_COURT_DATES';
        else if (ch === '#forfeitures' || ch.includes('forfeit')) webhookKey = 'SLACK_WEBHOOK_FORFEITURES';
        else if (ch === '#discharges' || ch.includes('discharge')) webhookKey = 'SLACK_WEBHOOK_DISCHARGES';
        else if (ch === '#signing-errors' || ch.includes('signing-error')) webhookKey = 'SLACK_WEBHOOK_SIGNING_ERRORS';
        else if (ch === '#drive' || ch.includes('drive')) webhookKey = 'SLACK_WEBHOOK_DRIVE';
        else if (ch === '#calendar' || ch.includes('calendar')) webhookKey = 'SLACK_WEBHOOK_CALENDAR';
        else if (ch === 'shamrock bail bonds' || ch.includes('shamrock')) webhookKey = 'SLACK_WEBHOOK_SHAMROCK';
        else if (ch === '#general' || ch.includes('general')) webhookKey = 'SLACK_WEBHOOK_GENERAL';
      }

      // 2. Construct Payload
      const payload = {
        text: text || 'Notification'
      };
      if (blocks && Array.isArray(blocks) && blocks.length > 0) {
        payload.blocks = blocks;
      }

      // 3. Send
      return this.notifySlack(webhookKey, payload);
    },

    /**
     * Send a rich new-intake alert to both #intake and #new-cases simultaneously.
     * Used by Telegram_IntakeQueue.js and Wix intake handlers.
     *
     * @param {object} opts - { intakeId, defendantName, facility, county, indemnitorName,
     *                          indemnitorPhone, indemnitorRelation, source, aiRisk }
     */
    sendNewIntakeAlert: function(opts) {
      const riskEmoji = opts.aiRisk === 'High' ? '🔴' : (opts.aiRisk === 'Medium' ? '🟡' : '🟢');
      const sourceLabel = opts.source === 'telegram' ? '📱 Telegram Bot' : '🌐 Wix Portal';
      const message = [
        `${sourceLabel} *New Intake Received*`,
        `*ID:* \`${opts.intakeId || '—'}\``,
        `*Defendant:* ${opts.defendantName || 'Unknown'}`,
        `*Facility:* ${opts.facility || 'Unknown'}${opts.county ? ' (' + opts.county + ' County)' : ''}`,
        `*Co-Signer:* ${opts.indemnitorName || 'Unknown'} (${opts.indemnitorRelation || '?'})`,
        `*Co-Signer Phone:* ${opts.indemnitorPhone || '—'}`,
        `*AI Risk:* ${riskEmoji} ${opts.aiRisk || 'Pending'}`,
        `*Action:* Open Dashboard → Queue tab → Click ⬇️ Process`
      ].join('\n');

      const results = {};
      results.intake    = this.sendSlack('#intake',    message);
      results.newCases  = this.sendSlack('#new-cases', message);
      results.shamrock  = this.sendSlack('shamrock bail bonds', message);
      return results;
    },

    /**
     * Send SMS via Twilio.
     * Uses Script Properties for credentials.
     */
    sendSms: function(to, body) {
      try {
        const props = getConfig_();
        const sid = props.getProperty('TWILIO_ACCOUNT_SID');
        const token = props.getProperty('TWILIO_AUTH_TOKEN');
        const from = props.getProperty('TWILIO_PHONE_NUMBER');

        if (!sid || !token || !from) {
          throw new Error('Missing Twilio credentials in Script Properties');
        }

        // Format Number (E.164)
        let formattedTo = to.toString().replace(/\D/g, '');
        if (formattedTo.length === 10) formattedTo = '+1' + formattedTo;
        else if (formattedTo.length === 11 && formattedTo.startsWith('1')) formattedTo = '+' + formattedTo;
        else if (!formattedTo.startsWith('+')) formattedTo = '+' + formattedTo;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const headers = {
          "Authorization": "Basic " + Utilities.base64Encode(`${sid}:${token}`)
        };

        // UrlFetchApp payload handling for POST form-data
        const payload = {
          "To": formattedTo,
          "From": from,
          "Body": body
        };

        const res = UrlFetchApp.fetch(url, {
          method: "POST",
          headers: headers,
          payload: payload,
          muteHttpExceptions: true
        });

        const json = JSON.parse(res.getContentText());
        
        if (res.getResponseCode() < 300) {
          return { success: true, sid: json.sid };
        } else {
          throw new Error(json.message || json.detail || 'Twilio Error');
        }

      } catch (e) {
        logError_('sendSms', e.message);
        return { success: false, error: e.message };
      }
    },

    /**
     * Send Email via MailApp.
     * Simple wrapper for consistency.
     */
    sendEmail: function(to, subject, body, htmlBody) {
      try {
        MailApp.sendEmail({
          to: to,
          subject: subject,
          body: body,
          htmlBody: htmlBody
        });
        return { success: true };
      } catch (e) {
        logError_('sendEmail', e.message);
        return { success: false, error: e.message };
      }

    },

    /**
     * Send Telegram Message via Telegram Bot API
     * @param {string} to - Recipient chat ID or number
     * @param {string} body - Message text
     * @param {string} mediaUrl - (Optional) URL to media file (voice note, image)
     */
    sendTelegram: function(to, body, mediaUrl) {
      try {
        // Use direct Telegram Bot API
        const telegram = new TelegramBotAPI();
        
        if (mediaUrl) {
          // Determine media type from URL
          if (mediaUrl.includes('.mp3') || mediaUrl.includes('.ogg') || mediaUrl.includes('audio')) {
            return telegram.sendAudio(to, mediaUrl);
          } else if (mediaUrl.includes('.jpg') || mediaUrl.includes('.png') || mediaUrl.includes('image')) {
            return telegram.sendPhoto(to, mediaUrl, body);
          } else {
            // Default to text with URL
            return telegram.sendMessage(to, body + '\n' + mediaUrl);
          }
        } else {
          return telegram.sendMessage(to, body);
        }
      } catch (e) {
        logError_('sendTelegram', e.message);
        return { success: false, error: e.message };
      }
    }

  };
})();

/**
 * Test function to verify all Slack Webhook channels are working
 */
function testSlackWebhooks() {
  const testMessage = "🤖 Test message from Google Apps Script! If you see this, the webhook channel routing is configured correctly.";
  
  const channels = [
    '#new-cases',
    '#new-arrests-lee-county',
    '#intake',
    '#court-dates',
    '#forfeitures',
    '#discharges',
    '#signing-errors'
  ];
  
  channels.forEach(ch => {
    console.log('Sending test message to ' + ch + '...');
    const result = NotificationService.sendSlack(ch, testMessage + ' (' + ch + ')');
    console.log('Result for ' + ch + ': ' + JSON.stringify(result));
  });
}
