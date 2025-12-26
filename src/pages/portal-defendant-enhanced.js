/**
 * Enhanced Defendant Portal Page
 * 
 * This page provides defendants with:
 * - Dashboard overview of their case status
 * - "Start Bail Paperwork" button that triggers SignNow handoff
 * - Document upload functionality (ID, supporting documents)
 * - Check-in functionality (GPS + selfie)
 * - Payment options
 * 
 * URL: /portal-defendant
 * 
 * Required Element IDs:
 * - #welcomeText - Welcome message with defendant name
 * - #caseStatusText - Current case status
 * - #startPaperworkButton - Primary CTA to start SignNow process
 * - #uploadIdButton - Button to upload government ID
 * - #uploadDocumentsButton - Button to upload supporting documents
 * - #checkInButton - Button to perform check-in
 * - #viewPaymentButton - Button to view payment options
 * - #documentsRepeater - Repeater showing uploaded documents
 * - #checkInHistoryRepeater - Repeater showing check-in history
 * - #loadingSpinner - Loading indicator
 * - #successMessage - Success message text
 * - #errorMessage - Error message text
 * - #documentUploadBox - File upload box for documents
 * - #idUploadBox - File upload box for ID
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixAnimations from 'wix-animations';
import { getUserRole, ROLES, getPersonId } from 'backend/portal-auth';
import { initiateSignNowHandoff } from 'backend/signNowIntegration';
import { uploadDocument } from 'backend/documentUpload';

let currentUser;
let currentPersonId;
let currentCaseId;

$w.onReady(async function () {
    // Initialize portal
    await initDefendantPortal();
});

/**
 * Initialize the defendant portal
 */
async function initDefendantPortal() {
    showLoading();
    
    try {
        // 1. Check authentication
        currentUser = wixUsers.currentUser;
        if (!currentUser.loggedIn) {
            wixLocation.to('/portal-landing');
            return;
        }
        
        // 2. Verify user role
        const role = await getUserRole();
        if (role !== ROLES.DEFENDANT) {
            // Redirect to appropriate portal based on role
            if (role === ROLES.INDEMNITOR || role === ROLES.COINDEMNITOR) {
                wixLocation.to('/portal-indemnitor');
            } else if (role === ROLES.STAFF || role === ROLES.ADMIN) {
                wixLocation.to('/portal-staff');
            } else {
                wixLocation.to('/portal-landing');
            }
            return;
        }
        
        // 3. Get person ID and case information
        currentPersonId = await getPersonId();
        await loadCaseInformation();
        
        // 4. Load dashboard data
        await loadDashboardData();
        
        // 5. Wire up interactive elements
        wireInteractiveElements();
        
        hideLoading();
        animatePageEntrance();
        
    } catch (error) {
        console.error('Error initializing defendant portal:', error);
        showError('Unable to load portal. Please refresh the page or contact support.');
    }
}

/**
 * Load case information for the defendant
 */
async function loadCaseInformation() {
    try {
        // Query the Cases collection to find active case for this defendant
        const results = await wixData.query('Import2')
            .eq('defendantPersonId', currentPersonId)
            .eq('status', 'active')
            .descending('_createdDate')
            .find();
        
        if (results.items.length > 0) {
            currentCaseId = results.items[0]._id;
            
            // Update case status display
            safeSetText('#caseStatusText', `Case Status: ${results.items[0].status || 'Active'}`);
        } else {
            // No active case found - show message
            safeSetText('#caseStatusText', 'No active case found. Please contact us for assistance.');
        }
        
    } catch (error) {
        console.error('Error loading case information:', error);
    }
}

/**
 * Load dashboard data (documents, check-ins, etc.)
 */
