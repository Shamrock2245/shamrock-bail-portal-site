// Page: portal-landing.bagfn.js
// Function: Handles initial access logic (Login/Magic Link)

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members';
import { onMagicLinkLogin } from 'backend/portal-auth';

$w.onReady(async function () {
    // 1. Check for Magic Token in URL (Priority)
    const query = wixLocation.query;
    if (query.token) {
        $w('#statusText').text = "Verifying your access link...";
        $w('#statusText').expand();
        $w('#tokenInputGroup').collapse();
        $w('#roleSelectionGroup').collapse(); // Ensure this is hidden
        await handleToken(query.token);
        return;
    }

    // 2. Check if User is Logged In
    const member = await currentMember.getMember();
    if (member) {
        // User is logged in -> Show Role Selection
        $w('#tokenInputGroup').collapse();
        $w('#roleSelectionGroup').expand(); // New Group for Buttons
        $w('#welcomeText').text = "Welcome! Please select your role to continue.";
        $w('#welcomeText').expand();
    } else {
        // User is Guest -> Show Magic Link Input
        if ($w('#tokenInputGroup').collapsed) $w('#tokenInputGroup').expand();
        $w('#roleSelectionGroup').collapse();
    }

    // 3. Setup Logic
    setupEventHandlers();
});

function setupEventHandlers() {
    // Magic Link
    $w('#submitTokenBtn').onClick(async () => {
        const token = $w('#tokenInput').value;
        if (!token) {
            $w('#errorText').text = "Please enter a valid token.";
            $w('#errorText').expand();
            return;
        }
        $w('#submitTokenBtn').disable();
        $w('#submitTokenBtn').label = "Verifying...";
        await handleToken(token);
    });

    // Role Selection
    const { assignRoleToCurrentUser } = require('backend/portal-auth');

    $w('#selectDefendantBtn').onClick(async () => {
        await handleRoleSelection('defendant');
    });

    $w('#selectIndemnitorBtn').onClick(async () => {
        await handleRoleSelection('indemnitor');
    });

    // Add Staff Button Handler
    // Note: Staff cannot self-assign the role, they must already have it.
    // This button simply navigates them to the staff portal.
    $w('#selectStaffBtn').onClick(async () => {
        wixLocation.to('/portal-staff');
    });

    async function handleRoleSelection(role) {
        $w('#statusText').text = "Setting up your dashboard...";
        $w('#statusText').expand();
        $w('#roleSelectionGroup').collapse();

        try {
            await assignRoleToCurrentUser(role);
            wixLocation.to('/portal'); // Router will now redirect correctly
        } catch (e) {
            console.error(e);
            $w('#statusText').text = "Error setting role. Please try again.";
            $w('#roleSelectionGroup').expand();
        }
    }
}

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
