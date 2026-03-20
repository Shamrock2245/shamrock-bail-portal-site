/**
 * ============================================================================
 * TwilioCampaignMonitor.js
 * ============================================================================
 * Polls the Twilio Messaging API for A2P 10DLC campaign status changes.
 * Fires a Slack alert when the campaign moves from IN_PROGRESS → VERIFIED or FAILED.
 *
 * Required Script Properties:
 *   TWILIO_ACCOUNT_SID          - Twilio Account SID
 *   TWILIO_AUTH_TOKEN            - Twilio Auth Token
 *   TWILIO_MESSAGING_SERVICE_SID - Messaging Service SID (MG...)
 *   TWILIO_CAMPAIGN_SID          - A2P Campaign Compliance SID (QE...)
 *
 * Auto-managed Script Properties:
 *   TWILIO_CAMPAIGN_LAST_STATUS  - Stores last-known campaign_status to detect changes
 *
 * Usage:
 *   checkTwilioCampaignStatus()  — called via handleGetAction or directly in Script Editor
 */

function checkTwilioCampaignStatus() {
  const props = PropertiesService.getScriptProperties();
  const sid = props.getProperty('TWILIO_ACCOUNT_SID');
  const token = props.getProperty('TWILIO_AUTH_TOKEN');
  const messagingServiceSid = props.getProperty('TWILIO_MESSAGING_SERVICE_SID');
  const campaignSid = props.getProperty('TWILIO_CAMPAIGN_SID');

  // ── GUARD: Missing config ─────────────────────────────────────────────────
  if (!sid || !token) {
    console.warn('TwilioCampaignMonitor: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    return { success: false, error: 'Missing Twilio credentials' };
  }

  if (!messagingServiceSid || !campaignSid) {
    console.warn('TwilioCampaignMonitor: Missing TWILIO_MESSAGING_SERVICE_SID or TWILIO_CAMPAIGN_SID. Register a campaign first.');
    return {
      success: false,
      error: 'Campaign not registered yet. Set TWILIO_MESSAGING_SERVICE_SID and TWILIO_CAMPAIGN_SID in Script Properties after registering a campaign in Twilio Console.'
    };
  }

  // ── FETCH CAMPAIGN STATUS ─────────────────────────────────────────────────
  const url = 'https://messaging.twilio.com/v1/Services/' + messagingServiceSid +
              '/Compliance/Usa2p/' + campaignSid;

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(sid + ':' + token)
      },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    const body = JSON.parse(response.getContentText());

    if (statusCode >= 300) {
      console.error('TwilioCampaignMonitor: API returned ' + statusCode + ' — ' + JSON.stringify(body));
      return { success: false, error: 'Twilio API error ' + statusCode, details: body };
    }

    const currentStatus = body.campaign_status || 'UNKNOWN';
    const campaignId = body.campaign_id || 'N/A';
    const useCase = body.us_app_to_person_usecase || 'N/A';
    const description = body.description || '';
    const errors = body.errors || [];

    console.log('TwilioCampaignMonitor: campaign_status = ' + currentStatus +
                ' | campaign_id = ' + campaignId + ' | use_case = ' + useCase);

    // ── COMPARE TO LAST KNOWN STATUS ──────────────────────────────────────
    const lastStatus = props.getProperty('TWILIO_CAMPAIGN_LAST_STATUS') || '';
    const statusChanged = (lastStatus !== currentStatus);

    if (statusChanged) {
      // Save new status
      props.setProperty('TWILIO_CAMPAIGN_LAST_STATUS', currentStatus);

      // ── BUILD SLACK ALERT ─────────────────────────────────────────────
      var emoji = '📋';
      var urgency = '';
      if (currentStatus === 'VERIFIED') {
        emoji = '✅';
        urgency = '🎉 *YOUR NUMBER CAN NOW SEND MESSAGES!*\nAdd your phone number to the Messaging Service sender pool to activate.';
      } else if (currentStatus === 'FAILED') {
        emoji = '❌';
        urgency = '⚠️ *Campaign was REJECTED.* Check the Twilio Console for rejection reasons and resubmit.';
      } else if (currentStatus === 'SUSPENDED') {
        emoji = '🚫';
        urgency = '⚠️ *Campaign SUSPENDED.* Contact Twilio support immediately.';
      } else if (currentStatus === 'IN_PROGRESS') {
        emoji = '⏳';
        urgency = 'Campaign is under review. This typically takes 10-15 business days.';
      }

      var alertMessage = emoji + ' *Twilio A2P Campaign Status Changed*\n\n' +
        '*Previous:* ' + (lastStatus || '(first check)') + '\n' +
        '*Current:* *' + currentStatus + '*\n' +
        '*Campaign ID:* `' + campaignId + '`\n' +
        '*Use Case:* ' + useCase + '\n' +
        '*Description:* ' + (description.substring(0, 200) || 'N/A');

      if (errors.length > 0) {
        alertMessage += '\n\n*Errors:*\n';
        errors.forEach(function(err) {
          alertMessage += '• ' + (typeof err === 'string' ? err : JSON.stringify(err)) + '\n';
        });
      }

      if (urgency) {
        alertMessage += '\n\n' + urgency;
      }

      // Send to #shamrock
      if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
        NotificationService.sendSlack('#general', alertMessage);
        console.log('TwilioCampaignMonitor: Slack alert sent — status changed from "' + lastStatus + '" to "' + currentStatus + '"');
      } else {
        console.warn('TwilioCampaignMonitor: NotificationService not available, could not send Slack alert');
      }
    } else {
      console.log('TwilioCampaignMonitor: No change (still ' + currentStatus + ')');
    }

    // ── RETURN RESULT ───────────────────────────────────────────────────────
    return {
      success: true,
      campaignStatus: currentStatus,
      campaignId: campaignId,
      useCase: useCase,
      statusChanged: statusChanged,
      previousStatus: lastStatus || null,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (e) {
    console.error('TwilioCampaignMonitor: Exception — ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * ONE-TIME SETUP: Run this from the Script Editor to configure the campaign monitor.
 * - Stores the Messaging Service SID
 * - Queries Twilio API to discover any existing campaigns under that service
 * - Stores the Campaign SID if found
 */
function setupTwilioCampaignMonitor() {
  var props = PropertiesService.getScriptProperties();
  var sid = props.getProperty('TWILIO_ACCOUNT_SID');
  var token = props.getProperty('TWILIO_AUTH_TOKEN');

  if (!sid || !token) {
    console.error('Setup failed: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing');
    return { success: false, error: 'Missing Twilio credentials' };
  }

  // ── STORE MESSAGING SERVICE SID ─────────────────────────────────────────
  var mgSid = 'MGcc344110eb82f361555317f08787c53b';
  props.setProperty('TWILIO_MESSAGING_SERVICE_SID', mgSid);
  console.log('✅ Set TWILIO_MESSAGING_SERVICE_SID = ' + mgSid);

  // ── DISCOVER CAMPAIGNS UNDER THIS SERVICE ───────────────────────────────
  var url = 'https://messaging.twilio.com/v1/Services/' + mgSid + '/Compliance/Usa2p';

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(sid + ':' + token)
      },
      muteHttpExceptions: true
    });

    var statusCode = response.getResponseCode();
    var body = JSON.parse(response.getContentText());

    console.log('Twilio API response (' + statusCode + '): ' + JSON.stringify(body).substring(0, 500));

    if (statusCode >= 300) {
      console.warn('No campaigns found or API error: ' + statusCode);
      return {
        success: true,
        messagingServiceSid: mgSid,
        campaigns: [],
        message: 'Messaging Service SID stored. No campaigns found yet — register one in Twilio Console.'
      };
    }

    // Parse campaign list
    var campaigns = body.compliance || body.results || [];
    if (!Array.isArray(campaigns)) campaigns = [campaigns];

    if (campaigns.length > 0) {
      var campaign = campaigns[0]; // Take the first campaign
      var qeSid = campaign.sid || '';
      var campaignStatus = campaign.campaign_status || 'UNKNOWN';
      var campaignId = campaign.campaign_id || 'N/A';
      var useCase = campaign.us_app_to_person_usecase || 'N/A';

      if (qeSid) {
        props.setProperty('TWILIO_CAMPAIGN_SID', qeSid);
        props.setProperty('TWILIO_CAMPAIGN_LAST_STATUS', campaignStatus);
        console.log('✅ Set TWILIO_CAMPAIGN_SID = ' + qeSid);
        console.log('✅ Set TWILIO_CAMPAIGN_LAST_STATUS = ' + campaignStatus);
      }

      // Send a Slack notification about the setup
      if (typeof NotificationService !== 'undefined' && NotificationService.sendSlack) {
        NotificationService.sendSlack('#general',
          '🔧 *Twilio Campaign Monitor Configured*\n\n' +
          '*Messaging Service:* `' + mgSid + '`\n' +
          '*Campaign SID:* `' + qeSid + '`\n' +
          '*Campaign ID:* ' + campaignId + '\n' +
          '*Use Case:* ' + useCase + '\n' +
          '*Current Status:* *' + campaignStatus + '*\n\n' +
          'The monitor is now active and will alert on status changes.');
      }

      return {
        success: true,
        messagingServiceSid: mgSid,
        campaignSid: qeSid,
        campaignStatus: campaignStatus,
        campaignId: campaignId,
        useCase: useCase,
        allCampaigns: campaigns.map(function(c) {
          return { sid: c.sid, status: c.campaign_status, useCase: c.us_app_to_person_usecase };
        })
      };
    }

    return {
      success: true,
      messagingServiceSid: mgSid,
      campaigns: [],
      message: 'Messaging Service SID stored. No campaigns registered yet.'
    };

  } catch (e) {
    console.error('Setup error: ' + e.message);
    return { success: false, error: e.message, messagingServiceSid: mgSid };
  }
}
