/**
 * Shamrock Bail Bonds - Site Header Component (FIXED)
 * 
 * Global header component with navigation, CTAs, and mobile menu.
 * Used across all pages for consistent navigation.
 * 
 * File: public/siteHeader.js
 * 
 * FIXES:
 * - Added proper element existence checks before calling .onClick()
 * - Prevents "onClick is not a function" errors
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members-frontend';

// Phone number
const PHONE_TEL = 'tel:+12393322245';

let isMobileMenuOpen = false;
let isLoggedIn = false;

/**
 * Initialize header on page load
 */
export async function initHeader() {
    // Check login status
    isLoggedIn = await checkLoginStatus();

    // Update header based on login status
    updateHeaderForLoginStatus();

    // Set up event listeners
    setupHeaderListeners();

    // Handle responsive behavior
    handleResponsive();

    // Highlight current page in navigation
    highlightCurrentPage();
}

/**
 * Check if user is logged in
 */
async function checkLoginStatus() {
    try {
        const member = await currentMember.getMember();
        return !!member;
    } catch (error) {
        return false;
    }
}

/**
 * Update header based on login status
 */
function updateHeaderForLoginStatus() {
    try {
        if (isLoggedIn) {
            // Show logged-in state
            if ($w('#loginBtn').type) $w('#loginBtn').hide();
            if ($w('#accountBtn').type) $w('#accountBtn').show();
            if ($w('#startBailBtn').type) $w('#startBailBtn').label = 'Start Bail';
        } else {
            // Show logged-out state
            if ($w('#loginBtn').type) $w('#loginBtn').show();
            if ($w('#accountBtn').type) $w('#accountBtn').hide();
            if ($w('#startBailBtn').type) $w('#startBailBtn').label = 'Start Bail';
        }
    } catch (e) {
        console.log('Header login status update skipped (elements missing)');
    }
}

/**
 * Set up header event listeners
 */
function setupHeaderListeners() {
    // Logo click - go home
    try {
        if ($w('#headerLogo').type) {
            $w('#headerLogo').onClick(() => {
                wixLocation.to('/');
            });
        }
    } catch (e) { }

    // Call Now button
    try {
        if ($w('#headerCallBtn').type) {
            $w('#headerCallBtn').onClick(() => {
                trackEvent('Header_CTA_Click', { button: 'call_now' });
                wixLocation.to(PHONE_TEL);
            });
        }
    } catch (e) { }

    // Start Bail button
    try {
        if ($w('#startBailBtn').type) {
            $w('#startBailBtn').onClick(() => {
                trackEvent('Header_CTA_Click', { button: 'start_bail' });
                wixLocation.to('/portal');
            });
        }
    } catch (e) { }

    // Login button
    try {
        if ($w('#loginBtn').type) {
            $w('#loginBtn').onClick(() => {
                trackEvent('Header_Login_Click');
                wixLocation.to('/portal');
            });
        }
    } catch (e) { }

    // Account button (for logged-in users)
    try {
        if ($w('#accountBtn').type) {
            $w('#accountBtn').onClick(() => {
                trackEvent('Header_Account_Click');
                wixLocation.to('/portal');
            });
        }
    } catch (e) { }

    // Mobile menu toggle
    try {
        if ($w('#mobileMenuBtn').type) {
            $w('#mobileMenuBtn').onClick(() => {
                toggleMobileMenu();
            });
        }
    } catch (e) { }

    // Mobile menu close button
    try {
        if ($w('#mobileMenuClose').type) {
            $w('#mobileMenuClose').onClick(() => {
                closeMobileMenu();
            });
        }
    } catch (e) { }

    // Mobile menu overlay click to close
    try {
        if ($w('#mobileMenuOverlay').type) {
            $w('#mobileMenuOverlay').onClick(() => {
                closeMobileMenu();
            });
        }
    } catch (e) { }

    // Navigation links
    setupNavLinks();
}

/**
 * Set up navigation link handlers
 */
