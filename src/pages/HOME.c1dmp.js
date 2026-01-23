/**
 * Optimized HOME.c1dmp.js for Shamrock Bail Bonds
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Lazy load county dropdown data
 * 2. Defer non-critical form validation
 * 3. Optimize image loading priority
 * 4. Minimize initial render work
 */

import { getCounties } from 'backend/counties';
import { session } from 'wix-storage';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

// State
let countiesData = null;
let countiesLoaded = false;

$w.onReady(function () {
    // Critical: Setup above-the-fold elements only
    setupHeroSection();
    setupCTAButtons();

    // Defer county dropdown loading
    setTimeout(() => {
        loadCountyDropdown();
    }, 1000);

    // Defer testimonials
    setTimeout(() => {
        initTestimonials();
    }, 2000);
});

/**
 * Setup hero section with optimized image loading
 */
function setupHeroSection() {
    // Hero image should have fetchpriority="high" in Wix Editor
    // This is done in the editor, not in code

    // Setup hero CTA (Support both ID naming conventions)
    const heroBtn = $w('#heroGetStartedButton');
    if (heroBtn.uniqueId) {
        heroBtn.onClick(() => {
            scrollToCountySelector();
        });
    }
}

/**
 * Setup CTA buttons
 */
function setupCTAButtons() {
    // Emergency call button
    const emergencyBtn = $w('#emergencyCallButton');
    if (emergencyBtn.uniqueId) {
        emergencyBtn.onClick(() => {
            trackEvent('emergency_call_clicked', {
                location: 'hero_section'
            });
        });
    }

    // Spanish call button (Support both ID naming conventions)
    const spanishBtn = $w('#spanishCallButton').uniqueId ? $w('#spanishCallButton') : $w('#callNowSpanishBtn');
    if (spanishBtn.uniqueId) {
        spanishBtn.onClick(() => {
            trackEvent('spanish_call_clicked', {
                location: 'hero_section'
            });
            // Action for Spanish button
            wixLocation.to("tel:12399550301");
        });
    }
}

/**
 * Load county dropdown data (deferred)
 */
async function loadCountyDropdown() {
    if (countiesLoaded) return;

    try {
        // Show loading state
        const dropdown = $w('#countyDropdown');
        if (dropdown.uniqueId) {
            dropdown.placeholder = 'Loading counties...';
        }

        // Check cache first
        const cachedCounties = session.getItem('counties');
        if (cachedCounties) {
            countiesData = JSON.parse(cachedCounties);
        } else {
            // Fetch from backend
            const response = await getCounties();

            // Handle backend response (Array)
            if (Array.isArray(response)) {
                countiesData = response;
                // Cache for 1 hour
                session.setItem('counties', JSON.stringify(countiesData), {
                    ttl: 3600
                });
            } else {
                console.error("Invalid counties data format", response);
                countiesData = []; // Fallback
            }
        }

        // Populate dropdown
        if (dropdown.uniqueId && Array.isArray(countiesData)) {
            dropdown.options = countiesData.map(county => ({
                label: county.county_name || county.name,  // Handle likely field names
                value: county.slug
            }));
            dropdown.placeholder = 'Select County Name';

            // Setup dropdown change handler
            dropdown.onChange(() => {
                handleCountySelection();
            });
        }

        // Setup Get Started button (Support both IDs)
        const getStartedBtn = $w('#getStartedButton').uniqueId ? $w('#getStartedButton') : $w('#getStartedBtn');
        if (getStartedBtn.uniqueId) {
            getStartedBtn.onClick(() => {
                handleGetStarted();
            });
        }

        countiesLoaded = true;

    } catch (error) {
        console.error('Error loading counties:', error);
        if ($w('#countyDropdown').uniqueId) {
            $w('#countyDropdown').placeholder = 'Error loading counties';
        }
    }
}

/**
 * Handle county selection
 */
function handleCountySelection() {
    const selectedCounty = $w('#countyDropdown').value;

    if (selectedCounty) {
        // Enable Get Started button
        const getStartedBtn = $w('#getStartedButton').uniqueId ? $w('#getStartedButton') : $w('#getStartedBtn');
        if (getStartedBtn.uniqueId) {
            getStartedBtn.enable();
        }

        // Track selection
        trackEvent('county_selected', {
            county: selectedCounty
        });

        // Auto navigate for better UX (consistent with previous behavior)
        navigateToCounty(selectedCounty);
    }
}

/**
 * Handle Get Started button click
 */
function handleGetStarted() {
    const selectedCounty = $w('#countyDropdown').value;

    if (!selectedCounty) {
        // Show error
        if ($w('#countyError').uniqueId) {
            $w('#countyError').show();
            $w('#countyError').text = 'Please select a county';
        }
        return;
    }

    // Track conversion
    trackEvent('get_started_clicked', {
        county: selectedCounty
    });

    navigateToCounty(selectedCounty);
}

function navigateToCounty(selectedCounty) {
    // Navigate to county page or start bail process
    wixLocation.to(`/bail-bonds/${selectedCounty}`);
}

/**
 * Scroll to county selector
 */
function scrollToCountySelector() {
    if ($w('#countySelector').uniqueId) {
        $w('#countySelector').scrollTo();
    } else if ($w('#countyDropdown').uniqueId) {
        $w('#countyDropdown').scrollTo();
    }
}

/**
 * Initialize testimonials (deferred)
 */
function initTestimonials() {
    // Lazy load testimonials repeater
    if ($w('#testimonialsRepeater').uniqueId) {
        // Testimonials are below the fold, so they can be lazy loaded
        $w('#testimonialsRepeater').onViewportEnter(() => {
            loadTestimonials();
        });
        // Or just load them if already in viewport or generic timeout finished
        loadTestimonials();
    }
}

/**
 * Load testimonials data
 */
async function loadTestimonials() {
    try {
        const repeater = $w('#testimonialsRepeater');
        // Check if already loaded
        if (repeater.data.length > 0) {
            return;
        }

        // Load testimonials (static fallback for speed)
        const testimonials = [
            {
                _id: '1',
                name: 'Steve D.',
                text: 'Answered immediately and had everything moving fast. You can tell they know exactly what they\'re doing.',
                rating: 5
            },
            {
                _id: '2',
                name: 'Brian C.',
                text: 'Calm, respectful, and professional when we needed it most. They handled everything.',
                rating: 5
            },
            {
                _id: '3',
                name: 'Ana E.',
                text: 'They picked up late at night and never rushed us off the phone.',
                rating: 5
            },
            {
                _id: '4',
                name: 'Rafael I.',
                text: 'They treated us like people, not a number. That mattered more than anything.',
                rating: 5
            }
        ];

        repeater.data = testimonials;

        // Setup repeater items
        repeater.onItemReady(($item, itemData) => {
            if ($item('#testimonialName').uniqueId) $item('#testimonialName').text = itemData.name;
            // Fallback for authorName in old code
            if ($item('#authorName').uniqueId) $item('#authorName').text = itemData.name;

            if ($item('#testimonialText').uniqueId) $item('#testimonialText').text = itemData.text;
            // Fallback for quoteText in old code
            if ($item('#quoteText').uniqueId) $item('#quoteText').text = itemData.text;
        });

    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
}

/**
 * Track events
 */
function trackEvent(eventName, eventData = {}) {
    // Velo Analytics
    try {
        wixWindow.trackEvent("CustomEvent", {
            event: eventName,
            detail: eventData
        });
    } catch (e) {
        console.warn("Tracking failed", e);
    }
}