/**
 * ============================================
 * FORM CONTROLLER - Handles Form Data Loading
 * ============================================
 * Manages loading arrest data into the bond form
 * and calculating premiums per Florida law
 */

/**
 * Opens the bond form with data from the selected row
 */
function openBondFormForSelectedRow() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selectedRow = sheet.getActiveRange().getRow();
  
  // Validate selection
  if (selectedRow < 2) {
    ui.alert('Please select a data row (not the header row).');
    return;
  }
  
  // Get the booking number from selected row
  var bookingNumber = sheet.getRange(selectedRow, 2).getValue(); // Column B = Booking_Number
  
  if (!bookingNumber) {
    ui.alert('Selected row has no booking number.');
    return;
  }
  
  Logger.log('Opening bond form for booking number: ' + bookingNumber + ' (row ' + selectedRow + ')');
  
  // Create HTML with URL parameters
  var template = HtmlService.createTemplateFromFile('Form');
  
  var htmlOutput = template.evaluate()
    .setWidth(1200)
    .setHeight(900)
    .setTitle('Shamrock Bail Bonds - Bond Application Form')
    .append('<script>window.FORM_DATA = {booking: "' + bookingNumber + '", row: ' + selectedRow + '};</script>');
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Bond Application Form');
}

/**
 * Gets arrest data for the form from the spreadsheet
 * Called from Form.html via google.script.run
 */
function getArrestDataForForm(bookingNumber, rowIndex) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lee_County_Arrests');
    
    if (!sheet) {
      throw new Error('Lee_County_Arrests sheet not found');
    }
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Get row data
    var rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Map to object
    var data = {};
    headers.forEach(function(header, index) {
      data[header] = rowData[index];
    });
    
    Logger.log('Retrieved arrest data for booking ' + bookingNumber);
    Logger.log('Charges: ' + data.Charges);
    Logger.log('Bond Amount: ' + data.Bond_Amount);
    
    return data;
    
  } catch (error) {
    Logger.log('Error getting arrest data: ' + error.message);
    throw error;
  }
}

/**
 * Calculates premium for a single charge
 * Florida law: Greater of $100 or 10% of bond amount
 */
function calculatePremium(bondAmount) {
  var amount = parseFloat(bondAmount);
  if (isNaN(amount) || amount <= 0) {
    return 0;
  }
  
  var tenPercent = amount * 0.10;
  return Math.max(100, tenPercent);
}

/**
 * Calculates total premium for all charges
 * If multiple charges, splits bond amount evenly
 */
function calculateTotalPremium(bondAmount, numberOfCharges) {
  var total = parseFloat(bondAmount);
  var count = parseInt(numberOfCharges);
  
  if (isNaN(total) || isNaN(count) || total <= 0 || count <= 0) {
    return {
      perCharge: 0,
      total: 0
    };
  }
  
  var bondPerCharge = total / count;
  var premiumPerCharge = calculatePremium(bondPerCharge);
  var totalPremium = premiumPerCharge * count;
  
  return {
    bondPerCharge: bondPerCharge.toFixed(2),
    premiumPerCharge: premiumPerCharge.toFixed(2),
    totalPremium: totalPremium.toFixed(2),
    numberOfCharges: count
  };
}

/**
 * Saves form data back to the spreadsheet
 * Updates the row with form-entered data
 */
function saveFormDataToSheet(formData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lee_County_Arrests');
    
    if (!sheet) {
      throw new Error('Lee_County_Arrests sheet not found');
    }
    
    // Find the row by booking number
    var bookingNumber = formData.booking_number;
    var lastRow = sheet.getLastRow();
    var bookingCol = 2; // Column B = Booking_Number
    
    for (var i = 2; i <= lastRow; i++) {
      var cellValue = sheet.getRange(i, bookingCol).getValue();
      if (cellValue == bookingNumber) {
        // Update relevant columns with form data
        // You can expand this to update more columns as needed
        
        Logger.log('Form data saved for booking ' + bookingNumber + ' at row ' + i);
        return {
          success: true,
          message: 'Data saved successfully',
          row: i
        };
      }
    }
    
    throw new Error('Booking number ' + bookingNumber + ' not found in spreadsheet');
    
  } catch (error) {
    Logger.log('Error saving form data: ' + error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Updates the Bond_Status column for a booking
 */
function updateBondStatus(bookingNumber, status) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lee_County_Arrests');
    
    if (!sheet) {
      throw new Error('Lee_County_Arrests sheet not found');
    }
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var statusCol = headers.indexOf('Bond_Status') + 1;
    
    if (statusCol === 0) {
      // Bond_Status column doesn't exist, we'll need to add it
      Logger.log('Bond_Status column not found - needs to be added to sheet');
      return false;
    }
    
    // Find the row
    var lastRow = sheet.getLastRow();
    var bookingCol = 2;
    
    for (var i = 2; i <= lastRow; i++) {
      var cellValue = sheet.getRange(i, bookingCol).getValue();
      if (cellValue == bookingNumber) {
        sheet.getRange(i, statusCol).setValue(status);
        Logger.log('Updated Bond_Status to "' + status + '" for booking ' + bookingNumber);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('Error updating bond status: ' + error.message);
    return false;
  }
}

/**
 * Marks a form as opened (updates timestamp)
 */
function markFormOpened(bookingNumber) {
  updateBondStatus(bookingNumber, 'Form Opened');
  
  // You can also update a Form_Opened_Date column if it exists
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lee_County_Arrests');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var dateCol = headers.indexOf('Form_Opened_Date') + 1;
    
    if (dateCol > 0) {
      var lastRow = sheet.getLastRow();
      var bookingCol = 2;
      
      for (var i = 2; i <= lastRow; i++) {
        var cellValue = sheet.getRange(i, bookingCol).getValue();
        if (cellValue == bookingNumber) {
          sheet.getRange(i, dateCol).setValue(new Date());
          break;
        }
      }
    }
  } catch (error) {
    Logger.log('Error updating Form_Opened_Date: ' + error.message);
  }
}

