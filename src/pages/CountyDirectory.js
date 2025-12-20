/**
 * Shamrock Bail Bonds - County Directory Page
 * 
 * Directory of all 67 Florida counties with bail bond services.
 * Includes search/filter functionality and quick access to county pages.
 * 
 * URL: /bail-bonds
 * 
 * Page Elements (Wix Editor IDs):
 * - #countySearch: Search input for filtering counties
 * - #regionFilter: Filter by Florida region
 * - #countyGrid: Grid/repeater of county cards
 * - #countyCount: Display of matching counties
 * - #mapSection: Optional Florida map with clickable regions
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

// All 67 Florida counties with metadata
const floridaCounties = [
    { name: "Alachua", slug: "alachua", region: "north" },
    { name: "Baker", slug: "baker", region: "north" },
    { name: "Bay", slug: "bay", region: "panhandle" },
    { name: "Bradford", slug: "bradford", region: "north" },
    { name: "Brevard", slug: "brevard", region: "central" },
    { name: "Broward", slug: "broward", region: "south" },
    { name: "Calhoun", slug: "calhoun", region: "panhandle" },
    { name: "Charlotte", slug: "charlotte", region: "southwest" },
    { name: "Citrus", slug: "citrus", region: "central" },
    { name: "Clay", slug: "clay", region: "north" },
    { name: "Collier", slug: "collier", region: "southwest" },
    { name: "Columbia", slug: "columbia", region: "north" },
    { name: "DeSoto", slug: "desoto", region: "southwest" },
    { name: "Dixie", slug: "dixie", region: "north" },
    { name: "Duval", slug: "duval", region: "north" },
    { name: "Escambia", slug: "escambia", region: "panhandle" },
    { name: "Flagler", slug: "flagler", region: "north" },
    { name: "Franklin", slug: "franklin", region: "panhandle" },
    { name: "Gadsden", slug: "gadsden", region: "panhandle" },
    { name: "Gilchrist", slug: "gilchrist", region: "north" },
    { name: "Glades", slug: "glades", region: "southwest" },
    { name: "Gulf", slug: "gulf", region: "panhandle" },
    { name: "Hamilton", slug: "hamilton", region: "north" },
    { name: "Hardee", slug: "hardee", region: "central" },
    { name: "Hendry", slug: "hendry", region: "southwest" },
    { name: "Hernando", slug: "hernando", region: "central" },
    { name: "Highlands", slug: "highlands", region: "central" },
    { name: "Hillsborough", slug: "hillsborough", region: "central" },
    { name: "Holmes", slug: "holmes", region: "panhandle" },
    { name: "Indian River", slug: "indian-river", region: "central" },
    { name: "Jackson", slug: "jackson", region: "panhandle" },
    { name: "Jefferson", slug: "jefferson", region: "panhandle" },
    { name: "Lafayette", slug: "lafayette", region: "north" },
    { name: "Lake", slug: "lake", region: "central" },
    { name: "Lee", slug: "lee", region: "southwest" },
    { name: "Leon", slug: "leon", region: "panhandle" },
    { name: "Levy", slug: "levy", region: "north" },
    { name: "Liberty", slug: "liberty", region: "panhandle" },
    { name: "Madison", slug: "madison", region: "north" },
    { name: "Manatee", slug: "manatee", region: "central" },
    { name: "Marion", slug: "marion", region: "central" },
    { name: "Martin", slug: "martin", region: "south" },
    { name: "Miami-Dade", slug: "miami-dade", region: "south" },
    { name: "Monroe", slug: "monroe", region: "south" },
    { name: "Nassau", slug: "nassau", region: "north" },
    { name: "Okaloosa", slug: "okaloosa", region: "panhandle" },
    { name: "Okeechobee", slug: "okeechobee", region: "central" },
    { name: "Orange", slug: "orange", region: "central" },
    { name: "Osceola", slug: "osceola", region: "central" },
    { name: "Palm Beach", slug: "palm-beach", region: "south" },
    { name: "Pasco", slug: "pasco", region: "central" },
    { name: "Pinellas", slug: "pinellas", region: "central" },
    { name: "Polk", slug: "polk", region: "central" },
    { name: "Putnam", slug: "putnam", region: "north" },
    { name: "Santa Rosa", slug: "santa-rosa", region: "panhandle" },
    { name: "Sarasota", slug: "sarasota", region: "southwest" },
    { name: "Seminole", slug: "seminole", region: "central" },
    { name: "St. Johns", slug: "st-johns", region: "north" },
    { name: "St. Lucie", slug: "st-lucie", region: "central" },
    { name: "Sumter", slug: "sumter", region: "central" },
    { name: "Suwannee", slug: "suwannee", region: "north" },
    { name: "Taylor", slug: "taylor", region: "north" },
    { name: "Union", slug: "union", region: "north" },
    { name: "Volusia", slug: "volusia", region: "central" },
    { name: "Wakulla", slug: "wakulla", region: "panhandle" },
    { name: "Walton", slug: "walton", region: "panhandle" },
    { name: "Washington", slug: "washington", region: "panhandle" }
];

const regions = [
    { value: "all", label: "All Regions" },
    { value: "panhandle", label: "Panhandle" },
    { value: "north", label: "North Florida" },
    { value: "central", label: "Central Florida" },
    { value: "southwest", label: "Southwest Florida" },
    { value: "south", label: "South Florida" }
];

let currentFilter = {
    search: '',
    region: 'all'
};

$w.onReady(function () {
    initializePage();
    setupEventListeners();
    displayCounties(floridaCounties);
});

/**
 * Initialize the page
 */
