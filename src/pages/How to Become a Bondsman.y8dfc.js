// Bail School (How to Become a Bondsman)
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(function () {
    console.log("🚀 Bail School Page Loaded...");

    // Basic Navigation Handlers (matches other pages)
    const startBtn = $w('#startBailProcessBtn');
    if (startBtn.valid) startBtn.onClick(() => wixLocation.to('/portal-landing'));

    const contactBtn = $w('#contactUsBtn');
    if (contactBtn.valid) contactBtn.onClick(() => wixLocation.to('/contact'));

    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "How to Become a Bail Bondsman in Florida | Shamrock Bail Bonds";
    const pageDesc = "Step-by-step guide to becoming a licensed bail bond agent in FL. Covers the 120-hour course, state exam, and internship requirements.";
    const pageUrl = "https://www.shamrockbailbonds.biz/how-to-become-a-bondsman";

    // 1. Meta Tags
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "article" }
    ]);

    // 2. Structured Data (Breadcrumb + HowTo)
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
                    "name": "Bail School",
                    "item": pageUrl
                }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Become a Licensed Bail Bondsman in Florida",
            "description": "A complete guide to the requirements and steps for obtaining a Limited Surety Agent license in Florida.",
            "step": [
                {
                    "@type": "HowToStep",
                    "name": "Complete the 120-Hour Course",
                    "text": "Enroll in and pass a state-approved 120-hour cryptic qualification course for bail bond agents.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "name": "Pass the State Exam",
                    "text": "Register for and pass the Florida Department of Financial Services bail bond agent examination.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "name": "Background Check & Fingerprinting",
                    "text": "Submit fingerprints for a criminal background check to ensure you meet moral character requirements.",
                    "url": pageUrl
                },
                {
                    "@type": "HowToStep",
                    "name": "Secure Employment & Internship",
                    "text": "Find a supervising bail bond agency (like Shamrock) to sponsor your 1-year internship before full licensure.",
                    "url": pageUrl
                }
            ]
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
    ])
        .then(() => console.log("✅ Bail School SEO Set"))
        .catch(e => console.error("❌ Bail School SEO Error", e));
}
