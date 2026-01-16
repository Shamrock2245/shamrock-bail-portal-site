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

import { hasSessionToken } from 'public/session-manager';

// Phone number
const PHONE_TEL = 'tel:+12393322245';

let isMobileMenuOpen = false;
let isLoggedIn = false;
let $W = null; // Private scope variable for the passed $w instance

/**
 * Initialize header on page load
 */
export async function initHeader($wContext) {
    if (!$wContext) {
        console.error("Header: initHeader called without $w context!");
        return;
    }
    $W = $wContext; // Assign to module-level variable

    console.log("Header: Initializing with $w context...");

    // Check login status (Fail-Safe)
    try {
        isLoggedIn = await checkLoginStatus();
        console.log("Header: Login Status:", isLoggedIn);
    } catch (e) {
        console.error("Header: Login check failed, defaulting to guest.", e);
        isLoggedIn = false;
    }

    // Update header based on login status
    try {
        updateHeaderForLoginStatus();
    } catch (e) { console.error("Header: Update UI failed", e); }

    // Set up event listeners and Responsive (CRITICAL: Must run even if login fails)
    try {
        setupHeaderListeners();
        handleResponsive();
        highlightCurrentPage();
    } catch (e) { console.error("Header: Setup listeners failed", e); }
}

/**
 * Check if user is logged in
 */
async function checkLoginStatus() {
    try {
        // STRICT: Only check for Custom Session. Ignore Wix Members.
        const hasCustom = hasSessionToken();
        console.log("Header: checkLoginStatus -> hasCustomSession:", hasCustom);
        return hasCustom;
    } catch (error) {
        console.error("Header: Login check failed", error);
        return false;
    }
}

/**
 * Update header based on login status
 */
let retryCount = 0;

function updateHeaderForLoginStatus() {
    console.log(`Header: Updating UI. LoggedIn = ${isLoggedIn}. Retry: ${retryCount}`);

    const selector = $W || $w;
    const loginBtn = selector('#loginBtn');
    const accountBtn = selector('#accountBtn');

    // Feature detection: Check if it looks like a valid Velo element (has .show method)
    // Arrays/NodeLists might be behaving oddly across modules.
    const loginExists = loginBtn && typeof loginBtn.show === 'function';
    const accountExists = accountBtn && typeof accountBtn.show === 'function';

    console.log(`Header: Element Status -> loginBtn: ${loginExists}, accountBtn: ${accountExists}`);

    // RETRY LOGIC
    if (!loginExists && !accountExists && retryCount < 3) {
        console.warn("Header: Elements not found yet. Retrying in 500ms...");
        retryCount++;
        setTimeout(updateHeaderForLoginStatus, 500);
        return;
    }

    try {
        console.log("Header: Elements check -> loginBtn:", loginBtn.length > 0, "accountBtn:", accountBtn.length > 0);

        if (isLoggedIn) {
            // Show logged-in state
            if (loginExists) loginBtn.hide();
            if (accountExists) accountBtn.show();
            if (selector('#startBailBtn').type) selector('#startBailBtn').label = 'Start Bail';
        } else {
            // Show logged-out state
            if (loginExists) {
                loginBtn.show();
                console.log("Header: Shown loginBtn");
            } else {
                console.warn("Header: loginBtn NOT FOUND");
            }

            if (accountExists) accountBtn.hide();
            if (selector('#startBailBtn').type) selector('#startBailBtn').label = 'Start Bail';
        }
    } catch (e) {
        console.log('Header login status update skipped (elements missing)', e);
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
                wixLocation.to('/portal-landing');
            });
        }
    } catch (e) { }

    // Login button
    try {
        if ($w('#loginBtn').type) {
            $w('#loginBtn').onClick(() => {
                trackEvent('Header_Login_Click');
                wixLocation.to('/portal-landing');
            });
        }
    } catch (e) { }

    // Account button (for logged-in users)
    try {
        if ($w('#accountBtn').type) {
            $w('#accountBtn').onClick(() => {
                trackEvent('Header_Account_Click');
                wixLocation.to('/portal-landing');
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
        { selector: '#navLocate', path: '/locate-an-inmate' }, // Added per user request
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
