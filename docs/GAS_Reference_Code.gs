/**
 * GAS_Reference_Code.gs
 * 
 * This file serves as the "Interface Contract" between the Wix Portal and the Google Apps Script Backend.
 * Copy the relevant parts of this code into your GAS project's Code.gs file.
 * 
 * REQUIRED SCRIPT PROPERTIES (File > Project Properties > Script Properties):
 * - SIGNNOW_API_TOKEN: Your SignNow API Bearer Token
 * - WIX_API_KEY: The same key stored in Wix Secrets as GAS_API_KEY
 * - WIX_SITE_URL: The URL of your Wix site (e.g., https://www.shamrockbailbonds.com)
 */

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, ...data } = request;
    
    let result;
    
    switch (action) {
      case 'sendForSignature':
        result = handleSendForSignature(data);
        break;
        
      case 'createEmbeddedLink':
        result = handleCreateEmbeddedLink(data);
        break;
        
      case 'getDocumentStatus':
        result = handleGetDocumentStatus(data);
        break;
        
      case 'logDefendantLocation':
        result = handleLogDefendantLocation(data);
        break;
        
      default:
        return createErrorResponse('Unknown action: ' + action);
    }
    
    return createSuccessResponse(result);
    
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    ...data
  })).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: message
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// Handlers
// ==========================================

function handleSendForSignature(data) {
  // data: { pdfBase64, fileName, signers: [{email, role}], parsing_options? }
  
  // 1. Upload document to SignNow
  const uploadResult = signNowUploadEvent(data.pdfBase64, data.fileName);
  if (!uploadResult.id) throw new Error('Failed to upload document to SignNow');
  
  const documentId = uploadResult.id;
  
  // 2. Add fields/signers (Field Extraction)
  // Note: Depending on your workflow, you might use templates or Smart Fields
  // This is a simplified example assuming generic invite
  
  // 3. Send Invite
  const inviteResult = signNowInvite(documentId, data.signers);
  
  return {
    documentId: documentId,
    status: 'pending',
    messsage: 'Document sent for signature'
  };
}

function handleCreateEmbeddedLink(data) {
  // data: { documentId, signerEmail, signerRole, linkExpiration }
  
  // 1. Create a signing link
  const linkResult = signNowCreateLink(data.documentId, data.signerEmail, data.linkExpiration);
  
  // 2. Notify Wix (Optional, Wix might already know since it requested it)
  // syncToWix('documentsAdd', { ... });
  
  return {
    link: linkResult.link,
    expiresAt: linkResult.expires_at // Ensure your signNowCreateLink returns this
  };
}

function handleGetDocumentStatus(data) {
  // data: { documentId }
  
  const status = signNowGetStatus(data.documentId);
  return {
    status: status
  };
}

function handleLogDefendantLocation(data) {
  // Logic from defendant-locations-gas.gs
  // Implement logging to Google Sheet here or call the function if separated
  
  // Example dummy implementation
  return { logged: true };
}

// ==========================================
// SignNow API Helpers (Stubs - Implement with actual fetch)
// ==========================================

function signNowUploadEvent(base64, name) {
  // POST https://api.signnow.com/document
  // Authorization: Bearer ...
  // Body: multipart/form-data...
  
  // RETURN MOCK
  return { id: 'mock_doc_id_' + new Date().getTime() };
}

function signNowInvite(documentId, signers) {
  // POST https://api.signnow.com/document/{id}/invite
  // ...
  return { success: true };
}

function signNowCreateLink(documentId, email, expiration) {
  // POST https://api.signnow.com/document/{id}/embedded-signing-link
  // ...
  return { link: 'https://signnow.com/s/mock_link', expires_at: new Date().getTime() + 3600000 };
}

function signNowGetStatus(documentId) {
  // GET https://api.signnow.com/document/{id}
  return 'pending';
}
