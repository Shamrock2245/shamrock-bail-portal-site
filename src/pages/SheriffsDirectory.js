/**
 * Shamrock Bail Bonds - Florida Sheriffs & Clerks Directory
 * 
 * Comprehensive directory of all 67 Florida county sheriffs and clerks.
 * Includes booking search links, phone numbers, and court records access.
 * 
 * URL: /florida-sheriffs-clerks-directory
 * 
 * Page Elements (Wix Editor IDs):
 * - #directorySearch: Search input
 * - #regionFilter: Region filter dropdown
 * - #directoryTable: Main directory table/repeater
 * - #countyCount: Display of matching counties
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getAllCounties, getCountiesByRegion, searchCounties } from 'public/countyUtils.js';

let allCounties = [];
let filteredCounties = [];
let currentRegion = 'all';
let searchQuery = '';

$w.onReady(function () {
    initializePage();
    setupEventListeners();
    loadDirectory();
});

/**
 * Initialize page
 */
function initializePage() {
    // Load all counties
    allCounties = getAllCounties();
    filteredCounties = [...allCounties];
    
    // Set up region filter
    $w('#regionFilter').options = [
        { value: 'all', label: 'All Regions' },
        { value: 'panhandle', label: 'Panhandle' },
        { value: 'north', label: 'North Florida' },
        { value: 'central', label: 'Central Florida' },
        { value: 'southwest', label: 'Southwest Florida' },
        { value: 'south', label: 'South Florida' }
    ];
    $w('#regionFilter').value = 'all';
    
    // Track page view
    trackEvent('PageView', { page: 'SheriffsDirectory' });
    
    // Set SEO
    setPageSEO();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search input
    $w('#directorySearch').onInput((event) => {
        searchQuery = event.target.value.toLowerCase();
        filterDirectory();
    });
    
    // Clear search
    $w('#clearSearchBtn').onClick(() => {
        searchQuery = '';
        $w('#directorySearch').value = '';
        filterDirectory();
    });
    
    // Region filter
    $w('#regionFilter').onChange((event) => {
        currentRegion = event.target.value;
        filterDirectory();
        trackEvent('Directory_Filter', { region: currentRegion });
    });
    
    // Alphabetical quick links
    setupAlphabetLinks();
    
    // Print button
    $w('#printBtn').onClick(() => {
        wixWindow.openLightbox('PrintDirectory', { counties: filteredCounties });
    });
    
    // Download button
    $w('#downloadBtn').onClick(() => {
        downloadDirectory();
    });
}

/**
 * Set up alphabetical quick navigation
 */
function setupAlphabetLinks() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const availableLetters = [...new Set(allCounties.map(c => c.name[0].toUpperCase()))];
    
    alphabet.forEach(letter => {
        const selector = `#letter${letter}`;
        if ($w(selector).valid) {
            if (availableLetters.includes(letter)) {
                $w(selector).enable();
                $w(selector).onClick(() => {
                    scrollToLetter(letter);
                    trackEvent('Alphabet_Click', { letter, page: 'directory' });
                });
            } else {
                $w(selector).disable();
            }
        }
    });
}

/**
 * Scroll to counties starting with a letter
 */
function scrollToLetter(letter) {
    const firstCounty = filteredCounties.find(c => c.name[0].toUpperCase() === letter);
    if (firstCounty) {
        const rowSelector = `#row-${firstCounty.slug}`;
        if ($w(rowSelector).valid) {
            $w(rowSelector).scrollTo();
        }
    }
}

/**
 * Filter directory based on search and region
 */
function filterDirectory() {
    filteredCounties = allCounties;
    
    // Apply region filter
    if (currentRegion !== 'all') {
        filteredCounties = filteredCounties.filter(county => county.region === currentRegion);
    }
    
    // Apply search filter
    if (searchQuery) {
        filteredCounties = filteredCounties.filter(county =>
            county.name.toLowerCase().includes(searchQuery)
        );
    }
    
    // Update display
    displayDirectory();
    updateCountyCount();
}

/**
 * Load and display directory
 */
function loadDirectory() {
    displayDirectory();
    updateCountyCount();
}

/**
 * Display directory in table/repeater
 */
