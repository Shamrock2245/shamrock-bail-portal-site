// Page: portal-landing.bagfn.js (FIXED)
// Function: Handles initial access logic (Login/Magic Link)
//
// FIXES:
// - Added proper element existence checks before calling .onClick()
// - Added try-catch blocks around all element manipulations
// - Prevents "onClick is not a function" errors

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members';
import { onMagicLinkLogin } from 'backend/portal-auth';

$w.onReady(async function () {
    // 1. Check for Magic Token in URL (Priority)
    const query = wixLocation.query;
    if (query.token) {
        try {
            if ($w('#statusText').type) {
                $w('#statusText').text = "Verifying your access link...";
                $w('#statusText').expand();
            }
            if ($w('#tokenInputGroup').type) $w('#tokenInputGroup').collapse();
            if ($w('#roleSelectionGroup').type) $w('#roleSelectionGroup').collapse();
        } catch (e) { }

        await handleToken(query.token);
        return;
    }

    // 2. Check if User is Logged In
    try {
        const member = await currentMember.getMember();
        if (member) {
            // User is logged in -> Show Role Selection
            if ($w('#tokenInputGroup').type) $w('#tokenInputGroup').collapse();
            if ($w('#roleSelectionGroup').type) $w('#roleSelectionGroup').expand();
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Welcome! Please select your role to continue.";
                $w('#welcomeText').expand();
            }
        } else {
            // User is Guest -> Show Magic Link Input
            if ($w('#tokenInputGroup').type && $w('#tokenInputGroup').collapsed) {
                $w('#tokenInputGroup').expand();
            }
            if ($w('#roleSelectionGroup').type) $w('#roleSelectionGroup').collapse();
        }
    } catch (e) {
        console.error('Error checking member status:', e);
    }

    // 3. Setup Logic
    setupEventHandlers();
});

function setupEventHandlers() {
    // Magic Link Submit Button
    try {
        if ($w('#submitTokenBtn').type) {
            $w('#submitTokenBtn').onClick(async () => {
                const token = $w('#tokenInput').value;
                if (!token) {
                    if ($w('#errorText').type) {
                        $w('#errorText').text = "Please enter a valid token.";
                        $w('#errorText').expand();
                    }
                    return;
                }

                if ($w('#submitTokenBtn').type) {
                    $w('#submitTokenBtn').disable();
                    $w('#submitTokenBtn').label = "Verifying...";
                }

                await handleToken(token);
            });
        }
    } catch (e) {
        console.error('Error setting up submitTokenBtn:', e);
    }

    // Role Selection Buttons
    const { assignRoleToCurrentUser } = require('backend/portal-auth');

    // Defendant Button
    try {
        if ($w('#selectDefendantBtn').type) {
            $w('#selectDefendantBtn').onClick(async () => {
                await handleRoleSelection('defendant');
            });
        }
    } catch (e) {
        console.error('Error setting up selectDefendantBtn:', e);
    }

    // Indemnitor Button
    try {
        if ($w('#selectIndemnitorBtn').type) {
            $w('#selectIndemnitorBtn').onClick(async () => {
                await handleRoleSelection('indemnitor');
            });
        }
    } catch (e) {
        console.error('Error setting up selectIndemnitorBtn:', e);
    }

    // Staff Button
    try {
        if ($w('#selectStaffBtn').type) {
            $w('#selectStaffBtn').onClick(async () => {
                wixLocation.to('/portal-staff');
            });
        }
    } catch (e) {
        console.error('Error setting up selectStaffBtn:', e);
    }

    async function handleRoleSelection(role) {
        try {
            if ($w('#statusText').type) {
                $w('#statusText').text = "Setting up your dashboard...";
                $w('#statusText').expand();
            }
            if ($w('#roleSelectionGroup').type) $w('#roleSelectionGroup').collapse();

            try {
                await assignRoleToCurrentUser(role);
                wixLocation.to('/portal'); // Router will now redirect correctly
            } catch (e) {
                console.error('Role assignment error:', e);
                if ($w('#statusText').type) {
                    $w('#statusText').text = "Error setting role. Please try again.";
                }
                if ($w('#roleSelectionGroup').type) {
                    $w('#roleSelectionGroup').expand();
                }
            }
        } catch (e) {
            console.error('Error in handleRoleSelection:', e);
        }
    }
}

async function handleToken(token) {
    try {
        const result = await onMagicLinkLogin(token);

        if (result.ok) {
            try {
                if ($w('#statusText').type) {
                    $w('#statusText').text = "Success! Redirecting...";
                    $w('#statusText').expand();
                }
            } catch (e) { }

            wixLocation.to(result.goto || '/portal');
        } else {
            console.error("Token error:", result);

            try {
                if ($w('#errorText').type) {
                    $w('#errorText').text = result.message || "Invalid or expired link.";
                    $w('#errorText').expand();
                }

                if ($w('#submitTokenBtn').type) {
                    $w('#submitTokenBtn').enable();
                    $w('#submitTokenBtn').label = "Try Again";
                }

                if ($w('#tokenInputGroup').type) {
                    $w('#tokenInputGroup').expand();
                }
            } catch (e) { }
        }
    } catch (error) {
        console.error("Link error:", error);

        try {
            if ($w('#errorText').type) {
                $w('#errorText').text = "System error. Please call us.";
                $w('#errorText').expand();
            }

            if ($w('#submitTokenBtn').type) {
                $w('#submitTokenBtn').enable();
                $w('#submitTokenBtn').label = "Try Again";
            }
        } catch (e) { }
    }
}
