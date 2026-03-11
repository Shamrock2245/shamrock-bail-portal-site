/**
 * ============================================
 * CALENDAR MANAGER - Google Calendar Integration
 * ============================================
 * This file handles creating and managing calendar events.
 */

/**
 * Create Court Calendar Event
 * 
 * Creates a new event on your company's Google Calendar with all court details.
 * 
 * @param {Object} courtData - The parsed court date information
 * @param {Object} clientData - Client information from the sheet
 * @return {String|null} Calendar event ID, or null if creation failed
 */
function createCourtCalendarEvent(courtData, clientData) {
  
  try {
    // Step 1: Get the calendar
    var calendarId = getScriptProperty('COMPANY_CALENDAR_ID');
    var calendar = CalendarApp.getCalendarById(calendarId);
    
    if (!calendar) {
      Logger.log('❌ Could not access calendar: ' + calendarId);
      return null;
    }
    
    Logger.log('📅 Accessed calendar: ' + calendar.getName());
    
    // Step 2: Parse the court date and time into a JavaScript Date object
    var startDateTime = parseDateTimeString(courtData.courtDate, courtData.courtTime);
    
    if (!startDateTime) {
      Logger.log('❌ Could not parse date/time: ' + courtData.courtDate + ' ' + courtData.courtTime);
      return null;
    }
    
    // Assume court hearings last 1 hour (can adjust this)
    var endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // Add 1 hour
    
    // Step 3: Create event title (standardized format)
    var eventTitle = '🏛️ COURT: ' + clientData.defendantName + ' - ' + clientData.caseNumber;
    
    // Step 4: Create event description with all details
    var eventDescription = buildEventDescription(courtData, clientData);
    
    // Step 5: Create the calendar event
    var event = calendar.createEvent(
      eventTitle,
      startDateTime,
      endDateTime,
      {
        location: courtData.location,
        description: eventDescription,
        sendInvites: false // Don't send email invites
      }
    );
    
    Logger.log('✅ Created calendar event: ' + eventTitle);
    
    // Step 6: Store the event ID in the sheet for future reference
    var eventId = event.getId();
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    sheet.getRange(clientData.rowNumber, CONFIG.COLUMNS.CALENDAR_EVENT_ID).setValue(eventId);
    
    return eventId;
    
  } catch (error) {
    Logger.log('❌ Error creating calendar event: ' + error.message);
    return null;
  }
}

/**
 * Parse Date Time String
 * 
 * Converts date string (2024-12-25) and time string (9:30 AM) 
 * into a single JavaScript Date object.
 * 
 * @param {String} dateStr - Date in YYYY-MM-DD format
 * @param {String} timeStr - Time in HH:MM AM/PM format
 * @return {Date|null} JavaScript Date object, or null if parsing fails
 */
function parseDateTimeString(dateStr, timeStr) {
  
  try {
    // Combine date and time into one string
    var dateTimeStr = dateStr + ' ' + timeStr;
    
    // Let JavaScript parse it
    var dateTime = new Date(dateTimeStr);
    
    // Check if valid
    if (isNaN(dateTime.getTime())) {
      Logger.log('⚠️ Invalid date/time: ' + dateTimeStr);
      return null;
    }
    
    return dateTime;
    
  } catch (error) {
    Logger.log('❌ Error parsing date/time: ' + error.message);
    return null;
  }
}

/**
 * Build Event Description
 * 
 * Creates a formatted description with all relevant information.
 * This appears in the calendar event details.
 * 
 * @param {Object} courtData - Court date information
 * @param {Object} clientData - Client information
 * @return {String} Formatted description
 */
function buildEventDescription(courtData, clientData) {
  
  // Build a nicely formatted description with line breaks
  var description = '';
  
  description += '⚖️ COURT APPEARANCE DETAILS\n';
  description += '═══════════════════════════════\n\n';
  
  description += '📋 Case Information:\n';
  description += '   • Case Number: ' + clientData.caseNumber + '\n';
  description += '   • Defendant: ' + clientData.defendantName + '\n';
  description += '   • Hearing Type: ' + courtData.hearingType + '\n\n';
  
  description += '📍 Location:\n';
  description += '   • ' + courtData.location + '\n\n';
  
  description += '📞 Contact Information:\n';
  description += '   • Defendant Phone: ' + (clientData.defendantPhone || 'N/A') + '\n';
  description += '   • Defendant Email: ' + (clientData.defendantEmail || 'N/A') + '\n\n';
  
  description += '💼 Office Information:\n';
  description += '   • ' + CONFIG.COMPANY.NAME + '\n';
  description += '   • Phone: ' + CONFIG.COMPANY.PHONE + '\n';
  description += '   • Email: ' + CONFIG.COMPANY.EMAIL + '\n\n';
  
  description += '📊 Sheet Row: ' + clientData.rowNumber + '\n';
  description += '🔗 Sheet Link: https://docs.google.com/spreadsheets/d/' + CONFIG.SHEET_ID + '\n\n';
  
  description += '⚠️ IMPORTANT: Failure to appear may result in bond forfeiture.\n';
  
  return description;
}

/**
 * Update Existing Calendar Event
 * 
 * If court date changes, this updates the existing calendar event
 * instead of creating a duplicate.
 * 
 * @param {String} eventId - The calendar event ID
 * @param {Object} courtData - Updated court date information
 * @param {Object} clientData - Client information
 */
function updateExistingCalendarEvent(eventId, courtData, clientData) {
  
  try {
    var calendarId = getScriptProperty('COMPANY_CALENDAR_ID');
    var calendar = CalendarApp.getCalendarById(calendarId);
    
    if (!calendar) {
      Logger.log('❌ Could not access calendar');
      return;
    }
    
    // Get the existing event
    var event = calendar.getEventById(eventId);
    
    if (!event) {
      Logger.log('⚠️ Calendar event not found: ' + eventId);
      // If event doesn't exist, create a new one
      createCourtCalendarEvent(courtData, clientData);
      return;
    }
    
    // Update event details
    var startDateTime = parseDateTimeString(courtData.courtDate, courtData.courtTime);
    var endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000));
    
    event.setTime(startDateTime, endDateTime);
    event.setLocation(courtData.location);
    event.setDescription(buildEventDescription(courtData, clientData));
    
    Logger.log('✅ Updated existing calendar event');
    
  } catch (error) {
    Logger.log('❌ Error updating calendar event: ' + error.message);
  }
}
