/**
 * AdobePDFService.gs
 * Version: 1.0.0
 * 
 * Handles PDF form filling using Adobe PDF Services API.
 * Integrates with the bail bond automation workflow to fill PDF forms
 * with data from Dashboard.html and prepare them for SignNow.
 */

// ============================================================================
// ADOBE PDF SERVICES CONFIGURATION
// ============================================================================

/**
 * Get Adobe PDF Services credentials from Script Properties
 * @returns {object} {clientId, clientSecret}
 */
function getAdobeCredentials() {
  const props = PropertiesService.getScriptProperties();
  return {
    clientId: props.getProperty('ADOBE_CLIENT_ID'),
    clientSecret: props.getProperty('ADOBE_CLIENT_SECRET')
  };
}

/**
 * Get Adobe access token
 * @returns {string} Access token
 */
function getAdobeAccessToken() {
  const creds = getAdobeCredentials();
  
  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('Adobe credentials not configured. Please set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET in Script Properties.');
  }
  
  const tokenUrl = 'https://pdf-services.adobe.io/token';
  const payload = {
    'client_id': creds.clientId,
    'client_secret': creds.clientSecret
  };
  
  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': payload,
    'muteHttpExceptions': true
  };
  
  const response = UrlFetchApp.fetch(tokenUrl, options);
  const result = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to get Adobe access token: ' + result.message);
  }
  
  return result.access_token;
}

/**
 * Upload PDF to Adobe
 * @param {string} accessToken - Adobe access token
 * @param {Blob} pdfBlob - PDF file blob
 * @returns {string} Asset ID
 */
function uploadPdfToAdobe(accessToken, pdfBlob) {
  const creds = getAdobeCredentials();
  
  // Step 1: Get pre-signed upload URI
  const assetsUrl = 'https://pdf-services.adobe.io/assets';
  const step1Options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + accessToken,
      'X-API-Key': creds.clientId
    },
    'payload': JSON.stringify({
      'mediaType': 'application/pdf'
    }),
    'muteHttpExceptions': true
  };
  
  const step1Response = UrlFetchApp.fetch(assetsUrl, step1Options);
  const step1Result = JSON.parse(step1Response.getContentText());
  
  if (step1Response.getResponseCode() !== 200) {
    throw new Error('Failed to get upload URI: ' + step1Result.message);
  }
  
  const assetID = step1Result.assetID;
  const uploadUri = step1Result.uploadUri;
  
  // Step 2: Upload PDF to pre-signed URI
  const step2Options = {
    'method': 'put',
    'contentType': 'application/pdf',
    'payload': pdfBlob.getBytes(),
    'muteHttpExceptions': true
  };
  
  const step2Response = UrlFetchApp.fetch(uploadUri, step2Options);
  
  if (step2Response.getResponseCode() !== 200) {
    throw new Error('Failed to upload PDF to S3');
  }
  
  return assetID;
}

/**
 * Fill PDF form using Adobe Import PDF Form Data API
 * @param {string} accessToken - Adobe access token
 * @param {string} assetID - Asset ID of uploaded PDF
 * @param {object} formData - Form field data (key-value pairs)
 * @returns {string} Job location URL for polling
 */
function submitImportFormDataJob(accessToken, assetID, formData) {
  const creds = getAdobeCredentials();
  const jobUrl = 'https://pdf-services.adobe.io/operation/setformdata';
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + accessToken,
      'x-api-key': creds.clientId
    },
    'payload': JSON.stringify({
      'assetID': assetID,
      'jsonFormFieldsData': formData
    }),
    'muteHttpExceptions': true
  };
  
  const response = UrlFetchApp.fetch(jobUrl, options);
  
  if (response.getResponseCode() !== 201) {
    const errorResult = JSON.parse(response.getContentText());
    throw new Error('Failed to submit import form data job: ' + JSON.stringify(errorResult));
  }
  
  return response.getHeaders()['location'];
}

/**
 * Poll job status until completion
 * @param {string} accessToken - Adobe access token
 * @param {string} jobLocation - Job location URL
 * @returns {string} Result asset ID
 */
function pollJobStatus(accessToken, jobLocation) {
  const creds = getAdobeCredentials();
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const options = {
      'method': 'get',
      'headers': {
        'Authorization': 'Bearer ' + accessToken,
        'x-api-key': creds.clientId
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(jobLocation, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status === 'done') {
      return result.asset.assetID;
    } else if (result.status === 'failed') {
      throw new Error('Job failed: ' + JSON.stringify(result));
    }
    
    // Wait 2 seconds before next poll
    Utilities.sleep(2000);
    attempts++;
  }
  
  throw new Error('Job timed out after ' + maxAttempts + ' attempts');
}

/**
 * Download filled PDF from Adobe
 * @param {string} accessToken - Adobe access token
 * @param {string} assetID - Asset ID of filled PDF
 * @returns {Blob} Filled PDF blob
 */
function downloadFilledPdf(accessToken, assetID) {
  const creds = getAdobeCredentials();
  
  // Step 1: Get download URI
  const metadataUrl = 'https://pdf-services.adobe.io/assets/' + assetID;
  const step1Options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Bearer ' + accessToken,
      'x-api-key': creds.clientId
    },
    'muteHttpExceptions': true
  };
  
  const step1Response = UrlFetchApp.fetch(metadataUrl, step1Options);
  const step1Result = JSON.parse(step1Response.getContentText());
  
  if (step1Response.getResponseCode() !== 200) {
    throw new Error('Failed to get download URI: ' + step1Result.message);
  }
  
  const downloadUri = step1Result.downloadUri;
  
  // Step 2: Download PDF from S3
  const step2Response = UrlFetchApp.fetch(downloadUri);
  return step2Response.getBlob();
}

