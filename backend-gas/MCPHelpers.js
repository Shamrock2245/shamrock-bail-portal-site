/**
 * ============================================================================
 * MCPHelpers.gs - Helper Functions for MCP Server Integration
 * ============================================================================
 * 
 * This file contains helper functions that bridge the MCP server with existing
 * GAS functions. These functions handle data transformation, API calls, and
 * integration with external services.
 * 
 * Author: Shamrock Bail Bonds
 * Date: December 27, 2025
 * Version: 1.0.0
 */

// ============================================================================
// SIGNNOW INTEGRATION HELPERS
// ============================================================================

/**
 * Creates and sends a SignNow packet (wrapper for existing functions)
 * This function should call your existing SignNow integration code
 */
function createAndSendSignNowPacket(formData) {
  // TODO: This should call your existing SignNow packet creation function
  // For now, returning a mock structure - replace with actual implementation
  
  try {
    // Example: Call existing function from SignNowAPI.gs or SignNow_Integration_Complete.gs
    // const result = createSignNowDocument(formData);
    
    // Mock return for testing - replace with actual implementation
    return {
      documentId: 'mock_doc_' + new Date().getTime(),
      signingLinks: formData.indemnitorEmails.map(email => ({
        email: email,
        link: 'https://shamrockbailbonds.biz/sign?link=mock_' + email
      })),
      receiptNumber: 'RECEIPT-' + new Date().getTime()
    };
  } catch (error) {
    Logger.log('Error in createAndSendSignNowPacket: ' + error.toString());
    throw error;
  }
}

/**
 * Checks SignNow document status
 */
function checkSignNowDocumentStatus(documentId) {
  try {
    const config = getConfig();
    const url = config.SIGNNOW_API_BASE + '/document/' + documentId;
    
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + config.SIGNNOW_ACCESS_TOKEN
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    // Parse signing status
    const signedBy = [];
    const pendingSigners = [];
    
    if (data.signatures) {
      data.signatures.forEach(sig => {
        if (sig.signed) {
          signedBy.push({
            email: sig.signer_email,
            signed_date: sig.signed_date
          });
        } else {
          pendingSigners.push({
            email: sig.signer_email,
            role: sig.role_name || 'Signer'
          });
        }
      });
    }
    
    const allSigned = pendingSigners.length === 0;
    
    return {
      status: allSigned ? 'completed' : 'pending',
      signedBy: signedBy,
      pendingSigners: pendingSigners,
      completedDate: allSigned ? (data.updated || new Date().toISOString()) : null
    };
    
  } catch (error) {
    Logger.log('Error checking SignNow status: ' + error.toString());
    return {
      status: 'error',
      signedBy: [],
      pendingSigners: [],
      completedDate: null,
      error: error.toString()
    };
  }
}

// ============================================================================
// GOOGLE SHEETS SEARCH HELPERS
// ============================================================================

/**
 * Searches for a case by booking number across all county tabs
 */
function searchCaseByBookingNumber(bookingNumber, county) {
  try {
    const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID || '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E');
    
    // Define counties to search
    const countiesToSearch = county ? [county] : COUNTY_TABS || [
      "Lee", "Collier", "Hendry", "Charlotte", "Manatee", "DeSoto", "Sarasota", 
      "Hillsborough", "Palm Beach", "Seminole", "Orange", "Pinellas", "Broward", "Polk", "Osceola"
    ];
    
    for (let i = 0; i < countiesToSearch.length; i++) {
      const countyName = countiesToSearch[i];
      const sheet = ss.getSheetByName(countyName);
      
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      // Find booking number column
      const bookingCol = headers.indexOf('Booking_Number');
      if (bookingCol === -1) continue;
      
      // Search for matching booking number
      for (let row = 1; row < data.length; row++) {
        if (data[row][bookingCol] === bookingNumber) {
          // Found it! Build case object
          const caseObj = {};
          headers.forEach((header, col) => {
            caseObj[header] = data[row][col];
          });
          caseObj.County = countyName; // Ensure county is set
          return caseObj;
        }
      }
    }
    
    // Not found
    return null;
    
  } catch (error) {
    Logger.log('Error searching for case: ' + error.toString());
    return null;
  }
}

