/**
 * Shamrock Bail Bonds - Mobile-Optimized County Page
 * Enhanced version of FloridaCounties (Item).kyk1r.js
 * 
 * This builds on the existing code with mobile-first enhancements
 * matching the Figma design prototype.
 * 
 * USAGE: Replace the code in FloridaCounties (Item) page in Wix Editor
 */

import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCountyBySlug } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Mobile-Optimized County Page Loading...");

    // 1. Extract Slug from URL
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log("📍 Extracted Slug:", countySlug);

    if (!countySlug) {
        console.error("❌ No slug found in URL");
        setText('#countyName', "County Not Found");
        return;
    }

    try {
        // 2. Fetch County Data
        const county = await getCountyBySlug(countySlug);

        if (!county) {
            console.error("❌ County data not found for slug:", countySlug);
            setText('#countyName', "County Data Not Found");
            return;
        }

        console.log("✅ County Data Loaded:", county.name);

        // 3. Populate Page Elements with Mobile-First Design
        populateHeroSection(county);
        populateQuickReferenceCard(county);
        populateAboutSection(county);
        populateWhyChooseSection(county);
        populateProcessSection(county);
        populateFAQSection(county);
        populateFinalCTA(county);

        // 4. Setup Event Listeners
        setupEventListeners(county);

        // 5. Update SEO Tags
        updateSEO(county);

    } catch (error) {
        console.error("❌ Error initializing page:", error);
    }
});

/**
 * Populate Hero Section
 */
function populateHeroSection(county) {
    const phone = county.primaryPhone || "(239) 332-2245";
    const city = county.countySeat || "the area";

    // Hero Title
    setText('#dynamicHeader', `Bail Bonds in ${county.name} County, Florida`);
    
    // Hero Subtitle
    setText('#heroSubtitle', 
        `Fast, Professional Bail Bond Services Available 24/7 in ${city} and Throughout ${county.name} County`
    );

    // Call Button
    const callBtn = $w('#callCountiesBtn');
    if (callBtn.valid) {
        callBtn.label = `Call ${phone}`;
        callBtn.onClick(() => wixLocation.to(`tel:${phone.replace(/[^0-9]/g, '')}`));
    }

    // Start Bail Button
    const startBtn = $w('#startBailBtn');
    if (startBtn.valid) {
        startBtn.label = "Start Bail Process";
        startBtn.onClick(() => wixLocation.to('/members/start-bail'));
    }
}

/**
 * Populate Quick Reference Card (2x2 Grid)
 */
function populateQuickReferenceCard(county) {
    // Section Header
    setText('#quickRefHeader', `${county.name} County Quick Reference`);

    // Sheriff's Office (Top Left)
    setText('#sheriffTitle', "Sheriff's Office");
    setText('#sheriffPhone', county.jailPhone || county.primaryPhone || "(239) 477-1000");
    setLink('#sheriffWebsite', county.sheriffWebsite || county.jailBookingUrl, "Visit Sheriff's Website");

    // Main Jail (Top Right)
    setText('#jailName', county.jailName || `${county.name} County Main Jail`);
    setText('#jailAddress', county.jailAddress || "Address not available");
    setLink('#inmateSearchBtn', county.jailBookingUrl, "Inmate Search");

    // Clerk of Court (Bottom Left)
    setText('#clerkTitle', "Clerk of Court");
    setText('#clerkPhone', county.clerkPhone || "(239) 533-5000");
    setLink('#clerkWebsite', county.clerkWebsite, "Visit Clerk's Website");

    // County Information (Bottom Right)
    setText('#countyInfoTitle', "County Information");
    setText('#countySeat', county.countySeat ? `County Seat: ${county.countySeat}` : "");
    setText('#countyPopulation', county.population ? `Population: ${county.population.toLocaleString()}` : "");
}

/**
 * Populate About Section
 */
function populateAboutSection(county) {
    const city = county.countySeat || "the area";
    const jailName = county.jailName || `${county.name} County Main Jail`;

    setText('#aboutHeader', `About Bail Bonds in ${county.name} County`);

    const aboutText = `Shamrock Bail Bonds provides fast, professional bail bond services throughout ${county.name} County, including ${city} and all surrounding communities. When someone you care about is arrested and taken to ${jailName}, time is critical. Our experienced agents are available 24 hours a day, 7 days a week to help secure their release as quickly as possible.

With over 10 years of experience serving Florida families, we understand the stress and urgency of your situation. We handle all the paperwork, coordinate directly with ${jailName}, and guide you through every step of the bail process with compassion and professionalism.`;

    setText('#aboutBody', aboutText);
}

/**
 * Populate Why Choose Us Section
 */
function populateWhyChooseSection(county) {
    setText('#whyChooseHeader', `Why Choose Shamrock Bail Bonds in ${county.name} County`);

    // Features are typically static, but can be populated dynamically if needed
    // The HTML structure should have these elements pre-built in Wix Editor
}

/**
 * Populate Process Section
 */
