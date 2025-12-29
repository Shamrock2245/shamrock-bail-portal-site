// Page: portal-landing.svg9y.js
// Function: Handles initial access logic (Login/Magic Link)

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members';
import { onMagicLinkLogin } from 'backend/portal-auth';

$w.onReady(async function () {
    // 1. Check for Magic Token in URL (e.g. ?token=abc)
    const query = wixLocation.query;
    if (query.token) {
        $w('#statusText').text = "Verifying your access link...";
        $w('#statusText').expand();
        $w('#tokenInputGroup').collapse();

        await handleToken(query.token);
    } else {
        // Standard view: Show "Enter Token" form
        if ($w('#tokenInputGroup').collapsed) $w('#tokenInputGroup').expand();
        if (!$w('#statusText').collapsed) $w('#statusText').collapse();
    }

    // 2. Setup Manual Token Entry
    $w('#submitTokenBtn').onClick(async () => {
        const token = $w('#tokenInput').value;
        if (!token) {
            $w('#errorText').text = "Please enter a valid token.";
            $w('#errorText').expand();
            return;
        }

        $w('#submitTokenBtn').disable();
        $w('#submitTokenBtn').label = "Verifying...";
        $w('#errorText').collapse();

        await handleToken(token);
    });
});

async function handleToken(token) {
    try {
        const result = await onMagicLinkLogin(token);

        if (result.ok) {
            $w('#statusText').text = "Success! Redirecting...";
            $w('#statusText').expand();

            wixLocation.to(result.goto || '/portal');
        } else {
            console.error("Token error:", result);
            $w('#errorText').text = result.message || "Invalid or expired link.";
            $w('#errorText').expand();

            $w('#submitTokenBtn').enable();
            $w('#submitTokenBtn').label = "Try Again";
            $w('#tokenInputGroup').expand();
        }
    } catch (error) {
        console.error("Link error:", error);
        $w('#errorText').text = "System error. Please call us.";
        $w('#errorText').expand();

        $w('#submitTokenBtn').enable();
        $w('#submitTokenBtn').label = "Try Again";
    }
}
