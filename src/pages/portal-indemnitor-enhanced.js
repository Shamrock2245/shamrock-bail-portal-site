/**
 * Enhanced Indemnitor Portal Page
 * 
 * This page provides indemnitors (co-signers) with:
 * - Dashboard overview of their obligations
 * - "Start Financial Paperwork" button that triggers SignNow handoff
 * - Document upload functionality (financial statements, collateral docs)
 * - Payment authorization
 * - Case monitoring
 * 
 * URL: /portal-indemnitor
 * 
 * Required Element IDs:
 * - #welcomeText - Welcome message with indemnitor name
 * - #obligationStatusText - Current obligation status
 * - #startFinancialPaperworkButton - Primary CTA to start SignNow process
 * - #uploadFinancialDocsButton - Button to upload financial documents
 * - #uploadCollateralDocsButton - Button to upload collateral documents
 * - #authorizePaymentButton - Button to authorize payment
 * - #viewCaseDetailsButton - Button to view case details
 * - #documentsRepeater - Repeater showing uploaded documents
 * - #obligationsRepeater - Repeater showing financial obligations
 * - #loadingSpinner - Loading indicator
 * - #successMessage - Success message text
 * - #errorMessage - Error message text
 * - #financialDocUploadBox - File upload box for financial documents
 * - #collateralDocUploadBox - File upload box for collateral documents
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
    await initIndemnitorPortal();
});

/**
 * Initialize the indemnitor portal
 */
async function initIndemnitorPortal() {
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
        if (role !== ROLES.INDEMNITOR && role !== ROLES.COINDEMNITOR) {
            // Redirect to appropriate portal based on role
            if (role === ROLES.DEFENDANT) {
                wixLocation.to('/portal-defendant');
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
        console.error('Error initializing indemnitor portal:', error);
        showError('Unable to load portal. Please refresh the page or contact support.');
    }
}

/**
 * Load case information for the indemnitor
 */
async function loadCaseInformation() {
    try {
        // Query the Cases collection to find cases where this person is an indemnitor
        const results = await wixData.query('Cases')
            .eq('indemnitorPersonId', currentPersonId)
            .eq('status', 'active')
            .descending('_createdDate')
            .find();
        
        if (results.items.length > 0) {
            currentCaseId = results.items[0]._id;
            
            // Update obligation status display
            const bondAmount = results.items[0].bondAmount || 'N/A';
            const premium = results.items[0].premium || 'N/A';
            safeSetText('#obligationStatusText', `Bond Amount: $${bondAmount} | Premium: $${premium}`);
        } else {
            // No active case found - show message
            safeSetText('#obligationStatusText', 'No active obligations found. Please contact us for assistance.');
        }
        
    } catch (error) {
        console.error('Error loading case information:', error);
    }
}

/**
 * Load dashboard data (documents, obligations, etc.)
 */
async function loadDashboardData() {
    try {
        // Get user email for welcome message
        const email = await currentUser.getEmail();
        safeSetText('#welcomeText', `Welcome, ${email.split('@')[0]}`);
        
        // Load uploaded documents
        await loadUploadedDocuments();
        
        // Load financial obligations
        await loadFinancialObligations();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Load uploaded documents for the indemnitor
 */
async function loadUploadedDocuments() {
    try {
        if (!$w('#documentsRepeater')) {
            return;
        }
        
        const results = await wixData.query('MemberDocuments')
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
 * Load financial obligations for the indemnitor
 */
async function loadFinancialObligations() {
    try {
        if (!$w('#obligationsRepeater')) {
            return;
        }
        
        const results = await wixData.query('FinancialObligations')
            .eq('indemnitorPersonId', currentPersonId)
            .descending('_createdDate')
            .find();
        
        if (results.items.length > 0) {
            $w('#obligationsRepeater').data = results.items;
            
            $w('#obligationsRepeater').onItemReady(($item, itemData) => {
                $item('#obligationType').text = itemData.type || 'Payment';
                $item('#obligationAmount').text = `$${itemData.amount || '0'}`;
                $item('#obligationDueDate').text = formatDate(itemData.dueDate);
                $item('#obligationStatus').text = itemData.status || 'Pending';
            });
        }
        
    } catch (error) {
        console.error('Error loading obligations:', error);
    }
}

/**
 * Wire up all interactive elements
 */
function wireInteractiveElements() {
    // Start Financial Paperwork Button - Primary CTA
    wireStartFinancialPaperworkButton();
    
    // Upload Financial Documents Button
    wireUploadFinancialDocsButton();
    
    // Upload Collateral Documents Button
    wireUploadCollateralDocsButton();
    
    // Authorize Payment Button
    wireAuthorizePaymentButton();
    
    // View Case Details Button
    wireViewCaseDetailsButton();
}

/**
 * Wire the "Start Financial Paperwork" button to trigger SignNow handoff
 */
function wireStartFinancialPaperworkButton() {
    try {
        const button = $w('#startFinancialPaperworkButton');
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
                    role: 'indemnitor'
                };
                
                // Call backend to initiate SignNow handoff
                const result = await initiateSignNowHandoff(clientData);
                
                if (result.success && result.redirectUrl) {
                    // Log the event
                    await logFinancialPaperworkStartEvent();
                    
                    // Show success message briefly
                    showSuccess('Redirecting to financial paperwork...');
                    
                    // Redirect to SignNow
                    setTimeout(() => {
                        wixLocation.to(result.redirectUrl);
                    }, 1000);
                } else {
                    throw new Error(result.error || 'Failed to start paperwork');
                }
                
            } catch (error) {
                console.error('Error starting financial paperwork:', error);
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
        console.warn('Error wiring start financial paperwork button:', error);
    }
}

/**
 * Wire the upload financial documents button
 */
function wireUploadFinancialDocsButton() {
    try {
        const button = $w('#uploadFinancialDocsButton');
        const uploadBox = $w('#financialDocUploadBox');
        
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
                        documentType: 'financial_statement',
                        fileName: uploadedFile.name,
                        fileUrl: uploadedFile.url
                    });
                    
                    if (result.success) {
                        showSuccess('Financial document uploaded successfully!');
                        await loadUploadedDocuments(); // Refresh document list
                    } else {
                        throw new Error(result.error);
                    }
                    
                } catch (error) {
                    console.error('Error uploading financial document:', error);
                    showError('Failed to upload document. Please try again.');
                } finally {
                    hideLoading();
                }
            }
        });
        
    } catch (error) {
        console.warn('Error wiring upload financial docs button:', error);
    }
}

