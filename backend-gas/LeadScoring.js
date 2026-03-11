/**
 * ============================================
 * LEAD SCORING - Arrest Lead Qualification
 * ============================================
 * Automatically scores and qualifies arrest leads
 * based on bond amount, type, status, and other factors
 */

/**
 * Scores all leads in the Lee_County_Arrests sheet
 */
function scoreAllLeads() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lee_County_Arrests');
    
    if (!sheet) {
      ui.alert('Lee_County_Arrests sheet not found.');
      return;
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      ui.alert('No data to score.');
      return;
    }
    
    // Get or create Lead_Score and Lead_Status columns
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var scoreCol = headers.indexOf('Lead_Score') + 1;
    var statusCol = headers.indexOf('Lead_Status') + 1;
    
    if (scoreCol === 0) {
      // Add Lead_Score column
      scoreCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, scoreCol).setValue('Lead_Score');
    }
    
    if (statusCol === 0) {
      // Add Lead_Status column
      statusCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, statusCol).setValue('Lead_Status');
    }
    
    var bondAmountCol = headers.indexOf('Bond_Amount') + 1;
    var bondTypeCol = headers.indexOf('Bond_Type') + 1;
    var statusColData = headers.indexOf('Status') + 1;
    var chargesCol = headers.indexOf('Charges') + 1;
    
    var scored = 0;
    var hot = 0, warm = 0, cold = 0, disqualified = 0;
    
    // Score each row
    for (var i = 2; i <= lastRow; i++) {
      var rowData = sheet.getRange(i, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      var record = {};
      headers.forEach(function(header, index) {
        record[header] = rowData[index];
      });
      
      var scoreResult = scoreArrestLead(record);
      
      // Update the sheet
      sheet.getRange(i, scoreCol).setValue(scoreResult.score);
      sheet.getRange(i, statusCol).setValue(scoreResult.status);
      
      scored++;
      
      if (scoreResult.status === 'Hot') hot++;
      else if (scoreResult.status === 'Warm') warm++;
      else if (scoreResult.status === 'Cold') cold++;
      else if (scoreResult.status === 'Disqualified') disqualified++;
    }
    
    var message = '✅ Lead Scoring Complete!\n\n';
    message += 'Total scored: ' + scored + '\n\n';
    message += '🔥 Hot leads: ' + hot + '\n';
    message += '🌡️ Warm leads: ' + warm + '\n';
    message += '❄️ Cold leads: ' + cold + '\n';
    message += '🚫 Disqualified: ' + disqualified + '\n\n';
    message += 'Tip: Sort by Lead_Score (descending) to see best opportunities first!';
    
    ui.alert(message);
    
    Logger.log('Scored ' + scored + ' leads');
    
  } catch (error) {
    ui.alert('Error scoring leads: ' + error.message);
    Logger.log('Error in scoreAllLeads: ' + error.message);
  }
}

/**
 * Scores a single arrest lead
 * Returns {score: number, status: string, reasons: array}
 */
