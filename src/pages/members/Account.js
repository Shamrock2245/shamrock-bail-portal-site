/**
 * Shamrock Bail Bonds - Member Account Page
 * 
 * Member profile and account management page.
 * Includes document upload functionality for ID and required documents.
 * 
 * URL: /members/account
 * 
 * Page Elements (Wix Editor IDs):
 * - #profileSection: Member profile information
 * - #documentsSection: Document upload and management
 * - #idUpload: Government ID upload
 * - #documentsList: List of uploaded documents
 * - #casesSection: Active/past cases (if any)
 * - #settingsSection: Account settings
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members-frontend';
import wixData from 'wix-data';
import { mediaManager } from 'wix-media-backend';

let memberData = null;
let uploadedDocuments = [];

$w.onReady(async function () {
    await initializePage();
});

/**
 * Initialize the page
 */
async function initializePage() {
    // Check login
    const isLoggedIn = await checkMemberLogin();
    
    if (!isLoggedIn) {
        wixLocation.to('/members/login?returnUrl=/members/account');
        return;
    }
    
    // Load member data
    memberData = await loadMemberData();
    
    // Display member profile
    displayProfile();
    
    // Load uploaded documents
    await loadDocuments();
    
    // Set up event listeners
    setupEventListeners();
    
    // Track page view
    trackEvent('PageView', { page: 'MemberAccount' });
}

/**
 * Check if member is logged in
 */
async function checkMemberLogin() {
    try {
        const member = await currentMember.getMember();
        return !!member;
    } catch (error) {
        return false;
    }
}

/**
 * Load member data
 */
async function loadMemberData() {
    try {
        const member = await currentMember.getMember({
            fieldsets: ['FULL']
        });
        
        // Also load extended profile from custom collection
        let extendedProfile = {};
        try {
            const results = await wixData.query('MemberProfiles')
                .eq('memberId', member._id)
                .find();
            
            if (results.items.length > 0) {
                extendedProfile = results.items[0];
            }
        } catch (e) {
            console.log('No extended profile found');
        }
        
        return {
            id: member._id,
            email: member.loginEmail,
            firstName: member.contactDetails?.firstName || '',
            lastName: member.contactDetails?.lastName || '',
            phone: member.contactDetails?.phones?.[0] || '',
            profileImage: member.profile?.photo?.url || '',
            createdDate: member._createdDate,
            ...extendedProfile
        };
    } catch (error) {
        console.error('Error loading member data:', error);
        return null;
    }
}

/**
 * Display member profile
 */
