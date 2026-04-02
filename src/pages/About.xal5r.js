// About Page
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(function () {
    console.log(" About Page Loading...");

    // Basic Navigation (if applicable)
    const startBtn = $w('#startBailProcessBtn');
    if (startBtn.valid) startBtn.onClick(() => wixLocation.to('/portal-landing'));

    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "About Shamrock Bail Bonds | Licensed Florida Bail Bond Agency";
    const pageDesc = "Shamrock Bail Bonds is Southwest Florida's most trusted bail bond agency. Licensed, available 24/7, serving all 67 Florida counties from Fort Myers. Fast jail release with digital paperwork.";
    const pageUrl = "https://www.shamrockbailbonds.biz/about";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    // 1. Meta Tags (E-E-A-T optimized)
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": logoUrl },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": pageTitle },
        { "name": "twitter:description", "content": pageDesc },
        { "name": "robots", "content": "index, follow" },
        { "name": "keywords", "content": "about Shamrock Bail Bonds, Fort Myers bail bond agent, licensed bail bondsman Florida, 24/7 bail bonds Lee County" }
    ]);

    wixSeo.setLinks([
        { "rel": "canonical", "href": pageUrl }
    ]);

    // 2. Structured Data (Breadcrumb + AboutPage + LocalBusiness with openingHours)
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "About", "item": pageUrl }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": pageTitle,
            "url": pageUrl,
            "description": pageDesc,
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", "p"]
            },
            "mainEntity": {
                "@type": "LocalBusiness",
                "name": "Shamrock Bail Bonds, LLC",
                "@id": "https://www.shamrockbailbonds.biz/#organization",
                "image": logoUrl,
                "logo": {
                    "@type": "ImageObject",
                    "url": logoUrl
                },
                "telephone": "+1-239-332-2245",
                "url": "https://www.shamrockbailbonds.biz/",
                "priceRange": "$$",
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                },
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
                "areaServed": [
                    { "@type": "State", "name": "Florida" },
                    { "@type": "AdministrativeArea", "name": "Lee County" },
                    { "@type": "AdministrativeArea", "name": "Collier County" },
                    { "@type": "AdministrativeArea", "name": "Charlotte County" },
                    { "@type": "AdministrativeArea", "name": "Hendry County" },
                    { "@type": "AdministrativeArea", "name": "DeSoto County" },
                    { "@type": "AdministrativeArea", "name": "Manatee County" },
                    { "@type": "AdministrativeArea", "name": "Sarasota County" }
                ],
                "sameAs": [
                    "https://www.facebook.com/ShamrockBail",
                    "https://www.instagram.com/shamrock_bail_bonds",
                    "https://t.me/ShamrockBail_bot"
                ],
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "bestRating": "5",
                    "reviewCount": "150"
                },
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Bail Bond Services",
                    "itemListElement": [
                        {
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": "Surety Bail Bonds",
                                "description": "10% premium bail bonds for all Florida counties"
                            }
                        },
                        {
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": "Federal Bail Bonds",
                                "description": "Specialized federal bail bond services"
                            }
                        },
                        {
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": "Immigration Bail Bonds",
                                "description": "Detention and immigration bond services"
                            }
                        }
                    ]
                }
            }
        },
        // FAQPage — AI citation targets for company queries
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Is Shamrock Bail Bonds a licensed agency?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Shamrock Bail Bonds LLC is a fully licensed bail bond agency regulated by the Florida Department of Financial Services under FL Statute 648. We have been continuously licensed and operating from Fort Myers, Florida since 2012."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What counties does Shamrock Bail Bonds serve?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Shamrock Bail Bonds serves all 67 Florida counties. Our office is located in Fort Myers (Lee County), and we specialize in Southwest Florida counties including Lee, Collier, Charlotte, Hendry, DeSoto, Manatee, and Sarasota. We handle bonds statewide with a $125 transfer fee for counties outside Lee and Charlotte, waived for bonds over $25,000."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Is Shamrock Bail Bonds available 24/7?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Shamrock Bail Bonds operates 24 hours a day, 7 days a week, 365 days a year — including holidays. Call (239) 332-2245 any time. After hours, our AI assistant Shannon can start your paperwork immediately, or you can use our online portal or Telegram bot for instant service."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Does Shamrock Bail Bonds offer bilingual service?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Shamrock Bail Bonds provides full bilingual service in English and Spanish. Our Spanish-language line is (239) 955-0301. Our website, digital paperwork, and AI assistant all support Spanish-speaking clients."
                    }
                }
            ]
        }
    ])
        .then(() => console.log("[OK] About Page SEO Set"))
        .catch(e => console.error("[X] About Page SEO Error", e));
}
