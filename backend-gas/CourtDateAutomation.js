/**
 * ============================================
 * COURT DATE AUTOMATION - MAIN ORCHESTRATOR
 * ============================================
 * This is the "brain" that coordinates everything.
 */

/**
 * MAIN FUNCTION: Process Court Date Emails
 * 
 * This function:
 * 1. Checks if we should run (business hours vs after hours)
 * 2. Searches Gmail for unprocessed court emails
 * 3. Processes each email found
 * 4. Marks emails as processed so we don't duplicate work
 * 
 * This function is triggered automatically by Google every 15-60 minutes.
 */
function processCourtDateEmails() {
  
  // Step 1: Check if we should process emails right now
  if (!shouldProcessEmailsNow()) {
    Logger.log('⏰ Not during email processing window. Skipping this run.');
    return; // Exit early - we'll try again next time
  }
  
  Logger.log('🔍 Starting court date email search...');
  
  try {
    // Step 2: Get or create the Gmail label for tracking processed emails
    var label = GmailApp.getUserLabelByName('CourtDate/Processed');
    if (!label) {
      label = GmailApp.createLabel('CourtDate/Processed');
      Logger.log('✅ Created new Gmail label: CourtDate/Processed');
    }
    
    // Step 3: Search for unprocessed court date emails
    var allThreads = searchForCourtEmails(label);
    
    if (allThreads.length === 0) {
      Logger.log('📭 No new court date emails found.');
      return;
    }
    
    Logger.log('📧 Found ' + allThreads.length + ' unprocessed email(s)');
    
    // Step 4: Process each email thread
    var successCount = 0;
    var failCount = 0;
    
    allThreads.forEach(function(thread, index) {
      Logger.log('Processing email ' + (index + 1) + ' of ' + allThreads.length);
      
      try {
        // Google Calendar notification mail (calendar-notification@google.com
        // and the "subscribed to calendar" subject) is not a court notice.
        // Skip before parseCourtDateEmail / createCourtCalendarEvent.
        var threadMessages = thread.getMessages();
        var latestMessage = threadMessages.length ? threadMessages[threadMessages.length - 1] : null;
        if (latestMessage && typeof googleCalendarNotificationSkipReason === 'function') {
          var notificationSkip = googleCalendarNotificationSkipReason(latestMessage.getFrom(), latestMessage.getSubject());
          if (notificationSkip) {
            Logger.log('⏭️ Skipping Google Calendar notification (' + notificationSkip + '): ' + latestMessage.getSubject());
            thread.addLabel(label);
            return;
          }
        }

        // Parse the email to extract court date info
        var courtData = parseCourtDateEmail(thread);
        
        if (!courtData) {
          Logger.log('⚠️ Could not parse email: ' + thread.getFirstMessageSubject());
          failCount++;
          notifySlack('⚠️ Failed to parse: ' + thread.getFirstMessageSubject(), true);
          thread.addLabel(label); // Mark as processed even if failed (prevents infinite retries)
          return;
        }
        
        // Update the Google Sheet with court date info
        var clientData = updateSheetWithCourtDate(courtData);
        
        if (!clientData) {
          Logger.log('⚠️ Could not find matching client in sheet for: ' + courtData.caseNumber);
          failCount++;
          notifySlack('⚠️ No match found for case: ' + courtData.caseNumber, true);
          thread.addLabel(label);
          return;
        }
        
        // Create Google Calendar event
        createCourtCalendarEvent(courtData, clientData);
        
        // Schedule automatic reminders
        scheduleCourtReminders(courtData, clientData);
        
        // Success! Mark as processed and notify team
        thread.addLabel(label);
        successCount++;
        
        var successMsg = '✅ Court date processed:\n' +
                        '   • Case: ' + courtData.caseNumber + '\n' +
                        '   • Name: ' + courtData.defendantName + '\n' +
                        '   • Date: ' + courtData.courtDate + ' at ' + courtData.courtTime;
        
        Logger.log(successMsg);
        notifySlack(successMsg, false);
        
      } catch (error) {
        Logger.log('❌ Error processing email: ' + error.message);
        failCount++;
        notifySlack('❌ Error: ' + error.message, true);
        // Don't mark as processed so we can retry later
      }
    });
    
    // Step 5: Send summary to Slack
    var summaryMsg = '📊 Email processing complete:\n' +
                    '   • Successfully processed: ' + successCount + '\n' +
                    '   • Failed: ' + failCount;
    Logger.log(summaryMsg);
    notifySlack(summaryMsg, false);
    
  } catch (error) {
    Logger.log('❌ Fatal error in processCourtDateEmails: ' + error.message);
    notifySlack('❌ CRITICAL ERROR: ' + error.message, true);
  }
}

