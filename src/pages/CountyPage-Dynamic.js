/**
 * Shamrock Bail Bonds - Dynamic County Page
 * 
 * This is the template for individual county pages.
 * Connected to the Counties collection via dynamic page routing.
 * 
 * URL Pattern: /counties/{slug}
 * Example: /counties/lee-county
 * 
 * Page Elements (Wix Editor IDs):
 * - #countyName: County name heading
 * - #countyRegion: Region badge
 * - #heroSection: Hero with county-specific messaging
 * - #sheriffSection: Sheriff's office information
 * - #clerkSection: Clerk of Court information
 * - #jailSection: Jail/detention information
 * - #resourceLinks: Quick links to external resources
 * - #localCities: Cities served in this county
 * - #faqSection: County-specific FAQs
 * - #ctaSection: Call to action
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';

// Phone number constant
const PHONE_NUMBER = '239-332-2245';
const PHONE_TEL = 'tel:+12393322245';

// Current county data
let countyData = null;

$w.onReady(function () {
    loadCountyData();
    setupEventListeners();
});

/**
 * Load county data from the dynamic dataset
 */
async function loadCountyData() {
    try {
        // Get current item from dynamic dataset
        const dataset = $w('#dynamicDataset');
        
        await dataset.onReady();
        
        countyData = dataset.getCurrentItem();
        
        if (countyData) {
            populatePage(countyData);
            setPageSEO(countyData);
            trackPageView(countyData);
        } else {
            // County not found - redirect to directory
            console.error('County not found');
            wixLocation.to('/counties');
        }
        
    } catch (error) {
        console.error('Error loading county data:', error);
        showError('Unable to load county information. Please try again.');
    }
}

/**
 * Populate page with county data
 * @param {Object} county - County data object
 */
function populatePage(county) {
    // Hero Section
    if ($w('#countyName')) {
        $w('#countyName').text = county.title;
    }
    
    if ($w('#heroTitle')) {
        $w('#heroTitle').text = `Bail Bonds in ${county.title}, Florida`;
    }
    
    if ($w('#heroSubtitle')) {
        $w('#heroSubtitle').text = `24/7 Professional Bail Bond Services in ${county.countySeat || county.title}`;
    }
    
    if ($w('#countyRegion')) {
        $w('#countyRegion').text = county.region;
    }
    
    // Sheriff's Office Section
    populateSheriffSection(county);
    
    // Clerk of Court Section
    populateClerkSection(county);
    
    // Jail Information Section
    populateJailSection(county);
    
    // Local Cities
    populateCitiesSection(county);
    
    // Resource Links
    populateResourceLinks(county);
    
    // Update all phone displays
    updatePhoneDisplays();
}

/**
 * Populate Sheriff's Office section
 */
function populateSheriffSection(county) {
    if ($w('#sheriffName')) {
        $w('#sheriffName').text = county.sheriffOfficeName || `${county.title} Sheriff's Office`;
    }
    
    if ($w('#sheriffPhone')) {
        $w('#sheriffPhone').text = county.sheriffPhone || 'Contact for information';
    }
    
    if ($w('#sheriffAddress')) {
        $w('#sheriffAddress').text = county.sheriffAddress || '';
        if (!county.sheriffAddress) {
            $w('#sheriffAddress').hide();
        }
    }
    
    if ($w('#sheriffWebsiteBtn')) {
        if (county.sheriffWebsite) {
            $w('#sheriffWebsiteBtn').link = county.sheriffWebsite;
            $w('#sheriffWebsiteBtn').target = '_blank';
            $w('#sheriffWebsiteBtn').show();
        } else {
            $w('#sheriffWebsiteBtn').hide();
        }
    }
    
    if ($w('#inmateSearchBtn')) {
        if (county.inmateSearchUrl) {
            $w('#inmateSearchBtn').link = county.inmateSearchUrl;
            $w('#inmateSearchBtn').target = '_blank';
            $w('#inmateSearchBtn').show();
        } else {
            $w('#inmateSearchBtn').hide();
        }
    }
}

/**
 * Populate Clerk of Court section
 */
