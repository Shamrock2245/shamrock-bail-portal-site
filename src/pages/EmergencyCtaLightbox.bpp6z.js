/**
 * EmergencyCtaLightbox.bpp6z.js
 * Non-intrusive emergency CTA for visitors needing bail help
 * Simple, clean design with easy dismiss
 * 
 * Expected Elements:
 * - #ctaTitle: Headline
 * - #callNowBtn: Call button
 * - #startOnlineBtn: Start online button
 * - #closeBtn: Close/dismiss button
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { local } from 'wix-storage';

const PHONE = '239-332-2245';
const PHONE_LINK = 'tel:+12393322245';
const DISMISS_KEY = 'cta_dismissed';

$w.onReady(function () {
    setupUI();
    setupEventHandlers();
});

function setupUI() {
    if ($w('#ctaTitle')) {
        $w('#ctaTitle').text = 'Need Help With Bail?';
    }
    if ($w('#ctaSubtitle')) {
        $w('#ctaSubtitle').text = 'Available 24/7 - Call or start online';
    }
    if ($w('#callNowBtn')) {
        $w('#callNowBtn').label = `Call ${PHONE}`;
    }
    if ($w('#startOnlineBtn')) {
        $w('#startOnlineBtn').label = 'Start Online';
    }
}

function setupEventHandlers() {
    // Call button
    try {
        if ($w('#callNowBtn')) {
            $w('#callNowBtn').onClick(() => {
                recordAction('call');
                wixLocation.to(PHONE_LINK);
            });
        }
    } catch (e) {}

    // Start online button
    try {
        if ($w('#startOnlineBtn')) {
            $w('#startOnlineBtn').onClick(() => {
                recordAction('online');
                closeLightbox();
                wixLocation.to('/portal-landing');
            });
        }
    } catch (e) {}

    // Close button - easy dismiss
    try {
        if ($w('#closeBtn')) {
            $w('#closeBtn').onClick(() => {
                recordAction('dismiss');
                closeLightbox();
            });
        }
    } catch (e) {}
}

function closeLightbox() {
    // Remember dismissal for 24 hours
    local.setItem(DISMISS_KEY, Date.now().toString());
    wixWindow.lightbox.close();
}

function recordAction(action) {
    try {
        local.setItem('cta_action', action);
        local.setItem('cta_time', Date.now().toString());
    } catch (e) {}
}
