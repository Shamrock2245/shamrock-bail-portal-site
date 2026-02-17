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
        else if (ch === '#new-arrests-lee-county' || ch.includes('lee-county')) webhookKey = 'SLACK_WEBHOOK_NEW_CASES'; // Map to same webhook or new one if needed
        else if (ch === '#intake' || ch.includes('intake')) webhookKey = 'SLACK_WEBHOOK_INTAKE'; // New webhook needed? Or map to General?
        else if (ch === '#court-dates' || ch.includes('court')) webhookKey = 'SLACK_WEBHOOK_COURT_DATES';
        else if (ch === '#forfeitures' || ch.includes('forfeit')) webhookKey = 'SLACK_WEBHOOK_FORFEITURES';
        else if (ch === '#discharges' || ch.includes('discharge')) webhookKey = 'SLACK_WEBHOOK_DISCHARGES';
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
     * Send WhatsApp Message via Direct Cloud API (No Twilio)
     * @param {string} to - Recipient number (e.g. +1239...)
     * @param {string} body - Message text
     * @param {string} mediaUrl - (Optional) URL to media file (voice note, image)
     */
    sendWhatsApp: function(to, body, mediaUrl) {
      try {
        // Use direct WhatsApp Cloud API
        const whatsapp = new WhatsAppCloudAPI();
        
        if (mediaUrl) {
          // Determine media type from URL
          if (mediaUrl.includes('.mp3') || mediaUrl.includes('.ogg') || mediaUrl.includes('audio')) {
            return whatsapp.sendAudio(to, mediaUrl);
          } else if (mediaUrl.includes('.jpg') || mediaUrl.includes('.png') || mediaUrl.includes('image')) {
            return whatsapp.sendImage(to, mediaUrl, body);
          } else {
            // Default to text with URL
            return whatsapp.sendText(to, body + '\n' + mediaUrl);
          }
        } else {
          return whatsapp.sendText(to, body);
        }
      } catch (e) {
        logError_('sendWhatsApp', e.message);
        return { success: false, error: e.message };
      }
    },

    /**
     * Send WhatsApp Message via Twilio (DEPRECATED - Use sendWhatsApp instead)
     * @param {string} to - Recipient number (e.g. +1239...)
     * @param {string} body - Message text
     * @param {string} mediaUrl - (Optional) URL to media file (voice note, image)
     */
    sendWhatsAppTwilio: function(to, body, mediaUrl) {
      try {
        const props = getConfig_();
        const sid = props.getProperty('TWILIO_ACCOUNT_SID');
        const token = props.getProperty('TWILIO_AUTH_TOKEN');
        // Default to provided number if property missing
        const from = props.getProperty('TWILIO_WHATSAPP_NUMBER') || '+12399550178'; 

        if (!sid || !token) throw new Error('Missing Twilio credentials');

        // Format Number (E.164)
        let formattedTo = to.toString().replace(/\D/g, '');
        if (formattedTo.length === 10) formattedTo = '+1' + formattedTo;
        else if (formattedTo.length === 11 && formattedTo.startsWith('1')) formattedTo = '+' + formattedTo;
        else if (!formattedTo.startsWith('+')) formattedTo = '+' + formattedTo;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const headers = {
          "Authorization": "Basic " + Utilities.base64Encode(`${sid}:${token}`)
        };

        const payload = {
          "To": `whatsapp:${formattedTo}`,
          "From": `whatsapp:${from}`,
          "Body": body
        };

        if (mediaUrl) {
            payload["MediaUrl"] = mediaUrl;
        }

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
          return { success: false, error: json.message || 'Twilio Error' };
        }

      } catch (e) {
        logError_('sendWhatsApp', e.message);
        return { success: false, error: e.message };
      }
    }

  };
})();
