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
import { onMagicLinkLogin, assignRoleToCurrentUser } from 'backend/portal-auth';

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
    console.log("Portal Landing: Setting up event handlers...");
    setupEventHandlers();
});

function setupEventHandlers() {
    console.log("Portal Landing: Inside setupEventHandlers");

    // Magic Link Submit Button
    try {
        const btn = $w('#submitTokenBtn');
        if (btn && btn.type) {
            console.log("Portal Landing: Found #submitTokenBtn");
            btn.onClick(async () => {
                console.log("Portal Landing: #submitTokenBtn clicked");
                const token = $w('#tokenInput').value;
                if (!token) {
                    if ($w('#errorText').type) {
                        $w('#errorText').text = "Please enter a valid token.";
                        $w('#errorText').expand();
                    }
                    return;
                }

                btn.disable();
                btn.label = "Verifying...";

                await handleToken(token);
            });
        } else {
            console.log("Portal Landing: #submitTokenBtn NOT found");
        }
    } catch (e) {
        console.error('Error setting up submitTokenBtn:', e);
    }

    // Role Selection Buttons
    // assignRoleToCurrentUser is imported at the top level

    // Defendant Button
    try {
        const btnDef = $w('#selectDefendantBtn');
        if (btnDef && btnDef.type) {
            console.log("Portal Landing: Found #selectDefendantBtn");
            btnDef.onClick(async () => {
                console.log("Portal Landing: #selectDefendantBtn clicked");
                await handleRoleSelection('defendant');
            });
        } else {
            console.log("Portal Landing: #selectDefendantBtn NOT found");
        }
    } catch (e) {
        console.error('Error setting up selectDefendantBtn:', e);
    }

    // Indemnitor Button
    try {
        const btnInd = $w('#selectIndemnitorBtn');
        if (btnInd && btnInd.type) {
            console.log("Portal Landing: Found #selectIndemnitorBtn");
            btnInd.onClick(async () => {
                console.log("Portal Landing: #selectIndemnitorBtn clicked");
                await handleRoleSelection('indemnitor');
            });
        } else {
            console.log("Portal Landing: #selectIndemnitorBtn NOT found");
        }
    } catch (e) {
        console.error('Error setting up selectIndemnitorBtn:', e);
    }

    // Staff Button
    try {
        const btnStaff = $w('#selectStaffBtn');
        if (btnStaff && btnStaff.type) {
            console.log("Portal Landing: Found #selectStaffBtn");
            btnStaff.onClick(async () => {
                console.log("Portal Landing: #selectStaffBtn clicked");
                // Staff portal usually requires login first, but let's try direct
                console.log("Redirecting to /portal-staff");
                wixLocation.to('/portal-staff');
            });
        } else {
            console.log("Portal Landing: #selectStaffBtn NOT found");
        }
    } catch (e) {
        console.error('Error setting up selectStaffBtn:', e);
    }

    async function handleRoleSelection(role) {
        console.log(`Portal Landing: Handling role selection for ${role}`);
        try {
            if ($w('#statusText').type) {
                $w('#statusText').text = "Setting up your dashboard...";
                $w('#statusText').expand();
            }
            if ($w('#roleSelectionGroup').type) $w('#roleSelectionGroup').collapse();

            try {
                console.log("Calling assignRoleToCurrentUser...");
                await assignRoleToCurrentUser(role);
                console.log("Role assigned. Redirecting to /portal...");
                wixLocation.to('/portal');
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
