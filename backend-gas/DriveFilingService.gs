/**
 * DriveFilingService.gs
 * Version: 1.0.0
 * 
 * Handles automatic filing of completed bond documents into defendant-specific folders
 * Folder Naming Convention: LastNameFirstLetters-MMDDYY
 * Example: JonesBob-021026
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const COMPLETED_BONDS_FOLDER_ID = '1WnjwtxoaoXVW8_B6s-0ftdCPf_5WfKgs';

/**
 * Creates or retrieves a defendant-specific folder within "Completed Bonds"
 * @param {string} defendantFirstName - Defendant's first name
 * @param {string} defendantLastName - Defendant's last name
 * @param {string} dateBondWritten - Date bond was written (MM/DD/YYYY or Date object)
 * @returns {Folder} Google Drive Folder object
 */
function getOrCreateDefendantFolder(defendantFirstName, defendantLastName, dateBondWritten) {
  try {
    // 1. Parse and format the date
    let bondDate;
    if (typeof dateBondWritten === 'string') {
      // Handle MM/DD/YYYY or other common formats
      bondDate = new Date(dateBondWritten);
    } else if (dateBondWritten instanceof Date) {
      bondDate = dateBondWritten;
    } else {
      // Default to today if no date provided
      bondDate = new Date();
    }
    
    // Format as MMDDYY
    const month = String(bondDate.getMonth() + 1).padStart(2, '0');
    const day = String(bondDate.getDate()).padStart(2, '0');
    const year = String(bondDate.getFullYear()).slice(-2);
    const dateStr = month + day + year;
    
    // 2. Create folder name: LastNameFirstLetters-MMDDYY
    const lastName = (defendantLastName || '').trim().replace(/\s+/g, '');
    const firstLetters = (defendantFirstName || '').trim().substring(0, 3).replace(/\s+/g, '');
    const folderName = `${lastName}${firstLetters}-${dateStr}`;
    
    console.log('Creating/Finding folder:', folderName);
    
    // 3. Get parent "Completed Bonds" folder
    const parentFolder = DriveApp.getFolderById(COMPLETED_BONDS_FOLDER_ID);
    
    // 4. Check if folder already exists
    const existingFolders = parentFolder.getFoldersByName(folderName);
    if (existingFolders.hasNext()) {
      const folder = existingFolders.next();
      console.log('✅ Found existing folder:', folder.getUrl());
      return folder;
    }
    
    // 5. Create new folder
    const newFolder = parentFolder.createFolder(folderName);
    console.log('✅ Created new folder:', newFolder.getUrl());
    return newFolder;
    
  } catch (error) {
    console.error('❌ Error creating defendant folder:', error);
    throw new Error(`Failed to create defendant folder: ${error.message}`);
  }
}

/**
 * Saves a completed bond document to the defendant's folder
 * @param {object} params - Parameters object
 * @param {Blob|string} params.pdfBlob - PDF blob or base64 string
 * @param {string} params.fileName - Name for the PDF file
 * @param {string} params.defendantFirstName - Defendant's first name
 * @param {string} params.defendantLastName - Defendant's last name
 * @param {string} params.dateBondWritten - Date bond was written
 * @returns {object} Result with success status and file URL
 */
