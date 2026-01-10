import wixLocation from 'wix-location';

$w.onReady(function () {
    console.log("Defensive Redirect: Legacy Portal -> Portal Landing");
    wixLocation.to('/portal-landing');
});
