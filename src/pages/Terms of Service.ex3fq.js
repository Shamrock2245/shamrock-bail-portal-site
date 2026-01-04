import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

$w.onReady(function () {
    console.log("📄 Terms of Service Loaded");

    // Optional: Print Functionality
    // If you add a button with ID #printTermsBtn, this will make it work.
    const printBtn = $w('#printTermsBtn');
    if (printBtn.valid) {
        printBtn.onClick(() => {
            wixWindow.print();
        });
    }

    // Optional: Back to Home
    // If you add a button with ID #backHomeBtn, this will make it work.
    const backBtn = $w('#backHomeBtn');
    if (backBtn.valid) {
        backBtn.onClick(() => {
            wixLocation.to('/');
        });
    }
});
