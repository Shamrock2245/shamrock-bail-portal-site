/**
 * Shamrock Bail Bonds - Defendant Portal Dashboard
 * Secure area for defendants to complete paperwork and manage their case
 */

import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

let currentUser = null;

$w.onReady(function () {
  // Ensure user is logged in
  if (!wixUsers.currentUser.loggedIn) {
    wixLocation.to('/members');
    return;
  }
  
  // Initialize dashboard
  initializeDashboard();
  
  // Set up action buttons
  setupActionButtons();
});

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
  try {
    currentUser = wixUsers.currentUser;
    
    // Display welcome message
    const userEmail = await currentUser.getEmail();
    $w('#welcomeText').text = `Welcome, ${userEmail}`;
    
    // Load user's case status
    loadCaseStatus();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
  }
}

/**
 * Load case status
 */
async function loadCaseStatus() {
  try {
    // TODO: Query user's case data from database
    // For now, show default status
    
    $w('#caseStatusText').text = 'Awaiting Paperwork';
    $w('#statusIndicator').style.backgroundColor = '#E3B448'; // Gold
    
    // Show appropriate next steps
    showNextSteps('awaiting_paperwork');
    
  } catch (error) {
    console.error('Error loading case status:', error);
  }
}

/**
 * Show next steps based on case status
 * @param {string} status - Current case status
 */
function showNextSteps(status) {
  let nextStepsHTML = '';
  
  switch (status) {
    case 'awaiting_paperwork':
      nextStepsHTML = `
        <h3>Next Steps:</h3>
        <ol>
          <li><strong>Review Consent & Permissions:</strong> We need your consent to proceed with the bail process.</li>
          <li><strong>Complete Bail Paperwork:</strong> Click the button below to start your secure paperwork via SignNow.</li>
          <li><strong>Wait for Approval:</strong> Once submitted, we'll review and process your bail bond immediately.</li>
        </ol>
        <p><strong>Important:</strong> Have your ID ready and ensure you're in a location where you can provide geolocation consent if required.</p>
      `;
      break;
      
    case 'paperwork_submitted':
      nextStepsHTML = `
        <h3>Paperwork Submitted</h3>
        <p>Your paperwork has been received and is being reviewed. We'll contact you shortly.</p>
      `;
      break;
      
    case 'bond_posted':
      nextStepsHTML = `
        <h3>Bond Posted</h3>
        <p>Your bond has been posted. Release is in progress.</p>
      `;
      break;
      
    default:
      nextStepsHTML = `<p>Loading status...</p>`;
  }
  
  $w('#nextStepsBox').html = nextStepsHTML;
}

/**
 * Set up action buttons
 */
function setupActionButtons() {
  // Start Bail Paperwork button (primary CTA)
  $w('#startPaperworkButton').onClick(() => {
    handleStartPaperwork();
  });
  
  // Contact Agent button
  if ($w('#contactAgentButton')) {
    $w('#contactAgentButton').onClick(() => {
      window.location.href = 'tel:+12393322245';
    });
  }
  
  // Upload Documents button
  if ($w('#uploadDocsButton')) {
    $w('#uploadDocsButton').onClick(() => {
      handleUploadDocuments();
    });
  }
  
  // Make Payment button
  if ($w('#makePaymentButton')) {
    $w('#makePaymentButton').onClick(() => {
      handleMakePayment();
    });
  }
  
  // Logout button
  if ($w('#logoutButton')) {
    $w('#logoutButton').onClick(() => {
      wixUsers.logout();
      wixLocation.to('/');
    });
  }
}

/**
 * Handle Start Bail Paperwork action
 * This is the critical handoff point to SignNow
 */
async function handleStartPaperwork() {
  try {
    // Show consent modal first
    const consentGiven = await showConsentModal();
    
    if (!consentGiven) {
      return;
    }
    
    // Request geolocation if needed
    const locationGranted = await requestGeolocation();
    
    if (!locationGranted) {
      showError('Location permission is required to proceed with bail paperwork.');
      return;
    }
    
    // All permissions granted - handoff to SignNow
    initiateSignNowHandoff();
    
  } catch (error) {
    console.error('Error starting paperwork:', error);
    showError('Failed to start paperwork. Please try again or call us at (239) 332-2245.');
  }
}

/**
 * Show consent modal
 * @returns {Promise<boolean>} True if consent given
 */
async function showConsentModal() {
  return new Promise((resolve) => {
    wixWindow.openLightbox('ConsentModal').then((result) => {
      resolve(result === 'accepted');
    });
  });
}

/**
 * Request geolocation permission
 * @returns {Promise<boolean>} True if permission granted
 */
async function requestGeolocation() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location granted:', position.coords);
          resolve(true);
        },
        (error) => {
          console.error('Location denied:', error);
          resolve(false);
        }
      );
    } else {
      resolve(false);
    }
  });
}

/**
 * Initiate SignNow handoff
 * FROM THIS MOMENT: SignNow owns the paperwork experience
 */
function initiateSignNowHandoff() {
  // Show loading
  showLoading('Preparing your secure paperwork...');
  
  // TODO: Call backend to generate SignNow session
  // This should create a SignNow document and return the signing URL
  
  // For now, show placeholder
  setTimeout(() => {
    hideLoading();
    showSuccess('Paperwork session ready! Redirecting to secure signing...');
    
    // TODO: Redirect to actual SignNow URL
    // window.location.href = signNowUrl;
  }, 2000);
}

/**
 * Handle upload documents
 */
function handleUploadDocuments() {
  wixWindow.openLightbox('UploadDocuments');
}

/**
 * Handle make payment
 */
function handleMakePayment() {
  wixWindow.openLightbox('PaymentOptions');
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoading(message) {
  if ($w('#loadingOverlay')) {
    $w('#loadingMessage').text = message;
    $w('#loadingOverlay').show();
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  if ($w('#loadingOverlay')) {
    $w('#loadingOverlay').hide();
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  if ($w('#successMessage')) {
    $w('#successMessage').text = message;
    $w('#successMessage').show();
    
    setTimeout(() => {
      $w('#successMessage').hide();
    }, 5000);
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  if ($w('#errorMessage')) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    
    setTimeout(() => {
      $w('#errorMessage').hide();
    }, 5000);
  }
}
