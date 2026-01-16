/**
 * DefendantDetails.js - Lightbox for viewing and managing defendant case details
 * 
 * This lightbox displays defendant information and provides actions for:
 * - Sending signing requests via Email, SMS, or Kiosk
 * - Viewing case status and paperwork progress
 * 
 * Expected context data from parent page:
 * {
 *   _id: string,              // Case ID
 *   defendantName: string,
 *   caseNumber: string,
 *   bondAmount: string,
 *   status: string,
 *   email: string,            // Defendant email (optional)
 *   phone: string,            // Defendant phone (optional)
 *   defendantEmail: string,   // Alternative field name
 *   defendantPhone: string,   // Alternative field name
 *   indemnitorEmail: string,  // Indemnitor email (optional)
 *   indemnitorPhone: string,  // Indemnitor phone (optional)
 *   documentIds: string[],    // SignNow document IDs (optional)
 *   signnowDocIds: string,    // Comma-separated doc IDs from GAS
 * }
 */

import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { initiateSigningWorkflow } from 'backend/signing-methods';

$w.onReady(function () {
    const data = wixWindow.lightbox.getContext();
    if (!data) return;

    // 1. Map Status Fields
    $w('#detailsNameText').text = data.defendantName || "No Name";
    $w('#detailsCaseNumberText').text = data.caseNumber || "No Case";
    $w('#detailsBondText').text = data.bondAmount || "$0.00";
    $w('#detailsStatusText').text = data.status || "Unknown";

    // 2. Setup Close
    $w('#closeBtn').onClick(() => wixWindow.lightbox.close());

    // 3. Extract contact info from case data (handle multiple field naming conventions)
    const defendantInfo = {
        email: data.defendantEmail || data.email || '',
        phone: data.defendantPhone || data.phone || ''
    };

    // Build indemnitor info array if available
    const indemnitorInfo = [];
    if (data.indemnitorEmail || data.indemnitorPhone) {
        indemnitorInfo.push({
            email: data.indemnitorEmail || '',
            phone: data.indemnitorPhone || '',
            name: data.indemnitorName || ''
        });
    }

    // Get document IDs from case data
    // Can be an array, comma-separated string, or single ID
    let documentIds = [];
    if (data.documentIds && Array.isArray(data.documentIds)) {
        documentIds = data.documentIds;
    } else if (data.signnowDocIds && typeof data.signnowDocIds === 'string') {
        documentIds = data.signnowDocIds.split(',').map(id => id.trim()).filter(id => id);
    } else if (data.documentId) {
        documentIds = [data.documentId];
    }

    // Validate we have necessary data
    const hasDefendantContact = defendantInfo.email || defendantInfo.phone;
    const hasDocuments = documentIds.length > 0;

    // Show warning if missing critical data
    if (!hasDefendantContact) {
        console.warn('DefendantDetails: No defendant contact info (email/phone) available');
    }
    if (!hasDocuments) {
        console.warn('DefendantDetails: No document IDs available - paperwork may not have been generated yet');
    }

    // 4. SignNow Integration Handlers
    // ------------------------------------------------

    // A. Send via Email
    $w('#sendEmailBtn').onClick(async () => {
        if (!defendantInfo.email) {
            $w('#signingStatusText').text = "Error: No email address on file for defendant.";
            $w('#signingStatusText').expand();
            return;
        }

        if (!hasDocuments) {
            $w('#signingStatusText').text = "Error: No documents ready. Generate paperwork first.";
            $w('#signingStatusText').expand();
            return;
        }

        $w('#sendEmailBtn').label = "Sending...";
        $w('#signingStatusText').text = "Sending email request...";
        $w('#signingStatusText').expand();

        try {
            const result = await initiateSigningWorkflow({
                caseId: data._id,
                method: 'email',
                defendantInfo,
                indemnitorInfo,
                documentIds
            });

            if (result.success) {
                $w('#sendEmailBtn').label = "Sent!";
                $w('#signingStatusText').text = "Email sent successfully to " + defendantInfo.email;
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (e) {
            console.error('Email send error:', e);
            $w('#sendEmailBtn').label = "Retry";
            $w('#signingStatusText').text = "Error sending email: " + e.message;
        }
    });

    // B. Send via SMS
    $w('#sendSmsBtn').onClick(async () => {
        if (!defendantInfo.phone) {
            $w('#signingStatusText').text = "Error: No phone number on file for defendant.";
            $w('#signingStatusText').expand();
            return;
        }

        if (!hasDocuments) {
            $w('#signingStatusText').text = "Error: No documents ready. Generate paperwork first.";
            $w('#signingStatusText').expand();
            return;
        }

        $w('#sendSmsBtn').label = "Sending...";
        $w('#signingStatusText').text = "Sending SMS request...";
        $w('#signingStatusText').expand();

        try {
            const result = await initiateSigningWorkflow({
                caseId: data._id,
                method: 'sms',
                defendantInfo,
                indemnitorInfo,
                documentIds
            });

            if (result.success) {
                $w('#sendSmsBtn').label = "Sent!";
                $w('#signingStatusText').text = "SMS sent successfully to " + defendantInfo.phone;
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (e) {
            console.error('SMS send error:', e);
            $w('#sendSmsBtn').label = "Retry";
            $w('#signingStatusText').text = "Error sending SMS: " + e.message;
        }
    });

    // C. Kiosk Mode (Open Signing Lightbox)
    $w('#openKioskBtn').onClick(async () => {
        if (!hasDocuments) {
            $w('#signingStatusText').text = "Error: No documents ready. Generate paperwork first.";
            $w('#signingStatusText').expand();
            return;
        }

        $w('#openKioskBtn').label = "Opening...";
        $w('#signingStatusText').text = "Generating kiosk link...";
        $w('#signingStatusText').expand();

        try {
            // For kiosk mode, we use a placeholder email since signing happens in-person
            const kioskDefendantInfo = {
                email: defendantInfo.email || `kiosk_${data._id}@shamrockbailbonds.biz`,
                phone: defendantInfo.phone || ''
            };

            const result = await initiateSigningWorkflow({
                caseId: data._id,
                method: 'kiosk',
                defendantInfo: kioskDefendantInfo,
                indemnitorInfo,
                documentIds
            });

            if (result.success && result.links && result.links[0]) {
                // Open the Signing Lightbox with the embedded link
                wixWindow.openLightbox("SigningLightbox", {
                    signingUrl: result.links[0],
                    documentId: documentIds[0],
                    defendantName: data.defendantName,
                    caseNumber: data.caseNumber
                });
                $w('#openKioskBtn').label = "Open Kiosk";
                $w('#signingStatusText').text = "Kiosk session started.";
            } else {
                throw new Error(result.error || "No signing link returned.");
            }
        } catch (e) {
            console.error('Kiosk error:', e);
            $w('#openKioskBtn').label = "Retry";
            $w('#signingStatusText').text = "Kiosk Error: " + e.message;
        }
    });
});
