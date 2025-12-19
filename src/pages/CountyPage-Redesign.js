/**
 * Shamrock Bail Bonds - Individual County Page Template
 * Dynamic page for each of the 67 Florida counties
 * Optimized for local SEO and conversion
 */

import { getCountyByName } from 'backend/counties';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';

let currentCounty = null;

$w.onReady(function () {
  // Get county from URL parameter
  const countySlug = wixLocation.path[wixLocation.path.length - 1];
  
  // Initialize the county page
  initializeCountyPage(countySlug);
});

/**
 * Main initialization function
 * @param {string} countySlug - URL slug for the county (e.g., "lee-county")
 */
async function initializeCountyPage(countySlug) {
  // Convert slug to county name
  const countyName = slugToCountyName(countySlug);
  
  // Load county data
  await loadCountyData(countyName);
  
  // Set up page elements
  if (currentCounty) {
    populatePageContent();
    setupCTAButtons();
    setupResourceLinks();
    optimizeSEO();
  } else {
    showCountyNotFound();
  }
}

/**
 * Convert URL slug to county name
 * @param {string} slug - URL slug (e.g., "lee-county")
 * @returns {string} County name (e.g., "Lee")
 */
function slugToCountyName(slug) {
  // Remove "-county" suffix if present
  const cleanSlug = slug.replace(/-county$/i, '');
  
  // Convert to title case
  return cleanSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Load county data from backend
 * @param {string} countyName - Name of the county
 */
async function loadCountyData(countyName) {
  try {
    const response = await getCountyByName(countyName);
    
    if (response.success && response.data) {
      currentCounty = response.data;
      console.log(`Loaded data for ${currentCounty.county_name} County`);
    } else {
      console.error(`County not found: ${countyName}`);
      currentCounty = null;
    }
  } catch (error) {
    console.error('Error loading county data:', error);
    currentCounty = null;
  }
}

/**
 * Populate page content with county data
 */
function populatePageContent() {
  if (!currentCounty) return;
  
  // Page title
  if ($w('#pageTitle')) {
    $w('#pageTitle').text = `Bail Bonds in ${currentCounty.county_name} County, Florida`;
  }
  
  // Introductory text
  if ($w('#introText')) {
    $w('#introText').text = `Shamrock Bail Bonds provides fast, professional bail bond services in ${currentCounty.county_name} County. Available 24/7 to help you or your loved one get released quickly.`;
  }
  
  // County information box
  populateCountyInfoBox();
  
  // Status badge
  if ($w('#statusBadge')) {
    $w('#statusBadge').text = currentCounty.status;
    
    if (currentCounty.status === 'Active') {
      $w('#statusBadge').style.backgroundColor = '#28A745';
    } else {
      $w('#statusBadge').style.backgroundColor = '#6C757D';
    }
  }
  
  // Local content section
  if ($w('#localContentText')) {
    $w('#localContentText').text = generateLocalContent();
  }
}

/**
 * Populate the county information box
 */
function populateCountyInfoBox() {
  // Sheriff's Office info
  if ($w('#sheriffNameText')) {
    $w('#sheriffNameText').text = `${currentCounty.county_name} County Sheriff's Office`;
  }
  
  // Jail address (if available)
  if ($w('#jailAddressText') && currentCounty.jail_address) {
    $w('#jailAddressText').text = currentCounty.jail_address;
    $w('#jailAddressText').show();
  }
  
  // Clerk of Court info
  if ($w('#clerkNameText')) {
    $w('#clerkNameText').text = `${currentCounty.county_name} County Clerk of Court`;
  }
}

/**
 * Generate unique local content for the county
 * @returns {string} Local content text
 */
function generateLocalContent() {
  if (!currentCounty) return '';
  
  const countyName = currentCounty.county_name;
  
  // Generate unique content based on county
  const content = `${countyName} County is served by Shamrock Bail Bonds' statewide network of professional bail agents. We understand the local legal system and work closely with the ${countyName} County Sheriff's Office and Clerk of Court to ensure a smooth, efficient bail process. Our team is available 24 hours a day, 7 days a week to assist you with bail bonds in ${countyName} County.`;
  
  return content;
}

/**
 * Set up CTA buttons
 */
function setupCTAButtons() {
  if (!currentCounty) return;
  
  // Primary CTA - Start Bail Bond
  if ($w('#startBailButton')) {
    $w('#startBailButton').label = `Start Your ${currentCounty.county_name} County Bail Bond`;
    $w('#startBailButton').onClick(() => {
      trackConversion('Start Bail', currentCounty.county_name);
      wixLocation.to('/account/login');
    });
  }
  
  // Call Now button
  if ($w('#callNowButton')) {
    $w('#callNowButton').onClick(() => {
      trackConversion('Call Click', currentCounty.county_name);
      wixLocation.to('tel:+12393322245');
    });
  }
  
  // Back to Directory link
  if ($w('#backToDirectoryLink')) {
    $w('#backToDirectoryLink').onClick(() => {
      wixLocation.to('/florida-county-directory');
    });
  }
}

/**
 * Set up resource links (Sheriff and Clerk)
 */
function setupResourceLinks() {
  if (!currentCounty) return;
  
  // Sheriff's Arrest Search link
  if ($w('#sheriffLink')) {
    if (currentCounty.sheriff_url) {
      $w('#sheriffLink').link = currentCounty.sheriff_url;
      $w('#sheriffLink').target = '_blank';
      $w('#sheriffLink').show();
    } else {
      $w('#sheriffLink').hide();
    }
  }
  
  // Clerk of Court link
  if ($w('#clerkLink')) {
    if (currentCounty.clerk_url) {
      $w('#clerkLink').link = currentCounty.clerk_url;
      $w('#clerkLink').target = '_blank';
      $w('#clerkLink').show();
    } else {
      $w('#clerkLink').hide();
    }
  }
}

/**
 * Optimize SEO for the county page
 */
function optimizeSEO() {
  if (!currentCounty) return;
  
  const countyName = currentCounty.county_name;
  
  // Set page title
  wixSeo.setTitle(`Bail Bonds in ${countyName} County, FL | Shamrock Bail Bonds`);
  
  // Set meta description
  wixSeo.setDescription(
    `24/7 bail bond services in ${countyName} County, Florida. Fast, professional, and confidential. Call (239) 332-2245 for immediate assistance.`
  );
  
  // Set keywords
  wixSeo.setKeywords([
    `${countyName} County bail bonds`,
    `bail bondsman ${countyName} County`,
    `${countyName} bail bonds Florida`,
    'Florida bail bonds',
    'Shamrock Bail Bonds'
  ]);
  
  // Set structured data (LocalBusiness schema)
  wixSeo.setStructuredData([
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `Shamrock Bail Bonds - ${countyName} County`,
      "description": `Professional bail bond services in ${countyName} County, Florida`,
      "telephone": "+1-239-332-2245",
      "areaServed": {
        "@type": "City",
        "name": `${countyName} County`,
        "containedInPlace": {
          "@type": "State",
          "name": "Florida"
        }
      },
      "priceRange": "$$"
    }
  ]);
}

/**
 * Show "county not found" error
 */
function showCountyNotFound() {
  if ($w('#errorSection')) {
    $w('#errorSection').show();
  }
  
  if ($w('#contentSection')) {
    $w('#contentSection').hide();
  }
  
  // Set page title
  wixSeo.setTitle('County Not Found | Shamrock Bail Bonds');
}

/**
 * Track conversion events
 * @param {string} action - Action name
 * @param {string} county - County name
 */
function trackConversion(action, county) {
  console.log(`Conversion: ${action} - ${county} County`);
  
  // TODO: Add analytics tracking
  if (typeof wixAnalytics !== 'undefined') {
    wixAnalytics.trackEvent('County Page Conversion', {
      action: action,
      county: county
    });
  }
}
