// StartBail.js (DEPRECATED - LEGACY ARTIFACT)
// This page was part of the old Wix Member system.
// Reducing to a redirect just in case old links exist.

import wixLocation from 'wix-location';

$w.onReady(function () {
    console.warn("Legacy StartBail page accessed. Redirecting to Portal Landing.");
    wixLocation.to('/portal-landing');
});

/*
LEGACY CODE ARCHIVE:
import wixWindow from 'wix-window';
import { authentication, currentMember } from 'wix-members';
...
*/
