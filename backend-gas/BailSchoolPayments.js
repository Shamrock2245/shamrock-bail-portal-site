/**
 * BailSchoolPayments.js
 * 
 * SwipeSimple Payment Monitor — GAS-Native Gmail Polling
 * 
 * Since SwipeSimple has no public API and no outbound webhooks,
 * we use GAS's native GmailApp to poll for receipt emails from
 * noreply@swipesimple.com and auto-unlock courses.
 * 
 * Flow: Gmail receipt → Parse amount + customer email → handleBailSchoolUnlock() → Slack alert
 * 
 * Trigger: Time-driven, every 5 minutes (run setupSwipeSimpleTrigger() once to create)
 */

/**
 * Main polling function — called by time-driven trigger every 5 minutes
 */
function pollSwipeSimpleReceipts() {
  try {
    // Search for unread SwipeSimple receipt emails from the last 24 hours
    const threads = GmailApp.search('from:noreply@swipesimple.com is:unread newer_than:1d', 0, 10);
    
    if (threads.length === 0) {
      return; // Nothing to process
    }

    let processed = 0;
    let errors = 0;

    for (const thread of threads) {
      const messages = thread.getMessages();
      
      for (const message of messages) {
        if (message.isUnread()) {
          try {
            const result = processSwipeSimpleEmail_(message);
            if (result.success) {
              processed++;
              message.markRead();
              applyLabel_(thread, 'BailSchool/Processed');
            } else if (result.skipped) {
              // Not a Bail School payment (different amount) — skip silently
              message.markRead();
              applyLabel_(thread, 'BailSchool/Skipped');
            } else {
              errors++;
              applyLabel_(thread, 'BailSchool/Error');
              console.error('Failed to process SwipeSimple email:', result.error);
            }
          } catch (msgErr) {
            errors++;
            console.error('Error processing individual message:', msgErr);
          }
        }
      }
    }

    if (processed > 0) {
      console.log('SwipeSimple Monitor: Processed ' + processed + ' payments, ' + errors + ' errors');
    }

  } catch (err) {
    console.error('SwipeSimple polling error:', err);
    try {
      if (typeof sendSlackMessage === 'function') {
        sendSlackMessage('#shamrock', '⚠️ SwipeSimple email monitor error: ' + err.message);
      }
    } catch (slackErr) {
      // Fail silently
    }
  }
}

/**
 * Parse a single SwipeSimple receipt email and unlock the course
 * @param {GmailMessage} message
 * @returns {{ success: boolean, skipped?: boolean, error?: string }}
 */
function processSwipeSimpleEmail_(message) {
  var body = message.getPlainBody() || message.getBody();
  var subject = message.getSubject();
  
  // Extract amount — SwipeSimple receipts contain "$XXX.XX" format
  var amountMatch = body.match(/\$([0-9,]+\.[0-9]{2})/);
  if (!amountMatch) {
    return { success: false, error: 'Could not parse amount from email. Subject: ' + subject };
  }
  
  var amount = parseFloat(amountMatch[1].replace(',', ''));
  
  // Determine course based on amount
  var courseId = null;
  if (amount === 199.00) {
    courseId = '20hr';
  } else if (amount === 649.00) {
    courseId = '120hr';
  } else {
    // Not a Bail School payment — could be a regular bail bond SwipeSimple transaction
    return { success: false, skipped: true };
  }

  // Extract customer email from the receipt body
  // Exclude known system emails
  var emailRegex = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  var customerEmail = null;
  var match;
  
  while ((match = emailRegex.exec(body)) !== null) {
    var found = match[1].toLowerCase();
    if (found !== 'noreply@swipesimple.com' && 
        found !== 'admin@shamrockbailbonds.biz' &&
        found.indexOf('swipesimple') === -1) {
      customerEmail = found;
      break;
    }
  }

  if (!customerEmail) {
    // Flag for manual review
    var errorMsg = 'Bail School payment of $' + amount + ' detected but could not extract customer email. Subject: "' + subject + '"';
    
    // Still alert Slack so staff can manually unlock
    try {
      if (typeof sendSlackMessage === 'function') {
        sendSlackMessage('#shamrock', 
          '⚠️ *Bail School Payment Needs Manual Review*\n\n' +
          '*Amount:* $' + amount.toFixed(2) + '\n' +
          '*Issue:* Could not extract customer email from SwipeSimple receipt.\n' +
          '*Action:* Check Gmail for the receipt and manually unlock the course.'
        );
      }
    } catch (e) { /* fail silently */ }
    
    return { success: false, error: errorMsg };
  }

  // Call the unlock handler directly — same GAS runtime, no HTTP needed!
  var unlockResult = handleBailSchoolUnlock({
    studentEmail: customerEmail,
    courseId: courseId,
    amountPaid: amount
  });

  if (unlockResult.success) {
    // Send Slack notification
    try {
      if (typeof sendSlackMessage === 'function') {
        var courseName = courseId === '20hr' ? '20-Hour Correspondence' : '120-Hour Live Cohort';
        sendSlackMessage('#new-cases', 
          '🎓 *New Bail School Enrollment!*\n\n' +
          '*Student:* ' + customerEmail + '\n' +
          '*Course:* ' + courseName + '\n' +
          '*Amount:* $' + amount.toFixed(2) + '\n\n' +
          '_Course auto-unlocked via SwipeSimple receipt._'
        );
      }
    } catch (slackErr) {
      console.error('Slack notification failed:', slackErr);
    }

    // Also send the student a welcome email with course access
    try {
      var schoolUrl = 'https://school.shamrockbailbonds.biz';
      var welcomeBody = 
        'Welcome to Shamrock Bail School!\n\n' +
        'Your payment of $' + amount.toFixed(2) + ' for the ' + 
        (courseId === '20hr' ? '20-Hour Correspondence Course' : '120-Hour Pre-Licensing Course') + 
        ' has been received.\n\n' +
        'Access your course here: ' + schoolUrl + '/dashboard\n\n' +
        'If you have any questions, reply to this email or call us at (239) 552-3773.\n\n' +
        '— Shamrock Bail Bonds';
      
      MailApp.sendEmail(customerEmail, 'Shamrock Bail School — Enrollment Confirmed', welcomeBody);
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr);
    }
  }

  return unlockResult;
}

/**
 * Helper: Apply a Gmail label (creates it if it doesn't exist)
 */
function applyLabel_(thread, labelName) {
  try {
    var label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      label = GmailApp.createLabel(labelName);
    }
    thread.addLabel(label);
  } catch (e) {
    console.warn('Could not apply label:', e.message);
  }
}

/**
 * Set up the time-driven trigger for SwipeSimple polling.
 * Run this function ONCE manually from the Apps Script editor.
 */
function setupSwipeSimpleTrigger() {
  // Remove any existing triggers for this function
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pollSwipeSimpleReceipts') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create new trigger: every 5 minutes
  ScriptApp.newTrigger('pollSwipeSimpleReceipts')
    .timeBased()
    .everyMinutes(5)
    .create();

  console.log('✅ SwipeSimple polling trigger created (every 5 minutes)');
}
