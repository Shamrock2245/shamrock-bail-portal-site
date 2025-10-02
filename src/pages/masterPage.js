// The code in this file will load on every page of your site

$w.onReady(function () {
    // Ensure the button and input elements are correctly identified by their IDs
    $w('#submitButton').onClick(() => {
        const url = $w('#bookingSheetURLInput').value; // Get the URL input value
        processBookingSheet(url); // Call the function from your JS file
    });
});
