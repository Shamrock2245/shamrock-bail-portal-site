// About Page
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixSeoFrontend from 'wix-seo-frontend';

$w.onReady(function () {
    console.log(" About Page Loading...");

    // Basic Navigation (if applicable). $w throws when the id is not on this layout.
    try {
        const startBtn = $w('#startBailProcessBtn');
        if (startBtn && startBtn.valid) startBtn.onClick(() => wixLocation.to('/portal-landing'));
    } catch (e) { /* #startBailProcessBtn not on this layout */ }

    return updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "About Shamrock Bail Bonds | Licensed Florida Bail Bond Agency";
    const pageDesc = "Shamrock Bail Bonds is a licensed Florida bail bond agency serving all 67 Florida counties from 1528 Broadway, Fort Myers, FL 33901, since 2012. Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7.";
    const pageUrl = "https://www.shamrockbailbonds.biz/about";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    // 1. Meta Tags
    
    

    

    // 2. Structured Data (One LocalBusiness block + BreadcrumbList via wix-seo-frontend)
    const schemas = [
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz",
            "telephone": "+1-239-332-2245",
            "founder": {
                "@type": "Person",
                "name": "Brendan O'Neal",
                "jobTitle": "Founder & Licensed Florida Bail Bond Agent",
                "url": "https://www.shamrockbailbonds.biz/about",
                "hasCredential": {
                    "@type": "EducationalOccupationalCredential",
                    "credentialCategory": "License",
                    "name": "Florida Bail Bond Agent License #P139768",
                    "recognizedBy": {
                        "@type": "GovernmentOrganization",
                        "name": "Florida Department of Financial Services"
                    }
                }
            },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "areaServed": {
                "@type": "State",
                "name": "Florida"
            },
            "openingHours": "Mo-Fr 09:00-17:00",
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
            },
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-2245",
                    "contactType": "customer service",
                    "areaServed": "FL",
                    "availableLanguage": ["en", "es"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00",
                        "closes": "23:59"
                    }
                },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-727-295-2245",
                    "contactType": "customer service",
                    "areaServed": "FL",
                    "availableLanguage": "es",
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00",
                        "closes": "23:59"
                    }
                }
            ],
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://www.youtube.com/@ShamrockBailBonds_FL",
                "https://www.linkedin.com/company/shamrock-bail-bonds-llc",
                "https://t.me/Shamrock_Bail_Bonds",
                "https://www.tiktok.com/@shamrockbailbonds",
                "https://www.yelp.com/biz/shamrock-bail-bonds-fort-myers"
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "About", "item": pageUrl }
            ]
        }
    ];

    try {
        const res = wixSeoFrontend.setStructuredData(schemas);
        if (res && typeof res.then === 'function') {
            return res.then(() => console.log("[OK] About Page SEO Set"))
                .catch(e => console.error("[X] About Page SEO Error", e));
        }
        return Promise.resolve();
    } catch (e) {
        const fallback = wixSeo.setStructuredData(schemas);
        if (fallback && typeof fallback.then === 'function') {
            return fallback
                .then(() => console.log("[OK] About Page SEO Set"))
                .catch(err => console.error("[X] About Page SEO Error", err));
        }
        return Promise.resolve();
    }
}
