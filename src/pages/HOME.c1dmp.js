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

import { session } from 'wix-storage';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import { getCounties } from 'backend/counties';

// State
let countiesData = null;
let countiesLoaded = false;

$w.onReady(function () {
    // Setup SEO and structured data
    setupOrganizationSchema();

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
        spanishBtn.onClick(() => {
            trackEvent('spanish_call_clicked', {
                location: 'hero_section'
            });
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
        // Confirmed ID from screenshot is #countySelector
        const dropdown = $w('#countySelector').uniqueId ? $w('#countySelector') : $w('#countyDropdown');
        if (dropdown.uniqueId) {
            dropdown.placeholder = 'Loading counties...';
        }

        // Dynamic Imports
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
            dropdown.options = countiesData.map(county => {
                // Ensure we use the slug field (already stripped of -county suffix in backend)
                const slug = county.slug || '';
                const displayName = county.name || county.county_name || slug;

                return {
                    label: displayName,
                    value: slug  // CRITICAL: Use slug for routing, not name
                };
            });
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
        // Try both potential IDs for error handling
        const dropdown = $w('#countySelector').uniqueId ? $w('#countySelector') : $w('#countyDropdown');
        if (dropdown.uniqueId) {
            dropdown.placeholder = 'Error loading counties';
        }
    }
}

/**
 * Handle county selection
 */
function handleCountySelection() {
    // Support both ID conventions
    const dropdown = $w('#countyDropdown').uniqueId ? $w('#countyDropdown') : $w('#countySelector');
    const selectedCounty = dropdown.value;

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
    const dropdown = $w('#countySelector').uniqueId ? $w('#countySelector') : $w('#countyDropdown');
    const selectedCounty = dropdown.value;

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
    // Debug: Log the selected value to ensure it's the slug
    console.log('Navigating to county:', selectedCounty);

    // Ensure we're using the slug (strip any spaces or 'county' suffix just in case)
    const cleanSlug = String(selectedCounty)
        .toLowerCase()
        .trim()
        .replace(/\s+county$/i, '')  // Remove ' county' or ' County' suffix
        .replace(/\s+/g, '-');  // Replace spaces with hyphens
    console.log('Clean slug:', cleanSlug);
    wixLocation.to(`/florida-bail-bonds/${cleanSlug}`);
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
 * Setup Organization Schema for SEO
 */
function setupOrganizationSchema() {
    const schemas = [
        // 1. Organization Schema
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "legalName": "Shamrock Bail Bonds LLC",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "foundingDate": "2012",
            "description": "Professional 24/7 bail bond services throughout Florida since 2012. Fast, reliable, and confidential bail bonds with bilingual support.",
            "slogan": "Fort Myers Since 2012",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "26.6406",
                "longitude": "-81.8723"
            },
            "telephone": "+1-239-332-2245",
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-2245",
                    "contactType": "Customer Service",
                    "areaServed": "FL",
                    "availableLanguage": ["English", "Spanish"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00",
                        "closes": "23:59"
                    }
                },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-5245",
                    "contactType": "Emergency",
                    "areaServed": "FL",
                    "availableLanguage": ["English", "Spanish"]
                },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-955-0301",
                    "contactType": "Customer Service",
                    "areaServed": "FL",
                    "availableLanguage": "Spanish"
                }
            ],
            "areaServed": {
                "@type": "State",
                "name": "Florida",
                "@id": "https://en.wikipedia.org/wiki/Florida"
            },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            },
            "priceRange": "$$",
            "paymentAccepted": "Cash, Credit Card, Debit Card"
        },
        // 2. LocalBusiness Schema
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.shamrockbailbonds.biz/#localbusiness",
            "name": "Shamrock Bail Bonds",
            "image": "https://www.shamrockbailbonds.biz/logo.png",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "26.6406",
                "longitude": "-81.8723"
            },
            "url": "https://www.shamrockbailbonds.biz",
            "telephone": "+1-239-332-2245",
            "priceRange": "$$",
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            ]
        },
        // 3. Service Schema
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Bail Bonds",
            "provider": {
                "@id": "https://www.shamrockbailbonds.biz/#organization"
            },
            "areaServed": [
                {
                    "@type": "State",
                    "name": "Florida"
                }
            ],
            "availableChannel": {
                "@type": "ServiceChannel",
                "servicePhone": {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-2245",
                    "availableLanguage": ["English", "Spanish"]
                },
                "serviceUrl": "https://www.shamrockbailbonds.biz"
            },
            "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            }
        }
    ];

    wixSeo.setStructuredData(schemas).catch(e => console.error('Schema error:', e));
}

/**
 * Track events (lightweight wrapper)
 */
function trackEvent(eventName, eventData = {}) {
    try {
        wixWindow.trackEvent("CustomEvent", {
            event: eventName,
            detail: eventData
        });
    } catch (e) {
        // Fail silently
    }
}