function populateClerkSection(county) {
    if ($w('#clerkName')) {
        $w('#clerkName').text = county.clerkName || `${county.title} Clerk of Court`;
    }
    
    if ($w('#clerkPhone')) {
        $w('#clerkPhone').text = county.clerkPhone || 'Contact for information';
    }
    
    if ($w('#clerkAddress')) {
        $w('#clerkAddress').text = county.clerkAddress || '';
        if (!county.clerkAddress) {
            $w('#clerkAddress').hide();
        }
    }
    
    if ($w('#clerkWebsiteBtn')) {
        if (county.clerkWebsite) {
            $w('#clerkWebsiteBtn').link = county.clerkWebsite;
            $w('#clerkWebsiteBtn').target = '_blank';
            $w('#clerkWebsiteBtn').show();
        } else {
            $w('#clerkWebsiteBtn').hide();
        }
    }
    
    if ($w('#courtRecordsBtn')) {
        if (county.courtRecordsUrl) {
            $w('#courtRecordsBtn').link = county.courtRecordsUrl;
            $w('#courtRecordsBtn').target = '_blank';
            $w('#courtRecordsBtn').show();
        } else {
            $w('#courtRecordsBtn').hide();
        }
    }
}

/**
 * Populate Jail Information section
 */
function populateJailSection(county) {
    if ($w('#jailName')) {
        $w('#jailName').text = county.jailName || `${county.title} Detention Center`;
    }
    
    if ($w('#jailPhone')) {
        $w('#jailPhone').text = county.jailPhone || county.sheriffPhone || 'Contact Sheriff\'s Office';
    }
    
    if ($w('#jailAddress')) {
        $w('#jailAddress').text = county.jailAddress || '';
        if (!county.jailAddress) {
            $w('#jailAddress').hide();
        }
    }
}

/**
 * Populate cities served section
 */
function populateCitiesSection(county) {
    if ($w('#localCities') && county.majorCities) {
        const cities = county.majorCities.split(',').map(c => c.trim());
        
        if ($w('#citiesRepeater')) {
            $w('#citiesRepeater').data = cities.map((city, index) => ({
                _id: `city-${index}`,
                name: city
            }));
            
            $w('#citiesRepeater').onItemReady(($item, itemData) => {
                $item('#cityName').text = itemData.name;
            });
        } else {
            // Fallback to text display
            $w('#localCities').text = cities.join(' • ');
        }
    }
    
    if ($w('#countySeat') && county.countySeat) {
        $w('#countySeat').text = `County Seat: ${county.countySeat}`;
    }
    
    if ($w('#population') && county.population) {
        $w('#population').text = `Population: ${county.population.toLocaleString()}`;
    }
}

/**
 * Populate resource links section
 */
function populateResourceLinks(county) {
    const links = [];
    
    if (county.sheriffWebsite) {
        links.push({
            _id: 'sheriff',
            label: 'Sheriff\'s Office',
            url: county.sheriffWebsite,
            icon: 'shield'
        });
    }
    
    if (county.inmateSearchUrl) {
        links.push({
            _id: 'inmate',
            label: 'Inmate Search',
            url: county.inmateSearchUrl,
            icon: 'search'
        });
    }
    
    if (county.clerkWebsite) {
        links.push({
            _id: 'clerk',
            label: 'Clerk of Court',
            url: county.clerkWebsite,
            icon: 'document'
        });
    }
    
    if (county.courtRecordsUrl) {
        links.push({
            _id: 'records',
            label: 'Court Records',
            url: county.courtRecordsUrl,
            icon: 'folder'
        });
    }
    
    if ($w('#resourceLinksRepeater') && links.length > 0) {
        $w('#resourceLinksRepeater').data = links;
        
        $w('#resourceLinksRepeater').onItemReady(($item, itemData) => {
            $item('#resourceLabel').text = itemData.label;
            $item('#resourceLink').link = itemData.url;
            $item('#resourceLink').target = '_blank';
            
            $item('#resourceLink').onClick(() => {
                trackEvent('Resource_Click', {
                    county: county.title,
                    resource: itemData.label
                });
            });
        });
    }
}

/**
 * Update phone number displays
 */
