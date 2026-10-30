/**
 * TermsLightbox.nlr62.js
 * Simple terms of service display lightbox
 * 
 * Expected Elements:
 * - #termsTitle: Title
 * - #termsContent: Content text/rich text
 * - #closeBtn: Close button
 * - #acceptBtn: Accept button (optional)
 */

import wixWindow from 'wix-window';

$w.onReady(function () {
    setupUI();
    setupEventHandlers();
});

function grab(id) {
    try {
        return $w(id) || null;
    } catch (e) {
        return null;
    }
}

function setupUI() {
    const title = grab('#termsTitle');
    if (title) title.text = 'Terms of Service';
    const content = grab('#termsContent');
    if (content) content.text = getTermsText();
}

function setupEventHandlers() {
    try {
        const closeBtn = grab('#closeBtn');
        if (closeBtn && typeof closeBtn.onClick === 'function') {
            closeBtn.onClick(() => {
                wixWindow.lightbox.close({ acknowledged: true });
            });
        }
    } catch (e) { }

    try {
        const acceptBtn = grab('#acceptBtn');
        if (acceptBtn && typeof acceptBtn.onClick === 'function') {
            acceptBtn.onClick(() => {
                wixWindow.lightbox.close({ acknowledged: true, accepted: true });
            });
        }
    } catch (e) { }
}

function getTermsText() {
    return `SHAMROCK BAIL BONDS - TERMS OF SERVICE

By using our services, you agree to these terms.

SERVICES:
We provide bail bond services in Florida, including electronic document signing and payment processing.

ELIGIBILITY:
You must be 18+ and provide accurate information.

ELECTRONIC SIGNATURES:
Your electronic signature is legally binding.

PAYMENT:
All fees are due as specified. Late payments may incur additional fees.

INDEMNITOR RESPONSIBILITIES:
If you co-sign, you're financially responsible if the defendant fails to appear.

DEFENDANT RESPONSIBILITIES:
Appear at all court dates and comply with bail conditions.

LIMITATION OF LIABILITY:
We're not liable for indirect damages or defendant non-compliance.

GOVERNING LAW:
Florida law applies. Disputes resolved in Lee County courts.

CONTACT:
Shamrock Bail Bonds
Phone: 239-332-2245
For legal questions, please contact our support team.

Last Updated: January 2026`;
}