function populateProcessSection(county) {
    const phone = county.primaryPhone || "(239) 332-2245";
    const jailName = county.jailName || `${county.name} County Main Jail`;

    setText('#processHeader', `How the Bail Process Works in ${county.name} County`);

    // Step 1
    setText('#step1Title', "Call Us Immediately");
    setText('#step1Description', 
        `Contact us at ${phone} any time. We'll gather information and start the process right away.`
    );

    // Step 2
    setText('#step2Title', "We Post Bail");
    setText('#step2Description', 
        `Our licensed agent coordinates with ${jailName} to post bail and complete all necessary paperwork.`
    );

    // Step 3
    setText('#step3Title', "They're Released");
    setText('#step3Description', 
        "Release typically happens within 2-4 hours. We'll explain all court dates and requirements."
    );
}

/**
 * Populate FAQ Section
 */
function populateFAQSection(county) {
    setText('#faqHeader', "Frequently Asked Questions");

    // FAQ items should be pre-built in Wix Editor with collapsible functionality
    // Add click handlers for accordion behavior
    setupFAQAccordion();
}

/**
 * Setup FAQ Accordion Behavior
 */
function setupFAQAccordion() {
    const faqItems = ['#faq1', '#faq2', '#faq3', '#faq4', '#faq5'];
    
    faqItems.forEach(selector => {
        const item = $w(selector);
        if (item.valid) {
            item.onClick(() => {
                item.toggleClass('active');
            });
        }
    });
}

/**
 * Populate Final CTA Section
 */
function populateFinalCTA(county) {
    const phone = county.primaryPhone || "(239) 332-2245";
    const jailName = county.jailName || `${county.name} County Main Jail`;

    setText('#finalCtaTitle', `Need Bail Bonds in ${county.name} County Right Now?`);
    setText('#finalCtaSubtitle', 
        `We're standing by 24/7 to help you or your loved one get released from ${jailName}.`
    );

    const finalBtn = $w('#finalCallBtn');
    if (finalBtn.valid) {
        finalBtn.label = `Call ${phone} Now`;
        finalBtn.onClick(() => wixLocation.to(`tel:${phone.replace(/[^0-9]/g, '')}`));
    }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners(county) {
    const phone = county.primaryPhone || "(239) 332-2245";

    // All phone links
    const phoneElements = ['#sheriffPhone', '#clerkPhone'];
    phoneElements.forEach(selector => {
        const el = $w(selector);
        if (el.valid) {
            el.onClick(() => {
                const phoneNumber = el.text.replace(/[^0-9]/g, '');
                wixLocation.to(`tel:${phoneNumber}`);
            });
        }
    });

    // Track analytics events
    trackPageView(county);
}

/**
 * Update SEO Tags
 */
function updateSEO(county) {
    const phone = county.primaryPhone || "(239) 332-2245";
    const city = county.countySeat || county.name;

    wixSeo.setTitle(`${county.name} County Bail Bonds | 24/7 Fast Release | Shamrock Bail Bonds`);
    
    wixSeo.setMetaTags([
        {
            "name": "description",
            "content": `24/7 Bail Bonds in ${county.name} County, Florida. Serving ${city} and surrounding areas. Call ${phone} for immediate release. Fast, confidential, professional service.`
        },
        {
            "property": "og:title",
            "content": `${county.name} County Bail Bonds | Shamrock Bail Bonds`
        },
        {
            "property": "og:description",
            "content": `Fast 24/7 bail bond services in ${county.name} County. Call ${phone} now.`
        },
        {
            "property": "og:type",
            "content": "website"
        }
    ]);

    // Structured Data for Local Business
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Shamrock Bail Bonds - ${county.name} County`,
        "description": `24/7 Bail Bond Services in ${county.name} County, Florida`,
        "telephone": phone,
        "areaServed": {
            "@type": "City",
            "name": city,
            "containedIn": {
                "@type": "State",
                "name": "Florida"
            }
        },
        "priceRange": "$$"
    };

    wixSeo.setStructuredData([structuredData]);
}

/**
 * Track Page View for Analytics
 */
function trackPageView(county) {
    console.log(`📊 Page View: ${county.name} County`);
    // Add analytics tracking here if needed
    // Example: Google Analytics, Facebook Pixel, etc.
}

/**
 * Helper: Safely set text
 */
function setText(selector, value) {
    const el = $w(selector);
    if (el.valid) {
        el.text = value || "";
        el.show();
    } else {
        console.warn(`⚠️ Element ${selector} not found on page.`);
    }
}

/**
 * Helper: Safely set link
 */
function setLink(selector, url, label) {
    const el = $w(selector);
    if (el.valid) {
        if (url) {
            if (el.type === '$w.Button') {
                el.label = label;
                el.link = url;
                el.target = "_blank";
            } else {
                el.text = label;
                el.onClick(() => wixLocation.to(url));
            }
            el.show();
        } else {
            el.hide();
        }
    }
}
