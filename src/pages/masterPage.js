// masterPage.js
// Global code that runs on every page

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { authentication } from 'wix-members';
import { silentPingLocation } from 'public/location-tracker';

$w.onReady(function () {
    initHeader();
    initFooter();
    checkMobileView();

    // Proactive tracking for defendants
    silentPingLocation();
});

function initHeader() {
    // Handle navigation based on login state
    const isLoggedIn = authentication.loggedIn();

    if (isLoggedIn) {
        $w('#loginBtn').label = "My Account";
        $w('#loginBtn').onClick(() => {
            wixLocation.to('/members/account');
        });
    } else {
        $w('#loginBtn').label = "Log In";
        $w('#loginBtn').onClick(() => {
            wixLocation.to('/login');
        });
    }

    // Mobile menu toggle
    $w('#mobileMenuBtn').onClick(() => {
        const menuBox = $w('#mobileMenuBox');
        if (menuBox.collapsed) {
            menuBox.expand();
        } else {
            menuBox.collapse();
        }
    });
}

function initFooter() {
    // Dynamic copyright year
    const currentYear = new Date().getFullYear();
    $w('#copyrightText').text = `© ${currentYear} Shamrock Bail Bonds. All Rights Reserved.`;
}

function checkMobileView() {
    const formFactor = wixWindow.formFactor; // "Desktop", "Mobile", "Tablet"

    if (formFactor === "Mobile") {
        $w('#stickyMobileCTA').expand();
    } else {
        $w('#stickyMobileCTA').collapse();
    }
}
