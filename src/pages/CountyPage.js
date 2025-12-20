/**
 * Shamrock Bail Bonds - County Page Template
 * 
 * Dynamic page template for individual county bail bond pages.
 * Each county page provides localized information, resources, and SEO optimization.
 * 
 * URL Pattern: /bail-bonds/{county-slug}-county
 * Example: /bail-bonds/lee-county
 * 
 * Page Elements (Wix Editor IDs):
 * - #countyName: County name display
 * - #heroSection: County-specific hero
 * - #quickLinks: Sheriff, Clerk, Court links
 * - #localInfo: Local jail and court information
 * - #bailProcess: County-specific bail process
 * - #ctaSection: Call to action
 * - #nearbyCounties: Links to adjacent counties
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import { getCountyData, getNearbyCounties } from 'public/countyUtils.js';

// Phone number for CTAs
const PHONE_NUMBER = '239-332-2245';
const PHONE_TEL = 'tel:+12393322245';

let currentCounty = null;

$w.onReady(function () {
    initializePage();
});

/**
 * Initialize the county page
 */
async function initializePage() {
    // Get county from URL
    const countySlug = getCountySlugFromUrl();
    
    if (!countySlug) {
        // Redirect to county directory if no county specified
        wixLocation.to('/bail-bonds');
        return;
    }
    
    // Load county data
    currentCounty = await loadCountyData(countySlug);
    
    if (!currentCounty) {
        // County not found - show error or redirect
        showCountyNotFound();
        return;
    }
    
    // Populate page with county data
    populateCountyPage(currentCounty);
    
    // Set up event listeners
    setupEventListeners();
    
    // Set SEO metadata
    setCountySEO(currentCounty);
    
    // Track page view
    trackEvent('PageView', { 
        page: 'CountyPage', 
        county: currentCounty.name 
    });
}

/**
 * Extract county slug from URL
 */
function getCountySlugFromUrl() {
    const path = wixLocation.path;
    // URL pattern: /bail-bonds/{county-slug}-county
    if (path.length >= 2 && path[0] === 'bail-bonds') {
        const countyPart = path[1];
        // Remove '-county' suffix if present
        return countyPart.replace(/-county$/, '');
    }
    return null;
}

/**
 * Load county data from database or JSON
 */
async function loadCountyData(countySlug) {
    try {
        // Try to load from Wix Data collection first
        const results = await wixData.query('FloridaCounties')
            .eq('slug', countySlug)
            .find();
        
        if (results.items.length > 0) {
            return results.items[0];
        }
        
        // Fallback to static data
        return getCountyData(countySlug);
    } catch (error) {
        console.error('Error loading county data:', error);
        return getCountyData(countySlug);
    }
}

/**
 * Populate page elements with county data
 */
function populateCountyPage(county) {
    // County name in hero
    $w('#countyName').text = `${county.name} County`;
    $w('#heroTitle').text = `${county.name} County Bail Bonds`;
    $w('#heroSubtitle').text = `Fast, professional bail bond services in ${county.name} County, Florida. Available 24/7.`;
    
    // Quick links section
    populateQuickLinks(county);
    
    // Local information
    populateLocalInfo(county);
    
    // Nearby counties
    populateNearbyCounties(county);
    
    // Update breadcrumb
    $w('#breadcrumbCounty').text = `${county.name} County`;
}

/**
 * Populate quick links (Sheriff, Clerk, Records)
 */
function populateQuickLinks(county) {
    // Sheriff/Booking link
    if ($w('#sheriffLink').valid) {
        $w('#sheriffLink').link = county.bookingUrl;
        $w('#sheriffLink').target = '_blank';
        $w('#sheriffPhone').text = county.bookingPhone;
    }
    
    // Clerk of Court link
    if ($w('#clerkLink').valid) {
        $w('#clerkLink').link = county.clerkUrl;
        $w('#clerkLink').target = '_blank';
        $w('#clerkPhone').text = county.clerkPhone;
    }
    
    // Records search link
    if ($w('#recordsLink').valid) {
        $w('#recordsLink').link = county.recordsUrl;
        $w('#recordsLink').target = '_blank';
    }
}

/**
 * Populate local jail and court information
 */
