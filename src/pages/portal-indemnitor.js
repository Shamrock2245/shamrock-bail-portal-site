/**
 * Indemnitor Portal Page
 * 
 * This page provides the indemnitor with access to financial forms, collateral management,
 * payment authorization, and e-signature functionality.
 * 
 * @page portal-indemnitor
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getPersonId, isIndemnitor, requireAuth } from 'backend/portal-auth';
import { getDocument, createDocument, updateDocument, authorizePayment, capturePayment } from 'backend/portal-api-client';
import { validateForm } from 'backend/portal-validators';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from 'backend/portal-config';

let currentPersonId;
let currentCaseId;

$w.onReady(function () {
  initIndemnitorPortal();
});

async function initIndemnitorPortal() {
  try {
    requireAuth(); // Ensure user is logged in
    if (!(await isIndemnitor())) {
      wixLocation.to('/portal'); // Redirect if not indemnitor
      return;
    }

    currentPersonId = await getPersonId();
    // TODO: Retrieve currentCaseId from user profile or URL parameter
    currentCaseId = 'CASE-001'; // Placeholder

    if (!currentPersonId || !currentCaseId) {
      $w('#errorMessage').text = 'Missing person or case information.';
      $w('#errorMessage').show();
      return;
    }

    $w('#indemnitorName').text = `Welcome, Indemnitor ${currentPersonId}`;
    loadIndemnitorForms();

  } catch (error) {
    console.error('Indemnitor Portal Initialization Error:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
    wixLocation.to('/Custom Login'); // Redirect to login on auth error
  }
}

async function loadIndemnitorForms() {
  // TODO: Implement logic to load financial statement, collateral, and payment status
  // This will involve fetching existing documents from the API
  // and populating form fields.

  // Example: Load Financial Statement Form
  try {
    const financialDoc = await getDocument(currentCaseId, 'financial_indemnity_v1', currentPersonId); // Custom API call needed
    if (financialDoc) {
      // Populate form fields with financialDoc.payload
      console.log('Loaded existing financial statement:', financialDoc.payload);
    }
  } catch (error) {
    console.warn('No existing financial statement found or error loading:', error.message);
  }

  // Setup form submission handlers
  $w('#financialFormButton').onClick(submitFinancialStatement);
  $w('#collateralFormButton').onClick(submitCollateral);
  $w('#paymentAuthButton').onClick(authorizePaymentAndSign);
  $w('#signaturesButton').onClick(submitSignatures);
}

async function submitFinancialStatement() {
  $w('#errorMessage').hide();
  $w('#successMessage').hide();
  const formData = {
    // TODO: Collect data from financial statement form fields
    income: $w('#incomeInput').value,
    assets: $w('#assetsInput').value,
    liabilities: $w('#liabilitiesInput').value,
    employer_name: $w('#employerNameInput').value,
    // ... other fields
  };

  const validation = validateForm(formData, 'indemnitor');
  if (!validation.valid) {
    $w('#errorMessage').text = validation.errorMessage;
    $w('#errorMessage').show();
    // TODO: Highlight specific fields with errors
    return;
  }

  try {
    // Check if document exists, then update or create
    const existingDoc = null; // Placeholder for actual query

    if (existingDoc) {
      await updateDocument(existingDoc.document_id, formData, wixUsers.currentUser.id);
      $w('#successMessage').text = SUCCESS_MESSAGES.FORM_SAVED;
    } else {
      await createDocument({
        case_id: currentCaseId,
        document_key: 'financial_indemnity_v1',
        payload: formData
      }, wixUsers.currentUser.id);
      $w('#successMessage').text = SUCCESS_MESSAGES.FORM_SUBMITTED;
    }
    $w('#successMessage').show();
  } catch (error) {
    console.error('Financial statement submission failed:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

async function submitCollateral() {
  $w('#errorMessage').hide();
  $w('#successMessage').hide();
  const formData = {
    // TODO: Collect data from collateral form fields
    collateral_type: $w('#collateralTypeDropdown').value,
    description: $w('#collateralDescriptionInput').value,
    // ... conditional uploads for real estate/vehicle
  };

  // TODO: Add specific validation for collateral

  try {
    await createDocument({
      case_id: currentCaseId,
      document_key: 'collateral_promissory_v1',
      payload: formData
    }, wixUsers.currentUser.id);
    $w('#successMessage').text = SUCCESS_MESSAGES.FORM_SUBMITTED;
    $w('#successMessage').show();
  } catch (error) {
    console.error('Collateral submission failed:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

async function authorizePaymentAndSign() {
  $w('#errorMessage').hide();
  $w('#successMessage').hide();
  const paymentData = {
    // TODO: Collect payment authorization data
    authorized_amount: $w('#paymentAmountInput').value,
    method: $w('#paymentMethodDropdown').value,
    gateway_token: 'tok_xxx', // Placeholder from Wix Payments
    metadata: { document_id: 'DOC-CC-AUTH-001' } // Link to CC Auth doc
  };

  // TODO: Add validation for payment data

  try {
    const authResult = await authorizePayment(paymentData, wixUsers.currentUser.id, 'idempotency-key-123');
    // After authorization, proceed to create/update CC Authorization document
    await createDocument({
      case_id: currentCaseId,
      document_key: 'cc_authorization_v1',
      payload: { ...paymentData, authorization_id: authResult.payment_id }
    }, wixUsers.currentUser.id);

    $w('#successMessage').text = SUCCESS_MESSAGES.PAYMENT_PROCESSED;
    $w('#successMessage').show();
  } catch (error) {
    console.error('Payment authorization failed:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

async function submitSignatures() {
  $w('#errorMessage').hide();
  $w('#successMessage').hide();
  const signatureData = {
    // TODO: Collect signature data (e.g., image URI, IP, user agent)
    document_id: 'DOC-FINANCIAL-001', // Placeholder
    signed_by_person_id: currentPersonId,
    signature_image_uri: 'https://example.com/indemnitor_sig.png',
    ip_address: '192.168.1.1', // Placeholder
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  // TODO: Add validation for signature data

  try {
    // This would typically involve signing multiple documents
    // For simplicity, this example assumes one signature submission
    await createDocument({
      case_id: currentCaseId,
      document_key: 'financial_indemnity_v1', // Assuming this is the document being signed
      payload: { ...signatureData, status: 'signed' } // Update document status
    }, wixUsers.currentUser.id);

    $w('#successMessage').text = SUCCESS_MESSAGES.DOCUMENT_SIGNED;
    $w('#successMessage').show();
  } catch (error) {
    console.error('Signature submission failed:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

// UI Elements (placeholders - replace with actual Wix element IDs)
// #indemnitorName - Text element to display indemnitor's name
// #financialFormButton - Button to submit financial statement
// #collateralFormButton - Button to submit collateral details
// #paymentAuthButton - Button to authorize payment
// #signaturesButton - Button to submit signatures
// #errorMessage - Text element to display errors
// #successMessage - Text element to display success messages
// #incomeInput, #assetsInput, #liabilitiesInput, #employerNameInput - Financial form fields
// #collateralTypeDropdown, #collateralDescriptionInput - Collateral form fields
// #paymentAmountInput, #paymentMethodDropdown - Payment form fields

