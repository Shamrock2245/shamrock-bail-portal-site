/**
 * Slack Integration Setup
 * Securely stores Slack credentials in Script Properties
 */

/**
 * Quick setup - Call this from Apps Script editor with your credentials
 * Example: quickSetupSlack('https://hooks.slack.com/...', 'xoxb-...', '#channel')
 */
function quickSetupSlack(webhookUrl, oauthToken, defaultChannel) {
  var props = PropertiesService.getScriptProperties();
  
  if (webhookUrl) {
    props.setProperty('SLACK_WEBHOOK_URL', webhookUrl);
    Logger.log('✅ Webhook URL saved');
  }
  
  if (oauthToken) {
    props.setProperty('SLACK_OAUTH_TOKEN', oauthToken);
    Logger.log('✅ OAuth token saved');
  }
  
  if (defaultChannel) {
    props.setProperty('SLACK_DEFAULT_CHANNEL', defaultChannel);
    Logger.log('✅ Default channel saved: ' + defaultChannel);
  }
  
  Logger.log('✅ Slack credentials configured successfully');
  
  // Test connection
  return testSlackConnection();
}

/**
 * Setup Slack via UI prompts (menu-based)
 */
function menuSetupSlack() {
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.alert(
    'Setup Slack Integration',
    'This will configure Slack notifications for qualified arrests.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  // Get webhook URL
  var webhookResponse = ui.prompt(
    'Slack Webhook URL',
    'Enter your Slack Incoming Webhook URL:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (webhookResponse.getSelectedButton() !== ui.Button.OK) return;
  
  var webhookUrl = webhookResponse.getResponseText().trim();
  
  if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
    ui.alert('❌ Invalid webhook URL');
    return;
  }
  
  // Get OAuth token (optional)
  var tokenResponse = ui.prompt(
    'Slack OAuth Token (Optional)',
    'Enter your Slack Bot User OAuth Token (or leave blank):',
    ui.ButtonSet.OK_CANCEL
  );
  
  var oauthToken = '';
  if (tokenResponse.getSelectedButton() === ui.Button.OK) {
    oauthToken = tokenResponse.getResponseText().trim();
  }
  
  // Get default channel
  var channelResponse = ui.prompt(
    'Default Slack Channel',
    'Enter the default channel (e.g., #new-arrests-lee-county):',
    ui.ButtonSet.OK_CANCEL
  );
  
  var defaultChannel = '#new-arrests-lee-county';
  if (channelResponse.getSelectedButton() === ui.Button.OK) {
    defaultChannel = channelResponse.getResponseText().trim();
  }
  
  // Save credentials
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SLACK_WEBHOOK_URL', webhookUrl);
  if (oauthToken) {
    props.setProperty('SLACK_OAUTH_TOKEN', oauthToken);
  }
  props.setProperty('SLACK_DEFAULT_CHANNEL', defaultChannel);
  
  // Test connection
  var testResult = testSlackConnection();
  
  if (testResult) {
    ui.alert('✅ Slack configured successfully!\n\nCheck your ' + defaultChannel + ' channel for a test message.');
  } else {
    ui.alert('⚠️ Configuration saved but test failed.\n\nPlease check your webhook URL.');
  }
}

/**
 * Test Slack connection
 */
function testSlackConnection() {
  var webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
  
  if (!webhookUrl) {
    Logger.log('❌ Slack webhook not configured');
    return false;
  }
  
  try {
    var message = {
      text: '🍀 *Shamrock Bail Bonds - Slack Integration Active!*\n\n' +
            '✅ Your automation system is now connected to Slack.\n\n' +
            'You will receive notifications for:\n' +
            '• New arrests from Lee County\n' +
            '• Qualified leads (score >= 70)\n' +
            '• Court date updates\n\n' +
            '_Test sent at: ' + new Date().toLocaleString() + '_'
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
      Logger.log('✅ Slack test message sent successfully!');
      return true;
    } else {
      Logger.log('❌ Slack test failed. Status: ' + code);
      return false;
    }
  } catch (error) {
    Logger.log('❌ Error testing Slack: ' + error.message);
    return false;
  }
}

/**
 * Send notification for a qualified arrest
 */
function sendQualifiedArrestNotification(arrest) {
  var webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
  var defaultChannel = PropertiesService.getScriptProperties().getProperty('SLACK_DEFAULT_CHANNEL') || '#new-arrests-lee-county';
  
  if (!webhookUrl) {
    Logger.log('⚠️ Slack webhook not configured - skipping notification');
    return false;
  }
  
  try {
    var message = formatQualifiedArrestMessage(arrest);
    
    var payload = {
      text: message,
      channel: defaultChannel
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(webhookUrl, options);
    var code = response.getResponseCode();
    
    if (code === 200) {
      Logger.log('✅ Slack notification sent: ' + arrest.Full_Name);
      return true;
    } else {
      Logger.log('⚠️ Slack notification failed: ' + code);
      return false;
    }
  } catch (error) {
    Logger.log('⚠️ Error sending Slack notification: ' + error.message);
    return false;
  }
}

/**
 * Format qualified arrest message for Slack
 */
function formatQualifiedArrestMessage(arrest) {
  var lines = [];
  
  lines.push('🔥 *NEW QUALIFIED LEAD - ACTION REQUIRED*');
  lines.push('');
  lines.push('*' + (arrest.Full_Name || 'Unknown') + '*');
  lines.push('📋 Booking #: ' + (arrest.Booking_Number || '-'));
  lines.push('🎯 Lead Score: *' + arrest.Lead_Score + '/100* (' + (arrest.Lead_Status || 'Hot') + ')');
  lines.push('');
  
  if (arrest.DOB) lines.push('🎂 DOB: ' + arrest.DOB);
  if (arrest.Booking_Date) lines.push('📅 Booked: ' + arrest.Booking_Date);
  if (arrest.Status) lines.push('📍 Status: ' + arrest.Status);
  
  lines.push('');
  
  if (arrest.Charges) {
    lines.push('⚖️ *Charges:*');
    var charges = arrest.Charges.split(' | ');
    charges.slice(0, 2).forEach(function(charge) {
      lines.push('  • ' + charge);
    });
    if (charges.length > 2) {
      lines.push('  • _...and ' + (charges.length - 2) + ' more_');
    }
    lines.push('');
  }
  
  if (arrest.Bond_Amount || arrest.Bond_Type) {
    lines.push('💰 *Bond:* ' + (arrest.Bond_Type || '') + ' $' + (arrest.Bond_Amount || '0'));
  }
  
  if (arrest.Court_Date) {
    lines.push('📅 *Court:* ' + arrest.Court_Date + (arrest.Court_Time ? ' at ' + arrest.Court_Time : ''));
  }
  
  if (arrest.Address || arrest.City) {
    var addr = [arrest.Address, arrest.City, arrest.State, arrest.ZIP].filter(Boolean).join(', ');
    lines.push('🏠 *Address:* ' + addr);
  }
  
  lines.push('');
  lines.push('*🔍 Quick Actions:*');
  
  if (arrest.Google_Search) {
    lines.push('• <' + arrest.Google_Search + '|Google Search>');
  }
  if (arrest.Facebook_Search) {
    lines.push('• <' + arrest.Facebook_Search + '|Facebook Search>');
  }
  if (arrest.TruePeopleSearch) {
    lines.push('• <' + arrest.TruePeopleSearch + '|TruePeopleSearch>');
  }
  if (arrest.Detail_URL) {
    lines.push('• <' + arrest.Detail_URL + '|View Full Details>');
  }
  
  lines.push('');
  lines.push('📊 <https://docs.google.com/spreadsheets/d/1_8jmb3UsbDNWoEtD2_5O27JNvXKBExrQq2pG0W-mPJI|View in Qualified Arrests Sheet>');
  
  return lines.join('\n');
}

/**
 * View current Slack configuration
 */
function viewSlackConfig() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty('SLACK_WEBHOOK_URL');
  var oauthToken = props.getProperty('SLACK_OAUTH_TOKEN');
  var defaultChannel = props.getProperty('SLACK_DEFAULT_CHANNEL');
  
  var config = [];
  config.push('🍀 SLACK CONFIGURATION');
  config.push('═══════════════════════════════════════');
  config.push('');
  config.push('Webhook URL: ' + (webhookUrl ? '✅ Configured' : '❌ Not configured'));
  config.push('OAuth Token: ' + (oauthToken ? '✅ Configured' : '⚠️ Not configured (optional)'));
  config.push('Default Channel: ' + (defaultChannel || '#new-arrests-lee-county'));
  config.push('');
  config.push('═══════════════════════════════════════');
  
  Logger.log(config.join('\n'));
  
  if (typeof SpreadsheetApp !== 'undefined') {
    SpreadsheetApp.getUi().alert(config.join('\n'));
  }
}

