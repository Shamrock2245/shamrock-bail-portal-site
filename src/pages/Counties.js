/**
 * Shamrock Bail Bonds - Counties Directory Page
 * Displays all 67 Florida counties with search functionality
 */

import { get_allCounties, post_searchCounties } from 'backend/counties-api.web';
import wixWindow from 'wix-window';

let allCounties = [];
let filteredCounties = [];

$w.onReady(function () {
  // Load all counties
  loadAllCounties();
  
  // Set up search functionality
  setupSearch();
  
  // Set up mobile optimizations
  initializeMobileView();
});

/**
 * Load all counties
 */
async function loadAllCounties() {
  try {
    showLoading();
    
    const response = await get_allCounties();
    
    if (response.success && response.counties) {
      allCounties = response.counties;
      filteredCounties = allCounties;
      
      displayCounties(filteredCounties);
      updateCountyCount(filteredCounties.length);
      
      hideLoading();
    } else {
      showError('Failed to load counties');
    }
  } catch (error) {
    console.error('Error loading counties:', error);
    showError('An error occurred while loading counties');
  }
}

/**
 * Display counties in repeater
 * @param {Array} counties - Array of county objects
 */
function displayCounties(counties) {
  $w('#countiesRepeater').data = counties;
  
  $w('#countiesRepeater').onItemReady(($item, itemData) => {
    // Set county name
    $item('#countyNameText').text = itemData.countyName + ' County';
    
    // Set sheriff phone
    if (itemData.bookingPhoneNumber) {
      $item('#sheriffPhoneText').text = `Sheriff: ${itemData.bookingPhoneNumber}`;
      $item('#sheriffPhoneText').show();
    } else {
      $item('#sheriffPhoneText').hide();
    }
    
    // Set clerk phone
    if (itemData.clerkPhoneNumber) {
      $item('#clerkPhoneText').text = `Clerk: ${itemData.clerkPhoneNumber}`;
      $item('#clerkPhoneText').show();
    } else {
      $item('#clerkPhoneText').hide();
    }
    
    // Set featured badge
    if (itemData.featured) {
      $item('#featuredBadge').show();
    } else {
      $item('#featuredBadge').hide();
    }
    
    // Set up click handler
    $item('#countyCard').onClick(() => {
      navigateToCounty(itemData.countySlug);
    });
    
    // Set up inmate search button
    if (itemData.bookingWebsiteLink) {
      $item('#inmateSearchBtn').link = itemData.bookingWebsiteLink;
      $item('#inmateSearchBtn').target = '_blank';
      $item('#inmateSearchBtn').show();
    } else {
      $item('#inmateSearchBtn').hide();
    }
  });
  
  // Show repeater
  $w('#countiesRepeater').show();
}

/**
 * Set up search functionality
 */
function setupSearch() {
  // Search input
  $w('#countySearchInput').onInput((event) => {
    const searchTerm = event.target.value.trim();
    
    if (searchTerm.length === 0) {
      // Show all counties if search is empty
      filteredCounties = allCounties;
    } else {
      // Filter counties by name
      filteredCounties = allCounties.filter(county => 
        county.countyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    displayCounties(filteredCounties);
    updateCountyCount(filteredCounties.length);
  });
  
  // Clear search button
  if ($w('#clearSearchButton')) {
    $w('#clearSearchButton').onClick(() => {
      $w('#countySearchInput').value = '';
      filteredCounties = allCounties;
      displayCounties(filteredCounties);
      updateCountyCount(filteredCounties.length);
    });
  }
}

/**
 * Navigate to county page
 * @param {string} slug - County slug
 */
function navigateToCounty(slug) {
  wixWindow.openPage(`/counties/${slug}`);
}

/**
 * Update county count display
 * @param {number} count - Number of counties
 */
function updateCountyCount(count) {
  if ($w('#countyCountText')) {
    $w('#countyCountText').text = `Showing ${count} of ${allCounties.length} counties`;
  }
}

/**
 * Initialize mobile view optimizations
 */
function initializeMobileView() {
  const isMobile = wixWindow.formFactor === 'Mobile';
  
  if (isMobile) {
    // Adjust layout for mobile
    console.log('Mobile view initialized for counties page');
  }
}

/**
 * Show loading state
 */
function showLoading() {
  if ($w('#loadingSpinner')) {
    $w('#loadingSpinner').show();
  }
  if ($w('#countiesRepeater')) {
    $w('#countiesRepeater').hide();
  }
}

/**
 * Hide loading state
 */
function hideLoading() {
  if ($w('#loadingSpinner')) {
    $w('#loadingSpinner').hide();
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  console.error('Counties page error:', message);
  
  if ($w('#errorMessage')) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
  }
  
  hideLoading();
}
