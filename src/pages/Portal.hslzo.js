/**
 * Portal Page (Wix Members Area)
 * 
 * This page acts as a redirect hub for the portal system.
 * It redirects users to the appropriate portal based on their role.
 * 
 * URL: /portal (from Wix Members Area)
 * Redirects to: /portal-landing (our custom portal landing page)
 */

import wixLocation from 'wix-location';
import { validateCustomSession } from 'backend/portal-auth';

$w.onReady(async function () {
    console.log("🔄 Portal redirect page loaded");
    
    try {
        // Check if user has an active session
        const session = await validateCustomSession();
        
        if (session && session.valid && session.role) {
            // User has a valid session with a role - redirect to their dashboard
            const roleRedirects = {
                'defendant': '/portal-defendant',
                'indemnitor': '/portal-indemnitor',
                'coindemnitor': '/portal-indemnitor',
                'staff': '/portal-staff',
                'admin': '/portal-staff'
            };
            
            const destination = roleRedirects[session.role] || '/portal-landing';
            console.log(`✅ Valid session, redirecting to ${destination}`);
            wixLocation.to(destination);
        } else {
            // No valid session - redirect to landing page
            console.log("⚠️ No valid session, redirecting to portal-landing");
            wixLocation.to('/portal-landing');
        }
    } catch (error) {
        console.error("Portal redirect error:", error);
        // On error, default to landing page
        wixLocation.to('/portal-landing');
    }
});
