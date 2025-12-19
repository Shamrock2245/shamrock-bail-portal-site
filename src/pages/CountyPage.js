/**
 * Shamrock Bail Bonds - Dynamic County Page
 * Displays county-specific bail bond information
 */

import { get_countyBySlug } from 'backend/counties-api.web';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

let currentCounty = null;

$w.onReady(function () {
  // Get county slug from URL or lightbox context
  const slug = getCountySlug();
  
  if (slug) {
    loadCountyData(slug);
  } else {
    showError('County not specified');
  }
  
  // Set up button handlers
  setupButtons();
});

/**
 * Get county slug from URL or lightbox
 * @returns {string|null} County slug
 */
function getCountySlug() {
  // Try to get from URL first (for dynamic pages)
  const urlSlug = wixLocation.path[0];
  if (urlSlug) {
    return urlSlug;
  }
  
  // Try to get from lightbox context
  if (wixWindow.lightbox && wixWindow.lightbox.getContext) {
    const context = wixWindow.lightbox.getContext();
    if (context && context.slug) {
      return context.slug;
    }
  }
  
  return null;
}

/**
 * Load county data and populate page
 * @param {string} slug - County slug
 */
async function loadCountyData(slug) {
  try {
    // Show loading state
    showLoading();
    
    const response = await get_countyBySlug(slug);
    
    if (response.success && response.county) {
      currentCounty = response.county;
      populateCountyInfo(currentCounty);
      hideLoading();
    } else {
      showError('County not found');
    }
  } catch (error) {
    console.error('Error loading county:', error);
    showError('Failed to load county information');
  }
}

/**
 * Populate page with county information
 * @param {Object} county - County data object
 */
function populateCountyInfo(county) {
  // Set page title
  $w('#countyNameTitle').text = `${county.countyName} County Bail Bonds`;
  
  // Set meta title for SEO
  wixWindow.setTitle(`${county.countyName} County Bail Bonds | Shamrock Bail Bonds`);
  
  // Set subheading
  $w('#countySubheading').text = `24/7 Bail Bond Services in ${county.countyName} County, Florida`;
  
  // Populate quick info
  if (county.bookingPhoneNumber) {
    $w('#sheriffPhoneText').text = county.bookingPhoneNumber;
    $w('#sheriffPhoneSection').show();
  } else {
    $w('#sheriffPhoneSection').hide();
  }
  
  if (county.clerkPhoneNumber) {
    $w('#clerkPhoneText').text = county.clerkPhoneNumber;
    $w('#clerkPhoneSection').show();
  } else {
    $w('#clerkPhoneSection').hide();
  }
  
  // Set up inmate search button
  if (county.bookingWebsiteLink) {
    $w('#inmateSearchButton').link = county.bookingWebsiteLink;
    $w('#inmateSearchButton').target = '_blank';
    $w('#inmateSearchButton').show();
  } else {
    $w('#inmateSearchButton').hide();
  }
  
  // Set up court records button
  if (county.recordsSearchLink) {
    $w('#courtRecordsButton').link = county.recordsSearchLink;
    $w('#courtRecordsButton').target = '_blank';
    $w('#courtRecordsButton').show();
  } else {
    $w('#courtRecordsButton').hide();
  }
  
  // Populate county-specific content
  $w('#countyContentText').html = generateCountyContent(county);
}

/**
 * Generate county-specific content
 * @param {Object} county - County data
 * @returns {string} HTML content
 */
function generateCountyContent(county) {
  return `
    <h2>Fast Bail Bonds in ${county.countyName} County</h2>
    <p>When someone you care about is arrested in ${county.countyName} County, time is critical. Shamrock Bail Bonds provides fast, professional, and confidential bail bond services 24 hours a day, 7 days a week.</p>
    
    <h3>Why Choose Shamrock for ${county.countyName} County Bail Bonds?</h3>
    <ul>
      <li><strong>Local Expertise:</strong> We know the ${county.countyName} County jail system and court processes inside and out.</li>
      <li><strong>Fast Release:</strong> We work quickly to post bail and secure release as soon as possible.</li>
      <li><strong>Payment Plans:</strong> Flexible payment options to fit your budget.</li>
      <li><strong>24/7 Availability:</strong> Call us anytime, day or night.</li>
      <li><strong>Bilingual Service:</strong> English and Spanish-speaking agents available.</li>
    </ul>
    
    <h3>How to Get Started</h3>
    <p>Call us immediately at <strong>(239) 332-2245</strong>. Our experienced agents will guide you through the bail bond process step by step. We'll need basic information about the person in custody, and we can start the paperwork right away.</p>
    
    <p>For Spanish-speaking assistance, call <strong>(239) 955-0301</strong>.</p>
  `;
}

/**
 * Set up button click handlers
 */
function setupButtons() {
  // Call now button
  $w('#callNowButton').onClick(() => {
    window.location.href = 'tel:+12393322245';
  });
  
  // Start bail paperwork button
  $w('#startBailButton').onClick(() => {
    wixWindow.openLightbox('MemberLogin');
  });
  
  // Back to counties button
  if ($w('#backToCountiesButton')) {
    $w('#backToCountiesButton').onClick(() => {
      wixWindow.openPage('/counties');
    });
  }
}

/**
 * Show loading state
 */
function showLoading() {
  if ($w('#loadingSpinner')) {
    $w('#loadingSpinner').show();
  }
  if ($w('#countyContent')) {
    $w('#countyContent').hide();
  }
}

/**
 * Hide loading state
 */
function hideLoading() {
  if ($w('#loadingSpinner')) {
    $w('#loadingSpinner').hide();
  }
  if ($w('#countyContent')) {
    $w('#countyContent').show();
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  console.error('County page error:', message);
  
  if ($w('#errorMessage')) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
  }
  
  hideLoading();
}
