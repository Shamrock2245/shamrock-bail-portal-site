/**
 * Dynamic County Page - FloridaCounties (Item)
 * 
 * This page dynamically generates county-specific bail bond information
 * for all 67 Florida counties. It pulls data from the FloridaCounties
 * collection and uses the county-generator backend to populate content.
 * 
 * URL Pattern: /county/{slug}
 * Example: /county/lee, /county/collier, /county/miami-dade
 * 
 * Element IDs Expected (ensure these exist in Wix Editor):
 * - #countyHeroTitle - Main hero headline
 * - #countyHeroSubtitle - Hero subheadline
 * - #countyCallButton - Primary CTA button (Call Now)
 * - #countyStartBailButton - Secondary CTA button (Start Bail)
 * - #aboutCountyText - About the county section
 * - #whyChooseUsText - Why choose Shamrock section
 * - #howItWorksText - How the bail process works
 * - #serviceAreasText - Service areas covered
 * - #jailNameText - Jail facility name
 * - #jailPhoneText - Jail booking phone
 * - #jailBookingLink - Link to jail booking search
 * - #clerkNameText - Clerk of Court name
 * - #clerkPhoneText - Clerk phone number
 * - #clerkWebsiteLink - Link to clerk website
 * - #sheriffNameText - Sheriff's office name
 * - #sheriffWebsiteLink - Link to sheriff website
 * - #faqRepeater - Repeater for FAQ items
 * - #errorContainer - Error message container
 * - #loadingSpinner - Loading indicator
 */

import { generateCountyPage } from 'backend/county-generator';
import wixLocation from 'wix-location';
import wixSeoFrontend from 'wix-seo-frontend';
import wixAnimations from 'wix-animations';

$w.onReady(async function () {
    // Show loading state
    showLoading();
    
    try {
        // Get the county slug from the URL path
        const path = wixLocation.path;
        const countySlug = path.length > 0 ? path[0] : null;
        
        if (!countySlug) {
            showError('Invalid county URL. Please select a county from our directory.');
            return;
        }
        
        // Fetch county data from backend
        const result = await generateCountyPage(countySlug);
        
        if (!result.success) {
            showError(`Unable to load information for this county. Please call us at (239) 332-2245 for assistance.`);
            console.error('County page generation failed:', result.error);
            return;
        }
        
        const countyData = result.data;
        
        // Populate the page with county data
        populateCountyPage(countyData);
        
        // Set SEO metadata
        setSEOMetadata(countyData.seo);
        
        // Wire up interactive elements
        wireInteractiveElements(countyData);
        
        // Hide loading, show content with animation
        hideLoading();
        animatePageEntrance();
        
    } catch (error) {
        console.error('Error loading county page:', error);
        showError('An unexpected error occurred. Please call us at (239) 332-2245 for assistance.');
    }
});

/**
 * Populate all page elements with county data
 */
function populateCountyPage(data) {
    const content = data.content;
    
    // Hero Section
    safeSetText('#countyHeroTitle', content.hero_headline);
    safeSetText('#countyHeroSubtitle', content.hero_subheadline);
    safeSetText('#countyCallButton', content.hero_cta_primary);
    safeSetText('#countyStartBailButton', content.hero_cta_secondary);
    
    // About Section
    safeSetText('#aboutCountyText', content.about_county);
    safeSetText('#whyChooseUsText', content.why_choose_us);
    safeSetText('#howItWorksText', content.how_it_works);
    safeSetText('#serviceAreasText', content.service_areas);
    
    // Jail Information
    safeSetText('#jailNameText', data.jail.name);
    safeSetText('#jailPhoneText', data.jail.booking_phone);
    safeSetLink('#jailBookingLink', data.jail.booking_url, 'Search Jail Roster');
    
    // Clerk of Court Information
    safeSetText('#clerkNameText', data.clerk.name);
    safeSetText('#clerkPhoneText', data.clerk.phone);
    safeSetLink('#clerkWebsiteLink', data.clerk.website, 'Visit Clerk Website');
    
    // Sheriff's Office Information
    safeSetText('#sheriffNameText', data.sheriff.name);
    safeSetLink('#sheriffWebsiteLink', data.sheriff.website, 'Visit Sheriff Website');
    
    // FAQ Section
    populateFAQ(content.faq);
}

/**
 * Populate FAQ repeater with questions and answers
 */
