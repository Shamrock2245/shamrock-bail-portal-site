// Filename: public/bookingSheetHandler.js

// Code written in public files is shared by your site's
// Backend, page code, and site code environments.

// backend/bookingSheetHandler.jsw
// import { fetch } from 'wix-fetch'; // rely on global fetch

// Function to fetch data from an external booking sheet URL
export async function getBailData(url) {
  try {
    // Fetch the HTML content from the provided URL
    const response = await fetch(url, { method: 'get' });

    if (!response.ok) {
      throw new Error('Failed to fetch the booking sheet.');
    }

    const text = await response.text();

    // Use regex or a DOM parser to extract charges and bail amounts
    const chargesData = extractChargesAndBailAmounts(text);

    return { bailAmounts: chargesData.bailAmounts };
  } catch (error) {
    return { error: error.message };
  }
}

// Helper function to extract charges and bail amounts from HTML text
function extractChargesAndBailAmounts(htmlText) {
  if (typeof DOMParser === 'undefined') {
    console.warn('DOMParser not available in this environment');
    return { bailAmounts: [] };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  let bailAmounts = [];

  // Extract charges and bail amounts using DOM methods or regex
  const charges = doc.querySelectorAll("#charges-content > div");

  charges.forEach((chargeDiv) => {
    const bail = chargeDiv.querySelector("div.col-sm-4").textContent.trim();
    const bailAmount = parseInt(bail.replace(/[^0-9]/g, ''));
    bailAmounts.push(bailAmount);
  });

  return { bailAmounts };
}

export async function processBookingSheet(url) {
  return await getBailData(url);
}