/**
 * Maps sheet data to Dashboard form format
 */
function mapSheetDataToForm_(sheetData) {
  return {
    defendantFullName: sheetData['Full_Name'] || '',
    defendantFirstName: sheetData['First_Name'] || '',
    defendantLastName: sheetData['Last_Name'] || '',
    defendantDOB: formatDate_(sheetData['DOB']),
    defendantSex: sheetData['Sex'] || '',
    defendantRace: sheetData['Race'] || '',
    defendantBookingNumber: sheetData['Booking_Number'] || '',
    defendantStreetAddress: sheetData['Address'] || '',
    defendantCity: sheetData['City'] || '',
    defendantState: sheetData['State'] || 'FL',
    defendantZip: sheetData['Zipcode'] || '',
    charges: parseChargesFromSheet_(sheetData),
    bondAmount: sheetData['Bond_Amount'] || '',
    county: sheetData['County'] || '',
    leadScore: sheetData['Lead_Score'] || '',
    leadStatus: sheetData['Lead_Status'] || ''
  };
}

function parseChargesFromSheet_(sheetData) {
  const charges = [];
  const chargesField = sheetData['Charges'] || '';
  
  if (chargesField) {
    try {
      const parsed = JSON.parse(chargesField);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not JSON, parse as text
    }
    
    // Parse as delimited text
    const chargesList = chargesField.split(/[;,\n]/).map(c => c.trim()).filter(Boolean);
    chargesList.forEach(charge => {
      charges.push({
        description: charge,
        bondAmount: sheetData['Bond_Amount'] || '',
        caseNumber: sheetData['Case_Number'] || ''
      });
    });
  }
  
  return charges;
}

function formatDate_(dateValue) {
  if (!dateValue) return '';
  if (dateValue instanceof Date) {
    return Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'MM/dd/yyyy');
  }
  return dateValue.toString();
}

// ============================================================================
// SLACK INTEGRATION HELPERS
// ============================================================================

/**
 * Gets Slack webhook URL for a specific channel
 */
function getSlackWebhookForChannel(channel) {
  const props = PropertiesService.getScriptProperties();
  
  const webhookMap = {
    'court-dates': props.getProperty('SLACK_WEBHOOK_COURT_DATES'),
    'forfeitures': props.getProperty('SLACK_WEBHOOK_FORFEITURES'),
    'new-cases': props.getProperty('SLACK_WEBHOOK_NEW_CASES'),
    'general': props.getProperty('SLACK_WEBHOOK_GENERAL')
  };
  
  return webhookMap[channel] || null;
}

/**
 * Posts a message to Slack
 */
function postToSlack(webhookUrl, payload) {
  try {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(webhookUrl, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      throw new Error('Slack API returned status: ' + responseCode);
    }
    
    return {
      success: true,
      response: response.getContentText()
    };
    
  } catch (error) {
    Logger.log('Error posting to Slack: ' + error.toString());
    throw error;
  }
}

// ============================================================================
// SCRAPER HELPERS
// ============================================================================

/**
 * Runs Lee County scraper (wrapper)
 */
function runLeeScraper() {
  try {
    // Call existing scraper function from ArrestScraper_LeeCounty.gs
    if (typeof scrapeLeeCounty === 'function') {
      return scrapeLeeCounty();
    }
    
    // Mock return if function doesn't exist yet
    return {
      recordsFound: 0,
      newRecords: 0,
      updatedRecords: 0,
      scrapeTime: new Date().toISOString()
    };
  } catch (error) {
    Logger.log('Error running Lee scraper: ' + error.toString());
    throw error;
  }
}

/**
 * Runs Collier County scraper (wrapper)
 */
function runCollierScraper() {
  try {
    // Call existing scraper function from ArrestScraper_CollierCounty.gs
    if (typeof scrapeCollierCounty === 'function') {
      return scrapeCollierCounty();
    }
    
    // Mock return if function doesn't exist yet
    return {
      recordsFound: 0,
      newRecords: 0,
      updatedRecords: 0,
      scrapeTime: new Date().toISOString()
    };
  } catch (error) {
    Logger.log('Error running Collier scraper: ' + error.toString());
    throw error;
  }
}

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Calculates dashboard statistics for a given date range
 */
