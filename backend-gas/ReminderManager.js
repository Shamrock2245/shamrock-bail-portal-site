/**
 * ============================================
 * REMINDER MANAGER - Automated Court Reminders
 * ============================================
 * This file handles scheduling and sending court date reminders.
 */

/**
 * Schedule Court Reminders
 * 
 * Creates time-based triggers that will automatically send reminders
 * at 7 days, 3 days, and 1 day before the court date.
 * 
 * @param {Object} courtData - Court date information
 * @param {Object} clientData - Client information
 */
function scheduleCourtReminders(courtData, clientData) {
  
  try {
    // Step 1: Parse the court date
    var courtDateTime = parseDateTimeString(courtData.courtDate, courtData.courtTime);
    
    if (!courtDateTime) {
      Logger.log('❌ Could not parse court date for reminders');
      return;
    }
    
    Logger.log('📅 Court date: ' + courtDateTime);
    
    var now = new Date();
    var rowNumber = clientData.rowNumber;
    
    // Step 2: Calculate reminder dates
    // For each reminder, we'll send it at 9 AM on that day
    var reminderDays = CONFIG.REMINDER_DAYS; // [7, 3, 1]
    
    reminderDays.forEach(function(daysBeforeCourt) {
      
      // Calculate the date for this reminder
      var reminderDate = new Date(courtDateTime.getTime());
      reminderDate.setDate(reminderDate.getDate() - daysBeforeCourt); // Subtract days
      
      // Set time to 9 AM
      reminderDate.setHours(CONFIG.REMINDER_TIME); // 9 AM
      reminderDate.setMinutes(0);
      reminderDate.setSeconds(0);
      
      Logger.log(daysBeforeCourt + ' day reminder scheduled for: ' + reminderDate);
      
      // Only create trigger if reminder date is in the future
      if (reminderDate > now) {
        
        // Create a time-based trigger
        var trigger = ScriptApp.newTrigger('sendCourtReminder')
          .timeBased()
          .at(reminderDate)
          .create();
        
        // Store trigger metadata so we know which row and reminder type
        var triggerProperties = PropertiesService.getScriptProperties();
        var triggerKey = 'REMINDER_' + trigger.getUniqueId();
        
        var triggerData = {
          rowNumber: rowNumber,
          reminderType: daysBeforeCourt + 'd', // '7d', '3d', or '1d'
          caseNumber: clientData.caseNumber
        };
        
        triggerProperties.setProperty(triggerKey, JSON.stringify(triggerData));
        
        Logger.log('✅ Created trigger for ' + daysBeforeCourt + 'd reminder (Trigger ID: ' + 
                  trigger.getUniqueId() + ')');
        
      } else {
        Logger.log('⏭️ Skipping ' + daysBeforeCourt + 'd reminder (date already passed)');
      }
    });
    
  } catch (error) {
    Logger.log('❌ Error scheduling reminders: ' + error.message);
  }
}

/**
 * Send Court Reminder
 * 
 * This function is called automatically by the time-based triggers.
 * It sends reminder emails to the defendant and indemnitors.
 * 
 * @param {Object} e - Event object from trigger (contains trigger ID)
 */
function sendCourtReminder(e) {
  
  try {
    // Step 1: Get trigger metadata to know which client and reminder type
    var triggerId = e && e.triggerUid ? e.triggerUid : null;
    
    if (!triggerId) {
      Logger.log('❌ No trigger ID found');
      return;
    }
    
    var triggerProperties = PropertiesService.getScriptProperties();
    var triggerKey = 'REMINDER_' + triggerId;
    var triggerDataJson = triggerProperties.getProperty(triggerKey);
    
    if (!triggerDataJson) {
      Logger.log('❌ No trigger data found for: ' + triggerKey);
      return;
    }
    
    var triggerData = JSON.parse(triggerDataJson);
    
    Logger.log('📧 Sending ' + triggerData.reminderType + ' reminder for row ' + 
              triggerData.rowNumber);
    
    // Step 2: Get current client data from sheet
    var clientData = getClientDataByRow(triggerData.rowNumber);
    
    if (!clientData) {
      Logger.log('❌ Could not find client data for row ' + triggerData.rowNumber);
      return;
    }
    
    // Step 3: Get court date from sheet
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    var courtDate = sheet.getRange(triggerData.rowNumber, CONFIG.COLUMNS.COURT_DATE).getValue();
    var courtTime = sheet.getRange(triggerData.rowNumber, CONFIG.COLUMNS.COURT_TIME).getValue();
    var courtLocation = sheet.getRange(triggerData.rowNumber, CONFIG.COLUMNS.COURT_LOCATION).getValue();
    var hearingType = sheet.getRange(triggerData.rowNumber, CONFIG.COLUMNS.HEARING_TYPE).getValue();
    
    // Step 4: Send reminder emails
    sendReminderEmail(clientData, {
      courtDate: courtDate,
      courtTime: courtTime,
      location: courtLocation,
      hearingType: hearingType
    }, triggerData.reminderType);
    
    // Step 5: Mark reminder as sent in sheet
    markReminderAsSent(triggerData.rowNumber, triggerData.reminderType);
    
    // Step 6: Notify Slack
    var slackMsg = '📧 ' + triggerData.reminderType + ' reminder sent:\n' +
                  '   • Case: ' + clientData.caseNumber + '\n' +
                  '   • Name: ' + clientData.defendantName + '\n' +
                  '   • Court Date: ' + courtDate + ' at ' + courtTime;
    
    notifySlack(slackMsg, false);
    
    // Step 7: Clean up trigger data
    triggerProperties.deleteProperty(triggerKey);
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getUniqueId() === triggerId) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    Logger.log('✅ Reminder sent and trigger cleaned up');
    
  } catch (error) {
    Logger.log('❌ Error sending reminder: ' + error.message);
    notifySlack('❌ Failed to send reminder: ' + error.message, true);
  }
}

