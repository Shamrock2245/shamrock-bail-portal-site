/**
 * Optimized HOME.c1dmp.js for Shamrock Bail Bonds
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Lazy load county dropdown data
 * 2. Defer non-critical form validation
 * 3. Optimize image loading priority
 * 4. Minimize initial render work
 * 5. Dynamic imports for backend and Velo APIs
 */

// No top-level imports
// import { getCounties } from 'backend/counties'; <-- Dynamic
// import { session } from 'wix-storage';          <-- Dynamic
// import wixLocation from 'wix-location';         <-- Dynamic
// import wixWindow from 'wix-window';             <-- Dynamic

// State
let countiesData = null;
let countiesLoaded = false;

$w.onReady(function () {
    // Critical: Setup above-the-fold elements only
    setupHeroSection();
    setupCTAButtons();

    // Load county dropdown - use shorter delay if cached, longer if not
    const hasCachedCounties = session.getItem('counties');
    setTimeout(() => {
        loadCountyDropdown();
    }, hasCachedCounties ? 100 : 500);

    // Defer testimonials (2s)
    setTimeout(() => {
        initTestimonials();
    }, 2000);
});

/**
 * Setup hero section
 */
function setupHeroSection() {
    // Note: Prioritize hero image loading in Wix Editor settings

    // Setup hero CTA with ID fallback support
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
        spanishBtn.onClick(async () => {
            trackEvent('spanish_call_clicked', {
                location: 'hero_section'
            });
            // Dynamic Import
            const wixLocation = await import('wix-location');
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
        const dropdown = $w('#countyDropdown');
        if (dropdown.uniqueId) {
            dropdown.placeholder = 'Loading counties...';
        }

        // Dynamic Imports
        const { session } = await import('wix-storage');
        const { getCounties } = await import('backend/counties');

        // Check cache first to avoid backend roundtrip
        const cachedCounties = session.getItem('counties');
        if (cachedCounties) {
            countiesData = JSON.parse(cachedCounties);
        } else {
            // Fetch from backend (now optimized in backend/counties.jsw)
            const response = await getCounties();

            if (Array.isArray(response)) {
                countiesData = response;
                // Cache for 1 hour
                session.setItem('counties', JSON.stringify(countiesData), {
                    ttl: 3600
                });
            } else {
                console.warn("Invalid counties data format", response);
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
            dropdown.onChange(() => handleCountySelection());
        }

        // Setup Get Started button (Support both IDs)
        const getStartedBtn = $w('#getStartedButton').uniqueId ? $w('#getStartedButton') : $w('#getStartedBtn');
        if (getStartedBtn.uniqueId) {
            getStartedBtn.onClick(() => handleGetStarted());
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
        const getStartedBtn = $w('#getStartedButton').uniqueId ? $w('#getStartedButton') : $w('#getStartedBtn');
        if (getStartedBtn.uniqueId) {
            getStartedBtn.enable();
        }

        trackEvent('county_selected', { county: selectedCounty });

        // Auto navigate
        navigateToCounty(selectedCounty);
    }
}

/**
 * Handle Get Started button click
 */
function handleGetStarted() {
    const selectedCounty = $w('#countyDropdown').value;

    if (!selectedCounty) {
        const errorText = $w('#countyError');
        if (errorText.uniqueId) {
            errorText.show();
            errorText.text = 'Please select a county';
        }
        return;
    }

    trackEvent('get_started_clicked', { county: selectedCounty });
    navigateToCounty(selectedCounty);
}

async function navigateToCounty(selectedCounty) {
    const wixLocation = await import('wix-location');
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
    const repeater = $w('#testimonialsRepeater');
    if (!repeater.uniqueId) return;

    // Use IntersectionObserver (onViewportEnter) for lazy rendering
    repeater.onViewportEnter(() => {
        loadTestimonials();
    });

    // Also trigger if it might already be in view
    loadTestimonials();
}

/**
 * Load testimonials data
 */
function loadTestimonials() {
    const repeater = $w('#testimonialsRepeater');
    if (repeater.data.length > 0) return;

    // Static content for speed - eventually fetch from CMS if needed
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

    repeater.onItemReady(($item, itemData) => {
        // ID Fallbacks for robustness
        const nameTxt = $item('#testimonialName').uniqueId ? $item('#testimonialName') : $item('#authorName');
        if (nameTxt.uniqueId) nameTxt.text = itemData.name;

        const bodyTxt = $item('#testimonialText').uniqueId ? $item('#testimonialText') : $item('#quoteText');
        if (bodyTxt.uniqueId) bodyTxt.text = itemData.text;
    });
}

/**
 * Track events (lightweight wrapper)
 */
async function trackEvent(eventName, eventData = {}) {
    try {
        const wixWindow = await import('wix-window');
        wixWindow.trackEvent("CustomEvent", {
            event: eventName,
            detail: eventData
        });
    } catch (e) {
        // Fail silently
    }
}