/**
 * Payment Page (Defendant)
 * /portal/payment
 * 
 * Allows defendants to pay their bail bond premium
 * Integrates with Wix Pay API for secure payment processing
 */

import { createBondPremiumPayment, calculatePaymentAmount, getPaymentStatus } from 'backend/payments';
import wixPayFrontend from 'wix-pay-frontend';
import wixWindowFrontend from 'wix-window-frontend';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

let currentCaseId = null;
let currentMemberEmail = null;

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
  $w('#payNowBtn').onClick(handlePayNowClick);
  $w('#cancelBtn').onClick(handleCancelClick);
});

/**
 * Initialize the payment page
 */
async function initializePage() {
  try {
    showLoading(true);

    // Check payment status
    const statusResult = await getPaymentStatus(currentCaseId);

    if (!statusResult.success) {
      showError('Unable to load payment information. Please try again.');
      return;
    }

    // If already paid, redirect to success page
    if (statusResult.paymentStatus === 'paid' || statusResult.paymentStatus === 'successful') {
      wixLocation.to(`/portal/payment-success?caseId=${currentCaseId}`);
      return;
    }

    // Calculate payment amount
    const calcResult = await calculatePaymentAmount(currentCaseId);

    if (!calcResult.success) {
      showError('Unable to calculate payment amount. Please contact support.');
      return;
    }

    // Display payment information
    displayPaymentInfo(calcResult);

    showLoading(false);

  } catch (error) {
    console.error('Error initializing payment page:', error);
    showError('An error occurred. Please try again or contact support.');
  }
}

/**
 * Display payment information on the page
 */
function displayPaymentInfo(calcResult) {
  // Display bond amount
  $w('#bondAmountText').text = `$${calcResult.bondAmount.toFixed(2)}`;

  // Display premium rate
  $w('#premiumRateText').text = `${(calcResult.premiumRate * 100).toFixed(0)}%`;

  // Display premium amount
  $w('#premiumAmountText').text = `$${calcResult.premiumAmount.toFixed(2)}`;

  // Display processing fee
  $w('#processingFeeText').text = `$${calcResult.processingFee.toFixed(2)}`;

  // Display total amount (large, prominent)
  $w('#totalAmountText').text = `$${calcResult.totalAmount.toFixed(2)}`;

  // Show payment section
  $w('#paymentSection').show();
  $w('#payNowBtn').enable();
}

/**
 * Handle Pay Now button click
 */
async function handlePayNowClick() {
  try {
    // Disable button to prevent double-clicks
    $w('#payNowBtn').disable();
    $w('#payNowBtn').label = 'Processing...';

    showLoading(true);

    // Create payment in backend
    const paymentResult = await createBondPremiumPayment({
      caseId: currentCaseId,
      memberEmail: currentMemberEmail
    });

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || 'Payment creation failed');
    }

    showLoading(false);

    // Start payment flow with Wix Pay
    const paymentOptions = {
      showThankYouPage: false, // We'll handle our own success page
      termsAndConditionsLink: 'https://shamrockbailbonds.biz/terms',
      userInfo: {
        email: currentMemberEmail
      }
    };

    const result = await wixPayFrontend.startPayment(
      paymentResult.payment.id,
      paymentOptions
    );

    // Handle payment result
    handlePaymentResult(result);

  } catch (error) {
    console.error('Payment error:', error);
    showError(`Payment failed: ${error.message}`);

    // Re-enable button
    $w('#payNowBtn').enable();
    $w('#payNowBtn').label = 'Pay Now';
    showLoading(false);
  }
}

/**
 * Handle payment result from Wix Pay
 */
function handlePaymentResult(result) {
  console.log('Payment result:', result);

  if (result.status === 'Successful') {
    // Redirect to success page
    wixLocation.to(`/portal/payment-success?caseId=${currentCaseId}`);

  } else if (result.status === 'Pending') {
    // Show pending message
    showInfo('Payment is pending. You will receive a confirmation email once processed.');

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      wixLocation.to('/portal/dashboard');
    }, 3000);

  } else if (result.status === 'Failed') {
    // Show error message
    showError('Payment failed. Please try again or contact support.');

    // Re-enable button
    $w('#payNowBtn').enable();
    $w('#payNowBtn').label = 'Pay Now';

  } else {
    // Unknown status
    showError('Payment status unknown. Please check your dashboard or contact support.');

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      wixLocation.to('/portal/dashboard');
    }, 3000);
  }
}

/**
 * Handle Cancel button click
 */
function handleCancelClick() {
  // Confirm cancellation
  // TODO: Create 'ConfirmCancelPayment' lightbox
  // wixWindowFrontend.openLightbox('ConfirmCancelPayment')
  //   .then((result) => {
  //     if (result === 'confirmed') {
  //       wixLocation.to('/portal/dashboard');
  //     }
  //   });

  // Temporary fallback: Direct redirect
  wixLocation.to('/portal/dashboard');
}

/**
 * Show loading indicator
 */
function showLoading(show) {
  if (show) {
    $w('#loadingSpinner').show();
    $w('#paymentSection').collapse();
  } else {
    $w('#loadingSpinner').hide();
    $w('#paymentSection').expand();
  }
}

/**
 * Show error message
 */
function showError(message) {
  $w('#errorBox').show();
  $w('#errorText').text = message;
  $w('#paymentSection').collapse();

  // Hide error after 10 seconds
  setTimeout(() => {
    $w('#errorBox').hide();
  }, 10000);
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