/**
 * Send Reminder Email
 * 
 * Sends the actual reminder email with court details.
 * 
 * @param {Object} clientData - Client information
 * @param {Object} courtData - Court date details
 * @param {String} reminderType - '7d', '3d', or '1d'
 */
function sendReminderEmail(clientData, courtData, reminderType) {
  
  try {
    // Build email subject
    var subject = '⚖️ Court Appearance Reminder: ' + courtData.courtDate;
    
    // Build email body
    var emailBody = buildReminderEmailBody(clientData, courtData, reminderType);
    
    // Collect all email addresses
    var recipients = [];
    
    if (clientData.defendantEmail) {
      recipients.push(clientData.defendantEmail);
    }
    
    if (clientData.indemnitorEmail) {
      // Indemnitor email might be comma-separated list
      var indemnitorEmails = clientData.indemnitorEmail.split(',');
      indemnitorEmails.forEach(function(email) {
        var trimmedEmail = email.trim();
        if (trimmedEmail) {
          recipients.push(trimmedEmail);
        }
      });
    }
    
    if (recipients.length === 0) {
      Logger.log('⚠️ No email addresses found for this client');
      return;
    }
    
    Logger.log('Sending to: ' + recipients.join(', '));
    
    // Send email
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: subject,
      htmlBody: emailBody,
      name: CONFIG.COMPANY.NAME
    });
    
    Logger.log('✅ Reminder email sent to ' + recipients.length + ' recipient(s)');
    
  } catch (error) {
    Logger.log('❌ Error sending email: ' + error.message);
    throw error;
  }
}

/**
 * Build Reminder Email Body
 * 
 * Creates the HTML email content for court reminders.
 * 
 * @param {Object} clientData - Client information
 * @param {Object} courtData - Court details
 * @param {String} reminderType - '7d', '3d', or '1d'
 * @return {String} HTML email body
 */
function buildReminderEmailBody(clientData, courtData, reminderType) {
  
  // Determine urgency level based on reminder type
  var urgencyColor = '#4285F4'; // Blue
  var urgencyText = 'Upcoming';
  
  if (reminderType === '3d') {
    urgencyColor = '#F9AB00'; // Orange
    urgencyText = 'Soon';
  } else if (reminderType === '1d') {
    urgencyColor = '#EA4335'; // Red
    urgencyText = 'Tomorrow!';
  }
  
  // Build HTML email (styled for better appearance)
  var html = '';
  
  html += '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">';
  
  // Header
  html += '<div style="background-color: ' + urgencyColor + '; color: white; padding: 20px; text-align: center;">';
  html += '<h2 style="margin: 0;">⚖️ Court Appearance Reminder</h2>';
  html += '<p style="margin: 5px 0 0 0; font-size: 18px;"><strong>' + urgencyText + '</strong></p>';
  html += '</div>';
  
  // Body
  html += '<div style="padding: 20px; background-color: #f9f9f9;">';
  
  html += '<p>Dear ' + clientData.defendantName + ',</p>';
  
  html += '<p>This is a reminder that you have a <strong>court appearance scheduled</strong>:</p>';
  
  // Court details box
  html += '<div style="background-color: white; border-left: 4px solid ' + urgencyColor + '; padding: 15px; margin: 20px 0;">';
  html += '<p style="margin: 5px 0;"><strong>📅 Date:</strong> ' + courtData.courtDate + '</p>';
  html += '<p style="margin: 5px 0;"><strong>🕐 Time:</strong> ' + courtData.courtTime + '</p>';
  html += '<p style="margin: 5px 0;"><strong>📍 Location:</strong> ' + courtData.location + '</p>';
  html += '<p style="margin: 5px 0;"><strong>📋 Type:</strong> ' + courtData.hearingType + '</p>';
  html += '<p style="margin: 5px 0;"><strong>⚖️ Case:</strong> ' + clientData.caseNumber + '</p>';
  html += '</div>';
  
  // Important notice
  html += '<div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0;">';
  html += '<p style="margin: 0; color: #856404;"><strong>⚠️ IMPORTANT:</strong> Failure to appear in court may result in:</p>';
  html += '<ul style="color: #856404; margin: 10px 0;">';
  html += '<li>Immediate arrest warrant</li>';
  html += '<li>Bond forfeiture</li>';
  html += '<li>Additional criminal charges</li>';
  html += '</ul>';
  html += '</div>';
  
  html += '<p>If you have any questions or need to discuss this appearance, please contact us immediately:</p>';
  
  // Contact info
  html += '<div style="background-color: white; padding: 15px; margin: 20px 0;">';
  html += '<p style="margin: 5px 0;"><strong>' + CONFIG.COMPANY.NAME + '</strong></p>';
  html += '<p style="margin: 5px 0;">📞 ' + CONFIG.COMPANY.PHONE + '</p>';
  html += '<p style="margin: 5px 0;">✉️ ' + CONFIG.COMPANY.EMAIL + '</p>';
  html += '</div>';
  
  html += '<p>Thank you,<br>' + CONFIG.COMPANY.NAME + ' Team</p>';
  
  html += '</div>'; // End body
  
  // Footer
  html += '<div style="background-color: #e0e0e0; padding: 15px; text-align: center; font-size: 12px; color: #666;">';
  html += '<p style="margin: 0;">This is an automated reminder. Please do not reply to this email.</p>';
  html += '</div>';
  
  html += '</div>'; // End container
  
  return html;
}
