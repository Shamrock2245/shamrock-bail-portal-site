// Filename: public/Public/bookingSheetHandler.js

// bookingSheetHandler.js

// Function to process the booking sheet URL
export function processBookingSheet(url) {
    if (!url) {
        console.error("No URL provided");
        return;
    }

    // Fetch data from the URL
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle and display booking data
            handleBookingData(data);
        })
        .catch(error => {
            console.error('Error fetching booking sheet:', error);
        });
}

// Function to handle and display data from the booking sheet
function handleBookingData(data) {
    console.log("Booking Sheet Data:", data);
    // Update the Wix page elements with booking data
    $w('#bookingDataDisplay').text = JSON.stringify(data, null, 2);
}