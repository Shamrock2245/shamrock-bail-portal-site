// ID and Document Upload Module for Custom Member Page
// This module handles ID photo uploads and additional document uploads
// Import this into Custom Member Page.fz49n.js

import wixData from 'wix-data';
import { currentMember } from 'wix-members';
import { uploadIdDocument, uploadSupportingDocument } from 'backend/documentUpload';

/**
 * Initialize the ID upload section
 * Call this from the main page onReady function
 */
export async function initializeIdUpload() {
    try {
        const member = await currentMember.getMember();
        
        if (!member) {
            $w('#idUploadSection').collapse();
            return;
        }
        
        // Check if ID is already uploaded
        const idStatus = await checkIdUploadStatus(member.loginEmail);
        
        if (idStatus.hasId) {
            // ID already uploaded - show status
            $w('#idUploadStatus').text = '✅ ID Uploaded';
            $w('#idUploadStatus').expand();
            $w('#idUploadForm').collapse();
            $w('#reuploadIdButton').expand();
        } else {
            // ID not uploaded - show upload form
            $w('#idUploadStatus').text = '⚠️ ID Required';
            $w('#idUploadStatus').expand();
            $w('#idUploadForm').expand();
            $w('#reuploadIdButton').collapse();
        }
        
        // Set up upload button handlers
        setupIdUploadHandlers();
        
        // Load any additional required documents
        await loadRequiredDocuments(member.loginEmail);
        
    } catch (error) {
        console.error('Error initializing ID upload:', error);
    }
}

/**
 * Check if the member has already uploaded their ID
 */
async function checkIdUploadStatus(memberEmail) {
    try {
        const results = await wixData.query('MemberDocuments')
            .eq('memberEmail', memberEmail)
            .eq('documentType', 'government_id')
            .eq('status', 'verified')
            .find();
        
        return {
            hasId: results.items.length > 0,
            document: results.items.length > 0 ? results.items[0] : null
        };
    } catch (error) {
        console.error('Error checking ID status:', error);
        return { hasId: false, document: null };
    }
}

/**
 * Set up event handlers for ID upload
 */
function setupIdUploadHandlers() {
    // Front of ID upload button
    $w('#idFrontUpload').onChange(async (event) => {
        const files = event.target.value;
        if (files && files.length > 0) {
            $w('#idFrontPreview').src = files[0].url;
            $w('#idFrontPreview').expand();
            $w('#idFrontFileName').text = files[0].name;
        }
    });
    
    // Back of ID upload button
    $w('#idBackUpload').onChange(async (event) => {
        const files = event.target.value;
        if (files && files.length > 0) {
            $w('#idBackPreview').src = files[0].url;
            $w('#idBackPreview').expand();
            $w('#idBackFileName').text = files[0].name;
        }
    });
    
    // Submit ID button
    $w('#submitIdButton').onClick(async () => {
        await handleIdSubmit();
    });
    
    // Re-upload ID button
    $w('#reuploadIdButton').onClick(() => {
        $w('#idUploadForm').expand();
        $w('#reuploadIdButton').collapse();
    });
}

/**
 * Handle ID submission with GPS metadata
 */
async function handleIdSubmit() {
    try {
        $w('#submitIdButton').disable();
        $w('#submitIdButton').label = 'Uploading...';
        $w('#idUploadError').collapse();
        
        // Get the uploaded files
        const frontFiles = $w('#idFrontUpload').value;
        const backFiles = $w('#idBackUpload').value;
        
        if (!frontFiles || frontFiles.length === 0) {
            showIdUploadError('Please upload the front of your ID');
            return;
        }
        
        // Get GPS coordinates
        let gpsData = null;
        try {
            gpsData = await getGPSCoordinates();
        } catch (gpsError) {
            console.log('GPS not available:', gpsError);
        }
        
        // Get member info
        const member = await currentMember.getMember();
        
        // Prepare metadata
        const metadata = {
            memberEmail: member.loginEmail,
            memberName: `${member.contactDetails?.firstName || ''} ${member.contactDetails?.lastName || ''}`.trim(),
            memberPhone: member.contactDetails?.phones?.[0] || '',
            uploadedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
            gps: gpsData,
            ipAddress: await getClientIP()
        };
        
        // Upload front of ID
        const frontResult = await uploadIdDocument({
            file: frontFiles[0],
            side: 'front',
            metadata: metadata
        });
        
        if (!frontResult.success) {
            showIdUploadError('Failed to upload front of ID: ' + frontResult.message);
            return;
        }
        
        // Upload back of ID if provided
        if (backFiles && backFiles.length > 0) {
            const backResult = await uploadIdDocument({
                file: backFiles[0],
                side: 'back',
                metadata: metadata
            });
            
            if (!backResult.success) {
                showIdUploadError('Failed to upload back of ID: ' + backResult.message);
                return;
            }
        }
        
        // Success!
        $w('#idUploadStatus').text = '✅ ID Uploaded Successfully';
        $w('#idUploadForm').collapse();
        $w('#reuploadIdButton').expand();
        
        // Show success message
        $w('#idUploadSuccess').text = 'Your ID has been uploaded and saved securely.';
        $w('#idUploadSuccess').expand();
        
        // Refresh the page after 2 seconds
        setTimeout(() => {
            $w('#idUploadSuccess').collapse();
        }, 5000);
        
    } catch (error) {
        console.error('Error submitting ID:', error);
        showIdUploadError('An error occurred. Please try again.');
    } finally {
        $w('#submitIdButton').enable();
        $w('#submitIdButton').label = 'Submit ID';
    }
}