function scoreArrestLead(record) {
  var score = 0;
  var reasons = [];
  
  // Extract data
  var bondAmount = parseFloat(String(record.Bond_Amount || '0').replace(/,/g, ''));
  var bondType = String(record.Bond_Type || '').toUpperCase();
  var status = String(record.Status || '').toUpperCase();
  var charges = String(record.Charges || '');
  
  // ===== BOND AMOUNT SCORING =====
  if (bondAmount >= 500 && bondAmount <= 50000) {
    score += 30;
    reasons.push('Ideal bond amount ($500-$50K)');
  } else if (bondAmount > 50000 && bondAmount <= 100000) {
    score += 20;
    reasons.push('High bond amount ($50K-$100K)');
  } else if (bondAmount > 100000) {
    score += 10;
    reasons.push('Very high bond amount (>$100K)');
  } else if (bondAmount > 0 && bondAmount < 500) {
    score -= 10;
    reasons.push('Low bond amount (<$500)');
  } else if (bondAmount === 0) {
    score -= 50;
    reasons.push('No bond amount');
  }
  
  // ===== BOND TYPE SCORING =====
  if (bondType.indexOf('CASH') !== -1 || bondType.indexOf('SURETY') !== -1) {
    score += 25;
    reasons.push('Bondable type (Cash/Surety)');
  }
  
  if (bondType.indexOf('NO BOND') !== -1 || bondType.indexOf('HOLD') !== -1) {
    score -= 50;
    reasons.push('NOT BONDABLE (No Bond/Hold)');
  }
  
  if (bondType.indexOf('ROR') !== -1 || bondType.indexOf('R.O.R') !== -1) {
    score -= 30;
    reasons.push('Released on own recognizance');
  }
  
  // ===== STATUS SCORING =====
  if (status.indexOf('IN CUSTODY') !== -1 || status.indexOf('INCUSTODY') !== -1) {
    score += 20;
    reasons.push('Currently in custody');
  } else if (status.indexOf('RELEASED') !== -1) {
    score -= 30;
    reasons.push('Already released');
  }
  
  // ===== DATA COMPLETENESS =====
  var hasAllRequired = true;
  
  if (!record.Full_Name || String(record.Full_Name).trim() === '') hasAllRequired = false;
  if (!record.Charges || String(record.Charges).trim() === '') hasAllRequired = false;
  if (!record.Bond_Amount || String(record.Bond_Amount).trim() === '') hasAllRequired = false;
  if (!record.Court_Date || String(record.Court_Date).trim() === '') hasAllRequired = false;
  
  if (hasAllRequired) {
    score += 15;
    reasons.push('Complete data');
  } else {
    score -= 10;
    reasons.push('Missing data');
  }
  
  // ===== CHARGE SEVERITY CHECK =====
  var chargesLower = charges.toLowerCase();
  
  // Disqualifying charges
  if (chargesLower.indexOf('capital') !== -1 || 
      chargesLower.indexOf('murder') !== -1 ||
      chargesLower.indexOf('federal') !== -1) {
    score -= 100;
    reasons.push('DISQUALIFIED: Severe charge');
  }
  
  // ===== DETERMINE STATUS =====
  var leadStatus = '';
  
  if (score < 0) {
    leadStatus = 'Disqualified';
  } else if (score >= 70) {
    leadStatus = 'Hot';
  } else if (score >= 40) {
    leadStatus = 'Warm';
  } else {
    leadStatus = 'Cold';
  }
  
  return {
    score: score,
    status: leadStatus,
    reasons: reasons
  };
}

/**
 * Gets hot leads (score >= 70) for notification
 */
function getHotLeads() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lee_County_Arrests');
    
    if (!sheet) {
      return [];
    }
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var scoreCol = headers.indexOf('Lead_Score') + 1;
    
    if (scoreCol === 0) {
      // No scoring done yet
      return [];
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }
    
    var allData = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    var hotLeads = [];
    
    allData.forEach(function(row, index) {
      var record = {};
      headers.forEach(function(header, colIndex) {
        record[header] = row[colIndex];
      });
      
      if (record.Lead_Score >= 70) {
        record.rowNumber = index + 2;
        hotLeads.push(record);
      }
    });
    
    // Sort by score descending
    hotLeads.sort(function(a, b) {
      return b.Lead_Score - a.Lead_Score;
    });
    
    return hotLeads;
    
  } catch (error) {
    Logger.log('Error getting hot leads: ' + error.message);
    return [];
  }
}

/**
 * Automatically score new arrests after scraper runs
 * Call this from the scraper after new records are added
 */
function autoScoreNewArrests(startRow, endRow) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Lee_County_Arrests');
    
    if (!sheet) {
      return;
    }
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var scoreCol = headers.indexOf('Lead_Score') + 1;
    var statusCol = headers.indexOf('Lead_Status') + 1;
    
    // Ensure columns exist
    if (scoreCol === 0) {
      scoreCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, scoreCol).setValue('Lead_Score');
    }
    
    if (statusCol === 0) {
      statusCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, statusCol).setValue('Lead_Status');
    }
    
    // Score the new rows
    for (var i = startRow; i <= endRow; i++) {
      var rowData = sheet.getRange(i, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      var record = {};
      headers.forEach(function(header, index) {
        record[header] = rowData[index];
      });
      
      var scoreResult = scoreArrestLead(record);
      
      sheet.getRange(i, scoreCol).setValue(scoreResult.score);
      sheet.getRange(i, statusCol).setValue(scoreResult.status);
    }
    
    Logger.log('Auto-scored rows ' + startRow + ' to ' + endRow);
    
  } catch (error) {
    Logger.log('Error in autoScoreNewArrests: ' + error.message);
  }
}

