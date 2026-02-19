// About Page
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(function () {
    console.log("🚀 About Page Loading...");

    // Basic Navigation (if applicable)
    const startBtn = $w('#startBailProcessBtn');
    if (startBtn.valid) startBtn.onClick(() => wixLocation.to('/portal-landing'));

    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "About Shamrock Bail Bonds | 24/7 Bail Bonds in Florida";
    const pageDesc = "Learn about Shamrock Bail Bonds, serving Southwest Florida. Fast, confidential, and professional bail bond services in Lee, Collier, and Charlotte counties.";
    const pageUrl = "https://www.shamrockbailbonds.biz/about";

    // 1. Meta Tags
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": "https://www.shamrockbailbonds.biz/logo.png" }
    ]);

    // 2. Structured Data (Breadcrumb + AboutPage + LocalBusiness)
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://www.shamrockbailbonds.biz/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "About",
                    "item": pageUrl
                }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "mainEntity": {
                "@type": "LocalBusiness",
                "name": "Shamrock Bail Bonds, LLC",
                "image": "https://www.shamrockbailbonds.biz/logo.png",
                "telephone": "+12393322245",
                "url": "https://www.shamrockbailbonds.biz/",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "1528 Broadway",
                    "addressLocality": "Fort Myers",
                    "addressRegion": "FL",
                    "postalCode": "33901",
                    "addressCountry": "US"
                },
                "areaServed": [
                    { "@type": "AdministrativeArea", "name": "Lee County" },
                    { "@type": "AdministrativeArea", "name": "Collier County" },
                    { "@type": "AdministrativeArea", "name": "Charlotte County" }
                ],
                "sameAs": [
                    "https://www.facebook.com/ShamrockBail",
                    "https://www.instagram.com/shamrock_bail_bonds"
                ]
            }
        }
    ])
        .then(() => console.log("✅ About Page SEO Set"))
        .catch(e => console.error("❌ About Page SEO Error", e));
}
