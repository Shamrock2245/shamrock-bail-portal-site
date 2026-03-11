/**
 * ============================================
 * SLACK NOTIFIER - Team Communication
 * ============================================
 * This file handles sending notifications to Slack channels.
 */

/**
 * Post To Slack
 * 
 * Sends a message to a Slack channel via webhook.
 * 
 * @param {String} channel - The Slack channel name (e.g., '#court-dates')
 * @param {String} message - The message to send
 * @param {Boolean} isError - true for error messages, false for normal
 */
function postToSlack(channel, message, isError) {
  
  try {
    // Get webhook URL from Script Properties
    var webhookUrl = getScriptProperty('SLACK_WEBHOOK_COURT');
    
    if (!webhookUrl) {
      Logger.log('⚠️ Slack webhook URL not configured');
      return; // Fail silently - don't break the whole workflow
    }
    
    // Choose emoji and color based on message type
    var icon = isError ? ':warning:' : ':calendar:';
    var color = isError ? '#EA4335' : '#34A853'; // Red for errors, green for success
    
    // Build Slack message payload
    var payload = {
      channel: channel,
      username: 'Court Date Bot',
      icon_emoji: icon,
      attachments: [{
        color: color,
        text: message,
        footer: 'Shamrock Bail Bonds Automation',
        footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
        ts: Math.floor(Date.now() / 1000) // Unix timestamp
      }]
    };
    
    // Send to Slack
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // Don't throw errors if Slack fails
    };
    
    var response = UrlFetchApp.fetch(webhookUrl, options);
    var responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      Logger.log('✅ Slack notification sent');
    } else {
      Logger.log('⚠️ Slack notification failed with code: ' + responseCode);
    }
    
  } catch (error) {
    Logger.log('⚠️ Slack notification error: ' + error.message);
    // Don't throw - Slack failure shouldn't break the main workflow
  }
}

/**
 * Send Daily Summary To Slack
 * 
 * Sends a summary of the day's court date activity.
 * This could be called by a daily trigger if desired.
 */
function sendDailySummaryToSlack() {
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    var today = Utilities.formatDate(new Date(), CONFIG.BUSINESS_HOURS.TIMEZONE, 'yyyy-MM-dd');
    
    // Count how many court dates were updated today
    var lastUpdatedColumn = CONFIG.COLUMNS.COURT_LAST_UPDATED;
    var allData = sheet.getDataRange().getValues();
    
    var todayCount = 0;
    
    for (var i = 1; i < allData.length; i++) {
      var updateTimestamp = allData[i][lastUpdatedColumn - 1];
      
      if (updateTimestamp) {
        var updateDate = Utilities.formatDate(new Date(updateTimestamp), 
                                             CONFIG.BUSINESS_HOURS.TIMEZONE, 'yyyy-MM-dd');
        if (updateDate === today) {
          todayCount++;
        }
      }
    }
    
    var summaryMsg = '📊 *Daily Court Date Summary* - ' + today + '\n\n' +
                    '✅ Court dates processed today: ' + todayCount + '\n' +
                    '📧 Reminders sent today: (tracked separately)';
    
    postToSlack(CONFIG.SLACK_CHANNELS.COURT_DATES, summaryMsg, false);
    
  } catch (error) {
    Logger.log('❌ Error sending daily summary: ' + error.message);
  }
}
