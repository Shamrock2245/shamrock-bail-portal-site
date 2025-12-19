// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';

$w.onReady(function () {
    // Initialize the page
    initializePage();
    
    // Geolocation logic to save user location (existing functionality)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            saveUserLocation(latitude, longitude)
                .then((result) => {
                    if (result.success) {
                        console.log(result.message);
                    }
                })
                .catch((error) => {
                    console.error("Error saving location:", error);
                });
        }, (error) => {
            console.error("Geolocation error:", error);
        });
    }
});

/**
 * Initialize the member page
 */
async function initializePage() {
    try {
        // Get current member info
        const member = await currentMember.getMember();
        
        if (member) {
            // Display member name
            const memberName = member.contactDetails?.firstName || 'Member';
            $w('#welcomeText').text = `Welcome, ${memberName}!`;
            
            // Load pending documents for this member
            await loadPendingDocuments(member);
            
            // Set up event handlers
            setupEventHandlers();
        } else {
            // Not logged in - redirect or show message
            $w('#welcomeText').text = 'Please log in to view your documents.';
            $w('#documentsContainer').collapse();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

/**
 * Load pending documents for the current member
 */
async function loadPendingDocuments(member) {
    try {
        const memberEmail = member.loginEmail;
        const memberPhone = member.contactDetails?.phones?.[0] || '';
        
        // Query PendingDocuments collection for this member
        const results = await wixData.query('PendingDocuments')
            .eq('memberEmail', memberEmail)
            .or(
                wixData.query('PendingDocuments')
                    .eq('memberPhone', memberPhone)
            )
            .eq('status', 'pending')
            .descending('_createdDate')
            .find();
        
        if (results.items.length > 0) {
            // Show documents section
            $w('#documentsContainer').expand();
            $w('#noDocumentsMessage').collapse();
            
            // Populate the repeater with documents
            $w('#documentsRepeater').data = results.items;
            
            // Set up repeater item rendering
            $w('#documentsRepeater').onItemReady(($item, itemData, index) => {
                renderDocumentItem($item, itemData);
            });
        } else {
            // No pending documents
            $w('#documentsContainer').collapse();
            $w('#noDocumentsMessage').expand();
            $w('#noDocumentsMessage').text = 'You have no pending documents to sign.';
        }
        
        // Also load signed documents for history
        await loadSignedDocuments(memberEmail, memberPhone);
        
    } catch (error) {
        console.error('Error loading pending documents:', error);
        $w('#errorMessage').text = 'Error loading documents. Please refresh the page.';
        $w('#errorMessage').expand();
    }
}

/**
 * Render a single document item in the repeater
 */
function renderDocumentItem($item, itemData) {
    // Document name
    $item('#documentName').text = itemData.documentName || 'Bail Bond Document';
    
    // Defendant name
    $item('#defendantName').text = `Defendant: ${itemData.defendantName || 'N/A'}`;
    
    // Case number
    $item('#caseNumber').text = `Case #: ${itemData.caseNumber || 'N/A'}`;
    
    // Role badge
    const roleText = itemData.signerRole === 'defendant' ? 'Defendant' : 
                     itemData.signerRole === 'indemnitor' ? 'Indemnitor' : 
                     itemData.signerRole || 'Signer';
    $item('#roleBadge').text = roleText;
    
    // Status indicator
    $item('#statusIndicator').text = itemData.status === 'pending' ? '⏳ Pending Signature' : 
                                      itemData.status === 'signed' ? '✅ Signed' : 
                                      itemData.status;
    
    // Created date
    const createdDate = new Date(itemData._createdDate);
    $item('#createdDate').text = `Sent: ${createdDate.toLocaleDateString()}`;
    
    // Expiration warning
    if (itemData.expiresAt) {
        const expiresAt = new Date(itemData.expiresAt);
        const now = new Date();
        const hoursRemaining = (expiresAt - now) / (1000 * 60 * 60);
        
        if (hoursRemaining < 24 && hoursRemaining > 0) {
            $item('#expirationWarning').text = `⚠️ Expires in ${Math.round(hoursRemaining)} hours`;
            $item('#expirationWarning').expand();
        } else if (hoursRemaining <= 0) {
            $item('#expirationWarning').text = '❌ Expired';
            $item('#expirationWarning').expand();
            $item('#signButton').disable();
        } else {
            $item('#expirationWarning').collapse();
        }
    }
    
    // Sign button click handler
    $item('#signButton').onClick(() => {
        openSigningOverlay(itemData.signingLink, itemData._id);
    });
}

/**
 * Load signed documents for history display
 */
async function loadSignedDocuments(memberEmail, memberPhone) {
    try {
        const results = await wixData.query('PendingDocuments')
            .eq('memberEmail', memberEmail)
            .or(
                wixData.query('PendingDocuments')
                    .eq('memberPhone', memberPhone)
            )
            .eq('status', 'signed')
            .descending('signedAt')
            .limit(10)
            .find();
        
        if (results.items.length > 0) {
            $w('#signedDocumentsContainer').expand();
            $w('#signedDocumentsRepeater').data = results.items;
            
            $w('#signedDocumentsRepeater').onItemReady(($item, itemData, index) => {
                $item('#signedDocName').text = itemData.documentName || 'Document';
                $item('#signedDate').text = `Signed: ${new Date(itemData.signedAt).toLocaleDateString()}`;
                $item('#signedDefendant').text = itemData.defendantName || '';
            });
        } else {
            $w('#signedDocumentsContainer').collapse();
        }
    } catch (error) {
        console.error('Error loading signed documents:', error);
    }
}

/**
 * Open the SignNow signing overlay
 */
function openSigningOverlay(signingLink, documentId) {
    // Use the global ShamrockSignNow object from the custom embed
    if (window.ShamrockSignNow && signingLink) {
        // Store the document ID for status update after signing
        sessionStorage.setItem('currentSigningDocId', documentId);
        
        // Open the signing overlay
        window.ShamrockSignNow.openSigningLink(signingLink);
    } else {
        // Fallback: open in new tab
        window.open(signingLink, '_blank');
    }
}

/**
 * Set up event handlers for the page
 */
function setupEventHandlers() {
    // Refresh button
    if ($w('#refreshButton')) {
        $w('#refreshButton').onClick(async () => {
            $w('#refreshButton').disable();
            $w('#refreshButton').label = 'Refreshing...';
            
            const member = await currentMember.getMember();
            await loadPendingDocuments(member);
            
            $w('#refreshButton').enable();
            $w('#refreshButton').label = 'Refresh';
        });
    }
    
    // Listen for signing completion messages
    window.addEventListener('message', async (event) => {
        const allowedOrigins = [
            'https://app.signnow.com',
            'https://signnow.com',
            'https://app-eval.signnow.com'
        ];
        
        if (allowedOrigins.some(origin => event.origin.startsWith(origin))) {
            const data = event.data;
            
            if (data.event === 'signing_complete' || data.type === 'document_signed') {
                // Update the document status in the database
                const docId = sessionStorage.getItem('currentSigningDocId');
                if (docId) {
                    await updateDocumentStatus(docId, 'signed');
                    sessionStorage.removeItem('currentSigningDocId');
                    
                    // Refresh the documents list
                    const member = await currentMember.getMember();
                    await loadPendingDocuments(member);
                }
            }
        }
    });
}

/**
 * Update document status after signing
 */
async function updateDocumentStatus(documentId, status) {
    try {
        const item = await wixData.get('PendingDocuments', documentId);
        if (item) {
            item.status = status;
            item.signedAt = new Date();
            await wixData.update('PendingDocuments', item);
            console.log('Document status updated to:', status);
        }
    } catch (error) {
        console.error('Error updating document status:', error);
    }
}

/**
 * Upload ID photo with metadata (for post-signing requirement)
 */
export async function uploadIdPhoto(fileData, metadata) {
    try {
        // This function will be called from the ID upload component
        const uploadData = {
            file: fileData,
            metadata: {
                ...metadata,
                uploadedAt: new Date().toISOString(),
                userAgent: navigator.userAgent
            }
        };
        
        // Get GPS coordinates if available
        if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000
                });
            });
            
            uploadData.metadata.gps = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
        }
        
        // Call backend to save to Google Drive
        // This will be implemented in the backend module
        const result = await saveIdToGoogleDrive(uploadData);
        return result;
        
    } catch (error) {
        console.error('Error uploading ID photo:', error);
        throw error;
    }
}

// Placeholder for backend function import
async function saveIdToGoogleDrive(uploadData) {
    // This will call the backend API to save to Google Drive
    // Implementation in backend/googleDrive.jsw
    console.log('Saving ID to Google Drive:', uploadData);
    return { success: true };
}