/**
 * Main function: Fill PDF form with data using Adobe PDF Services API
 * @param {Blob} templatePdfBlob - Template PDF with form fields
 * @param {object} formData - Form field data (key-value pairs matching field names)
 * @returns {Blob} Filled PDF blob
 */
function fillPdfForm(templatePdfBlob, formData) {
  try {
    console.log('Starting Adobe PDF form filling...');
    
    // Step 1: Get access token
    console.log('Getting Adobe access token...');
    const accessToken = getAdobeAccessToken();
    
    // Step 2: Upload template PDF
    console.log('Uploading template PDF to Adobe...');
    const assetID = uploadPdfToAdobe(accessToken, templatePdfBlob);
    console.log('Template uploaded, asset ID:', assetID);
    
    // Step 3: Submit import form data job
    console.log('Submitting import form data job...');
    const jobLocation = submitImportFormDataJob(accessToken, assetID, formData);
    console.log('Job submitted, polling for completion...');
    
    // Step 4: Poll for completion
    const resultAssetID = pollJobStatus(accessToken, jobLocation);
    console.log('Job completed, result asset ID:', resultAssetID);
    
    // Step 5: Download filled PDF
    console.log('Downloading filled PDF...');
    const filledPdfBlob = downloadFilledPdf(accessToken, resultAssetID);
    console.log('✅ PDF form filled successfully');
    
    return filledPdfBlob;
    
  } catch (error) {
    console.error('❌ Adobe PDF form filling failed:', error.message);
    throw error;
  }
}

/**
 * Map intake data to PDF field names for OSI Defendant Application
 * @param {object} intakeData - Intake data from Dashboard.html
 * @returns {object} Mapped form data
 */
function mapIntakeDataToDefendantApplication(intakeData) {
  return {
    // Case Info
    'TotalBond': intakeData.bondAmount || '',
    'DefCounty': intakeData.county || '',
    'DefCharges': intakeData.charges || '',
    'CaseNum': intakeData.caseNumber || '',
    'PowerNum': intakeData.powerNumber || '',
    'Premium': intakeData.premium || '',
    'Date': Utilities.formatDate(new Date(), 'America/New_York', 'MM/dd/yyyy'),
    
    // Defendant Info
    'DefName': intakeData.defendantName || '',
    'DefDOB': intakeData.defendantDOB || '',
    'DefSSN': intakeData.defendantSSN || '',
    'DefAddress': intakeData.defendantAddress || '',
    'DefCity': intakeData.defendantCity || '',
    'DefState': intakeData.defendantState || 'FL',
    'DefZip': intakeData.defendantZip || '',
    'DefPhone': intakeData.defendantPhone || '',
    'DefEmail': intakeData.defendantEmail || '',
    'DefEmployer': intakeData.defendantEmployer || '',
    'DefHeight': intakeData.defendantHeight || '',
    'DefWeight': intakeData.defendantWeight || '',
    'DefEyes': intakeData.defendantEyes || '',
    'DefHair': intakeData.defendantHair || '',
    'DefDL': intakeData.defendantDL || '',
    'DefSocialMedia': intakeData.defendantFacebook || '',
    
    // Vehicle
    'DefCarYear': intakeData.vehicleYear || '',
    'DefCarMake': intakeData.vehicleMake || '',
    'DefCarModel': intakeData.vehicleModel || '',
    'DefCarColor': intakeData.vehicleColor || '',
    'DefCarPlate': intakeData.vehiclePlate || '',
    
    // References
    'Ref1Name': intakeData.reference1Name || '',
    'Ref1Phone': intakeData.reference1Phone || '',
    'Ref1Address': intakeData.reference1Address || ''
  };
}

/**
 * TEST FUNCTION: Test Adobe PDF form filling with OSI Defendant Application
 */
function testAdobePdfFilling() {
  try {
    // Get the template PDF from Drive
    const templateFileId = '1eFwOUAf4Wtlkux4DZkI9d3IJVVC-JLV9Zv5wLzG86o8'; // defendant-application template
    const templateFile = DriveApp.getFileById(templateFileId);
    const templatePdfBlob = templateFile.getBlob();
    
    // Test data
    const testData = {
      'DefName': 'JOHN MICHAEL DOE',
      'DefDOB': '01/15/1985',
      'DefSSN': '123-45-6789',
      'DefAddress': '123 Main Street',
      'DefCity': 'Fort Myers',
      'DefState': 'FL',
      'DefZip': '33901',
      'DefPhone': '(239) 555-1234',
      'DefEmail': 'jdoe@example.com',
      'DefEmployer': 'ABC Company',
      'TotalBond': '10000',
      'CaseNum': '2026-CF-001234',
      'Premium': '1000',
      'DefCounty': 'Lee County',
      'DefCharges': 'DUI, Reckless Driving'
    };
    
    // Fill the form
    const filledPdfBlob = fillPdfForm(templatePdfBlob, testData);
    
    // Save to Drive
    const destFolder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('GOOGLE_DRIVE_FOLDER_ID'));
    const savedFile = destFolder.createFile(filledPdfBlob);
    savedFile.setName('TEST_Adobe_Filled_Defendant_Application.pdf');
    
    console.log('✅ Test successful! Filled PDF saved to Drive:', savedFile.getUrl());
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Export for other files
var AdobePDFService = {
  fillPdfForm: fillPdfForm,
  mapIntakeDataToDefendantApplication: mapIntakeDataToDefendantApplication
};
