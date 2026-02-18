/**
 * Dashboard.html SignNow Integration Functions
 * 
 * ADD THESE FUNCTIONS TO Dashboard_FIXED.html
 * 
 * These functions integrate with the Wix backend SignNow API
 * and handle the complete document generation → signing workflow
 */

/**
 * Generate packet and send to SignNow for signing
 * This is the main entry point called from the Dashboard UI
 */
async function generateAndSendWithWixPortal() {
    console.log('Starting packet generation and SignNow workflow...');
    
    try {
        // Step 1: Validate form data
        const formData = collectFormData();
        if (!validateFormData(formData)) {
            throw new Error('Form validation failed');
        }
        
        // Step 2: Fetch PDFs from Google Drive
        showStatus('Fetching PDF templates...');
        const pdfs = await fetchPDFsFromDrive();
        
        // Step 3: Fill PDFs with data
        showStatus('Filling PDF forms...');
        const filledPDFs = await fillPDFsWithData(pdfs, formData);
        
        // Step 4: Merge PDFs into single packet
        showStatus('Merging documents...');
        const mergedPDF = await mergePDFs(filledPDFs);
        
        // Step 5: Upload merged PDF to temporary storage (Google Drive)
        showStatus('Uploading packet...');
        const pdfUrl = await uploadPDFToTempStorage(mergedPDF, formData);
        
        // Step 6: Prepare signature fields from CONFIG
        const signatureFields = prepareSignatureFields(formData);
        
        // Step 7: Prepare signers list
        const signers = prepareSignersList(formData);
        
        // Step 8: Send to SignNow via Wix backend
        showStatus('Sending to SignNow...');
        const result = await sendToSignNow(pdfUrl, signatureFields, signers, formData);
        
        // Step 9: Store signing links in Wix CMS
        showStatus('Storing signing links...');
        await storePendingDocument(result, formData);
        
        // Step 10: Send notifications
        showStatus('Sending notifications...');
        await sendSigningNotifications(result, formData);
        
        // Success!
        showSuccess('Packet sent successfully! Signers will receive email invitations.');
        console.log('SignNow workflow completed:', result);
        
        return result;
        
    } catch (error) {
        console.error('Failed to generate and send packet:', error);
        showError(`Failed to send packet: ${error.message}`);
        throw error;
    }
}

/**
 * Prepare signature fields from CONFIG.signatureFields
 * Converts Dashboard CONFIG format to SignNow API format
 */
function prepareSignatureFields(formData) {
    const fields = [];
    
    // Get signature field configuration
    const signatureConfig = CONFIG.signatureFields;
    
    // Iterate through each document's signature fields
    for (const [docKey, docFields] of Object.entries(signatureConfig)) {
        // Skip appearance-bond (print only)
        if (docKey === 'appearance-bond') continue;
        
        // Get page offset for this document in merged PDF
        const pageOffset = getDocumentPageOffset(docKey);
        
        // Add each field
        docFields.forEach(field => {
            fields.push({
                type: field.type, // 'signature' or 'initials'
                role: field.role, // 'Defendant', 'Indemnitor', 'Agent'
                page: pageOffset + field.page,
                x: field.x,
                y: field.y,
                width: field.width || 200,
                height: field.height || 50,
                required: field.required !== false
            });
        });
    }
    
    console.log(`Prepared ${fields.length} signature fields`);
    return fields;
}

/**
 * Get page offset for a document in the merged PDF
 * This accounts for documents being merged in order
 */
function getDocumentPageOffset(docKey) {
    let offset = 0;
    
    // Iterate through template order until we find the document
    for (const templateKey of CONFIG.templateOrder) {
        if (templateKey === docKey) {
            break;
        }
        
        // Add page count of previous document
        // (This would need to be tracked during PDF merging)
        offset += getDocumentPageCount(templateKey);
    }
    
    return offset;
}

/**
 * Prepare signers list with proper ordering
 * Indemnitors sign first, then defendant, then agent
 */
function prepareSignersList(formData) {
    const signers = [];
    let order = 1;
    
    // 1. Indemnitors sign first (in order)
    if (formData.indemnitors && formData.indemnitors.length > 0) {
        formData.indemnitors.forEach((ind, index) => {
            signers.push({
                email: ind.email,
                role: `Indemnitor${index + 1}`,
                order: order++,
                firstName: ind.firstName,
                lastName: ind.lastName
            });
        });
    }
    
    // 2. Defendant signs after release (higher order number)
    if (formData['defendant-email']) {
        signers.push({
            email: formData['defendant-email'],
            role: 'Defendant',
            order: order++,
            firstName: formData['defendant-first-name'],
            lastName: formData['defendant-last-name']
        });
    }
    
    // 3. Agent signs last (if needed)
    signers.push({
        email: 'admin@shamrockbailbonds.biz',
        role: 'Agent',
        order: order++,
        firstName: 'Shamrock',
        lastName: 'Bail Bonds'
    });
    
    console.log(`Prepared ${signers.length} signers`);
    return signers;
}

/**
 * Send packet to SignNow via Wix backend API
 */