function displayDirectory() {
    if ($w('#directoryRepeater').valid) {
        if (filteredCounties.length > 0) {
            // Sort alphabetically
            const sortedCounties = [...filteredCounties].sort((a, b) => 
                a.name.localeCompare(b.name)
            );
            
            // Add unique _id for repeater
            const countiesWithId = sortedCounties.map(county => ({
                ...county,
                _id: county.slug
            }));
            
            $w('#directoryRepeater').data = countiesWithId;
            
            $w('#directoryRepeater').onItemReady(($item, itemData) => {
                // County name
                $item('#countyName').text = `${itemData.name} County`;
                
                // Region badge
                $item('#regionBadge').text = formatRegionName(itemData.region);
                
                // Sheriff/Booking info
                $item('#sheriffLink').link = itemData.bookingUrl;
                $item('#sheriffLink').target = '_blank';
                $item('#sheriffLink').label = 'Inmate Search';
                
                $item('#sheriffPhone').text = itemData.bookingPhone;
                $item('#sheriffPhoneLink').link = `tel:${itemData.bookingPhone.replace(/\D/g, '')}`;
                
                // Clerk info
                $item('#clerkLink').link = itemData.clerkUrl;
                $item('#clerkLink').target = '_blank';
                $item('#clerkLink').label = 'Clerk Website';
                
                $item('#clerkPhone').text = itemData.clerkPhone;
                $item('#clerkPhoneLink').link = `tel:${itemData.clerkPhone.replace(/\D/g, '')}`;
                
                // Records link
                $item('#recordsLink').link = itemData.recordsUrl;
                $item('#recordsLink').target = '_blank';
                $item('#recordsLink').label = 'Court Records';
                
                // County page link
                $item('#countyPageLink').link = `/bail-bonds/${itemData.slug}-county`;
                
                // Track external link clicks
                $item('#sheriffLink').onClick(() => {
                    trackEvent('External_Link', { 
                        type: 'sheriff', 
                        county: itemData.name 
                    });
                });
                
                $item('#clerkLink').onClick(() => {
                    trackEvent('External_Link', { 
                        type: 'clerk', 
                        county: itemData.name 
                    });
                });
                
                $item('#recordsLink').onClick(() => {
                    trackEvent('External_Link', { 
                        type: 'records', 
                        county: itemData.name 
                    });
                });
            });
            
            $w('#noResultsMessage').hide();
            $w('#directoryRepeater').show();
        } else {
            $w('#directoryRepeater').data = [];
            $w('#noResultsMessage').show();
            $w('#noResultsMessage').text = searchQuery 
                ? `No counties found matching "${searchQuery}"`
                : 'No counties found in this region.';
        }
    }
}

/**
 * Update county count display
 */
function updateCountyCount() {
    const total = allCounties.length;
    const filtered = filteredCounties.length;
    
    if (filtered === total) {
        $w('#countyCount').text = `All ${total} Florida Counties`;
    } else {
        $w('#countyCount').text = `${filtered} of ${total} Counties`;
    }
}

/**
 * Format region name
 */
function formatRegionName(region) {
    const names = {
        'panhandle': 'Panhandle',
        'north': 'North FL',
        'central': 'Central FL',
        'southwest': 'Southwest FL',
        'south': 'South FL'
    };
    return names[region] || region;
}

/**
 * Download directory as CSV
 */
function downloadDirectory() {
    // Create CSV content
    const headers = ['County', 'Region', 'Sheriff Phone', 'Booking URL', 'Clerk Phone', 'Clerk URL', 'Records URL'];
    const rows = filteredCounties.map(county => [
        county.name,
        formatRegionName(county.region),
        county.bookingPhone,
        county.bookingUrl,
        county.clerkPhone,
        county.clerkUrl,
        county.recordsUrl
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'florida-sheriffs-clerks-directory.csv';
    link.click();
    
    trackEvent('Directory_Download', { 
        format: 'csv',
        count: filteredCounties.length 
    });
}

/**
 * Set page SEO
 */
function setPageSEO() {
    import('wix-seo').then((wixSEO) => {
        wixSEO.title = 'Florida Sheriffs & Clerks Directory | All 67 Counties | Shamrock Bail Bonds';
        
        wixSEO.metaTags = [
            {
                name: "description",
                content: "Complete directory of all 67 Florida county sheriffs and clerks. Find inmate search links, booking phone numbers, clerk contacts, and court records access."
            },
            {
                name: "keywords",
                content: "Florida sheriffs directory, Florida clerks directory, county jail phone numbers, inmate search Florida, court records Florida"
            }
        ];
    });
}

/**
 * Track events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

export { filterDirectory, displayDirectory, downloadDirectory };
