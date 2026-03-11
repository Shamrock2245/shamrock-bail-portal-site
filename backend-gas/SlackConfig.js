/**
 * ============================================
 * SLACK CONFIGURATION
 * ============================================
 * Easy configuration for Slack webhook integration
 */

/**
 * Configure Slack webhook via menu
 */
function configureSlackWebhook() {
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.prompt(
    'Slack Webhook Configuration',
    'Enter your Slack Webhook URL:\n\n' +
    '1. Go to https://api.slack.com/apps\n' +
    '2. Select your app (or create one)\n' +
    '3. Go to "Incoming Webhooks"\n' +
    '4. Copy the webhook URL\n\n' +
    'Webhook URL:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    var webhookUrl = response.getResponseText().trim();
    
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      ui.alert('❌ Invalid webhook URL. It should start with https://hooks.slack.com/');
      return;
    }
    
    // Save to script properties
    PropertiesService.getScriptProperties().setProperty('SLACK_WEBHOOK_URL', webhookUrl);
    
    // Update ArrestLeadRouter config if it exists
    if (typeof ROUTER !== 'undefined' && ROUTER.CFG) {
      ROUTER.CFG.SLACK_WEBHOOK_URL = webhookUrl;
    }
    
    ui.alert('✅ Slack webhook configured successfully!\n\nYou can now route leads to Slack.');
  }
}

/**
 * Get Slack webhook URL from properties
 */
function getSlackWebhookUrl() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('SLACK_WEBHOOK_URL') || '';
}

/**
 * Send a test message to Slack
 */
function testSlackNotification() {
  var webhookUrl = getSlackWebhookUrl();
  
  if (!webhookUrl) {
    SpreadsheetApp.getUi().alert('❌ Slack webhook not configured.\n\nPlease configure it first via:\n📨 SignNow & Slack → 🔧 Configure Slack Webhook');
    return;
  }
  
  try {
    var message = {
      text: '🍀 *Shamrock Bail Bonds - Test Message*\n\n' +
            'This is a test notification from your Google Sheets automation.\n\n' +
            '✅ Slack integration is working correctly!\n\n' +
            '_Sent at: ' + new Date().toLocaleString() + '_'
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(message),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(webhookUrl, options);
    var code = response.getResponseCode();
    
    if (code === 200) {
      SpreadsheetApp.getUi().alert('✅ Test message sent successfully!\n\nCheck your Slack channel.');
    } else {
      SpreadsheetApp.getUi().alert('❌ Failed to send message\n\nStatus: ' + code + '\nResponse: ' + response.getContentText());
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.message);
  }
}

/**
 * Send arrest notification to Slack
 */
function sendArrestNotificationToSlack(arrestData) {
  var webhookUrl = getSlackWebhookUrl();
  
  if (!webhookUrl) {
    Logger.log('⚠️ Slack webhook not configured, skipping notification');
    return false;
  }
  
  try {
    var message = formatArrestSlackMessage(arrestData);
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: message }),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(webhookUrl, options);
    var code = response.getResponseCode();
    
    if (code === 200) {
      Logger.log('✅ Slack notification sent for booking #' + arrestData.Booking_Number);
      return true;
    } else {
      Logger.log('⚠️ Slack notification failed: ' + code);
      return false;
    }
  } catch (error) {
    Logger.log('⚠️ Slack error: ' + error.message);
    return false;
  }
}

/**
 * Format arrest data for Slack message
 */
function formatArrestSlackMessage(data) {
  var lines = [];
  
  lines.push('🚨 *New Arrest - ' + (data.Full_Name || 'Unknown') + '*');
  lines.push('');
  lines.push('📋 *Booking #:* ' + (data.Booking_Number || '-'));
  
  if (data.DOB) lines.push('🎂 *DOB:* ' + data.DOB);
  if (data.Booking_Date) lines.push('📅 *Booked:* ' + data.Booking_Date + (data.Booking_Time ? ' at ' + data.Booking_Time : ''));
  if (data.Status) lines.push('📍 *Status:* ' + data.Status);
  if (data.Facility) lines.push('🏢 *Facility:* ' + data.Facility);
  
  lines.push('');
  
  if (data.Charges) {
    lines.push('⚖️ *Charges:*');
    var charges = data.Charges.split(' | ');
    charges.slice(0, 3).forEach(function(charge) {
      lines.push('  • ' + charge);
    });
    if (charges.length > 3) {
      lines.push('  • _...and ' + (charges.length - 3) + ' more_');
    }
    lines.push('');
  }
  
  if (data.Bond_Amount || data.Bond_Type) {
    lines.push('💰 *Bond:* ' + (data.Bond_Type || '') + ' ' + (data.Bond_Amount ? '$' + data.Bond_Amount : ''));
  }
  
  if (data.Court_Date) {
    lines.push('📅 *Court Date:* ' + data.Court_Date + (data.Court_Time ? ' at ' + data.Court_Time : ''));
  }
  
  if (data.Address || data.City) {
    var addr = [data.Address, data.City, data.State, data.ZIP].filter(Boolean).join(', ');
    lines.push('🏠 *Address:* ' + addr);
  }
  
  lines.push('');
  
  // Add lead score if available
  if (data.Lead_Score !== undefined && data.Lead_Score !== '') {
    var score = parseInt(data.Lead_Score);
    var emoji = score >= 70 ? '🔥' : score >= 40 ? '🌡️' : '❄️';
    lines.push(emoji + ' *Lead Score:* ' + score + '/100 (' + (data.Lead_Status || 'Unknown') + ')');
  }
  
  // Add links
  if (data.Detail_URL) {
    lines.push('');
    lines.push('🔗 <' + data.Detail_URL + '|View Full Details>');
  }
  
  if (data.Google_Search) {
    lines.push('🔍 <' + data.Google_Search + '|Google Search>');
  }
  
  return lines.join('\n');
}

