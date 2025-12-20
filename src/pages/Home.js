/**
 * Shamrock Bail Bonds - Redesigned Homepage
 * Conversion-focused design with immediate action form
 * Inspired by bailbondsnow.org with professional Shamrock aesthetic
 */

import { getCounties } from 'backend/counties';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

$w.onReady(function () {
  // Initialize the page
  initializeHomepage();
});

/**
 * Main initialization function
 */
async function initializeHomepage() {
  // Load counties for the dropdown
  await loadCountyDropdown();
  
  // Set up the action form
  setupActionForm();
  
  // Set up all CTAs
  setupCTAButtons();
  
  // Set up phone number links
  setupPhoneLinks();
  
  // Initialize trust indicators animation
  animateTrustIndicators();
  
  // Set up testimonials carousel (if present)
  setupTestimonialsCarousel();
}

/**
 * Load all Florida counties into the dropdown selector
 */
async function loadCountyDropdown() {
  try {
    const response = await getCounties();
    
    if (response.success && response.data && response.data.counties) {
      const counties = response.data.counties;
      
      // Create dropdown options
      const options = counties.map(county => ({
        label: `${county.county_name} County`,
        value: county.county_name.toLowerCase().replace(/\s+/g, '-')
      }));
      
      // Sort alphabetically
      options.sort((a, b) => a.label.localeCompare(b.label));
      
      // Populate the dropdown
      if ($w('#countyDropdown')) {
        $w('#countyDropdown').options = options;
        
        // Set placeholder
        $w('#countyDropdown').placeholder = 'Select a county...';
      }
      
      console.log(`Loaded ${counties.length} counties into dropdown`);
    }
  } catch (error) {
    console.error('Error loading counties:', error);
    
    // Show error message to user
    if ($w('#errorMessage')) {
      $w('#errorMessage').text = 'Unable to load counties. Please call us at (239) 332-2245.';
      $w('#errorMessage').show();
    }
  }
}

/**
 * Set up the main action form (county selector + Get Started button)
 */
function setupActionForm() {
  if ($w('#getStartedButton')) {
    $w('#getStartedButton').onClick(() => {
      handleGetStarted();
    });
  }
  
  // Enable button only when county is selected
  if ($w('#countyDropdown')) {
    $w('#countyDropdown').onChange(() => {
      const selectedValue = $w('#countyDropdown').value;
      
      if ($w('#getStartedButton')) {
        // Enable button when selection is made
        if (selectedValue) {
          $w('#getStartedButton').enable();
        } else {
          $w('#getStartedButton').disable();
        }
      }
    });
    
    // Start with button disabled
    if ($w('#getStartedButton')) {
      $w('#getStartedButton').disable();
    }
  }
}

/**
 * Handle Get Started button click
 */
function handleGetStarted() {
  if ($w('#countyDropdown')) {
    const selectedCounty = $w('#countyDropdown').value;
    
    if (selectedCounty) {
      // Track the conversion
      trackConversion('County Selected', selectedCounty);
      
      // Navigate to the county-specific page
      wixLocation.to(`/bail-bonds/${selectedCounty}`);
    } else {
      // Show error if no county selected
      if ($w('#errorMessage')) {
        $w('#errorMessage').text = 'Please select a county to continue.';
        $w('#errorMessage').show();
        
        // Hide error after 3 seconds
        setTimeout(() => {
          $w('#errorMessage').hide();
        }, 3000);
      }
    }
  }
}

/**
 * Set up all CTA buttons on the page
 */
function setupCTAButtons() {
  // Member Login button
  if ($w('#memberLoginButton')) {
    $w('#memberLoginButton').onClick(() => {
      trackCTAClick('Member Login');
      wixLocation.to('/account/login');
    });
  }
  
  // Learn More About Bail button
  if ($w('#learnMoreButton')) {
    $w('#learnMoreButton').onClick(() => {
      trackCTAClick('Learn More');
      wixLocation.to('/how-bail-works');
    });
  }
  
  // View County Directory button
  if ($w('#viewDirectoryButton')) {
    $w('#viewDirectoryButton').onClick(() => {
      trackCTAClick('View Directory');
      wixLocation.to('/florida-county-directory');
    });
  }
  
  // Why Choose Us button
  if ($w('#whyChooseUsButton')) {
    $w('#whyChooseUsButton').onClick(() => {
      trackCTAClick('Why Choose Us');
      wixLocation.to('/why-us');
    });
  }
}

/**
 * Set up phone number links (clickable on mobile)
 */
function setupPhoneLinks() {
  const phoneNumber = '(239) 332-2245';
  const phoneHref = 'tel:+12393322245';
  
  // Primary call button
  if ($w('#callNowButton')) {
    $w('#callNowButton').onClick(() => {
      trackCallClick('Primary Header');
      wixLocation.to(phoneHref);
    });
  }
  
  // Alternative call link in hero
  if ($w('#heroCallLink')) {
    $w('#heroCallLink').onClick(() => {
      trackCallClick('Hero Section');
      wixLocation.to(phoneHref);
    });
  }
  
  // Sticky mobile call button (if present)
  if ($w('#stickyCallButton')) {
    $w('#stickyCallButton').onClick(() => {
      trackCallClick('Sticky Mobile');
      wixLocation.to(phoneHref);
    });
    
    // Show only on mobile
    if (wixWindow.formFactor === 'Mobile') {
      $w('#stickyCallButton').show();
    } else {
      $w('#stickyCallButton').hide();
    }
  }
}

/**
 * Animate trust indicators on page load
 */
function animateTrustIndicators() {
  // Fade in trust indicators with stagger effect
  const indicators = ['#trustIndicator1', '#trustIndicator2', '#trustIndicator3', '#trustIndicator4'];
  
  indicators.forEach((id, index) => {
    if ($w(id)) {
      // Start hidden
      $w(id).hide();
      
      // Fade in with delay
      setTimeout(() => {
        $w(id).show('fade', { duration: 600 });
      }, index * 150);
    }
  });
}

/**
 * Set up testimonials carousel (if present)
 */
function setupTestimonialsCarousel() {
  if ($w('#testimonialsSlideshow')) {
    // Auto-play testimonials
    $w('#testimonialsSlideshow').play();
    
    // Set transition duration
    $w('#testimonialsSlideshow').autoPlayInterval = 5000;
  }
}

/**
 * Track conversion events
 * @param {string} event - Event name
 * @param {string} value - Event value
 */
function trackConversion(event, value) {
  console.log(`Conversion: ${event} - ${value}`);
  
  // TODO: Integrate with analytics platform
  // Example: Google Analytics, Facebook Pixel, etc.
  
  // If using Wix Analytics
  if (typeof wixAnalytics !== 'undefined') {
    wixAnalytics.trackEvent('Conversion', {
      event: event,
      value: value
    });
  }
}

/**
 * Track CTA button clicks
 * @param {string} action - Action name
 */
function trackCTAClick(action) {
  console.log(`CTA clicked: ${action}`);
  
  // TODO: Add analytics tracking
}

/**
 * Track call button clicks
 * @param {string} source - Source of the click
 */
function trackCallClick(source) {
  console.log(`Call button clicked: ${source}`);
  
  // TODO: Add analytics tracking
}
