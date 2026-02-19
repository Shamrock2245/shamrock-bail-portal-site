import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(function () {
    console.log("📄 Terms of Service Loaded");

    // Optional: Print Functionality
    const printBtn = $w('#printTermsBtn');
    if (printBtn.valid) {
        printBtn.onClick(() => {
            wixWindow.print();
        });
    }

    // Optional: Back to Home
    const backBtn = $w('#backHomeBtn');
    if (backBtn.valid) {
        backBtn.onClick(() => {
            wixLocation.to('/');
        });
    }

    updatePageSEO();
});

function updatePageSEO() {
    wixSeo.setTitle("Terms of Service | Shamrock Bail Bonds");
    wixSeo.setMetaTags([
        { "name": "description", "content": "Terms of Service for Shamrock Bail Bonds. Understand our service agreement, bond conditions, and user responsibilities." },
        { "property": "og:title", "content": "Terms of Service | Shamrock Bail Bonds" }
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
                    "name": "Terms of Service",
                    "item": "https://www.shamrockbailbonds.biz/terms-of-service"
                }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms of Service",
            "url": "https://www.shamrockbailbonds.biz/terms-of-service",
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
