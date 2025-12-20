/**
 * Staff Console Page
 * 
 * This page provides staff members with an internal dashboard to manage cases,
 * documents, payments, and check-ins. It requires staff-level authentication.
 * 
 * @page portal-staff
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { isStaff, requireStaff } from 'backend/portal-auth';
import { listCases, getCase, renderDocumentPDF } from 'backend/portal-api-client';
import { ERROR_MESSAGES } from 'public/portal-config';

$w.onReady(function () {
  initStaffConsole();
});

async function initStaffConsole() {
  try {
    await requireStaff(); // Ensure user is staff or admin

    $w('#staffName').text = `Welcome, Staff Member ${wixUsers.currentUser.id}`;
    loadDashboardData();

  } catch (error) {
    console.error('Staff Console Initialization Error:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
    wixLocation.to('/Custom Login'); // Redirect to login on auth error
  }
}

async function loadDashboardData() {
  $w('#errorMessage').hide();
  try {
    // Example: List all cases
    const cases = await listCases({}, wixUsers.currentUser.id);
    console.log('Loaded cases:', cases);

    // TODO: Populate a repeater or table with case data
    // $w('#casesRepeater').data = cases.map(caseItem => ({ ...caseItem, _id: caseItem.case_id }));

  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

// Event handlers for staff actions

/**
 * Handles case selection from a list/repeater.
 * @param {string} caseId - The ID of the selected case.
 */
export async function onCaseSelected(caseId) {
  $w('#errorMessage').hide();
  try {
    const caseDetails = await getCase(caseId, wixUsers.currentUser.id);
    console.log('Case details:', caseDetails);
    // TODO: Display case details in a dedicated section
    // TODO: Enable buttons for actions like 'Export Packet', 'Send Magic Link'
  } catch (error) {
    console.error('Failed to load case details:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

/**
 * Exports the full case packet as a PDF.
 * @param {string} caseId - The ID of the case to export.
 */
export async function exportCasePacket(caseId) {
  $w('#errorMessage').hide();
  try {
    const pdf = await renderDocumentPDF(caseId, true, wixUsers.currentUser.id);
    // TODO: Provide a download link for the PDF
    console.log('PDF generated:', pdf);
    $w('#successMessage').text = 'Case packet PDF generated successfully.';
    $w('#successMessage').show();
  } catch (error) {
    console.error('Failed to export case packet:', error);
    $w('#errorMessage').text = error.message || ERROR_MESSAGES.SERVER_ERROR;
    $w('#errorMessage').show();
  }
}

/**
 * Navigates to the case creation form.
 */
export function createNewCase() {
  // TODO: Navigate to a dedicated case creation page or show a form lightbox
  console.log('Navigating to new case creation...');
  wixLocation.to('/portal/staff/new-case'); // Example path
}

// UI Elements (placeholders - replace with actual Wix element IDs)
// #staffName - Text element to display staff member's name
// #casesRepeater - Repeater to list cases
// #errorMessage - Text element to display errors
// #successMessage - Text element to display success messages
// #createNewCaseButton - Button to create a new case
// #exportPacketButton - Button to export case packet (should be enabled after case selection)
// #sendMagicLinkButton - Button to send magic link (should be enabled after case selection)

