import wixLocation from 'wix-location';

$w.onReady(function () {
    // Custom Login Flow Redirect
    // If a user lands on the default Wix Login page, send them to our custom portal
    console.log("Defensive Redirect: Custom Login -> Portal Landing");
    wixLocation.to('/portal-landing');
});
