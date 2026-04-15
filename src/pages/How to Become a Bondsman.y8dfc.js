// How to Become a Bondsman (Bail School) — SEO-Enhanced
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(function () {
    // Navigation handlers
    try {
        const startBtn = $w('#startBailProcessBtn');
        if (startBtn && startBtn.id) startBtn.onClick(() => wixLocation.to('/portal-landing'));
    } catch (e) { /* non-fatal */ }

    try {
        const contactBtn = $w('#contactUsBtn');
        if (contactBtn && contactBtn.id) contactBtn.onClick(() => wixLocation.to('/contact'));
    } catch (e) { /* non-fatal */ }

    setupPageMeta();
    setTimeout(() => { setupStructuredData(); }, 0);
});

function setupPageMeta() {
    const pageTitle = 'How to Become a Bail Bondsman in Florida | Shamrock Bail Bonds';
    const pageDesc = 'Complete guide to becoming a licensed bail bond agent in Florida. Covers the 120-hour pre-licensing course, state exam, background check, fingerprinting, and 1-year internship requirements under FL Statute 648.';
    const pageUrl = 'https://www.shamrockbailbonds.biz/how-to-become-a-bondsman';

    wixSeo.setTitle(pageTitle);
    wixSeo.setLinks([{ rel: 'canonical', href: pageUrl }]);
    wixSeo.setMetaTags([
        { name: 'description', content: pageDesc },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'keywords', content: 'how to become bail bondsman Florida, bail bond agent license FL, 120 hour bail bond course, Florida bail bond exam, limited surety agent license, bail bond career Florida, bail bondsman requirements' },
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDesc },
        { property: 'og:url', content: pageUrl },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: 'https://www.shamrockbailbonds.biz/logo.png' },
        { property: 'og:site_name', content: 'Shamrock Bail Bonds, LLC' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDesc }
    ]);
}

function setupStructuredData() {
    const pageUrl = 'https://www.shamrockbailbonds.biz/how-to-become-a-bondsman';

    wixSeo.setStructuredData([
        // Breadcrumb
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Bail School", "item": "https://www.shamrockbailbonds.biz/bail-school" },
                { "@type": "ListItem", "position": 3, "name": "How to Become a Bondsman", "item": pageUrl }
            ]
        },
        // HowTo Schema — rich snippet eligible
        {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Become a Licensed Bail Bondsman in Florida",
            "description": "A complete guide to the requirements and steps for obtaining a Limited Surety Agent (bail bond agent) license in the state of Florida, per FL Statute 648.",
            "isPartOf": {
                "@type": "EducationalOrganization",
                "@id": "https://www.shamrockbailbonds.biz/bail-school#school",
                "name": "Shamrock Bail School"
            },
            "totalTime": "P6M",
            "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "USD",
                "value": "1500"
            },
            "supply": [
                { "@type": "HowToSupply", "name": "Florida driver's license or state ID" },
                { "@type": "HowToSupply", "name": "Fingerprint card (electronic submission)" },
                { "@type": "HowToSupply", "name": "Application fee ($63.75 to FL DFS)" }
            ],
            "tool": [
                { "@type": "HowToTool", "name": "State-approved 120-hour pre-licensing course" },
                { "@type": "HowToTool", "name": "Sponsoring bail bond agency" }
            ],
            "step": [
                {
                    "@type": "HowToStep",
                    "position": 1,
                    "name": "Complete the 120-Hour Pre-Licensing Course",
                    "text": "Enroll in and pass a state-approved 120-hour pre-licensing course covering Florida bail bond law, criminal justice procedures, and insurance regulations.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "position": 2,
                    "name": "Pass the Florida State Exam",
                    "text": "Register for and pass the Florida Department of Financial Services bail bond agent examination. The exam covers FL Statutes 648 and 903, bail bond procedures, and ethics.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "position": 3,
                    "name": "Complete Background Check & Fingerprinting",
                    "text": "Submit electronic fingerprints for a Level 2 criminal background check through the Florida Department of Law Enforcement (FDLE) to verify moral character requirements.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "position": 4,
                    "name": "Find a Sponsoring Agency & Complete Internship",
                    "text": "Secure sponsorship from a licensed bail bond agency like Shamrock Bail Bonds to complete the required 1-year temporary license period under supervision before receiving full licensure.",
                    "url": pageUrl
                }
            ],
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".step-content", ".requirements-section"]
            }
        },
        // LocalBusiness with full enhancement
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "image": "https://www.shamrockbailbonds.biz/logo.png",
            "description": "Professional 24/7 bail bond services throughout Florida since 2012. Also offering bail bond agent training and internship opportunities.",
            "telephone": "+1-239-332-2245",
            "priceRange": "$$",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": { "@type": "GeoCoordinates", "latitude": "26.6406", "longitude": "-81.8723" },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00", "closes": "23:59"
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://t.me/ShamrockBail_bot"
            ]
        }
    ]).catch(function(e) { console.error('[SEO] Bail School schema error:', e); });
}