async function loadDashboardData() {
    try {
        // Get user email for welcome message
        const email = await currentUser.getEmail();
        safeSetText('#welcomeText', `Welcome, ${email.split('@')[0]}`);
        
        // Load uploaded documents
        await loadUploadedDocuments();
        
        // Load check-in history
        await loadCheckInHistory();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Load uploaded documents for the defendant
 */
async function loadUploadedDocuments() {
    try {
        if (!$w('#documentsRepeater')) {
            return;
        }
        
        const results = await wixData.query('Import3')
            .eq('personId', currentPersonId)
            .descending('_createdDate')
            .find();
        
        if (results.items.length > 0) {
            $w('#documentsRepeater').data = results.items;
            
            $w('#documentsRepeater').onItemReady(($item, itemData) => {
                $item('#documentName').text = itemData.documentName || 'Document';
                $item('#documentDate').text = formatDate(itemData._createdDate);
                $item('#documentStatus').text = itemData.status || 'Uploaded';
                
                // Add view button functionality
                if ($item('#viewDocumentButton')) {
                    $item('#viewDocumentButton').onClick(() => {
                        if (itemData.documentUrl) {
                            wixLocation.to(itemData.documentUrl);
                        }
                    });
                }
            });
        } else {
            // Show empty state
            safeSetText('#noDocumentsText', 'No documents uploaded yet');
        }
        
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

/**
 * Load check-in history for the defendant
 */
async function loadCheckInHistory() {
    try {
        if (!$w('#checkInHistoryRepeater')) {
            return;
        }
        
        const results = await wixData.query('Import4')
            .eq('personId', currentPersonId)
            .descending('checkInDate')
            .limit(10)
            .find();
        
        if (results.items.length > 0) {
            $w('#checkInHistoryRepeater').data = results.items;
            
            $w('#checkInHistoryRepeater').onItemReady(($item, itemData) => {
                $item('#checkInDate').text = formatDateTime(itemData.checkInDate);
                $item('#checkInLocation').text = itemData.location || 'Location captured';
                $item('#checkInStatus').text = itemData.verified ? '✓ Verified' : 'Pending';
            });
        }
        
    } catch (error) {
        console.error('Error loading check-in history:', error);
    }
}

/**
 * Wire up all interactive elements
 */
function wireInteractiveElements() {
    // Start Paperwork Button - Primary CTA
    wireStartPaperworkButton();
    
    // Upload ID Button
    wireUploadIdButton();
    
    // Upload Documents Button
    wireUploadDocumentsButton();
    
    // Check-in Button
    wireCheckInButton();
    
    // View Payment Button
    wireViewPaymentButton();
}

/**
 * Wire the "Start Bail Paperwork" button to trigger SignNow handoff
 */
function wireStartPaperworkButton() {
    try {
        const button = $w('#startPaperworkButton');
        if (!button) return;
        
        button.onClick(async () => {
            // Disable button to prevent double-clicks
            button.disable();
            showLoading();
            
            try {
                // Get user email
                const email = await currentUser.getEmail();
                
                // Prepare client data for SignNow
                const clientData = {
                    email: email,
                    personId: currentPersonId,
                    caseId: currentCaseId,
                    role: 'defendant'
                };
                
                // Call backend to initiate SignNow handoff
                const result = await initiateSignNowHandoff(clientData);
                
                if (result.success && result.redirectUrl) {
                    // Log the event
                    await logBailStartEvent();
                    
                    // Show success message briefly
                    showSuccess('Redirecting to paperwork...');
                    
                    // Redirect to SignNow
                    setTimeout(() => {
                        wixLocation.to(result.redirectUrl);
                    }, 1000);
                } else {
                    throw new Error(result.error || 'Failed to start paperwork');
                }
                
            } catch (error) {
                console.error('Error starting paperwork:', error);
                showError('Unable to start paperwork. Please call us at (239) 332-2245 for assistance.');
                button.enable();
            } finally {
                hideLoading();
            }
        });
        
        // Add hover animation
        button.onMouseIn(() => {
            wixAnimations.timeline()
                .add(button, { scale: 1.05, duration: 200, easing: 'easeOutQuad' })
                .play();
        });
        
        button.onMouseOut(() => {
            wixAnimations.timeline()
                .add(button, { scale: 1.0, duration: 200, easing: 'easeInQuad' })
                .play();
        });
        
    } catch (error) {
        console.warn('Error wiring start paperwork button:', error);
    }
}

/**
 * Wire the upload ID button
 */
function wireUploadIdButton() {
    try {
        const button = $w('#uploadIdButton');
        const uploadBox = $w('#idUploadBox');
        
        if (!button || !uploadBox) return;
        
        button.onClick(() => {
            uploadBox.startUpload();
        });
        
        uploadBox.onChange(async () => {
            if (uploadBox.value.length > 0) {
                showLoading();
                
                try {
                    const uploadedFile = uploadBox.value[0];
                    
                    // Upload to backend
                    const result = await uploadDocument({
                        personId: currentPersonId,
                        documentType: 'government_id',
                        fileName: uploadedFile.name,
                        fileUrl: uploadedFile.url
                    });
                    
                    if (result.success) {
                        showSuccess('ID uploaded successfully!');
                        await loadUploadedDocuments(); // Refresh document list
                    } else {
                        throw new Error(result.error);
                    }
                    
                } catch (error) {
                    console.error('Error uploading ID:', error);
                    showError('Failed to upload ID. Please try again.');
                } finally {
                    hideLoading();
                }
            }
        });
        
    } catch (error) {
        console.warn('Error wiring upload ID button:', error);
    }
}

/**
 * Wire the upload documents button
 */
function wireUploadDocumentsButton() {
    try {
        const button = $w('#uploadDocumentsButton');
        const uploadBox = $w('#documentUploadBox');
        
        if (!button || !uploadBox) return;
        
        button.onClick(() => {
            uploadBox.startUpload();
        });
        
        uploadBox.onChange(async () => {
            if (uploadBox.value.length > 0) {
                showLoading();
                
                try {
                    const uploadedFile = uploadBox.value[0];
                    
                    // Upload to backend
                    const result = await uploadDocument({
                        personId: currentPersonId,
                        documentType: 'supporting_document',
                        fileName: uploadedFile.name,
                        fileUrl: uploadedFile.url
                    });
                    
                    if (result.success) {
                        showSuccess('Document uploaded successfully!');
                        await loadUploadedDocuments(); // Refresh document list
                    } else {
                        throw new Error(result.error);
                    }
                    
                } catch (error) {
                    console.error('Error uploading document:', error);
                    showError('Failed to upload document. Please try again.');
                } finally {
                    hideLoading();
                }
            }
        });
        
    } catch (error) {
        console.warn('Error wiring upload documents button:', error);
    }
}

/**
 * Wire the check-in button
 */
function wireCheckInButton() {
    try {
        const button = $w('#checkInButton');
        if (!button) return;
        
        button.onClick(async () => {
            button.disable();
            showLoading();
            
            try {
                // Get current location
                const position = await getCurrentPosition();
                
                // TODO: Implement selfie capture
                // For now, we'll just record the GPS location
                
                // Save check-in to database
                await wixData.insert('Import4', {
                    personId: currentPersonId,
                    caseId: currentCaseId,
                    checkInDate: new Date(),
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    location: 'GPS captured',
                    verified: false
                });
                
                showSuccess('Check-in completed successfully!');
                await loadCheckInHistory(); // Refresh check-in list
                
            } catch (error) {
                console.error('Error performing check-in:', error);
                showError('Failed to complete check-in. Please ensure location services are enabled.');
            } finally {
                hideLoading();
                button.enable();
            }
        });
        
    } catch (error) {
        console.warn('Error wiring check-in button:', error);
    }
}

/**
 * Wire the view payment button
 */
function wireViewPaymentButton() {
    try {
        const button = $w('#viewPaymentButton');
        if (!button) return;
        
        button.onClick(() => {
            // Navigate to payment page (to be implemented)
            wixLocation.to('/portal/payment');
        });
        
    } catch (error) {
        console.warn('Error wiring view payment button:', error);
    }
}

/**
 * Log bail start event for analytics
 */
async function logBailStartEvent() {
    try {
        await wixData.insert('Import6', {
            personId: currentPersonId,
            caseId: currentCaseId,
            timestamp: new Date(),
            source: 'defendant_portal',
            status: 'initiated'
        });
    } catch (error) {
        console.error('Error logging bail start event:', error);
    }
}

/**
 * Get current GPS position
 */
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Animate page entrance
 */
function animatePageEntrance() {
    const elements = ['#welcomeText', '#caseStatusText', '#startPaperworkButton'];
    
    elements.forEach((selector, index) => {
        try {
            const element = $w(selector);
            if (element && typeof element.show === 'function') {
                wixAnimations.timeline()
                    .add(element, { opacity: 0, y: 20, duration: 0 })
                    .add(element, {
                        opacity: 1,
                        y: 0,
                        duration: 800,
                        delay: index * 150,
                        easing: 'easeOutCubic'
                    })
                    .play();
            }
        } catch (error) {
            // Silently skip
        }
    });
}

/**
 * UI Helper Functions
 */
function showLoading() {
    try {
        if ($w('#loadingSpinner')) {
            $w('#loadingSpinner').show();
        }
    } catch (error) {
        console.warn('Loading spinner not found');
    }
}

function hideLoading() {
    try {
        if ($w('#loadingSpinner')) {
            $w('#loadingSpinner').hide();
        }
    } catch (error) {
        console.warn('Loading spinner not found');
    }
}

function showSuccess(message) {
    try {
        if ($w('#successMessage')) {
            $w('#successMessage').text = message;
            $w('#successMessage').show();
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                $w('#successMessage').hide();
            }, 5000);
        }
    } catch (error) {
        console.warn('Success message element not found');
    }
}

function showError(message) {
    try {
        if ($w('#errorMessage')) {
            $w('#errorMessage').text = message;
            $w('#errorMessage').show();
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                $w('#errorMessage').hide();
            }, 10000);
        }
    } catch (error) {
        console.warn('Error message element not found');
    }
}

function safeSetText(selector, text) {
    try {
        const element = $w(selector);
        if (element && text) {
            element.text = text;
        }
    } catch (error) {
        console.warn(`Element ${selector} not found`);
    }
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}
