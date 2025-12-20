/**
 * Shamrock Bail Bonds - How to Become a Bondsman
 * Educational resource page with Shamrock Bail School lead capture
 * Optimized for informational search traffic
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixCrm from 'wix-crm';

$w.onReady(function () {
  // Initialize the page
  initializePage();
});

/**
 * Main initialization function
 */
function initializePage() {
  // Set up FAQ accordion
  setupFAQAccordion();
  
  // Set up the Shamrock Bail School interest form
  setupInterestForm();
  
  // Set up navigation links
  setupNavigationLinks();
  
  // Animate page elements
  animatePageLoad();
}

/**
 * Set up FAQ accordion functionality
 */
function setupFAQAccordion() {
  // FAQ items
  const faqItems = [
    '#faq1',
    '#faq2',
    '#faq3',
    '#faq4',
    '#faq5'
  ];
  
  faqItems.forEach(faqId => {
    if ($w(faqId)) {
      // Start collapsed
      $w(faqId).collapse();
      
      // Toggle on click
      $w(faqId).onClick(() => {
        if ($w(faqId).collapsed) {
          $w(faqId).expand();
        } else {
          $w(faqId).collapse();
        }
      });
    }
  });
}

/**
 * Set up the Shamrock Bail School interest form
 */
function setupInterestForm() {
  if (!$w('#interestForm')) {
    return;
  }
  
  // Submit button handler
  if ($w('#submitInterestButton')) {
    $w('#submitInterestButton').onClick(() => {
      handleFormSubmission();
    });
  }
  
  // Enable/disable submit button based on form validity
  const formFields = ['#firstNameInput', '#lastNameInput', '#emailInput'];
  
  formFields.forEach(fieldId => {
    if ($w(fieldId)) {
      $w(fieldId).onInput(() => {
        validateForm();
      });
    }
  });
}

/**
 * Validate the interest form
 * @returns {boolean} True if form is valid
 */
function validateForm() {
  let isValid = true;
  
  // Check first name
  if ($w('#firstNameInput')) {
    const firstName = $w('#firstNameInput').value;
    if (!firstName || firstName.trim() === '') {
      isValid = false;
    }
  }
  
  // Check last name
  if ($w('#lastNameInput')) {
    const lastName = $w('#lastNameInput').value;
    if (!lastName || lastName.trim() === '') {
      isValid = false;
    }
  }
  
  // Check email
  if ($w('#emailInput')) {
    const email = $w('#emailInput').value;
    if (!email || !isValidEmail(email)) {
      isValid = false;
    }
  }
  
  // Enable/disable submit button
  if ($w('#submitInterestButton')) {
    if (isValid) {
      $w('#submitInterestButton').enable();
    } else {
      $w('#submitInterestButton').disable();
    }
  }
  
  return isValid;
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Handle form submission
 */
async function handleFormSubmission() {
  // Validate form
  if (!validateForm()) {
    showFormError('Please fill in all required fields.');
    return;
  }
  
  // Get form values
  const firstName = $w('#firstNameInput').value;
  const lastName = $w('#lastNameInput').value;
  const email = $w('#emailInput').value;
  const licensingStage = $w('#licensingStageDropdown') ? $w('#licensingStageDropdown').value : 'Not specified';
  
  // Disable submit button
  if ($w('#submitInterestButton')) {
    $w('#submitInterestButton').disable();
    $w('#submitInterestButton').label = 'Submitting...';
  }
  
  try {
    // Create contact in Wix CRM
    await wixCrm.createContact({
      firstName: firstName,
      lastName: lastName,
      emails: [email]
    });
    
    // Track the lead
    trackLead(firstName, lastName, email, licensingStage);
    
    // Show success message
    showFormSuccess();
    
    // Clear form
    clearForm();
    
  } catch (error) {
    console.error('Error submitting form:', error);
    showFormError('There was an error submitting your information. Please try again or call us at (239) 332-2245.');
    
    // Re-enable submit button
    if ($w('#submitInterestButton')) {
      $w('#submitInterestButton').enable();
      $w('#submitInterestButton').label = 'Notify Me When Enrollment Opens';
    }
  }
}

/**
 * Show form success message
 */
function showFormSuccess() {
  // Hide form
  if ($w('#interestForm')) {
    $w('#interestForm').hide();
  }
  
  // Show success message
  if ($w('#successMessage')) {
    $w('#successMessage').text = 'Thank you for your interest! We will notify you when enrollment opens for the Shamrock Bail School.';
    $w('#successMessage').show();
  }
}

/**
 * Show form error message
 * @param {string} message - Error message to display
 */
function showFormError(message) {
  if ($w('#formErrorMessage')) {
    $w('#formErrorMessage').text = message;
    $w('#formErrorMessage').show();
    
    // Hide error after 5 seconds
    setTimeout(() => {
      $w('#formErrorMessage').hide();
    }, 5000);
  }
}

/**
 * Clear the form
 */
function clearForm() {
  if ($w('#firstNameInput')) {
    $w('#firstNameInput').value = '';
  }
  
  if ($w('#lastNameInput')) {
    $w('#lastNameInput').value = '';
  }
  
  if ($w('#emailInput')) {
    $w('#emailInput').value = '';
  }
  
  if ($w('#licensingStageDropdown')) {
    $w('#licensingStageDropdown').value = '';
  }
}

/**
 * Set up navigation links
 */
function setupNavigationLinks() {
  // Link to Florida DFS website
  if ($w('#dfsLink')) {
    $w('#dfsLink').link = 'https://www.myfloridacfo.com/division/agents/';
    $w('#dfsLink').target = '_blank';
  }
  
  // Link to contact page
  if ($w('#contactUsLink')) {
    $w('#contactUsLink').onClick(() => {
      wixLocation.to('/contact');
    });
  }
  
  // Link to homepage
  if ($w('#homeLink')) {
    $w('#homeLink').onClick(() => {
      wixLocation.to('/');
    });
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
  
  // Fade in the Shamrock Bail School section
  if ($w('#bailSchoolSection')) {
    $w('#bailSchoolSection').hide();
    setTimeout(() => {
      $w('#bailSchoolSection').show('fade', { duration: 600 });
    }, 400);
  }
}

/**
 * Track lead submission
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} email - Email address
 * @param {string} stage - Licensing stage
 */
function trackLead(firstName, lastName, email, stage) {
  console.log(`Lead captured: ${firstName} ${lastName} (${email}) - Stage: ${stage}`);
  
  // TODO: Add analytics tracking
  if (typeof wixAnalytics !== 'undefined') {
    wixAnalytics.trackEvent('Bail School Lead', {
      firstName: firstName,
      lastName: lastName,
      email: email,
      licensingStage: stage
    });
  }
}
