/**
 * WebhookHandler.gs
 * 
 * Google Apps Script Web App for handling webhooks from SignNow and Wix
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. In GAS, click Deploy → New deployment
 * 2. Select "Web app"
 * 3. Set "Execute as" to "Me"
 * 4. Set "Who has access" to "Anyone"
 * 5. Click Deploy
 * 6. Copy the Web app URL
 * 7. Register this URL as a webhook in SignNow
 */

/**
 * Handle GET requests (for testing/health check)
 * Renamed from doGet to avoid conflict with Code.gs
 */
function webhookHealthCheck(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Shamrock Bail Bonds Webhook Handler',
    timestamp: new Date().toISOString(),
    id: 'shamrock-sync-20251219'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests (webhooks from SignNow and Wix)
 * Called by proper routing in Code.gs
 */
function handleIncomingWebhook(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const source = detectWebhookSource(payload, e);
    
    console.log(`Webhook received from ${source}:`, JSON.stringify(payload).substring(0, 500));
    
    let result;
    
    switch (source) {
      case 'signnow':
        result = handleSignNowWebhook(payload);
        break;
      case 'wix':
        result = handleWixWebhook(payload);
        break;
      default:
        result = { success: false, error: 'Unknown webhook source' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Webhook error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Detect the source of the webhook based on payload structure
 */
function detectWebhookSource(payload, e) {
  // Check for SignNow webhook indicators
  if (payload.event || payload.meta?.event || payload.document_id) {
    return 'signnow';
  }
  
  // Check for Wix webhook indicators
  if (payload.action || e.parameter?.source === 'wix') {
    return 'wix';
  }
  
  return 'unknown';
}

/**
 * Handle SignNow webhooks
 */
function handleSignNowWebhook(payload) {
  const event = payload.event || payload.meta?.event;
  const documentId = payload.document_id || payload.content?.document_id;
  
  console.log(`SignNow event: ${event}, Document: ${documentId}`);
  
  switch (event) {
    case 'document.complete':
    case 'document_complete':
      return handleDocumentComplete(documentId, payload);
      
    case 'document.update':
    case 'document_update':
      return handleDocumentUpdate(documentId, payload);
      
    case 'invite.sent':
    case 'invite_sent':
      return handleInviteSent(documentId, payload);
      
    default:
      console.log(`Unhandled SignNow event: ${event}`);
      return { success: true, message: `Event ${event} acknowledged` };
  }
}

/**
 * Handle document completion - download and save to Google Drive
 */
function handleDocumentComplete(documentId, payload) {
  try {
    console.log(`Document ${documentId} completed, downloading...`);
    
    // Get document info
    const docInfo = SN_getDocumentStatus(documentId);
    if (!docInfo.success) {
      throw new Error('Failed to get document info');
    }
    
    // Create folder for this defendant
    const defendantName = extractDefendantName(docInfo.documentName) || 'Unknown';
    const dateStr = new Date().toISOString().split('T')[0];
    const folderName = `${defendantName} - ${dateStr}`;
    
    // Get or create the Completed Bonds folder
    const completedBondsFolder = getOrCreateFolder('Completed Bonds');
    const defendantFolder = getOrCreateFolder(folderName, completedBondsFolder);
    
    // Download and save the signed document
    const downloadResult = SN_downloadSignedDocument(documentId, defendantFolder.getId());
    
    if (!downloadResult.success) {
      throw new Error('Failed to download signed document');
    }
    
    // Update status in Wix
    updateWixDocumentStatus(documentId, 'signed');
    
    // Log the completion
    logCompletion(documentId, defendantName, downloadResult.fileUrl);
    
    return {
      success: true,
      message: 'Document saved to Google Drive',
      fileUrl: downloadResult.fileUrl,
      folderId: defendantFolder.getId()
    };
    
  } catch (error) {
    console.error('Error handling document completion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle document update events
 */
function handleDocumentUpdate(documentId, payload) {
  console.log(`Document ${documentId} updated`);
  
  // Check if all signatures are complete
  const status = SN_getDocumentStatus(documentId);
  
  if (status.success && status.status === 'completed') {
    return handleDocumentComplete(documentId, payload);
  }
  
  return { success: true, message: 'Update acknowledged' };
}

/**
 * Handle invite sent events
 */
function handleInviteSent(documentId, payload) {
  console.log(`Invite sent for document ${documentId}`);
  return { success: true, message: 'Invite sent acknowledged' };
}

/**
 * Handle Wix webhooks
 */
function handleWixWebhook(payload) {
  const action = payload.action;
  
  switch (action) {
    case 'saveDocumentToDrive':
      return handleSaveDocumentToDrive(payload.document);
      
    case 'syncIdUpload':
      return handleSyncIdUpload(payload.upload);
      
    default:
      console.log(`Unhandled Wix action: ${action}`);
      return { success: true, message: `Action ${action} acknowledged` };
  }
}

/**
 * Handle saving a document to Google Drive from Wix
 */
function handleSaveDocumentToDrive(document) {
  try {
    const { memberEmail, memberName, documentType, documentName, fileUrl, metadata } = document;
    
    // Create folder structure
    const completedBondsFolder = getOrCreateFolder('Completed Bonds');
    const dateStr = new Date().toISOString().split('T')[0];
    const memberFolder = getOrCreateFolder(`${memberName || memberEmail} - ${dateStr}`, completedBondsFolder);
    
    // Download the file from Wix
    const response = UrlFetchApp.fetch(fileUrl, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Failed to download file from Wix');
    }
    
    const blob = response.getBlob();
    const fileName = `${documentType}_${documentName || 'document'}.${getFileExtension(blob.getContentType())}`;
    
    const file = memberFolder.createFile(blob.setName(fileName));
    
    // Add metadata as file description
    if (metadata) {
      file.setDescription(JSON.stringify(metadata));
    }
    
    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    };
    
  } catch (error) {
    console.error('Error saving document to Drive:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle syncing an ID upload from Wix to Google Drive
 */
function handleSyncIdUpload(upload) {
  try {
    const { memberEmail, memberName, documentType, fileUrl, side, metadata } = upload;
    
    // Create folder structure
    const completedBondsFolder = getOrCreateFolder('Completed Bonds');
    const dateStr = new Date().toISOString().split('T')[0];
    const memberFolder = getOrCreateFolder(`${memberName || memberEmail} - ${dateStr}`, completedBondsFolder);
    const idsFolder = getOrCreateFolder('IDs', memberFolder);
    
    // Download the ID image from Wix
    const response = UrlFetchApp.fetch(fileUrl, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Failed to download ID from Wix');
    }
    
    const blob = response.getBlob();
    const fileName = `ID_${side || 'photo'}_${memberName || memberEmail}.${getFileExtension(blob.getContentType())}`;
    
    const file = idsFolder.createFile(blob.setName(fileName));
    
    // Add GPS and other metadata as file description
    if (metadata) {
      const metaObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      file.setDescription(`GPS: ${metaObj.gps?.latitude}, ${metaObj.gps?.longitude}\nUploaded: ${metaObj.uploadedAt}`);
    }
    
    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    };
    
  } catch (error) {
    console.error('Error syncing ID upload:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get or create a folder in Google Drive
 */
function getOrCreateFolder(name, parent) {
  let folder;
  
  if (parent) {
    const folders = parent.getFoldersByName(name);
    folder = folders.hasNext() ? folders.next() : parent.createFolder(name);
  } else {
    const folders = DriveApp.getFoldersByName(name);
    folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
  }
  
  return folder;
}

/**
 * Extract defendant name from document name
 */
function extractDefendantName(documentName) {
  if (!documentName) return null;
  
  // Try to extract name from common patterns
  // e.g., "Bail_Packet_John_Doe_2024-01-15"
  const patterns = [
    /Bail[_\s]Packet[_\s](.+?)[_\s]\d{4}/i,
    /Bond[_\s](.+?)[_\s]\d{4}/i,
    /(.+?)[_\s]Bail[_\s]Bond/i
  ];
  
  for (const pattern of patterns) {
    const match = documentName.match(pattern);
    if (match) {
      return match[1].replace(/_/g, ' ').trim();
    }
  }
  
  return documentName.split('_')[0];
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType) {
  const extensions = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  
  return extensions[mimeType] || 'bin';
}

/**
 * Log completion to a spreadsheet for tracking
 */
function logCompletion(documentId, defendantName, fileUrl) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    
    let sheet = ss.getSheetByName('Completed Bonds Log');
    if (!sheet) {
      sheet = ss.insertSheet('Completed Bonds Log');
      sheet.appendRow(['Timestamp', 'Document ID', 'Defendant Name', 'File URL', 'Status']);
    }
    
    sheet.appendRow([
      new Date().toISOString(),
      documentId,
      defendantName,
      fileUrl,
      'Completed'
    ]);
    
  } catch (error) {
    console.log('Could not log to spreadsheet:', error.message);
  }
}

/**
 * Test function to verify webhook handler is working
 */
function testWebhookHandler() {
  const testPayload = {
    event: 'document.complete',
    document_id: 'test-document-123'
  };
  
  console.log('Testing webhook handler...');
  const result = handleSignNowWebhook(testPayload);
  console.log('Result:', result);
}