function setupNavLinks() {
    const navItems = [
        { selector: '#navHome', path: '/' },
        { selector: '#navHowBailWorks', path: '/how-bail-works' },
        { selector: '#navCounties', path: '/florida-sheriffs-clerks-directory' },
        { selector: '#navBecomeBondsman', path: '/become-a-bondsman' },
        { selector: '#navDirectory', path: '/florida-sheriffs-clerks-directory' },
        { selector: '#navBlog', path: '/blog' },
        { selector: '#navContact', path: '/contact' }
    ];

    navItems.forEach(item => {
        try {
            const el = $w(item.selector);
            if (el.type) {
                el.onClick(() => {
                    trackEvent('Navigation_Click', { destination: item.path });
                    closeMobileMenu();
                    wixLocation.to(item.path);
                });
            }
        } catch (e) { }
    });

    // Mobile nav items
    navItems.forEach(item => {
        try {
            const mobileSelector = item.selector.replace('#nav', '#mobileNav');
            const el = $w(mobileSelector);
            if (el.type) {
                el.onClick(() => {
                    trackEvent('Mobile_Navigation_Click', { destination: item.path });
                    closeMobileMenu();
                    wixLocation.to(item.path);
                });
            }
        } catch (e) { }
    });
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    if (isMobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Open mobile menu
 */
function openMobileMenu() {
    isMobileMenuOpen = true;
    try {
        if ($w('#mobileMenu').type) {
            $w('#mobileMenu').show('slide', { duration: 300, direction: 'right' });
        }
    } catch (e) { }

    try {
        if ($w('#mobileMenuOverlay').type) {
            $w('#mobileMenuOverlay').show('fade', { duration: 200 });
        }
    } catch (e) { }

    try {
        if ($w('#mobileMenuBtn').type) {
            $w('#mobileMenuBtn').label = '✕';
        }
    } catch (e) { }

    trackEvent('Mobile_Menu_Open');
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    isMobileMenuOpen = false;

    // Check elements before hiding
    try {
        if ($w('#mobileMenu').type) {
            $w('#mobileMenu').hide('slide', { duration: 300, direction: 'right' });
        }
    } catch (e) { }

    try {
        if ($w('#mobileMenuOverlay').type) {
            $w('#mobileMenuOverlay').hide('fade', { duration: 200 });
        }
    } catch (e) { }

    try {
        if ($w('#mobileMenuBtn').type) {
            $w('#mobileMenuBtn').label = '☰';
        }
    } catch (e) { }

    trackEvent('Mobile_Menu_Close');
}

/**
 * Handle responsive behavior
 */
function handleResponsive() {
    wixWindow.getBoundingRect()
        .then((windowSize) => {
            const isMobile = windowSize.window.width < 1024;

            // Safe visibility toggles
            if (isMobile) {
                try { if ($w('#desktopNav').type) $w('#desktopNav').hide(); } catch (e) { }
                try { if ($w('#mobileMenuBtn').type) $w('#mobileMenuBtn').show(); } catch (e) { }
                try { if ($w('#headerCallBtn').type) $w('#headerCallBtn').hide(); } catch (e) { }
            } else {
                try { if ($w('#desktopNav').type) $w('#desktopNav').show(); } catch (e) { }
                try { if ($w('#mobileMenuBtn').type) $w('#mobileMenuBtn').hide(); } catch (e) { }
                try { if ($w('#headerCallBtn').type) $w('#headerCallBtn').show(); } catch (e) { }
                closeMobileMenu();
            }
        });
}

/**
 * Highlight current page in navigation
 */
function highlightCurrentPage() {
    // Styling navigation via Velo is flaky. 
    // Best practice: Use Wix Menu element handles state automatically.
    // Logic removed to prevent "style is undefined" crashes.
    return;
}

/**
 * Track events
 */
function trackEvent(eventName, eventData = {}) {
    try {
        wixWindow.trackEvent(eventName, eventData);
    } catch (e) {
        console.log('Event tracking failed:', eventName);
    }
}

// Export for use in masterPage.js
export { checkLoginStatus, toggleMobileMenu };
