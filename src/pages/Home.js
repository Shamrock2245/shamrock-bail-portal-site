/**
 * Shamrock Bail Bonds - Homepage
 * Mobile-first, conversion-optimized homepage
 */

import { get_featuredCounties } from 'backend/counties-api.web';
import wixWindow from 'wix-window';

$w.onReady(function () {
  // Initialize mobile detection
  const isMobile = wixWindow.formFactor === 'Mobile';
  
  // Load featured counties
  loadFeaturedCounties();
  
  // Set up call button click tracking
  setupCallButtons();
  
  // Set up CTA buttons
  setupCTAButtons();
  
  // Initialize smooth scrolling for mobile
  if (isMobile) {
    initializeMobileOptimizations();
  }
});

/**
 * Load and display featured counties
 */
async function loadFeaturedCounties() {
  try {
    const response = await get_featuredCounties();
    
    if (response.success && response.counties.length > 0) {
      // Populate featured counties repeater
      $w('#featuredCountiesRepeater').data = response.counties;
      
      $w('#featuredCountiesRepeater').onItemReady(($item, itemData) => {
        // Set county name
        $item('#countyNameText').text = itemData.countyName + ' County';
        
        // Set up click handler to navigate to county page
        $item('#countyCard').onClick(() => {
          navigateToCounty(itemData.countySlug);
        });
        
        // Add phone number if available
        if (itemData.bookingPhoneNumber) {
          $item('#countyPhoneText').text = itemData.bookingPhoneNumber;
        }
      });
      
      // Show the counties section
      $w('#featuredCountiesSection').show();
    }
  } catch (error) {
    console.error('Error loading featured counties:', error);
  }
}

/**
 * Navigate to county page
 * @param {string} slug - County slug
 */
function navigateToCounty(slug) {
  wixWindow.openLightbox('CountyPage', { slug: slug });
}

/**
 * Set up call button click handlers
 */
function setupCallButtons() {
  // Primary call button
  if ($w('#callNowButton')) {
    $w('#callNowButton').onClick(() => {
      trackCallClick('Primary CTA');
      window.location.href = 'tel:+12393322245';
    });
  }
  
  // Spanish call button
  if ($w('#callSpanishButton')) {
    $w('#callSpanishButton').onClick(() => {
      trackCallClick('Spanish Line');
      window.location.href = 'tel:+12399550301';
    });
  }
  
  // Sticky mobile call button
  if ($w('#stickyCallButton')) {
    $w('#stickyCallButton').onClick(() => {
      trackCallClick('Sticky Mobile');
      window.location.href = 'tel:+12393322245';
    });
  }
}

/**
 * Set up CTA buttons
 */
function setupCTAButtons() {
  // Start Bail Paperwork button
  if ($w('#startBailButton')) {
    $w('#startBailButton').onClick(() => {
      trackCTAClick('Start Bail Paperwork');
      wixWindow.openLightbox('MemberLogin');
    });
  }
  
  // View All Counties button
  if ($w('#viewAllCountiesButton')) {
    $w('#viewAllCountiesButton').onClick(() => {
      trackCTAClick('View All Counties');
      wixWindow.openPage('/counties');
    });
  }
  
  // Learn More button
  if ($w('#learnMoreButton')) {
    $w('#learnMoreButton').onClick(() => {
      trackCTAClick('Learn More');
      wixWindow.openPage('/how-bail-works');
    });
  }
}

/**
 * Initialize mobile-specific optimizations
 */
function initializeMobileOptimizations() {
  // Ensure sticky call button is visible on mobile
  if ($w('#stickyCallButton')) {
    $w('#stickyCallButton').show();
  }
  
  // Add touch-friendly spacing
  console.log('Mobile optimizations initialized');
}

/**
 * Track call button clicks
 * @param {string} source - Source of the click
 */
function trackCallClick(source) {
  console.log(`Call button clicked: ${source}`);
  // TODO: Add analytics tracking here
}

/**
 * Track CTA button clicks
 * @param {string} action - Action name
 */
function trackCTAClick(action) {
  console.log(`CTA clicked: ${action}`);
  // TODO: Add analytics tracking here
}
