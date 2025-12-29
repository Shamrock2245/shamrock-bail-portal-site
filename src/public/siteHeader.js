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
function setupNavLinks() {
    const navItems = [
        { selector: '#navHome', path: '/' },
        { selector: '#navHowBailWorks', path: '/how-bail-works' },
        { selector: '#navCounties', path: '/bail-bonds' },
        { selector: '#navBecomeBondsman', path: '/become-a-bondsman' },
        { selector: '#navDirectory', path: '/florida-sheriffs-clerks-directory' },
        { selector: '#navBlog', path: '/blog' },
        { selector: '#navContact', path: '/contact' }
    ];

    navItems.forEach(item => {
        if ($w(item.selector).valid) {
            $w(item.selector).onClick(() => {
                trackEvent('Navigation_Click', { destination: item.path });
                closeMobileMenu();
                wixLocation.to(item.path);
            });
        }
    });

    // Mobile nav items
    navItems.forEach(item => {
        const mobileSelector = item.selector.replace('#nav', '#mobileNav');
        if ($w(mobileSelector).valid) {
            $w(mobileSelector).onClick(() => {
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

    // Prevent body scroll
    // Note: This may need to be handled differently in Wix
    trackEvent('Mobile_Menu_Open');
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    isMobileMenuOpen = false;
    $w('#mobileMenu').hide('slide', { duration: 300, direction: 'right' });
    $w('#mobileMenuOverlay').hide('fade', { duration: 200 });
    $w('#mobileMenuBtn').label = '☰';

    trackEvent('Mobile_Menu_Close');
}

/**
 * Handle responsive behavior
 */
function handleResponsive() {
    wixWindow.getBoundingRect()
        .then((windowSize) => {
            const isMobile = windowSize.window.width < 1024;

            if (isMobile) {
                // Mobile view
                $w('#desktopNav').hide();
                $w('#mobileMenuBtn').show();
                $w('#headerCallBtn').hide(); // Use sticky footer on mobile
            } else {
                // Desktop view
                $w('#desktopNav').show();
                $w('#mobileMenuBtn').hide();
                $w('#headerCallBtn').show();
                closeMobileMenu();
            }
        });
}

/**
 * Highlight current page in navigation
 */
function highlightCurrentPage() {
    const currentPath = wixLocation.path.join('/');

    const navMapping = {
        '': 'navHome',
        'how-bail-works': 'navHowBailWorks',
        'bail-bonds': 'navCounties',
        'become-a-bondsman': 'navBecomeBondsman',
        'florida-sheriffs-clerks-directory': 'navDirectory',
        'blog': 'navBlog',
        'contact': 'navContact'
    };

    // Remove active class from all nav items
    Object.values(navMapping).forEach(navId => {
        if ($w(`#${navId}`).valid) {
            $w(`#${navId}`).style.fontWeight = 'normal';
        }
    });

    // Add active class to current page
    const activeNavId = navMapping[currentPath] || navMapping[currentPath.split('/')[0]];
    if (activeNavId && $w(`#${activeNavId}`).valid) {
        $w(`#${activeNavId}`).style.fontWeight = 'bold';
    }
}

/**
 * Track events
 */
function trackEvent(eventName, eventData = {}) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

// Export for use in masterPage.js
export { checkLoginStatus, toggleMobileMenu };