function populateFAQ(faqItems) {
    try {
        if (!$w('#faqRepeater')) {
            console.warn('FAQ repeater not found');
            return;
        }
        
        $w('#faqRepeater').data = faqItems;
        
        $w('#faqRepeater').onItemReady(($item, itemData, index) => {
            $item('#faqQuestion').text = itemData.question;
            $item('#faqAnswer').text = itemData.answer;
            
            // Optional: Add expand/collapse functionality
            $item('#faqAnswer').collapse();
            $item('#faqQuestion').onClick(() => {
                $item('#faqAnswer').expanded ? $item('#faqAnswer').collapse() : $item('#faqAnswer').expand();
            });
        });
    } catch (error) {
        console.warn('Error populating FAQ:', error);
    }
}

/**
 * Set SEO metadata for the page
 */
function setSEOMetadata(seo) {
    try {
        wixSeoFrontend.setTitle(seo.meta_title);
        wixSeoFrontend.setDescription(seo.meta_description);
        wixSeoFrontend.setKeywords(seo.keywords);
        
        // Set structured data for local business
        wixSeoFrontend.setStructuredData([{
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Shamrock Bail Bonds",
            "description": seo.meta_description,
            "url": `https://shamrockbailbonds.biz${seo.canonical_url}`
        }]);
    } catch (error) {
        console.warn('Error setting SEO metadata:', error);
    }
}

/**
 * Wire up interactive elements (buttons, links)
 */
function wireInteractiveElements(data) {
    const phone = data.contact.primary_phone;
    const phoneDisplay = data.contact.primary_phone_display;
    
    // Call button
    try {
        if ($w('#countyCallButton')) {
            $w('#countyCallButton').link = `tel:${phone}`;
            $w('#countyCallButton').onClick(() => {
                // Track call click
                console.log('Call button clicked:', phone);
            });
        }
    } catch (error) {
        console.warn('Error wiring call button:', error);
    }
    
    // Start Bail button
    try {
        if ($w('#countyStartBailButton')) {
            $w('#countyStartBailButton').onClick(() => {
                wixLocation.to('/portal-landing');
            });
        }
    } catch (error) {
        console.warn('Error wiring start bail button:', error);
    }
    
    // Jail phone link
    try {
        if ($w('#jailPhoneText')) {
            $w('#jailPhoneText').link = `tel:${data.jail.booking_phone}`;
        }
    } catch (error) {
        console.warn('Error wiring jail phone:', error);
    }
    
    // Clerk phone link
    try {
        if ($w('#clerkPhoneText')) {
            $w('#clerkPhoneText').link = `tel:${data.clerk.phone}`;
        }
    } catch (error) {
        console.warn('Error wiring clerk phone:', error);
    }
}

/**
 * Animate page entrance for premium feel
 */
function animatePageEntrance() {
    const elementsToAnimate = [
        '#countyHeroTitle',
        '#countyHeroSubtitle',
        '#countyCallButton',
        '#countyStartBailButton'
    ];
    
    elementsToAnimate.forEach((selector, index) => {
        try {
            const element = $w(selector);
            if (element && typeof element.show === 'function') {
                wixAnimations.timeline()
                    .add(element, { opacity: 0, y: 20, duration: 0 })
                    .add(element, {
                        opacity: 1,
                        y: 0,
                        duration: 800,
                        delay: index * 150,
                        easing: 'easeOutCubic'
                    })
                    .play();
            }
        } catch (error) {
            // Silently skip if element doesn't exist
        }
    });
}

/**
 * Show loading state
 */
function showLoading() {
    try {
        if ($w('#loadingSpinner')) {
            $w('#loadingSpinner').show();
        }
        if ($w('#errorContainer')) {
            $w('#errorContainer').hide();
        }
    } catch (error) {
        console.warn('Error showing loading state:', error);
    }
}

/**
 * Hide loading state
 */
function hideLoading() {
    try {
        if ($w('#loadingSpinner')) {
            $w('#loadingSpinner').hide();
        }
    } catch (error) {
        console.warn('Error hiding loading state:', error);
    }
}

/**
 * Show error message
 */
function showError(message) {
    hideLoading();
    
    try {
        if ($w('#errorContainer')) {
            $w('#errorContainer').show();
        }
        if ($w('#errorMessage')) {
            $w('#errorMessage').text = message;
        }
    } catch (error) {
        console.error('Error showing error message:', error);
    }
}

/**
 * Safely set text on an element (defensive programming)
 */
function safeSetText(selector, text) {
    try {
        const element = $w(selector);
        if (element && text) {
            element.text = text;
        }
    } catch (error) {
        console.warn(`Element ${selector} not found or error setting text:`, error);
    }
}

/**
 * Safely set link on an element
 */
function safeSetLink(selector, url, text) {
    try {
        const element = $w(selector);
        if (element && url) {
            element.link = url;
            if (text) {
                element.text = text;
            }
        }
    } catch (error) {
        console.warn(`Element ${selector} not found or error setting link:`, error);
    }
}