/**
 * Wire the upload collateral documents button
 */
function wireUploadCollateralDocsButton() {
    try {
        const button = $w('#uploadCollateralDocsButton');
        const uploadBox = $w('#collateralDocUploadBox');
        
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
                        documentType: 'collateral_document',
                        fileName: uploadedFile.name,
                        fileUrl: uploadedFile.url
                    });
                    
                    if (result.success) {
                        showSuccess('Collateral document uploaded successfully!');
                        await loadUploadedDocuments(); // Refresh document list
                    } else {
                        throw new Error(result.error);
                    }
                    
                } catch (error) {
                    console.error('Error uploading collateral document:', error);
                    showError('Failed to upload document. Please try again.');
                } finally {
                    hideLoading();
                }
            }
        });
        
    } catch (error) {
        console.warn('Error wiring upload collateral docs button:', error);
    }
}

/**
 * Wire the authorize payment button
 */
function wireAuthorizePaymentButton() {
    try {
        const button = $w('#authorizePaymentButton');
        if (!button) return;
        
        button.onClick(() => {
            // Navigate to payment authorization page (to be implemented)
            wixLocation.to('/portal/payment-authorization');
        });
        
    } catch (error) {
        console.warn('Error wiring authorize payment button:', error);
    }
}

/**
 * Wire the view case details button
 */
function wireViewCaseDetailsButton() {
    try {
        const button = $w('#viewCaseDetailsButton');
        if (!button) return;
        
        button.onClick(() => {
            // Navigate to case details page
            if (currentCaseId) {
                wixLocation.to(`/portal/case/${currentCaseId}`);
            } else {
                showError('No case information available');
            }
        });
        
    } catch (error) {
        console.warn('Error wiring view case details button:', error);
    }
}

/**
 * Log financial paperwork start event for analytics
 */
async function logFinancialPaperworkStartEvent() {
    try {
        await wixData.insert('BailStartLogs', {
            personId: currentPersonId,
            caseId: currentCaseId,
            timestamp: new Date(),
            source: 'indemnitor_portal',
            status: 'initiated',
            role: 'indemnitor'
        });
    } catch (error) {
        console.error('Error logging financial paperwork start event:', error);
    }
}

/**
 * Animate page entrance
 */
function animatePageEntrance() {
    const elements = ['#welcomeText', '#obligationStatusText', '#startFinancialPaperworkButton'];
    
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
