import wixSeo from 'wix-seo';

$w.onReady(function () {
    updatePageSEO();
});

function updatePageSEO() {
    wixSeo.setTitle("Privacy Policy | Shamrock Bail Bonds");
    wixSeo.setMetaTags([
        { "name": "description", "content": "Privacy Policy for Shamrock Bail Bonds. Learn how we handle your data, ensure confidentiality, and protect your rights." },
        { "property": "og:title", "content": "Privacy Policy | Shamrock Bail Bonds" },
        { "property": "og:type", "content": "website" }
    ]);

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
                    "name": "Privacy Policy",
                    "item": "https://www.shamrockbailbonds.biz/privacy-policy"
                }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy",
            "url": "https://www.shamrockbailbonds.biz/privacy-policy",
            "publisher": {
                "@type": "Organization",
                "name": "Shamrock Bail Bonds"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "image": "https://www.shamrockbailbonds.biz/logo.png",
            "description": "Florida's most responsive and reliable bail bond service, offering 24/7 assistance across the state.",
            "telephone": "+1-239-332-2245",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds"
            ]
        }
    ]);
}
