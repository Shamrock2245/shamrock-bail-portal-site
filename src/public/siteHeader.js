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
import wixData from 'wix-data';

// Phone number
const PHONE_TEL = 'tel:+12393322245';

let isMobileMenuOpen = false;
let isLoggedIn = false;

// Florida county coordinates (approximate centers)
const COUNTY_COORDINATES = {
    "lee": { lat: 26.6406, lon: -81.8723, slug: "lee" },
    "collier": { lat: 26.1420, lon: -81.7948, slug: "collier" },
    "charlotte": { lat: 26.8940, lon: -81.9498, slug: "charlotte" },
    "miami-dade": { lat: 25.7617, lon: -80.1918, slug: "miami-dade" },
    "broward": { lat: 26.1224, lon: -80.1373, slug: "broward" },
    "palm-beach": { lat: 26.7153, lon: -80.0534, slug: "palm-beach" },
    "hillsborough": { lat: 27.9904, lon: -82.3018, slug: "hillsborough" },
    "pinellas": { lat: 27.9659, lon: -82.8001, slug: "pinellas" },
    "orange": { lat: 28.5383, lon: -81.3792, slug: "orange" },
    "duval": { lat: 30.3322, lon: -81.6557, slug: "duval" },
    "brevard": { lat: 28.2639, lon: -80.7214, slug: "brevard" },
    "volusia": { lat: 29.0280, lon: -81.0228, slug: "volusia" },
    "polk": { lat: 28.0389, lon: -81.7887, slug: "polk" },
    "sarasota": { lat: 27.2364, lon: -82.3004, slug: "sarasota" },
    "manatee": { lat: 27.4989, lon: -82.3260, slug: "manatee" },
    "escambia": { lat: 30.4213, lon: -87.2169, slug: "escambia" },
    "seminole": { lat: 28.7419, lon: -81.2378, slug: "seminole" },
    "lake": { lat: 28.8028, lon: -81.6320, slug: "lake" },
    "st-johns": { lat: 29.8933, lon: -81.3124, slug: "st-johns" },
    "bay": { lat: 30.1588, lon: -85.6602, slug: "bay" }
};

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
        if ($w('#loginBtn').valid) $w('#loginBtn').hide();
        if ($w('#accountBtn').valid) $w('#accountBtn').show();
        if ($w('#startBailBtn').valid) $w('#startBailBtn').label = 'Start Bail';
    } else {
        // Show logged-out state
        if ($w('#loginBtn').valid) $w('#loginBtn').show();
        if ($w('#accountBtn').valid) $w('#accountBtn').hide();
        if ($w('#startBailBtn').valid) $w('#startBailBtn').label = 'Start Bail';
    }
}

/**
 * Set up header event listeners
 */
function setupHeaderListeners() {
    // Logo click - go home
    if ($w('#headerLogo').valid) {
        $w('#headerLogo').onClick(() => {
            wixLocation.to('/');
        });
    }
    
    // Call Now button
    if ($w('#headerCallBtn').valid) {
        $w('#headerCallBtn').onClick(() => {
            trackEvent('Header_CTA_Click', { button: 'call_now' });
            wixLocation.to(PHONE_TEL);
        });
    }
    
    // Start Bail button
    if ($w('#startBailBtn').valid) {
        $w('#startBailBtn').onClick(() => {
            trackEvent('Header_CTA_Click', { button: 'start_bail' });
            if (isLoggedIn) {
                wixLocation.to('/members/start-bail');
            } else {
                wixLocation.to('/members/login?returnUrl=/members/start-bail');
            }
        });
    }
    
    // Login button
    if ($w('#loginBtn').valid) {
        $w('#loginBtn').onClick(() => {
            trackEvent('Header_Login_Click');
            wixLocation.to('/members/login');
        });
    }
    
    // Account button (for logged-in users)
    if ($w('#accountBtn').valid) {
        $w('#accountBtn').onClick(() => {
            trackEvent('Header_Account_Click');
            wixLocation.to('/members/account');
        });
    }
    
    // **NEW: Find My Jail button with geolocation**
    if ($w('#navFindJail').valid) {
        $w('#navFindJail').onClick(() => {
            findNearestJail();
        });
    }
    
    // Mobile menu toggle
    if ($w('#mobileMenuBtn').valid) {
        $w('#mobileMenuBtn').onClick(() => {
            toggleMobileMenu();
        });
    }
    
    // Mobile menu close button
    if ($w('#mobileMenuClose').valid) {
        $w('#mobileMenuClose').onClick(() => {
            closeMobileMenu();
        });
    }
    
    // Mobile menu overlay click to close
    if ($w('#mobileMenuOverlay').valid) {
        $w('#mobileMenuOverlay').onClick(() => {
            closeMobileMenu();
        });
    }
    
    // Navigation links
    setupNavLinks();
}