/**
 * Helper: Search Gmail for court date emails
 * 
 * @param {GmailLabel} label - The label used to mark processed emails
 * @return {Array} Array of Gmail threads
 */
function searchForCourtEmails(label) {
  var allThreads = [];
  // Drop Google Calendar notification senders and the
  // "subscribed to calendar" subject before any event is created.
  var exclusion = (typeof googleCalendarNotificationSearchExclusion === 'function')
    ? googleCalendarNotificationSearchExclusion()
    : '';
  if (exclusion) {
    Logger.log('⏭️ Court date search excludes Google Calendar notification mail');
  }
  
  // Loop through each search query from CONFIG
  CONFIG.EMAIL_SEARCH_QUERIES.forEach(function(query) {
    // Add "-label:CourtDate/Processed" to exclude already-processed emails.
    var fullQuery = query + ' -label:CourtDate/Processed newer_than:7d' + exclusion;
    
    Logger.log('Searching with query: ' + fullQuery);
    
    // Search Gmail (max 50 results per query)
    var threads = GmailApp.search(fullQuery, 0, 50);
    allThreads = allThreads.concat(threads);
  });
  
  // Remove duplicates (in case an email matches multiple queries)
  var uniqueThreads = [];
  var seenIds = {};
  
  allThreads.forEach(function(thread) {
    var id = thread.getId();
    if (!seenIds[id]) {
      uniqueThreads.push(thread);
      seenIds[id] = true;
    }
  });
  
  return uniqueThreads;
}

/**
 * Helper: Decide if we should process emails right now
 * 
 * During business hours (M-F 8am-6pm): Process every time (trigger runs every 15 min)
 * After hours: Only process once per hour
 * 
 * @return {Boolean} true if we should process, false if we should skip
 */
function shouldProcessEmailsNow() {
  var now = new Date();
  var hour = now.getHours(); // 0-23
  var day = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  var minute = now.getMinutes(); // 0-59
  
  // Check if today is a work day
  var isWorkDay = CONFIG.BUSINESS_HOURS.WORK_DAYS.indexOf(day) !== -1;
  
  // Check if we're in business hours
  var isBusinessHours = hour >= CONFIG.BUSINESS_HOURS.START && 
                       hour < CONFIG.BUSINESS_HOURS.END;
  
  if (isWorkDay && isBusinessHours) {
    // Business hours: Always process (trigger runs every 15 min)
    return true;
  } else {
    // After hours: Only process on the hour (minute = 0-14)
    // This way, even if trigger runs every 15 min, we only process once per hour
    return minute < 15;
  }
}

/**
 * Helper: Send notification to Slack
 * 
 * @param {String} message - The message to send
 * @param {Boolean} isError - true for errors, false for normal notifications
 */
function notifySlack(message, isError) {
  try {
    postToSlack(CONFIG.SLACK_CHANNELS.COURT_DATES, message, isError);
  } catch (error) {
    Logger.log('Slack notification failed: ' + error.message);
    // Don't throw error - Slack failure shouldn't stop the whole process
  }
}
