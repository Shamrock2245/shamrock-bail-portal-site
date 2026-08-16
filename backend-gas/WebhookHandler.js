/**
 * WebhookHandler.gs
 * 
 * Google Apps Script Web App for handling retired e-sign callback rejection and Wix webhooks
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. In GAS, click Deploy → New deployment
 * 2. Select "Web app"
 * 3. Set "Execute as" to "Me"
 * 4. Set "Who has access" to "Anyone"
 * 5. Click Deploy
 * 6. Copy the Web app URL
 *  */

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
 * Handle POST requests (Wix webhooks; retired e-sign callbacks are rejected)
 * Called by proper routing in Code.gs
 */
function handleIncomingWebhook(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const source = detectWebhookSource(payload, e);

    console.log(`Webhook received from ${source}:`, JSON.stringify(payload).substring(0, 500));

    let result;

    switch (source) {
      case 'wix':
        result = handleWixWebhook(payload);
        break;
      default:
        result = { success: false, error: 'Unsupported webhook source' };
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
  if (payload.action || e.parameter?.source === 'wix') {
    return 'wix';
  }
  return 'unknown';
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

    // Format names for DriveFilingService using Defendant First and Last names extracted from memberName
    let firstName = memberName || memberEmail || 'Unknown';
    let lastName = '';
    if (memberName && memberName.includes(' ')) {
      const parts = memberName.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    const memberFolder = DriveFilingService.getOrCreateDefendantFolder(firstName, lastName, new Date());

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

    // Format names for DriveFilingService
    let firstName = memberName || memberEmail || 'Unknown';
    let lastName = '';
    if (memberName && memberName.includes(' ')) {
      const parts = memberName.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    const memberFolder = DriveFilingService.getOrCreateDefendantFolder(firstName, lastName, new Date());

    // Helper function no longer exists; DriveApp.getFoldersByName does
    const existingIds = memberFolder.getFoldersByName('IDs');
    const idsFolder = existingIds.hasNext() ? existingIds.next() : memberFolder.createFolder('IDs');

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
 * getOrCreateFolder function deprecated in favor of DriveFilingService.
 */

/**
 * Extract defendant name from document name
 */
function extractDefendantName(documentName) {
  if (!documentName) return null;
  // Handle Shamrock_ naming convention: Shamrock_<docId>[_signer<N>]_<caseNumber>
  // e.g., "Shamrock_indemnity-agreement_signer0_2024-001"
  const shamrockMatch = documentName.match(/^Shamrock_[^_]+(?:_signer-?\d+)?_(.+)$/);
  if (shamrockMatch) {
    return shamrockMatch[1].replace(/_/g, ' ').trim();
  }
  // Legacy patterns
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
  const result = { success: false, error: 'Legacy e-sign webhooks are retired' };
  console.log('Result:', result);
}