function displayProfile() {
    if (!memberData) return;
    
    // Profile header
    $w('#memberName').text = `${memberData.firstName} ${memberData.lastName}`.trim() || 'Member';
    $w('#memberEmail').text = memberData.email;
    
    // Profile image
    if (memberData.profileImage) {
        $w('#profileImage').src = memberData.profileImage;
    }
    
    // Profile form fields
    $w('#firstNameInput').value = memberData.firstName;
    $w('#lastNameInput').value = memberData.lastName;
    $w('#emailDisplay').text = memberData.email;
    $w('#phoneInput').value = memberData.phone;
    
    // Address fields (if available)
    if (memberData.address) {
        $w('#addressInput').value = memberData.address;
    }
    if (memberData.city) {
        $w('#cityInput').value = memberData.city;
    }
    if (memberData.state) {
        $w('#stateInput').value = memberData.state;
    }
    if (memberData.zipCode) {
        $w('#zipInput').value = memberData.zipCode;
    }
    
    // Member since date
    if (memberData.createdDate) {
        const memberSince = new Date(memberData.createdDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
        $w('#memberSince').text = `Member since ${memberSince}`;
    }
    
    // Document verification status
    updateVerificationStatus();
}

/**
 * Update document verification status
 */
function updateVerificationStatus() {
    const hasIdUploaded = uploadedDocuments.some(doc => doc.type === 'government_id');
    
    if (hasIdUploaded) {
        $w('#verificationStatus').text = 'ID Verified ✓';
        $w('#verificationStatus').style.color = '#00B894';
        $w('#idUploadSection').collapse();
        $w('#idUploadedSection').expand();
    } else {
        $w('#verificationStatus').text = 'ID Required';
        $w('#verificationStatus').style.color = '#E74C3C';
        $w('#idUploadSection').expand();
        $w('#idUploadedSection').collapse();
    }
}

/**
 * Load uploaded documents
 */
async function loadDocuments() {
    try {
        const results = await wixData.query('MemberDocuments')
            .eq('memberId', memberData.id)
            .descending('_createdDate')
            .find();
        
        uploadedDocuments = results.items;
        displayDocuments();
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

/**
 * Display uploaded documents
 */
function displayDocuments() {
    if ($w('#documentsRepeater').valid) {
        if (uploadedDocuments.length > 0) {
            $w('#documentsRepeater').data = uploadedDocuments;
            $w('#documentsRepeater').onItemReady(($item, itemData) => {
                $item('#docName').text = itemData.fileName || 'Document';
                $item('#docType').text = formatDocumentType(itemData.type);
                $item('#docDate').text = new Date(itemData._createdDate).toLocaleDateString();
                $item('#docStatus').text = itemData.verified ? 'Verified' : 'Pending Review';
                
                // Delete button
                $item('#deleteDocBtn').onClick(async () => {
                    await deleteDocument(itemData._id);
                });
            });
            $w('#noDocumentsMessage').hide();
        } else {
            $w('#documentsRepeater').data = [];
            $w('#noDocumentsMessage').show();
        }
    }
    
    updateVerificationStatus();
}

/**
 * Format document type for display
 */
function formatDocumentType(type) {
    const types = {
        'government_id': 'Government ID',
        'drivers_license': "Driver's License",
        'passport': 'Passport',
        'proof_of_address': 'Proof of Address',
        'other': 'Other Document'
    };
    return types[type] || type;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Profile update
    $w('#saveProfileBtn').onClick(async () => {
        await saveProfile();
    });
    
    // ID Upload
    $w('#idUploadBtn').onClick(() => {
        $w('#idFileInput').click();
    });
    
    $w('#idFileInput').onChange(async (event) => {
        const files = event.target.value;
        if (files && files.length > 0) {
            await uploadDocument(files[0], 'government_id');
        }
    });
    
    // Additional document upload
    $w('#addDocumentBtn').onClick(() => {
        wixWindow.openLightbox('DocumentUpload', { memberId: memberData.id })
            .then((result) => {
                if (result?.uploaded) {
                    loadDocuments();
                }
            });
    });
    
    // Change password
    $w('#changePasswordBtn').onClick(() => {
        wixWindow.openLightbox('ChangePassword');
    });
    
    // Logout
    $w('#logoutBtn').onClick(async () => {
        await logout();
    });
    
    // Start bail (quick action)
    $w('#startBailBtn').onClick(() => {
        wixLocation.to('/members/start-bail');
    });
    
    // Contact support
    $w('#supportBtn').onClick(() => {
        wixLocation.to('tel:+12393322245');
    });
}

/**
 * Save profile updates
 */
async function saveProfile() {
    try {
        $w('#saveProfileBtn').disable();
        $w('#saveProfileBtn').label = 'Saving...';
        
        // Update member contact details
        await currentMember.setProfile({
            firstName: $w('#firstNameInput').value,
            lastName: $w('#lastNameInput').value,
            phones: [$w('#phoneInput').value]
        });
        
        // Update extended profile in custom collection
        const extendedData = {
            memberId: memberData.id,
            address: $w('#addressInput').value,
            city: $w('#cityInput').value,
            state: $w('#stateInput').value,
            zipCode: $w('#zipInput').value,
            updatedDate: new Date()
        };
        
        // Check if profile exists
        const existing = await wixData.query('MemberProfiles')
            .eq('memberId', memberData.id)
            .find();
        
        if (existing.items.length > 0) {
            await wixData.update('MemberProfiles', {
                ...existing.items[0],
                ...extendedData
            });
        } else {
            await wixData.insert('MemberProfiles', extendedData);
        }
        
        // Show success message
        $w('#successMessage').text = 'Profile updated successfully!';
        $w('#successMessage').show();
        setTimeout(() => $w('#successMessage').hide(), 3000);
        
        trackEvent('Profile_Update', { memberId: memberData.id });
        
    } catch (error) {
        console.error('Error saving profile:', error);
        $w('#errorMessage').text = 'Error saving profile. Please try again.';
        $w('#errorMessage').show();
    } finally {
        $w('#saveProfileBtn').enable();
        $w('#saveProfileBtn').label = 'Save Changes';
    }
}

/**
 * Upload a document
 */
async function uploadDocument(file, documentType) {
    try {
        $w('#uploadProgress').show();
        $w('#uploadProgress').value = 0;
        
        // Upload to Wix Media
        const uploadResult = await new Promise((resolve, reject) => {
            $w('#idFileInput').uploadFiles()
                .then((uploadedFiles) => {
                    resolve(uploadedFiles[0]);
                })
                .catch(reject);
        });
        
        // Save document record
        const documentRecord = {
            memberId: memberData.id,
            type: documentType,
            fileName: file.name,
            fileUrl: uploadResult.fileUrl,
            fileType: file.type,
            fileSize: file.size,
            verified: false,
            uploadDate: new Date()
        };
        
        await wixData.insert('MemberDocuments', documentRecord);
        
        // Refresh documents list
        await loadDocuments();
        
        // Show success
        $w('#uploadSuccess').text = 'Document uploaded successfully!';
        $w('#uploadSuccess').show();
        setTimeout(() => $w('#uploadSuccess').hide(), 3000);
        
        trackEvent('Document_Upload', { 
            type: documentType,
            memberId: memberData.id 
        });
        
    } catch (error) {
        console.error('Error uploading document:', error);
        $w('#uploadError').text = 'Error uploading document. Please try again.';
        $w('#uploadError').show();
    } finally {
        $w('#uploadProgress').hide();
    }
}

/**
 * Delete a document
 */
async function deleteDocument(documentId) {
    try {
        const confirmed = await wixWindow.openLightbox('ConfirmDelete', {
            message: 'Are you sure you want to delete this document?'
        });
        
        if (confirmed) {
            await wixData.remove('MemberDocuments', documentId);
            await loadDocuments();
            
            trackEvent('Document_Delete', { 
                documentId,
                memberId: memberData.id 
            });
        }
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}

/**
 * Logout
 */
async function logout() {
    try {
        import('wix-members-frontend').then(async (members) => {
            await members.authentication.logout();
            wixLocation.to('/');
        });
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

export { initializePage, loadDocuments, uploadDocument };