function initializePage() {
    // Set up region filter dropdown
    if ($w('#regionFilter').valid) {
        $w('#regionFilter').options = regions;
        $w('#regionFilter').value = 'all';
    }
    
    // Update county count
    updateCountyCount(floridaCounties.length);
    
    // Track page view
    trackEvent('PageView', { page: 'CountyDirectory' });
    
    // Set SEO
    setPageSEO();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search input
    if ($w('#countySearch').valid) {
        $w('#countySearch').onInput((event) => {
            currentFilter.search = event.target.value.toLowerCase();
            filterAndDisplayCounties();
        });
        
        // Clear search button
        $w('#clearSearchBtn').onClick(() => {
            $w('#countySearch').value = '';
            currentFilter.search = '';
            filterAndDisplayCounties();
        });
    }
    
    // Region filter
    if ($w('#regionFilter').valid) {
        $w('#regionFilter').onChange((event) => {
            currentFilter.region = event.target.value;
            filterAndDisplayCounties();
            trackEvent('Filter_Change', { filter: 'region', value: event.target.value });
        });
    }
    
    // Alphabetical quick links
    setupAlphabetLinks();
    
    // CTA buttons
    $w('#callNowBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'call_now', page: 'county_directory' });
        wixLocation.to('tel:+12393322245');
    });
    
    $w('#startBailBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'start_bail', page: 'county_directory' });
        wixLocation.to('/members/start-bail');
    });
}

/**
 * Set up alphabetical quick navigation
 */
function setupAlphabetLinks() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    // Get unique first letters from counties
    const availableLetters = [...new Set(floridaCounties.map(c => c.name[0].toUpperCase()))];
    
    alphabet.forEach(letter => {
        const selector = `#letter${letter}`;
        if ($w(selector).valid) {
            if (availableLetters.includes(letter)) {
                $w(selector).enable();
                $w(selector).onClick(() => {
                    scrollToLetter(letter);
                    trackEvent('Alphabet_Click', { letter });
                });
            } else {
                $w(selector).disable();
            }
        }
    });
}

/**
 * Scroll to counties starting with a specific letter
 */
function scrollToLetter(letter) {
    // Find first county starting with this letter
    const firstCounty = floridaCounties.find(c => c.name[0].toUpperCase() === letter);
    if (firstCounty) {
        // Scroll to the county card
        const cardSelector = `#county-${firstCounty.slug}`;
        if ($w(cardSelector).valid) {
            $w(cardSelector).scrollTo();
        }
    }
}

/**
 * Filter counties based on current filters
 */
function filterAndDisplayCounties() {
    let filtered = floridaCounties;
    
    // Apply search filter
    if (currentFilter.search) {
        filtered = filtered.filter(county => 
            county.name.toLowerCase().includes(currentFilter.search)
        );
    }
    
    // Apply region filter
    if (currentFilter.region !== 'all') {
        filtered = filtered.filter(county => 
            county.region === currentFilter.region
        );
    }
    
    displayCounties(filtered);
    updateCountyCount(filtered.length);
}

/**
 * Display counties in the grid
 */
function displayCounties(counties) {
    if ($w('#countyRepeater').valid) {
        // Add unique _id for repeater
        const countiesWithId = counties.map((county, index) => ({
            ...county,
            _id: county.slug
        }));
        
        $w('#countyRepeater').data = countiesWithId;
        
        $w('#countyRepeater').onItemReady(($item, itemData) => {
            // Set county name
            $item('#countyCardName').text = itemData.name;
            
            // Set region badge
            $item('#countyCardRegion').text = formatRegionName(itemData.region);
            
            // Set click handler for entire card
            $item('#countyCard').onClick(() => {
                trackEvent('County_Click', { county: itemData.name });
                wixLocation.to(`/bail-bonds/${itemData.slug}-county`);
            });
            
            // Set link for accessibility
            $item('#countyCardLink').link = `/bail-bonds/${itemData.slug}-county`;
        });
    }
    
    // Show/hide no results message
    if (counties.length === 0) {
        $w('#noResultsMessage').show();
        $w('#countyRepeater').hide();
    } else {
        $w('#noResultsMessage').hide();
        $w('#countyRepeater').show();
    }
}

/**
 * Update the county count display
 */
function updateCountyCount(count) {
    if ($w('#countyCount').valid) {
        if (count === floridaCounties.length) {
            $w('#countyCount').text = `All ${count} Florida Counties`;
        } else {
            $w('#countyCount').text = `${count} ${count === 1 ? 'County' : 'Counties'} Found`;
        }
    }
}

/**
 * Format region name for display
 */
function formatRegionName(region) {
    const regionNames = {
        'panhandle': 'Panhandle',
        'north': 'North FL',
        'central': 'Central FL',
        'southwest': 'Southwest FL',
        'south': 'South FL'
    };
    return regionNames[region] || region;
}

/**
 * Set page SEO metadata
 */
function setPageSEO() {
    import('wix-seo').then((wixSEO) => {
        wixSEO.title = "Florida Bail Bonds by County | All 67 Counties | Shamrock Bail Bonds";
        
        wixSEO.metaTags = [
            { 
                name: "description", 
                content: "Find bail bond services in any Florida county. Shamrock Bail Bonds serves all 67 Florida counties with 24/7 professional bail bond services. Fast release, flexible payments."
            },
            { 
                name: "keywords", 
                content: "Florida bail bonds, bail bonds by county, Florida counties bail, bail bondsman Florida"
            }
        ];
    });
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

// Export for testing
export { filterAndDisplayCounties, displayCounties, floridaCounties };
