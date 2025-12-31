/**
 * Shamrock Bail Bonds - Site Header Component
 * 
 * Global header component with navigation, CTAs, and mobile menu.
 * Used across all pages for consistent navigation.
 * 
 * File: public/siteHeader.js
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
    if (isLoggedIn) {
        // Show logged-in state
        $w('#loginBtn').hide();
        $w('#accountBtn').show();
        $w('#startBailBtn').label = 'Start Bail';
    } else {
        // Show logged-out state
        $w('#loginBtn').show();
        $w('#accountBtn').hide();
        $w('#startBailBtn').label = 'Start Bail';
    }
}

/**
 * Set up header event listeners
 */
function setupHeaderListeners() {
    // Logo click - go home
    $w('#headerLogo').onClick(() => {
        wixLocation.to('/');
    });

    // Call Now button
    $w('#headerCallBtn').onClick(() => {
        trackEvent('Header_CTA_Click', { button: 'call_now' });
        wixLocation.to(PHONE_TEL);
    });

    // Start Bail button
    $w('#startBailBtn').onClick(() => {
        trackEvent('Header_CTA_Click', { button: 'start_bail' });
        if (isLoggedIn) {
            wixLocation.to('/members/start-bail');
        } else {
            wixLocation.to('/members/login?returnUrl=/members/start-bail');
        }
    });

    // Login button
    $w('#loginBtn').onClick(() => {
        trackEvent('Header_Login_Click');
        wixLocation.to('/members/login');
    });

    // Account button (for logged-in users)
    $w('#accountBtn').onClick(() => {
        trackEvent('Header_Account_Click');
        wixLocation.to('/members/account');
    });

    // Mobile menu toggle
    $w('#mobileMenuBtn').onClick(() => {
        toggleMobileMenu();
    });

    // Mobile menu close button
    $w('#mobileMenuClose').onClick(() => {
        closeMobileMenu();
    });

    // Mobile menu overlay click to close
    $w('#mobileMenuOverlay').onClick(() => {
        closeMobileMenu();
    });

    // Navigation links
    setupNavLinks();
}

/**
 * Set up navigation link handlers
 */
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
        const el = $w(item.selector);
        if (el.length > 0) {
            el.onClick(() => {
                trackEvent('Navigation_Click', { destination: item.path });
                closeMobileMenu();
                wixLocation.to(item.path);
            });
        }
    });

    // Mobile nav items
    navItems.forEach(item => {
        const mobileSelector = item.selector.replace('#nav', '#mobileNav');
        const el = $w(mobileSelector);
        if (el.length > 0) {
            el.onClick(() => {
                trackEvent('Mobile_Navigation_Click', { destination: item.path });
                closeMobileMenu();
                wixLocation.to(item.path);
            });
        }
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
    $w('#mobileMenu').show('slide', { duration: 300, direction: 'right' });
    $w('#mobileMenuOverlay').show('fade', { duration: 200 });
    $w('#mobileMenuBtn').label = '✕';

    trackEvent('Mobile_Menu_Open');
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    isMobileMenuOpen = false;

    // Check elements before hiding
    const mobMenu = $w('#mobileMenu');
    const mobOverlay = $w('#mobileMenuOverlay');
    const mobMenuBtn = $w('#mobileMenuBtn');

    // Use catch to ignore missing element errors gracefully
    try { mobMenu.hide('slide', { duration: 300, direction: 'right' }); } catch (e) { }
    try { mobOverlay.hide('fade', { duration: 200 }); } catch (e) { }
    try { mobMenuBtn.label = '☰'; } catch (e) { }

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
                try { $w('#desktopNav').hide(); } catch (e) { }
                try { $w('#mobileMenuBtn').show(); } catch (e) { }
                try { $w('#headerCallBtn').hide(); } catch (e) { }
            } else {
                try { $w('#desktopNav').show(); } catch (e) { }
                try { $w('#mobileMenuBtn').hide(); } catch (e) { }
                try { $w('#headerCallBtn').show(); } catch (e) { }
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
    // import inside function can cause issues in some Velo envs, moving to top if needed, 
    // but here we just safely call it if wixWindow is available (it is imported at top).
    wixWindow.trackEvent(eventName, eventData);
}

// Export for use in masterPage.js
export { checkLoginStatus, toggleMobileMenu };
