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
import { getCounties } from 'backend/counties';

const PHONE = '239-332-2245';
const PHONE_LINK = 'tel:+12393322245';
const DISMISS_KEY = 'cta_dismissed';

$w.onReady(async function () {
    setupUI();
    setupEventHandlers();

    // Async load counties for dropdown
    await loadCounties();
});

async function loadCounties() {
    try {
        const dropdown = $w('#countyDropdown');
        if (!dropdown) return;

        // Fetch data
        const counties = await getCounties();

        if (counties && counties.length > 0) {
            // Sort alphabetically
            counties.sort((a, b) => a.name.localeCompare(b.name));

            // Map to options
            const options = counties.map(c => ({
                label: c.name + " County",
                value: c.slug
            }));

            dropdown.options = options;
            dropdown.placeholder = "Select Your County";
            dropdown.expand();
        }
    } catch (err) {
        console.warn("Failed to load generic counties for dropdown", err);
    }
}

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
    // Dropdown Navigation
    try {
        const dd = $w('#countyDropdown');
        if (dd) {
            dd.onChange(() => {
                const slug = dd.value;
                if (slug) {
                    recordAction('county_select');
                    // Close lightbox and navigate
                    // local.setItem(DISMISS_KEY, Date.now().toString()); // Optional: dismiss on selection
                    wixLocation.to(`/florida-bail-bonds/${slug}`);
                }
            });
        }
    } catch (e) { }

    // Call button
    try {
        if ($w('#callNowBtn')) {
            $w('#callNowBtn').onClick(() => {
                recordAction('call');
                wixLocation.to(PHONE_LINK);
            });
        }
    } catch (e) { }

    // Start online button
    try {
        if ($w('#startOnlineBtn')) {
            $w('#startOnlineBtn').onClick(() => {
                recordAction('online');
                closeLightbox();
                wixLocation.to('/portal-landing');
            });
        }
    } catch (e) { }

    // Close button - easy dismiss
    try {
        if ($w('#closeBtn')) {
            $w('#closeBtn').onClick(() => {
                recordAction('dismiss');
                closeLightbox();
            });
        }
    } catch (e) { }
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
    } catch (e) { }
}
