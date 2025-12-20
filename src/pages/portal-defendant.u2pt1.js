/**
 * Defendant Portal Page
 * 
 * This page provides the defendant with access to their application, waivers,
 * optional payments, and check-in functionality.
 * 
 * @page portal-defendant
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getPersonId, isDefendant, requireAuth } from 'backend/portal-auth';
import { getDocument, createDocument, updateDocument, renderDocumentPDF } from 'backend/portal-api-client';
import { validateForm } from 'public/portal-validators';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from 'public/portal-config';

let currentPersonId;
let currentCaseId;

$w.onReady(function () {
  initDefendantPortal();
});

async function initDefendantPortal() {
  try {
    requireAuth(); // Ensure user is logged in
    if (!(await isDefendant())) {
      wixLocation.to('/portal'); // Redirect if not defendant
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

    $w('#defendantName').text = `Welcome, Defendant ${currentPersonId}`;
    loadDefendantForms();

  } catch (error) {
    console.error('Defendant Portal Initialization Error:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
    wixLocation.to('/Custom Login'); // Redirect to login on auth error
  }
}

async function loadDefendantForms() {
  // TODO: Implement logic to load application, waivers, and check-in status
  // This will involve fetching existing documents from the API
  // and populating form fields.

  // Example: Load Application Form
  try {
    const applicationDoc = await getDocument(currentCaseId, 'appearance_application_v1', currentPersonId); // Custom API call needed
    if (applicationDoc) {
      // Populate form fields with applicationDoc.payload
      console.log('Loaded existing application:', applicationDoc.payload);
    }
  } catch (error) {
    console.warn('No existing application found or error loading:', error.message);
  }

  // Setup form submission handlers
  $w('#applicationFormButton').onClick(submitApplication);
  $w('#waiversFormButton').onClick(submitWaivers);
  $w('#checkInButton').onClick(performCheckIn);
  $w('#paymentButton').onClick(() => wixLocation.to('/portal/payment'));
}

async function submitApplication() {
  $w('#errorMessage').hide();
  $w('#successMessage').hide();
  const formData = {
    // TODO: Collect data from application form fields
    first_name: $w('#firstNameInput').value,
    last_name: $w('#lastNameInput').value,
    dob: $w('#dobInput').value,
    email: $w('#emailInput').value,
    phone_primary: $w('#phoneInput').value,
    address: {
      line1: $w('#addressLine1Input').value,
      city: $w('#cityInput').value,
      state: $w('#stateDropdown').value,
      zip: $w('#zipInput').value,
    }
  };

  const validation = validateForm(formData, 'defendant');
  if (!validation.valid) {
    $w('#errorMessage').text = validation.errorMessage;
    $w('#errorMessage').show();
    // TODO: Highlight specific fields with errors
    return;
  }

  try {
    // Check if document exists, then update or create
    // This logic needs to be more robust, potentially querying by caseId and document_key
    const existingDoc = null; // Placeholder for actual query

    if (existingDoc) {
      await updateDocument(existingDoc.document_id, formData, wixUsers.currentUser.id);
      $w('#successMessage').text = SUCCESS_MESSAGES.FORM_SAVED;
    } else {
      await createDocument({
        case_id: currentCaseId,
        document_key: 'appearance_application_v1',
        payload: formData
      }, wixUsers.currentUser.id);
      $w('#successMessage').text = SUCCESS_MESSAGES.FORM_SUBMITTED;
    }
    $w('#successMessage').show();
  } catch (error) {
    console.error('Application submission failed:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

async function submitWaivers() {
  $w('#errorMessage').hide();
  $w('#successMessage').hide();
  const formData = {
    // TODO: Collect data from waivers form fields
    gps_consent: $w('#gpsConsentCheckbox').checked,
    ssa_release: $w('#ssaReleaseCheckbox').checked,
    signature_image_uri: 'https://example.com/signature.png' // Placeholder
  };

  // TODO: Add specific validation for waivers

  try {
    // Similar logic to submitApplication for waivers_authorization_v1
    await createDocument({
      case_id: currentCaseId,
      document_key: 'waiver_authorization_v1',
      payload: formData
    }, wixUsers.currentUser.id);
    $w('#successMessage').text = SUCCESS_MESSAGES.DOCUMENT_SIGNED;
    $w('#successMessage').show();
  } catch (error) {
    console.error('Waivers submission failed:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

async function performCheckIn() {
  $w('#errorMessage').hide();
  $w('#successMessage').hide();

  // TODO: Implement GPS and Selfie capture logic
  // This will require Wix's Geolocation and Media APIs
  const gpsData = { lat: 0, lng: 0, accuracy_m: 0 }; // Placeholder
  const selfieUri = 'https://example.com/selfie.jpg'; // Placeholder after upload

  try {
    // First, ensure waivers (especially GPS consent) are signed
    // This check should ideally happen on the backend API as well

    await createDocument({
      case_id: currentCaseId,
      document_key: 'check_in_record_v1', // Assuming a check-in document type
      payload: {
        person_id: currentPersonId,
        gps: gpsData,
        selfie_uri: selfieUri,
        timestamp: new Date().toISOString()
      }
    }, wixUsers.currentUser.id);
    $w('#successMessage').text = SUCCESS_MESSAGES.CHECKIN_COMPLETED;
    $w('#successMessage').show();
  } catch (error) {
    console.error('Check-in failed:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

// UI Elements (placeholders - replace with actual Wix element IDs)
// #defendantName - Text element to display defendant's name
// #applicationFormButton - Button to submit application
// #waiversFormButton - Button to submit waivers
// #checkInButton - Button to perform check-in
// #paymentButton - Button to navigate to payment page
// #errorMessage - Text element to display errors
// #successMessage - Text element to display success messages
// #firstNameInput, #lastNameInput, #dobInput, #emailInput, #phoneInput, #addressLine1Input, #cityInput, #stateDropdown, #zipInput - Form fields
// #gpsConsentCheckbox, #ssaReleaseCheckbox - Waiver checkboxes