function saveCompletedBondToDrive(params) {
  try {
    const {
      pdfBlob,
      fileName,
      defendantFirstName,
      defendantLastName,
      dateBondWritten
    } = params;
    
    // Validate required parameters
    if (!pdfBlob) throw new Error('PDF blob is required');
    if (!defendantFirstName || !defendantLastName) {
      throw new Error('Defendant first and last name are required');
    }
    
    // 1. Get or create defendant folder
    const defendantFolder = getOrCreateDefendantFolder(
      defendantFirstName,
      defendantLastName,
      dateBondWritten || new Date()
    );
    
    // 2. Convert base64 to blob if needed
    let fileBlob;
    if (typeof pdfBlob === 'string') {
      // Assume it's base64
      fileBlob = Utilities.newBlob(
        Utilities.base64Decode(pdfBlob),
        'application/pdf',
        fileName || 'bond-document.pdf'
      );
    } else {
      // Already a blob
      fileBlob = pdfBlob;
      if (fileName) {
        fileBlob.setName(fileName);
      }
    }
    
    // 3. Save file to defendant folder
    const file = defendantFolder.createFile(fileBlob);
    
    console.log('✅ Saved bond document:', file.getUrl());
    
    return {
      success: true,
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      folderUrl: defendantFolder.getUrl(),
      folderId: defendantFolder.getId(),
      folderName: defendantFolder.getName()
    };
    
  } catch (error) {
    console.error('❌ Error saving completed bond:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handles SignNow webhook for completed documents
 * Downloads the signed PDF and files it in the defendant's folder
 * @param {object} webhookData - SignNow webhook payload
 * @returns {object} Result with success status
 */
function handleSignNowCompletedDocument(webhookData) {
  try {
    // 1. Extract document info from webhook
    const documentId = webhookData.document_id || webhookData.id;
    if (!documentId) throw new Error('No document ID in webhook');
    
    console.log('Processing completed SignNow document:', documentId);
    
    // 2. Download signed PDF from SignNow
    const signedPdf = downloadSignedPdfFromSignNow(documentId);
    
    // 3. Extract defendant info from document metadata or custom fields
    // This assumes you've stored defendant info in the document metadata
    const metadata = webhookData.meta || webhookData.document_meta || {};
    const defendantFirstName = metadata.defendantFirstName || metadata.DefFirstName;
    const defendantLastName = metadata.defendantLastName || metadata.DefLastName;
    const dateBondWritten = metadata.dateBondWritten || metadata.Date;
    
    if (!defendantFirstName || !defendantLastName) {
      console.warn('⚠️ Missing defendant info in webhook, using fallback');
      // Try to extract from document name
      const docName = webhookData.document_name || '';
      // Implement name parsing logic here if needed
    }
    
    // 4. Save to defendant folder
    const result = saveCompletedBondToDrive({
      pdfBlob: signedPdf,
      fileName: `Signed_Bond_${documentId}.pdf`,
      defendantFirstName: defendantFirstName || 'Unknown',
      defendantLastName: defendantLastName || 'Defendant',
      dateBondWritten: dateBondWritten
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error handling SignNow webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Downloads a signed PDF from SignNow
 * @param {string} documentId - SignNow document ID
 * @returns {Blob} PDF blob
 */
function downloadSignedPdfFromSignNow(documentId) {
  try {
    const config = getConfig();
    const accessToken = config.SIGNNOW_ACCESS_TOKEN;
    
    if (!accessToken) throw new Error('SignNow access token not configured');
    
    const url = `https://api.signnow.com/document/${documentId}/download`;
    
    const options = {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`SignNow API error: ${response.getContentText()}`);
    }
    
    return response.getBlob();
    
  } catch (error) {
    console.error('❌ Error downloading from SignNow:', error);
    throw error;
  }
}

/**
 * TEST FUNCTION - Create a sample defendant folder
 */
function testCreateDefendantFolder() {
  try {
    const folder = getOrCreateDefendantFolder(
      'Bobby',
      'Jones',
      '02/10/2026'
    );
    
    console.log('✅ Test Successful!');
    console.log('Folder Name:', folder.getName());
    console.log('Folder URL:', folder.getUrl());
    console.log('Expected Name: JonesBob-021026');
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

/**
 * TEST FUNCTION - Save a sample document
 */
function testSaveCompletedBond() {
  try {
    // Create a simple test PDF
    const testPdf = Utilities.newBlob('Test PDF Content', 'application/pdf', 'test.pdf');
    
    const result = saveCompletedBondToDrive({
      pdfBlob: testPdf,
      fileName: 'Test_Bond_Document.pdf',
      defendantFirstName: 'Bobby',
      defendantLastName: 'Jones',
      dateBondWritten: '02/10/2026'
    });
    
    console.log('✅ Test Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

// Export for other files
var DriveFilingService = {
  getOrCreateDefendantFolder: getOrCreateDefendantFolder,
  saveCompletedBondToDrive: saveCompletedBondToDrive,
  handleSignNowCompletedDocument: handleSignNowCompletedDocument
};
