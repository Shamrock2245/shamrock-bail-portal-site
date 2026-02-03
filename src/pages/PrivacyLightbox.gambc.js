/**
 * PrivacyLightbox.gambc.js
 * Simple privacy policy display lightbox
 * 
 * Expected Elements:
 * - #privacyTitle: Title
 * - #privacyContent: Content text/rich text
 * - #closeBtn: Close button
 */

import wixWindow from 'wix-window';

$w.onReady(function () {
    setupUI();
    setupEventHandlers();
});

function setupUI() {
    if ($w('#privacyTitle')) {
        $w('#privacyTitle').text = 'Privacy Policy';
    }
    if ($w('#privacyContent')) {
        $w('#privacyContent').text = getPrivacyText();
    }
}

function setupEventHandlers() {
    try {
        if ($w('#closeBtn')) {
            $w('#closeBtn').onClick(() => {
                wixWindow.lightbox.close({ acknowledged: true });
            });
        }
    } catch (e) { }
}

function getPrivacyText() {
    return `SHAMROCK BAIL BONDS - PRIVACY POLICY

We collect information you provide (name, contact, ID) to process bail bonds and comply with legal requirements.

HOW WE USE YOUR DATA:
• Process bail bond applications
• Verify identity and prevent fraud
• Communicate about your case
• Comply with court and legal requirements

WE SHARE DATA WITH:
• Courts and law enforcement (as required)
• Insurance companies (for underwriting)
• Service providers (for operations)

We do NOT sell your personal information.

YOUR RIGHTS:
• Access your information
• Request corrections
• Request deletion (subject to legal requirements)

SECURITY:
We use encryption and secure storage to protect your data.

CONTACT:
We respect your privacy. All data is processed securely and is never sold to third parties. For inquiries, please contact our support team.

Last Updated: January 2026`;
}
