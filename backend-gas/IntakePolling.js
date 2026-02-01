/**
 * backend-gas/IntakePolling.js
 * 
 * 30-Minute Polling Backup for IntakeQueue
 * 
 * This script runs every 30 minutes as a backup to webhook notifications
 * Ensures no intakes are missed if webhook fails
 * 
 * Setup:
 * 1. Deploy this as part of GAS project
 * 2. Create time-driven trigger: setupPollingTrigger()
 * 3. Trigger runs pollWixIntakeQueue() every 30 minutes
 */

/**
 * Main polling function - called by time trigger
 * Fetches new intakes from Wix and updates Dashboard
 */
function pollWixIntakeQueue() {
  try {
    console.log('🔄 Starting IntakeQueue polling...');
    
    const config = getConfig();
    const wixApiUrl = `${config.WIX_SITE_URL}/_functions/pendingIntakes`;
    
    // Get last poll timestamp from Script Properties
    const props = PropertiesService.getScriptProperties();
    const lastPoll = props.getProperty('LAST_INTAKE_POLL') || new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    // Fetch pending intakes from Wix
    const url = `${wixApiUrl}?apiKey=${encodeURIComponent(config.Wix_API_KEY)}&since=${encodeURIComponent(lastPoll)}`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      console.error('❌ Failed to poll Wix:', response.getContentText());
      return;
    }
    
    const result = JSON.parse(response.getContentText());
    
    if (!result.success) {
      console.error('❌ Polling failed:', result.error);
      return;
    }
    
    const intakes = result.intakes || [];
    console.log(`📊 Found ${intakes.length} new intake(s)`);
    
    // Process each intake
    intakes.forEach(intake => {
      processNewIntake(intake);
    });
    
    // Update last poll timestamp
    props.setProperty('LAST_INTAKE_POLL', new Date().toISOString());
    
    console.log('✅ Polling complete');
    
  } catch (error) {
    console.error('❌ Error in pollWixIntakeQueue:', error);
  }
}

/**
 * Process a new intake record
 * Adds to Dashboard queue and triggers auto-match
 * 
 * @param {Object} intake - IntakeQueue record from Wix
 */
function processNewIntake(intake) {
  try {
    console.log(`📥 Processing intake: ${intake._id}`);
    
    // Get the Bookings sheet (Dashboard data source)
    const ss = SpreadsheetApp.openById('121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E');
    const sheet = ss.getSheetByName('Bookings') || ss.getSheetByName('Queue');
    
    if (!sheet) {
      console.error('❌ Bookings/Queue sheet not found');
      return;
    }
    
    // Check if already exists (by intake ID or booking number)
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const bookingNumCol = headers.indexOf('Booking Number');
    const intakeIdCol = headers.indexOf('Intake ID');
    
    // Check for duplicates
    for (let i = 1; i < data.length; i++) {
      if (data[i][intakeIdCol] === intake._id || 
          (bookingNumCol >= 0 && data[i][bookingNumCol] === intake.defendantBookingNumber)) {
        console.log(`⏭️ Intake already exists, skipping: ${intake._id}`);
        return;
      }
    }
    
    // Add new row to sheet
    const newRow = [
      intake._id, // Intake ID
      intake.defendantName || '',
      intake.defendantEmail || '',
      intake.defendantPhone || '',
      intake.defendantBookingNumber || '',
      intake.indemnitorName || '',
      intake.indemnitorEmail || '',
      intake.indemnitorPhone || '',
      intake.indemnitorStreetAddress || '',
      intake.indemnitorEmployer || '',
      intake.reference1Name || '',
      intake.reference1Phone || '',
      intake.reference1Address || '',
      intake.reference2Name || '',
      intake.reference2Phone || '',
      intake.reference2Address || '',
      intake.county || '',
      intake.jailFacility || '',
      intake.arrestDate || '',
      intake.nextCourtDate || '',
      intake.totalBond || 0,
      intake.premium || 0,
      intake.paymentMethod || '',
      'pending', // Status
      new Date(), // Received At
      '', // Matched Defendant ID
      '', // Match Status
      '', // Case ID
      '', // Power Number
      '', // Case Number
      '', // Notes
      intake._createdDate || new Date()
    ];
    
    sheet.appendRow(newRow);
    
    console.log(`✅ Added intake to Dashboard: ${intake._id}`);
    
    // Trigger auto-match if booking number exists
    if (intake.defendantBookingNumber) {
      autoMatchDefendantInSheet(intake._id, intake.defendantBookingNumber);
    }
    
  } catch (error) {
    console.error(`❌ Error processing intake ${intake._id}:`, error);
  }
}

/**
 * Auto-match defendant based on booking number
 * Called after new intake is added to sheet
 * 
 * @param {string} intakeId - Intake ID
 * @param {string} bookingNumber - Defendant booking number
 */
function autoMatchDefendantInSheet(intakeId, bookingNumber) {
  try {
    console.log(`🔍 Auto-matching defendant for booking: ${bookingNumber}`);
    
    const ss = SpreadsheetApp.openById('121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E');
    const sheet = ss.getSheetByName('Bookings') || ss.getSheetByName('Queue');
    
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const intakeIdCol = headers.indexOf('Intake ID');
    const bookingNumCol = headers.indexOf('Booking Number');
    const matchStatusCol = headers.indexOf('Match Status');
    const matchConfidenceCol = headers.indexOf('Match Confidence');
    
    // Find the row for this intake
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][intakeIdCol] === intakeId) {
        targetRow = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (targetRow === -1) {
      console.log('⚠️ Intake row not found in sheet');
      return;
    }
    
    // Search for existing defendants with same booking number
    let matchFound = false;
    let matchConfidence = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (i + 1 === targetRow) continue; // Skip self
      
      if (data[i][bookingNumCol] === bookingNumber) {
        // Found a match!
        matchFound = true;
        matchConfidence = 70; // Base confidence for booking number match
        
        // Update match status
        sheet.getRange(targetRow, matchStatusCol + 1).setValue('auto-matched');
        sheet.getRange(targetRow, matchConfidenceCol + 1).setValue(matchConfidence);
        
        console.log(`✅ Auto-matched with confidence: ${matchConfidence}%`);
        break;
      }
    }
    
    if (!matchFound) {
      console.log('ℹ️ No existing defendant found for auto-match');
      sheet.getRange(targetRow, matchStatusCol + 1).setValue('pending');
    }
    
  } catch (error) {
    console.error('❌ Error in autoMatchDefendantInSheet:', error);
  }
}

/**
 * Setup time-driven trigger for polling
 * Run this once to create the 30-minute trigger
 */
function setupPollingTrigger() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'pollWixIntakeQueue') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger - every 30 minutes
  ScriptApp.newTrigger('pollWixIntakeQueue')
    .timeBased()
    .everyMinutes(30)
    .create();
  
  console.log('✅ Polling trigger created - runs every 30 minutes');
}

/**
 * Manual test function
 */
function testPolling() {
  pollWixIntakeQueue();
}