async function sendToSignNow(pdfUrl, fields, signers, formData) {
    try {
        // Call Wix backend function
        const result = await wixBackend.uploadAndSendForSigning(
            pdfUrl,
            `Shamrock_Bail_Packet_${formData['defendant-last-name']}_${Date.now()}.pdf`,
            fields,
            signers,
            {
                subject: 'Shamrock Bail Bonds - Signature Required',
                message: 'Please review and sign the attached bail bond documents.',
                redirectUrl: 'https://shamrockbailbonds.biz',
                expirationDays: 30
            }
        );
        
        return result;
    } catch (error) {
        console.error('Failed to send to SignNow:', error);
        throw error;
    }
}

/**
 * Store pending document info in Wix CMS
 * This allows the mobile portal to display signing status
 */
async function storePendingDocument(signNowResult, formData) {
    try {
        const pendingDoc = {
            documentId: signNowResult.documentId,
            documentName: signNowResult.documentName,
            defendantName: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`,
            defendantEmail: formData['defendant-email'],
            indemnitorEmails: formData.indemnitors.map(ind => ind.email),
            embeddedLinks: signNowResult.embeddedLinks,
            status: 'pending',
            createdDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        // Store in Wix CMS via backend
        await wixBackend.storePendingDocument(pendingDoc);
        
        console.log('Pending document stored in CMS');
    } catch (error) {
        console.error('Failed to store pending document:', error);
        // Non-fatal - continue workflow
    }
}

/**
 * Send signing notifications via email/SMS
 */
async function sendSigningNotifications(signNowResult, formData) {
    try {
        // Indemnitors get immediate notification
        for (const ind of formData.indemnitors) {
            await wixBackend.sendSigningNotification({
                to: ind.email,
                role: 'Indemnitor',
                signingLink: signNowResult.embeddedLinks[ind.email],
                defendantName: `${formData['defendant-first-name']} ${formData['defendant-last-name']}`
            });
        }
        
        // Defendant gets notification after release (handled by workflow)
        console.log('Signing notifications sent');
    } catch (error) {
        console.error('Failed to send notifications:', error);
        // Non-fatal - continue workflow
    }
}

/**
 * Upload PDF to temporary storage (Google Drive)
 * Returns public URL for SignNow to fetch
 */
async function uploadPDFToTempStorage(pdfBlob, formData) {
    try {
        // Create filename
        const filename = `Temp_Packet_${formData['defendant-last-name']}_${Date.now()}.pdf`;
        
        // Upload to Google Drive temp folder
        const file = DriveApp.getFolderById(CONFIG.tempFolderId)
            .createFile(pdfBlob)
            .setName(filename)
            .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // Get public URL
        const url = `https://drive.google.com/uc?export=download&id=${file.getId()}`;
        
        console.log(`PDF uploaded to temp storage: ${url}`);
        return url;
    } catch (error) {
        console.error('Failed to upload PDF to temp storage:', error);
        throw error;
    }
}

/**
 * Show status message in UI
 */
function showStatus(message) {
    console.log(`[STATUS] ${message}`);
    // Update UI status indicator
    const statusEl = document.getElementById('generation-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'status-info';
    }
}

/**
 * Show success message in UI
 */
function showSuccess(message) {
    console.log(`[SUCCESS] ${message}`);
    const statusEl = document.getElementById('generation-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'status-success';
    }
    
    // Show success modal
    alert(message);
}

/**
 * Show error message in UI
 */
function showError(message) {
    console.error(`[ERROR] ${message}`);
    const statusEl = document.getElementById('generation-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'status-error';
    }
    
    // Show error modal
    alert(`Error: ${message}`);
}

/**
 * Wix Backend API wrapper
 * These functions call the Wix backend .jsw files
 */
const wixBackend = {
    async uploadAndSendForSigning(pdfUrl, filename, fields, signers, options) {
        // This would be imported from Wix backend
        // import { uploadAndSendForSigning } from 'backend/signNowIntegration';
        // return await uploadAndSendForSigning(pdfUrl, filename, fields, signers, options);
        
        // For Dashboard.html (GAS), we need to call Wix via HTTP
        const response = await UrlFetchApp.fetch('https://www.shamrockbailbonds.biz/_functions/signNowUploadAndSend', {
            method: 'POST',
            contentType: 'application/json',
            payload: JSON.stringify({
                pdfUrl,
                filename,
                fields,
                signers,
                options
            })
        });
        
        return JSON.parse(response.getContentText());
    },
    
    async storePendingDocument(pendingDoc) {
        const response = await UrlFetchApp.fetch('https://www.shamrockbailbonds.biz/_functions/storePendingDocument', {
            method: 'POST',
            contentType: 'application/json',
            payload: JSON.stringify(pendingDoc)
        });
        
        return JSON.parse(response.getContentText());
    },
    
    async sendSigningNotification(notification) {
        const response = await UrlFetchApp.fetch('https://www.shamrockbailbonds.biz/_functions/sendSigningNotification', {
            method: 'POST',
            contentType: 'application/json',
            payload: JSON.stringify(notification)
        });
        
        return JSON.parse(response.getContentText());
    }
};
