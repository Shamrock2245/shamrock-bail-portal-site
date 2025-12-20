/**
 * ID Upload Lightbox
 * Filename: lightboxes/IdUploadLightbox.js
 * 
 * Modal for capturing and uploading government-issued ID photos.
 * Supports both front and back of ID with camera capture or file upload.
 * 
 * Lightbox Elements:
 * - #uploadTitle: Title text
 * - #instructions: Instructions text
 * - #frontIdSection: Front ID upload section
 * - #backIdSection: Back ID upload section
 * - #frontIdPreview: Front ID preview image
 * - #backIdPreview: Back ID preview image
 * - #frontIdUpload: Front ID upload button
 * - #backIdUpload: Back ID upload button
 * - #frontCameraBtn: Front ID camera capture button
 * - #backCameraBtn: Back ID camera capture button
 * - #frontIdStatus: Front ID status indicator
 * - #backIdStatus: Back ID status indicator
 * - #submitBtn: Submit button
 * - #cancelBtn: Cancel button
 * - #errorMessage: Error message display
 * - #progressBar: Upload progress indicator
 */

import wixWindow from 'wix-window';
import { uploadIdDocument } from 'backend/documentUpload.jsw';

// Upload state
let frontIdFile = null;
let backIdFile = null;
let frontIdBase64 = null;
let backIdBase64 = null;
let memberData = null;
let locationData = null;

$w.onReady(function () {
    initializeLightbox();
    setupEventListeners();
});

/**
 * Initialize lightbox
 */
function initializeLightbox() {
    // Get context data passed to lightbox
    const context = wixWindow.lightbox.getContext();
    if (context) {
        memberData = context.memberData;
        locationData = context.locationData;
    }
    
    // Set initial states
    $w('#submitBtn').disable();
    $w('#errorMessage').hide();
    $w('#progressBar').hide();
    
    // Hide previews initially
    $w('#frontIdPreview').hide();
    $w('#backIdPreview').hide();
    
    // Set status indicators
    $w('#frontIdStatus').text = 'Not uploaded';
    $w('#backIdStatus').text = 'Not uploaded';
    
    // Set instructions
    $w('#instructions').text = `
        Please upload clear photos of your government-issued ID (driver's license, state ID, or passport).
        
        Requirements:
        • All text must be clearly readable
        • No glare or shadows
        • Full ID visible in frame
        • Both front and back required for driver's license/state ID
    `;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Front ID upload button
    $w('#frontIdUpload').onChange(handleFrontIdUpload);
    
    // Back ID upload button
    $w('#backIdUpload').onChange(handleBackIdUpload);
    
    // Camera capture buttons (if available)
    if ($w('#frontCameraBtn')) {
        $w('#frontCameraBtn').onClick(() => openCamera('front'));
    }
    
    if ($w('#backCameraBtn')) {
        $w('#backCameraBtn').onClick(() => openCamera('back'));
    }
    
    // Submit button
    $w('#submitBtn').onClick(handleSubmit);
    
    // Cancel button
    $w('#cancelBtn').onClick(handleCancel);
    
    // Retake buttons
    if ($w('#frontRetakeBtn')) {
        $w('#frontRetakeBtn').onClick(() => clearUpload('front'));
    }
    
    if ($w('#backRetakeBtn')) {
        $w('#backRetakeBtn').onClick(() => clearUpload('back'));
    }
}

/**
 * Handle front ID upload
 */
async function handleFrontIdUpload(event) {
    try {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        
        // Validate file
        if (!validateFile(file)) return;
        
        $w('#frontIdStatus').text = 'Processing...';
        
        // Convert to base64 for preview and upload
        frontIdBase64 = await fileToBase64(file);
        frontIdFile = file;
        
        // Show preview
        $w('#frontIdPreview').src = frontIdBase64;
        $w('#frontIdPreview').show();
        
        $w('#frontIdStatus').text = '✓ Front ID uploaded';
        $w('#frontIdStatus').style.color = '#28A745';
        
        updateSubmitButton();
        
    } catch (error) {
        console.error('Error uploading front ID:', error);
        showError('Error processing front ID. Please try again.');
    }
}

/**
 * Handle back ID upload
 */
async function handleBackIdUpload(event) {
    try {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        
        // Validate file
        if (!validateFile(file)) return;
        
        $w('#backIdStatus').text = 'Processing...';
        
        // Convert to base64 for preview and upload
        backIdBase64 = await fileToBase64(file);
        backIdFile = file;
        
        // Show preview
        $w('#backIdPreview').src = backIdBase64;
        $w('#backIdPreview').show();
        
        $w('#backIdStatus').text = '✓ Back ID uploaded';
        $w('#backIdStatus').style.color = '#28A745';
        
        updateSubmitButton();
        
    } catch (error) {
        console.error('Error uploading back ID:', error);
        showError('Error processing back ID. Please try again.');
    }
}

