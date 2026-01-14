// Bail School (How to Become a Bondsman)
import wixLocation from 'wix-location';

$w.onReady(function () {
    console.log("🚀 Bail School Page Loaded...");

    // Basic Navigation Handlers (matches other pages)
    const startBtn = $w('#startBailProcessBtn');
    if (startBtn.valid) startBtn.onClick(() => wixLocation.to('/portal'));

    const contactBtn = $w('#contactUsBtn');
    if (contactBtn.valid) contactBtn.onClick(() => wixLocation.to('/contact'));
});