function populateLocalInfo(county) {
    // This would be populated with county-specific content
    // For now, we'll use template content
    
    const localContent = `
        <h3>Bail Bonds in ${county.name} County</h3>
        <p>Shamrock Bail Bonds provides fast, professional bail bond services throughout ${county.name} County, Florida. Our experienced agents are available 24 hours a day, 7 days a week to help you or your loved one get out of jail quickly.</p>
        
        <h4>Why Choose Shamrock for ${county.name} County Bail?</h4>
        <ul>
            <li>Local expertise with ${county.name} County jail procedures</li>
            <li>Fast processing - typically 2-4 hours from start to release</li>
            <li>Flexible payment plans available</li>
            <li>Confidential, professional service</li>
            <li>Licensed and insured</li>
        </ul>
        
        <h4>${county.name} County Jail Information</h4>
        <p>For inmate information and booking details, contact the ${county.name} County Sheriff's Office at ${county.bookingPhone} or visit their <a href="${county.bookingUrl}" target="_blank">online booking search</a>.</p>
    `;
    
    if ($w('#localInfoContent').valid) {
        $w('#localInfoContent').html = localContent;
    }
}

/**
 * Populate nearby counties section
 */
async function populateNearbyCounties(county) {
    const nearbyCounties = await getNearbyCounties(county.slug);
    
    if ($w('#nearbyCountiesRepeater').valid && nearbyCounties.length > 0) {
        $w('#nearbyCountiesRepeater').data = nearbyCounties;
        $w('#nearbyCountiesRepeater').onItemReady(($item, itemData) => {
            $item('#nearbyCountyName').text = `${itemData.name} County`;
            $item('#nearbyCountyLink').link = `/bail-bonds/${itemData.slug}-county`;
        });
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Call Now CTA
    $w('#callNowBtn').onClick(() => {
        trackEvent('CTA_Click', { 
            button: 'call_now', 
            page: 'county_page',
            county: currentCounty?.name 
        });
        wixLocation.to(PHONE_TEL);
    });
    
    // Start Bail CTA
    $w('#startBailBtn').onClick(() => {
        trackEvent('CTA_Click', { 
            button: 'start_bail', 
            page: 'county_page',
            county: currentCounty?.name 
        });
        wixLocation.to('/members/start-bail');
    });
    
    // Mobile Sticky CTAs
    $w('#mobileCallBtn').onClick(() => {
        trackEvent('CTA_Click', { 
            button: 'call_now', 
            location: 'sticky_mobile',
            county: currentCounty?.name 
        });
        wixLocation.to(PHONE_TEL);
    });
    
    $w('#mobileStartBtn').onClick(() => {
        trackEvent('CTA_Click', { 
            button: 'start_bail', 
            location: 'sticky_mobile',
            county: currentCounty?.name 
        });
        wixLocation.to('/members/start-bail');
    });
    
    // External links tracking
    $w('#sheriffLink').onClick(() => {
        trackEvent('External_Link', { 
            type: 'sheriff',
            county: currentCounty?.name 
        });
    });
    
    $w('#clerkLink').onClick(() => {
        trackEvent('External_Link', { 
            type: 'clerk',
            county: currentCounty?.name 
        });
    });
    
    $w('#recordsLink').onClick(() => {
        trackEvent('External_Link', { 
            type: 'records',
            county: currentCounty?.name 
        });
    });
}

/**
 * Set SEO metadata for the county page
 */
function setCountySEO(county) {
    import('wix-seo').then((wixSEO) => {
        wixSEO.title = `${county.name} County Bail Bonds | 24/7 Service | Shamrock Bail Bonds`;
        
        wixSEO.metaTags = [
            { 
                name: "description", 
                content: `Need bail bonds in ${county.name} County, Florida? Shamrock Bail Bonds offers 24/7 professional bail bond services. Fast release, flexible payments. Call ${PHONE_NUMBER}.`
            },
            { 
                name: "keywords", 
                content: `${county.name} County bail bonds, bail bondsman ${county.name} County FL, ${county.name} jail bail, Florida bail bonds`
            }
        ];
        
        // Structured data for local business
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Shamrock Bail Bonds",
            "description": `Bail bond services in ${county.name} County, Florida`,
            "telephone": PHONE_NUMBER,
            "areaServed": {
                "@type": "AdministrativeArea",
                "name": `${county.name} County, Florida`
            },
            "openingHours": "Mo-Su 00:00-24:00",
            "priceRange": "$$"
        };
        
        wixSEO.structuredData = [structuredData];
    });
}

/**
 * Show county not found message
 */
function showCountyNotFound() {
    $w('#pageContent').hide();
    $w('#notFoundMessage').show();
    $w('#notFoundMessage').text = "County not found. Please select a county from our directory.";
    
    // Redirect after delay
    setTimeout(() => {
        wixLocation.to('/bail-bonds');
    }, 3000);
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

export { initializePage, loadCountyData, populateCountyPage };