/**
 * Open camera for capture
 */
async function openCamera(side) {
    try {
        // Check if camera is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('Camera not available. Please use file upload.');
            return;
        }
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        
        // Open camera lightbox
        const capturedImage = await wixWindow.openLightbox('CameraCaptureLightbox', {
            stream: stream,
            side: side
        });
        
        // Stop stream
        stream.getTracks().forEach(track => track.stop());
        
        if (capturedImage) {
            if (side === 'front') {
                frontIdBase64 = capturedImage;
                $w('#frontIdPreview').src = capturedImage;
                $w('#frontIdPreview').show();
                $w('#frontIdStatus').text = '✓ Front ID captured';
                $w('#frontIdStatus').style.color = '#28A745';
            } else {
                backIdBase64 = capturedImage;
                $w('#backIdPreview').src = capturedImage;
                $w('#backIdPreview').show();
                $w('#backIdStatus').text = '✓ Back ID captured';
                $w('#backIdStatus').style.color = '#28A745';
            }
            
            updateSubmitButton();
        }
        
    } catch (error) {
        console.error('Camera error:', error);
        showError('Unable to access camera. Please use file upload.');
    }
}

/**
 * Clear upload for retake
 */
function clearUpload(side) {
    if (side === 'front') {
        frontIdFile = null;
        frontIdBase64 = null;
        $w('#frontIdPreview').hide();
        $w('#frontIdStatus').text = 'Not uploaded';
        $w('#frontIdStatus').style.color = '#6c757d';
        $w('#frontIdUpload').value = '';
    } else {
        backIdFile = null;
        backIdBase64 = null;
        $w('#backIdPreview').hide();
        $w('#backIdStatus').text = 'Not uploaded';
        $w('#backIdStatus').style.color = '#6c757d';
        $w('#backIdUpload').value = '';
    }
    
    updateSubmitButton();
}

/**
 * Validate uploaded file
 */
function validateFile(file) {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please upload a JPEG, PNG, or HEIC image.');
        return false;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File size must be less than 10MB.');
        return false;
    }
    
    return true;
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Update submit button state
 */
function updateSubmitButton() {
    const bothUploaded = frontIdBase64 && backIdBase64;
    
    if (bothUploaded) {
        $w('#submitBtn').enable();
        $w('#submitBtn').style.backgroundColor = '#0066CC';
    } else {
        $w('#submitBtn').disable();
        $w('#submitBtn').style.backgroundColor = '#6c757d';
    }
}

/**
 * Handle submit
 */
async function handleSubmit() {
    try {
        $w('#submitBtn').disable();
        $w('#submitBtn').label = 'Uploading...';
        $w('#progressBar').show();
        
        // Prepare metadata
        const metadata = {
            memberEmail: memberData?.email || '',
            memberName: memberData?.name || '',
            memberPhone: memberData?.phone || '',
            gps: locationData,
            uploadedAt: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        // Upload front ID
        $w('#progressBar').targetValue = 50;
        const frontResult = await uploadIdDocument({
            file: frontIdFile || dataURLtoFile(frontIdBase64, 'front_id.jpg'),
            side: 'front',
            metadata: metadata
        });
        
        if (!frontResult.success) {
            throw new Error(frontResult.message || 'Failed to upload front ID');
        }
        
        // Upload back ID
        $w('#progressBar').targetValue = 100;
        const backResult = await uploadIdDocument({
            file: backIdFile || dataURLtoFile(backIdBase64, 'back_id.jpg'),
            side: 'back',
            metadata: metadata
        });
        
        if (!backResult.success) {
            throw new Error(backResult.message || 'Failed to upload back ID');
        }
        
        // Close lightbox with success
        wixWindow.lightbox.close({
            success: true,
            frontDocumentId: frontResult.documentId,
            backDocumentId: backResult.documentId
        });
        
    } catch (error) {
        console.error('Error submitting IDs:', error);
        showError(error.message || 'Error uploading IDs. Please try again.');
        $w('#submitBtn').enable();
        $w('#submitBtn').label = 'Submit';
        $w('#progressBar').hide();
    }
}

/**
 * Convert data URL to File object
 */
function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
}

/**
 * Handle cancel
 */
function handleCancel() {
    wixWindow.lightbox.close(null);
}

/**
 * Show error message
 */
function showError(message) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    
    setTimeout(() => {
        $w('#errorMessage').hide();
    }, 5000);
}

export { handleFrontIdUpload, handleBackIdUpload };