function calculateDashboardStatistics(dateRange) {
  try {
    const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID || '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E');
    
    // Get date filter
    const now = new Date();
    let startDate;
    
    switch(dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = null; // All time
    }
    
    // Initialize counters
    let totalCases = 0;
    let signnowLaunches = 0;
    let totalPremium = 0;
    let pendingSignatures = 0;
    let completedBonds = 0;
    
    // Count across all county tabs
    const countyTabs = COUNTY_TABS || ["Lee", "Collier", "Hendry", "Charlotte", "Manatee", "DeSoto", "Sarasota"];
    
    countyTabs.forEach(county => {
      const sheet = ss.getSheetByName(county);
      if (!sheet) return;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      // Find relevant columns
      const bookingDateCol = headers.indexOf('Booking_Date');
      const statusCol = headers.indexOf('Status');
      const bondAmountCol = headers.indexOf('Bond_Amount');
      
      // Count records
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Apply date filter if specified
        if (startDate && bookingDateCol !== -1) {
          const bookingDate = new Date(row[bookingDateCol]);
          if (bookingDate < startDate) continue;
        }
        
        totalCases++;
        
        // Parse bond amount
        if (bondAmountCol !== -1 && row[bondAmountCol]) {
          const amount = parseFloat(row[bondAmountCol].toString().replace(/[^0-9.]/g, ''));
          if (!isNaN(amount)) {
            totalPremium += amount * 0.10; // Assume 10% premium
          }
        }
        
        // Check status
        if (statusCol !== -1) {
          const status = row[statusCol].toString().toLowerCase();
          if (status.includes('pending')) pendingSignatures++;
          if (status.includes('completed') || status.includes('signed')) completedBonds++;
        }
      }
    });
    
    // Get active forfeitures
    const forfeituresSheet = ss.getSheetByName('Forfeitures');
    let activeForfeitures = 0;
    if (forfeituresSheet) {
      const forfeitureData = forfeituresSheet.getDataRange().getValues();
      activeForfeitures = forfeitureData.length - 1; // Subtract header row
    }
    
    return {
      totalCases: totalCases,
      signnowLaunches: signnowLaunches,
      totalPremium: Math.round(totalPremium * 100) / 100,
      pendingSignatures: pendingSignatures,
      completedBonds: completedBonds,
      activeForfeitures: activeForfeitures
    };
    
  } catch (error) {
    Logger.log('Error calculating statistics: ' + error.toString());
    return {
      totalCases: 0,
      signnowLaunches: 0,
      totalPremium: 0,
      pendingSignatures: 0,
      completedBonds: 0,
      activeForfeitures: 0
    };
  }
}

/**
 * Updates in-custody status for a specific county
 */
function updateInCustodyStatusForCounty(county) {
  try {
    // Call existing function from ComprehensiveMenuSystem.gs or similar
    if (typeof updateInCustodyStatus === 'function') {
      return updateInCustodyStatus(county);
    }
    
    // Mock return if function doesn't exist yet
    return {
      recordsChecked: 0,
      statusChanges: 0,
      stillInCustody: 0,
      released: 0
    };
  } catch (error) {
    Logger.log('Error updating custody status: ' + error.toString());
    throw error;
  }
}

// ============================================================================
// CONFIGURATION HELPER
// ============================================================================

/**
 * Gets configuration from Script Properties or Code.gs
 * This ensures compatibility with existing config structure
 */
function getMCPConfig() {
  // Try to use existing getConfig() function if it exists
  if (typeof getConfig === 'function') {
    return getConfig();
  }
  
  // Fallback: read from Script Properties directly
  const props = PropertiesService.getScriptProperties();
  return {
    SIGNNOW_API_BASE: props.getProperty('SIGNNOW_API_BASE_URL') || 'https://api.signnow.com',
    SIGNNOW_ACCESS_TOKEN: props.getProperty('SIGNNOW_API_TOKEN') || props.getProperty('SIGNNOW_ACCESS_TOKEN'),
    TARGET_SPREADSHEET_ID: props.getProperty('TARGET_SPREADSHEET_ID') || '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E'
  };
}