function updatePhoneDisplays() {
    const phoneElements = ['#phoneDisplay', '#heroPhone', '#ctaPhone'];
    
    phoneElements.forEach(selector => {
        if ($w(selector)) {
            $w(selector).text = PHONE_NUMBER;
        }
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Primary CTA - Call Now
    if ($w('#callNowBtn')) {
        $w('#callNowBtn').onClick(() => {
            trackEvent('CTA_Click', {
                button: 'call_now',
                county: countyData?.title,
                location: 'hero'
            });
            wixLocation.to(PHONE_TEL);
        });
    }
    
    // Secondary CTA - Start Bail Online
    if ($w('#startBailBtn')) {
        $w('#startBailBtn').onClick(() => {
            trackEvent('CTA_Click', {
                button: 'start_bail',
                county: countyData?.title,
                location: 'hero'
            });
            wixLocation.to('/members/start-bail');
        });
    }
    
    // Final CTA Section
    if ($w('#finalCallBtn')) {
        $w('#finalCallBtn').onClick(() => {
            trackEvent('CTA_Click', {
                button: 'call_now',
                county: countyData?.title,
                location: 'final_cta'
            });
            wixLocation.to(PHONE_TEL);
        });
    }
    
    if ($w('#finalStartBtn')) {
        $w('#finalStartBtn').onClick(() => {
            trackEvent('CTA_Click', {
                button: 'start_bail',
                county: countyData?.title,
                location: 'final_cta'
            });
            wixLocation.to('/members/start-bail');
        });
    }
    
    // Back to directory
    if ($w('#backToDirectoryBtn')) {
        $w('#backToDirectoryBtn').onClick(() => {
            wixLocation.to('/counties');
        });
    }
    
    // Phone number links
    const phoneLinks = ['#sheriffPhoneLink', '#clerkPhoneLink', '#jailPhoneLink'];
    phoneLinks.forEach(selector => {
        if ($w(selector)) {
            $w(selector).onClick(() => {
                const phoneNumber = $w(selector).text;
                if (phoneNumber && phoneNumber.match(/\d/)) {
                    const cleanNumber = phoneNumber.replace(/\D/g, '');
                    wixLocation.to(`tel:${cleanNumber}`);
                }
            });
        }
    });
}

/**
 * Set page SEO metadata
 * @param {Object} county - County data
 */
function setPageSEO(county) {
    // Use custom meta if available, otherwise generate
    const title = county.metaTitle || 
        `Bail Bonds in ${county.title}, FL | 24/7 Service | Shamrock Bail Bonds`;
    
    const description = county.metaDescription ||
        `Need bail bonds in ${county.title}, Florida? Shamrock Bail Bonds offers 24/7 service in ${county.countySeat || county.title} and all of ${county.title}. Fast release, flexible payments. Call now!`;
    
    wixSeo.title = title;
    
    wixSeo.metaTags = [
        { name: 'description', content: description },
        { name: 'keywords', content: `bail bonds ${county.title}, ${county.title} bail bondsman, ${county.countySeat || ''} bail bonds, Florida bail bonds` },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' }
    ];
    
    // Structured data for local business
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Shamrock Bail Bonds",
        "description": description,
        "areaServed": {
            "@type": "AdministrativeArea",
            "name": county.title + ", Florida"
        },
        "telephone": PHONE_NUMBER,
        "priceRange": "$$",
        "openingHours": "Mo-Su 00:00-23:59"
    };
    
    wixSeo.setStructuredData([structuredData]);
}

/**
 * Track page view
 * @param {Object} county - County data
 */
function trackPageView(county) {
    wixWindow.trackEvent('PageView', {
        page: 'County Page',
        county: county.title,
        region: county.region,
        url: wixLocation.url
    });
}

/**
 * Track custom events
 * @param {string} eventName - Event name
 * @param {Object} eventData - Event data
 */
function trackEvent(eventName, eventData) {
    wixWindow.trackEvent(eventName, eventData);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    if ($w('#errorMessage')) {
        $w('#errorMessage').text = message;
        $w('#errorMessage').show();
    }
}

// Export for testing
export { populatePage, setPageSEO };
