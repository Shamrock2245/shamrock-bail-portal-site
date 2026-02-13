
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { local } from 'wix-storage';

// Coordinates for major Florida counties (Lat, Lng)
const COUNTY_COORDINATES = {
    'lee': { lat: 26.6616, lng: -81.9338 }, // Fort Myers
    'collier': { lat: 26.1420, lng: -81.7948 }, // Naples
    'charlotte': { lat: 26.9634, lng: -82.0538 }, // Punta Gorda
    'miami-dade': { lat: 25.7617, lng: -80.1918 }, // Miami
    'broward': { lat: 26.1224, lng: -80.1373 }, // Fort Lauderdale
    'palm-beach': { lat: 26.7153, lng: -80.0534 }, // West Palm Beach
    'hillsborough': { lat: 27.9506, lng: -82.4572 }, // Tampa
    'pinellas': { lat: 27.9142, lng: -82.7212 }, // Clearwater
    'orange': { lat: 28.5383, lng: -81.3792 }, // Orlando
    'duval': { lat: 30.3322, lng: -81.6557 }, // Jacksonville
    'brevard': { lat: 28.3968, lng: -80.6057 }, // Cocoa/Merritt Island
    'volusia': { lat: 29.0280, lng: -81.3031 }, // DeLand
    'polk': { lat: 27.8967, lng: -81.8431 }, // Bartow
    'sarasota': { lat: 27.3364, lng: -82.5307 }, // Sarasota
    'manatee': { lat: 27.4989, lng: -82.5748 }, // Bradenton
    'escambia': { lat: 30.4213, lng: -87.2169 }, // Pensacola
    'seminole': { lat: 28.8029, lng: -81.2694 }, // Sanford
    'lake': { lat: 28.8078, lng: -81.7371 }, // Tavares
    'st-johns': { lat: 29.8961, lng: -81.3114 }, // St. Augustine
    'bay': { lat: 30.1588, lng: -85.6602 } // Panama City
};

// Default fallback county
const DEFAULT_COUNTY = 'lee';

/**
 * Initialize the site header
 * This function should be called from the masterPage.js onReady
 */
export function initHeader() {
    setupEventListeners();
    updateActiveLink();

    // Check if we need to show/hide elements based on login status
    checkLoginStatus();
}

/**
 * Setup event listeners for header elements
 */
function setupEventListeners() {
    // Find My Jail Button - NEW FEATURE
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

    // Close mobile menu
    if ($w('#closeMenuBtn').valid) {
        $w('#closeMenuBtn').onClick(() => {
            closeMobileMenu();
        });
    }
}

/**
 * Geolocate user and route to nearest county jail page
 */
function findNearestJail() {
    // Show loading state if possible
    if ($w('#navFindJail').valid) {
        $w('#navFindJail').label = "Locating...";
    }

    wixWindow.getCurrentGeolocation()
        .then((obj) => {
            const userLat = obj.coords.latitude;
            const userLng = obj.coords.longitude;

            console.log(`User location: ${userLat}, ${userLng}`);

            // Find nearest county
            const nearest = findNearestCounty(userLat, userLng);

            console.log(`Nearest county: ${nearest.slug} (${nearest.distance.toFixed(2)} km)`);

            // Track success
            try {
                wixWindow.trackEvent('Find_My_Jail_Success', {
                    lat: userLat,
                    lng: userLng,
                    routedTo: nearest.slug
                });
            } catch (e) { /* ignore tracking error */ }

            // Route to county page
            wixLocation.to(`/bail-bonds-florida/${nearest.slug}`);

            // Reset button label
            if ($w('#navFindJail').valid) {
                $w('#navFindJail').label = "Find My Jail";
            }
        })
        .catch((error) => {
            console.error("Geolocation failed:", error);

            // Track failure
            try {
                wixWindow.trackEvent('Find_My_Jail_Error', { error: error.message || error });
            } catch (e) { /* ignore tracking error */ }

            // Fallback to default county (Lee)
            wixLocation.to(`/bail-bonds-florida/${DEFAULT_COUNTY}`);

            // Reset button label
            if ($w('#navFindJail').valid) {
                $w('#navFindJail').label = "Find My Jail";
            }
        });
}

/**
 * Find the nearest county based on coordinates
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @returns {object} Nearest county object {slug, distance}
 */
function findNearestCounty(lat, lng) {
    let nearest = { slug: DEFAULT_COUNTY, distance: Infinity };

    for (const [slug, coords] of Object.entries(COUNTY_COORDINATES)) {
        const distance = calculateDistance(lat, lng, coords.lat, coords.lng);

        if (distance < nearest.distance) {
            nearest = { slug, distance };
        }
    }

    return nearest;
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Update active state of navigation links
 */
function updateActiveLink() {
    const path = wixLocation.path;

    // Default to home if no path
    const currentInfo = path.length > 0 ? path[0] : 'home';

    // Map of paths to element IDs
    const navMap = {
        'home': '#navHome',
        'bail-process': '#navProcess',
        'locations': '#navLocations',
        'faq': '#navFAQ',
        'contact': '#navContact'
    };

    // Reset all to standard style
    Object.values(navMap).forEach(id => {
        if ($w(id).valid) {
            // Wix doesn't support adding classes via Velo easily
            // We would rely on exact page coloring or state
            // For now, this function is a placeholder for any custom state logic
        }
    });
}

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
    const menuBox = $w('#mobileMenuBox');

    if (menuBox.valid) {
        if (menuBox.collapsed || menuBox.hidden) {
            menuBox.expand();
            menuBox.show('fade', { duration: 200 });
        } else {
            menuBox.hide('fade', { duration: 200 });
        }
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const menuBox = $w('#mobileMenuBox');

    if (menuBox.valid && !menuBox.hidden) {
        menuBox.hide('fade', { duration: 200 });
    }
}

/**
 * Check login status to adjust header text
 */
function checkLoginStatus() {
    import('wix-members').then((wixMembers) => {
        wixMembers.currentMember.getMember()
            .then((member) => {
                if (member) {
                    if ($w('#navLogin').valid) {
                        $w('#navLogin').label = "My Account";
                        // Update link to members area
                        // This usually happens in the editor, but can be forced here
                    }
                }
            })
            .catch(() => {
                // Not logged in, default state is fine
            });
    });
}