/**
 * Find nearest jail using geolocation
 */
async function findNearestJail() {
    trackEvent('Find_My_Jail_Click', { source: 'header' });
    
    // Check if geolocation is supported
    if (!wixWindow.getCurrentGeolocation) {
        console.log('Geolocation not supported, defaulting to Lee County');
        wixLocation.to('/bail-bonds-florida/lee');
        return;
    }
    
    try {
        // Request user's location
        const position = await wixWindow.getCurrentGeolocation();
        
        if (position && position.coords) {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            
            // Find nearest county
            const nearestCounty = findNearestCounty(userLat, userLon);
            
            trackEvent('Geolocation_Success', {
                nearestCounty: nearestCounty.slug,
                userLat: userLat,
                userLon: userLon
            });
            
            // Route to nearest county page
            wixLocation.to(`/bail-bonds-florida/${nearestCounty.slug}`);
        } else {
            // Geolocation failed, default to Lee County
            console.log('Geolocation failed, defaulting to Lee County');
            wixLocation.to('/bail-bonds-florida/lee');
        }
    } catch (error) {
        console.error('Geolocation error:', error);
        trackEvent('Geolocation_Error', { error: error.message });
        
        // Default to Lee County on error
        wixLocation.to('/bail-bonds-florida/lee');
    }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

/**
 * Find nearest county based on user's coordinates
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Object} - Nearest county object with slug
 */
function findNearestCounty(userLat, userLon) {
    let nearestCounty = COUNTY_COORDINATES["lee"]; // Default to Lee County
    let minDistance = Infinity;
    
    for (const [countyName, coords] of Object.entries(COUNTY_COORDINATES)) {
        const distance = calculateDistance(userLat, userLon, coords.lat, coords.lon);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestCounty = coords;
        }
    }
    
    return nearestCounty;
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
    if ($w('#mobileMenu').valid) $w('#mobileMenu').show('slide', { duration: 300, direction: 'right' });
    if ($w('#mobileMenuOverlay').valid) $w('#mobileMenuOverlay').show('fade', { duration: 200 });
    if ($w('#mobileMenuBtn').valid) $w('#mobileMenuBtn').label = '✕';
    
    trackEvent('Mobile_Menu_Open');
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    isMobileMenuOpen = false;
    if ($w('#mobileMenu').valid) $w('#mobileMenu').hide('slide', { duration: 300, direction: 'right' });
    if ($w('#mobileMenuOverlay').valid) $w('#mobileMenuOverlay').hide('fade', { duration: 200 });
    if ($w('#mobileMenuBtn').valid) $w('#mobileMenuBtn').label = '☰';
    
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
                if ($w('#desktopNav').valid) $w('#desktopNav').hide();
                if ($w('#mobileMenuBtn').valid) $w('#mobileMenuBtn').show();
                if ($w('#headerCallBtn').valid) $w('#headerCallBtn').hide(); // Use sticky footer on mobile
            } else {
                // Desktop view
                if ($w('#desktopNav').valid) $w('#desktopNav').show();
                if ($w('#mobileMenuBtn').valid) $w('#mobileMenuBtn').hide();
                if ($w('#headerCallBtn').valid) $w('#headerCallBtn').show();
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
    try {
        wixWindow.trackEvent(eventName, eventData);
    } catch (error) {
        console.log('Tracking error:', error);
    }
}

// Export for use in masterPage.js
export { initHeader, checkLoginStatus, toggleMobileMenu };
