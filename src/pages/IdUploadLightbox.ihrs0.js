/**
 * IdUploadLightbox.ihrs0.js
 * Non-intrusive lightbox for uploading government-issued ID (front and back)
 * Clean, simple interface optimized for mobile
 * 
 * Expected Elements:
 * - #idFrontUpload: Upload button for ID front
 * - #idBackUpload: Upload button for ID back
 * - #submitBtn: Submit button
 * - #skipBtn: Skip/Later button (optional)
 * - #statusText: Status message text
 */

import wixWindow from 'wix-window';
import { uploadIdDocument } from 'backend/documentUpload';
import { getSessionToken } from 'public/session-manager';

let frontFile = null;
let backFile = null;
let memberData = null;

$w.onReady(function () {
    // Get context from opener
    const context = wixWindow.lightbox.getContext() || {};
    memberData = context.memberData || { email: 'client@shamrock.local', name: 'Client' };

    setupUI();
    setupEventHandlers();
});

function setupUI() {
    // Simple, clear status
    updateStatus('Upload both sides of your ID to continue.', 'info');
    
    // Disable submit until ready
    if ($w('#submitBtn')) {
        $w('#submitBtn').disable();
    }
}

function setupEventHandlers() {
    // Front ID Upload
    try {
        if ($w('#idFrontUpload')) {
            $w('#idFrontUpload').onChange(() => {
                if ($w('#idFrontUpload').value.length > 0) {
                    frontFile = $w('#idFrontUpload').value[0];
                    updateStatus('Front uploaded. Now add the back.', 'info');
                    checkReady();
                }
            });
        }
    } catch (e) { console.warn('Front upload element not found'); }

    // Back ID Upload
    try {
        if ($w('#idBackUpload')) {
            $w('#idBackUpload').onChange(() => {
                if ($w('#idBackUpload').value.length > 0) {
                    backFile = $w('#idBackUpload').value[0];
                    updateStatus('Ready to submit!', 'success');
                    checkReady();
                }
            });
        }
    } catch (e) { console.warn('Back upload element not found'); }

    // Submit Button
    try {
        if ($w('#submitBtn')) {
            $w('#submitBtn').onClick(handleSubmit);
        }
    } catch (e) { console.warn('Submit button not found'); }

    // Skip/Later Button (non-blocking option)
    try {
        if ($w('#skipBtn')) {
            $w('#skipBtn').onClick(() => {
                wixWindow.lightbox.close({ success: false, skipped: true });
            });
        }
    } catch (e) { /* Skip button is optional */ }

    // Close button
    try {
        if ($w('#closeBtn')) {
            $w('#closeBtn').onClick(() => {
                wixWindow.lightbox.close({ success: false, cancelled: true });
            });
        }
    } catch (e) { /* Close button optional */ }
}

function checkReady() {
    if (frontFile && backFile && $w('#submitBtn')) {
        $w('#submitBtn').enable();
    }
}

async function handleSubmit() {
    if (!frontFile || !backFile) {
        updateStatus('Please upload both sides of your ID.', 'error');
        return;
    }

    const sessionToken = getSessionToken();
    if (!sessionToken) {
        updateStatus('Session expired. Please log in again.', 'error');
        setTimeout(() => wixWindow.lightbox.close({ success: false, error: 'NO_SESSION' }), 1500);
        return;
    }

    // Show progress
    if ($w('#submitBtn')) {
        $w('#submitBtn').disable();
        $w('#submitBtn').label = 'Uploading...';
    }
    updateStatus('Uploading...', 'info');

    try {
        // Get GPS quietly (don't block if it fails)
        let gps = null;
        try {
            const loc = await wixWindow.getCurrentGeolocation();
            gps = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        } catch (e) { /* GPS optional */ }

        const metadata = {
            memberEmail: memberData.email,
            memberName: memberData.name,
            gps: gps,
            uploadedAt: new Date().toISOString()
        };

        // Upload front
        const frontResult = await uploadIdDocument({
            file: frontFile,
            side: 'front',
            metadata: metadata,
            sessionToken: sessionToken
        });

        if (!frontResult.success) throw new Error(frontResult.message || 'Front upload failed');

        // Upload back
        const backResult = await uploadIdDocument({
            file: backFile,
            side: 'back',
            metadata: metadata,
            sessionToken: sessionToken
        });

        if (!backResult.success) throw new Error(backResult.message || 'Back upload failed');

        // Success
        updateStatus('ID uploaded successfully!', 'success');
        if ($w('#submitBtn')) $w('#submitBtn').label = 'Done!';

        setTimeout(() => {
            wixWindow.lightbox.close({
                success: true,
                frontDocumentId: frontResult.documentId,
                backDocumentId: backResult.documentId
            });
        }, 1000);

    } catch (error) {
        console.error('ID upload error:', error);
        updateStatus('Upload failed. Please try again.', 'error');
        if ($w('#submitBtn')) {
            $w('#submitBtn').enable();
            $w('#submitBtn').label = 'Try Again';
        }
    }
}

function updateStatus(message, type) {
    try {
        if ($w('#statusText')) {
            $w('#statusText').text = message;
        }
    } catch (e) { /* Status text optional */ }
}