/**
 * Show ID upload error message
 */
function showIdUploadError(message) {
    $w('#idUploadError').text = message;
    $w('#idUploadError').expand();
    $w('#submitIdButton').enable();
    $w('#submitIdButton').label = 'Submit ID';
}

/**
 * Get GPS coordinates with high accuracy
 */
function getGPSCoordinates() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date(position.timestamp).toISOString()
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Get client IP address (for logging purposes)
 */
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// =============================================================================
// ADDITIONAL DOCUMENT UPLOADS
// =============================================================================

/**
 * Load any additional required documents for the member
 */
async function loadRequiredDocuments(memberEmail) {
    try {
        // Query for pending document requirements
        const results = await wixData.query('RequiredDocuments')
            .eq('memberEmail', memberEmail)
            .eq('status', 'pending')
            .find();
        
        if (results.items.length > 0) {
            $w('#additionalDocsSection').expand();
            $w('#additionalDocsRepeater').data = results.items;
            
            $w('#additionalDocsRepeater').onItemReady(($item, itemData, index) => {
                renderRequiredDocument($item, itemData);
            });
        } else {
            $w('#additionalDocsSection').collapse();
        }
        
        // Also load already uploaded documents
        await loadUploadedDocuments(memberEmail);
        
    } catch (error) {
        console.error('Error loading required documents:', error);
    }
}

/**
 * Render a required document item in the repeater
 */
function renderRequiredDocument($item, itemData) {
    $item('#docName').text = itemData.documentName || 'Required Document';
    $item('#docDescription').text = itemData.description || '';
    $item('#docStatus').text = itemData.status === 'pending' ? '⏳ Pending' : '✅ Uploaded';
    
    // File upload handler
    $item('#docUpload').onChange(async (event) => {
        const files = event.target.value;
        if (files && files.length > 0) {
            await handleDocumentUpload(itemData._id, files[0], $item);
        }
    });
}

/**
 * Handle additional document upload
 */
async function handleDocumentUpload(requirementId, file, $item) {
    try {
        $item('#docUploadButton').disable();
        $item('#docStatus').text = '⏳ Uploading...';
        
        const member = await currentMember.getMember();
        
        // Get GPS coordinates
        let gpsData = null;
        try {
            gpsData = await getGPSCoordinates();
        } catch (gpsError) {
            console.log('GPS not available:', gpsError);
        }
        
        const metadata = {
            memberEmail: member.loginEmail,
            requirementId: requirementId,
            uploadedAt: new Date().toISOString(),
            gps: gpsData
        };
        
        const result = await uploadSupportingDocument({
            file: file,
            requirementId: requirementId,
            metadata: metadata
        });
        
        if (result.success) {
            $item('#docStatus').text = '✅ Uploaded';
            $item('#docUpload').collapse();
        } else {
            $item('#docStatus').text = '❌ Failed: ' + result.message;
            $item('#docUploadButton').enable();
        }
        
    } catch (error) {
        console.error('Error uploading document:', error);
        $item('#docStatus').text = '❌ Error';
        $item('#docUploadButton').enable();
    }
}

/**
 * Load already uploaded documents for display
 */
async function loadUploadedDocuments(memberEmail) {
    try {
        const results = await wixData.query('MemberDocuments')
            .eq('memberEmail', memberEmail)
            .descending('_createdDate')
            .find();
        
        if (results.items.length > 0) {
            $w('#uploadedDocsSection').expand();
            $w('#uploadedDocsRepeater').data = results.items;
            
            $w('#uploadedDocsRepeater').onItemReady(($item, itemData, index) => {
                $item('#uploadedDocName').text = itemData.documentName || 'Document';
                $item('#uploadedDocType').text = formatDocumentType(itemData.documentType);
                $item('#uploadedDocDate').text = `Uploaded: ${new Date(itemData._createdDate).toLocaleDateString()}`;
                $item('#uploadedDocStatus').text = itemData.status === 'verified' ? '✅ Verified' : '⏳ Pending Review';
            });
        } else {
            $w('#uploadedDocsSection').collapse();
        }
        
    } catch (error) {
        console.error('Error loading uploaded documents:', error);
    }
}

/**
 * Format document type for display
 */
function formatDocumentType(type) {
    const types = {
        'government_id': 'Government ID',
        'drivers_license': "Driver's License",
        'passport': 'Passport',
        'utility_bill': 'Utility Bill',
        'proof_of_address': 'Proof of Address',
        'pay_stub': 'Pay Stub',
        'bank_statement': 'Bank Statement',
        'other': 'Other Document'
    };
    return types[type] || type;
}
