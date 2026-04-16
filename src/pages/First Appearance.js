import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixSeo from 'wix-seo';

$w.onReady(function () {
    console.log(" First Appearance Page Loading...");

    // 1. Setup Buttons
    const startBtn = $w('#startBailProcessBtn');
    if (startBtn.valid) startBtn.onClick(() => wixLocation.to('/portal-landing'));

    const bottomOnline = $w('#bottomOnlineBtn');
    if (bottomOnline.valid) bottomOnline.onClick(() => wixLocation.to('/portal-landing'));

    const bottomCall = $w('#bottomCallBtn');
    if (bottomCall.valid) bottomCall.onClick(() => wixLocation.to('tel:12393322245')); // Real Shamrock number

    // 2. Setup SEO
    setupSEO();
});

function setupSEO() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is a First Appearance Hearing in Florida?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A First Appearance Hearing is a court proceeding where a judge informs the defendant of their charges, advises them of their rights, determines if there is probable cause for the arrest, and sets bail and conditions of release. It must occur within 24 hours of arrest."
                }
            },
            {
                "@type": "Question",
                "name": "Is a First Appearance the same as a trial?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. A First Appearance is not a trial. The judge will not decide guilt or innocence, and defendants should not argue the facts of their case during this hearing."
                }
            },
            {
                "@type": "Question",
                "name": "How is bail determined at a First Appearance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Judges consider the severity of the charges, the defendant's criminal history, their ties to the community, and the potential danger they pose to the public when setting bail."
                }
            }
        ]
    };

    const breadcrumbSchema = {
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
                "name": "First Appearance",
                "item": "https://www.shamrockbailbonds.biz/first-appearance"
            }
        ]
    };

    wixSeo.setStructuredData([faqSchema, breadcrumbSchema])
        .then(() => console.log("SEO: Structured Data Set Successfully"))
        .catch(err => console.error("SEO: Failed to set structured data", err));
}
