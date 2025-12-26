/**
 * Payment Authorization Page (Indemnitor)
 * /portal/payment-authorization
 * 
 * Allows indemnitors to authorize payment responsibility
 * Does not process immediate payment, but records authorization
 */

import { createPaymentAuthorization, calculatePaymentAmount, getPaymentStatus } from 'backend/payments';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import wixWindowFrontend from 'wix-window-frontend';

let currentCaseId = null;
let currentMemberEmail = null;
let paymentAmount = 0;

$w.onReady(async function () {
  // Check if user is logged in
  if (!wixUsers.currentUser.loggedIn) {
    wixLocation.to('/members/login');
    return;
  }

  // Get current member email
  currentMemberEmail = await wixUsers.currentUser.getEmail();

  // Get case ID from URL query parameter
  const query = wixLocation.query;
  currentCaseId = query.caseId;

  if (!currentCaseId) {
    showError('No case ID provided. Please start from your dashboard.');
    return;
  }

  // Initialize page
  await initializePage();

  // Set up event handlers
  $w('#authorizeButton').onClick(handleAuthorizeClick);
  $w('#declineButton').onClick(handleDeclineClick);
  $w('#agreementCheckbox').onChange(handleAgreementChange);
});

/**
 * Initialize the authorization page
 */
async function initializePage() {
  try {
    showLoading(true);

    // Check payment status
    const statusResult = await getPaymentStatus(currentCaseId);

    if (!statusResult.success) {
      showError('Unable to load case information. Please try again.');
      return;
    }

    // If already authorized, show status
    if (statusResult.authorizationStatus === 'authorized') {
      showAlreadyAuthorized();
      return;
    }

    // Calculate payment amount
    const calcResult = await calculatePaymentAmount(currentCaseId);

    if (!calcResult.success) {
      showError('Unable to calculate payment amount. Please contact support.');
      return;
    }

    paymentAmount = calcResult.totalAmount;

    // Display authorization information
    displayAuthorizationInfo(calcResult);

    showLoading(false);

  } catch (error) {
    console.error('Error initializing authorization page:', error);
    showError('An error occurred. Please try again or contact support.');
  }
}

/**
 * Display authorization information on the page
 */
function displayAuthorizationInfo(calcResult) {
  // Display bond amount
  $w('#bondAmountText').text = `$${calcResult.bondAmount.toFixed(2)}`;

  // Display total liability
  $w('#totalLiabilityText').text = `$${calcResult.bondAmount.toFixed(2)}`;

  // Display premium amount (what defendant pays)
  $w('#premiumAmountText').text = `$${calcResult.premiumAmount.toFixed(2)}`;

  // Display responsibility statement
  const responsibilityText = `
    As an indemnitor, you are agreeing to be financially responsible for the full bond amount 
    of $${calcResult.bondAmount.toFixed(2)} if the defendant fails to appear in court or 
    violates the terms of their release.
    
    This is a serious legal and financial commitment. Please read the full agreement below 
    before authorizing.
  `;
  $w('#responsibilityText').text = responsibilityText;

  // Show authorization section
  $w('#authorizationSection').show();
  
  // Keep authorize button disabled until agreement is checked
  $w('#authorizeButton').disable();
}

/**
 * Handle agreement checkbox change
 */
function handleAgreementChange(event) {
  if (event.target.checked) {
    $w('#authorizeButton').enable();
  } else {
    $w('#authorizeButton').disable();
  }
}

/**
 * Handle Authorize button click
 */
async function handleAuthorizeClick() {
  try {
    // Verify agreement is checked
    if (!$w('#agreementCheckbox').checked) {
      showError('You must agree to the terms before authorizing.');
      return;
    }

    // Disable button to prevent double-clicks
    $w('#authorizeButton').disable();
    $w('#authorizeButton').label = 'Processing...';

    showLoading(true);

    // Get GPS coordinates if available
    const gpsCoordinates = await getGPSCoordinates();

    // Create authorization
    const authResult = await createPaymentAuthorization({
      caseId: currentCaseId,
      indemnitorEmail: currentMemberEmail,
      paymentMethod: {
        type: 'authorization',
        name: $w('#nameInput').value || '',
        ipAddress: 'client-side', // Would need server-side detection
        userAgent: navigator.userAgent,
        gpsCoordinates: gpsCoordinates
      }
    });

    showLoading(false);

    if (!authResult.success) {
      throw new Error(authResult.error || 'Authorization failed');
    }

    // Show success message
    showSuccess('Authorization recorded successfully!');

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      wixLocation.to('/portal/dashboard');
    }, 2000);

  } catch (error) {
    console.error('Authorization error:', error);
    showError(`Authorization failed: ${error.message}`);
    
    // Re-enable button
    $w('#authorizeButton').enable();
    $w('#authorizeButton').label = 'I Authorize Payment Responsibility';
    showLoading(false);
  }
}

/**
 * Handle Decline button click
 */
function handleDeclineClick() {
  // Confirm decline
  wixWindowFrontend.openLightbox('ConfirmDeclineAuthorization')
    .then((result) => {
      if (result === 'confirmed') {
        // Show message about consequences
        showInfo('Authorization declined. The defendant will need to find another indemnitor or payment method.');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          wixLocation.to('/portal/dashboard');
        }, 3000);
      }
    });
}

/**
 * Show already authorized status
 */
function showAlreadyAuthorized() {
  $w('#authorizationSection').collapse();
  $w('#alreadyAuthorizedBox').show();
  $w('#alreadyAuthorizedText').text = 'You have already authorized payment responsibility for this case.';
  showLoading(false);
}

/**
 * Get GPS coordinates (with user permission)
 */
async function getGPSCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(`${position.coords.latitude},${position.coords.longitude}`);
      },
      (error) => {
        console.log('GPS permission denied or error:', error);
        resolve('denied');
      },
      {
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Show loading indicator
 */
function showLoading(show) {
  if (show) {
    $w('#loadingSpinner').show();
    $w('#authorizationSection').collapse();
  } else {
    $w('#loadingSpinner').hide();
    $w('#authorizationSection').expand();
  }
}

/**
 * Show error message
 */
function showError(message) {
  $w('#errorBox').show();
  $w('#errorText').text = message;
  
  // Hide error after 10 seconds
  setTimeout(() => {
    $w('#errorBox').hide();
  }, 10000);
}

/**
 * Show success message
 */
function showSuccess(message) {
  $w('#successBox').show();
  $w('#successText').text = message;
  $w('#authorizationSection').collapse();
}

/**
 * Show info message
 */
function showInfo(message) {
  $w('#infoBox').show();
  $w('#infoText').text = message;
  
  // Hide info after 5 seconds
  setTimeout(() => {
    $w('#infoBox').hide();
  }, 5000);
}
