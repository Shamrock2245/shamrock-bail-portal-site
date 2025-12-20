/**
 * Shamrock Bail Bonds - Florida County Directory
 * Comprehensive directory of all 67 Florida counties
 * SEO cornerstone page with sheriff and clerk links
 */

import { getCounties, searchCounties } from 'backend/counties';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

let allCounties = [];

$w.onReady(function () {
  // Initialize the directory page
  initializeDirectory();
});

/**
 * Main initialization function
 */
async function initializeDirectory() {
  // Load all counties
  await loadAllCounties();
  
  // Set up search functionality
  setupSearch();
  
  // Set up the interactive map (if present)
  setupInteractiveMap();
  
  // Animate page elements
  animatePageLoad();
}

/**
 * Load all 67 Florida counties
 */
async function loadAllCounties() {
  try {
    const response = await getCounties();
    
    if (response.success && response.data && response.data.counties) {
      allCounties = response.data.counties;
      
      // Display counties in the repeater
      displayCounties(allCounties);
      
      // Update county count
      if ($w('#countyCountText')) {
        $w('#countyCountText').text = `${allCounties.length} Counties`;
      }
      
      console.log(`Loaded ${allCounties.length} counties`);
    }
  } catch (error) {
    console.error('Error loading counties:', error);
    showError('Unable to load county directory. Please try again later.');
  }
}

/**
 * Display counties in the repeater
 * @param {Array} counties - Array of county objects
 */
function displayCounties(counties) {
  if (!$w('#countiesRepeater')) {
    return;
  }
  
  // Sort counties alphabetically
  const sortedCounties = [...counties].sort((a, b) => 
    a.county_name.localeCompare(b.county_name)
  );
  
  // Set repeater data
  $w('#countiesRepeater').data = sortedCounties;
  
  // Configure each repeater item
  $w('#countiesRepeater').onItemReady(($item, itemData) => {
    // County name
    if ($item('#countyName')) {
      $item('#countyName').text = `${itemData.county_name} County`;
    }
    
    // Primary CTA - Bail Bonds in County
    if ($item('#bailBondsButton')) {
      $item('#bailBondsButton').label = `Bail Bonds in ${itemData.county_name}`;
      $item('#bailBondsButton').onClick(() => {
        navigateToCountyPage(itemData.county_name);
      });
    }
    
    // Sheriff's Arrest Search link
    if ($item('#sheriffLink')) {
      if (itemData.sheriff_url) {
        $item('#sheriffLink').link = itemData.sheriff_url;
        $item('#sheriffLink').target = '_blank';
        $item('#sheriffLink').show();
      } else {
        $item('#sheriffLink').hide();
      }
    }
    
    // Clerk of Court link
    if ($item('#clerkLink')) {
      if (itemData.clerk_url) {
        $item('#clerkLink').link = itemData.clerk_url;
        $item('#clerkLink').target = '_blank';
        $item('#clerkLink').show();
      } else {
        $item('#clerkLink').hide();
      }
    }
    
    // Status indicator
    if ($item('#statusBadge')) {
      $item('#statusBadge').text = itemData.status;
      
      // Style based on status
      if (itemData.status === 'Active') {
        $item('#statusBadge').style.backgroundColor = '#28A745';
        $item('#statusBadge').style.color = '#FFFFFF';
      } else {
        $item('#statusBadge').style.backgroundColor = '#F5F7FA';
        $item('#statusBadge').style.color = '#666666';
      }
    }
  });
  
  // Show the repeater
  $w('#countiesRepeater').show();
}

/**
 * Navigate to individual county page
 * @param {string} countyName - Name of the county
 */
function navigateToCountyPage(countyName) {
  const slug = countyName.toLowerCase().replace(/\s+/g, '-');
  
  // Track navigation
  trackCountyView(countyName);
  
  // Navigate to county page
  wixLocation.to(`/bail-bonds/${slug}`);
}

/**
 * Set up search functionality
 */
function setupSearch() {
  if (!$w('#searchInput')) {
    return;
  }
  
  // Real-time search as user types
  $w('#searchInput').onInput(() => {
    const searchTerm = $w('#searchInput').value;
    handleSearch(searchTerm);
  });
  
  // Also handle search button click (if present)
  if ($w('#searchButton')) {
    $w('#searchButton').onClick(() => {
      const searchTerm = $w('#searchInput').value;
      handleSearch(searchTerm);
    });
  }
}

/**
 * Handle search input
 * @param {string} searchTerm - Search term entered by user
 */
async function handleSearch(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    // If search is empty, show all counties
    displayCounties(allCounties);
    return;
  }
  
  try {
    const response = await searchCounties(searchTerm);
    
    if (response.success && response.data) {
      const results = response.data.counties;
      
      // Display filtered results
      displayCounties(results);
      
      // Update results count
      if ($w('#resultsCountText')) {
        $w('#resultsCountText').text = `${results.length} ${results.length === 1 ? 'county' : 'counties'} found`;
        $w('#resultsCountText').show();
      }
      
      // Show "no results" message if needed
      if (results.length === 0 && $w('#noResultsMessage')) {
        $w('#noResultsMessage').show();
      } else if ($w('#noResultsMessage')) {
        $w('#noResultsMessage').hide();
      }
    }
  } catch (error) {
    console.error('Error searching counties:', error);
  }
}

/**
 * Set up interactive Florida map
 */
function setupInteractiveMap() {
  // This would integrate with an SVG map of Florida
  // Each county on the map would be clickable
  
  if ($w('#floridaMap')) {
    // Map interaction logic would go here
    // For now, just log that map is present
    console.log('Interactive map initialized');
  }
}

/**
 * Animate page elements on load
 */
function animatePageLoad() {
  // Fade in the header
  if ($w('#pageHeader')) {
    $w('#pageHeader').hide();
    $w('#pageHeader').show('fade', { duration: 600 });
  }
  
  // Fade in the search bar
  if ($w('#searchSection')) {
    $w('#searchSection').hide();
    setTimeout(() => {
      $w('#searchSection').show('fade', { duration: 600 });
    }, 200);
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  if ($w('#errorMessage')) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
  }
}

/**
 * Track county page views
 * @param {string} countyName - Name of the county
 */
function trackCountyView(countyName) {
  console.log(`County viewed: ${countyName}`);
  
  // TODO: Add analytics tracking
  if (typeof wixAnalytics !== 'undefined') {
    wixAnalytics.trackEvent('County Directory', {
      action: 'View County',
      county: countyName
    });
  }
}
