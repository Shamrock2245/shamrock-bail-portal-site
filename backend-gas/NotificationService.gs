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
    }

  };
})();
