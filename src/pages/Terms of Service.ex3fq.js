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

    wixSeo.setStructuredData([{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Terms of Service",
        "url": "https://www.shamrockbailbonds.biz/terms-of-service",
        "publisher": {
            "@type": "Organization",
            "name": "Shamrock Bail Bonds"
        }
    }]);
}
