import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import wixAnimations from 'wix-animations';
import wixData from 'wix-data';
import { getUserRole, ROLES } from 'backend/portal-auth';
import { getBailData } from 'public/bookingSheetHandler';
import { getCurrentLocation } from 'backend/location';

/**
 * HOME Page Code
 * 
 * This script handles the main landing page interactions.
 * It uses a defensive strategy to ensure it doesn't crash if UI elements are missing.
 */

$w.onReady(function () {
    // 1. Initialize Premium UI Animations
    initHomeUI();

    // 2. Wire up Primary Call to Action
    wireHeroCTA();
    
    // 3. Load and wire county selector
    loadCountySelector();
});

/**
 * Applies entrance animations to hero elements.
 * Defensive: Checks for existence before animating.
 */
function initHomeUI() {
    const heroElements = [
        { id: '#heroTitle', y: 20 },
        { id: '#heroSubtitle', y: 15 },
        { id: '#heroCTA', y: 10 }
    ];

    heroElements.forEach((item, index) => {
        try {
            const element = $w(item.id);
            // Check if element is "rendered" (Wix specific check for existence/visibility)
            if (element && typeof element.show === 'function') {
                wixAnimations.timeline()
                    .add(element, { opacity: 0, y: item.y, duration: 0 })
                    .add(element, {
                        opacity: 1,
                        y: 0,
                        duration: 1000,
                        delay: index * 250,
                        easing: 'easeOutCubic'
                    })
                    .play();
            }
        } catch (err) {
            // Silently skip if element isn't in the Editor yet
            console.debug(`Home UI: Element ${item.id} not found, skipping animation.`);
        }
    });
}

/**
 * Handles the "Start Your Bond Now" button logic and animations.
 * Routes users based on authentication status and role.
 */
function wireHeroCTA() {
    const CTA_ID = '#heroCTA';
    try {
        const cta = $w(CTA_ID);
        if (cta && typeof cta.onClick === 'function') {
            // Hover Animation: Subtle scale up
            cta.onMouseIn(() => {
                wixAnimations.timeline()
                    .add(cta, { scale: 1.05, duration: 200, easing: 'easeOutQuad' })
                    .play();
            });

            cta.onMouseOut(() => {
                wixAnimations.timeline()
                    .add(cta, { scale: 1.0, duration: 200, easing: 'easeInQuad' })
                    .play();
            });

            cta.onClick(async () => {
                const user = wixUsers.currentUser;

                if (user.loggedIn) {
                    try {
                        const role = await getUserRole();
                        // Route based on defined roles in backend/portal-auth
                        if (role === ROLES.DEFENDANT) {
                            wixLocation.to('/portal-defendant');
                        } else if (role === ROLES.INDEMNITOR || role === ROLES.COINDEMNITOR) {
                            wixLocation.to('/portal-indemnitor');
                        } else if (role === ROLES.STAFF || role === ROLES.ADMIN) {
                            wixLocation.to('/portal-staff');
                        } else {
                            // Default fallback for logged-in users
                            wixLocation.to('/start-bond');
                        }
                    } catch (roleError) {
                        console.error("Home CTA: Role fetch failed", roleError);
                        wixLocation.to('/start-bond');
                    }
                } else {
                    // Prompt for login then redirect to start bond
                    wixUsers.promptLogin({ mode: 'signup' })
                        .then(() => {
                            wixLocation.to('/start-bond');
                        })
                        .catch((err) => {
                            console.debug("Home CTA: Login prompt dismissed or failed", err);
                        });
                }
            });
        }
    } catch (err) {
        console.debug(`Home CTA: ${CTA_ID} not found, skipping wire-up.`);
    }
}

/**
 * Load counties into the dropdown selector and wire "Get Started" button
 */
async function loadCountySelector() {
    const DROPDOWN_ID = '#countyDropdown';
    const GET_STARTED_ID = '#getStartedButton';
    const ERROR_TEXT_ID = '#countyErrorText';
    
    try {
        // Check if county selector elements exist
        const dropdown = $w(DROPDOWN_ID);
        const getStartedBtn = $w(GET_STARTED_ID);
        
        if (!dropdown || !getStartedBtn) {
            console.debug('County selector elements not found on this page');
            return;
        }
        
        // Load all active counties from database
        const results = await wixData.query('FloridaCounties')
            .eq('active', true)
            .ascending('countyName')
            .find();
        
        if (results.items.length > 0) {
            // Populate dropdown with county options
            const options = results.items.map(county => ({
                label: `${county.countyName} County`,
                value: county.countySlug
            }));
            
            dropdown.options = options;
            
            // Set placeholder
            dropdown.placeholder = 'Select a county...';
            
            // Wire up "Get Started" button
            getStartedBtn.onClick(() => {
                const selectedSlug = dropdown.value;
                
                if (selectedSlug) {
                    // Navigate to county page
                    wixLocation.to(`/county/${selectedSlug}`);
                } else {
                    // Show error message
                    try {
                        const errorText = $w(ERROR_TEXT_ID);
                        if (errorText) {
                            errorText.text = 'Please select a county first';
                            errorText.show();
                            
                            // Hide error after 3 seconds
                            setTimeout(() => {
                                errorText.hide();
                            }, 3000);
                        }
                    } catch (err) {
                        console.debug('Error text element not found');
                    }
                }
            });
            
            // Add hover animation to Get Started button
            getStartedBtn.onMouseIn(() => {
                wixAnimations.timeline()
                    .add(getStartedBtn, { scale: 1.05, duration: 200, easing: 'easeOutQuad' })
                    .play();
            });
            
            getStartedBtn.onMouseOut(() => {
                wixAnimations.timeline()
                    .add(getStartedBtn, { scale: 1.0, duration: 200, easing: 'easeInQuad' })
                    .play();
            });
        }
        
    } catch (error) {
        console.error('Error loading county selector:', error);
    }
}
