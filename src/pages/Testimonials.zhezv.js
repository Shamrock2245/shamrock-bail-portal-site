import wixSeo from 'wix-seo';

$w.onReady(async function () {
    updatePageSEO();
});

async function updatePageSEO() {
    const pageTitle = "Client Reviews & Testimonials | Shamrock Bail Bonds Fort Myers";
    const pageDesc = "Read real client reviews about our 24/7 bail bond service in Fort Myers, Naples, and across all 67 Florida counties.";
    const pageUrl = "https://www.shamrockbailbonds.biz/testimonials";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    // 1. Meta Tags (Review-focused)
    
    

    

    // 3. Structured Data
    wixSeo.setStructuredData([
        // CollectionPage
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Shamrock Bail Bonds Client Reviews",
            "url": pageUrl,
            "description": pageDesc,
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".testimonial-text", "[data-hook='review-body']"]
            }
        },
        // LocalBusiness (no self-serving rating/review markup)
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Shamrock Bail Bonds, LLC",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": logoUrl,
            "image": logoUrl,
            "telephone": "+1-239-332-2245",
            "priceRange": "$$",
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
                    "availableLanguage": "es",
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00",
                        "closes": "23:59"
                    }
                }
            ],
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": 26.6406,
                "longitude": -81.8723
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://t.me/ShamrockBail_bot"
            ]
        },
        // Breadcrumb
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Reviews", "item": pageUrl }
            ]
        }
    ]);
}
