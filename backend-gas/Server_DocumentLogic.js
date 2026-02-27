/**
 * Server_DocumentLogic.js
 * Handles server-side document operations for the Shamrock Dashboard.
 * Focuses on DriveApp interactions and file handling.
 */

/**
 * Fetches the base64 content of a PDF file from Google Drive.
 * @param {string} fileId - The Google Drive File ID.
 * @return {string} - The base64 encoded content of the file.
 */
function getPDFContent(fileId) {
    try {
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        return Utilities.base64Encode(blob.getBytes());
    } catch (e) {
        console.error('Error fetching PDF content:', e.message);
        throw new Error('Failed to fetch PDF content: ' + e.message);
    }
}

/**
 * Fetches multiple PDF templates by their IDs.
 * @param {Array<string>} fileIds - Array of Google Drive File IDs.
 * @return {Object} - Object mapping fileId to base64 content.
 */
function getPDFTemplatesBatch(fileIds) {
    const results = {};
    fileIds.forEach(id => {
        try {
            results[id] = getPDFContent(id);
        } catch (e) {
            console.warn(`Skipping file ${id}: ${e.message}`);
            results[id] = null;
        }
    });
    return results;
}

/**
 * Saves a base64 encoded PDF to a specific Google Drive folder.
 * @param {string} base64Content - The base64 encoded PDF content.
 * @param {string} fileName - The name for the new file.
 * @param {string} folderId - The ID of the folder to save in (optional, uses config default if not provided).
 * @return {string} - The ID of the created file.
 */
function saveCompositePDF(base64Content, fileName, folderId) {
    try {
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), 'application/pdf', fileName);

        // Get folder from config or use provided ID
        let folder;
        if (folderId) {
            folder = DriveApp.getFolderById(folderId);
        } else {
            const config = getConfig(); // Assuming getConfig() is global from Code.js
            const destId = config.GOOGLE_DRIVE_OUTPUT_FOLDER_ID;
            if (destId) {
                folder = DriveApp.getFolderById(destId);
            } else {
                folder = DriveApp.getRootFolder();
            }
        }

        const file = folder.createFile(blob);
        // Explicitly set sharing to ANYONE_WITH_LINK VIEW for SignNow to access
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        return file.getId();
    } catch (e) {
        console.error('Error saving composite PDF:', e.message);
        throw new Error('Failed to save composite PDF: ' + e.message);
    }
}

/**
 * Proxies a request to the Wix backend for SignNow operations.
 * @param {string} endpoint - The Wix function name (e.g. 'signNowUploadAndSend').
 * @param {Object} payload - The JSON payload to send.
 * @return {Object} - The JSON response from Wix.
 */
function callWixBackend(endpoint, payload) {
    try {
        const config = getConfig();
        const url = `${config.WIX_SITE_URL}/_functions/${endpoint}`;

        // Add authentication header if needed (using GAS_API_KEY from config)
        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            headers: {
                'Authorization': config.WIX_API_KEY // Ensure this matches Wix backend expectation
            },
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, options);
        const contextText = response.getContentText();

        if (response.getResponseCode() >= 400) {
            throw new Error(`Wix Backend Error (${response.getResponseCode()}): ${contextText}`);
        }

        return JSON.parse(contextText);
    } catch (e) {
        console.error(`Error calling Wix endpoint ${endpoint}:`, e.message);
        throw new Error(`Failed to call Wix backend: ${e.message}`);
    }
}

/**
 * Wrapper for specific SignNow operations to be called from Client
 */
function server_uploadAndSendForSigning(pdfUrl, filename, fields, signers, options) {
    return callWixBackend('signNowUploadAndSend', {
        pdfUrl,
        filename,
        fields,
        signers,
        options
    });
}

function server_storePendingDocument(pendingDoc) {
    return callWixBackend('storePendingDocument', pendingDoc);
}

function server_sendSigningNotification(notification) {
    return callWixBackend('sendSigningNotification', notification);
}

/**
 * Get the full packet manifest for a case.
 * Called by Dashboard via google.script.run.server_getPacketManifest(data)
 *
 * @param {Object} data - Case data including defendant info and indemnitors array
 * @return {Object} - Manifest with doc entries, status info, and counts
 */
function server_getPacketManifest(data) {
    return handleGetPacketManifest(data);
}

/**
 * Get a signing URL for a specific document in the packet.
 * Called by Dashboard via google.script.run.server_getSigningUrl(data)
 *
 * @param {Object} data - { documentId, role, email, caseNumber, signerIndex }
 * @return {Object} - { success, signingUrl, documentId, role, signerIndex, docLabel, expiresInMinutes }
 */
function server_getSigningUrl(data) {
    return handleTelegramGetSigningUrl(data);
}
