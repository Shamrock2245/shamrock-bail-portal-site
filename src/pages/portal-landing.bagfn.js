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
        if (btn) {
            if (typeof btn.onClick === 'function') {
                console.log("Portal Landing: Found #submitTokenBtn, attaching onClick");
                btn.onClick(async () => {
                    console.log("Portal Landing: #submitTokenBtn clicked");
                    const token = $w('#tokenInput').value;
                    if (!token) {
                        try {
                            if ($w('#errorText').type) {
                                $w('#errorText').text = "Please enter a valid token.";
                                $w('#errorText').expand();
                            }
                        } catch (e) { }
                        return;
                    }

                    btn.disable();
                    btn.label = "Verifying...";

                    await handleToken(token);
                });
            } else {
                console.warn("Portal Landing: #submitTokenBtn found but missing .onClick() method.", btn);
            }
        } else {
            console.log("Portal Landing: #submitTokenBtn NOT found");
        }
    } catch (e) {
        console.error('Error setting up submitTokenBtn:', e);
    }

    // Role Selection Buttons - Helper
    const setupRoleButton = (id, roleName, handler) => {
        try {
            const el = $w(id);
            if (el) {
                if (typeof el.onClick === 'function') {
                    console.log(`Portal Landing: Attaching click to ${id}`);
                    el.onClick(handler);
                } else {
                    console.warn(`Portal Landing: ${id} found but missing .onClick() method.`);
                }
            } else {
                console.log(`Portal Landing: ${id} NOT found`);
            }
        } catch (e) {
            console.error(`Error setting up ${id} for ${roleName}:`, e);
        }
    };

    // Setup Buttons
    setupRoleButton('#selectDefendantBtn', 'defendant', async () => {
        console.log("Portal Landing: #selectDefendantBtn clicked");
        await handleRoleSelection('defendant');
    });

    setupRoleButton('#selectIndemnitorBtn', 'indemnitor', async () => {
        console.log("Portal Landing: #selectIndemnitorBtn clicked");
        await handleRoleSelection('indemnitor');
    });

    setupRoleButton('#selectStaffBtn', 'staff', async () => {
        console.log("Portal Landing: #selectStaffBtn clicked");
        console.log("Redirecting to /portal-staff");
        wixLocation.to('/portal-staff');
    });

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
                
                // Redirect to role-specific portal
                const rolePortalMap = {
                    'defendant': '/portal-defendant',
                    'indemnitor': '/portal-indemnitor',
                    'coindemnitor': '/portal-indemnitor',
                    'staff': '/portal-staff',
                    'admin': '/portal-staff'
                };
                
                const targetPortal = rolePortalMap[role] || '/portal';
                console.log(`Role assigned. Redirecting to ${targetPortal}...`);
                wixLocation.to(targetPortal);
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
